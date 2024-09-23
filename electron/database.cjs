const { app } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');  // 改为 fs-extra
const isDev = require('electron-is-dev');

function getDbPath() {
    if (isDev) {
        return path.join(__dirname, '..', 'xhs-liked-videos.db');
    } else {
        return path.join(app.getPath('userData'), 'xhs-liked-videos-prod.db');
    }
}

function log(message) {
    console.log(message);
}

function error(message) {
    console.error(message);
}

function openDatabase() {
    const dbPath = getDbPath();
    // log(`Attempting to open database at: ${dbPath}`);
    return new sqlite3.Database(dbPath, (err) => {
        if (err) {
            error(`Error opening database: ${err.message}`);
        } else {
            log(`Database opened successfully: ${dbPath}`);
        }
    });
}

function dbGet(db, query, params) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function dbAll(db, query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function getLikedVideos(page = 1, pageSize = 20, type = 'liked', keyword = '') {
    const db = openDatabase();
    const offset = (page - 1) * pageSize;
    let query, countQuery, params;
    if (!!type) {
        query = `
            SELECT * FROM videos
            WHERE type = ? AND is_hidden = 0
        `;
        countQuery = `
            SELECT COUNT(*) as total FROM videos
            WHERE type = ? AND is_hidden = 0
        `;
        params = [type];
    } else {
        query = `
        SELECT * FROM videos
        WHERE is_hidden = 0
        `;
        countQuery = `
            SELECT COUNT(*) as total FROM videos
            WHERE is_hidden = 0
        `;
        params = [];
    }

    if (keyword) {
        query += ` AND title LIKE ?`;
        countQuery += ` AND title LIKE ?`;
        if (!type) params.push(`%${keyword}%`);
    }

    query += `
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `;

    try {
        const rows = await dbAll(db, query, [...params, pageSize, offset]);
        const result = await dbGet(db, countQuery, params);
        const totalItems = result.total;
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            videos: rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                pageSize: pageSize
            }
        };
    } finally {
        db.close();
    }
}

async function getVideoDetails(vid) {
    const db = openDatabase();
    try {
        const mainQuery = 'SELECT * FROM videos WHERE vid = ?';
        const adjacentQuery = `
            SELECT id, vid, title, type FROM videos
            WHERE type = (SELECT type FROM videos WHERE vid = ?)
            AND id <= (SELECT id FROM videos WHERE vid = ?)
            AND is_hidden = 0
            ORDER BY id ASC
            LIMIT 5
        `;
        const adjacentQuery2 = `
        SELECT id, vid, title, type FROM videos
        WHERE type = (SELECT type FROM videos WHERE vid = ?)
        AND id > (SELECT id FROM videos WHERE vid = ?)
        AND is_hidden = 0
        ORDER BY id ASC
        LIMIT 5
    `;

        const [row, adjacentVideosBefore, adjacentVideosAfter] = await Promise.all([
            dbGet(db, mainQuery, [vid]),
            dbAll(db, adjacentQuery, [vid, vid]),
            dbAll(db, adjacentQuery2, [vid, vid])
        ]);
        const adjacentVideos = [...adjacentVideosBefore, ...adjacentVideosAfter];

        if (!row) {
            throw new Error(`No video found with vid: ${vid}`);
        }
        console.log('adjacentVideos=', adjacentVideos);
        return { ...row, adjacentVideos };
    } finally {
        db.close();
    }
}

async function getAdjacentVideo(currentVid, direction, type) {
    const db = openDatabase();
    try {
        const query = direction === 'next'
            ? 'SELECT vid FROM videos WHERE type = ? AND id < (SELECT id FROM videos WHERE vid = ? AND type = ? AND is_hidden = 0) ORDER BY id DESC LIMIT 1'
            : 'SELECT vid FROM videos WHERE type = ? AND id > (SELECT id FROM videos WHERE vid = ? AND type = ? AND is_hidden = 0) ORDER BY id ASC LIMIT 1';

        const row = await dbGet(db, query, [type, currentVid, type]);
        return row ? row.vid : null;
    } finally {
        db.close();
    }
}

async function getStatistics(downloadDir) {
    const db = openDatabase();
    try {
        const tableExistsQuery = "SELECT name FROM sqlite_master WHERE type='table' AND name='videos'";
        const tableExists = await dbGet(db, tableExistsQuery);

        if (!tableExists) {
            log('Videos table does not exist. Returning empty statistics.');
            return {
                likedCount: 0,
                collectedCount: 0,
                postCount: 0,
                hiddenCount: 0,  // 添加 hiddenCount
                lastUpdateTime: new Date().toISOString(),
                storageSize: await calculateStorageSize(downloadDir)
            };
        }

        const query = `
            SELECT 
                SUM(CASE WHEN type = 'liked' AND is_hidden = 0 THEN 1 ELSE 0 END) as likedCount,
                SUM(CASE WHEN type = 'collected' AND is_hidden = 0 THEN 1 ELSE 0 END) as collectedCount,
                SUM(CASE WHEN type = 'post' AND is_hidden = 0 THEN 1 ELSE 0 END) as postCount,
                SUM(CASE WHEN is_hidden = 1 THEN 1 ELSE 0 END) as hiddenCount,
                MAX(created_at) as lastUpdateTime
            FROM videos
        `;

        const row = await dbGet(db, query, []);
        const storageSize = await calculateStorageSize(downloadDir);
        return {
            likedCount: row.likedCount || 0,
            collectedCount: row.collectedCount || 0,
            postCount: row.postCount || 0,
            hiddenCount: row.hiddenCount || 0,  // 添加 hiddenCount
            lastUpdateTime: row.lastUpdateTime || new Date().toISOString(),
            storageSize
        };
    } catch (err) {
        error(`Error getting statistics: ${err.message}`);
        throw err;
    } finally {
        db.close();
    }
}

