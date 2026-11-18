const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wordpeek', {
  lookup: (word) => ipcRenderer.invoke('dictionary:lookup', word),
  search: (word) => ipcRenderer.invoke('browser:search', word),
  source: (url) => ipcRenderer.invoke('browser:source', url),
  resize: (height) => ipcRenderer.invoke('window:resize', height),
  hide: () => ipcRenderer.invoke('window:hide'),
  context: () => ipcRenderer.invoke('selection:context'),
  settings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  onSettingsChanged: (callback) => {
    const listener = (_event, settings) => callback(settings);
    ipcRenderer.on('settings:changed', listener);
    return () => ipcRenderer.removeListener('settings:changed', listener);
  },
  onOpenSettings: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('window:settings', listener);
    return () => ipcRenderer.removeListener('window:settings', listener);
  },
  onSelection: (callback) => {
    const listener = (_event, context) => callback(context);
    ipcRenderer.on('selection:changed', listener);
    return () => ipcRenderer.removeListener('selection:changed', listener);
  },
});
