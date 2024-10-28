import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { getTranslation } from '../i18n';

function VideoPlayer({ language }) {
    const [videoDetails, setVideoDetails] = useState(null);
    const [hasPrevious, setHasPrevious] = useState(true);
    const [hasNext, setHasNext] = useState(true);
    const [autoPlayNext, setAutoPlayNext] = useState(false);
    const [randomPlay, setRandomPlay] = useState(() => {
        const storedRandomPlay = localStorage.getItem('randomPlay');
        return storedRandomPlay === 'true';
    });
    const [autoPlay, setAutoPlay] = useState(() => {
        const storedAutoPlay = localStorage.getItem('autoPlay');
        return storedAutoPlay === 'true';
    });
    const [videoType, setVideoType] = useState('liked');
    const [playerError, setPlayerError] = useState(null);
    const [playbackRate, setPlaybackRate] = useState(1);

    const { vid } = useParams();
    const navigate = useNavigate();
    const playerRef = useRef(null);

    const t = (key) => getTranslation(language, key);

    useEffect(() => {
        const fetchVideoDetails = async () => {
            try {
                const details = await window.electron.getVideoDetails(vid);
                setVideoDetails(details);
                setVideoType(details.type);
                console.log(details);
                checkAdjacentVideos(vid, details.type);
            } catch (error) {
                console.error('Error fetching video details:', error);
            }
        };

        fetchVideoDetails();

        const storedAutoPlayNext = localStorage.getItem('autoPlayNext');
        setAutoPlayNext(storedAutoPlayNext === 'true');
    }, [vid]);

    useEffect(() => {
        localStorage.setItem('autoPlayNext', autoPlayNext);
    }, [autoPlayNext]);

    useEffect(() => {
        // 添加这个效果来监听来自主进程的日志消息
        window.electron.onLogMessage((message) => {
            console.log('Log from main process:', message);
        });

        return () => {
            window.electron.removeLogMessageListener();
        };
    }, []);

    const checkAdjacentVideos = async (currentVid, type) => {
        try {
            const prevVid = await window.electron.navigateVideo(currentVid, 'prev', type);
            const nextVid = await window.electron.navigateVideo(currentVid, 'next', type);
            setHasPrevious(!!prevVid);
            setHasNext(!!nextVid);
        } catch (error) {
            console.error('Error checking adjacent videos:', error);
            setHasPrevious(false);
            setHasNext(false);
        }
    };

    const handleNavigation = async (direction, randomPlay = false) => {
        try {
            let nextVid;
            if (randomPlay) {
                nextVid = await window.electron.navigateVideo(videoDetails.vid, 'random', videoType);
            } else {
                nextVid = await window.electron.navigateVideo(videoDetails.vid, direction, videoType);
            }

            if (nextVid) {
                navigate(`/video-player/${nextVid}`);
            } else {
                console.log('No more videos in this direction');
            }
        } catch (error) {
            console.error('Error navigating to next video:', error);
        }
    };

    const handleVideoClick = (newVid) => {
        navigate(`/video-player/${newVid}`);
    };

    const handleVideoEnd = () => {
        if (localStorage.getItem('autoPlayNext') === 'true') {
            if (localStorage.getItem('randomPlay') === 'true') {
                handleNavigation('next', true);
            } else {
                handleNavigation('next');
            }
        } else {
            const player = playerRef.current;
            if (player) {
                player.seekTo(0);
                if (localStorage.getItem('autoPlayNext') !== 'true') {
                    player.play();
                }
            }
        }
    }

    const handleHideVideo = async () => {
        try {
            const result = await window.electron.hideVideo(videoDetails.vid);
            if (result.success) {
                // 视频已成功隐藏，可以导航到其他页面或显示消息
                handleVideoEnd(); // 或者导航到视频列表页面
            } else {
                console.error('Failed to hide video:', result.error);
                // 可以显示错误消息给用户
            }
        } catch (error) {
            console.error('Error hiding video:', error);
            // 可以显示错误消息给用户
        }
    };

    const getProxyUrl = (url) => {
        return `video-proxy://proxy?url=${encodeURIComponent(url)}`;
    };

    const handlePlayerError = (error) => {
        console.error('ReactPlayer error:', error);
        if (error && error.target) {
            console.error('Video error details:', {
                error: error.target.error,
                src: error.target.src,
                readyState: error.target.readyState,
                networkState: error.target.networkState
            });
            setPlayerError(`Error: ${error.target.error ? error.target.error.message : 'Unknown error'}`);
        } else {
            setPlayerError('An unknown error occurred');
        }
    };

    const handlePlaybackRateChange = (rate) => {
        setPlaybackRate(rate);
        if (playerRef.current) {
            playerRef.current.getInternalPlayer().playbackRate = rate;
        }
    };

    if (!videoDetails) {
        return <div>Loading...</div>;
    }

    return (
        <div className="video-player p-2 h-screen flex flex-col bg-gray-100 rounded-lg">
            <div className="flex justify-between items-center mb-5 bg-white p-4 rounded-lg shadow-md">
                <h1 className="text-xl font-bold truncate">
                    {videoDetails.title}
                    <span className="ml-2 inline-block px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                        {t(videoDetails.type)}
                    </span>
                    <span className="ml-2 inline-block px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-200 rounded">
                        ID: {videoDetails.id}
                    </span>
                </h1>
                <a href={videoDetails.page_url} target="_blank" rel="noopener noreferrer" className="ml-2 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors duration-300">
                    {t('originalLink')}
                </a>
            </div>
            <div className="flex mb-4 flex-grow" style={{ minHeight: 0, maxHeight: '60vh' }}>
                <div className="w-3/4 pr-4">
                    <div className="h-full bg-black rounded-lg overflow-hidden shadow-lg">
                        {playerError ? (
                            <div className="w-full h-full flex items-center justify-center text-white bg-red-500">
                                <p>{playerError}</p>
                                <button
                                    onClick={() => setPlayerError(null)}
                                    className="ml-4 bg-white text-red-500 px-4 py-2 rounded"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <ReactPlayer
                                ref={playerRef}
                                url={getProxyUrl(videoDetails.video_src)}
                                controls
                                playing={localStorage.getItem('autoPlay') === 'true'}
                                width="100%"
                                height="100%"
                                onEnded={handleVideoEnd}
                                onError={handlePlayerError}
                                onReady={() => console.log('ReactPlayer is ready')}
                                onStart={() => console.log('ReactPlayer started')}
                                onPlay={() => console.log('ReactPlayer is playing')}
                                onPause={() => console.log('ReactPlayer is paused')}
                                onBuffer={() => console.log('ReactPlayer is buffering')}
                                playbackRate={playbackRate}
                                config={{
                                    file: {
                                        forceVideo: true,
                                        attributes: {
                                            crossOrigin: "anonymous"
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
                <div className="w-1/4 bg-white p-4 rounded-lg shadow-md flex flex-col justify-between">
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">{t('controlPanel')}</h2>
                            <button
                                className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition-colors duration-300"
                                onClick={handleHideVideo}
                            >
                                {t('hide')}
                            </button>
                        </div>
                        <div className="flex-grow">
                            <div className="mb-4">
                                <span className="text-sm font-medium mb-2 block">{t('playbackSpeed')}：</span>
                                <div className="flex space-x-2">
                                    {[0.5, 1, 1.5, 2].map((rate) => (
                                        <button
                                            key={rate}
                                            className={`bg-blue-500 text-white px-3 py-1 rounded-md text-sm ${playbackRate === rate ? 'bg-blue-700' : 'hover:bg-blue-600'}`}
                                            onClick={() => handlePlaybackRateChange(rate)}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-4">
                                <span className="text-sm font-medium mb-2 block">{t('playMode')}：</span>
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
                                                const player = playerRef.current;
                                                if (player) {
                                                    player.seekTo(player.getCurrentTime());
                                                    player.setLoop(true);
                                                }
                                            }}
                                        />
                                        <span className="ml-2 text-sm">{t('singleVideoLoop')}</span>
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
                                                const player = playerRef.current;
                                                if (player) {
                                                    player.seekTo(player.getCurrentTime());
                                                    player.setLoop(false);
                                                    player.onEnded = () => {
                                                        handleNavigation('next');
                                                    };
                                                }
                                            }}
                                        />
                                        <span className="ml-2 text-sm">{t('autoPlayNext')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="mb-4">
                                <span className="text-sm font-medium mb-2 block">{t('playOrder')}：</span>
                                <div className="flex flex-col space-y-2">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            className="form-radio text-blue-600"
                                            name="playOrder"
                                            value="sequential"
                                            checked={!randomPlay}
                                            onChange={() => {
                                                setRandomPlay(false);
                                                localStorage.setItem('randomPlay', 'false');
                                            }}
                                        />
                                        <span className="ml-2 text-sm">{t('sequentialPlay')}</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            className="form-radio text-blue-600"
                                            name="playOrder"
                                            value="random"
                                            checked={randomPlay}
                                            onChange={() => {
                                                setRandomPlay(true);
                                                localStorage.setItem('randomPlay', 'true');
                                            }}
                                        />
                                        <span className="ml-2 text-sm">{t('randomPlay')}</span>
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
                                    <span className="ml-2 text-sm">{t('autoPlay')}</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                            <button
                                className={`bg-green-500 text-white px-4 py-2 rounded-md text-sm ${(!hasPrevious || randomPlay) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}`}
                                onClick={() => handleNavigation('prev')}
                                disabled={!hasPrevious || randomPlay}
                            >
                                {t('previous')}
                            </button>
                            <button
                                className={`bg-green-500 text-white px-4 py-2 rounded-md text-sm ${randomPlay || hasNext ? 'hover:bg-green-600' : 'opacity-50 cursor-not-allowed'}`}
                                onClick={() => handleNavigation('next', !!randomPlay)}
                                disabled={!randomPlay && !hasNext}
                            >
                                {randomPlay ? t('randomNext') : t('next')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">{t('otherVideos')}</h3>
                <div className="flex overflow-x-auto space-x-4">
                    {videoDetails.adjacentVideos && videoDetails.adjacentVideos.map((video, index) => (
                        <div
                            key={video.vid}
                            className={`flex-shrink-0 w-1/12 cursor-pointer ${video.vid === videoDetails.vid ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
                            onClick={() => handleVideoClick(video.vid)}
                        >
                            <div className="relative pb-[88.89%] mb-2 rounded-lg overflow-hidden">
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