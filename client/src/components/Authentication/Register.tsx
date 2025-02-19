import React, { useState } from "react";
import { Input, Button, Card, Typography, Row, Col } from "antd";
import { Link, useNavigate } from "react-router-dom";
import Axios from "axios";
import { BASE_URL } from "../../config/Config";
import styles from "./Authentication.module.css";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    let errors = {};
    if (formData.username.length < 4 || formData.username.length > 15) {
      errors.username = "Username must be between 4 and 15 characters.";
    }
    if (formData.password.length < 6 || formData.password.length > 20) {
      errors.password = "Password must be between 6 and 20 characters.";
    }
    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      try {
        const response = await Axios.post(`${BASE_URL}/api/auth/register`, formData);
        if (response.data.status === "fail") {
          alert(response.data.message);
        } else {
          navigate("/login");
        }
      } catch (error) {
        alert("Registration failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
      <div className={styles.background}>
        <Row justify="center" align="middle" style={{ minHeight: "100vh" }}>
          <Col span={8} style={{float: "right"}}>
            <Card style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)", borderRadius: "10px", padding: "20px" }}>
              <Typography.Title level={2} style={{ textAlign: "center", color: "#1890ff" }}>
                Create an Account
              </Typography.Title>
              <Typography.Text style={{ display: "block", textAlign: "center", marginBottom: "20px", color: "#555" }}>
                Fill in the details to register.
              </Typography.Text>
              <form onSubmit={onSubmit}>
                <div>
                  <label style={{ fontWeight: "bold", color: "#333" }}>Name</label>
                  <Input name="name" placeholder="Enter your full name" required onChange={onChange} style={{ borderRadius: "8px", padding: "10px" }} />
                </div>
                <div style={{ marginTop: "15px" }}>
                  <label style={{ fontWeight: "bold", color: "#333" }}>Email</label>
                  <Input name="email" type="email" placeholder="Enter your email" required onChange={onChange} style={{ borderRadius: "8px", padding: "10px" }} />
                </div>
                <div style={{ marginTop: "15px" }}>
                  <label style={{ fontWeight: "bold", color: "#333" }}>Username</label>
                  <Input name="username" placeholder="Choose a username" required onChange={onChange} style={{ borderRadius: "8px", padding: "10px" }} />
                  {errors.username && <Typography.Text type="danger">{errors.username}</Typography.Text>}
                </div>
                <div style={{ marginTop: "15px" }}>
                  <label style={{ fontWeight: "bold", color: "#333" }}>Password</label>
                  <Input.Password name="password" placeholder="Create a password" required onChange={onChange} style={{ borderRadius: "8px", padding: "10px" }} />
                  {errors.password && <Typography.Text type="danger">{errors.password}</Typography.Text>}
                </div>
                <div style={{ marginTop: "20px" }}>
                  <Button type="primary" htmlType="submit" block loading={loading} style={{ borderRadius: "8px", fontSize: "16px", padding: "10px", paddingTop: 4 }}>
                    Register
                  </Button>
                </div>
              </form>
              <Row justify="center" style={{ marginTop: 16 }}>
                <Link to="/login" style={{ color: "#1890ff", fontWeight: "bold", marginRight: 20 }}>Sign In</Link>
                |
                <Link to="/forgot-password" style={{ color: "#1890ff", fontWeight: "bold", marginLeft: 20 }}>Forgot Password?</Link>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
  );
};

export default Register;
