const { app, BrowserWindow, protocol, shell, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { setupIpcHandlers, getStoredDownloadPath } = require('./ipcHandlers.cjs');
require('./ipcHandlers.cjs');  // 确保这行存在，它会加载所有的 IPC 处理程序

const { fork } = require('child_process');
console.log('Electron main process starting...');

let win;

function createWindow() {
    console.log('Creating Electron window...');
    win = new BrowserWindow({
        width: 1000,
        height: 1000,
        minWidth: 800,
        webPreferences: {
            nodeIntegration: false,
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

    if (isDev || true) {
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

    win.webContents.on('did-finish-load', () => {
        // console.log('Window finished loading, sending test messages');
        // win.webContents.send('log-message', '这是一条来自 main.cjs 的测试消息');
        // win.webContents.send('console-log', '这是一条来自 main.cjs console-log 的测试消息');
    });

    // 添加这行来测试日志功能
    win.webContents.on('did-finish-load', () => {
        // win.webContents.send('log-message', 'Window loaded successfully');
    });

    // 在这里调用 setupIpcHandlers，并传入 win 对象
    setupIpcHandlers(win);

    // 添加这些 IPC 监听器
    ipcMain.on('log', (event, message) => {
        win.webContents.send('console-log', message);
    });

    ipcMain.on('error', (event, message) => {
        win.webContents.send('console-error', message);
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
    // installPuppeteer();
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

function installPuppeteer() {
    const installScriptPath = path.join(__dirname, '..', 'node_modules', 'puppeteer', 'install.mjs');
    const installProcess = fork(installScriptPath);

    installProcess.on('exit', (code) => {
        if (code === 0) {
            console.log('Puppeteer installation completed successfully');
        } else {
            console.error(`Puppeteer installation failed with code ${code}`);
        }
    });

    installProcess.on('error', (err) => {
        console.error('Error occurred while running Puppeteer install script:', err);
    });
}
