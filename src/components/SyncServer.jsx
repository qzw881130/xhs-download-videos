import React, { useEffect, useState, useRef } from 'react';
import { getTranslation } from '../i18n';

function SyncServer({ language }) {
    const t = (key) => getTranslation(language, key);
    const [statistics, setStatistics] = useState({
        localTotal: 0,
        remoteTotal: 0,
        pendingSync: 0,
    });

    const [logs, setLogs] = useState([]);
    const logTextareaRef = useRef(null);

    useEffect(() => {
        window.electron.onLogMessage((message) => {
            setLogs((prevLogs) => [...prevLogs, message + '\n']);
        });

        return () => {
            window.electron.removeLogMessageListener();
        };

        window.electron.onSyncServerStatusChange((status) => {
            setServerStatus(status);
        });

        return () => {
            window.electron.removeSyncServerStatusChangeListener();
        };
    }, []);

    const handleStartServer = () => {
        window.electron.startSyncServer();
    };

    const handleStopServer = () => {
        window.electron.stopSyncServer();
    };

    return (
        <div className="sync-server-container">
            <h2 className="text-2xl font-bold mb-4 flex items-center">{t('syncServer')}</h2>
            <div className="flex items-center">
                <button onClick={handleStartServer} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2">
                    {t('startServer')}
                </button>
                <button onClick={handleStopServer} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mr-2">
                    {t('stopServer')}
                </button>
                <div className="text-gray-600 ml-auto flex flex-col gap-2">
                    <span>
                        <span className='font-bold bg-green-200 text-green-600 p-1 rounded-md'>{t('lastSyncTime')}</span> {new Date().toLocaleString('zh-CN', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span>
                        <span className='font-bold bg-green-200 text-green-600 p-1 rounded-md'>{t('refreshTime')}</span> {new Date().toLocaleString('zh-CN', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </div>

            <div className="statistics-area mt-6 bg-gray-100 p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-3">{t('statistics')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stat-item bg-white p-3 rounded shadow">
                        <span className="stat-label text-gray-600 block mb-1">{t('localTotal')}</span>
                        <span className="stat-value text-2xl font-bold text-blue-600">{statistics.localTotal}</span>
                    </div>
                    <div className="stat-item bg-white p-3 rounded shadow">
                        <span className="stat-label text-gray-600 block mb-1">{t('remoteTotal')}</span>
                        <span className="stat-value text-2xl font-bold text-green-600">{statistics.remoteTotal}</span>
                    </div>
                    <div className="stat-item bg-white p-3 rounded shadow">
                        <span className="stat-label text-gray-600 block mb-1">{t('pendingSync')}</span>
                        <span className="stat-value text-2xl font-bold text-orange-600">{statistics.pendingSync}</span>
                    </div>
                </div>
            </div>

            <textarea
                ref={logTextareaRef}
                value={logs.join('')}
                readOnly
                className="mt-6 w-full h-40 p-2 border rounded"
            />
        </div>
    );
}

export default SyncServer;