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
                                    喜欢的视频
                                </NavLink>
                            </li>
                        </ul>
                    </nav>
                )}
                <div className="container mx-auto mt-8 flex-grow">
                    <Routes>
                        <Route path="/liked" element={<LikedVideos />} />
                        <Route path="/" element={<DownloadConfig />} />
                        <Route path="/liked-videos" element={<FavoriteVideos type="liked" />} />
                        <Route path="/saved-videos" element={<FavoriteVideos type="saved" />} />
                        <Route path="/video-player/:vid" element={<VideoPlayer />} />
                    </Routes>
                </div>
                <Footer />
            </div>
        </Router>
    );
}

export default App;