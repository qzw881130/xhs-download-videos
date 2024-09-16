import React from 'react';
import DownloadConfig from '../components/DownloadConfig';
import { getTranslation } from '../i18n';
import StatisticsArea from '../components/StatisticsArea';

function DownloadConfigPage({ language }) {
    const t = (key) => getTranslation(language, key);

    return (
        <div className="download-config-page-container">
            <h1>{t('downloadConfig')}</h1>
            <StatisticsArea language={language} />
            <DownloadConfig language={language} />
        </div>
    );
}

export default DownloadConfigPage;