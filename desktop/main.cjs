'use strict';
const {app,BrowserWindow,ipcMain,shell,autoUpdater,protocol,net} = require('electron');
const path = require('node:path');
const {externalUrl} = require('./security.cjs');
const {createService} = require('./native-service.cjs');
const runtimeMode=require('./runtime-mode.cjs').configureRuntime(app,__dirname);

function createCloseHandshake({window,ipcMain,isTrusted,timeoutMs=120000,nonce=()=>require('node:crypto').randomUUID()}) {
  const webContents=window.webContents;let current=null,generation=0,disposed=false;
  const live=()=>!disposed&&!webContents.isDestroyed()&&!window.isDestroyed?.();
  const clearTimer=record=>{if(record?.timer)clearTimeout(record.timer);};
  const invalidate=()=>{generation++;if(current){clearTimer(current);current.phase='revoked';current=null;}};
  function createRequest(kind,action){
    invalidate();const record={id:nonce(),kind,generation,phase:'dialog',action,timer:null,lease:null};
    const owns=()=>live()&&current===record&&record.generation===generation;
    record.lease=Object.freeze({id:record.id,authorized:()=>owns()&&record.phase==='verification',approveOnce:()=>{if(!owns()||record.phase!=='verification')return false;record.phase='consumed';clearTimer(record);return true;},revoke:()=>{if(current!==record)return;invalidate();}});
    current=record;record.timer=setTimeout(()=>record.lease.revoke(),timeoutMs);return record;
  }
  const deliver=record=>{try{webContents.send('native:close-request',{requestId:record.id});return true}catch{record.lease.revoke();return false}};
  const onClose=event=>{if(disposed)return;if(current?.phase==='consumed'){clearTimer(current);current=null;return;}event.preventDefault();if(!live())return;if(current?.kind==='close'&&current.phase==='dialog')return;deliver(createRequest('close'));};
  const onResponse=(event,response)=>{
    const record=current;if(!live()||!record||record.phase!=='dialog'||!isTrusted(event)||!response||Object.keys(response).sort().join(',')!=='approved,requestId'||response.requestId!==record.id||typeof response.approved!=='boolean')return;
    if(!response.approved){record.lease.revoke();return;}record.phase='verification';
    if(record.kind==='restart'){Promise.resolve().then(()=>record.action(record.lease)).then(result=>{if(result===false)record.lease.revoke()},()=>record.lease.revoke());}
    else if(record.lease.approveOnce())window.close();
  };
  const onUnavailable=()=>invalidate();
  const dispose=()=>{if(disposed)return;invalidate();disposed=true;window.removeListener('close',onClose);window.removeListener('closed',dispose);webContents.removeListener('destroyed',dispose);webContents.removeListener('render-process-gone',onUnavailable);webContents.removeListener('did-start-navigation',onUnavailable);ipcMain.removeListener('native:close-response',onResponse);};
  window.on('close',onClose);window.once('closed',dispose);webContents.once('destroyed',dispose);webContents.on('render-process-gone',onUnavailable);webContents.on('did-start-navigation',onUnavailable);ipcMain.on('native:close-response',onResponse);
  return {dispose,revokeApproval:invalidate,requestRestart(action,register){if(!live()||current||typeof action!=='function'||typeof register!=='function')return false;const record=createRequest('restart',action);try{if(register(record.lease)!==true){record.lease.revoke();return false}}catch{record.lease.revoke();return false}return deliver(record);}};
}

autoUpdater.on('error',()=>{});
protocol.registerSchemesAsPrivileged([{scheme:'app',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true,allowServiceWorkers:true}}]);
if (process.argv.some(a => /^--squirrel-(install|updated|uninstall|obsolete)$/.test(a))) {
  const flag = process.argv.find(a => a.startsWith('--squirrel-'));
  if (flag !== '--squirrel-obsolete' && !runtimeMode.verification) {
    const {spawnSync} = require('node:child_process');
    const update = path.resolve(process.execPath,'..','..','Update.exe');
    const shortcut=spawnSync(update,[flag === '--squirrel-uninstall' ? '--removeShortcut' : '--createShortcut',path.basename(process.execPath)],{windowsHide:true,timeout:15000});
    const registration=spawnSync(path.join(path.dirname(process.execPath),'JacksonChungNativeHost.exe'),[flag==='--squirrel-uninstall'?'--unregister':'--register'],{windowsHide:true,timeout:15000});
    if(shortcut.error||shortcut.status!==0||registration.error||registration.status!==0){app.exit(1);return;}
  }
  app.quit();
} else {
  let window;
  app.whenReady().then(async () => {
    const service = createService({app,getWindow:()=>window});
    const broker=runtimeMode.verification?null:require('./bridge.cjs').listen(service);
    app.once('will-quit',()=>broker?.close());
    const dist = path.resolve(__dirname,'../dist');
    protocol.handle('app',request=>{try{if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});const asset=require('./protocol.cjs').resolveAsset(request.url,dist);return net.fetch(require('node:url').pathToFileURL(asset).href);}catch{return new Response('Not found',{status:404})}});
    window = new BrowserWindow({width:1200,height:840,minWidth:360,minHeight:500,frame:false,show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true}});
    const webContents=window.webContents;
    const trusted = event => !window.isDestroyed() && !webContents.isDestroyed() && event.sender === webContents && event.senderFrame === webContents.mainFrame && event.senderFrame.url.split('#')[0] === 'app://jackson/index.html';
    const closeHandshake=createCloseHandshake({window,ipcMain,isTrusted:trusted});
    const {createUpdater,readReceipt}=require('./updater.cjs');
    const updater=createUpdater({autoUpdater,receipt:readReceipt(path.join(__dirname,'verified-update.json')),verification:runtimeMode.verification,installed:require('node:fs').existsSync(path.resolve(process.execPath,'..','..','Update.exe')),firstRun:false,currentVersion:app.getVersion()});
    ipcMain.handle('native:update',async(event,operation)=>{if(!trusted(event))throw Error('Untrusted renderer');if(operation==='status')return updater.status();if(operation==='check'){void updater.check();return updater.status();}if(operation==='restart'){if(updater.status().phase!=='ready')return {accepted:false};return {accepted:closeHandshake.requestRestart(lease=>updater.install(lease),lease=>updater.registerRestartLease(lease))};}throw Error('Unsupported update operation');});
    const updateStart=setTimeout(()=>void updater.check(),process.argv.includes('--squirrel-firstrun')?10000:0);
    const updateSchedule=setInterval(()=>void updater.check(),6*60*60*1000);
    app.once('will-quit',()=>{clearTimeout(updateStart);clearInterval(updateSchedule);updater.dispose()});
    ipcMain.handle('native:capabilities',async event => {if(!trusted(event)) throw Error('Untrusted renderer'); return {...await service.capabilities(),verificationMode:runtimeMode.verification};});
    ipcMain.handle('native:request',async(event,op,input)=>{if(!trusted(event)) return {ok:false,error:'Untrusted renderer'}; try{return {ok:true,value:await service.request(op,input)}}catch{return {ok:false,error:'Operation unavailable or invalid. Check capability status and retry.'}}});
    window.webContents.setWindowOpenHandler(({url})=>{try{shell.openExternal(externalUrl(url));}catch{} return {action:'deny'};});
    window.webContents.on('will-navigate',event=>event.preventDefault());
    window.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
    window.once('ready-to-show',()=>window.show());
    await window.loadURL('app://jackson/index.html#tools');
  });
  app.on('window-all-closed',()=>app.quit());
}

