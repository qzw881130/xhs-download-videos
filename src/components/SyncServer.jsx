import React, { useEffect, useState, useRef } from 'react';
import { getTranslation } from '../i18n';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFacebook, FaGithub, FaGoogle, FaTwitter, FaApple } from 'react-icons/fa';

function SyncServer({ language }) {
    const t = (key) => getTranslation(language, key);
    const [statistics, setStatistics] = useState({
        localTotal: 0,
        remoteTotal: 0,
        pendingSync: 0,
    });
    const [serverStatus, setServerStatus] = useState('stopped');
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [refreshTime, setRefreshTime] = useState(new Date());

    const [supabaseUser, setSupabaseUser] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false); // Add remember me state
    const [isLoading, setIsLoading] = useState(false); // Add loading state

    useEffect(() => {
        checkSupabaseAuth();
    }, []);

    useEffect(() => {
        // Retrieve email and password from local storage if remember me is checked
        const storedEmail = localStorage.getItem('loginEmail');
        const storedPassword = localStorage.getItem('loginPassword');
        const storedRememberMe = localStorage.getItem('rememberMe') === 'true';

        if (storedRememberMe) {
            setLoginEmail(storedEmail || '');
            setLoginPassword(storedPassword || '');
            setRememberMe(storedRememberMe);
        }
    }, []);

    const checkSupabaseAuth = async () => {
        try {
            const user = await window.electron.supabaseGetUser();
            console.log('Supabase user in React:', user);
            if (user) {
                setSupabaseUser(user);
            } else {
                setShowLoginModal(true);
            }
        } catch (error) {
            console.error('Error checking Supabase auth:', error);
            setShowLoginModal(true);
        }
    };

    const handleSupabaseSignUp = async () => {
        setIsLoading(true); // Set loading state
        try {
            const user = await window.electron.supabaseSignUp(loginEmail, loginPassword);
            setSupabaseUser(user);
            setShowLoginModal(false);
            toast.success(t('Sign up successful'), { autoClose: 1000 });
            if (rememberMe) {
                localStorage.setItem('loginEmail', loginEmail);
                localStorage.setItem('loginPassword', loginPassword);
                localStorage.setItem('rememberMe', rememberMe);
            }
        } catch (error) {
            toast.error(t('Error signing up'));
        } finally {
            setIsLoading(false); // Reset loading state
        }
    };

    const handleSupabaseSignIn = async () => {
        setIsLoading(true); // Set loading state
        try {
            const user = await window.electron.supabaseSignIn(loginEmail, loginPassword);
            setSupabaseUser(user);
            setShowLoginModal(false);
            toast.success(t('Sign in successful'), { autoClose: 1000 });
            await checkSupabaseAuth();
            if (rememberMe) {
                localStorage.setItem('loginEmail', loginEmail);
                localStorage.setItem('loginPassword', loginPassword);
                localStorage.setItem('rememberMe', rememberMe);
            }
        } catch (error) {
            toast.error(t('Error signing in'));
        } finally {
            setIsLoading(false); // Reset loading state
        }
    };

    const handleSupabaseSignOut = async () => {
        setIsLoading(true); // Set loading state
        try {
            await window.electron.supabaseSignOut();
            setSupabaseUser(null);
            setShowLoginModal(true);
            toast.success(t('Sign out successful'), { autoClose: 1000 });
        } catch (error) {
            toast.error(t('Error signing out'));
        } finally {
            setIsLoading(false); // Reset loading state
        }
    };

    const handleThirdPartySignIn = async (provider) => {
        setIsLoading(true); // Set loading state
        try {
            const data = await window.electron.supabaseSignInWithProvider(provider);
            if (data.url) {
                window.electron.openAuthWindow(data.url);
                window.electron.onOAuthCallback(async (code) => {
                    try {
                        const { session, user } = await window.electron.supabaseExchangeCodeForSession(code);
                        if (user) {
                            setSupabaseUser(user);
                            setShowLoginModal(false);
                            toast.success(t('Sign in successful'), { autoClose: 1000 });
                            await checkSupabaseAuth();
                        } else {
                            throw new Error('No user returned from session exchange');
                        }
                    } catch (error) {
                        console.error('Error exchanging code for session:', error);
                        toast.error(t('Error signing in'));
                    } finally {
                        setIsLoading(false); // Reset loading state
                    }
                });
            }
        } catch (error) {
            console.error(`Error signing in with ${provider}:`, error);
            toast.error(t(`Error signing in with ${provider}`));
            setIsLoading(false); // Reset loading state
        }
    };

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

    return (
        <div className="sync-server-container">
            <ToastContainer />
            <h2 className="text-2xl font-bold mb-4 flex items-center">{t('syncServer')}</h2>

            {showLoginModal ? (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-96">
                        <h3 className="text-xl font-bold mb-4">{t('Login_or_SignUp')}</h3>
                        <input
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder={t('Email')}
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <input
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder={t('Password')}
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <div className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="mr-2"
                            />
                            <label>{t('Remember Me')}</label>
                        </div>
                        <div className="flex justify-between mb-4">
                            <button
                                onClick={handleSupabaseSignIn}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                                disabled={isLoading} // Disable button when loading
                            >
                                {isLoading ? t('Logging in...') : t('SignIn')}
                            </button>
                            <button
                                onClick={handleSupabaseSignUp}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                                disabled={isLoading} // Disable button when loading
                            >
                                {isLoading ? t('Signing up...') : t('SignUp')}
                            </button>
                        </div>
                        <div className="mt-4">
                            <p className="text-center mb-2">{t('Or sign in with')}</p>
                            <div className="flex justify-center space-x-4">
                                <button onClick={() => handleThirdPartySignIn('facebook')} className="text-blue-600 hover:border hover:border-blue-700 bg-white hover:bg-gray-100 border-none">
                                    <FaFacebook size={24} />
                                </button>
                                <button onClick={() => handleThirdPartySignIn('github')} className="text-gray-800 hover:border hover:border-gray-900 bg-white hover:bg-gray-100 border-none">
                                    <FaGithub size={24} />
                                </button>
                                <button onClick={() => handleThirdPartySignIn('google')} className="text-red-600 hover:border hover:border-red-700 bg-white hover:bg-gray-100 border-none">
                                    <FaGoogle size={24} />
                                </button>
                                <button onClick={() => handleThirdPartySignIn('twitter')} className="text-blue-400 hover:border hover:border-blue-500 bg-white hover:bg-gray-100 border-none">
                                    <FaTwitter size={24} />
                                </button>
                                <button onClick={() => handleThirdPartySignIn('apple')} className="text-gray-800 hover:border hover:border-gray-900 bg-white hover:bg-gray-100 border-none">
                                    <FaApple size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="user-info mb-4 bg-gray-100 p-4 rounded-lg shadow">
                        <p className="text-lg">{t('logged_in_as')}: <span className="font-semibold">{supabaseUser?.email}</span></p>
                        <button
                            onClick={handleSupabaseSignOut}
                            className="mt-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                            disabled={isLoading} // Disable button when loading
                        >
                            {isLoading ? t('Signing out...') : t('signOut')}
                        </button>
                    </div>

                    {!!supabaseUser &&
                        <>
                            <div className="flex items-center">
                                <button
                                    onClick={handleStartServer}
                                    className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2 ${serverStatus === 'running' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={serverStatus === 'running'}
                                >
                                    {t('startServer')}
                                </button>
                                <button
                                    onClick={handleStopServer}
                                    className={`bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mr-2 ${serverStatus === 'stopped' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={serverStatus === 'stopped'}
                                >
                                    {t('stopServer')}
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
                    }
                </>
            )}
        </div>
    );
}

export default SyncServer;