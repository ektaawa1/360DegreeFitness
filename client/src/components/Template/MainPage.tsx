import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import UserContext from "../../context/UserContext";
import 'antd/dist/antd.css';
import './index.css';
import {Layout, Menu, Popconfirm, PageHeader, Dropdown, Icon, Modal, Button} from 'antd';
import {
    Menu as MenuIcon,
    MenuOpenOutlined,
    PersonOutlineOutlined,
    ArrowDropDownOutlined,
} from "@material-ui/icons";
import Copyright from "./Copyright";
import { Search } from "../index";
import Dashboard from "../Dashboard/Dashboard";
import LandingPage from "../LandingPage/LandingPage";
import { ProfileCreation, FoodDiary, WeightManagement, FitnessPlanComponent } from "../index";
import Chat from "../Chatbot/Chat";

const { Header, Content, Footer, Sider } = Layout;

type PAGES = 'landing' | 'dashboard' | 'fitnessplan' | 'diary' | 'weight' |  'search' ;

const PAGE_TEXTS = {


    'landing': 'Home',
    'dashboard': 'Dashboard',
    'fitnessplan': 'Fitness Plan',
    'diary': 'Food Diary',
    'weight': 'Weight Log',
    'search': 'Search Food',
};

const MainPage = () => {
    const { userData, setUserData } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapse] = useState(true);
    const [selectedPage, setSelectedPage] = useState<PAGES>('landing');
    const [isEditProfile, setEditProfile] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    useEffect(() => {
        const path = location.pathname.replace("/", "") as PAGES;
        if (PAGE_TEXTS[path]) {
            setSelectedPage(path);
        } else {
            navigate("/landing");
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
        localStorage.setItem("auth-token", "");
        navigate("/login");
    };

    const getPageTitle = () => {
        return <PageHeader title={PAGE_TEXTS[selectedPage]} />;
    };

    const renderContent = () => (
        <div className={'content'}>
            <PageHeader title={getPageTitle()} />
            <div style={{ height: '100%', background: 'white', overflow: 'scroll' }}>
                {selectedPage === "landing" && <LandingPage />}
                {selectedPage === "dashboard" && <Dashboard />}
                {selectedPage === "diary" && <FoodDiary />}
                {selectedPage === "weight" && <WeightManagement />}
                {selectedPage === "fitnessplan" && <FitnessPlanComponent />}
                {selectedPage === "search" && <Search />}
            </div>
        </div>
    );

    const getIcon = (key: PAGES) => {
        switch (key) {
            case 'landing':
                return 'home';

            case "diary":
                return 'book';

            case "fitnessplan":
                return 'heart';

            case "weight":
                return 'fund';

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
                            {!collapsed ? <MenuOpenOutlined fontSize={'28px'} /> : <MenuIcon fontSize={'28px'} />}
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
                                            <PersonOutlineOutlined />
                                            <span>Update Profile</span>
                                        </Menu.Item>
                                    </Menu>
                                }>
                                    <div style={{ cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', gap: 5 }}>
                                        <span>{`Hello, ${userData.user?.name}`}</span>
                                        <ArrowDropDownOutlined />
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
