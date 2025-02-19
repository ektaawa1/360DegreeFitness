import React, { useState } from "react";
import { Input, Button, Card, Typography, message } from "antd";
import { useParams } from "react-router-dom";
import Axios from "axios";
import { BASE_URL } from "../../config/Config";

const ResetPassword = () => {
    const { token } = useParams();
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await Axios.post(`${BASE_URL}/api/auth/reset-password/${token}`, { newPassword });
            message.success(res.data.message);
        } catch (error) {
            message.error("Error resetting password. Try again.");
        }

        setLoading(false);
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <Card style={{ width: 400, textAlign: "center" }}>
                <Typography.Title level={2}>Set New Password</Typography.Title>
                <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
                    <Input.Password
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        style={{ marginBottom: 10 }}
                    />
                    <Button type="primary" htmlType="submit" block loading={loading}>
                        Reset Password
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default ResetPassword;
