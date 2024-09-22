const { createClient } = require('@supabase/supabase-js');
const { getLikedVideos, openDatabase, dbGet, dbAll } = require('./database.cjs');
const { ipcMain } = require('electron');

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
let syncInterval;

let win;
async function syncServer() {
    try {
        const db = openDatabase();
        console.log('start sync....syncServer')
        let localTotal = 0;
        let remoteTotal = 0;
        let pendingSync = 0;

        // 获取总行数
        try {
            const countResult = await dbGet(db, "SELECT COUNT(*) as count FROM videos", []);
            // const countResult = await db.get("SELECT COUNT(*) as count FROM videos", []);
            console.log('countResult===', countResult)
            localTotal = countResult.count;
        } catch (err) {
            console.error('Error fetching total count from videos table:', err.message);
            throw err; // Rethrow the error to be handled by the outer try-catch
        }

        // 使用游标逐行读取数据
        const batchSize = 100; // 每批处理的行数
        let offset = 0;

        while (offset < localTotal) {
            console.log('offset:', offset, 'batchSize:', batchSize, 'localTotal:', localTotal);
            const rows = await dbAll(db, `SELECT * FROM videos LIMIT ? OFFSET ?`, [batchSize, offset]);
            if (rows.length === 0) break;

            // 同步到 Supabase
            const { data, error } = await supabase
                .from('videos')
                .upsert(rows);

            console.log('data===', data, 'error===', error);
            if (error) throw error;

            remoteTotal += data.length;
            pendingSync = localTotal - remoteTotal;

            // 更新进度
            win.webContents.send('sync-statistics-update', {
                localTotal,
                remoteTotal,
                pendingSync
            });

            offset += batchSize;
        }

        win.webContents.send('last-sync-time-update', new Date().toISOString());
        win.webContents.send('log-message', 'Sync completed successfully');
    } catch (error) {
        console.error('sync error', error);
        win.webContents.send('log-message', `Sync error: ${error.message}`);
    }
}

function setupSyncServerHandlers(browserWindow) {
    win = browserWindow;
    ipcMain.on('start-sync-server', (event) => {
        console.log('start sync....')
        if (syncInterval) {
            return; // 如果同步服务器已经在运行，则不做任何操作
        }

        event.reply('sync-server-status-change', 'running');

        (async () => {
            await syncServer();
            event.reply('sync-server-status-change', 'stopped');
        })()
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