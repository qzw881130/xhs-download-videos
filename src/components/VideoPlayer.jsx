import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function VideoPlayer() {
    const [videoDetails, setVideoDetails] = useState(null);
    const { vid } = useParams();

    useEffect(() => {
        const fetchVideoDetails = async () => {
            try {
                const details = await window.electron.getVideoDetails(vid);
                setVideoDetails(details);
            } catch (error) {
                console.error('Error fetching video details:', error);
            }
        };

        fetchVideoDetails();
    }, [vid]);

    if (!videoDetails) {
        return <div>Loading...</div>;
    }

    return (
        <div className="video-player p-4 h-screen flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">{videoDetails.title}</h1>
                <a href={videoDetails.page_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    原链接
                </a>
            </div>
            <div className="flex mb-4 flex-grow">
                <div className="w-2/3 pr-4">
                    <div className="h-full">
                        <video src={videoDetails.video_src} controls className="w-full h-full object-contain"></video>
                    </div>
                </div>
                <div className="w-1/3 bg-gray-100 p-4 rounded flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-semibold mb-2">控制面板</h2>
                        <div className="flex justify-between mb-2">
                            <button className="bg-blue-500 text-white px-2 py-1 rounded">0.5x</button>
                            <button className="bg-blue-500 text-white px-2 py-1 rounded">1x</button>
                            <button className="bg-blue-500 text-white px-2 py-1 rounded">1.5x</button>
                            <button className="bg-blue-500 text-white px-2 py-1 rounded">2x</button>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <button className="bg-green-500 text-white px-4 py-2 rounded">上一个</button>
                        <button className="bg-green-500 text-white px-4 py-2 rounded">下一个</button>
                    </div>
                </div>
            </div>
            <div className="flex overflow-x-auto">
                {/* 这里需要添加逻辑来获取和显示相邻的视频 */}
                {[...Array(5)].map((_, index) => (
                    <div key={index} className={`flex-shrink-0 w-1/5 px-2 ${index === 2 ? 'border-4 border-blue-500' : ''}`}>
                        <img src="placeholder.jpg" alt="Video thumbnail" className="w-full h-24 object-cover mb-2" />
                        <p className="text-sm truncate">视频标题 {index + 1}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default VideoPlayer;