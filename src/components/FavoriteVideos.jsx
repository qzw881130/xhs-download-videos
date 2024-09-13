import React from 'react';

function FavoriteVideos({ type }) {
    // 根据 type 显示不同类型的视频（喜欢的或收藏的）
    return (
        <div className="favorite-videos">
            <h2>{type === 'liked' ? '喜欢的视频' : '收藏的视频'}</h2>
            {/* 这里添加视频列表的渲染逻辑 */}
        </div>
    );
}

export default FavoriteVideos;