import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function FavoriteVideos({ type }) {
    const [videos, setVideos] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: 20
    });
    const [isLoading, setIsLoading] = useState(true);
    const [inputPage, setInputPage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchVideos(1);
    }, [type]);

    const fetchVideos = async (page) => {
        setIsLoading(true);
        try {
            const result = await window.electron.getLikedVideos(page, pagination.pageSize, type);
            setVideos(result.videos);
            setPagination(result.pagination);
            setInputPage(result.pagination.currentPage.toString());
        } catch (error) {
            console.error('Error fetching videos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchVideos(newPage);
        }
    };

    const handleInputPageChange = (e) => {
        setInputPage(e.target.value);
    };

    const handleInputPageSubmit = (e) => {
        e.preventDefault();
        const page = parseInt(inputPage, 10);
        if (!isNaN(page) && page >= 1 && page <= pagination.totalPages) {
            handlePageChange(page);
        }
    };

    const handleImageError = (e) => {
        e.target.src = 'https://via.placeholder.com/150x200';
    };

    const handleVideoClick = (vid) => {
        window.electron.openVideoPlayer(vid);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const renderPagination = () => (
        <div className="flex items-center space-x-2">
            <button
                className="px-3 py-1 bg-gray-200 rounded-md"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
            >
                上一页
            </button>
            <form onSubmit={handleInputPageSubmit} className="flex items-center">
                <input
                    type="text"
                    value={inputPage}
                    onChange={handleInputPageChange}
                    className="w-16 px-2 py-1 border rounded"
                />
                <span className="mx-2">/ {pagination.totalPages}</span>
                <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded-md">
                    跳转
                </button>
            </form>
            <select
                value={pagination.currentPage}
                onChange={(e) => handlePageChange(parseInt(e.target.value, 10))}
                className="px-2 py-1 border rounded"
            >
                {[...Array(pagination.totalPages).keys()].map(i => (
                    <option key={i + 1} value={i + 1}>
                        第 {i + 1} 页
                    </option>
                ))}
            </select>
            <button
                className="px-3 py-1 bg-gray-200 rounded-md"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
            >
                下一页
            </button>
        </div>
    );

    return (
        <div className="favorite-videos">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
                <span>
                    {type === 'liked' ? '我的点赞视频' : type === 'collected' ? '我的收藏视频' : '我的视频笔记'}
                </span>
                <span className="ml-2 text-lg font-normal text-gray-600">
                    (共 {pagination.totalItems} 个)
                </span>
            </h2>
            <div className="relative">
                <div className="flex flex-col">
                    <div className="flex justify-end mb-4">
                        {renderPagination()}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {videos.map((video) => (
                            <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer" onClick={() => handleVideoClick(video.vid)}>
                                <div className="aspect-[3/4] relative">
                                    <img
                                        src={video.image_src}
                                        alt={video.title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        onError={handleImageError}
                                    />
                                </div>
                                <div className="p-2">
                                    <h3 className="text-sm font-semibold truncate">{video.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <div></div>
                    {renderPagination()}
                </div>
            </div>
        </div>
    );
}

export default FavoriteVideos;