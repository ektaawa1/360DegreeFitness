import React, { useState, useContext } from "react";
import { Input, Button, Card, Typography, Row, Col } from "antd";
import { Link, useNavigate } from "react-router-dom";
import UserContext from "../../context/UserContext";
import Axios from "axios";
import { BASE_URL } from "../../config/Config";
import styles from "./Authentication.module.css";

const Login = () => {
  const navigate = useNavigate();
  const { setUserData } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const values = {
      username: e.target.username.value,
      password: e.target.password.value,
    };
    setLoading(true);
    const url = `${BASE_URL}/api/auth/login`;
    try {
      const loginRes = await Axios.post(url, values);
      if (loginRes.data.status === "fail") {
        alert(loginRes.data.message);
      } else {
        setUserData(loginRes.data);
        localStorage.setItem("auth-token", loginRes.data.token);
        navigate("/");
      }
    } catch (error) {
      alert("Login failed. Please try again.");
    }
    setLoading(false);
  };

  return (
      <div className={styles.background}>
        <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
          <Col span={8} style={{float: "right"}}>
            <Card style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)", borderRadius: "10px", padding: "20px" }}>
              <Typography.Title level={2} style={{ textAlign: "center", color: "#1890ff" }}>
                Welcome Back!
              </Typography.Title>
              <Typography.Text style={{ display: "block", textAlign: "center", marginBottom: "20px", color: "#555" }}>
                Please enter your credentials to log in.
              </Typography.Text>
              <form onSubmit={onSubmit}>
                <div>
                  <label style={{ fontWeight: "bold", color: "#333" }}>Username</label>
                  <Input name="username" placeholder="Enter your username" required style={{ borderRadius: "8px", padding: "10px" }} />
                </div>

                <div style={{ marginTop: "15px" }}>
                  <label style={{ fontWeight: "bold", color: "#333" }}>Password</label>
                  <Input.Password name="password" placeholder="Enter your password" required style={{ borderRadius: "8px", padding: "10px" }} />
                </div>

                <div style={{ marginTop: "20px" }}>
                  <Button type="primary" htmlType="submit" block loading={loading} style={{ borderRadius: "8px", fontSize: "16px", padding: "10px", paddingTop: 4}}>
                    Login
                  </Button>
                </div>
              </form>
              <Row justify="center" style={{ marginTop: 16, marginRight: "auto", marginLeft: "auto" }}>
                <Link to="/register" style={{ color: "#1890ff", fontWeight: "bold", marginRight: 20 }}>Sign Up</Link>
                |
                <Link to="/forgot-password" style={{ color: "#1890ff", fontWeight: "bold", marginLeft: 20 }}>Forgot Password?</Link>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
  );
};

export default Login;
