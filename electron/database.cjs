const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function getDbPath() {
    return path.join(__dirname, '..', 'xhs-liked-videos.db');
}

function openDatabase() {
    return new sqlite3.Database(getDbPath(), (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
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
    let query = `
        SELECT * FROM videos
        WHERE type = ?
    `;
    let countQuery = `
        SELECT COUNT(*) as total FROM videos
        WHERE type = ?
    `;
    let params = [type];

    if (keyword) {
        query += ` AND title LIKE ?`;
        countQuery += ` AND title LIKE ?`;
        params.push(`%${keyword}%`);
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
            ORDER BY id ASC
            LIMIT 3
        `;
        const adjacentQuery2 = `
        SELECT id, vid, title, type FROM videos
        WHERE type = (SELECT type FROM videos WHERE vid = ?)
        AND id > (SELECT id FROM videos WHERE vid = ?)
        ORDER BY id ASC
        LIMIT 3
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
            ? 'SELECT vid FROM videos WHERE type = ? AND id < (SELECT id FROM videos WHERE vid = ? AND type = ?) ORDER BY id DESC LIMIT 1'
            : 'SELECT vid FROM videos WHERE type = ? AND id > (SELECT id FROM videos WHERE vid = ? AND type = ?) ORDER BY id ASC LIMIT 1';

        const row = await dbGet(db, query, [type, currentVid, type]);
        return row ? row.vid : null;
    } finally {
        db.close();
    }
}

async function getStatistics() {
    const db = openDatabase();
    try {
        const query = `
            SELECT 
                SUM(CASE WHEN type = 'liked' THEN 1 ELSE 0 END) as likedCount,
                SUM(CASE WHEN type = 'collected' THEN 1 ELSE 0 END) as collectedCount,
                SUM(CASE WHEN type = 'post' THEN 1 ELSE 0 END) as postCount,
                MAX(created_at) as lastUpdateTime
            FROM videos
        `;

        const row = await dbGet(db, query, []);
        return {
            ...row,
            lastUpdateTime: new Date().toISOString()
        };
    } finally {
        db.close();
    }
}

module.exports = {
    getLikedVideos,
    getVideoDetails,
    getAdjacentVideo,
    getStatistics
};