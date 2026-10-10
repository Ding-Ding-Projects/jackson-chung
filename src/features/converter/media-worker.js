/* Classic dedicated worker: packaged beside the pinned single-thread UMD core. */
let running=false;
self.onmessage=async event=>{
 if(running)return;running=true;let core;
 try{
  const {mediaType,planMedia,validateMedia,MEDIA_LIMIT}=await import(new URL('media-plan.mjs',self.location.href).href);
  const {inputs,operation,options={}}=event.data;if(!Array.isArray(inputs)||inputs.length!==1)throw Error();const bytes=inputs[0],type=mediaType(bytes);
  const coreURL=new URL('ffmpeg-core.js',self.location.href).href,wasmURL=new URL('ffmpeg-core.wasm',self.location.href).href;
  importScripts(coreURL);
  core=await self.createFFmpegCore({mainScriptUrlOrBlob:`${coreURL}#${btoa(JSON.stringify({wasmURL}))}`});
  core.setLogger(()=>{});core.setTimeout(30000);
  const source=`source.${type}`;core.FS.writeFile(source,bytes);
  const probe=(path,name)=>{core.setTimeout(5000);core.ffprobe('-v','error','-protocol_whitelist','file','-i',path,'-show_entries','format=duration:stream=codec_type,width,height,avg_frame_rate,channels,sample_rate','-of','json','-o',name);const exit=core.ret;core.reset();if(exit!==0)throw Error();const file=core.FS.readFile(name);if(file.length>65536)throw Error();return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(file));};
  const plan=planMedia(bytes,operation,options,probe(source,'input-probe.json'));let last=0;
  core.setProgress(({time})=>{const now=Date.now();if(now-last<250||!Number.isFinite(time)||time<0)return;last=now;self.postMessage({kind:'progress',processedSeconds:time/1000000,duration:plan.duration});});
  core.setTimeout(30000);core.exec(...plan.args);const exit=core.ret;core.reset();if(exit!==0)throw Error();
  const stat=core.FS.stat(plan.output);if(stat.size<12||stat.size>=MEDIA_LIMIT)throw Error();
  const result=core.FS.readFile(plan.output);validateMedia(result,plan,probe(plan.output,'output-probe.json'));
  self.postMessage({ok:true,result},[result.buffer]);
 }catch{self.postMessage({ok:false,error:'Media operation unavailable, unsupported, malformed or resource-limited.'});}
 finally{core=undefined;self.close();}
};
