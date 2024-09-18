import React, { useState, useEffect } from 'react';
import packageInfo from '../../package.json';
import KofiButton from './KofiButton';
import wxpay from '@/assets/images/wxpay.jpg';
import alipay from '@/assets/images/alipay.jpg';
import { getTranslation } from '../i18n'; // 添加这行

function About({ language }) { // 添加 language 参数
    const t = (key) => getTranslation(language, key); // 添加这行

    const [configPath, setConfigPath] = useState('');
    const [dbPath, setDbPath] = useState('');

    useEffect(() => {
        async function fetchPaths() {
            try {
                const config = await window.electron.getConfigPath();
                const db = await window.electron.getDbPath();
                setConfigPath(config);
                setDbPath(db);
            } catch (error) {
                console.error('Error fetching paths:', error);
                setConfigPath('Error fetching path');
                setDbPath('Error fetching path');
            }
        }
        fetchPaths();
    }, []);

    return (
        <>
            <div className="about-page bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold mb-6">{t('aboutTitle')}</h1>
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">{t('introduction')}</h2>
                    <p>{t('aboutDescription1')}</p>
                    <p>{t('aboutDescription2')}</p>
                    <p>{t('aboutDescription3')}</p>
                </div>
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">{t('appInfo')}</h2>
                    <p>{t('currentVersion')}: <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">{packageInfo.version}</span></p>
                    <p>{t('configPath')}: <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">{configPath}</span></p>
                    <p>{t('dbPath')}: <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">{dbPath}</span></p>
                </div>
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">{t('features')}</h2>
                    <ul className="list-disc list-inside">
                        <li>{t('feature1')}</li>
                        <li>{t('feature2')}</li>
                        <li>{t('feature3')}</li>
                        <li>{t('feature4')}</li>
                    </ul>
                </div>
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">{t('contact')}</h2>
                    <p>{t('author')}: <a href="mailto:qianzhiwei5921@gmail.com" className="text-blue-500 hover:underline">qianzhiwei5921@gmail.com</a></p>
                </div>
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">{t('donate')}</h2>
                    <p>{t('donateDescription')}</p>
                    <div className="flex justify-around items-center">
                        <div className="flex justify-center items-center space-x-4">
                            <div className="text-center">
                                <img src={wxpay} alt={t('wechatDonation')} className="w-1/3 mx-auto" />
                            </div>
                            <div className="text-center">
                                <img src={alipay} alt={t('alipayDonation')} className="w-1/3 mx-auto" />
                            </div>
                            <div className="text-center">
                                <KofiButton />
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-2">{t('disclaimer')}</h2>
                    <p className="text-sm text-gray-600">{t('disclaimerContent')}</p>
                </div>
                <div className="mb-5">
                    <h2 className="text-xl font-semibold mb-2">{t('changelog')}</h2>
                    <ul className="list-disc list-inside">
                        <li>{t('changelogEntry')}</li>
                    </ul>
                </div>
            </div>
        </>
    );
}

export default About;