import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function VideoPlayer() {
    const [videoDetails, setVideoDetails] = useState(null);
    const { vid } = useParams();
    const navigate = useNavigate();

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

    const handleNavigation = async (direction) => {
        try {
            const newVid = await window.electron.navigateVideo(vid, direction);
            navigate(`/video-player/${newVid}`);
        } catch (error) {
            console.error(`Error navigating to ${direction} video:`, error);
            // Optionally, show an error message to the user
        }
    };

    return (
        <div className="video-player p-4 h-screen flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-xl font-bold truncate">{videoDetails.title}</h1>
                <a href={videoDetails.page_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                    原链接
                </a>
            </div>
            <div className="flex mb-2 flex-grow" style={{ minHeight: 0 }}>
                <div className="w-2/3 pr-2">
                    <div className="h-full">
                        <video src={videoDetails.video_src} controls className="w-full h-full object-contain"></video>
                    </div>
                </div>
                <div className="w-1/3 bg-gray-100 p-2 rounded flex flex-col justify-between">
                    <div className="flex flex-col h-full">
                        <div className="flex-grow">
                            <h2 className="text-base font-semibold mb-2">控制面板</h2>
                            <div className="flex justify-between mb-2">
                                {[0.5, 1, 1.5, 2].map((rate) => (
                                    <button
                                        key={rate}
                                        className={`bg-blue-500 text-white px-2 py-1 rounded text-sm ${document.querySelector('video')?.playbackRate === rate ? 'bg-blue-700' : ''}`}
                                        onClick={() => {
                                            const video = document.querySelector('video');
                                            if (video) {
                                                video.playbackRate = rate;
                                                setVideoDetails(prev => ({ ...prev, playbackRate: rate }));
                                            }
                                        }}
                                    >
                                        {rate}x
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between mt-auto">
                            <button
                                className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                                onClick={() => handleNavigation('prev')}
                            >
                                上一个
                            </button>
                            <button
                                className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                                onClick={() => handleNavigation('next')}
                            >
                                下一个
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex overflow-x-auto">
                {/* 这里需要添加逻辑来获取和显示相邻的视频 */}
                {[...Array(5)].map((_, index) => (
                    <div key={index} className={`flex-shrink-0 w-1/5 px-1 ${index === 2 ? 'border-2 border-blue-500' : ''}`}>
                        <img src="placeholder.jpg" alt="Video thumbnail" className="w-full h-16 object-cover mb-1" />
                        <p className="text-xs truncate">视频标题 {index + 1}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default VideoPlayer;