import React, { useEffect, useState, useRef } from 'react';
import '../styles/DownloadConfig.css';

function DownloadConfig() {
    const [downloadType, setDownloadType] = useState('liked');
    const [startPosition, setStartPosition] = useState(0);
    const [endPosition, setEndPosition] = useState(10);
    const [downloadPath, setDownloadPath] = useState('');
    const [logs, setLogs] = useState([]);
    const logTextareaRef = useRef(null);

    useEffect(() => {
        async function fetchDownloadPath() {
            const storedPath = await window.electron.getStoredDownloadPath();
            if (storedPath) {
                setDownloadPath(storedPath);
            } else {
                const defaultPath = await window.electron.getDefaultDownloadPath();
                setDownloadPath(defaultPath);
            }
        }
        fetchDownloadPath();

        // 添加日志消息监听器
        window.electron.onLogMessage((message) => {
            setLogs((prevLogs) => [...prevLogs, message + '\n']);
        });

        // 清理函数
        return () => {
            window.electron.removeLogMessageListener();
        };
    }, []);

    const handleStartDownload = async () => {
        try {
            await window.electron.startDownloader(startPosition, endPosition, downloadType);
            setLogs(prevLogs => [...prevLogs, `开始下载，类型：${downloadType}，从 ${startPosition} 到 ${endPosition}`]);
        } catch (error) {
            console.error('Error starting downloader:', error);
            setLogs(prevLogs => [...prevLogs, '下载功能暂时不可用']);
        }
    };

    const handleChangeDownloadPath = async () => {
        const newPath = await window.electron.selectDirectory();
        if (newPath) {
            setDownloadPath(newPath);
            await window.electron.setStoredDownloadPath(newPath);
        }
    };

    return (
        <div className="download-configd">
            <h2 className="text-xl font-bold mb-4">下载配置</h2>
            <div className="control-panel">
                <div className="form-row">
                    <div className="form-group flex items-center">
                        <label htmlFor="downloadPath" className="mr-2 whitespace-nowrap">下载路径：</label>
                        <input
                            type="text"
                            id="downloadPath"
                            value={downloadPath}
                            onChange={(e) => setDownloadPath(e.target.value)}
                            className="flex-grow mr-2"
                        />
                        <button
                            onClick={handleChangeDownloadPath}
                            className="bg-gray-300 text-black px-2 py-1 rounded whitespace-nowrap"
                        >
                            修改
                        </button>
                    </div>
                </div>
                <div className="form-row mt-3">

                    <div className="form-group">
                        <label htmlFor="downloadType">下载类型：</label>
                        <select
                            id="downloadType"
                            value={downloadType}
                            onChange={(e) => setDownloadType(e.target.value)}
                        >
                            <option value="liked">我的点赞视频</option>
                            <option value="collected">我的收藏视频</option>
                            <option value="post">我的笔记视频</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="startPosition">开始滚屏位置[0~100]：</label>
                        <input
                            type="number"
                            id="startPosition"
                            value={startPosition}
                            onChange={(e) => setStartPosition(Math.min(Number(e.target.value), 100))}
                            min="0"
                            max="100"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="endPosition">结束滚屏位置[0~100]：</label>
                        <input
                            type="number"
                            id="endPosition"
                            value={endPosition}
                            onChange={(e) => setEndPosition(Math.min(Number(e.target.value), 100))}
                            min="0"
                            max="100"
                        />
                    </div>
                    <div className="form-group">
                        <label>&nbsp;</label>
                        <button onClick={handleStartDownload} className="bg-blue-500 text-white px-4 py-2 rounded">
                            开始下载
                        </button>
                    </div>
                </div>
            </div>
            <div className="log-area">
                <h3>下载日志：</h3>
                <textarea
                    ref={logTextareaRef}
                    value={logs}
                    readOnly
                    className="log-textarea"
                    rows="10"
                />
            </div>
        </div>
    );
}

export default DownloadConfig;