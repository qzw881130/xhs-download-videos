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

puppeteer.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let fetch;
(async () => {
    const module = await import('node-fetch');
    fetch = module.default;
})();

class XiaohongshuDownloader {
    constructor(scrollAttempts = 0, maxScrollAttempts = 200, type, downloadDir, dbPath, userDataPath, language) {
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
        this.language = language; // 使用传入的语言参数
    }

    generateDeviceId() {
        return crypto.createHash('md5').update(Date.now().toString()).digest('hex');
    }

    async init() {
        process.send('初始化浏览器...');
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
                '--start-maximized', // 添加这个参数来启动时最大化窗口
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ],
            defaultViewport: null, // 设置为 null 以允许窗口自动调整大小
            ignoreHTTPSErrors: true,
        });
        this.page = await this.browser.newPage();

        // 使用 Puppeteer 内置方法最大化窗口
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

        // Set headers
        await this.page.setExtraHTTPHeaders(this.headers);

        // 设置 WebGL 指纹
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

        // 添加更多的浏览器指纹伪
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

        // 模拟设备信息
        await this.page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
            Object.defineProperty(navigator, 'productSub', { get: () => '20030107' });
            Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
        });

        process.send('初始化完成，浏览器窗口已最大化');
        await fs.mkdir(this.downloadDir, { recursive: true });

        // 初始化数据库
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

        process.send('Database opened successfully');
    }

    // 设置日志输出函数
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

            process.send('等待用户登录...');
            await this.page.waitForSelector('.user.side-bar-component .link-wrapper span.channel', {
                timeout: 300000 // 5分钟超时
            });
            process.send('检测到用户已登录');

            process.send('正在获取个人主页链接...');
            const profileUrl = await this.page.evaluate(() => {
                const profileLink = document.querySelector('.user.side-bar-component a.link-wrapper');
                return profileLink ? profileLink.href : null;
            });

            if (profileUrl) {
                process.send(`正在导航到个人主页: ${profileUrl}`);
                await this.page.goto(profileUrl, { waitUntil: 'networkidle0', timeout: 60000 });
            } else {
                process.send('无法获取个人主页链接');
                throw new Error('无法获取个人主页链接');
            }

            // 等待页面完全加载
            process.send('等待页面加载...');
            await this.page.waitForFunction(() => document.readyState === 'complete');

            // 调用新的方法来替换个人信
            await this.replacePersonalInfoWithAsterisks();

            // 点击目标标签
            await this.clickTab();

            // 保存新的 cookies
            await this.saveCookies();

        } catch (error) {
            process.send(`登录过程中出错: ${error.message}`);
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

        process.send('个人信息已被替换为星号');
    }

    async clickTab() {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                process.send(`尝试点击"${this.tabTextMap[this.type]}"标签 (尝试 ${attempt}/3)...`);

                // 等待页面完全加载
                await this.page.waitForFunction(() => document.readyState === 'complete');
                process.send('页面已完全加载');

                // 等待标签表出现
                await this.page.waitForSelector('.reds-tabs-list', { visible: true });
                process.send('标签列表已找到');

                // 获取目标标签的索引
                const tabIndex = await this.page.evaluate((tabText) => {
                    const tabs = Array.from(document.querySelectorAll('.reds-tabs-list .reds-tab-item'));
                    return tabs.findIndex(tab => tab.textContent.trim() === tabText);
                }, this.tabTextMap[this.type]);

                if (tabIndex === -1) {
                    throw new Error(`未找到"${this.tabTextMap[this.type]}"标签`);
                }

                process.send(`"${this.tabTextMap[this.type]}"标签位于第 ${tabIndex + 1} 个位置`);

                // 点击目标标签
                await this.page.evaluate((index) => {
                    const tabs = document.querySelectorAll('.reds-tabs-list .reds-tab-item');
                    if (tabs[index]) {
                        tabs[index].click();
                    }
                }, tabIndex);

                // 等待目标标签激活
                await this.page.waitForFunction(
                    (tabText) => {
                        const activeTab = document.querySelector('.reds-tabs-list .reds-tab-item.active');
                        return activeTab && activeTab.textContent.trim() === tabText;
                    },
                    { timeout: 10000 },
                    this.tabTextMap[this.type]
                );

                process.send(`成功切换到"${this.tabTextMap[this.type]}"标签`);

                process.send('等待 5 秒以确保页面加载完成...');
                await this.wait(5000);

                return;

            } catch (error) {
                process.send(`第 ${attempt} 次尝试点击"${this.tabTextMap[this.type]}"标签失败: ${error.message}`);
                if (attempt === 3) {
                    throw error;
                }
                process.send('刷新页面并重试...');
                await this.page.reload({ waitUntil: 'networkidle0' });
                await this.wait(2000);
            }
        }
        throw new Error(`多次尝试后未能成功点击"${this.tabTextMap[this.type]}"标签`);
    }

    async processVideoPage(videoUrl) {
        const newPage = await this.browser.newPage();
        try {
            // 启用网络请求拦截
            await newPage.setRequestInterception(true);
            let mp4Url = null;

            newPage.on('request', request => {
                const url = request.url();
                if (url.endsWith('.mp4')) {
                    mp4Url = url;
                }
                request.continue();
            });

            await newPage.goto(videoUrl, { waitUntil: 'networkidle0', timeout: 60000 });

            // 等待一段时间，确保所有请求都被捕获
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

            // 修改vid提取规则
            const urlParams = new URL(detailInfo.currentUrl).searchParams;
            const vid = urlParams.get('xsec_token') || 'unknown';
            process.send(`提取的 vid: ${vid}`);

            if (await this.videoExists(vid)) {
                process.send(`视频 ${vid} 已存在，跳过处理`);
                return null;
            }

            if (!mp4Url) {
                process.send(`警告: 未找到视频 ${vid} 的 MP4 链接`);
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
            process.send(`视频 ${vid} 已添加到数据库`);

            return videoData;
        } catch (error) {
            process.send(`处理视频页面时出错: ${error.message}`);
            return null;
        } finally {
            await newPage.close();
        }
    }

    async downloadVideo(videoUrl, savePath) {
        process.send(`开始下载视频: ${videoUrl}`);
        process.send(`保存路径: ${savePath}`);

        try {
            const response = await fetch(videoUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const buffer = await response.arrayBuffer();
            await fs.writeFile(savePath, Buffer.from(buffer));

            process.send(`视频下载完成: ${savePath}`);
            return true;
        } catch (error) {
            process.send(`下载视频时出错: ${error.message}`);
            return false;
        }
    }

    async downloadImage(imageUrl, savePath) {
        process.send(`开始下载图片: ${imageUrl}`);
        process.send(`保存路径: ${savePath}`);

        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const buffer = await response.arrayBuffer();
            await fs.writeFile(savePath, Buffer.from(buffer));

            process.send(`图片下载完成: ${savePath}`);
            return true;
        } catch (error) {
            process.send(`下载图片时出错: ${error.message}`);
            return false;
        }
    }

    async run() {
        process.send('开始运行下载器...');
        await this.init();
        try {
            await this.login();
            process.send(`正在获取并处理${this.tabTextMap[this.type]}的视频...`);

            await this.wait(2000);

            await this.processVideos();

            process.send('所有内容处理完成');

            // 等待用户输入以保持浏览器开启
            process.send('请在控制台输入任意内容并按回车键来关闭浏览器...');
            await new Promise(resolve => process.stdin.once('data', resolve));

        } catch (error) {
            if (error.message.includes('等待用户登录超时')) {
                process.send('登录超时，请确保在规定时间内完成扫码登录');
            } else if (error.message.includes('无法获取个人主页链接')) {
                process.send('登录可能失败，无法获取个人主页链接');
            } else {
                process.send(`运行过程中出错: ${error.message}`);
            }
        } finally {
            process.send('正在关闭浏览器...');
            await this.browser.close();
            process.send('下载器运行结束');

            // 关闭数据库连接
            this.db.close((err) => {
                if (err) {
                    process.send(`Error closing database: ${err.message}`);
                } else {
                    process.send('Database connection closed');
                }
            });
        }
    }

    async processVideos() {
        process.send(`正在获取${this.tabTextMap[this.type]}的视频 (类型: ${this.type})...`);
        let hasMore = true;
        let scrollAttempts = this.scrollAttempts;  // 使用传入的 scrollAttempts 作为起始点
        const maxScrollAttempts = this.maxScrollAttempts;  // 使用传入的 maxScrollAttempts

        // 获取目标标签的索引
        const tabIndex = await this.page.evaluate((tabText) => {
            const tabs = Array.from(document.querySelectorAll('.reds-tabs-list .reds-tab-item'));
            return tabs.findIndex(tab => tab.textContent.trim() === tabText);
        }, this.tabTextMap[this.type]);

        if (tabIndex === -1) {
            throw new Error(`未找到"${this.tabTextMap[this.type]}"标签`);
        }

        process.send(`"${this.tabTextMap[this.type]}"标签位于第 ${tabIndex + 1} 个位置`);

        // 如果 scrollAttempts > 0，先进行指定次数的滚动
        if (this.scrollAttempts > 0) {
            process.send(`正在进行 ${this.scrollAttempts} 次预滚动...`);
            for (let i = 0; i < this.scrollAttempts; i++) {
                await this.page.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                });
                await this.wait(2000);
                process.send(`完成第 ${i + 1} 次预滚动`);

                // 标记当前已加载的 section 为已处理，除了最后一次滚动
                if (i < this.scrollAttempts - 1) {
                    await this.page.evaluate((tabIndex) => {
                        const sections = document.querySelectorAll(`.tab-content-item:nth-child(${tabIndex + 1}) .feeds-container section:not(.done)`);
                        sections.forEach(section => section.classList.add('done'));
                    }, tabIndex);
                    process.send(`已标记第 ${i + 1} 次滚动加载的容为已处理`);
                }
            }

            process.send('预滚动完成，最后一次滚动的新内容未被标记为已处理');
        }

        while (hasMore && scrollAttempts < maxScrollAttempts) {
            // 获取当前页面上的所有未处理的视频项
            const sections = await this.page.$$(`.tab-content-item:nth-child(${tabIndex + 1}) .feeds-container section:not(.done)`);
            process.send(`当前页面找到 ${sections.length} 个未处理的视频项`);

            if (sections.length === 0) {
                process.send('没有找到新的视频项，停止滚动');
                break;
            }

            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const hasPlayIcon = await section.$('span.play-icon');
                if (!hasPlayIcon) {
                    // 将section元素从页面移出
                    await this.page.evaluate((el) => {
                        el.remove();
                    }, section);
                    process.send(`跳过第 ${i + 1} 个项目：没有找到 play-icon，可能不是视频`);
                    continue;
                }
                try {
                    const videoUrl = await section.$eval('a.cover', el => el.href);
                    process.send(`处理视频 ${i + 1}: ${videoUrl}`);

                    const videoData = await this.processVideoPage(videoUrl);
                    if (videoData) {
                        const downloadSuccess = await this.downloadVideoAndImage(videoData);
                        if (downloadSuccess) {
                            await this.saveVideoDataIfDownloaded(videoData);
                        }
                    }

                    // 标记已处理的项目
                    await this.page.evaluate((el) => {
                        el.classList.add('done');
                        el.remove();
                    }, section);

                } catch (error) {
                    process.send(`处理视频时出错: ${error.message}`);
                }
            }

            // 滚动到页面底部
            const previousHeight = await this.page.evaluate('document.body.scrollHeight');
            await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await this.wait(2000);

            const currentHeight = await this.page.evaluate('document.body.scrollHeight');
            if (currentHeight === previousHeight) {
                hasMore = false;
                process.send('已到达页面底部，停止滚动');
            } else {
                scrollAttempts++;
                process.send(`已滚动 ${scrollAttempts} 次，继续加载更多视频...`);
            }
        }
    }

    async downloadVideoAndImage(videoData) {
        let videoDownloaded = false;
        let imageDownloaded = false;

        if (videoData.videoSrc && videoData.videoSrc.startsWith('http')) {
            videoDownloaded = await this.downloadVideo(videoData.videoSrc, videoData.savePath);
        } else {
            process.send(`视频 ${videoData.url} 没有可用的视频源，跳过下载`);
        }

        if (videoData.imageSrc && videoData.imageSrc.startsWith('http')) {
            const imageSavePath = path.join(this.downloadDir, `img_${videoData.vid}.jpg`);
            imageDownloaded = await this.downloadImage(videoData.imageSrc, imageSavePath);
        } else {
            process.send(`内容 ${videoData.url} 没有可用的图片源，跳过下载`);
        }

        return videoDownloaded || imageDownloaded;
    }

    async saveVideoDataIfDownloaded(videoData) {
        const videoPath = videoData.savePath;
        const imagePath = path.join(this.downloadDir, `img_${videoData.vid}.jpg`);

        try {
            const videoExists = await fs.access(videoPath).then(() => true).catch(() => false);
            const imageExists = await fs.access(imagePath).then(() => true).catch(() => false);

            if (videoExists || imageExists) {
                await this.saveVideoData(videoData);
                process.send(`视频 ${videoData.vid} 已成功下载并更新到数据库`);
            } else {
                process.send(`视频 ${videoData.vid} 下载失败，未添加到数据库`);
            }
        } catch (error) {
            process.send(`检查文件或保存数据时出错: ${error.message}`);
        }
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async saveCookies() {
        const cookies = await this.page.cookies();
        await fs.writeFile(this.cookiesPath, JSON.stringify(cookies, null, 2));
        process.send('Cookies 已保存');
    }

    async loadCookies() {
        try {
            const cookiesString = await fs.readFile(this.cookiesPath, 'utf-8');
            const cookies = JSON.parse(cookiesString);
            await this.page.setCookie(...cookies);
            process.send('Cookies 已加载');
        } catch (error) {
            if (error.code === 'ENOENT') {
                process.send('Cookies 文件不存在，将在首次登录后创建');
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
                    process.send(`保存视频数据到数据库时出错: ${err.message}`);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    t(key, params = {}) {
        return getTranslation(this.language, key, params);
    }
}

// 解析命令行参数
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
    .argv;

const downloader = new XiaohongshuDownloader(
    argv.scrollAttempts,
    argv.maxScrollAttempts,
    argv.type,
    argv.downloadDir,
    argv.dbPath,
    argv.userDataPath,
    argv.language
);
downloader.run().catch(error => process.send(`Error: ${error.message}`));