import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                assetFileNames: (assetInfo) => {
                    let extType = assetInfo.name.split('.')[1];
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
                        extType = 'images';
                    }
                    return `assets/${extType}/[name][extname]`;
                },
            },
        },
    },
    publicDir: 'public',
    base: './',
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    server: {
        port: 3000,
        strictPort: true,
        cors: true,
        fs: {
            strict: false,
            allow: ['..'],
        },
    },
});