import React from 'react';
import { Form, Input, Button, Card, Typography, message, Icon } from 'antd';
// import { withRouter } from 'react-router-dom';
import Axios from 'axios';
import { BASE_URL } from '../../config/Config';
import AuthLayout from './AuthLayout';
import {useParams} from "react-router-dom";

const { Title, Text } = Typography;
const FormItem = Form.Item;

const ResetPasswordWithToken = (props) => {
    const { token } = useParams();
    return <ResetPassword {...props} token={token} />;
};

class ResetPassword extends React.Component<any, any> {
    state = {
        loading: false
    };

    handleSubmit = (token) => {
        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.setState({ loading: true });

                Axios.post(`${BASE_URL}/api/auth/reset-password/${token}`, {
                    newPassword: values.password
                })
                    .then(res => {
                        message.success(res.data.message);
                        this.props.history.push("/login");
                    })
                    .catch(error => {
                        message.error("Error resetting password. Try again.");
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
        const {token} = this.props;

        return (
            <AuthLayout>
                <Card className="auth-card">
                    <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
                        Set New Password
                    </Title>
                    <Text style={{ display: 'block', textAlign: 'center', marginBottom: 30, color: '#666' }}>
                        Create a new password for your account
                    </Text>

                    <Form onSubmit={() =>this.handleSubmit(token)}>
                        <FormItem>
                            {getFieldDecorator('password', {
                                rules: [
                                    { required: true, message: 'Please input your new password!' },
                                    { min: 6, message: 'Password must be at least 6 characters!' }
                                ],
                            })(
                                <Input.Password
                                    prefix={<Icon type="lock" />}
                                    placeholder="New Password"
                                    size="large"
                                />
                            )}
                        </FormItem>

                        <FormItem>
                            {getFieldDecorator('confirmPassword', {
                                rules: [
                                    { required: true, message: 'Please confirm your password!' },
                                    {
                                        validator: this.compareToFirstPassword,
                                    }
                                ],
                            })(
                                <Input.Password
                                    prefix={<Icon type="lock" />}
                                    placeholder="Confirm Password"
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
                                Reset Password
                            </Button>
                        </FormItem>
                    </Form>
                </Card>
            </AuthLayout>
        );
    }

    compareToFirstPassword = (rule, value, callback) => {
        const { form } = this.props;
        if (value && value !== form.getFieldValue('password')) {
            callback('The two passwords that you entered do not match!');
        } else {
            callback();
        }
    };
}

const WrappedResetPasswordForm = Form.create({ name: 'reset_password' })(ResetPasswordWithToken);

export default WrappedResetPasswordForm;