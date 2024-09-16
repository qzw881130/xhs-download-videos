const { ipcMain, shell, BrowserWindow, dialog, app } = require('electron');
const path = require('path');
const fs = require('fs-extra');  // 请确保安装了 fs-extra 包
const { fork } = require('child_process');
const { getLikedVideos, getVideoDetails, getAdjacentVideo, getStatistics, getRandomVideo, getDbPath } = require('./database.cjs');
const isDev = require('electron-is-dev');

let win;

async function getStoredDownloadPath() {
    const downloadPathFile = getDownloadPathFile();
    try {
        const data = JSON.parse(fs.readFileSync(downloadPathFile, 'utf8'));
        return data.downloadPath || path.join(app.getPath('userData'), 'downloads');
    } catch (error) {
        console.error('Error reading download path file:', error);
        return path.join(app.getPath('userData'), 'downloads');
    }
}

function setupIpcHandlers(browserWindow) {
    win = browserWindow;

    ipcMain.handle('get-liked-videos', async (event, page, pageSize, type, keyword) => {
        try {
            const downloadDir = await getStoredDownloadPath();
            console.log('Attempting to get liked videos');
            const result = await getLikedVideos(page, pageSize, type, keyword);
            console.log('Successfully got liked videos');
            const modifiedResult = {
                ...result,
                videos: result.videos.map(video => ({
                    ...video,
                    image_src: `local-file://${path.join(downloadDir, `img_${video.vid}.jpg`).replace(/\\/g, '/')}`
                }))
            };
            console.log('get-liked-videos result:', modifiedResult);
            return modifiedResult;
        } catch (error) {
            console.error('Error in get-liked-videos handler:', error);
            throw error;
        }
    });

    ipcMain.handle('get-video-details', async (event, vid) => {
        try {
            const videoDetails = await getVideoDetails(vid);
            const downloadDir = await getStoredDownloadPath();
            const modifiedVideoDetails = {
                ...videoDetails,
                image_src: `local-file://${path.join(downloadDir, `img_${videoDetails.vid}.jpg`).replace(/\\/g, '/')}`,
                video_src: `local-file://${path.join(downloadDir, `video_${videoDetails.vid}.mp4`).replace(/\\/g, '/')}`,
                adjacentVideos: videoDetails.adjacentVideos.map(v => ({
                    ...v,
                    image_src: `local-file://${path.join(downloadDir, `img_${v.vid}.jpg`).replace(/\\/g, '/')}`
                }))
            };
            console.log('get-video-details result:', modifiedVideoDetails);
            return modifiedVideoDetails;
        } catch (error) {
            console.error('Error getting video details:', error);
            throw error;
        }
    });

    ipcMain.handle('navigate-video', async (event, currentVid, direction, type) => {
        try {
            let adjacentVid;
            if (direction === 'random') {
                adjacentVid = await getRandomVideo(type);
            } else {
                adjacentVid = await getAdjacentVideo(currentVid, direction, type);
            }
            return adjacentVid;
        } catch (error) {
            console.error(`Error navigating to ${direction} video:`, error);
            throw error;
        }
    });

    ipcMain.handle('get-statistics', async (event) => {
        try {
            const downloadDir = await getStoredDownloadPath();
            const statistics = await getStatistics(downloadDir);
            return statistics;
        } catch (error) {
            console.error('Error getting statistics:', error);
            win.webContents.send('console-error', `Error getting statistics: ${error.message}`);
            throw error;
        }
    });

    ipcMain.handle('open-external', async (event, url) => {
        await shell.openExternal(url);
    });

    ipcMain.handle('open-video-player', (event, vid) => {
        const playerWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
            },
        });


        const url = isDev
            ? `http://localhost:5173/#/video-player/${vid}`
            : `file://${path.join(__dirname, '../dist/index.html')}#/video-player/${vid}`;
        playerWindow.loadURL(url);

        // 可选：打开开发者工具
        playerWindow.webContents.openDevTools();
    });

    ipcMain.handle('start-downloader', async (event, startPosition, endPosition, type) => {
        // 向页面发送测试消息
        // if (win && !win.isDestroyed()) {
        //     win.webContents.send('log-message', '这是一条来自 ipcHandlers.cjs [start-downloader]的测试消息');
        // }
        const downloadDir = await getStoredDownloadPath();
        const dbPath = getDbPath();
        xiaohongshuDownloader(startPosition, endPosition, downloadDir, dbPath, type);
    });

    ipcMain.handle('get-default-download-path', () => {
        return path.join(app.getPath('userData'), 'downloads');
    });

    ipcMain.handle('select-directory', async () => {
        const result = await dialog.showOpenDialog(browserWindow, {
            properties: ['openDirectory']
        });
        if (result.canceled) {
            return null;
        } else {
            return result.filePaths[0];
        }
    });

    ipcMain.handle('set-stored-download-path', async (event, newPath) => {
        ensureDownloadPathFileExists();
        const downloadPathFile = getDownloadPathFile();
        let data = { downloadPath: '' };
        try {
            data = JSON.parse(fs.readFileSync(downloadPathFile, 'utf8'));
        } catch (error) {
            console.error('Error reading download path file:', error);
        }

        const oldPath = data.downloadPath;

        if (oldPath !== newPath) {
            try {
                // 确保新路径存在
                await fs.ensureDir(newPath);

                // 如果旧路径存在且不为空，则复制文件
                if (oldPath && fs.existsSync(oldPath)) {
                    const files = await fs.readdir(oldPath);
                    for (const file of files) {
                        if (file.endsWith('.jpg') || file.endsWith('.mp4')) {
                            const srcPath = path.join(oldPath, file);
                            const destPath = path.join(newPath, file);
                            await fs.move(srcPath, destPath);
                        }
                    }
                    console.log(`Image and video files moved from ${oldPath} to ${newPath}`);
                }

                // 更新存储的下载路径
                data.downloadPath = newPath;
                await fs.writeFile(downloadPathFile, JSON.stringify(data, null, 2));
                console.log(`Download path updated to ${newPath}`);

                return true;
            } catch (error) {
                console.error('Error updating download path:', error);
                throw error;
            }
        } else {
            console.log('New path is the same as the old path. No changes made.');
            return false;
        }
    });

    ipcMain.handle('get-stored-download-path', () => {
        ensureDownloadPathFileExists();
        const downloadPathFile = getDownloadPathFile();
        try {
            const data = JSON.parse(fs.readFileSync(downloadPathFile, 'utf8'));
            return data.downloadPath || null;
        } catch (error) {
            console.error('Error reading download path file:', error);
            return null;
        }
    });

    // Add these event listeners to handle log messages
    ipcMain.on('log-message', (event, message) => {
        win.webContents.send('log-message', message);
    });

    // 检查是否已经存在 get-config-path 处理程序
    ipcMain.handle('get-config-path', () => {
        return getDownloadPathFile();
    });

    // 假设这个已经存在
    ipcMain.handle('get-db-path', () => {
        return getDbPath();
    });

    ipcMain.on('log', (event, message) => {
        win.webContents.send('console-log', message);
    });

    ipcMain.on('error', (event, message) => {
        win.webContents.send('console-error', message);
    });

    ipcMain.handle('open-directory', async () => {
        try {
            const downloadDir = await getStoredDownloadPath();
            await shell.openPath(downloadDir);
            return true;
        } catch (error) {
            console.error('Error opening directory:', error);
            return false;
        }
    });

    // 添加新的语言设置相关的处理程序
    ipcMain.handle('save-language-setting', async (event, language) => {
        const configPath = getDownloadPathFile();
        let config = {};
        try {
            const data = await fs.readFile(configPath, 'utf8');
            config = JSON.parse(data);
        } catch (error) {
            // 如果文件不存在或解析失败，使用空对象
        }
        config.language = language;
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    });

    ipcMain.handle('get-language-setting', async (event) => {
        const configPath = getDownloadPathFile();
        try {
            const data = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(data);
            return config.language || 'zh'; // 默认返回中文
        } catch (error) {
            console.error('Error reading language setting:', error);
            return 'zh'; // 如果出错，返回默认语言
        }
    });

    // 添加新的语言设置相关的处理程序
    ipcMain.handle('save-language-setting', async (event, language) => {
        const configPath = getDownloadPathFile();
        let config = {};
        try {
            const data = await fs.readFile(configPath, 'utf8');
            config = JSON.parse(data);
        } catch (error) {
            // 如果文件不存在或解析失败，使用空对象
        }
        config.language = language;
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    });

    ipcMain.handle('get-language-setting', async (event) => {
        const configPath = getDownloadPathFile();
        try {
            const data = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(data);
            return config.language || 'zh'; // 默认返回中文
        } catch (error) {
            console.error('Error reading language setting:', error);
            return 'zh'; // 如果出错，返回默认语言
        }
    });
}

