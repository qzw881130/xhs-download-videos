const { createClient } = require('@supabase/supabase-js');
const { getLikedVideos, openDatabase, dbGet, dbAll, getLocalTotal } = require('./database.cjs');
const { ipcMain } = require('electron');
const { getStoredDownloadPath } = require('./utils.cjs');
const path = require('path');
const fs = require('fs-extra');

const crypto = require('crypto');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY);
console.log('SUPABASE_STORAGE_BUCKET:', process.env.SUPABASE_STORAGE_BUCKET);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
let syncInterval;

let win;
async function syncServer() {
    try {
        const user_id = crypto.createHash('md5').update('qianzhiwei5921@gmail.com').digest('hex');
        const db = openDatabase();
        console.log('start sync....syncServer')
        let localTotal = 0;
        let remoteTotal = 0;
        let pendingSync = 0;

        // 获取总行数
        try {
            const countResult = await dbGet(db, "SELECT COUNT(*) as count FROM videos", []);
            console.log('countResult===', countResult)
            localTotal = countResult.count;
        } catch (err) {
            console.error('Error fetching total count from videos table:', err.message);
            throw err;
        }

        localTotal = 5;
        // 获取本地存储路径
        const downloadPath = await getStoredDownloadPath();

        // 使用游标逐行读取数据
        const batchSize = 5; // 每批处理的行数
        let offset = 0;

        while (offset < localTotal) {
            console.log('offset:', offset, 'batchSize:', batchSize, 'localTotal:', localTotal);
            const rows = await dbAll(db, `SELECT * FROM videos LIMIT ? OFFSET ?`, [batchSize, offset]);
            if (rows.length === 0) break;

            const processedRows = await Promise.all(rows.map(async (row) => {
                // 构建本地图片路径
                const localImagePath = path.join(downloadPath, `img_${row.vid}.jpg`);

                let image_src = '';
                if (fs.existsSync(localImagePath)) {
                    try {
                        const fileBuffer = await fs.readFile(localImagePath);
                        const { data: storageData, error: storageError } = await supabase
                            .storage
                            .from(process.env.SUPABASE_STORAGE_BUCKET)
                            .upload(`images/${row.vid}.jpg`, fileBuffer, {
                                contentType: 'image/jpeg',
                                cacheControl: '3600',
                                upsert: true
                            });

                        if (storageError) {
                            console.error('Error uploading image to Supabase storage:', storageError.message);
                        } else {
                            const { data: publicUrlData, error: publicUrlError } = supabase
                                .storage
                                .from(process.env.SUPABASE_STORAGE_BUCKET)
                                .getPublicUrl(`images/${row.vid}.jpg`);

                            if (publicUrlError) {
                                console.error('Error getting public URL:', publicUrlError.message);
                            } else {
                                // 公共URL
                                image_src = publicUrlData.publicUrl;
                                console.log('Public URL:', image_src);
                            }
                        }

                        console.log('storageData===', storageData, 'storageError===', storageError);
                        console.log('image_src==', image_src)
                    } catch (error) {
                        console.error('Error during image upload:', error);
                    }
                } else {
                    console.log('no exist localimagepath==', localImagePath)
                }


                return { ...row, image_src: image_src, user_id: user_id };
            }));

            // 同步到 Supabase
            const { data, error } = await supabase
                .from('videos')
                .upsert(processedRows);

            if (error) {
                console.error('Error inserting/updating data:', error.message);
            } else {
                console.log('Data inserted/updated successfully:', data);
            }

            // remoteTotal += data.length;
            // pendingSync = localTotal - remoteTotal;

            // // 更新进度
            // win.webContents.send('sync-statistics-update', {
            //     localTotal,
            //     remoteTotal,
            //     pendingSync
            // });

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

async function getSyncStatistics() {
    // 获取本地总数
    const localTotal = await getLocalTotal();
    // 模拟获取远程总数和待同步数
    const remoteTotal = Math.floor(Math.random() * 100);
    const pendingSync = Math.floor(Math.random() * 10);

    return {
        localTotal,
        remoteTotal,
        pendingSync,
    };
}

module.exports = { setupSyncServerHandlers, getSyncStatistics };