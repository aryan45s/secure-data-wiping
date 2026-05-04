const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { wipeFile, wipeFreeSpace } = require('./wiping.cjs');
const { generateCertificate } = require('./certificate.cjs');

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('dialog:selectFiles', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    title: 'Select Files to Wipe'
  });
  return result.filePaths;
});

ipcMain.handle('dialog:selectDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Directory to Wipe'
  });
  return result.filePaths;
});

ipcMain.handle('wipe:files', async (event, filePaths) => {
  try {
    const results = [];
    const allFiles = [];
    
    for (const p of filePaths) {
      const stats = require('fs').statSync(p);
      if (stats.isDirectory()) {
        const { getAllFiles } = require('./wiping.cjs');
        allFiles.push(...getAllFiles(p));
      } else {
        allFiles.push(p);
      }
    }

    for (const filePath of allFiles) {
      const result = await wipeFile(filePath);
      results.push(result);
    }
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('wipe:freeSpace', async (event, drive) => {
  try {
    await wipeFreeSpace(drive);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('certificate:generate', async (event, data) => {
  try {
    const certPath = await generateCertificate(data);
    return { success: true, path: certPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
