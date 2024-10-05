import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getTranslation } from './i18n.mjs';
import { downloadBrowsers } from "puppeteer/internal/node/install.js";
puppeteer.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let fetch;
(async () => {
    const module = await import('node-fetch');
    fetch = module.default;
})();

class XiaohongshuDownloader {
    constructor(scrollAttempts = 0, maxScrollAttempts = 200, type, downloadDir, dbPath, userDataPath, language, isDownloadVideo = false) {
        this.baseUrl = 'https://www.xiaohongshu.com';
        this.loginUrl = `${this.baseUrl}/login`;
        this.likedNotesUrl = `${this.baseUrl}/user/profile/liked`;
        this.headers = {
            'accept': '*/*',
            'accept-language': 'en-US,en-GB;q=0.9,en;q=0.8,zh-CN;q=0.7,zh;q=0.6,tr;q=0.5',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'origin': 'https://www.xiaohongshu.com',
            'pragma': 'no-cache',
            'referer': 'https://www.xiaohongshu.com/',
            'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
        };
        this.deviceId = this.generateDeviceId();
        this.downloadDir = downloadDir || path.join(__dirname, 'downloads');
        this.dbPath = dbPath;
        this.scrollAttempts = scrollAttempts;
        this.maxScrollAttempts = maxScrollAttempts;
        this.type = type;
        this.tabTextMap = {
            'liked': '点赞',
            'collected': '收藏',
            'post': '笔记'
        };
        this.setupLogging();
        this.userDataPath = userDataPath;
        this.cookiesPath = path.join(this.userDataPath, 'cookies.json');
        this.language = language;
        this.isDownloadVideo = isDownloadVideo;
        // console.log(this);
    }

    generateDeviceId() {
        return crypto.createHash('md5').update(Date.now().toString()).digest('hex');
    }

