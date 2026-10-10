'use strict';
const {app,BrowserWindow,ipcMain,shell,autoUpdater} = require('electron');
const path = require('node:path');
const {externalUrl} = require('./security.cjs');
const {createService} = require('./native-service.cjs');
autoUpdater.on('error',()=>{});
if (process.argv.some(a => /^--squirrel-(install|updated|uninstall|obsolete)$/.test(a))) {
  const flag = process.argv.find(a => a.startsWith('--squirrel-'));
  if (flag !== '--squirrel-obsolete') {
    const {spawnSync} = require('node:child_process');
    const update = path.resolve(process.execPath,'..','..','Update.exe');
    spawnSync(update,[flag === '--squirrel-uninstall' ? '--removeShortcut' : '--createShortcut',path.basename(process.execPath)],{windowsHide:true,timeout:15000});
  }
  app.quit();
} else {
  let window;
  app.whenReady().then(async () => {
    const service = createService({app,getWindow:()=>window});
    const broker=require('./bridge.cjs').listen(service);
    app.once('before-quit',()=>broker.close());
    const entry = path.resolve(__dirname,'../dist/index.html');
    window = new BrowserWindow({width:1200,height:840,minWidth:360,minHeight:500,frame:false,show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true}});
    const trusted = event => event.sender === window.webContents && event.senderFrame === window.webContents.mainFrame && event.senderFrame.url.split('#')[0] === require('node:url').pathToFileURL(entry).href;
    ipcMain.handle('native:capabilities',event => {if(!trusted(event)) throw Error('Untrusted renderer'); return service.capabilities();});
    ipcMain.handle('native:request',async(event,op,input)=>{if(!trusted(event)) return {ok:false,error:'Untrusted renderer'}; try{return {ok:true,value:await service.request(op,input)}}catch{return {ok:false,error:'Operation unavailable or invalid. Check capability status and retry.'}}});
    window.webContents.setWindowOpenHandler(({url})=>{try{shell.openExternal(externalUrl(url));}catch{} return {action:'deny'};});
    window.webContents.on('will-navigate',event=>event.preventDefault());
    window.webContents.session.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
    window.once('ready-to-show',()=>window.show());
    await window.loadFile(entry);
    // Updates are disabled unless packaging supplies a verified release receipt.
    try { const receipt=require('./verified-update.json'); const url=new URL(receipt.feed); if(receipt.verified === true && receipt.isDraft === false && receipt.isPrerelease === false && receipt.source && receipt.tag && url.protocol==='https:' && url.hostname==='github.com' && url.pathname.startsWith('/Ding-Ding-Projects/jackson-chung/')) {autoUpdater.setFeedURL({url:url.href}); autoUpdater.checkForUpdates();} } catch {}
  });
  app.on('window-all-closed',()=>app.quit());
}
