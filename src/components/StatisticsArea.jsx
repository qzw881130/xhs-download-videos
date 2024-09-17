import React, { useState, useEffect } from 'react';
import { getTranslation } from '../i18n';

function StatisticsArea({ language }) {
    const t = (key) => getTranslation(language, key);

    const [statistics, setStatistics] = useState({
        likedCount: 0,
        collectedCount: 0,
        postCount: 0,
        lastUpdateTime: new Date().toISOString(),
        storageSize: 0
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

    const formatStorageSize = (bytes) => {
        if (bytes >= 1024 * 1024 * 1024) {
            return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
    };

    return (
        <div className="statistics-area mb-6">
            <h2 className="text-xl font-bold mb-4 flex justify-between items-center">
                <span>{t('Statistics')}</span>
                <span className="text-sm font-normal">
                    {t('updateTime')}: {new Date(statistics.lastUpdateTime).toLocaleString()}
                </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">{t('likedVideos')}</h3>
                    <p className="text-3xl font-bold text-blue-600">
                        <span id="likedVideosCount">{statistics.likedCount}</span>
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">{t('collectedVideos')}</h3>
                    <p className="text-3xl font-bold text-green-600">
                        <span id="collectedVideosCount">{statistics.collectedCount}</span>
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">{t('videoNotes')}</h3>
                    <p className="text-3xl font-bold text-purple-600">
                        <span id="videoNotesCount">{statistics.postCount}</span>
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">{t('hiddenVideos')}</h3>
                    <p className="text-3xl font-bold text-red-600">
                        <span id="hiddenVideosCount">{statistics.hiddenCount}</span>
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">{t('storageSize')}</h3>
                    <p className="text-3xl font-bold text-orange-600">
                        <span id="storageSize">{formatStorageSize(statistics.storageSize)}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default StatisticsArea;