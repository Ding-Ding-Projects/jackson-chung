import {readFileSync,readdirSync} from 'node:fs';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {unzipSync} from 'fflate';

const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const crcTable=Uint32Array.from({length:256},(_,value)=>{for(let i=0;i<8;i++)value=(value&1)?0xedb88320^(value>>>1):value>>>1;return value>>>0;});
function crc32(bytes){let value=0xffffffff;for(const byte of bytes)value=crcTable[(value^byte)&255]^(value>>>8);return (value^0xffffffff)>>>0;}
function safeName(name){return name&&!name.startsWith('/')&&!name.includes('\\')&&!name.includes(':')&&!name.includes('\0')&&!name.split('/').some(part=>part==='..'||part==='.agent'||part==='node_modules');}

export function capturePayload(directory){
 const files=[];
 function walk(current){for(const item of readdirSync(current,{withFileTypes:true})){const path=join(current,item.name);if(item.isSymbolicLink())throw Error('Package source must not contain symbolic links.');if(item.isDirectory())walk(path);else if(item.isFile()){const name=relative(directory,path).replaceAll('\\','/');if(!safeName(name))throw Error('Unsafe package source path.');const bytes=readFileSync(path);files.push({name,bytes:bytes.length,sha256:sha256(bytes)});}}}
 walk(directory);return files;
}

export function verifyPackagePayload(bytes,expected){
 if(!(bytes instanceof Uint8Array)||bytes.length<22||bytes.length>1536*1024*1024)throw Error('Package byte boundary exceeded.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
 if(end<0||view.getUint16(end+4,true)!==0||view.getUint16(end+6,true)!==0)throw Error('Unsupported package archive.');
 const count=view.getUint16(end+10,true),centralSize=view.getUint32(end+12,true),centralOffset=view.getUint32(end+16,true);
 if(!count||count===65535||count>30000||centralOffset+centralSize!==end)throw Error('Unsupported package directory.');
 const entries=new Map();let offset=centralOffset,total=0;
 for(let i=0;i<count;i++){
  if(offset+46>end||view.getUint32(offset,true)!==0x02014b50)throw Error('Malformed package directory.');
  const flags=view.getUint16(offset+8,true),method=view.getUint16(offset+10,true),crc=view.getUint32(offset+16,true),size=view.getUint32(offset+24,true);
  const nameSize=view.getUint16(offset+28,true),extraSize=view.getUint16(offset+30,true),commentSize=view.getUint16(offset+32,true);
  if(flags&1||![0,8].includes(method)||size===0xffffffff||offset+46+nameSize+extraSize+commentSize>end)throw Error('Unsupported package entry.');
  const name=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(offset+46,offset+46+nameSize));
  if(!safeName(name)||entries.has(name.toLowerCase()))throw Error('Unsafe or duplicate package entry.');
  total+=size;if(total>2*1024*1024*1024)throw Error('Package expands beyond the supported boundary.');
  entries.set(name.toLowerCase(),{name,size,crc});offset+=46+nameSize+extraSize+commentSize;
 }
 if(offset!==end)throw Error('Unexpected package directory data.');
 const expanded=unzipSync(bytes);
 for(const entry of entries.values()){if(entry.name.endsWith('/'))continue;const data=expanded[entry.name];if(!data||data.length!==entry.size||crc32(data)!==entry.crc)throw Error('Package entry CRC or size mismatch.');}
 for(const file of expected){const name=`lib/net45/${file.name}`;const entry=entries.get(name.toLowerCase());const data=entry&&expanded[entry.name];if(!data||data.length!==file.bytes||sha256(data)!==file.sha256)throw Error(`Required packaged payload is missing or changed: ${file.name}`);}
 return {entryCount:entries.size,uncompressedBytes:total,requiredPayloadCount:expected.length,allEntryCRCVerified:true,requiredPayloadHashesVerified:true,sha256:sha256(bytes)};
}
