const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFiles: () => ipcRenderer.invoke('dialog:selectFiles'),
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  wipeFiles: (filePaths) => ipcRenderer.invoke('wipe:files', filePaths),
  wipeFreeSpace: (drive) => ipcRenderer.invoke('wipe:freeSpace', drive),
  generateCertificate: (data) => ipcRenderer.invoke('certificate:generate', data),
});
