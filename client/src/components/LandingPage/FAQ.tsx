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
        <Collapse defaultActiveKey={['1']}>
          <Panel header="Can I customise which widgets to show?" key="1">
            Yes, the widgets can be customised to show only the ones you want to see.
            In case of no customizations, the default widgets will be shown.
          </Panel>
          <Panel header="Can I change plan or cancel at any time?" key="2">
          </Panel>
          <Panel header="How to access through cloud?" key="3">
          </Panel>
          <Panel header="How can I change my password?" key="5">
          </Panel>
          <Panel header="How to manage my account?" key="6">
          </Panel>
        </Collapse>
        <div className="quickSupport" className={styles.quickSupport}>
          <h3>Want quick support?</h3>
          <Button type="primary" size="large" onClick={() => window.location.assign("mailto:support.query@stockify.me")}>
            Email your question
          </Button>
        </div>
      </div>
    </div>
  );
};
