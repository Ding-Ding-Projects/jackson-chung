'use strict';
const {app,BrowserWindow,ipcMain,shell,autoUpdater,protocol,net} = require('electron');
const path = require('node:path');
const {externalUrl} = require('./security.cjs');
const {createService} = require('./native-service.cjs');
const runtimeMode=require('./runtime-mode.cjs').configureRuntime(app,__dirname);

function createCloseHandshake({window,ipcMain,isTrusted,timeoutMs=120000,nonce=()=>require('node:crypto').randomUUID()}) {
  const webContents=window.webContents;
  let pending=null, approved=false, disposed=false, pendingAction=null;
  const clear=()=>{if(pending)clearTimeout(pending.timer);pending=null;};
  const onClose=event=>{if(disposed)return;if(approved){approved=false;return;}event.preventDefault();if(pending||webContents.isDestroyed())return;const id=nonce();const timer=setTimeout(()=>{clear();pendingAction=null},timeoutMs);pending={id,timer};try{webContents.send('native:close-request',{requestId:id});}catch{clear();pendingAction=null;}};
  const onResponse=(event,response)=>{if(disposed||webContents.isDestroyed()||window.isDestroyed?.()||!pending||!isTrusted(event)||!response||Object.keys(response).sort().join(',')!=='approved,requestId'||response.requestId!==pending.id||typeof response.approved!=='boolean')return;const allow=response.approved;clear();if(allow){if(pendingAction){const action=pendingAction;pendingAction=null;Promise.resolve(action(()=>{approved=true})).then(result=>{if(result===false)approved=false},()=>{approved=false});}else{approved=true;window.close();}}else pendingAction=null;};
  const onUnavailable=()=>{clear();pendingAction=null};
  const dispose=()=>{if(disposed)return;disposed=true;approved=false;pendingAction=null;clear();window.removeListener('close',onClose);window.removeListener('closed',dispose);webContents.removeListener('destroyed',dispose);webContents.removeListener('render-process-gone',onUnavailable);webContents.removeListener('did-start-navigation',onUnavailable);ipcMain.removeListener('native:close-response',onResponse);};
  window.on('close',onClose);window.once('closed',dispose);webContents.once('destroyed',dispose);webContents.on('render-process-gone',onUnavailable);webContents.on('did-start-navigation',onUnavailable);ipcMain.on('native:close-response',onResponse);
  return {dispose,revokeApproval(){approved=false;pendingAction=null;clear()},requestRestart(action){if(disposed||pending||typeof action!=='function')return false;pendingAction=action;onClose({preventDefault(){}});return !!pending;}};
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
    const updater=createUpdater({autoUpdater,receipt:readReceipt(path.join(__dirname,'verified-update.json')),verification:runtimeMode.verification,installed:require('node:fs').existsSync(path.resolve(process.execPath,'..','..','Update.exe')),firstRun:false,currentVersion:app.getVersion(),revokeApproval:()=>closeHandshake.revokeApproval()});
    ipcMain.handle('native:update',async(event,operation)=>{if(!trusted(event))throw Error('Untrusted renderer');if(operation==='status')return updater.status();if(operation==='check'){void updater.check();return updater.status();}if(operation==='restart'){if(updater.status().phase!=='ready')return {accepted:false};return {accepted:closeHandshake.requestRestart(approve=>updater.install(approve))};}throw Error('Unsupported update operation');});
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

