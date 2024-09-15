const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    xiaohongshuDownloader: (startPosition, endPosition, type) => {
        ipcRenderer.send('xiaohongshu-download', startPosition, endPosition, type);
    },
    onLogMessage: (callback) => ipcRenderer.on('log-message', (_, message) => callback(message)),
    getLikedVideos: (page, pageSize, type, keyword) => ipcRenderer.invoke('get-liked-videos', page, pageSize, type, keyword),
    openVideoPlayer: (vid) => ipcRenderer.invoke('open-video-player', vid),
    getVideoDetails: (vid) => ipcRenderer.invoke('get-video-details', vid),
    navigateVideo: (currentVid, direction, type) => ipcRenderer.invoke('navigate-video', currentVid, direction, type),
    getStatistics: () => ipcRenderer.invoke('get-statistics'),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    startDownloader: (startPosition, endPosition, dbPath, type) =>
        ipcRenderer.invoke('start-downloader', startPosition, endPosition, dbPath, type),
    removeLogMessageListener: () => ipcRenderer.removeAllListeners('log-message'),
    getDefaultDownloadPath: () => ipcRenderer.invoke('get-default-download-path'),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    setStoredDownloadPath: (path) => ipcRenderer.invoke('set-stored-download-path', path),
    getStoredDownloadPath: () => ipcRenderer.invoke('get-stored-download-path'),
});