import React from 'react';
import { TopCards } from './TopCards';
import { FAQ } from './FAQ';
import { Feature } from './Feature';
import styles from './LandingPage.module.css';
import { Button, Layout, Menu, Row, Col, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { RocketFill, UserOutline, LoginOutline } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const LandingPage = () => {
    return (
        <Layout className={styles.landingLayout}>
            {/* Modern Header with Navigation */}
            <Header className={styles.header}>
                <div className={styles.logo}>360° Fitness</div>
                <Menu theme="dark" mode="horizontal" className={styles.navMenu}>
                    <Menu.Item key="features">
                        <a href="#features">Features</a>
                    </Menu.Item>
                    <Menu.Item key="benefits">
                        <a href="#benefits">Benefits</a>
                    </Menu.Item>
                    <Menu.Item key="faqs">
                        <a href="#faqs">FAQs</a>
                    </Menu.Item>

                </Menu>
                <div className={styles.authButtons}>
                    <Link to="/login">
                        <Button type="text" icon={<LoginOutline />} className={styles.loginBtn}>
                            Login
                        </Button>
                    </Link>
                    <Link to="/register">
                        <Button type="primary" icon={<UserOutline />}>
                            Get Started
                        </Button>
                    </Link>
                </div>
            </Header>

            {/* Hero Section */}
            <Content className={styles.heroSection}>
                <Row align="middle" justify="center" style={{ height: '100%' }}>
                    <Col span={12} className={styles.heroText}>
                        <Title level={1} className={styles.heroTitle}>
                            Transform Your Fitness Journey
                        </Title>
                        <Text className={styles.heroSubtitle}>
                            The all-in-one platform to track your nutrition, workouts, and progress.
                            Achieve your health goals with personalized plans and analytics.
                        </Text>
                        <div className={styles.heroButtons}>
                            <Link to="/register">
                                <Button type="primary" size="large" icon={<RocketFill />}>
                                    Start Free Trial
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button size="large">Existing User? Login</Button>
                            </Link>
                        </div>
                    </Col>
                    <Col span={12} className={styles.heroImage}>
                        {/* Placeholder for hero image - replace with actual image */}
                        <div className={styles.imagePlaceholder}></div>
                    </Col>
                </Row>
            </Content>

            {/* Features Section */}
            <div id="features" className={styles.section}>
                <Feature />
            </div>

            {/* Stats Section */}
            <div id={"benefits"} className={styles.statsSection}>
                <TopCards />
            </div>

            {/* FAQ Section */}
            <div id="faqs" className={styles.section}>
                <FAQ />
            </div>

            {/* Modern Footer */}
            <Footer className={styles.footer}>
                <Row justify="space-between">
                    <Col span={8}>
                        <Title level={4} className={styles.footerTitle}>360° Fitness</Title>
                        <Text style={{color: "white"}}>Your complete fitness companion</Text>
                    </Col>
                    <Col span={8}>
                        <Title level={5} className={styles.footerTitle}>Quick Links</Title>
                        <div className={styles.footerLinks}>
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                            <a href="#features">Features</a>
                            <a href="#faqs">FAQs</a>
                        </div>
                    </Col>
                    <Col span={8}>
                        <Title level={5} className={styles.footerTitle}>Legal</Title>
                        <div className={styles.footerLinks}>
                            <a href="#">Terms</a>
                            <a href="#">Privacy</a>
                            <a href="#">Cookies</a>
                        </div>
                    </Col>
                </Row>
                <div className={styles.copyright}>
                    © {new Date().getFullYear()} 360° Fitness. All rights reserved.
                </div>
            </Footer>
        </Layout>
    );
};

export default LandingPage;