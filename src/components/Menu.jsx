import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Menu.css';

function Menu() {
    const location = useLocation();

    return (
        <nav className="menu">
            <ul>
                <li className={location.pathname === '/download-config' ? 'active' : ''}>
                    <Link to="/download-config">下载视频配置</Link>
                </li>
                <li className={location.pathname === '/liked-videos' ? 'active' : ''}>
                    <Link to="/liked-videos">我的点赞视频</Link>
                </li>
                <li className={location.pathname === '/favorite-videos' ? 'active' : ''}>
                    <Link to="/favorite-videos">我的收藏视频</Link>
                </li>
                <li className={location.pathname === '/video-notes' ? 'active' : ''}>
                    <Link to="/video-notes">我的视频笔记</Link>
                </li>
            </ul>
        </nav>
    );
}

export default Menu;