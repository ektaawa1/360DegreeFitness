import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserContext from "../../context/UserContext";
import 'antd/dist/antd.css';
import './index.css';
import {Layout, Menu, Popconfirm, PageHeader, Dropdown, Icon, Modal, Button} from 'antd';
import Copyright from "./Copyright";
import { Search } from "../index";
import Dashboard from "../Dashboard/Dashboard";
import { ProfileCreation, FoodDiary, WeightManagement, FitnessPlanComponent } from "../index";
import Chat from "../Chatbot/Chat";
import ExerciseDiary from "../ExerciseDiary/ExerciseDiary";
import Workouts from "../Workout/Workouts";

const { Header, Content, Footer, Sider } = Layout;

type PAGES =  'dashboard' | 'fitnessplan' | 'diary' | 'weight' |  'search' | 'exercise' | 'workout' ;

const PAGE_TEXTS = {


    'dashboard': 'Dashboard',
    'fitnessplan': 'Fitness Plan',
    'diary': 'Food Diary',
    'weight': 'Weight Log',
    'exercise': 'Exercise Log',
    'search': 'Search Food',
    'workout': 'Workouts',
};

const MainPage = () => {
    const { userData, setUserData } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapse] = useState(true);
    const [selectedPage, setSelectedPage] = useState<PAGES>('dashboard');
    const [isEditProfile, setEditProfile] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    useEffect(() => {
        const path = location.pathname.replace("/", "") as PAGES;
        if (PAGE_TEXTS[path]) {
            setSelectedPage(path);
        } else {
            navigate("/dashboard");
        }
    }, [location.pathname]);

    const onCollapse = (collapsed) => {
        setCollapse(collapsed);
    };

    const logout = () => {
        setUserData({
            token: undefined,
            user: undefined,
        });
        sessionStorage.setItem("auth-token", "");
        navigate("/");
    };

    const getPageTitle = () => {
        return <PageHeader title={PAGE_TEXTS[selectedPage]} />;
    };

    const renderContent = () => (
        <div className={'content'}>
            <PageHeader title={getPageTitle()} />
            <div style={{ height: 'calc(100% - 50px)', background: 'white', overflow: 'scroll' }}>
                {selectedPage === "dashboard" && <Dashboard />}
                {selectedPage === "diary" && <FoodDiary />}
                {selectedPage === "weight" && <WeightManagement />}
                {selectedPage === "fitnessplan" && <FitnessPlanComponent />}
                {selectedPage === "search" && <Search />}
                {selectedPage === "exercise" && <ExerciseDiary />}
                {selectedPage === "workout" && <Workouts />}
            </div>
        </div>
    );

    const getIcon = (key: PAGES) => {
        switch (key) {

            case "diary":
                return 'book';

            case "fitnessplan":
                return 'heart';

            case "weight":
                return 'fund';

            case "exercise":
                return 'thunderbolt';

            case "workout":
                return 'build';

            default:
                return key;
        }
    }


    return (
        <div className="App">
            <Layout style={{ height: '100vh' }}>
                <Sider collapsible collapsed={collapsed} onCollapse={onCollapse}>
                    <Menu theme="dark" mode="inline">
                        <Menu.Item key="menu" onClick={() => setCollapse(!collapsed)} style={{ height: '50px' }}>
                            {!collapsed ? <Icon type="menu-fold" /> : <Icon type="menu-unfold" />}
                        </Menu.Item>
                        {Object.keys(PAGE_TEXTS).map((key) => (
                            <Menu.Item key={key} onClick={() => navigate(`/${key}`)}>
                                <Icon type={getIcon(key)} />
                                <span className={'item'}>{PAGE_TEXTS[key]}</span>
                            </Menu.Item>
                        ))}
                        <Menu.Item key="logout">
                            <Popconfirm placement="right" title={'Are you sure you want to logout?'} onConfirm={logout} okText="Logout" cancelText="Cancel">
                                <Icon type="logout" />
                                <span className={'item'}>Logout</span>
                            </Popconfirm>
                        </Menu.Item>
                    </Menu>
                </Sider>
                <Layout className="site-layout">
                    <Header className="site-layout-background header-text" style={{ padding: 0 }}>
                        <div style={{ display: 'flex' }}>
                            <span className={'logo-text'}>360° Fitness</span>
                            <div style={{ marginLeft: 'auto', marginRight: '20px' }}>
                                <Dropdown overlay={
                                    <Menu>
                                        <Menu.Item key="updateProfile" onClick={() => setEditProfile(true)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center', gap: 5
                                        }}>
                                            <Icon type="user" />
                                            <span>Update Profile</span>
                                        </Menu.Item>
                                    </Menu>
                                }>
                                    <div style={{ cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', gap: 5 }}>
                                        <span>{`Hello, ${userData.user?.name}`}</span>
                                        <Icon type="caret-down" />
                                    </div>
                                </Dropdown>
                            </div>
                        </div>
                    </Header>
                    <Content>{renderContent()}</Content>
                    <Footer><Copyright /></Footer>
                </Layout>
                {(!userData?.profile_created || isEditProfile) &&
                <ProfileCreation userData={userData} editMode={true} onClose={() => {
                    setEditProfile(false);
                    setDialogVisible(true);
                }} />
                }
                {userData?.profile_created && <Chat />}
                <Modal
                    visible={dialogVisible}
                    title="Fitness Plan Generated"
                    onCancel={() => setDialogVisible(false)}
                    footer={[
                        <Button onClick={() => setDialogVisible(false)} key="cancel">Cancel</Button>,
                        <Button type="primary" onClick={() => {
                            setDialogVisible(false);
                            navigate('/fitnessplan');
                        }} key="go">Go to Fitness Plan</Button>
                    ]}
                >
                    <p>{'Your fitness plan has been successfully generated with goals. To review them, go to the Fitness Plan page.'}</p>
                </Modal>
            </Layout>
        </div>
    );
};

export default MainPage;
