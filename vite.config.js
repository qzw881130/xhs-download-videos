import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        strictPort: true,
        cors: true
    },
    build: {
        outDir: 'dist',
    },
    publicDir: 'public',
    base: './',
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    server: {
        port: 5173,
        strictPort: true,
        cors: true,
        fs: {
            strict: false,
            allow: ['..'],
        },
    },
});