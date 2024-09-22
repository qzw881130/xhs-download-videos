const path = require('path');
const fs = require('fs-extra');
const { app } = require('electron');
const isDev = require('electron-is-dev');

function getDownloadPathFile() {
    const configFile = isDev ? 'download_path.json' : 'download_path_prod.json';
    // console.log('Getting download path file', path.join(app.getPath('userData'), configFile));
    return path.join(app.getPath('userData'), configFile);
}

async function getStoredDownloadPath() {
    const downloadPathFile = getDownloadPathFile();
    try {
        const data = JSON.parse(await fs.readFile(downloadPathFile, 'utf8'));
        return data.downloadPath || path.join(app.getPath('userData'), 'downloads');
    } catch (error) {
        console.error('Error reading download path file:', error);
        return path.join(app.getPath('userData'), 'downloads');
    }
}

module.exports = { getStoredDownloadPath };