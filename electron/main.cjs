const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const sqlite3 = require('sqlite3').verbose();

console.log('Electron main process starting...');

// 定义全局 win 变量
let win;

function xiaohongshuDownloader(startPosition, endPosition, downloadDir, dbPath) {
    console.log(`开始下载，从 ${startPosition} 到 ${endPosition}`);
    const { spawn } = require('child_process');
    const downloaderPath = path.join(__dirname, 'xiaohongshu_downloader.mjs');

    const downloader = spawn('node', [downloaderPath, '--start', startPosition, '--end', endPosition, '--downloadDir', downloadDir, '--dbPath', dbPath]);

    downloader.stdout.on('data', (data) => {
        const message = `下载器输出: ${data.toString().trim()}`;
        // console.log(message);
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
        width: 2000,
        height: 1200,
        minWidth: 1600,
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
        // 移除 setLayoutZoomLevelLimits 方法的调用
    });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
    });
}

// 添加这个函数来获取点赞视频列表
function getLikedVideos(page = 1, pageSize = 20) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(path.join(__dirname, '..', 'xhs-liked-videos.db'), (err) => {
            if (err) {
                reject(`Error opening database: ${err.message}`);
                return;
            }
        });

        const offset = (page - 1) * pageSize;
        const query = `
            SELECT * FROM videos
            WHERE type = 'liked'
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;

        db.all(query, [pageSize, offset], (err, rows) => {
            if (err) {
                db.close();
                reject(`Error querying database: ${err.message}`);
                return;
            }

            db.get('SELECT COUNT(*) as total FROM videos WHERE type = "liked"', (err, result) => {
                db.close();
                if (err) {
                    reject(`Error getting total count: ${err.message}`);
                    return;
                }

                const totalItems = result.total;
                const totalPages = Math.ceil(totalItems / pageSize);

                resolve({
                    videos: rows,
                    pagination: {
                        currentPage: page,
                        totalPages: totalPages,
                        totalItems: totalItems,
                        pageSize: pageSize
                    }
                });
            });
        });
    });
}

// 添加 IPC 处理程序
ipcMain.handle('get-liked-videos', async (event, page, pageSize) => {
    try {
        const result = await getLikedVideos(page, pageSize);
        return result;
    } catch (error) {
        console.error('Error getting liked videos:', error);
        throw error;
    }
});

ipcMain.on('xiaohongshu-download', (event, startPosition, endPosition, downloadDir) => {
    const defaultDownloadDir = path.join(__dirname, '..', 'downloads');
    const defaultDbPath = path.join(__dirname, '..', 'xhs-liked-videos.db');
    const downloadDirectory = downloadDir || defaultDownloadDir;
    const dbFilePath = defaultDbPath;
    xiaohongshuDownloader(startPosition, endPosition, downloadDirectory, dbFilePath);
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