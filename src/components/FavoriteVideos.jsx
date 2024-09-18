import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTranslation } from '../i18n';

function FavoriteVideos({ type, language }) {
    const t = (key) => getTranslation(language, key);

    const [videos, setVideos] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: 20
    });
    const [isLoading, setIsLoading] = useState(true);
    const [inputPage, setInputPage] = useState('');
    const [keyword, setKeyword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchVideos(1);
    }, [type]);

    const fetchVideos = async (page) => {
        setIsLoading(true);
        try {
            const result = await window.electron.getLikedVideos(page, pagination.pageSize, type, keyword);
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

    const handleKeywordChange = (e) => {
        setKeyword(e.target.value);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchVideos(1);
    };

    const handleImageError = (e) => {
        e.target.src = 'https://via.placeholder.com/150x200';
    };

    const handleVideoClick = (vid) => {
        window.electron.openVideoPlayer(vid);
    };

    if (isLoading) {
        return <div>{t('loading')}</div>;
    }

    const renderPagination = () => (
        <div className="flex items-center space-x-2">
            <button
                className="px-4 py-1 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
            >
                {t('previousPage')}
            </button>
            <form onSubmit={handleInputPageSubmit} className="flex items-center">
                <input
                    type="text"
                    value={inputPage}
                    onChange={handleInputPageChange}
                    className="w-16 px-2 py-1 border rounded"
                />
                <span className="mx-2">/ {pagination.totalPages}</span>
                <button type="submit" className="px-4 py-1 bg-blue-500 text-white rounded">
                    {t('jumpTo')}
                </button>
            </form>
            <select
                value={pagination.currentPage}
                onChange={(e) => handlePageChange(parseInt(e.target.value, 10))}
                className="px-2 py-1 border rounded"
            >
                {[...Array(pagination.totalPages).keys()].map(i => (
                    <option key={i + 1} value={i + 1}>
                        {t('pageNumberOf', { current: i + 1, total: pagination.totalPages }).replace('{current}', i + 1).replace('{total}', pagination.totalPages)}
                    </option>
                ))}
            </select>
            <button
                className="px-4 py-1 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
            >
                {t('nextPage')}
            </button>
        </div>
    );

    return (
        <div className="favorite-videos">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
                <span>
                    {t(type + 'Videos')}
                </span>
                <span className="ml-2 text-lg font-normal text-gray-600">
                    ({t('total')} {pagination.totalItems} {t('items')})
                </span>
            </h2>
            <div className="mb-4 flex justify-between items-center">
                <form onSubmit={handleSearch} className="flex items-center">
                    <input
                        type="text"
                        value={keyword}
                        onChange={handleKeywordChange}
                        placeholder={t('searchPlaceholder')}
                        className="border rounded px-2 py-1 mr-2"
                    />
                    <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded">
                        {t('search')}
                    </button>
                </form>
                {renderPagination()}
            </div>
            <div className="relative">
                <div className="flex flex-col">
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