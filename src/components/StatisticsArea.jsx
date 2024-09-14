import React, { useState, useEffect } from 'react';

function StatisticsArea() {
    const [statistics, setStatistics] = useState({
        likedCount: 0,
        collectedCount: 0,
        postCount: 0,
        lastUpdateTime: new Date().toISOString()
    });

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                const stats = await window.electron.getStatistics();
                setStatistics(stats);
            } catch (error) {
                console.error('Error fetching statistics:', error);
            }
        };

        fetchStatistics(); // Initial fetch

        const intervalId = setInterval(fetchStatistics, 5000); // Fetch every 5 seconds

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="statistics-area mb-6">
            <h2 className="text-xl font-bold mb-4 flex justify-between items-center">
                <span>统计信息</span>
                <span className="text-sm font-normal">
                    更新时间: {new Date(statistics.lastUpdateTime).toLocaleString()}
                </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">我的点赞视频</h3>
                    <p className="text-3xl font-bold text-blue-600">
                        <span id="likedVideosCount">{statistics.likedCount}</span>
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">我的收藏视频</h3>
                    <p className="text-3xl font-bold text-green-600">
                        <span id="collectedVideosCount">{statistics.collectedCount}</span>
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">我的视频笔记</h3>
                    <p className="text-3xl font-bold text-purple-600">
                        <span id="videoNotesCount">{statistics.postCount}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default StatisticsArea;