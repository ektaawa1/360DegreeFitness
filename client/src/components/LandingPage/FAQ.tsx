import React from 'react';
import { Collapse, Button } from 'antd';
const { Panel } = Collapse;
import styles from './LandingPage.module.css';

export const FAQ = () => {
  return (
    <div id="main-faq" className={styles.faqBlock}>
      <div className="container-fluid">
        <div className="titleHolder">
          <h2>Frequently Asked Questions</h2>
        </div>
        <Collapse defaultActiveKey={['2']}>
          <Panel header="How does the AI fitness coaching work?" key="2">
            Our AI coach, powered by Google's Gemini AI, analyzes your profile, goals, and preferences
            to create personalized workout and diet plans. It adapts recommendations based on your progress
            and provides real-time guidance through an interactive chat interface.
          </Panel>
          <Panel header="Can I track my fitness progress?" key="3">
            Yes! You can track various metrics including workouts completed, dietary habits, weight changes,
            and overall fitness goals. The platform provides visual progress tracking and generates detailed
            reports that you can export in PDF or JSON format.
          </Panel>
          <Panel header="How do I get started with my fitness journey?" key="4">
            After creating an account, you'll complete a comprehensive profile covering your fitness goals,
            current health status, and preferences. Our AI then creates your personalized fitness plan,
            which you can start following immediately.
          </Panel>
          <Panel header="Can I modify my fitness plan?" key="5">
            Absolutely! You can communicate with our AI coach to adjust your workout plans and diet
            recommendations based on your preferences, schedule changes, or new fitness goals. The system
            is flexible and adapts to your needs.
          </Panel>
        </Collapse>
        <div className="quickSupport" className={styles.quickSupport}>
          <h3>Want quick support?</h3>
          <Button type="primary" size="large" onClick={() => window.location.assign("mailto:360degfitnesshelp@gmail.com")}>
            Email your question
          </Button>
        </div>
      </div>
    </div>
  );
};
