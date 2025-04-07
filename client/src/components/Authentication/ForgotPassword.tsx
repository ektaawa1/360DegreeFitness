import React from 'react';
import { Form, Input, Button, Card, Typography, message, Icon } from 'antd';
import { Link } from 'react-router-dom';
import Axios from 'axios';
import { BASE_URL } from '../../config/Config';
import AuthLayout from './AuthLayout';

const { Title, Text } = Typography;
const FormItem = Form.Item;

class ForgotPassword extends React.Component<any, any> {
    state = {
        loading: false
    };

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.setState({ loading: true });
                Axios.post(`${BASE_URL}/api/auth/forgot-password`, { email: values.email })
                    .then(res => {
                        message.success(res.data.message);
                    })
                    .catch(error => {
                        message.error("Error sending password reset link. Try again.");
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
                        Reset Password
                    </Title>
                    <Text style={{ display: 'block', textAlign: 'center', marginBottom: 30, color: '#666' }}>
                        Enter your email to receive a password reset link
                    </Text>

                    <Form onSubmit={this.handleSubmit}>
                        <FormItem>
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
                        </FormItem>

                        <FormItem>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                size="large"
                            >
                                Send Reset Link
                            </Button>
                        </FormItem>

                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                            <Link to="/login">Back to Login</Link>
                        </div>
                    </Form>
                </Card>
            </AuthLayout>
        );
    }
}

const WrappedForgotPasswordForm = Form.create({ name: 'forgot_password' })(ForgotPassword);

export default WrappedForgotPasswordForm;