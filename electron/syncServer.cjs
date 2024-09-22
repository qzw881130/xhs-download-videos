const { createClient } = require('@supabase/supabase-js');
const { getLikedVideos } = require('./database.cjs');

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
let syncInterval;

function setupSyncServerHandlers(ipcMain, win) {
    ipcMain.on('start-sync-server', (event) => {
        if (syncInterval) {
            return; // 如果同步服务器已经在运行，则不做任何操作
        }

        event.reply('sync-server-status-change', 'running');

        syncInterval = setInterval(() => {
            (async () => {
                try {
                    // 使用 getLikedVideos 函数获取所有视频
                    const { videos: localVideos, total } = await getLikedVideos(1, Number.MAX_SAFE_INTEGER, '');
                    console.log('local-total', total);

                    // 同步到 Supabase
                    const { data, error } = await supabase
                        .from('videos')
                        .upsert(localVideos);

                    if (error) throw error;

                    // 更新统计信息
                    win.webContents.send('sync-statistics-update', {
                        localTotal: total,
                        remoteTotal: data.length,
                        pendingSync: total - data.length
                    });

                    win.webContents.send('last-sync-time-update', new Date().toISOString());
                    win.webContents.send('log-message', 'Sync completed successfully');
                } catch (error) {
                    win.webContents.send('log-message', `Sync error: ${error.message}`);
                }
            })();
        }, 60000); // 每分钟同步一次
    });

    ipcMain.on('stop-sync-server', (event) => {
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
            event.reply('sync-server-status-change', 'stopped');
            event.reply('log-message', 'Sync server stopped');
        }
    });
}

module.exports = { setupSyncServerHandlers };