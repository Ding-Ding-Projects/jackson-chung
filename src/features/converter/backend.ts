/// <reference types="vite/client" />
export function conversionWorker(operation:string){
 if(operation.startsWith('audio:')||operation.startsWith('video:')){
  if(typeof WebAssembly==='undefined'||typeof Worker==='undefined')throw Error('Media worker unavailable.');
  const base=new URL(import.meta.env.BASE_URL,document.baseURI);
  return new Worker(new URL('vendor/ffmpeg/media-worker.js',base));
 }
 return new Worker(new URL('./worker.ts',import.meta.url),{type:'module'});
}
export function outputExtension(operation:string){if(operation.startsWith('pdf:'))return 'pdf';if(/^(image|audio|video):/.test(operation))return operation.split(':')[1];if(operation==='text:json-pretty'||operation==='text:json-compact')return 'json';if(operation==='text:utf16le')return 'txt';if(operation.startsWith('text:'))return 'txt';return operation.startsWith('decode-')?'bin':operation;}
