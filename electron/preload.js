const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    xiaohongshuDownloader: (startPosition, endPosition) => {
        ipcRenderer.send('xiaohongshu-download', startPosition, endPosition);
    },
    onLogMessage: (callback) => ipcRenderer.on('log-message', (_, message) => callback(message)),
    getLikedVideos: (page, pageSize) => ipcRenderer.invoke('get-liked-videos', page, pageSize),
});