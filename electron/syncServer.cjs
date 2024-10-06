const { createClient } = require('@supabase/supabase-js');
const { getLikedVideos, openDatabase, dbGet, dbAll, getLocalTotal, getUnSyncedCount, markVideoAsSynced } = require('./database.cjs');
const { ipcMain, protocol } = require('electron');
const { getStoredDownloadPath, getUserEmail, storeUserEmail, loadEnv } = require('./utils.cjs');
const path = require('path');
const fs = require('fs-extra');
const { app, shell, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');

loadEnv();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
});
let syncInterval;
let win;
let authWindow = null;

function createAuthWindow(url) {
    authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        'node-integration': false,
        'web-security': false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
    });

    authWindow.loadURL(url);
    authWindow.show();

    if (isDev) {
        authWindow.webContents.openDevTools();
    }

    authWindow.on('closed', () => {
        authWindow = null;
    });
}


function setupOAuth() {
    protocol.registerHttpProtocol('myapp', (request) => {
        console.log('myapp protocol request:', request);
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        if (code) {
            // 发送授权码回主窗口
            win.webContents.send('oauth-callback', code);
            if (authWindow) {
                authWindow.close();
            }
        }
    });
}


async function syncServer() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        // console.log('Supabase user in syncServer:', user); // 添加这行日志
        if (!user?.id) return;
        const user_id = user.id;
        const db = openDatabase();
        // console.log('start sync....syncServer')
        // 获取总行数
        let localTotal = 0;
        try {
            const countResult = await dbGet(db, "SELECT COUNT(*) as count FROM videos WHERE is_synced = false", []);
            // console.log('countResult===', countResult)
            localTotal = countResult.count;
        } catch (err) {
            console.error('Error fetching total count from videos table:', err.message);
            throw err;
        }

        // localTotal = 5;
        // 获取本地存储路径
        const downloadPath = await getStoredDownloadPath();

        // 使用游标逐行读取数据
        const batchSize = 1; // 每批处理的行数
        let offset = 0;

        while (offset < localTotal) {
            // console.log('offset:', offset, 'batchSize:', batchSize, 'localTotal:', localTotal);
            const rows = await dbAll(db, `SELECT * FROM videos WHERE is_synced = false LIMIT ? OFFSET ?`, [batchSize, offset]);
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
                                // console.log('Public URL:', image_src);
                            }
                        }

                        console.log('image_src==', image_src, 'storageError===', storageError);
                    } catch (error) {
                        console.error('Error during image upload:', error);
                    }
                } else {
                    // console.log('no exist localimagepath==', localImagePath)
                    image_src = `https://via.placeholder.com/150x200`;
                }

                const uuid = `${user_id}_${row.vid}`;
                return { ...row, image_src: image_src, user_id: user_id, uuid: uuid };
            }));

            // 修改这部分代码
            const { data, error } = await supabase
                .from('videos')
                .upsert(processedRows, { onConflict: 'uuid' });

            if (error) {
                console.error('Error inserting/updating data:', error.message);
                // 如果是重复键错误，我们仍然需要标记这些记录为已同步
                if (error.message.includes('duplicate key value violates')) {
                    await Promise.all(processedRows.map(async (row) => {
                        await markVideoAsSynced(row.id);
                    }));
                }
            } else {
                await Promise.all(processedRows.map(async (row) => {
                    await markVideoAsSynced(row.id);
                }));
                // console.log('Data inserted/updated successfully');
            }
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
            let unSyncedCount = 0;
            do {
                await syncServer();
                unSyncedCount = await getUnSyncedCount();
                if (unSyncedCount === 0) {
                    break;
                }
            } while (true)
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

    ipcMain.handle('supabase-sign-up', async (event, email, password) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            return data.user;
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    });

    ipcMain.handle('supabase-sign-in', async (event, email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            return data.user;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    });

    ipcMain.handle('supabase-sign-out', async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    });

    ipcMain.handle('supabase-get-user', async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            // console.log('Supabase user:', user); // 添加这行日志
            return user;
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    });

    ipcMain.handle('supabase-sign-in-with-provider', async (event, provider) => {
        try {
            const url = isDev
                ? `http://localhost:3000/#/callback`
                : `file://${path.join(__dirname, '../dist/index.html')}#/callback`;

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: 'myapp://callback',
                },
            });
            console.log('supabase-sign-in-with-provider data===', data)
            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error signing in with ${provider}:`, error);
            throw error;
        }
    });


    // 添加这个处理程序
    ipcMain.handle('supabase-exchange-code-for-session', async (event, code) => {
        try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            console.log('exchangeCodeForSession data===', data)
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error exchanging code for session:', error);
            throw error;
        }
    });

    ipcMain.handle('open-auth-window', (event, url) => {
        console.log('open-auth-window url===', url)
        createAuthWindow(url);
    });


    app.on('open-url', async (event, url) => {
        event.preventDefault();

        // Use the URL to verify the OAuth flow if needed
        const { data, error } = await supabase.auth.getSessionFromUrl({ url });
        if (error) {
            console.error('Error fetching session:', error);
            return;
        }

        console.log('Logged in user:', data.user);
    });

}

async function getRemoteTotal() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return 0;
        const user_id = user?.id;

        const { count, error } = await supabase
            .from('videos')
            .select('*', { count: 'exact' })
            .eq('user_id', user_id);
        return count;
    } catch (error) {
        console.error('Error fetching total count from videos table:', error.message);
        throw error;
    }
}

async function getSyncStatistics() {
    // console.log('getSyncStatistics function called'); // 添加日志
    // 获取本地总数
    const localTotal = await getLocalTotal();
    // console.log('localTotal:', localTotal); // 添加日志
    // 模拟获取远程总数和待同步数
    const remoteTotal = await getRemoteTotal();
    const pendingSync = await getUnSyncedCount();

    return {
        localTotal,
        remoteTotal,
        pendingSync,
    };
}

module.exports = { setupSyncServerHandlers, getSyncStatistics, setupOAuth };