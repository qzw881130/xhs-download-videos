import React from 'react';
import { HashRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import LikedVideos from './pages/LikedVideos';
import DownloadConfig from './pages/DownloadConfig';
import FavoriteVideos from './components/FavoriteVideos';
import VideoPlayer from './components/VideoPlayer';


function Footer() {
    return (
        <footer className="bg-gray-800 text-white p-4 mt-8">
            <div className="container mx-auto text-center">
                <p>Author: qianzhiwei5921@gmail.com</p>
            </div>
        </footer>
    );
}

function App() {
    return (
        <Router>
            <div className="App flex flex-col min-h-screen">
                {!location.hash.startsWith('#/video-player') && (
                    <nav className="bg-gray-800 p-4">
                        <ul className="flex justify-center space-x-8">
                            <li>
                                <NavLink
                                    to="/"
                                    className={({ isActive }) =>
                                        isActive ? "text-white font-bold" : "text-gray-300 hover:text-white"
                                    }
                                >
                                    下载配置
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="/liked"
                                    className={({ isActive }) =>
                                        isActive ? "text-white font-bold" : "text-gray-300 hover:text-white"
                                    }
                                >
                                    我的点赞视频
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="/collected"
                                    className={({ isActive }) =>
                                        isActive ? "text-white font-bold" : "text-gray-300 hover:text-white"
                                    }
                                >
                                    我的收藏视频
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to="/post"
                                    className={({ isActive }) =>
                                        isActive ? "text-white font-bold" : "text-gray-300 hover:text-white"
                                    }
                                >
                                    我的视频笔记
                                </NavLink>
                            </li>
                        </ul>
                    </nav>
                )}
                <div className="container mx-auto mt-8 flex-grow">
                    <Routes>
                        <Route path="/liked" element={<FavoriteVideos type="liked" />} />
                        <Route path="/" element={<DownloadConfig />} />
                        <Route path="/collected" element={<FavoriteVideos type="collected" />} />
                        <Route path="/post" element={<FavoriteVideos type="post" />} />
                        <Route path="/video-player/:vid" element={<VideoPlayer />} />
                    </Routes>
                </div>
                <Footer />
            </div>
        </Router>
    );
}

export default App;