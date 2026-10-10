'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const run=promisify(execFile);
const {validate}=require('./security.cjs');
async function readModelList(response){
  if(Number(response.headers.get('content-length'))>1048576)throw Error('Model metadata exceeds 1 MiB');
  const reader=response.body.getReader();let bytes=0;const parts=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1048576)throw Error('Model metadata exceeds 1 MiB');parts.push(Buffer.from(value));}}finally{await reader.cancel().catch(()=>{});}
  const value=JSON.parse(Buffer.concat(parts).toString('utf8'));
  if(!value||!Array.isArray(value.models)||value.models.length>4096)throw Error('Invalid model metadata');
  for(const model of value.models){if(!model||typeof model!=='object'||typeof model.name!=='string'||model.name.length>200||model.name.length===0)throw Error('Invalid model metadata');for(const key of ['size','size_vram','context_length'])if(model[key]!==undefined&&(!Number.isFinite(model[key])||model[key]<0))throw Error('Invalid model metadata');}
  return value;
}
function createService({app,getWindow}) {
  const {safeStorage,dialog,shell}=require('electron');
  const root=path.join(app.getPath('userData'),'private-data');
  const history=path.join(root,'history');
  const git=path.join(process.resourcesPath,'tools','git','cmd','git.exe');
  const tasks=new Map(); const files=new Map(); const pairs=new Map();
  let queue=Promise.resolve(); let unlockedUntil=0;
  const gitRun=(args)=>run(git,['-c','core.hooksPath=NUL','-c','user.name=Local History','-c','user.email=local@localhost',...args],{cwd:history,windowsHide:true,timeout:15000,maxBuffer:4*1024*1024});
  async function encryptedRead(){try{return safeStorage.decryptString(await fs.readFile(path.join(root,'store.enc')))}catch(e){if(e.code==='ENOENT')return '{}';throw e}}
  async function save(text,label){if(!safeStorage.isEncryptionAvailable())throw Error('OS encryption unavailable');await fs.mkdir(root,{recursive:true});const cipher=safeStorage.encryptString(text);const temp=path.join(root,'store.tmp');await fs.writeFile(temp,cipher,{mode:0o600});await fs.rename(temp,path.join(root,'store.enc'));let historySaved=true;try{await fs.access(git);await fs.mkdir(history,{recursive:true});await gitRun(['init']);await fs.writeFile(path.join(history,'snapshot.enc'),cipher);await gitRun(['add','--','snapshot.enc']);const diff=await gitRun(['diff','--cached','--quiet']).then(()=>false,()=>true);if(diff)await gitRun(['commit','-m',label]);}catch{historySaved=false}return {saved:true,historySaved,historyRecovery:historySaved?null:'Install the packaged Git payload, then save again.'}}
  async function ollama(route,body,signal){const response=await fetch(`http://127.0.0.1:11434/api/${route}`,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:signal??AbortSignal.timeout(10000),redirect:'error'});if(!response.ok)throw Error('Local model service rejected request');return response}
  function task(route,body){if(tasks.size>=8)throw Error('Too many active tasks');const id=crypto.randomUUID();const controller=new AbortController();const record={controller,chunks:[],done:false,error:null};tasks.set(id,record);setTimeout(()=>controller.abort(),15*60*1000).unref();(async()=>{try{const response=await ollama(route,{...body,stream:true},controller.signal);const reader=response.body.getReader();const decoder=new TextDecoder();let pending='';let bytes=0;while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>8*1024*1024)throw Error('Response limit reached');pending+=decoder.decode(value,{stream:true});let newline;while((newline=pending.indexOf('\n'))>=0){const line=pending.slice(0,newline);pending=pending.slice(newline+1);if(line.trim())record.chunks.push(JSON.parse(line));}}if(pending.trim())record.chunks.push(JSON.parse(pending));}catch{record.error=controller.signal.aborted?'Cancelled or timed out':'Local service unavailable or invalid response'}finally{record.done=true;setTimeout(()=>tasks.delete(id),60000).unref()}})();return {id}}
  async function request(op,input){const p=validate(op,input);
    if(op.startsWith('window.')){const w=getWindow();if(op==='window.minimize')w.minimize();if(op==='window.maximize')w.isMaximized()?w.unmaximize():w.maximize();if(op==='window.close')w.close();return null}
    if(op==='store.read')return JSON.parse(await encryptedRead());
    if(op==='store.write'){const text=JSON.stringify(p.value??{});const job=queue.then(()=>save(text,'Update local records'));queue=job.catch(()=>{});return job}
    if(op==='history.lock'){unlockedUntil=0;return {locked:true}}
    if(op==='history.unlock'){if(typeof p.password!=='string'||p.password.length<8||p.password.length>1024)throw Error('Use a password of 8 to 1024 characters');await fs.mkdir(root,{recursive:true});const lock=path.join(root,'history-lock.enc');let record;try{record=JSON.parse(safeStorage.decryptString(await fs.readFile(lock)))}catch(e){if(e.code!=='ENOENT')throw e;if(!safeStorage.isEncryptionAvailable())throw Error('OS encryption unavailable');const salt=crypto.randomBytes(32).toString('hex');record={salt,hash:crypto.scryptSync(p.password,salt,32).toString('hex')};await fs.writeFile(lock,safeStorage.encryptString(JSON.stringify(record)),{mode:0o600})}const actual=crypto.scryptSync(p.password,record.salt,32);if(!crypto.timingSafeEqual(actual,Buffer.from(record.hash,'hex')))throw Error('Invalid password');unlockedUntil=Date.now()+300000;return {unlocked:true,expiresInSeconds:300}}
    if(op.startsWith('history.')&&Date.now()>=unlockedUntil)throw Error('Unlock history with its local password first');
    if(op==='history.list'){await fs.access(git);return {revisions:(await gitRun(['log','-100','--format=%H%x09%aI%x09%s'])).stdout.trim().split('\n').filter(Boolean).map(line=>{const [id,date,label]=line.split('\t');return {id,date,label}})}}
    if(op==='history.restore'){if(!/^[a-f0-9]{40}$/.test(p.id))throw Error('Invalid revision');const job=queue.then(async()=>{const result=await run(git,['show',`${p.id}:snapshot.enc`],{cwd:history,encoding:'buffer',windowsHide:true,timeout:15000,maxBuffer:1048576});return save(safeStorage.decryptString(result.stdout),'Restore local records')});queue=job.catch(()=>{});return job}
    if(op==='file.import'){const result=await dialog.showOpenDialog(getWindow(),{properties:['openFile'],filters:[{name:'Text and JSON',extensions:['txt','json','md','csv']}]});if(result.canceled)return {cancelled:true};const name=result.filePaths[0];if((await fs.stat(name)).size>1048576)throw Error('File too large');const id=crypto.randomUUID();files.set(id,name);return {id,name:path.basename(name),text:await fs.readFile(name,'utf8')}}
    if(op==='file.export'){if(typeof p.text!=='string'||p.text.length>1048576)throw Error('Invalid text');const result=await dialog.showSaveDialog(getWindow(),{defaultPath:'export.json'});if(result.canceled)return {cancelled:true};await fs.writeFile(result.filePath,p.text,'utf8');const id=crypto.randomUUID();files.set(id,result.filePath);return {id,name:path.basename(result.filePath)}}
    if(op==='editor.open'){const target=files.get(p.id);if(!target)throw Error('Select or export a file first');const candidates=[path.join(process.env.LOCALAPPDATA??'','Programs','Microsoft VS Code','Code.exe'),path.join(process.env.ProgramFiles??'','Microsoft VS Code','Code.exe')];for(const editor of candidates){try{await fs.access(editor);await run(editor,['--reuse-window',target],{windowsHide:true,timeout:10000});return {opened:true}}catch{}}return {opened:false,recovery:'Install Visual Studio Code, then retry.'}}
    if(op==='ollama.tags')return readModelList(await ollama('tags'));
    if(op==='ollama.ps')return readModelList(await ollama('ps'));
    if(op==='ollama.catalog')return {available:false,url:'https://ollama.com/library',recovery:'The official catalog does not expose a stable complete public API. Open the official catalog and enter an exact model identifier.'};
    if(op==='ollama.chat'){if(typeof p.model!=='string'||p.model.length>200||typeof p.prompt!=='string'||p.prompt.length>64000)throw Error('Invalid chat');return task('chat',{model:p.model,messages:[{role:'user',content:p.prompt}]})}
    if(op==='ollama.pull'){if(typeof p.model!=='string'||! /^[a-zA-Z0-9][a-zA-Z0-9_.:/-]{0,199}$/.test(p.model))throw Error('Invalid model');return task('pull',{model:p.model})}
    if(op==='task.poll'){const t=tasks.get(p.id);if(!t)throw Error('Unknown task');const chunks=t.chunks.splice(0,100);return {chunks,done:t.done&&t.chunks.length===0,error:t.error}}
    if(op==='task.cancel'){tasks.get(p.id)?.controller.abort();return {cancelled:true}}
    if(op==='pairing.create'){const capabilities=Array.isArray(p.capabilities)?p.capabilities.filter(c=>['ollama.tags','ollama.ps','ollama.catalog','ollama.chat','ollama.pull','task.poll','task.cancel'].includes(c)):[];if(!capabilities.length)throw Error('Select capabilities');const token=crypto.randomBytes(32).toString('base64url');pairs.set(token,{capabilities,created:new Date().toISOString()});return {token,capabilities}}
    if(op==='pairing.revoke'){pairs.clear();for(const t of tasks.values())t.controller.abort();return {revoked:true}}
    if(op==='pairing.list')return {count:pairs.size};
    throw Error('Unsupported operation');
  }
  return {request,capabilities:async()=>({version:app.getVersion(),capabilities:['window','encrypted-store','native-dialogs','editor','ollama','pairing'],history:{available:await fs.access(git).then(()=>true,()=>false),origin:'bundled',recovery:'Expected packaged tools/git/cmd/git.exe'}}),authorize:(token,op)=>pairs.get(token)?.capabilities.includes(op)};
}
module.exports={createService,readModelList};
