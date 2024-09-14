const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    xiaohongshuDownloader: (startPosition, endPosition, type) => {
        ipcRenderer.send('xiaohongshu-download', startPosition, endPosition, type);
    },
    onLogMessage: (callback) => ipcRenderer.on('log-message', (_, message) => callback(message)),
    getLikedVideos: (page, pageSize, type, keyword) => ipcRenderer.invoke('get-liked-videos', page, pageSize, type, keyword),
    openVideoPlayer: (vid) => ipcRenderer.invoke('open-video-player', vid),
    getVideoDetails: (vid) => ipcRenderer.invoke('get-video-details', vid),
    navigateVideo: (currentVid, direction) => ipcRenderer.invoke('navigate-video', currentVid, direction),
    getStatistics: () => ipcRenderer.invoke('get-statistics'),
});