/// <reference types="vite/client" />
import {discoverMedia} from './media-availability.mjs';
type MediaAvailability={reason:string;available:Record<string,boolean>};
let availability:MediaAvailability={reason:'checking',available:{}};
let discovery:Promise<MediaAvailability>|undefined;
function mediaWorker(){const base=new URL(import.meta.env.BASE_URL,document.baseURI);return new Worker(new URL('vendor/ffmpeg/media-worker.js',base));}
export function getMediaAvailability(){return availability;}
export function ensureMediaAvailability(){
 if(!discovery)discovery=(async()=>{if(typeof WebAssembly==='undefined'||typeof Worker==='undefined')return {reason:'browser-unavailable',available:{}};const result=await discoverMedia({baseUrl:new URL(import.meta.env.BASE_URL,document.baseURI).href,probe:()=>new Promise<string[]>((resolve,reject)=>{const worker=mediaWorker(),timeout=setTimeout(()=>{worker.terminate();reject(Error());},30000);worker.onmessage=event=>{clearTimeout(timeout);worker.terminate();event.data.ok?resolve(event.data.encoders):reject(Error());};worker.onerror=()=>{clearTimeout(timeout);worker.terminate();reject(Error());};worker.postMessage({operation:'discover'});})});return result;})().then(result=>{availability=result;return result;});
 return discovery;
}
export function mediaReason(translate:(en:string,yue:string)=>string){const reason=availability.reason;return reason==='ready'?translate('Bundled media codecs verified locally.','已在本機驗證捆綁媒體編碼器。'):reason==='checking'?translate('Checking local media distribution proof.','正在檢查本機媒體分發證據。'):reason==='codec-missing'?translate('One or more target encoders are absent; only enabled targets can run.','缺少一個或以上目標編碼器；只有啟用的目標可以執行。'):reason==='distribution-pending'?translate('Media conversion is unavailable: license notices and corresponding-source distribution proof are pending.','媒體轉換不可用：授權通知及對應源碼分發證據仍待完成。'):translate('Media conversion is unavailable: local assets, hashes, codec discovery or browser capability could not be verified.','媒體轉換不可用：未能驗證本機資源、雜湊、編碼器探索或瀏覽器能力。');}
export function conversionWorker(operation:string){
 if(operation.startsWith('audio:')||operation.startsWith('video:')){
  if(!availability.available[operation])throw Error('Verified media distribution and target encoder are unavailable.');
  return mediaWorker();
 }
 return new Worker(new URL('./worker.ts',import.meta.url),{type:'module'});
}
export function outputExtension(operation:string){if(operation.startsWith('pdf:'))return 'pdf';if(/^(image|audio|video):/.test(operation))return operation.split(':')[1];if(operation==='text:json-pretty'||operation==='text:json-compact')return 'json';if(operation==='text:utf16le')return 'txt';if(operation.startsWith('text:'))return 'txt';return operation.startsWith('decode-')?'bin':operation;}
