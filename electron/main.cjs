const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { setupIpcHandlers } = require('./ipcHandlers.cjs');

console.log('Electron main process starting...');

let win;

function xiaohongshuDownloader(startPosition, endPosition, downloadDir, dbPath, type) {
    console.log(`开始下载，从 ${startPosition} 到 ${endPosition}`);
    const { spawn } = require('child_process');
    const downloaderPath = path.join(__dirname, 'xiaohongshu_downloader.mjs');

    const downloader = spawn('node', [downloaderPath, '--scrollAttempts', startPosition, '--maxScrollAttempts', endPosition, '--downloadDir', downloadDir, '--dbPath', dbPath, '--type', type]);

    downloader.stdout.on('data', (data) => {
        const message = `下载器输出: ${data.toString().trim()}`;
        if (win && !win.isDestroyed()) {
            win.webContents.send('log-message', message);
        }
    });

    downloader.stderr.on('data', (data) => {
        const message = `下载器错误: ${data.toString().trim()}`;
        console.error(message);
        if (win && !win.isDestroyed()) {
            win.webContents.send('log-message', message);
        }
    });

    downloader.on('close', (code) => {
        const message = `下载器进程退出，退出码 ${code}`;
        console.log(message);
        if (win && !win.isDestroyed()) {
            win.webContents.send('log-message', message);
        }
    });
}

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
}

app.whenReady().then(() => {
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