    async init() {
        await downloadBrowsers();
        this.sendMessage('startingBrowser');
        this.browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certifcate-errors',
                '--ignore-certifcate-errors-spki-list',
                '--disable-blink-features=AutomationControlled',
                '--start-maximized',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ],
            defaultViewport: null,
            ignoreHTTPSErrors: true,
        });
        this.page = await this.browser.newPage();

        const pages = await this.browser.pages();
        const page = pages[0];
        await page.setViewport({
            width: 1366,
            height: 768,
        });
        await page.evaluate(() => {
            window.moveTo(0, 0);
            window.resizeTo(screen.width, screen.height);
        });

        await this.page.setExtraHTTPHeaders(this.headers);

        await this.page.evaluateOnNewDocument(() => {
            const getParameter = WebGLRenderingContext.getParameter;
            WebGLRenderingContext.prototype.getParameter = function (parameter) {
                if (parameter === 37445) {
                    return 'Intel Open Source Technology Center';
                }
                if (parameter === 37446) {
                    return 'Mesa DRI Intel(R) Ivybridge Mobile ';
                }
                return getParameter(parameter);
            };
        });

        await this.page.evaluateOnNewDocument((deviceId) => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['zh-CN', 'zh', 'en-US', 'en'],
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    { name: 'Chrome PDF Plugin' },
                    { name: 'Chrome PDF Viewer' },
                    { name: 'Native Client' },
                ],
            });
            window.matchMedia = window.matchMedia || function () {
                return {
                    matches: false,
                    addListener: function () { },
                    removeListener: function () { }
                };
            };
            window.deviceId = deviceId;
        }, this.deviceId);

        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
            Object.defineProperty(navigator, 'productSub', { get: () => '20030107' });
            Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
        });

        this.sendMessage('browserInitialized');
        await fs.mkdir(this.downloadDir, { recursive: true });

        this.db = new sqlite3.Database(this.dbPath);

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vid TEXT UNIQUE,
                title TEXT,
                page_url TEXT,
                video_src TEXT,
                image_src TEXT,
                type TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        this.sendMessage('databaseOpened');
    }

    setupLogging() {
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;

        console.log = (...args) => {
            originalConsoleLog.apply(console, args);
            if (process && process.send) {
                process.send({ type: 'log', message: args.join(' ') });
            }
        };

        console.error = (...args) => {
            originalConsoleError.apply(console, args);
            if (process && process.send) {
                process.send({ type: 'error', message: args.join(' ') });
            }
        };
    }

    async login() {
        try {
            await this.loadCookies();
            await this.page.goto('https://www.xiaohongshu.com', { waitUntil: 'networkidle0', timeout: 60000 });

            this.sendMessage('loggingIn');
            await this.page.waitForSelector('.user.side-bar-component .link-wrapper span.channel', {
                timeout: 300000
            });
            this.sendMessage('loginSuccessful');

            this.sendMessage('gettingProfileUrl');
            const profileUrl = await this.page.evaluate(() => {
                const profileLink = document.querySelector('.user.side-bar-component a.link-wrapper');
                return profileLink ? profileLink.href : null;
            });

            if (profileUrl) {
                this.sendMessage('navigatingToProfile', { url: profileUrl });
                await this.page.goto(profileUrl, { waitUntil: 'networkidle0', timeout: 60000 });
            } else {
                this.sendMessage('profileUrlNotFound');
                throw new Error('无法获取个人主页链接');
            }

            await this.page.waitForFunction(() => document.readyState === 'complete');
            // 修改页面标题为 xhs
            await this.page.evaluate(() => {
                setTimeout(() => {
                    document.title = 'xhs';
                }, 2000);
            });
            this.sendMessage('pageTitleChanged', { newTitle: 'xhs' });

            await this.replacePersonalInfoWithAsterisks();

            await this.clickTab();

            await this.saveCookies();

        } catch (error) {
            this.sendMessage('loginError', { error: error.message });
            throw error;
        }
    }

    async replacePersonalInfoWithAsterisks() {
        await this.page.evaluate(() => {
            const replaceTextWithAsterisks = (element) => {
                if (element.childNodes.length === 0) {
                    element.textContent = '*'.repeat(element.textContent.length);
                } else {
                    element.childNodes.forEach(child => {
                        if (child.nodeType === Node.TEXT_NODE) {
                            child.textContent = '*'.repeat(child.textContent.length);
                        } else if (child.nodeType === Node.ELEMENT_NODE) {
                            replaceTextWithAsterisks(child);
                        }
                    });
                }
            };

            const basicInfo = document.querySelector('.basic-info');
            if (basicInfo) {
                replaceTextWithAsterisks(basicInfo);
            }

            const userDesc = document.querySelector('.user-desc');
            if (userDesc) {
                replaceTextWithAsterisks(userDesc);
            }
        });

        this.sendMessage('personalInfoReplaced');
    }

    async clickTab() {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                this.sendMessage('attemptingTabClick', { attempt, tab: this.tabTextMap[this.type] });

                await this.page.waitForFunction(() => document.readyState === 'complete');
                this.sendMessage('pageLoaded');

                await this.page.waitForSelector('.reds-tabs-list', { visible: true });
                this.sendMessage('tabsFound');

                const tabIndex = await this.page.evaluate((tabText) => {
                    const tabs = Array.from(document.querySelectorAll('.reds-tabs-list .reds-tab-item'));
                    return tabs.findIndex(tab => tab.textContent.trim() === tabText);
                }, this.tabTextMap[this.type]);

                if (tabIndex === -1) {
                    throw new Error(`未找到"${this.tabTextMap[this.type]}"标签`);
                }

                this.sendMessage('tabFound', { index: tabIndex + 1, tab: this.tabTextMap[this.type] });

                await this.page.evaluate((index) => {
                    const tabs = document.querySelectorAll('.reds-tabs-list .reds-tab-item');
                    if (tabs[index]) {
                        tabs[index].click();
                    }
                }, tabIndex);

                await this.page.waitForFunction(
                    (tabText) => {
                        const activeTab = document.querySelector('.reds-tabs-list .reds-tab-item.active');
                        return activeTab && activeTab.textContent.trim() === tabText;
                    },
                    { timeout: 10000 },
                    this.tabTextMap[this.type]
                );

                this.sendMessage('tabSwitched', { tab: this.tabTextMap[this.type] });

                await this.wait(5000);

                return;

            } catch (error) {
                this.sendMessage('tabClickFailed', { attempt, error: error.message });
                if (attempt === 3) {
                    throw error;
                }
                this.sendMessage('refreshingPage');
                await this.page.reload({ waitUntil: 'networkidle0' });
                await this.wait(2000);
            }
        }
        throw new Error(`多次尝试后未能成功点击"${this.tabTextMap[this.type]}"标签`);
    }

    async processVideoPage(videoUrl) {
        const newPage = await this.browser.newPage();
        try {
            await newPage.setRequestInterception(true);
            let mp4Url = null;

            newPage.on('request', request => {
                const url = request.url();
                if (url.includes('.mp4') && url.includes('.xhscdn.com')) {
                    mp4Url = url;
                }
                request.continue();
            });

            await newPage.goto(videoUrl, { waitUntil: 'networkidle0', timeout: 60000 });

            await this.wait(5000);

            const detailInfo = await newPage.evaluate(() => {
                const posterElement = document.querySelector('xg-poster');
                const titleElement = document.querySelector('.title');
                return {
                    imageSrc: posterElement ? posterElement.style.backgroundImage.slice(5, -2) : null,
                    title: titleElement ? titleElement.textContent.trim() : '',
                    currentUrl: window.location.href
                };
            });

            const urlParams = new URL(detailInfo.currentUrl).searchParams;
            const vid = urlParams.get('xsec_token') || 'unknown';
            this.sendMessage('vidExtracted', { vid });

            if (await this.videoExists(vid)) {
                this.sendMessage('videoExists', { vid });
                return null;
            }

            if (!mp4Url) {
                this.sendMessage('videoMp4NotFound', { vid });
                return null;
            }

            const videoData = {
                url: detailInfo.currentUrl,
                videoSrc: mp4Url,
                imageSrc: detailInfo.imageSrc,
                title: detailInfo.title,
                vid: vid,
                type: this.type,
                savePath: path.join(this.downloadDir, `video_${vid}.mp4`)
            };

            await this.saveVideoData(videoData);
            this.sendMessage('videoAddedToDatabase', { vid });

            return videoData;
        } catch (error) {
            this.sendMessage('processVideoPageError', { error: error.message });
            return null;
        } finally {
            await newPage.close();
        }
    }

    async downloadVideo(videoUrl, savePath) {
        this.sendMessage('startingVideoDownload', { url: videoUrl, savePath });

        try {
            const response = await fetch(videoUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const buffer = await response.arrayBuffer();
            await fs.writeFile(savePath, Buffer.from(buffer));

            this.sendMessage('videoDownloadComplete', { savePath });
            return true;
        } catch (error) {
            this.sendMessage('videoDownloadError', { error: error.message });
            return false;
        }
    }

    async downloadImage(imageUrl, savePath) {
        this.sendMessage('startingImageDownload', { url: imageUrl, savePath });

        const maxRetries = 3;
        const timeout = 5000; // 5 seconds

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(imageUrl, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    this.sendMessage(`HTTP error! status: ${response.status}`);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const buffer = await response.arrayBuffer();
                await fs.writeFile(savePath, Buffer.from(buffer));

                this.sendMessage('imageDownloadComplete', { savePath });
                return true;
            } catch (error) {
                if (attempt === maxRetries) {
                    this.sendMessage('imageDownloadError', { error: error.message });
                    return false;
                } else {
                    this.sendMessage(`Image download attempt ${attempt} failed. Retrying...`);
                }
            }
        }
    }

    async run() {
        this.sendMessage('startingDownloader');
        await this.init();
        try {
            await this.login();
            this.sendMessage('processingVideos', { type: this.tabTextMap[this.type] });

            await this.wait(2000);

            await this.processVideos();

            this.sendMessage('allContentProcessed');

            // this.sendMessage('waitingForUserInput');
            // await new Promise(resolve => process.stdin.once('data', resolve));

        } catch (error) {
            if (error.message.includes(this.t('loginTimeout'))) {
                this.sendMessage('loginTimeout');
            } else if (error.message.includes(this.t('profileUrlNotFound'))) {
                this.sendMessage('loginFailed');
            } else {
                this.sendMessage('downloaderError', { error: error.message });
            }
        } finally {
            this.sendMessage('closingBrowser');
            await this.browser.close();
            this.sendMessage('downloaderFinished');

            this.db.close((err) => {
                if (err) {
                    this.sendMessage('databaseCloseError', { error: err.message });
                } else {
                    this.sendMessage('databaseConnectionClosed');
                }
            });
        }
    }

    async processVideos() {
        this.sendMessage('gettingVideos', { type: this.tabTextMap[this.type] });
        let hasMore = true;
        let scrollAttempts = this.scrollAttempts;
        const maxScrollAttempts = this.maxScrollAttempts;

        const tabIndex = await this.page.evaluate((tabText) => {
            const tabs = Array.from(document.querySelectorAll('.reds-tabs-list .reds-tab-item'));
            return tabs.findIndex(tab => tab.textContent.trim() === tabText);
        }, this.tabTextMap[this.type]);

        if (tabIndex === -1) {
            throw new Error(`未找到"${this.tabTextMap[this.type]}"标签`);
        }

        this.sendMessage('tabFound', { index: tabIndex + 1, tab: this.tabTextMap[this.type] });

        if (this.scrollAttempts > 0) {
            this.sendMessage('startingPreScroll', { attempts: this.scrollAttempts });
            for (let i = 0; i < this.scrollAttempts; i++) {
                await this.page.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                });
                await this.wait(2000);
                this.sendMessage('preScrollComplete', { attempt: i + 1 });

                if (i < this.scrollAttempts - 1) {
                    await this.page.evaluate((tabIndex) => {
                        const sections = document.querySelectorAll(`.tab-content-item:nth-child(${tabIndex + 1}) .feeds-container section:not(.done)`);
                        sections.forEach(section => section.classList.add('done'));
                    }, tabIndex);
                    this.sendMessage('preScrollSectionMarked', { attempt: i + 1 });
                }
            }

            this.sendMessage('preScrollFinished');
        }

        while (hasMore && scrollAttempts < maxScrollAttempts) {
            const sections = await this.page.$$(`.tab-content-item:nth-child(${tabIndex + 1}) .feeds-container section:not(.done)`);
            this.sendMessage('foundNewSections', { count: sections.length });

            if (sections.length === 0) {
                this.sendMessage('noNewSections');
                break;
            }

            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const hasPlayIcon = await section.$('span.play-icon');
                if (!hasPlayIcon) {
                    await this.page.evaluate((el) => {
                        el.remove();
                    }, section);
                    this.sendMessage('skippedSection', { index: i + 1 });
                    continue;
                }
                try {
                    const videoUrl = await section.$eval('a.cover', el => el.href);
                    this.sendMessage('processingVideo', { index: i + 1, url: videoUrl });

                    const videoData = await this.processVideoPage(videoUrl);
                    if (videoData) {
                        const downloadSuccess = await this.downloadVideoAndImage(videoData);
                        if (downloadSuccess) {
                            await this.saveVideoDataIfDownloaded(videoData);
                        }
                    }

                    await this.page.evaluate((el) => {
                        el.classList.add('done');
                        el.remove();
                    }, section);

                } catch (error) {
                    this.sendMessage('processVideoError', { error: error.message });
                }
            }

            const previousHeight = await this.page.evaluate('document.body.scrollHeight');
            await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await this.wait(2000);

            const currentHeight = await this.page.evaluate('document.body.scrollHeight');
            if (currentHeight === previousHeight) {
                hasMore = false;
                this.sendMessage('reachedPageBottom');
            } else {
                scrollAttempts++;
                this.sendMessage('scrolling', { attempts: scrollAttempts });
            }
        }
    }

    async downloadVideoAndImage(videoData) {
        let videoDownloaded = false;
        let imageDownloaded = false;

        if (this.isDownloadVideo && videoData.videoSrc && videoData.videoSrc.startsWith('http')) {
            videoDownloaded = await this.downloadVideo(videoData.videoSrc, videoData.savePath);
        } else if (!this.isDownloadVideo) {
            this.sendMessage('videoDownloadSkipped', { url: videoData.url });
        } else {
            this.sendMessage('videoNoSource', { url: videoData.url });
        }

        if (videoData.imageSrc && videoData.imageSrc.startsWith('http')) {
            const imageSavePath = path.join(this.downloadDir, `img_${videoData.vid}.jpg`);
            imageDownloaded = await this.downloadImage(videoData.imageSrc, imageSavePath);
        } else {
            this.sendMessage('imageNoSource', { url: videoData.url });
        }

        return this.isDownloadVideo ? (videoDownloaded || imageDownloaded) : imageDownloaded;
    }

    async saveVideoDataIfDownloaded(videoData) {
        const videoPath = videoData.savePath;
        const imagePath = path.join(this.downloadDir, `img_${videoData.vid}.jpg`);

        try {
            const videoExists = await fs.access(videoPath).then(() => true).catch(() => false);
            const imageExists = await fs.access(imagePath).then(() => true).catch(() => false);

            if (videoExists || imageExists) {
                await this.saveVideoData(videoData);
                this.sendMessage('videoSavedToDatabase', { vid: videoData.vid });
            } else {
                this.sendMessage('videoDownloadFailed', { vid: videoData.vid });
            }
        } catch (error) {
            this.sendMessage('checkFilesError', { error: error.message });
        }
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async saveCookies() {
        const cookies = await this.page.cookies();
        await fs.writeFile(this.cookiesPath, JSON.stringify(cookies, null, 2));
        this.sendMessage('cookiesSaved');
    }

    async loadCookies() {
        try {
            const cookiesString = await fs.readFile(this.cookiesPath, 'utf-8');
            const cookies = JSON.parse(cookiesString);
            await this.page.setCookie(...cookies);
            this.sendMessage('cookiesLoaded');
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.sendMessage('cookiesFileNotFound');
            } else {
                throw error;
            }
        }
    }

    async videoExists(vid) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM videos WHERE vid = ?', [vid], (err, row) => {
                if (err) reject(err);
                resolve(row !== undefined);
            });
        });
    }

    async saveVideoData(videoData) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT OR REPLACE INTO videos (vid, title, page_url, video_src, image_src, type)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [videoData.vid, videoData.title, videoData.url, videoData.videoSrc, videoData.imageSrc, this.type], (err) => {
                if (err) {
                    this.sendMessage('saveVideoDataError', { error: err.message });
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    sendMessage(key, params = {}) {
        const message = this.t(key, params);
        process.send(message);
    }

    t(key, params = {}) {
        const msg = getTranslation(this.language, key, params);
        console.log(msg)
        return msg;
    }
}

const argv = yargs(hideBin(process.argv))
    .option('scrollAttempts', {
        alias: 's',
        description: '预滚动次数',
        type: 'number',
        default: 0
    })
    .option('maxScrollAttempts', {
        alias: 'm',
        description: '最大滚动次数',
        type: 'number',
        default: 200
    })
    .option('type', {
        alias: 't',
        description: '下载类型 (liked, collected, post)',
        type: 'string',
        default: 'liked',
        choices: ['liked', 'collected', 'post']
    })
    .option('downloadDir', {
        alias: 'd',
        description: '下载目录路径',
        type: 'string',
        required: true
    })
    .option('dbPath', {
        alias: 'db',
        description: '数据库文件路径',
        type: 'string',
        required: true
    })
    .option('userDataPath', {
        description: 'Electron 用户数据路径',
        type: 'string',
        required: true
    })
    .option('language', {
        alias: 'l',
        description: '语言设置',
        type: 'string',
        default: 'zh'
    })
    .option('isDownloadVideo', {
        alias: 'dv',
        description: '是否下载视频',
        type: 'boolean',
        default: false
    })
    .argv;

const downloader = new XiaohongshuDownloader(
    argv.scrollAttempts,
    argv.maxScrollAttempts,
    argv.type,
    argv.downloadDir,
    argv.dbPath,
    argv.userDataPath,
    argv.language,
    argv.isDownloadVideo
);
downloader.run().catch(error => downloader.sendMessage('downloaderError', { error: error.message }));