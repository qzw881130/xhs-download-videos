const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const sqlite3 = require('sqlite3').verbose();

console.log('Electron main process starting...');

// 定义全局 win 变量
let win;

function xiaohongshuDownloader(startPosition, endPosition, downloadDir, dbPath, type) {
    console.log(`开始下载，从 ${startPosition} 到 ${endPosition}`);
    const { spawn } = require('child_process');
    const downloaderPath = path.join(__dirname, 'xiaohongshu_downloader.mjs');

    const downloader = spawn('node', [downloaderPath, '--start', startPosition, '--end', endPosition, '--downloadDir', downloadDir, '--dbPath', dbPath, '--type', type]);


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
        const defaultDownloadDir = path.join(__dirname, '..', 'downloads');
        const result = await getLikedVideos(page, pageSize);
        const modifiedResult = {
            ...result,
            videos: result.videos.map(video => ({
                ...video,
                image_src: `local-file://${path.join(defaultDownloadDir, `img_${video.vid}.jpg`).replace(/\\/g, '/')}`
            }))
        };
        console.log('get-liked-videos result:', modifiedResult);
        return modifiedResult;
    } catch (error) {
        console.error('Error getting liked videos:', error);
        throw error;
    }
});

ipcMain.on('xiaohongshu-download', (event, startPosition, endPosition, type) => {
    const defaultDownloadDir = path.join(__dirname, '..', 'downloads');
    const defaultDbPath = path.join(__dirname, '..', 'xhs-liked-videos.db');
    const downloadDirectory = defaultDownloadDir;
    const dbFilePath = defaultDbPath;
    console.log('params=', { startPosition, endPosition, downloadDirectory, dbFilePath, type })
    xiaohongshuDownloader(startPosition, endPosition, downloadDirectory, dbFilePath, type);
});

// 在 app.on('ready', ...) 之前添加这段代码
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

// Add new IPC handler for opening video player
ipcMain.handle('open-video-player', (event, vid) => {
    const playerWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: `视频播放器 - ${vid}`,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (isDev) {
        playerWindow.loadURL(`http://localhost:5173/#/video-player/${vid}`);
    } else {
        playerWindow.loadURL(`${app.getAppPath()}/dist/index.html#/video-player/${vid}`);
    }

    // 打开 Chrome 开发者工具
    playerWindow.webContents.openDevTools();
});

// Modify the getVideoDetails function to include adjacent videos
async function getVideoDetails(vid) {
    return new Promise(async (resolve, reject) => {
        const db = new sqlite3.Database(path.join(__dirname, '..', 'xhs-liked-videos.db'), async (err) => {
            if (err) {
                reject(`Error opening database: ${err.message}`);
                return;
            }

            try {
                const mainQuery = 'SELECT * FROM videos WHERE vid = ?';
                const adjacentQuery = `
                    SELECT id, vid, title FROM videos
                    WHERE id < (SELECT id FROM videos WHERE vid = ?)
                    ORDER BY id DESC
                    LIMIT 10
                `;

                const [row, adjacentVideos] = await Promise.all([
                    dbGet(db, mainQuery, [vid]),
                    dbAll(db, adjacentQuery, [vid])
                ]);

                if (!row) {
                    reject(`No video found with vid: ${vid}`);
                    return;
                }

                const defaultDownloadDir = path.join(__dirname, '..', 'downloads');
                const videoDetails = {
                    ...row,
                    image_src: `local-file://${path.join(defaultDownloadDir, `img_${row.vid}.jpg`).replace(/\\/g, '/')}`,
                    video_src: `local-file://${path.join(defaultDownloadDir, `video_${row.vid}.mp4`).replace(/\\/g, '/')}`,
                    adjacentVideos: adjacentVideos.map(v => ({
                        ...v,
                        image_src: `local-file://${path.join(defaultDownloadDir, `img_${v.vid}.jpg`).replace(/\\/g, '/')}`
                    }))
                };

                resolve(videoDetails);
            } catch (error) {
                reject(`Error querying database: ${error.message}`);
            } finally {
                db.close();
            }
        });
    });
}

// Helper functions for database operations
function dbGet(db, query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function dbAll(db, query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Add this IPC handler
ipcMain.handle('get-video-details', async (event, vid) => {
    try {
        const videoDetails = await getVideoDetails(vid);
        console.log('get-video-details result:', videoDetails);
        return videoDetails;
    } catch (error) {
        console.error('Error getting video details:', error);
        throw error;
    }
});

// Add this function to get the next or previous video
async function getAdjacentVideo(currentVid, direction) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(path.join(__dirname, '..', 'xhs-liked-videos.db'), (err) => {
            if (err) {
                reject(`Error opening database: ${err.message}`);
                return;
            }
        });

        const query = direction === 'next'
            ? 'SELECT vid FROM videos WHERE created_at < (SELECT created_at FROM videos WHERE vid = ?) ORDER BY created_at DESC LIMIT 1'
            : 'SELECT vid FROM videos WHERE created_at > (SELECT created_at FROM videos WHERE vid = ?) ORDER BY created_at ASC LIMIT 1';

        db.get(query, [currentVid], (err, row) => {
            db.close();
            if (err) {
                reject(`Error querying database: ${err.message}`);
                return;
            }
            resolve(row ? row.vid : null);
        });
    });
}

// Add this IPC handler
ipcMain.handle('navigate-video', async (event, currentVid, direction) => {
    try {
        const adjacentVid = await getAdjacentVideo(currentVid, direction);
        if (adjacentVid) {
            return adjacentVid;
        } else {
            return null; // Instead of throwing an error, return null when there's no adjacent video
        }
    } catch (error) {
        console.error(`Error navigating to ${direction} video:`, error);
        throw error;
    }
});

// 添加这个函数来获取统计信息
function getStatistics() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(path.join(__dirname, '..', 'xhs-liked-videos.db'), (err) => {
            if (err) {
                reject(`Error opening database: ${err.message}`);
                return;
            }
        });

        const query = `
            SELECT 
                SUM(CASE WHEN type = 'liked' THEN 1 ELSE 0 END) as likedCount,
                SUM(CASE WHEN type = 'collected' THEN 1 ELSE 0 END) as collectedCount,
                SUM(CASE WHEN type = 'post' THEN 1 ELSE 0 END) as postCount,
                MAX(created_at) as lastUpdateTime
            FROM videos
        `;

        db.get(query, [], (err, row) => {
            db.close();
            if (err) {
                reject(`Error querying database: ${err.message}`);
                return;
            }
            resolve({
                ...row,
                lastUpdateTime: new Date().toISOString() // 使用当前时间作为更新时间
            });
        });
    });
}

// 添加���个 IPC 处理程序
ipcMain.handle('get-statistics', async (event) => {
    try {
        const statistics = await getStatistics();
        return statistics;
    } catch (error) {
        console.error('Error getting statistics:', error);
        throw error;
    }
});