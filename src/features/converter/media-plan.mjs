export const MEDIA_LIMIT=20*1024*1024;
export const MEDIA_TARGETS=Object.freeze({'audio:wav':{extension:'wav',codec:'pcm_s16le',muxer:'wav'},'audio:mp3':{extension:'mp3',codec:'libmp3lame',muxer:'mp3'},'audio:ogg':{extension:'ogg',codec:'libvorbis',muxer:'ogg'},'audio:flac':{extension:'flac',codec:'flac',muxer:'flac'},'video:mp4':{extension:'mp4',codec:'libx264',muxer:'mp4'},'video:webm':{extension:'webm',codec:'libvpx',muxer:'webm'}});
const ascii=(bytes,start,end)=>String.fromCharCode(...bytes.subarray(start,end));
export function mediaType(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<12||bytes.length>MEDIA_LIMIT)throw Error('Media source exceeds its byte boundary.');
 if(ascii(bytes,0,4)==='RIFF'&&ascii(bytes,8,12)==='WAVE')return 'wav';
 if(ascii(bytes,0,4)==='fLaC')return 'flac';
 if(ascii(bytes,0,4)==='OggS'&&bytes[4]===0)return 'ogg';
 if(ascii(bytes,0,3)==='ID3'||bytes[0]===255&&(bytes[1]&0xe0)===0xe0&&(bytes[1]&6)!==0)return 'mp3';
 if(ascii(bytes,4,8)==='ftyp'&&new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(0)>=16)return 'mp4';
 if(bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3&&ascii(bytes,4,Math.min(bytes.length,4096)).includes('webm'))return 'webm';
 throw Error('Unsupported media signature.');
}
export function inspectMedia(info,video){
 const duration=Number(info?.format?.duration),streams=info?.streams;
 if(!Number.isFinite(duration)||duration<=0||duration>(video?60:600)||!Array.isArray(streams)||streams.length<1||streams.length>4)throw Error('Unsupported duration or stream count.');
 for(const stream of streams){if(stream.codec_type==='video'){const width=Number(stream.width),height=Number(stream.height);const rate=String(stream.avg_frame_rate??'0/1').split('/').map(Number);const fps=rate.length===2?rate[0]/rate[1]:NaN;if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||width>1920||height>1080||!Number.isFinite(fps)||fps<=0||fps>60)throw Error('Video geometry or frame rate exceeds supported bounds.');}if(stream.codec_type==='audio'&&(!Number.isFinite(Number(stream.channels))||Number(stream.channels)>8||Number(stream.channels)<1||Number(stream.sample_rate)>192000))throw Error('Unsupported audio stream.');}
 if(!streams.some(stream=>stream.codec_type===(video?'video':'audio')))throw Error('Required media stream is missing.');return duration;
}
export function planMedia(bytes,operation,options={},info){
 const source=mediaType(bytes);if(!Object.hasOwn(MEDIA_TARGETS,operation))throw Error('Unsupported media target.');const target=MEDIA_TARGETS[operation],video=operation.startsWith('video:');const duration=inspectMedia(info,video);
 const start=options.mediaStart===undefined||options.mediaStart===''?0:Number(options.mediaStart),requested=options.mediaDuration===undefined||options.mediaDuration===''?duration-start:Number(options.mediaDuration);
 if(!Number.isFinite(start)||start<0||start>=duration||!Number.isFinite(requested)||requested<=0||requested>(video?60:600)||start+requested>duration+0.01)throw Error('Trim interval lies outside the source.');
 const input=`source.${source}`,output=`result.${target.extension}`;
 const args=['-nostdin','-y','-v','error','-max_alloc','16777216','-threads','1','-protocol_whitelist','file','-i',input,'-ss',String(start),'-t',String(requested),'-map_metadata','-1','-map_chapters','-1','-threads','1','-fs',String(MEDIA_LIMIT)];
 if(video){args.push('-map','0:v:0','-map','0:a:0?','-c:v',target.codec,'-vf',"scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",'-r','24','-pix_fmt','yuv420p');if(target.extension==='mp4')args.push('-preset','ultrafast','-crf','28','-c:a','aac','-b:a','128k','-movflags','+faststart');else args.push('-deadline','realtime','-cpu-used','8','-b:v','1M','-c:a','libvorbis','-b:a','128k');}
 else args.push('-map','0:a:0','-vn','-c:a',target.codec,'-ac','2','-ar','44100',...(target.extension==='mp3'?['-b:a','128k']:target.extension==='ogg'?['-q:a','4']:[]));
 args.push('-f',target.muxer,output);return {input,output,args,operation,extension:target.extension,duration:requested,video};
}
export function validateMedia(bytes,plan,info){
 const type=mediaType(bytes);if(type!==plan.extension)throw Error('Output container signature mismatch.');const duration=inspectMedia(info,plan.video);if(Math.abs(duration-plan.duration)>Math.max(0.5,plan.duration*0.02))throw Error('Output duration does not match request; output may be truncated.');
 if(plan.video&&info.streams.some(stream=>stream.codec_type==='video'&&(stream.width>1280||stream.height>720)))throw Error('Output geometry mismatch.');return bytes;
}
