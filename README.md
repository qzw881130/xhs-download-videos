# xhs-download-videos

## 小红书下载自己点赞视频


## Installation
```
npm install
```

## Usage
```
➜  xhs-download-video git:(main) ✗ node xiaohongshu_downloader.js --help             
Options:
      --help               Show help                                   [boolean]
      --version            Show version number                         [boolean]
  -s, --scrollAttempts     预滚动次数                           [number] [default: 0]
  -m, --maxScrollAttempts  最大滚动次数                        [number] [default: 200]


node xiaohongshu_downloader.js --scrollAttempts=0 --maxScrollAttempts=300
node xiaohongshu_downloader.js --scrollAttempts=0 --maxScrollAttempts=3 --type=liked
node xiaohongshu_downloader.js --scrollAttempts=0 --maxScrollAttempts=3 --type=collected
node xiaohongshu_downloader.js --scrollAttempts=0 --maxScrollAttempts=3 --type=post
```