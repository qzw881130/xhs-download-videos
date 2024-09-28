import React, { useEffect, useState, useRef } from 'react';
import '../styles/DownloadConfig.css';
import { getTranslation } from '../i18n';

function DownloadConfig({ language }) {
    const t = (key) => getTranslation(language, key);

    const [downloadType, setDownloadType] = useState('liked');
    const [startPosition, setStartPosition] = useState(0);
    const [endPosition, setEndPosition] = useState(10);
    const [downloadPath, setDownloadPath] = useState('');
    const [isDownloadVideo, setIsDownloadVideo] = useState(false);
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
        async function fetchIsDownloadVideo() {
            const isDownloadVideo = await window.electron.getIsDownloadVideo();
            setIsDownloadVideo(isDownloadVideo);
        }
        fetchIsDownloadVideo();

        window.electron.onLogMessage((message) => {
            setLogs((prevLogs) => [...prevLogs, message + '\n']);
        });

        return () => {
            window.electron.removeLogMessageListener();
        };
    }, []);

    const handleStartDownload = async () => {
        try {
            await window.electron.startDownloader(startPosition, endPosition, downloadType);
            setLogs(prevLogs => [...prevLogs, t('startDownloadLog', { type: t(downloadType), start: startPosition, end: endPosition }).replace('{type}', t(downloadType)).replace('{start}', startPosition).replace('{end}', endPosition)]);
        } catch (error) {
            console.error('Error starting downloader:', error);
            setLogs(prevLogs => [...prevLogs, t('downloadUnavailable')]);
        }
    };

    const handleChangeDownloadPath = async () => {
        const newPath = await window.electron.selectDirectory();
        if (newPath) {
            setDownloadPath(newPath);
            await window.electron.setStoredDownloadPath(newPath);
        }
    };

    const handleOpenDirectory = async () => {
        await window.electron.openDirectory(downloadPath);
    };

    const handleIsDownloadVideo = async (evt) => {
        console.log('isDownloadVideo===', isDownloadVideo, !!evt.target.checked)
        setIsDownloadVideo(!!evt.target.checked);
        await window.electron.storeIsDownloadVideo(!!evt.target.checked);
    }

    return (
        <div className="download-configd">
            <h2 className="text-xl font-bold mb-4">{t('downloadConfig')}</h2>
            <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                <h4 className="font-bold mb-2">{t('noticeTitle')}</h4>
                <ul className="list-disc list-inside">
                    <li>{t('noticePoint1')}</li>
                    <li>{t('noticePoint2')}</li>
                    <li>{t('noticePoint3')}</li>
                </ul>
            </div>
            <div className="control-panel">

                <div className="form-row w-2/3">
                    <div className="form-group flex items-center">
                        <label htmlFor="downloadPath" className="mr-2 whitespace-nowrap">{t('downloadPath')}</label>
                        <input
                            type="text"
                            id="downloadPath"
                            value={downloadPath}
                            readOnly
                            className="flex-grow mr-2"
                        />
                        <button
                            onClick={handleChangeDownloadPath}
                            className="bg-primary-300 text-white px-2 py-1 m-1 rounded whitespace-nowrap"
                        >
                            {t('modify')}
                        </button>
                        <button
                            onClick={handleOpenDirectory}
                            className="bg-secondary-300 text-white px-2 py-1 m-1 rounded whitespace-nowrap"
                        >
                            {t('openDownloadDir')}
                        </button>
                    </div>
                </div>
                <div className="form-row mt-3 flex">
                    <div className="form-group flex flex-row items-center w-1/6">
                        <label htmlFor="downloadVideo" className=''>{t('DownloadVideoToLocal')}</label>
                        <input
                            type="checkbox"
                            id="downloadVideo"
                            checked={isDownloadVideo}
                            onChange={handleIsDownloadVideo}
                            className="mr-2 flex-1"
                        />
                    </div>
                    <div className='w-5/6'>
                        <p className="text-sm bg-yellow-100 border-yellow-500 text-yellow-700 p-2 ml-2 inline-block">
                            {t('remoteVideoReminder', '提醒：视频播放链接来自远程，不受本地影响。因此可以选择不下载到本地。')}
                        </p>
                    </div>
                </div>
                <div className="form-row mt-3">
                    <div className="form-group">
                        <label htmlFor="downloadType">{t('downloadType')}</label>
                        <select
                            id="downloadType"
                            value={downloadType}
                            onChange={(e) => setDownloadType(e.target.value)}
                        >
                            <option value="liked">{t('likedVideos')}</option>
                            <option value="collected">{t('collectedVideos')}</option>
                            <option value="post">{t('videoNotes')}</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="startPosition">{t('startScrollPosition')}</label>
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
                        <label htmlFor="endPosition">{t('endScrollPosition')}</label>
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
                        <button onClick={handleStartDownload} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 m-1 rounded transition duration-300 ease-in-out">
                            {t('loginAndDownload')}
                        </button>
                    </div>
                </div>
            </div>
            <div className="log-area">
                <h3>{t('downloadLog')}</h3>
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