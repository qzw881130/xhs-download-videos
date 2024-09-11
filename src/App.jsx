import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Menu from './components/Menu';
import DownloadConfig from './components/DownloadConfig';
import LikedVideos from './components/LikedVideos';
import FavoriteVideos from './components/FavoriteVideos';
import VideoNotes from './components/VideoNotes';
// import './App.css';  // 暂时注释掉这行

function App() {
    return (
        <Router>
            <div className="App" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                <Menu />
                <Routes>
                    <Route path="/" element={<DownloadConfig />} />
                    <Route path="/download-config" element={<DownloadConfig />} />
                    <Route path="/liked-videos" element={<LikedVideos />} />
                    <Route path="/favorite-videos" element={<FavoriteVideos />} />
                    <Route path="/video-notes" element={<VideoNotes />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;