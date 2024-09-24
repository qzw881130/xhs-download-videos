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

async function getUserEmail() {
    const downloadPathFile = getDownloadPathFile();
    try {
        const data = JSON.parse(await fs.readFile(downloadPathFile, 'utf8'));
        return data.user_email || '';
    } catch (error) {
        console.error('Error reading download path file:', error);
        return '';
    }
}

async function storeUserEmail(userEmail) {
    if (!userEmail) {
        return;
    }
    try {
        const downloadPathFile = getDownloadPathFile();
        const data = JSON.parse(await fs.readFile(downloadPathFile, 'utf8'));
        data.user_email = userEmail;
        await fs.writeFile(downloadPathFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error storing user email:', error);
    }
}

function loadEnv() {
    if (isDev) {
        require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
    } else {
        require('dotenv').config({ path: path.resolve(app.getAppPath(), '.env') });
    }
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
}

module.exports = { getStoredDownloadPath, getUserEmail, storeUserEmail, loadEnv };