const { app, BrowserWindow, protocol, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { setupIpcHandlers, getStoredDownloadPath } = require('./ipcHandlers.cjs');
require('./ipcHandlers.cjs');  // 确保这行存在，它会加载所有的 IPC 处理程序

console.log('Electron main process starting...');

let win;

function createWindow() {
    console.log('Creating Electron window...');
    win = new BrowserWindow({
        width: 1000,
        height: 1000,
        minWidth: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
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
    });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
    });

    setupIpcHandlers(win);

    // 添加这行来测试日志功能
    win.webContents.on('did-finish-load', () => {
        win.webContents.send('log-message', 'Window loaded successfully');
    });
}

app.whenReady().then(async () => {
    const downloadDir = await getStoredDownloadPath();
    protocol.registerFileProtocol('local-file', (request, callback) => {
        const url = request.url.replace('local-file://', '');
        const decodedUrl = decodeURI(url);
        try {
            return callback(decodedUrl);
        } catch (error) {
            console.error('ERROR: registerFileProtocol:', error);
        }
    });
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