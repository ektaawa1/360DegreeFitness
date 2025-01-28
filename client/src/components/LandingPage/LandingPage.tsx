import React from 'react';
import {TopCards} from './TopCards';
import {FAQ} from './FAQ';
import {Feature} from './Feature';
import styles from './LandingPage.module.css';

const LandingPage = () => {
    return (
        <div className={styles.landing}>
            <div className="main">
                <TopCards/>
                <Feature/>
                <FAQ/>
            </div>
        </div>
    );
};

export default LandingPage;
