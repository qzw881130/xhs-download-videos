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