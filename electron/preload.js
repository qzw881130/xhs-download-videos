const { contextBridge, ipcRenderer } = require('electron');

let dbPath;
ipcRenderer.on('set-db-path', (event, path) => {
    dbPath = path;
});

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
    startDownloader: (startPosition, endPosition, type, syncServer) =>
        ipcRenderer.invoke('start-downloader', startPosition, endPosition, type, syncServer),
    removeLogMessageListener: () => ipcRenderer.removeAllListeners('log-message'),
    getDefaultDownloadPath: () => ipcRenderer.invoke('get-default-download-path'),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    setStoredDownloadPath: (path) => ipcRenderer.invoke('set-stored-download-path', path),
    getStoredDownloadPath: () => ipcRenderer.invoke('get-stored-download-path'),
    getDbPath: () => ipcRenderer.invoke('get-db-path'),
    getConfigPath: () => ipcRenderer.invoke('get-config-path'), // 新增这一行
    appPath: () => ipcRenderer.invoke('app-path'), // 新增这一行
    log: (message) => ipcRenderer.send('log', message),
    error: (message) => ipcRenderer.send('error', message),
    ipcRenderer: {
        on: (channel, func) => {
            console.log(`Setting up listener for channel: ${channel}`);
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        },
        send: (channel, data) => ipcRenderer.send(channel, data),
        removeListener: (channel, func) => ipcRenderer.removeListener(channel, func),
        removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
    },
    openDirectory: () => ipcRenderer.invoke('open-directory'),
    saveLanguageSetting: (language) => ipcRenderer.invoke('save-language-setting', language),
    getLanguageSetting: () => ipcRenderer.invoke('get-language-setting'),
    hideVideo: (vid) => ipcRenderer.invoke('hide-video', vid),

    // 添加新的同步服务器相关函数
    startSyncServer: () => ipcRenderer.send('start-sync-server'),
    stopSyncServer: () => ipcRenderer.send('stop-sync-server'),

    onSyncServerStatusChange: (callback) => ipcRenderer.on('sync-server-status-change', (_, status) => callback(status)),
    removeSyncServerStatusChangeListener: () => ipcRenderer.removeAllListeners('sync-server-status-change'),

    onSyncStatisticsUpdate: (callback) => ipcRenderer.on('syncStatisticsUpdate', (event, stats) => callback(stats)),
    removeSyncStatisticsUpdateListener: () => ipcRenderer.removeAllListeners('sync-statistics-update'),

    onLastSyncTimeUpdate: (callback) => ipcRenderer.on('last-sync-time-update', (_, time) => callback(time)),
    removeLastSyncTimeUpdateListener: () => ipcRenderer.removeAllListeners('last-sync-time-update'),

    // 确保暴露 requestSyncStatistics 方法
    requestSyncStatistics: () => ipcRenderer.send('requestSyncStatistics'),
    getUserEmail: () => ipcRenderer.invoke('get-user-email'),
    storeUserEmail: (email) => ipcRenderer.invoke('store-user-email', email), // 使用 invoke 而不是 send
    getIsDownloadVideo: () => ipcRenderer.invoke('get-is-download-video'),
    storeIsDownloadVideo: (isDownloadVideo) => ipcRenderer.invoke('store-is-download-video', isDownloadVideo), // 使用 invoke 而不是 send

    // 添加 Supabase 相关方法
    supabaseSignUp: (email, password) => ipcRenderer.invoke('supabase-sign-up', email, password),
    supabaseSignIn: (email, password) => ipcRenderer.invoke('supabase-sign-in', email, password),
    supabaseSignOut: () => ipcRenderer.invoke('supabase-sign-out'),
    supabaseGetUser: () => ipcRenderer.invoke('supabase-get-user'),
    supabaseSignInWithProvider: (provider) => ipcRenderer.invoke('supabase-sign-in-with-provider', provider),
    openAuthWindow: (url) => ipcRenderer.invoke('open-auth-window', url),
    onOAuthCallback: (callback) => ipcRenderer.on('oauth-callback', (_, code) => callback(code)),
    supabaseExchangeCodeForSession: (code) => ipcRenderer.invoke('supabase-exchange-code-for-session', code),
});

console.log('Preload script executed');