const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

console.log('Electron main process starting...');

function xiaohongshuDownloader(startPosition, endPosition) {
    console.log(`开始下载，从 ${startPosition} 到 ${endPosition}`);
    // 这里添加实际的下载逻辑
}

function createWindow() {
    console.log('Creating Electron window...');
    const win = new BrowserWindow({
        width: 1000,
        height: 600,
        minWidth: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        },
    });

    const url = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;
    console.log('Loading URL:', url);

    const loadURL = () => {
        win.loadURL(url).then(() => {
            console.log('URL loaded successfully');
            win.show();
        }).catch((err) => {
            console.error('Failed to load URL:', err);
            setTimeout(loadURL, 1000);
        });
    };

    loadURL();

    if (isDev) {
        win.webContents.openDevTools();
    }

    win.on('ready-to-show', () => {
        console.log('Window is ready to show');
        win.show();
    });

    win.webContents.on('did-finish-load', () => {
        win.webContents.setZoomFactor(1);
        win.webContents.setVisualZoomLevelLimits(1, 1);
        win.webContents.setLayoutZoomLevelLimits(0, 0);
    });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
    });
}

ipcMain.on('xiaohongshu-download', (event, startPosition, endPosition) => {
    xiaohongshuDownloader(startPosition, endPosition);
});

app.on('ready', () => {
    console.log('App is ready');
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});