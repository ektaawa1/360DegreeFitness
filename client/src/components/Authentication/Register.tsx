import React from 'react';
import { Form, Input, Button, Card, Typography, Icon } from 'antd';
import { Link } from 'react-router-dom';
import Axios from 'axios';
import { BASE_URL } from '../../config/Config';
import AuthLayout from './AuthLayout';

const { Title, Text } = Typography;

class Register extends React.Component<any, any> {
    state = {
        loading: false
    };

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.setState({ loading: true });
                Axios.post(`${BASE_URL}/api/auth/register`, values)
                    .then(response => {
                        if (response.data.status === "fail") {
                            alert(response.data.message);
                        } else {
                            window.location.href = "/login";
                        }
                    })
                    .catch(error => {
                        alert("Registration failed. Please try again.");
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
                        Create Your Account
                    </Title>
                    <Text style={{ display: 'block', textAlign: 'center', marginBottom: 30, color: '#666' }}>
                        Start your fitness journey today
                    </Text>

                    <Form onSubmit={this.handleSubmit}>
                        <Form.Item>
                            {getFieldDecorator('name', {
                                rules: [{ required: true, message: 'Please input your full name!' }],
                            })(
                                <Input
                                    prefix={<Icon type="user" />}
                                    placeholder="Full Name"
                                    size="large"
                                />
                            )}
                        </Form.Item>

                        <Form.Item>
                            {getFieldDecorator('email', {
                                rules: [
                                    { required: true, message: 'Please input your email!' },
                                    { type: 'email', message: 'Please enter a valid email!' }
                                ],
                            })(
                                <Input
                                    prefix={<Icon type="mail" />}
                                    placeholder="Email"
                                    size="large"
                                />
                            )}
                        </Form.Item>

                        <Form.Item>
                            {getFieldDecorator('username', {
                                rules: [
                                    { required: true, message: 'Please choose a username!' },
                                    { min: 4, message: 'Username must be at least 4 characters!' },
                                    { max: 15, message: 'Username cannot be longer than 15 characters!' }
                                ],
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
                                rules: [
                                    { required: true, message: 'Please input your password!' },
                            { min: 6, message: 'Password must be at least 6 characters!' },
                            { max: 20, message: 'Password cannot be longer than 20 characters!' }
                                ],
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
                                Register
                            </Button>
                        </Form.Item>

                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                            <span>Already have an account? </span>
                            <Link to="/login">Log in</Link>
                        </div>
                    </Form>
                </Card>
            </AuthLayout>
        );
    }
}

const WrappedRegisterForm = Form.create({ name: 'register' })(Register);

export default WrappedRegisterForm;