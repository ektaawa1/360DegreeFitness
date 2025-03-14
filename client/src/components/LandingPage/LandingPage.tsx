import React from 'react';
import {TopCards} from './TopCards';
import {FAQ} from './FAQ';
import {Feature} from './Feature';
import styles from './LandingPage.module.css';

const LandingPage = ({onClick}) => {
    return (
        <div className={styles.landing}>
            <div className="main">
                <TopCards/>
                <Feature onClick={onClick}/>
                {/*<FAQ/>*/}
            </div>
        </div>
    );
};

export default LandingPage;
