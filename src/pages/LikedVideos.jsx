import React from 'react';
import FavoriteVideos from '../components/FavoriteVideos';

function LikedVideos() {
    return (
        <div className="liked-videos-page">
            <h1>我喜欢的视频</h1>
            <FavoriteVideos type="liked" />
        </div>
    );
}

export default LikedVideos;