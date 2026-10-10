'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('jacksonNative', Object.freeze({
  capabilities: () => ipcRenderer.invoke('native:capabilities'),
  request: (operation,input) => ipcRenderer.invoke('native:request',operation,input)
}));
