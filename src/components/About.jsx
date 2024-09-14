import React from 'react';
import packageInfo from '../../package.json';

function About() {
    return (
        <div className="about-page bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6">关于小红书视频下载器</h1>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">版本信息</h2>
                <p>当前版本: <span className="font-mono">{packageInfo.version}</span></p>
            </div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">功能介绍</h2>
                <ul className="list-disc list-inside">
                    <li>下载小红书点赞视频</li>
                    <li>下载小红书收藏视频</li>
                    <li>下载小红书视频笔记</li>
                    <li>视频播放和管理</li>
                </ul>
            </div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">联系方式</h2>
                <p>作者: <a href="mailto:qianzhiwei5921@gmail.com" className="text-blue-500 hover:underline">qianzhiwei5921@gmail.com</a></p>
            </div>
            <div>
                <h2 className="text-xl font-semibold mb-2">免责声明</h2>
                <p className="text-sm text-gray-600">
                    本软件仅供个人学习和研究使用。用户应遵守相关法律法规，不得将本软件用于任何非法用途。作者不对使用本软件造成的任何损失或法律责任负责。
                </p>
            </div>
        </div>
    );
}

export default About;