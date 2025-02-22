import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Axios from "axios";
import { Login, Register, PageNotFound, MainPage, ForgotPassword, ResetPassword } from "./components";
import UserContext from "./context/UserContext";
import { BASE_URL } from './config/Config';
import {Spin} from "antd";

function App() {
    const baseState = {
        token: undefined,
        user: undefined,
        profile_created: false,
        profile_completed: false
    };
    const [userData, setUserData] = useState(baseState);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loginCheck = async () => {
            let token = localStorage.getItem("auth-token");
            if (!token) {
                setUserData(baseState);
                setLoading(false);
                return;
            }

            const headers = {
                "x-auth-token": token,
            };

            const tokenIsValid = await Axios.post(
                BASE_URL + "/api/auth/validate",
                null,
                {
                    headers,
                }
            );

            if (tokenIsValid.data) {
                const userRes = await Axios.get(BASE_URL + "/api/auth/user", {
                    headers,
                });
                setUserData({
                    token: token as any,
                    user: userRes.data as any,
                    profile_created: tokenIsValid.data.profile_created as boolean,
                    profile_completed: tokenIsValid.data.profile_completed  as boolean
                });
            } else {
                setUserData(baseState);
            }
            setLoading(false);
        };

        loginCheck();
    }, []);

    return loading ?  <Spin size="large"
    style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '90vh',
        margin: 0
    }}

    />: (
        <Router>
            <UserContext.Provider value={{userData, setUserData}}>
                <Routes>
                    {userData.user ? (
                        <Route path="/" element={<MainPage/>}/>
                    ) : (
                        <Route path="/" element={<Login/>}/>
                    )}
                    <Route path="/login" element={<Login/>}/>
                    <Route path="/register" element={<Register/>}/>
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/*" element={<PageNotFound/>}/>
                </Routes>
            </UserContext.Provider>
        </Router>
    );
}

export default App;
