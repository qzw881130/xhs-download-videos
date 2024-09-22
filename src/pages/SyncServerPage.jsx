import React from 'react';
import SyncServerComponent from '../components/SyncServer';

function SyncServerPage({ language }) {
    return (
        <div className="sync-server-page-container">
            <SyncServerComponent language={language} />
        </div>
    );
}

export default SyncServerPage;