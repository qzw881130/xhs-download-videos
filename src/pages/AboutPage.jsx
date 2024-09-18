import React from 'react';
import AboutComponent from '../components/About';

function AboutPage({ language }) {
    return (
        <div className="about-page-container">
            <AboutComponent language={language} />
        </div>
    );
}

export default AboutPage;