async function calculateStorageSize(downloadDir) {
    let totalSize = 0;
    try {
        // 确保目录存在
        await fs.ensureDir(downloadDir);

        const files = await fs.readdir(downloadDir);
        for (const file of files) {
            const filePath = path.join(downloadDir, file);
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
                totalSize += stats.size;
            }
        }
    } catch (error) {
        console.error(`Error calculating storage size: ${error.message}`);
    }
    return totalSize;
}

// 修改 getRandomVideo 函数
async function getRandomVideo(type) {
    const db = openDatabase(); // 使用 openDatabase 而不是 getDbConnection
    try {
        const query = 'SELECT vid FROM videos WHERE type = ? AND is_hidden = 0 ORDER BY RANDOM() LIMIT 1';
        const result = await dbGet(db, query, [type]);
        return result ? result.vid : null;
    } finally {
        db.close();
    }
}

async function ensureDatabaseExists() {
    const dbPath = getDbPath();
    try {
        await fs.access(dbPath);
        console.log('Database file exists.');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('Database file does not exist. Creating new database.');
        } else {
            console.error('Error checking database file:', error);
            return;
        }
    }

    const db = new sqlite3.Database(dbPath, async (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        } else {
            console.log('Database opened successfully');
            try {
                await initializeDatabase(db);
                await updateDatabaseSchema(db);
                console.log('Database initialized and schema updated successfully');
            } catch (initError) {
                console.error('Error initializing or updating database:', initError.message);
            } finally {
                db.close();
            }
        }
    });
}

// 在模块开始时调用这个函数，但是要用 async IIFE 包裹
(async () => {
    await ensureDatabaseExists();
})();

async function initializeDatabase(db) {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vid TEXT UNIQUE,
                title TEXT,
                type TEXT,
                page_url TEXT,
                video_src TEXT,
                image_src TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_hidden BOOLEAN DEFAULT FALSE,
                updated_at DATETIME,
                is_synced BOOLEAN DEFAULT FALSE
            )
        `, (err) => {
            if (err) {
                console.error('Error creating videos table:', err);
                reject(err);
            } else {
                console.log('Videos table created or already exists');
                resolve();
            }
        });
    });
}

async function updateDatabaseSchema(db) {
    const columns = ['page_url', 'video_src', 'image_src'];
    for (const column of columns) {
        await new Promise((resolve, reject) => {
            db.run(`ALTER TABLE videos ADD COLUMN ${column} TEXT;`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error(`Error adding ${column} column:`, err.message);
                    reject(err);
                } else {
                    console.log(`Column ${column} added or already exists`);
                    resolve();
                }
            });
        });
    }
    // Check if is_hidden column exists, if not, add it
    await new Promise((resolve, reject) => {
        db.run("ALTER TABLE videos ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding is_hidden column:', err.message);
                reject(err);
            } else {
                console.log('Column is_hidden added successfully');
                resolve();
            }
        });
    });

    await new Promise((resolve, reject) => {
        db.run("ALTER TABLE videos ADD COLUMN updated_at DATETIME;", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding updated_at column:', err.message);
                reject(err);
            } else {
                console.log('Column updated_at added or already exists');
                resolve();
            }
        });
    });

    await new Promise((resolve, reject) => {
        db.run("ALTER TABLE videos ADD COLUMN is_synced BOOLEAN DEFAULT FALSE;", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding is_synced column:', err.message);
                reject(err);
            } else {
                console.log('Column is_synced added successfully');
                resolve();
            }
        });
    });
}

async function hideVideo(vid) {
    const db = openDatabase();
    try {
        const query = 'UPDATE videos SET is_hidden = TRUE, updated_at = CURRENT_TIMESTAMP WHERE vid = ?';
        await new Promise((resolve, reject) => {
            db.run(query, [vid], function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    } finally {
        db.close();
    }
}

async function getLocalTotal() {
    console.log('getLocalTotal function called'); // 添加日志
    const db = openDatabase();
    try {
        const countResult = await dbGet(db, "SELECT COUNT(*) as count FROM videos", []);
        console.log('countResult:', countResult); // 添加日志
        return countResult.count;
    } catch (err) {
        console.error('Error fetching total count from videos table:', err.message);
        throw err;
    } finally {
        db.close();
    }
}

async function getUnSyncedCount() {
    const db = openDatabase();
    try {
        const countResult = await dbGet(db, "SELECT COUNT(*) as count FROM videos WHERE is_synced = false", []);
        return countResult.count;
    } catch (err) {
        console.error('Error fetching synced count from videos table:', err.message);
        throw err;
    } finally {
        db.close();
    }
}

async function markVideoAsSynced(id) {
    console.log('markVideoAsSynced function called with id:', id); // 添加日志
    const db = openDatabase();
    try {
        const query = 'UPDATE videos SET is_synced = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        await new Promise((resolve, reject) => {
            db.run(query, [id], function (err) {
                if (err) {
                    console.error('Error marking video as synced:', err.message);
                    reject(err);
                } else {
                    console.log('Video marked as synced:', id);
                    resolve(this);
                }
            });
        });
    } finally {
        db.close();
    }
}

module.exports = {
    getLikedVideos,
    getVideoDetails,
    getAdjacentVideo,
    getStatistics,
    getRandomVideo,
    getDbPath,
    hideVideo,
    openDatabase,
    dbGet,
    dbAll,
    getLocalTotal,
    getUnSyncedCount,
    markVideoAsSynced
};
