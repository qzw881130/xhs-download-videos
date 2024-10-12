import React, { useEffect, useState } from 'react';
import { getTranslation } from '../i18n';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

function SyncServer({ language }) {
    const t = (key) => getTranslation(language, key);
    const { user, isLoading, isAuthChecking, openLoginModal, logout } = useAuth();
    const [statistics, setStatistics] = useState({
        localTotal: 0,
        remoteTotal: 0,
        pendingSync: 0,
    });
    const [serverStatus, setServerStatus] = useState('stopped');
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [refreshTime, setRefreshTime] = useState(new Date());

    useEffect(() => {
        window.electron.requestSyncStatistics();
    }, []);

    useEffect(() => {
        window.electron.onLogMessage((message) => {
            // setLogs((prevLogs) => [...prevLogs, message + '\n']);
        });

        window.electron.onSyncServerStatusChange((status) => {
            setServerStatus(status);
        });

        window.electron.onSyncStatisticsUpdate((newStats) => {
            setStatistics(newStats);
        });

        window.electron.onLastSyncTimeUpdate((time) => {
            setLastSyncTime(new Date(time));
        });

        const intervalId = setInterval(() => {
            setRefreshTime(new Date());
        }, 1000);

        const statsIntervalId = setInterval(() => {
            window.electron.requestSyncStatistics();
        }, 5000);

        return () => {
            window.electron.removeLogMessageListener();
            window.electron.removeSyncServerStatusChangeListener();
            window.electron.removeSyncStatisticsUpdateListener();
            window.electron.removeLastSyncTimeUpdateListener();
            clearInterval(intervalId);
            clearInterval(statsIntervalId);
        };
    }, []);

    const handleStartServer = () => {
        window.electron.startSyncServer();
    };

    const handleStopServer = () => {
        window.electron.stopSyncServer();
    };

    const handleSignOut = async () => {
        try {
            await logout();
            toast.success(t('Sign_out_successful'), { autoClose: 1000 });
        } catch (error) {
            console.error('Error signing out:', error);
            toast.error(t('Error signing out'));
        }
    };

    return (
        <div className="sync-server-container">
            <h2 className="text-2xl font-bold mb-4 flex items-center">{t('syncServer')}</h2>

            {isAuthChecking ? (
                <div>Checking authentication...</div>
            ) : user ? (
                <>
                    <div className="flex items-center">
                        <button
                            onClick={handleStartServer}
                            className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2 ${serverStatus === 'running' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={serverStatus === 'running'}
                        >
                            {t('startServer')}
                        </button>
                        <div className="text-gray-600 ml-auto flex flex-col gap-2">
                            <span>
                                <span className='font-bold bg-green-200 text-green-600 p-1 rounded-md'>{t('refreshTime')}</span> {refreshTime.toLocaleString()}
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
                </>
            ) : (
                <button
                    onClick={openLoginModal}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                    {t('Login_or_SignUp')}
                </button>
            )}
            <LoginModal language={language} />
        </div>
    );
}

export default SyncServer;
