import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {unzipSync} from 'fflate';
import {verifyPackagePayload} from './package-payload.mjs';
const {validateReceipt}=createRequire(import.meta.url)('../desktop/updater.cjs');
export function releaseReceipt(release,index,bytes,build){
 if(release.isDraft!==false||release.isPrerelease!==false||!Number.isSafeInteger(release.databaseId)||!build||!/^\d+\.\d+\.\d+$/.test(build.version)||! /^[a-f0-9]{40}$/.test(build.source))throw Error('Normal release and source metadata required');
 const name=`JacksonChung-${build.version}-full.nupkg`;const asset=release.assets?.find(asset=>asset.name===name);const metadata=release.assets?.find(asset=>asset.name==='build-info.json');
 const feed=`https://github.com/Ding-Ding-Projects/jackson-chung/releases/download/${release.tagName}/`;
 if(!asset||!metadata||asset.url!==feed+name||metadata.url!==feed+'build-info.json'||asset.size!==bytes.length||bytes.length>1500000000)throw Error('Release asset identity mismatch');
 const lines=index.trim().split(/\r?\n/);if(lines.length!==1)throw Error('Release index exceeds bound');const matches=lines.map(line=>line.trim().split(/\s+/)).filter(row=>row[1]===name);const sha1=createHash('sha1').update(bytes).digest('hex');if(matches.length!==1||matches[0].length!==3||matches[0][0].toLowerCase()!==sha1||Number(matches[0][2])!==bytes.length)throw Error('RELEASES payload mismatch');
 verifyPackagePayload(bytes,[]);
 const asar=unzipSync(bytes)['lib/net45/resources/app.asar'];if(!asar||asar.length<16)throw Error('Packaged source metadata missing');
 const headerSize=Buffer.from(asar).readUInt32LE(4),jsonSize=Buffer.from(asar).readUInt32LE(12);if(headerSize>16777216||jsonSize>headerSize-8||8+headerSize>asar.length)throw Error('Invalid application archive');
 const header=JSON.parse(Buffer.from(asar.subarray(16,16+jsonSize)).toString('utf8'));const entry=header.files?.dist?.files?.['build-info.json'];if(!entry||entry.unpacked||entry.link||!/^\d+$/.test(entry.offset)||!Number.isSafeInteger(entry.size)||entry.size<1||entry.size>1048576)throw Error('Packaged source metadata missing');
 const start=8+headerSize+Number(entry.offset);if(!Number.isSafeInteger(start)||start+entry.size>asar.length)throw Error('Packaged source metadata out of bounds');const embedded=JSON.parse(Buffer.from(asar.subarray(start,start+entry.size)).toString('utf8'));if(embedded.source!==build.source||embedded.version!==build.version)throw Error('Packaged source/version mismatch');
 return validateReceipt({feed,isDraft:false,isPrerelease:false,package:{name,sha1,sha256:createHash('sha256').update(bytes).digest('hex'),size:bytes.length},releaseId:release.databaseId,source:build.source,tag:release.tagName,verifiedAt:new Date().toISOString(),version:build.version});
}
if(import.meta.url===pathToFileURL(process.argv[1]??'').href){
 const tag=process.argv[2];if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(tag??''))throw Error('Exact normal-release tag required');
 const root=resolve('.agent');mkdirSync(root,{recursive:true});const owned=mkdtempSync(join(root,'update-receipt-'));const repo='Ding-Ding-Projects/jackson-chung';
 const release=JSON.parse(execFileSync('gh',['release','view',tag,'--repo',repo,'--json','databaseId,tagName,isDraft,isPrerelease,assets'],{encoding:'utf8',timeout:30000,maxBuffer:1048576}));
 if(release.isDraft||release.isPrerelease)throw Error('Normal release required');
 for(const pattern of ['RELEASES','build-info.json']){const item=release.assets?.find(asset=>asset.name===pattern);if(!item||!Number.isSafeInteger(item.size)||item.size<1||item.size>1048576||item.url!==`https://github.com/${repo}/releases/download/${tag}/${pattern}`)throw Error('Release metadata asset exceeds trusted boundary');}
 for(const pattern of ['RELEASES','build-info.json'])execFileSync('gh',['release','download',tag,'--repo',repo,'--pattern',pattern,'--dir',owned],{timeout:60000,stdio:'inherit'});
 const metadataBytes=readFileSync(join(owned,'build-info.json'));if(metadataBytes.length>1048576)throw Error('Release metadata exceeds bound');const build=JSON.parse(metadataBytes);if(!/^\d+\.\d+\.\d+$/.test(build.version??''))throw Error('Release version metadata missing');
 const asset=release.assets.find(asset=>asset.name===`JacksonChung-${build.version}-full.nupkg`);if(!asset||asset.size<1||asset.size>1500000000)throw Error('Release package exceeds bound');
 const name=`JacksonChung-${build.version}-full.nupkg`;execFileSync('gh',['release','download',tag,'--repo',repo,'--pattern',name,'--dir',owned],{timeout:600000,stdio:'inherit'});
 const receipt=releaseReceipt(release,readFileSync(join(owned,'RELEASES'),'utf8'),readFileSync(join(owned,name)),build);
 writeFileSync(join(root,'verified-update.json'),JSON.stringify(receipt,null,2));console.log('Verified normal-release update receipt written to private staging.');
}
