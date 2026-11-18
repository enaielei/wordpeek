const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wordpeek', {
  lookup: (word) => ipcRenderer.invoke('dictionary:lookup', word),
  google: (word) => ipcRenderer.invoke('browser:google', word),
  source: (url) => ipcRenderer.invoke('browser:source', url),
  resize: (height) => ipcRenderer.invoke('window:resize', height),
  hide: () => ipcRenderer.invoke('window:hide'),
  context: () => ipcRenderer.invoke('selection:context'),
  settings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  onSelection: (callback) => {
    const listener = (_event, context) => callback(context);
    ipcRenderer.on('selection:changed', listener);
    return () => ipcRenderer.removeListener('selection:changed', listener);
  },
});
