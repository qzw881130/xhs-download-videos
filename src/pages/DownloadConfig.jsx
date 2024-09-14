import React from 'react';
import DownloadConfigComponent from '../components/DownloadConfig';
import StatisticsArea from '../components/StatisticsArea';

function DownloadConfig() {
    return (
        <div className="download-config-page">
            <div className="flex flex-col space-y-6">
                <div>
                    <StatisticsArea />
                </div>
                <div>
                    <DownloadConfigComponent />
                </div>
            </div>
        </div>
    );
}

export default DownloadConfig;