async function getLanguageSetting() {
    const configPath = getDownloadPathFile();
    try {
        const data = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(data);
        return config.language || 'zh'; // 默认返回中文
    } catch (error) {
        console.error('Error reading language setting:', error);
        return 'zh'; // 如果出错，返回默认语言
    }
}

function xiaohongshuDownloader(startPosition, endPosition, downloadDir, dbPath, type) {
    try {
        console.log(`开始下载，从 ${startPosition} 到 ${endPosition}`);
        const downloaderPath = path.join(__dirname, 'xiaohongshu_downloader.mjs');

        let downloader;
        try {
            downloader = fork(downloaderPath, [
                '--scrollAttempts', startPosition,
                '--maxScrollAttempts', endPosition,
                '--downloadDir', downloadDir,
                '--dbPath', dbPath,
                '--type', type,
                '--userDataPath', app.getPath('userData'),
                '--language', getLanguageSetting() // 添加语言参数
            ], {
                env: {
                    ...process.env,
                    ELECTRON_RUN_AS_NODE: '1'
                }
            });

            if (!downloader.pid) {
                throw new Error('Failed to start downloader process');
            }
            console.log(`Downloader process started with PID: ${downloader.pid}`);
            if (win && !win.isDestroyed()) {
                win.webContents.send('log-message', `Downloader process started successfully with PID: ${downloader.pid}`);
            }
        } catch (error) {
            console.error('Error starting downloader:', error.message);
            if (win && !win.isDestroyed()) {
                win.webContents.send('log-message', `Error starting downloader: ${error.message}`);
            }
            return; // Exit the function if fork fails
        }

        downloader.on('message', (message) => {
            console.log(`下载器输出: ${message}`);
            if (win && !win.isDestroyed()) {
                win.webContents.send('log-message', `下载器输出: ${message}`);
            }
        });

        downloader.on('error', (error) => {
            console.error(`下载器错误: ${error.message}`);
            if (win && !win.isDestroyed()) {
                win.webContents.send('log-message', `下载器错误: ${error.message}`);
            }
        });

        downloader.on('exit', (code, signal) => {
            const message = `下载器进程退出，退出码 ${code}, 信号 ${signal}`;
            console.log(message);
            if (win && !win.isDestroyed()) {
                win.webContents.send('log-message', message);
            }
        });
    } catch (err) {
        if (win && !win.isDestroyed()) {
            win.webContents.send('log-message', err.message);
        }
    }
}

function ensureConfigFileExists() {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({}, null, 2));
    }
}

function getDownloadPathFile() {
    const configFile = isDev ? 'download_path.json' : 'download_path_prod.json';
    console.log('Getting download path file', path.join(app.getPath('userData'), configFile));
    return path.join(app.getPath('userData'), configFile);
}

function ensureDownloadPathFileExists() {
    const downloadPathFile = getDownloadPathFile();
    if (!fs.existsSync(downloadPathFile)) {
        fs.writeFileSync(downloadPathFile, JSON.stringify({ downloadPath: '' }, null, 2));
    }
}

module.exports = { setupIpcHandlers, getStoredDownloadPath, getLanguageSetting };