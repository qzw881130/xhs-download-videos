import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import FavoriteVideos from './components/FavoriteVideos';
import VideoPlayer from './components/VideoPlayer';
import AboutPage from './pages/AboutPage';
import packageInfo from '../package.json';
import DownloadConfigPage from './pages/DownloadConfigPage';
import { getTranslation } from './i18n';

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

    useEffect(() => {
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

        // 调用 Electron API 保存语言设置到配置文件
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

    return (
        <Router>
            <div className="App flex flex-col min-h-screen">
                {!location.hash.startsWith('#/video-player') && (
                    <nav className="bg-gray-800 p-4">
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
                                <NavLink to="/about" className={({ isActive }) => isActive ? "text-white font-bold" : "text-gray-300 hover:text-white"}>
                                    {t('about')}
                                </NavLink>
                            </li>
                            <li className="ml-auto absolute right-4 top-4">
                                <select
                                    value={language}
                                    onChange={handleLanguageChange}
                                    className="bg-gray-700 text-white rounded"
                                >
                                    <option value="zh">中文</option>
                                    <option value="en">English</option>
                                </select>
                            </li>
                        </ul>
                    </nav>
                )}
                <div className="container mx-auto mt-8 flex-grow">
                    <Routes>
                        <Route path="/about" element={<AboutPage language={language} />} />
                        <Route path="/" element={<DownloadConfigPage language={language} />} />
                        <Route path="/liked" element={<FavoriteVideos type="liked" language={language} />} />
                        <Route path="/collected" element={<FavoriteVideos type="collected" language={language} />} />
                        <Route path="/post" element={<FavoriteVideos type="post" language={language} />} />
                        <Route path="/video-player/:vid" element={<VideoPlayer language={language} />} />
                    </Routes>
                </div>
                <Footer language={language} />
            </div>
        </Router>
    );
}

export default App;