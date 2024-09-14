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
        <div className="video-player p-4">
            <h1 className="text-2xl font-bold mb-4">{videoDetails.title}</h1>
            <div className="aspect-w-16 aspect-h-9 mb-4">
                <video src={videoDetails.video_src} controls className="w-full h-full object-contain"></video>
            </div>
            <div className="mb-4">
                <img src={videoDetails.image_src} alt={videoDetails.title} className="w-full max-w-md mx-auto" />
            </div>
            <p className="mb-2">
                <strong>原网址：</strong>
                <a href={videoDetails.page_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {videoDetails.page_url}
                </a>
            </p>
        </div>
    );
}

export default VideoPlayer;