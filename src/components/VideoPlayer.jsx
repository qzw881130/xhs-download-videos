import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function VideoPlayer() {
    const [videoDetails, setVideoDetails] = useState(null);
    const [hasPrevious, setHasPrevious] = useState(true);
    const [hasNext, setHasNext] = useState(true);
    const [autoPlayNext, setAutoPlayNext] = useState(false);
    const [autoPlay, setAutoPlay] = useState(() => {
        const storedAutoPlay = localStorage.getItem('autoPlay');
        return storedAutoPlay === 'true';
    });

    const { vid } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchVideoDetails = async () => {
            try {
                const details = await window.electron.getVideoDetails(vid);
                console.log(details);
                setVideoDetails(details);
                checkAdjacentVideos(vid);
            } catch (error) {
                console.error('Error fetching video details:', error);
            }
        };

        fetchVideoDetails();

        // Load autoPlayNext from local storage
        const storedAutoPlayNext = localStorage.getItem('autoPlayNext');
        setAutoPlayNext(storedAutoPlayNext === 'true');
    }, [vid]);

    useEffect(() => {
        // Save autoPlayNext to local storage whenever it changes
        localStorage.setItem('autoPlayNext', autoPlayNext);
    }, [autoPlayNext]);

    const checkAdjacentVideos = async (currentVid) => {
        try {
            const prevVid = await window.electron.navigateVideo(currentVid, 'prev');
            const nextVid = await window.electron.navigateVideo(currentVid, 'next');
            setHasPrevious(!!prevVid);
            setHasNext(!!nextVid);
        } catch (error) {
            console.error('Error checking adjacent videos:', error);
            setHasPrevious(false);
            setHasNext(false);
        }
    };

    if (!videoDetails) {
        return <div>Loading...</div>;
    }

    const handleNavigation = async (direction) => {
        try {
            const newVid = await window.electron.navigateVideo(vid, direction);
            if (newVid) {
                navigate(`/video-player/${newVid}`);
            }
        } catch (error) {
            console.error(`Error navigating to ${direction} video:`, error);
            // Optionally, show an error message to the user
        }
    };

    const handleVideoClick = (newVid) => {
        navigate(`/video-player/${newVid}`);
    };

    return (
        <div className="video-player p-6 h-screen flex flex-col bg-gray-100 rounded-lg">
            <div className="flex justify-between items-center mb-5 bg-white p-4 rounded-lg shadow-md">
                <h1 className="text-xl font-bold truncate">{videoDetails.title}</h1>
                <a href={videoDetails.page_url} target="_blank" rel="noopener noreferrer" className="ml-2 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors duration-300">
                    原链接
                </a>
            </div>
            <div className="flex mb-4 flex-grow" style={{ minHeight: 0, maxHeight: '60vh' }}>
                <div className="w-2/3 pr-4">
                    <div className="h-full bg-black rounded-lg overflow-hidden shadow-lg">
                        <video
                            src={videoDetails.video_src}
                            controls
                            autoPlay={localStorage.getItem('autoPlayNext') === 'true'}
                            className="w-full h-full object-contain"
                            onEnded={() => {
                                if (localStorage.getItem('autoPlayNext') === 'true' && hasNext) {
                                    handleNavigation('next');
                                } else {
                                    const video = document.querySelector('video');
                                    if (video) {
                                        video.currentTime = 0;
                                        if (localStorage.getItem('autoPlayNext') !== 'true') {
                                            video.play();
                                        }
                                    }
                                }
                            }}
                        ></video>
                    </div>
                </div>
                <div className="w-1/3 bg-white p-4 rounded-lg shadow-md flex flex-col justify-between">
                    <div className="flex flex-col h-full">
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">控制面板</h2>
                        <div className="flex-grow">
                            <div className="mb-4">
                                <span className="text-sm font-medium mb-2 block">播放倍速：</span>
                                <div className="flex space-x-2">
                                    {[0.5, 1, 1.5, 2].map((rate) => (
                                        <button
                                            key={rate}
                                            className={`bg-blue-500 text-white px-3 py-1 rounded-md text-sm ${document.querySelector('video')?.playbackRate === rate ? 'bg-blue-700' : 'hover:bg-blue-600'}`}
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
                            <div className="mb-4">
                                <span className="text-sm font-medium mb-2 block">播放模式：</span>
                                <div className="flex flex-col space-y-2">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            className="form-radio text-blue-600"
                                            name="playMode"
                                            value="loop"
                                            checked={!autoPlayNext}
                                            onChange={() => {
                                                setAutoPlayNext(false);
                                                const video = document.querySelector('video');
                                                if (video) {
                                                    video.loop = true;
                                                }
                                            }}
                                        />
                                        <span className="ml-2 text-sm">单视频循环</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            className="form-radio text-blue-600"
                                            name="playMode"
                                            value="autoPlay"
                                            checked={autoPlayNext}
                                            onChange={() => {
                                                setAutoPlayNext(true);
                                                const video = document.querySelector('video');
                                                if (video) {
                                                    video.loop = false;
                                                    video.onended = () => {
                                                        handleNavigation('next');
                                                    };
                                                }
                                            }}
                                        />
                                        <span className="ml-2 text-sm">自动播放下一个</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox text-blue-600"
                                        checked={autoPlay}
                                        onChange={(e) => {
                                            const newAutoPlay = e.target.checked;
                                            setAutoPlay(newAutoPlay);
                                            localStorage.setItem('autoPlay', JSON.stringify(newAutoPlay));
                                        }}
                                    />
                                    <span className="ml-2 text-sm">自动播放</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                            <button
                                className={`bg-green-500 text-white px-4 py-2 rounded-md text-sm ${!hasPrevious ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}`}
                                onClick={() => handleNavigation('prev')}
                                disabled={!hasPrevious}
                            >
                                上一个
                            </button>
                            <button
                                className={`bg-green-500 text-white px-4 py-2 rounded-md text-sm ${!hasNext ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}`}
                                onClick={() => handleNavigation('next')}
                                disabled={!hasNext}
                            >
                                下一个
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">相关视频</h3>
                <div className="flex overflow-x-auto space-x-4">
                    {videoDetails.adjacentVideos && videoDetails.adjacentVideos.map((video, index) => (
                        <div
                            key={video.vid}
                            className={`flex-shrink-0 w-1/6 cursor-pointer ${video.vid === videoDetails.vid ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
                            onClick={() => handleVideoClick(video.vid)}
                        >
                            <div className="relative pb-[177.78%] mb-2 rounded-lg overflow-hidden">
                                <img
                                    src={video.image_src}
                                    alt={`Thumbnail for ${video.title}`}
                                    className="absolute top-0 left-0 w-full h-full object-cover"
                                />
                            </div>
                            <p className="text-xs truncate">{video.title}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default VideoPlayer;