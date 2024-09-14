import React, { useState, useEffect } from 'react';

function FavoriteVideos({ type }) {
    const [videos, setVideos] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: 20
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchVideos(1);
    }, []);

    const fetchVideos = async (page) => {
        setIsLoading(true);
        try {
            const result = await window.electron.getLikedVideos(page, pagination.pageSize);
            setVideos(result.videos);
            setPagination(result.pagination);
        } catch (error) {
            console.error('Error fetching liked videos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchVideos(newPage);
        }
    };

    const handleImageError = (e) => {
        e.target.src = 'https://via.placeholder.com/150x200';
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="favorite-videos">
            <h2 className="text-2xl font-bold mb-4">{type === 'liked' ? '喜欢的视频' : '收藏的视频'}</h2>
            <div className="relative">
                <div className="flex flex-col">
                    <div className="flex justify-end mb-4">
                        <div className="flex space-x-2">
                            <button
                                className="px-3 py-1 bg-gray-200 rounded-md"
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                            >
                                上一页
                            </button>
                            <span className="px-3 py-1">第 {pagination.currentPage} 页，共 {pagination.totalPages} 页</span>
                            <button
                                className="px-3 py-1 bg-gray-200 rounded-md"
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                            >
                                下一页
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {videos.map((video) => (
                            <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
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
                    <div className="flex space-x-2">
                        <button
                            className="px-3 py-1 bg-gray-200 rounded-md"
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                        >
                            上一页
                        </button>
                        <span className="px-3 py-1">第 {pagination.currentPage} 页，共 {pagination.totalPages} 页</span>
                        <button
                            className="px-3 py-1 bg-gray-200 rounded-md"
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                        >
                            下一页
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FavoriteVideos;