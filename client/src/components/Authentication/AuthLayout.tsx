import React from 'react';
import { Layout, Row, Col } from 'antd';
import { Link } from 'react-router-dom';
import styles from './AuthLayout.module.css';

const { Header, Content, Footer } = Layout;

const AuthLayout = ({ children }) => {
    return (
        <Layout className={styles.authLayout}>
            {/* Same Header as Landing Page */}
            <Header className={styles.header}>
                <Link to="/">
                <div className={styles.logo}>360° Fitness</div>
                </Link>
                <div className={styles.authButtons}>
                    <Link to="/login">
                        <span className={styles.authLink}>Login</span>
                    </Link>
                    <Link to="/register">
                        <span className={styles.authLink}>Register</span>
                    </Link>
                </div>
            </Header>

            {/* Content Area */}
            <Content className={styles.authContent}>
                <Row justify="center" align="middle" style={{ minHeight: 'calc(100vh - 160px)' }}>
                    <Col xs={22} sm={18} md={14} lg={10} xl={8}>
                        {children}
                    </Col>
                </Row>
            </Content>

            {/* Same Footer as Landing Page */}
            <Footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div>© {new Date().getFullYear()} 360° Fitness. All rights reserved.</div>
                    <div className={styles.footerLinks}>
                        <Link to="/">Home</Link>
                    </div>
                </div>
            </Footer>
        </Layout>
    );
};

export default AuthLayout;
