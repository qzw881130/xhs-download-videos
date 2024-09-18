import fetch from 'node-fetch';
import { spawn } from 'child_process';

const checkServer = async () => {
    try {
        const response = await fetch('http://localhost:5173');
        if (response.ok) {
            console.log('Vite server is ready. Starting Electron...');
            const electron = spawn('electron', ['.'], { stdio: 'inherit' });

            electron.on('error', (error) => {
                console.error('Failed to start Electron:', error);
            });

            electron.on('close', (code) => {
                console.log(`Electron process exited with code ${code}`);
            });
        }
    } catch (error) {
        console.log('Vite server not ready yet. Retrying in 1 second...');
        setTimeout(checkServer, 1000);
    }
};

checkServer();