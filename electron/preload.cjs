const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    xiaohongshuDownloader: (startPosition, endPosition) => {
        ipcRenderer.send('xiaohongshu-download', startPosition, endPosition);
    }
});