'use strict';
const { contextBridge, ipcRenderer } = require('electron');
let closeListener;
function onCloseRequested(callback){
  if(typeof callback!=='function'||closeListener)throw Error('Close handler unavailable');
  let active=true;
  const listener=async(_event,message)=>{if(!active||!message||Object.keys(message).join(',')!=='requestId'||typeof message.requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(message.requestId))return;let approved=false;try{approved=(await callback())===true;}catch{}if(active)ipcRenderer.send('native:close-response',{requestId:message.requestId,approved});};
  closeListener=listener;ipcRenderer.on('native:close-request',listener);
  return ()=>{if(!active)return;active=false;ipcRenderer.removeListener('native:close-request',listener);if(closeListener===listener)closeListener=undefined;};
}
contextBridge.exposeInMainWorld('jacksonNative', Object.freeze({
  onCloseRequested,
  updater: operation => {if(!['status','check','restart'].includes(operation))throw Error('Unsupported update operation');return ipcRenderer.invoke('native:update',operation);},
  capabilities: () => ipcRenderer.invoke('native:capabilities'),
  request: (operation,input) => ipcRenderer.invoke('native:request',operation,input)
}));
