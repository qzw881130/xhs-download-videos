import React from 'react';
import FavoriteVideos from '../components/FavoriteVideos';

function LikedVideos() {
    return (
        <div className="liked-videos-page">
            <h1>我的点赞视频</h1>
            <FavoriteVideos type="liked" />
        </div>
    );
}

export default LikedVideos;