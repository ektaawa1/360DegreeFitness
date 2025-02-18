import React, {useContext, useState} from "react";
import {useNavigate} from "react-router-dom";
import UserContext from "../../context/UserContext";
import 'antd/dist/antd.css';
import './index.css';
import {Layout, Menu, Breadcrumb, Popconfirm, PageHeader, Dropdown} from 'antd';
import {
    DashboardOutlined,
    ExitToApp, HomeOutlined, KeyboardBackspaceOutlined,
    Menu as MenuIcon,
    MenuOpenOutlined,
    SearchOutlined,
    PersonOutlineOutlined,
    ArrowDropDownOutlined
} from "@material-ui/icons";
import Copyright from "./Copyright";
import {Search} from "../index";
import Dashboard from "../Dashboard/Dashboard";
import LandingPage from "../LandingPage/LandingPage";
import {ProfileCreation} from "../index";

const {Header, Content, Footer, Sider} = Layout;

type PAGES = 'search' | 'dashboard' | 'landing';
const PAGE_TEXTS = {

    'dashboard': 'Dashboard',
    'search': 'Explore',
    'landing': 'Home'
}

const MainPage = () => {
    const {userData, setUserData} = useContext(UserContext);
    const navigate = useNavigate();
    const [collapsed, setCollapse] = useState(true);
    const [selectedPage, setSelectedPage] = useState<PAGES>('landing');
    const [selectedWatchlist, setSelectedWatchlist] = useState(null);
    const [isEditProfile, setEditProfile] = useState(false);

    const onCollapse = collapsed => {
        console.log(collapsed);
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


    if (!userData.user) {
        navigate("/login");
    }

    const getPageTitle = () => {
        if (!selectedWatchlist) {
            return PAGE_TEXTS[selectedPage];
        }

        return <PageHeader
            title={`${PAGE_TEXTS[selectedPage]}`}
            onBack={() => setSelectedWatchlist(null)}
            backIcon={<KeyboardBackspaceOutlined fontSize={'28px'}/>}
        />

    }

    const renderContent = () => {
        return (
            <div className={'content'}>
                <PageHeader title={getPageTitle()}/>
                <div style={{height: 'calc(100vh - 255px)', background: 'white'}}>
                    {selectedPage === "landing" && (
                        <LandingPage/>
                    )}
                    {selectedPage === "dashboard" && (
                        <Dashboard/>
                    )}

                    {selectedPage === "search" && (
                        <Search/>
                    )}
                </div>
            </div>)
    }


    const setPage = (page) => {
        setSelectedWatchlist(null);
        setSelectedPage(page);
    }


    return (
        <div className="App">
            <Layout style={{height: 'calc(100vh)'}}>
                <Sider collapsible collapsed={collapsed} onCollapse={onCollapse}>
                    <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
                        <Menu.Item key="menu" onClick={() => setCollapse(!collapsed)} style={{height: '50px'}}>
                            {!collapsed && <MenuOpenOutlined fontSize={'28px'}/>}
                            {collapsed && <MenuIcon fontSize={'28px'}/>}
                        </Menu.Item>
                        <Menu.Item key="landing" onClick={() => setPage('landing')}>
                            <HomeOutlined fontSize={'28px'}/>
                            <span className={'item'}>{PAGE_TEXTS["landing"]}</span>
                        </Menu.Item>
                        <Menu.Item key="dashboard" onClick={() => setPage('dashboard')}>
                            <DashboardOutlined fontSize={'28px'}/>
                            <span className={'item'}>{PAGE_TEXTS["dashboard"]}</span>
                        </Menu.Item>

                        <Menu.Item key="search" onClick={() => setPage('search')}>
                            <SearchOutlined fontSize={'28px'}/>
                            <span className={'item'}>{PAGE_TEXTS["search"]}</span>
                        </Menu.Item>


                        <Menu.Item key="logout">
                            <Popconfirm placement="right" title={'Are you sure you want to logout?'} onConfirm={logout}
                                        okText="Logout"
                                        cancelText="Cancel">
                                <ExitToApp fontSize={'28px'}/>
                                <span className={'item'}>Logout</span>
                            </Popconfirm>
                        </Menu.Item>
                    </Menu>
                </Sider>
                <Layout className="site-layout">
                    <Header className="site-layout-background header-text" style={{padding: 0}}>
                        <div style={{display: 'flex'}}>
                            <div style={{display: 'inline-flex', height: '60px', alignItems: 'center'}}>
                                <div className="logo"/>
                                <span className={'logo-text'}>360° Fitness</span>
                            </div>
                            <div style={{marginLeft: 'auto', marginRight: '20px'}}>
                                <Dropdown
                                    overlay={
                                        <Menu>
                                            <Menu.Item key="updateProfile" onClick={() => {
                                                setEditProfile(true);
                                            }}>
                                                <PersonOutlineOutlined style={{ verticalAlign: 'middle'}}/> Update Profile
                                            </Menu.Item>
                                        </Menu>
                                    }
                                    trigger={['click']}
                                >
                                    <div style={{cursor: 'pointer'}}>
                                        <span>{`Hello, ${userData.user.name}`}</span>
                                        <ArrowDropDownOutlined style={{ verticalAlign: 'middle'}}/>
                                    </div>
                                </Dropdown>
                            </div>
                        </div>
                    </Header>
                    <Content style={{margin: '0 16px'}}>
                        <Breadcrumb style={{margin: '16px 0'}}>
                            <Breadcrumb.Item>Home</Breadcrumb.Item>
                            <Breadcrumb.Item onClick={() => {

                            }}>{PAGE_TEXTS[selectedPage]}</Breadcrumb.Item>

                        </Breadcrumb>
                        {renderContent()}
                    </Content>
                    <Footer className={'footer'}>
                        <Copyright/>
                    </Footer>
                </Layout>
                {(!userData?.profile_created || isEditProfile) && <ProfileCreation userData={userData} editMode={true} onClose={() => setEditProfile(false)}/>}
            </Layout>

        </div>
    );


}

export default MainPage;
