import React, {useState} from "react";
import {Input, Button, Card, Typography, message} from "antd";
import Axios from "axios";
import {BASE_URL} from "../../config/Config";
import styles from "./Authentication.module.css";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await Axios.post(`${BASE_URL}/api/auth/forgot-password`, {email});
            message.success(res.data.message);
        } catch (error) {
            message.error("Error sending password reset link. Try again.");
        }

        setLoading(false);
    };

    return (
        <div className={styles.background}>
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
                <Card style={{width: 400, textAlign: "center"}}>
                    <Typography.Title level={2}>Reset Password</Typography.Title>
                    <Typography.Text>Enter your email to receive a password reset link.</Typography.Text>
                    <form onSubmit={handleSubmit} style={{marginTop: 20}}>
                        <Input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{marginBottom: 10}}
                        />
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Send Reset Link
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;
