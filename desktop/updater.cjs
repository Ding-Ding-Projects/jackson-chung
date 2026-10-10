'use strict';
const {readFileSync}=require('node:fs');
const crypto=require('node:crypto');
const PREFIX='https://github.com/Ding-Ding-Projects/jackson-chung/releases/download/';
function validateReceipt(value){
 if(!value||Object.keys(value).sort().join(',')!=='feed,isDraft,isPrerelease,package,releaseId,source,tag,verifiedAt,version'||value.isDraft!==false||value.isPrerelease!==false||!Number.isSafeInteger(value.releaseId)||value.releaseId<1||!/^\d+\.\d+\.\d+$/.test(value.version)||! /^[a-f0-9]{40}$/.test(value.source)||! /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value.tag)||value.feed!==PREFIX+value.tag+'/'||(typeof value.verifiedAt!=='string'||!Number.isFinite(Date.parse(value.verifiedAt))))throw Error('Invalid verified update receipt');
 const p=value.package;if(!p||Object.keys(p).sort().join(',')!=='name,sha1,sha256,size'||p.name!==`JacksonChung-${value.version}-full.nupkg`||! /^[a-f0-9]{40}$/i.test(p.sha1)||! /^[a-f0-9]{64}$/.test(p.sha256)||!Number.isSafeInteger(p.size)||p.size<1||p.size>1500000000)throw Error('Invalid verified update payload');
 return value;
}
function readReceipt(file){try{const bytes=readFileSync(file);if(bytes.length>4096)return null;return validateReceipt(JSON.parse(bytes));}catch{return null}}
async function verifyFeed(receipt,fetcher=fetch){
 const signal=AbortSignal.timeout(600000);
 async function stream(url,max,consume){let response;for(let hop=0;hop<4;hop++){const target=new URL(url);if(target.protocol!=='https:'||target.username||target.password||!['github.com','release-assets.githubusercontent.com'].includes(target.hostname))throw Error('Unsupported update redirect');response=await fetcher(url,{signal,redirect:'manual'});if(![301,302,303,307,308].includes(response.status))break;const location=response.headers.get('location');if(!location||hop===3)throw Error('Update redirect bound exceeded');await response.body?.cancel();url=new URL(location,url).href}if(!response.ok||!response.body)throw Error('Update feed unavailable');const reader=response.body.getReader();let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max)throw Error('Update response exceeds bound');consume(value)}}finally{await reader.cancel().catch(()=>{})}return size}
 const parts=[];await stream(receipt.feed+'RELEASES',1048576,chunk=>parts.push(Buffer.from(chunk)));const rows=Buffer.concat(parts).toString('utf8').trim().split(/\r?\n/).map(line=>line.trim().split(/\s+/));if(rows.length>1000||rows.length!==1||rows[0].length!==3||rows[0][0].toLowerCase()!==receipt.package.sha1.toLowerCase()||rows[0][1]!==receipt.package.name||Number(rows[0][2])!==receipt.package.size)throw Error('Update index changed');
 const sha1=crypto.createHash('sha1'),sha256=crypto.createHash('sha256');const size=await stream(receipt.feed+receipt.package.name,receipt.package.size,chunk=>{sha1.update(chunk);sha256.update(chunk)});if(size!==receipt.package.size||sha1.digest('hex')!==receipt.package.sha1.toLowerCase()||sha256.digest('hex')!==receipt.package.sha256)throw Error('Update payload changed');
}
function createUpdater({autoUpdater,receipt,verification=false,installed=false,firstRun=false,now=Date.now,verify=verifyFeed,currentVersion='0.0.0'}){
 let valid=null;try{valid=validateReceipt(receipt)}catch{}
 const compare=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]-y[i];return 0};if(valid&&compare(valid.version,currentVersion)<0)valid=null;
 let state={phase:'unavailable',reason:verification?'verification-mode':!installed?'not-installed':!valid?'missing-verified-feed':firstRun?'first-run-lock':'',version:valid?.version??null,tag:valid?.tag??null,unsigned:true,progress:null,updatedAt:now()};
 const listeners=[];let disposed=false;
 const set=(phase,reason='')=>{state={...state,phase,reason,updatedAt:now()}};
 const available=!verification&&installed&&valid&&!firstRun;
 if(available){set('idle');autoUpdater.setFeedURL({url:valid.feed});for(const [event,handler] of Object.entries({
  'checking-for-update':()=>{if(state.phase==='checking')set('checking')},
  'update-available':()=>{if(state.phase==='checking')set('downloading')},
  'update-not-available':()=>{if(state.phase==='checking')set('current')},
  'update-downloaded':(_event,_notes,version)=>{if(state.phase==='downloading'){if(version===valid.version)set('ready');else set('error','release-version-mismatch')}},
  error:()=>{if(['checking','downloading','restarting'].includes(state.phase))set('error','update-operation-failed')}
 })){const listener=(...args)=>{if(!disposed)handler(...args)};autoUpdater.on(event,listener);listeners.push([event,listener])}}
 return {status:()=>({...state}),async check(){if(!available||disposed||['checking','downloading','ready','restarting'].includes(state.phase))return {...state};set('checking');try{await verify(valid);if(!disposed&&state.phase==='checking')autoUpdater.checkForUpdates()}catch{if(!disposed)set('error','update-operation-failed')}return {...state}},install(){if(disposed||state.phase!=='ready')return false;set('restarting');try{autoUpdater.quitAndInstall();return true}catch{set('error','update-operation-failed');return false}},dispose(){disposed=true;for(const [event,listener]of listeners)autoUpdater.removeListener(event,listener)}};
}
module.exports={validateReceipt,readReceipt,createUpdater,verifyFeed};
