const translations = {
    zh: {
        downloadConfig: '下载配置',
        likedVideos: '我的点赞视频',
        collectedVideos: '我的收藏视频',
        videoNotes: '我的视频笔记',
        about: '关于',
        downloadPath: '下载路径：',
        modify: '修改',
        openDownloadDir: '打开下载目录',
        downloadType: '下载类型：',
        startScrollPosition: '开始滚屏位置[0~100]：',
        endScrollPosition: '结束滚屏位置[0~100]：',
        loginAndDownload: '登陆小红书&下载',
        downloadLog: '下载日志：',
        currentDownloadPath: '当前下载路径:',
        author: '作者',
        version: '版本',
        errorFetchingVideo: '获取视频信息时出错',
        loading: '加载中...',
        browserNotSupportVideo: '您的浏览器不支持 HTML5 视频。',
        type: '类型',
        createdAt: '创建时间',
        startDownloadLog: '开始下载，类型：{type}，从 {start} 到 {end}',
        downloadUnavailable: '下载功能暂时不可用',
        Statistics: '统计信息',
        updateTime: '更新时间',
        storageSize: '存储大小',
        previousPage: '上一页',
        nextPage: '下一页',
        jumpTo: '跳转',
        pageNumber: '第 {number} 页',
        total: '共',
        items: '个',
        searchPlaceholder: '输入关键词搜索',
        search: '搜索',
        likedVideos: '我的点赞视频',
        collectedVideos: '我的收藏视频',
        postVideos: '我的视频笔记',
        pageNumberOf: '第 {current} 页，共 {total} 页',
        pageNumberSimple: '第 {number} 页',
        // ... 添加更多翻译

        // 追加 About 组件的翻译
        aboutTitle: '关于小红书视频下载器',
        introduction: '介绍',
        aboutDescription1: '该软件用于下载"您"在小红书APP的点赞视频、收藏视频、视频笔记。',
        aboutDescription2: '通过"下载配置"页面，设置下载类型及相关参数，然后点击"下载"按钮，即可下载。',
        aboutDescription3: '下载的视频会保存到"下载的视频"页面，您可以在这里查看及播放下载的视频。',
        appInfo: 'APP信息',
        currentVersion: '当前版本',
        configPath: '下载配置文件路径',
        dbPath: '数据库路径',
        features: '功能介绍',
        feature1: '下载小红书点赞视频',
        feature2: '下载小红书收藏视频',
        feature3: '下载小红书视频笔记',
        feature4: '视频播放和管理',
        contact: '联系方式',
        author: '作者',
        donate: '打赏',
        donateDescription: '如果您觉得这个软件对您有帮助，欢迎打赏作者，您的支持是我最大的动力。',
        disclaimer: '免责声明',
        disclaimerContent: '本软件仅供个人学习和研究使用。用户应遵守相关法律法规，不得将本软件用于任何非法用途。作者不对使用本软件造成的任何损失或法律责任负责。',
        changelog: '更新日志',
        changelogEntry: '2024-09-14 V1.0.0 初始版本',

        // 添加 VideoPlayer 组件的翻译
        originalLink: '原链接',
        controlPanel: '控制面板',
        playbackSpeed: '播放倍速',
        playMode: '播放模式',
        singleVideoLoop: '单视频循环',
        autoPlayNext: '自动播放下一个',
        playOrder: '播放顺序',
        sequentialPlay: '顺序播放',
        randomPlay: '随机播放',
        autoPlay: '自动播放',
        previous: '上一个',
        next: '下一个',
        randomNext: '随机下一个',
        otherVideos: '其他视频',
        hide: '隐藏',
        hiddenVideos: '隐藏视频',
        wechatDonation: '微信打赏二维码',
        alipayDonation: '支付宝打赏二维码',
        noticeTitle: '注意事项',
        noticePoint1: '不要多次点击“登陆小红书&下载”按钮，避免下载混乱',
        noticePoint2: '点击“登陆小红书&下载”按钮后，要快速登陆小红书帐号。然后等待软件自动操作，不要干预',
        noticePoint3: '下载过程中，不要变更存储路径',
    },
    en: {
        downloadConfig: 'Download Config',
        likedVideos: 'My Liked Videos',
        collectedVideos: 'My Collected Videos',
        videoNotes: 'My Video Notes',
        about: 'About',
        downloadPath: 'Download Path:',
        modify: 'Modify',
        openDownloadDir: 'Open Download Directory',
        downloadType: 'Download Type:',
        startScrollPosition: 'Start Scroll Position [0-100]:',
        endScrollPosition: 'End Scroll Position [0-100]:',
        loginAndDownload: 'Login & Download',
        downloadLog: 'Download Log:',
        currentDownloadPath: 'Current Download Path:',
        author: 'Author',
        version: 'Version',
        errorFetchingVideo: 'Error fetching video information',
        loading: 'Loading...',
        browserNotSupportVideo: 'Your browser does not support HTML5 video.',
        type: 'Type',
        createdAt: 'Created At',
        startDownloadLog: 'Start downloading, type: {type}, from {start} to {end}',
        downloadUnavailable: 'Download function is temporarily unavailable',
        Statistics: 'Statistics',
        updateTime: 'Update Time',
        storageSize: 'Storage Size',
        previousPage: 'Previous',
        nextPage: 'Next',
        jumpTo: 'Jump',
        pageNumber: 'Page {number}',
        total: 'Total',
        items: 'items',
        searchPlaceholder: 'Enter keywords to search',
        search: 'Search',
        likedVideos: 'My Liked Videos',
        collectedVideos: 'My Collected Videos',
        postVideos: 'My Video Notes',
        pageNumberOf: 'Page {current} of {total}',
        pageNumberSimple: 'Page {number}',
        // ... 添加更多翻译

        // 这里可以添加 About 组件的英文翻译
        // 如果暂时没有英文翻译，可以先使用中文或者占位符
        aboutTitle: 'About Xiaohongshu Video Downloader',
        introduction: 'Introduction',
        aboutDescription1: 'This software is used to download "your" liked videos, collected videos, and video notes from the Xiaohongshu APP.',
        aboutDescription2: 'Set the download type and related parameters on the "Download Config" page, then click the "Download" button to start downloading.',
        aboutDescription3: 'Downloaded videos will be saved to the "Downloaded Videos" page, where you can view and play the downloaded videos.',
        appInfo: 'APP Information',
        currentVersion: 'Current Version',
        configPath: 'Download Config File Path',
        dbPath: 'Database Path',
        features: 'Features',
        feature1: 'Download Xiaohongshu liked videos',
        feature2: 'Download Xiaohongshu collected videos',
        feature3: 'Download Xiaohongshu video notes',
        feature4: 'Video playback and management',
        contact: 'Contact',
        author: 'Author',
        donate: 'Donate',
        donateDescription: 'If you find this software helpful, feel free to donate to the author. Your support is my greatest motivation.',
        disclaimer: 'Disclaimer',
        disclaimerContent: 'This software is for personal learning and research purposes only. Users must comply with relevant laws and regulations and must not use this software for any illegal purposes. The author is not responsible for any losses or legal liabilities caused by using this software.',
        changelog: 'Changelog',
        changelogEntry: '2024-09-14 V1.0.0 Initial version',

        // 添加 VideoPlayer 组件的翻译
        originalLink: 'Original Link',
        controlPanel: 'Control Panel',
        playbackSpeed: 'Playback Speed',
        playMode: 'Play Mode',
        singleVideoLoop: 'Single Video Loop',
        autoPlayNext: 'Auto Play Next',
        playOrder: 'Play Order',
        sequentialPlay: 'Sequential Play',
        randomPlay: 'Random Play',
        autoPlay: 'Auto Play',
        previous: 'Previous',
        next: 'Next',
        randomNext: 'Random Next',
        otherVideos: 'Other Videos',
        hide: 'Hide',
        hiddenVideos: 'Hidden Videos',
        wechatDonation: 'WeChat Donation QR Code',
        alipayDonation: 'Alipay Donation QR Code',
        noticeTitle: 'Important Notes',
        noticePoint1: 'Do not click the "login&download" button multiple times to avoid download confusion',
        noticePoint2: 'After clicking the button, quickly log in to your Xiaohongshu account. Then wait for the software to operate automatically, do not click anything',
        noticePoint3: 'Do not change the storage path during the download process',
    }
};

export function getTranslation(lang, key, params = {}) {
    if (!translations[lang] || !translations[lang][key]) {
        console.warn(`Translation missing for language: ${lang}, key: ${key}`);
        return key;
    }
    let translation = translations[lang][key];
    // Use a single regular expression to replace all placeholders at once
    translation = translation.replace(/\{(\w+)\}/g, (match, key) => {
        if (params.hasOwnProperty(key)) {
            return params[key];
        }
        // If the key is not found in params, return the original placeholder
        return match;
    });
    return translation;
}