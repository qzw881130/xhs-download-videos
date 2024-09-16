const { ipcMain, shell, BrowserWindow, dialog, app } = require('electron');
const path = require('path');
const fs = require('fs-extra');  // 请确保安装了 fs-extra 包
const { spawn } = require('child_process');
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
}

function xiaohongshuDownloader(startPosition, endPosition, downloadDir, dbPath, type) {
    console.log(`开始下载，从 ${startPosition} 到 ${endPosition}`);
    const { spawn } = require('child_process');
    const path = require('path');
    const downloaderPath = path.join(__dirname, 'xiaohongshu_downloader.mjs');

    const downloader = spawn('node', [downloaderPath, '--scrollAttempts', startPosition, '--maxScrollAttempts', endPosition, '--downloadDir', downloadDir, '--dbPath', dbPath, '--type', type]);

    downloader.stdout.on('data', (data) => {
        const message = `下载器输出: ${data.toString().trim()}`;
        console.log(message); // 添加这行来检查消息是否被记录
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

module.exports = { setupIpcHandlers, getStoredDownloadPath };