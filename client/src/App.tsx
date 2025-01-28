import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Axios from "axios";
import { Login, Register, PageNotFound, MainPage } from "./components";
import UserContext from "./context/UserContext";
import { BASE_URL } from './config/Config';

function App() {
    const [userData, setUserData] = useState({
        token: undefined,
        user: undefined,
    });

    useEffect(() => {
        const loginCheck = async () => {
            let token = localStorage.getItem("auth-token");
            if (!token) {
                setUserData({token: undefined, user: undefined});
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
                    token,
                    user: userRes.data,
                });
            } else {
                setUserData({token: undefined, user: undefined});
            }
        };

        loginCheck();
    }, []);

    return (
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
                    <Route path="/*" element={<PageNotFound/>}/>
                </Routes>
            </UserContext.Provider>
        </Router>
    );
}

export default App;
