export const MEDIA_REQUIREMENTS=Object.freeze({'audio:wav':['pcm_s16le'],'audio:mp3':['libmp3lame'],'audio:ogg':['libvorbis'],'audio:flac':['flac'],'video:mp4':['libx264','aac'],'video:webm':['libvpx','libvorbis']});
const names=['ffmpeg-core.js','ffmpeg-core.wasm','media-worker.js','media-plan.mjs'];
const limits={'ffmpeg-core.js':262144,'ffmpeg-core.wasm':40*1024*1024,'media-worker.js':65536,'media-plan.mjs':65536};
const disabled=reason=>({reason,available:Object.fromEntries(Object.keys(MEDIA_REQUIREMENTS).map(operation=>[operation,false]))});
async function readBounded(response,limit){if(!response.ok||!response.body)throw Error('assets');const chunks=[],reader=response.body.getReader();let length=0;try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit)throw Error('assets');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;}
/** @param {{baseUrl:string,fetcher?:typeof fetch,hash?:(bytes:Uint8Array)=>Promise<string>,probe:()=>Promise<string[]>}} options */
export async function discoverMedia({baseUrl,fetcher=globalThis.fetch,hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join(''),probe}){
 const controller=new AbortController(),expiry=setTimeout(()=>controller.abort(),30000);
 try{
  const base=new URL('vendor/ffmpeg/',baseUrl),manifestResponse=await fetcher(new URL('distribution.json',base),{credentials:'omit',redirect:'error',cache:'no-cache',signal:controller.signal});
  if(!manifestResponse.ok)return disabled('distribution-pending');
  const manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await readBounded(manifestResponse,16384)));
  if(manifest.version!==1||manifest.coreVersion!=='0.12.10'||manifest.licenseAndSourceVerified!==true||!Array.isArray(manifest.files)||manifest.files.length!==4||typeof manifest.noticeFile!=='string'||!/^[a-zA-Z0-9_.-]+\.txt$/.test(manifest.noticeFile))return disabled('distribution-pending');
  const notice=await readBounded(await fetcher(new URL(manifest.noticeFile,base),{credentials:'omit',redirect:'error',signal:controller.signal}),262144);if(!notice.length)return disabled('distribution-pending');
  for(const name of names){const file=manifest.files.find(item=>item.name===name);if(!file||!Number.isInteger(file.bytes)||file.bytes<1||file.bytes>limits[name]||!/^[a-f0-9]{64}$/.test(file.sha256))return disabled('asset-proof-missing');const bytes=await readBounded(await fetcher(new URL(name,base),{credentials:'omit',redirect:'error',signal:controller.signal}),file.bytes);if(bytes.length!==file.bytes||await hash(bytes)!==file.sha256)return disabled('asset-mismatch');}
  if(controller.signal.aborted)return disabled('discovery-unavailable');
  const encoders=await probe();if(!Array.isArray(encoders)||encoders.length>1000||encoders.some(value=>typeof value!=='string'||!/^[a-zA-Z0-9_]+$/.test(value)))return disabled('codec-probe-unavailable');
  const available=Object.fromEntries(Object.entries(MEDIA_REQUIREMENTS).map(([operation,required])=>[operation,required.every(codec=>encoders.includes(codec))]));return {reason:Object.values(available).every(Boolean)?'ready':'codec-missing',available};
 }catch{return disabled('discovery-unavailable');}finally{clearTimeout(expiry);}
}
