const { protocol } = require('electron');
const fetch = require('node-fetch');
const { Readable } = require('stream');

function setupVideoProxy() {
    protocol.registerStreamProtocol('video-proxy', async (request, callback) => {
        const url = new URL(request.url);
        const videoUrl = decodeURIComponent(url.searchParams.get('url'));

        console.log(`Received video proxy request for URL: ${videoUrl}`);

        try {
            const response = await fetch(videoUrl, {
                headers: {
                    'Referer': 'https://www.xiaohongshu.com/',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // console.log(`Video fetch successful. Status: ${response.status}`);
            // console.log('Response headers:', response.headers);

            const contentLength = response.headers.get('content-length');
            const contentType = response.headers.get('content-type') || 'video/mp4';

            if (!contentLength || parseInt(contentLength) === 0) {
                throw new Error('Invalid content length');
            }

            const responseHeaders = {
                'Content-Type': contentType,
                'Content-Length': contentLength,
                'Accept-Ranges': 'bytes',
            };

            callback({
                statusCode: 200,
                headers: responseHeaders,
                data: Readable.from(response.body),
            });

        } catch (error) {
            console.error('Error fetching video:', error);
            callback({
                statusCode: 500,
                headers: { 'Content-Type': 'text/plain' },
                data: Readable.from(Buffer.from(`Error fetching video: ${error.message}`))
            });
        }
    });
}

module.exports = { setupVideoProxy };