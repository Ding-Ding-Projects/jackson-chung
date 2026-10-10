import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),source=readFileSync(new URL('../desktop/main.cjs',import.meta.url),'utf8'),tree=ts.createSourceFile('main.cjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),fn=tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name.text==='createCloseHandshake').getText(tree);
const receipt={feed:'https://github.com/Ding-Ding-Projects/jackson-chung/releases/download/v1.0.0/',isDraft:false,isPrerelease:false,package:{name:'JacksonChung-1.0.0-full.nupkg',sha1:'a'.repeat(40),sha256:'b'.repeat(64),size:1},releaseId:1,source:'c'.repeat(40),tag:'v1.0.0',version:'1.0.0',verifiedAt:'2026-10-10T00:00:00Z'};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
for(const interruption of ['did-start-navigation','render-process-gone','dispose','timeout','cancel','revoke'])test(`Actual restart attempt cannot survive ${interruption}, and a fresh approval succeeds`,async()=>{
 const timers=new Map(),setTimer=(callback,ms)=>{const timer={unref(){},ms};timers.set(timer,callback);return timer},clearTimer=timer=>timers.delete(timer);
 const create=new Function('setTimeout','clearTimeout',fn+';return createCloseHandshake')(setTimer,clearTimer);const module={exports:{}};let updaterSource=readFileSync(new URL('../desktop/updater.cjs',import.meta.url),'utf8');if(process.env.UPDATER_IGNORE_LIFECYCLE==='1')updaterSource=updaterSource.replace('if(!authorized()||approve()===false||!authorized())','if(false)');new Function('require','module','setTimeout','clearTimeout',updaterSource)(require,module,setTimer,clearTimer);
 const window=new EventEmitter(),wc=new EventEmitter(),ipc=new EventEmitter();let sent=[],sequence=0;wc.isDestroyed=()=>false;window.isDestroyed=()=>false;window.webContents=wc;wc.send=(_channel,value)=>sent.push(value);window.close=()=>{};
 let handshake=create({window,ipcMain:ipc,isTrusted:event=>event.trusted,nonce:()=>String(sequence++)}),installs=0,defer=false,resolveStage;const engine=new EventEmitter();engine.setFeedURL=()=>{};engine.checkForUpdates=()=>{};engine.quitAndInstall=()=>installs++;
 const updater=module.exports.createUpdater({autoUpdater:engine,installed:true,discover:async()=>receipt,verify:async()=>({}),retain:async()=>({url:'http://127.0.0.1:1/updates/',close(){}}),verifyStaged:()=>defer?new Promise(resolve=>resolveStage=resolve):Promise.resolve(true),revokeApproval:()=>handshake.revokeApproval()});
 async function ready(){await updater.check();engine.emit('update-available');engine.emit('update-downloaded',{},'',receipt.version);await settle();assert.equal(updater.status().phase,'ready')}
 try{await ready();defer=true;assert.equal(handshake.requestRestart((approve,authorized)=>updater.install(approve,authorized)),true);ipc.emit('native:close-response',{trusted:true},{requestId:sent.at(-1).requestId,approved:true});assert.equal(typeof resolveStage,'function');
 if(interruption==='dispose')handshake.dispose();else if(interruption==='timeout'){const timer=[...timers.keys()].find(timer=>timer.ms===120000);assert.ok(timer);timers.get(timer)()}else if(interruption==='cancel')updater.cancel();else if(interruption==='revoke')handshake.revokeApproval();else wc.emit(interruption);
 resolveStage(true);await settle();assert.equal(installs,0);assert.notEqual(updater.status().phase,'restarting');defer=false;if(interruption==='dispose')handshake=create({window,ipcMain:ipc,isTrusted:event=>event.trusted,nonce:()=>String(sequence++)});if(updater.status().phase!=='ready')await ready();assert.equal(handshake.requestRestart((approve,authorized)=>updater.install(approve,authorized)),true);ipc.emit('native:close-response',{trusted:true},{requestId:sent.at(-1).requestId,approved:true});await settle();assert.equal(installs,1);
 }finally{handshake.dispose();updater.dispose();assert.equal(timers.size,0)}
});
