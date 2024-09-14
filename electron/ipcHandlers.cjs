const { ipcMain, shell, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { getLikedVideos, getVideoDetails, getAdjacentVideo, getStatistics } = require('./database.cjs');
const isDev = require('electron-is-dev');

function xiaohongshuDownloader(startPosition, endPosition, downloadDir, dbPath, type) {
    console.log(`开始下载，从 ${startPosition} 到 ${endPosition}`);
    const downloaderPath = path.join(__dirname, 'xiaohongshu_downloader.mjs');

    const downloader = spawn('node', [downloaderPath, '--scrollAttempts', startPosition, '--maxScrollAttempts', endPosition, '--downloadDir', downloadDir, '--dbPath', dbPath, '--type', type]);

    downloader.stdout.on('data', (data) => {
        const message = `下载器输出: ${data.toString().trim()}`;
        console.log(message);
        // Note: We can't use 'win' here as it's not in scope. We'll need to handle this differently.
    });

    downloader.stderr.on('data', (data) => {
        const message = `下载器错误: ${data.toString().trim()}`;
        console.error(message);
    });

    downloader.on('close', (code) => {
        const message = `下载器进程退出，退出码 ${code}`;
        console.log(message);
    });
}

function setupIpcHandlers(win) {
    ipcMain.handle('get-liked-videos', async (event, page, pageSize, type, keyword) => {
        try {
            const defaultDownloadDir = path.join(__dirname, '..', 'downloads');
            const result = await getLikedVideos(page, pageSize, type, keyword);
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

    ipcMain.handle('get-video-details', async (event, vid) => {
        try {
            const videoDetails = await getVideoDetails(vid);
            const defaultDownloadDir = path.join(__dirname, '..', 'downloads');
            const modifiedVideoDetails = {
                ...videoDetails,
                image_src: `local-file://${path.join(defaultDownloadDir, `img_${videoDetails.vid}.jpg`).replace(/\\/g, '/')}`,
                video_src: `local-file://${path.join(defaultDownloadDir, `video_${videoDetails.vid}.mp4`).replace(/\\/g, '/')}`,
                adjacentVideos: videoDetails.adjacentVideos.map(v => ({
                    ...v,
                    image_src: `local-file://${path.join(defaultDownloadDir, `img_${v.vid}.jpg`).replace(/\\/g, '/')}`
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
            const adjacentVid = await getAdjacentVideo(currentVid, direction, type);
            return adjacentVid;
        } catch (error) {
            console.error(`Error navigating to ${direction} video:`, error);
            throw error;
        }
    });

    ipcMain.handle('get-statistics', async (event) => {
        try {
            const statistics = await getStatistics();
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

    ipcMain.on('xiaohongshu-download', (event, startPosition, endPosition, type) => {
        const defaultDownloadDir = path.join(__dirname, '..', 'downloads');
        const defaultDbPath = path.join(__dirname, '..', 'xhs-liked-videos.db');
        const downloadDirectory = defaultDownloadDir;
        const dbFilePath = defaultDbPath;
        console.log('params=', { startPosition, endPosition, downloadDirectory, dbFilePath, type })
        xiaohongshuDownloader(startPosition, endPosition, downloadDirectory, dbFilePath, type);
    });

    // Add these event listeners to handle log messages
    ipcMain.on('log-message', (event, message) => {
        win.webContents.send('log-message', message);
    });
}

module.exports = { setupIpcHandlers };