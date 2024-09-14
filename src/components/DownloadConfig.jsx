import React, { useEffect, useState, useRef } from 'react';
import '../styles/DownloadConfig.css';

function DownloadConfig() {
    const [downloadType, setDownloadType] = useState('liked');
    const [startPosition, setStartPosition] = useState(0);
    const [endPosition, setEndPosition] = useState(10);
    const [logs, setLogs] = useState('');
    const logTextareaRef = useRef(null);

    useEffect(() => {
        // 添加监听器
        if (window.electron && window.electron.onLogMessage) {
            window.electron.onLogMessage((message) => {
                setLogs(prevLogs => prevLogs + message + '\n');
                if (logTextareaRef.current) {
                    logTextareaRef.current.scrollTop = logTextareaRef.current.scrollHeight;
                }
            });
        } else {
            console.error('electron API is not available');
        }

        // 清理函数
        return () => {
            // 如果有清理监听器的方法，应该在这里调用
        };
    }, []);

    const handleStartDownload = () => {
        if (window.electron && window.electron.xiaohongshuDownloader) {
            window.electron.xiaohongshuDownloader(startPosition, endPosition, downloadType);
            setLogs(prevLogs => prevLogs + `开始下载，类型：${downloadType}，从 ${startPosition} 到 ${endPosition}\n`);
        } else {
            console.error('xiaohongshuDownloader is not available');
            setLogs(prevLogs => prevLogs + '下载功能暂时不可用\n');
        }
    };

    return (
        <div className="download-config">
            <div className="control-panel">
                <h2>下载视频配置</h2>
                <div className="form-row">
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
                        <label htmlFor="startPosition">开始滚屏位置：</label>
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
                        <label htmlFor="endPosition">结束滚屏位置：</label>
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