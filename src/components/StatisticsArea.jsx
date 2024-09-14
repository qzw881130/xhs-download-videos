import React from 'react';

function StatisticsArea() {
    return (
        <div className="statistics-area mb-6">
            <h2 className="text-xl font-bold mb-4">统计信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">我的点赞视频</h3>
                    <p className="text-3xl font-bold text-blue-600">
                        {/* 这里需要从后端获取实际数据 */}
                        <span id="likedVideosCount">0</span>
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">我的收藏视频</h3>
                    <p className="text-3xl font-bold text-green-600">
                        {/* 这里需要从后端获取实际数据 */}
                        <span id="collectedVideosCount">0</span>
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">我的视频笔记</h3>
                    <p className="text-3xl font-bold text-purple-600">
                        {/* 这里需要从后端获取实际数据 */}
                        <span id="videoNotesCount">0</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default StatisticsArea;