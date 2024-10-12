import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import FavoriteVideos from './components/FavoriteVideos';
import VideoPlayer from './components/VideoPlayer';
import AboutPage from './pages/AboutPage';
import packageInfo from '../package.json';
import DownloadConfigPage from './pages/DownloadConfigPage';
import { getTranslation } from './i18n';
import logo from '@/assets/images/icon_48x48.png';
import SyncServerPage from './pages/SyncServerPage';
import LoginModal from './components/LoginModal';
import UserMenu from './components/UserMenu';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';

function Footer({ language }) {
    const t = (key) => getTranslation(language, key);
    return (
        <footer className="bg-gray-800 text-white p-4 mt-8">
            <div className="container mx-auto text-center">
                <p>{t('author')}: <strong className="text-blue-400">qianzhiwei5921@gmail.com</strong> | {t('version')}: <strong className="text-green-400">{packageInfo.version}</strong></p>
            </div>
        </footer>
    );
}

function App() {
    const [language, setLanguage] = useState('zh');
    const [logs, setLogs] = useState([]);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [user, setUser] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        checkSupabaseAuth();
        // 保留原有的日志监听器代码
        window.electron.ipcRenderer.on('console-log', (message) => {
            console.log('Received log message:', message);
            setLogs(prevLogs => [...prevLogs, message]);
        });

        window.electron.ipcRenderer.on('console-error', (message) => {
            console.error('Received error message:', message);
            setLogs(prevLogs => [...prevLogs, `Error: ${message}`]);
        });

        window.electron.ipcRenderer.on('log-message', (message) => {
            console.log('Received log message:', message);
            setLogs(prevLogs => [...prevLogs, message]);
        });

        // 添加新的语言设置逻辑
        const savedLanguage = localStorage.getItem('language') || 'zh';
        setLanguage(savedLanguage);

        // 清理函数
        return () => {
            window.electron.ipcRenderer.removeAllListeners('console-log');
            window.electron.ipcRenderer.removeAllListeners('console-error');
            window.electron.ipcRenderer.removeAllListeners('log-message');
        };
    }, []);

    const handleLanguageChange = async (e) => {
        const newLanguage = e.target.value;
        setLanguage(newLanguage);
        localStorage.setItem('language', newLanguage);

        // 调用 Electron API 保存语言设置到配置文档
        await window.electron.saveLanguageSetting(newLanguage);
    };

    const t = (key) => getTranslation(language, key);

    useEffect(() => {
        const fetchLanguage = async () => {
            const savedLanguage = await window.electron.getLanguageSetting();
            setLanguage(savedLanguage);
        };
        fetchLanguage();
    }, []);

    const checkSupabaseAuth = async () => {
        setIsCheckingAuth(true);
        try {
            const user = await window.electron.supabaseGetUser();
            console.log('Supabase user in App:', user);
            if (user) {
                setUser(user);
            }
        } catch (error) {
            console.error('Error checking Supabase auth:', error);
        } finally {
            setIsCheckingAuth(false);
        }
    };

    const handleLoginSuccess = (user) => {
        setUser(user);
        setShowLoginModal(false);
    };

    const handleSignOut = () => {
        setUser(null);
    };

    if (isCheckingAuth) {
        return <div>{t('loading')}</div>; // 或者使用一个加载动画组件
    }

    return (
        <AuthProvider>
            <Router>
                <div className="App flex flex-col min-h-screen">
                    <ToastContainer />
                    {!location.hash.startsWith('#/video-player') && (
                        <>
                            <div className="bg-gray-800 p-2 flex items-center">
                                <img src={logo} alt="Logo" className="mr-4" />
                                <nav className="flex-grow">
                                    <ul className="flex justify-center space-x-8">
                                        <li>
                                            <NavLink to="/" className={({ isActive }) => isActive ? "text-white font-bold" : "text-gray-300 hover:text-white"}>
                                                {t('downloadConfig')}
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/liked" className={({ isActive }) => isActive ? "text-white font-bold" : "text-gray-300 hover:text-white"}>
                                                {t('likedVideos')}
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/collected" className={({ isActive }) => isActive ? "text-white font-bold" : "text-gray-300 hover:text-white"}>
                                                {t('collectedVideos')}
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/post" className={({ isActive }) => isActive ? "text-white font-bold" : "text-gray-300 hover:text-white"}>
                                                {t('videoNotes')}
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/sync-server" className={({ isActive }) => isActive ? "text-white font-bold" : "text-gray-300 hover:text-white"}>
                                                {t('syncServer')}
                                            </NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/about" className={({ isActive }) => isActive ? "text-white font-bold" : "text-gray-300 hover:text-white"}>
                                                {t('about')}
                                            </NavLink>
                                        </li>
                                    </ul>
                                </nav>
                                <div className="ml-auto flex items-center">
                                    {user ? (
                                        <UserMenu
                                            user={user}
                                            language={language}
                                            onSignOut={handleSignOut}
                                        />
                                    ) : (
                                        <button
                                            onClick={() => setShowLoginModal(true)}
                                            className="text-white hover:text-gray-300 mr-4"
                                        >
                                            {t('login')}
                                        </button>
                                    )}
                                    <select
                                        value={language}
                                        onChange={handleLanguageChange}
                                        className="bg-gray-700 text-white rounded"
                                    >
                                        <option value="zh">中文</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="container mx-auto mt-8 flex-grow">
                        <Routes>
                            <Route path="/about" element={<AboutPage language={language} />} />
                            <Route path="/" element={<DownloadConfigPage language={language} />} />
                            <Route path="/liked" element={<FavoriteVideos type="liked" language={language} />} />
                            <Route path="/collected" element={<FavoriteVideos type="collected" language={language} />} />
                            <Route path="/post" element={<FavoriteVideos type="post" language={language} />} />
                            <Route path="/video-player/:vid" element={<VideoPlayer language={language} />} />
                            <Route path="/sync-server" element={<SyncServerPage language={language} />} />
                        </Routes>
                    </div>
                    <Footer language={language} />
                    <LoginModal
                        language={language}
                        isOpen={showLoginModal}
                        onClose={() => setShowLoginModal(false)}
                        onLoginSuccess={handleLoginSuccess}
                    />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
