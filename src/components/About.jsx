import React from 'react';
import packageInfo from '../../package.json';

function About() {
    return (
        <div className="about-page bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6">关于小红书视频下载器</h1>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">介绍</h2>
                <p>该软件用于下载“您”在小红书APP的点赞视频、收藏视频、视频笔记。</p>
                <p>通过“下载配置”页面，设置下载类型及相关参数，然后点击“下载”按钮，即可下载。</p>
                <p>下载的视频会保存到“下载的视频”页面，您可以在这里查看及播放下载的视频。</p>
            </div>
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
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">打赏</h2>
                <p>如果您觉得这个软件对您有帮助，欢迎打赏作者，您的支持是我最大的动力。</p>
                <div className="flex justify-around items-center">
                    <div className="flex justify-center items-center space-x-4">
                        <div className="text-center">
                            <img src="/src/assets/images/wxpay.jpg" alt="微信支付" className="w-1/3 mx-auto" />
                        </div>
                        <div className="text-center">
                            <img src="/src/assets/images/alipay.jpg" alt="支付宝" className="w-1/5 mx-auto" />
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <h2 className="text-xl font-semibold mb-2">免责声明</h2>
                <p className="text-sm text-gray-600">
                    本软件仅供个人学习和研究使用。用户应遵守相关法律法规，不得将本软件用于任何非法用途。作者不对使用本软件造成的任何损失或法律责任负责。
                </p>
            </div>
            <div className="mb-5">
                <h2 className="text-xl font-semibold mb-2">更新日志</h2>
                <ul className="list-disc list-inside">
                    <li>2024-09-14 V1.0.0 初始版本</li>
                </ul>
            </div>
        </div>
    );
}

export default About;