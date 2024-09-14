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
        <div className="video-player p-4 h-screen flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-xl font-bold truncate">{videoDetails.title}</h1>
                <a href={videoDetails.page_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                    原链接
                </a>
            </div>
            <div className="flex mb-2 flex-grow" style={{ minHeight: 0, maxHeight: '60vh' }}>
                <div className="w-2/3 pr-2">
                    <div className="h-full">
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
                <div className="w-1/3 bg-gray-100 p-2 rounded flex flex-col justify-between">
                    <div className="flex flex-col h-full">
                        <div className="flex-grow">
                            <h2 className="text-base font-semibold mb-2">控制面板</h2>
                            <div className="flex items-center justify-space mb-2">
                                <span className="text-sm mr-2">播放倍速：</span>
                                <div className="flex">
                                    {[0.5, 1, 1.5, 2].map((rate) => (
                                        <button
                                            key={rate}
                                            className={`bg-blue-500 text-white px-2 py-1 rounded text-sm mr-2 ${document.querySelector('video')?.playbackRate === rate ? 'bg-blue-700' : ''}`}
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
                            <div className="flex items-center justify-space mb-2">
                                <span className="text-sm mr-2">播放模式：</span>
                                <div className="flex">
                                    <label className="inline-flex items-center mr-4">
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
                        </div>
                        <div className="flex items-center mb-2">
                            <span className="text-sm">自动播放：</span><label className="inline-flex items-center">
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
                                <span className="ml-2 text-sm">启用</span>
                            </label>
                        </div>
                        <div className="flex justify-between mt-auto">
                            <button
                                className={`bg-green-500 text-white px-3 py-1 rounded text-sm ${!hasPrevious ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleNavigation('prev')}
                                disabled={!hasPrevious}
                            >
                                上一个
                            </button>
                            <button
                                className={`bg-green-500 text-white px-3 py-1 rounded text-sm ${!hasNext ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleNavigation('next')}
                                disabled={!hasNext}
                            >
                                下一个
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex overflow-x-auto mt-4">
                {videoDetails.adjacentVideos && videoDetails.adjacentVideos.map((video, index) => (
                    <div
                        key={video.vid}
                        className={`flex-shrink-0 w-1/6 px-1 cursor-pointer ${video.vid === videoDetails.vid ? 'border-2 border-blue-500' : ''}`}
                        onClick={() => handleVideoClick(video.vid)}
                    >
                        <div className="relative pb-[177.78%] mb-1">
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
    );
}

export default VideoPlayer;