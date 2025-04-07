import React from 'react';
import {Form, Input, Button, Card, Typography, Icon} from 'antd';
import { Link } from 'react-router-dom';
import UserContext from '../../context/UserContext';
import Axios from 'axios';
import { BASE_URL } from '../../config/Config';
import AuthLayout from './AuthLayout';

const { Title, Text } = Typography;

class WrappedLoginForm extends React.Component<any, any> {
  static contextType = UserContext;

  state = {
    loading: false
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState({ loading: true });
        Axios.post(`${BASE_URL}/api/auth/login`, values)
            .then(loginRes => {
              if (loginRes.data.status === "fail") {
                alert(loginRes.data.message);
              } else {
                this.context.setUserData(loginRes.data);
                sessionStorage.setItem("auth-token", loginRes.data.token);
                window.location.href = "/";
              }
            })
            .catch(error => {
              alert("Login failed. Please try again.");
            })
            .finally(() => {
              this.setState({ loading: false });
            });
      }
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { loading } = this.state;

    return (
        <AuthLayout>
          <Card className="auth-card">
            <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
              Welcome Back
            </Title>
            <Text style={{ display: 'block', textAlign: 'center', marginBottom: 30, color: '#666' }}>
              Log in to continue your fitness journey
            </Text>

            <Form onSubmit={this.handleSubmit}>
              <Form.Item>
                {getFieldDecorator('username', {
                  rules: [{ required: true, message: 'Please input your username!' }],
                })(
                    <Input
                        prefix={<Icon type="user" />}
                        placeholder="Username"
                        size="large"
                    />
                )}
              </Form.Item>

              <Form.Item>
                {getFieldDecorator('password', {
                  rules: [{ required: true, message: 'Please input your password!' }],
                })(
                    <Input.Password
                        prefix={<Icon type="lock" />}
                        placeholder="Password"
                        size="large"
                    />
                )}
              </Form.Item>

              <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                    size="large"
                >
                  Log In
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Link to="/forgot-password" style={{ marginRight: 16 }}>
                  Forgot password?
                </Link>
                <span>Don't have an account? </span>
                <Link to="/register">Sign up</Link>
              </div>
            </Form>
          </Card>
        </AuthLayout>
    );
  }
}

const Login = Form.create({ name: 'login' })(WrappedLoginForm);
export default Login;