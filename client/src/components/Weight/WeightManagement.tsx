import React, { useEffect, useState } from "react";
import { Table, Button, Select, Drawer, Modal, message } from "antd";
import moment from "moment";
import { BASE_URL } from "../../config/Config";
import Axios from "axios";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import WeightForm from "./WeightForm";

const { Option } = Select;

const WeightManagement = () => {
    const [range, setRange] = useState("1w");
    const [data, setResponseList] = useState([]);
    const [visible, setVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const styles = { color: "#1890ff", fontWeight: 600 };
    let formRef = null;

    useEffect(() => {
        fetchWeightData();
    }, [range]);

    const fetchWeightData = async () => {
        try {
            const token = localStorage.getItem("auth-token");
            if (!token) {
                message.error("Unauthorized: Please log in.");
                return;
            }

            const headers = { "x-auth-token": token };
            const response = await Axios.get(`${BASE_URL}/api/weight/get_weight?range=${range}`, { headers });

            if (response.status === 200) {
                setResponseList(response.data.weight_logs || []);
            }
        } catch (error) {
            console.error("Error fetching weight data:", error);
            message.error("Failed to fetch weight data.");
        }
    };


    const addWeight = async (values) => {
        let token = localStorage.getItem("auth-token");
        const headers = { "x-auth-token": token };
        const url = `${BASE_URL}/api/weight/add_weight`;

        // Ensure correct format for API
        const payload = {
            date: values.date.format("YYYY-MM-DD"), // Format date
            weights: [
                {
                    weight: values.weight, // Extract weight
                    notes: values.notes || "", // Handle optional notes
                }
            ]
        };

        try {
            const response = await Axios.post(url, payload, { headers });
            if (response.status === 200) {
                message.success("Weight added successfully!", 2);
                setModalVisible(false); // Close modal after success
                fetchWeightData();
            }
        } catch (error) {
            message.error("Error adding weight. Please try again.");
        }
    };


    const columns = [
        { title: "Timestamp", dataIndex: "timestamp", key: "timestamp" },
        { title: "Weight (kg)", dataIndex: "weight", key: "weight" },
        { title: "Notes", dataIndex: "notes", key: "notes" }
    ];

    const weightChartOptions = {
        chart: { type: "line" },
        title: { text: "Weight Progress" },
        xAxis: { categories: data.map(entry => entry.timestamp) },
        yAxis: { title: { text: "Weight (kg)" } },
        series: [{ name: "Weight", data: data.map(entry => entry.weight) }]
    };

    return (
        <div style={{ padding: 20 }}>
            <Select value={range} onChange={setRange} style={{ width: 150, margin: "0 10px" }}>
                <Option value="1d">1 Day</Option>
                <Option value="1w">1 Week</Option>
                <Option value="1m">1 Month</Option>
                <Option value="3m">3 Months</Option>
                <Option value="6m">6 Months</Option>
                <Option value="1y">1 Year</Option>
            </Select>

            <Button type="primary" onClick={() => setVisible(true)} style={{ marginLeft: 10 }}>
                View Entries
            </Button>
            <Button type="default" onClick={() => setModalVisible(true)} style={{ marginLeft: 10 }}>
                Add Weight
            </Button>

            <HighchartsReact highcharts={Highcharts} options={weightChartOptions} />

            <Drawer
                title="Weight Log Entries"
                placement="right"
                closable
                onClose={() => setVisible(false)}
                visible={visible}
                width={600}
            >
                <Table dataSource={data} columns={columns} rowKey="timestamp" pagination={false} />
            </Drawer>

            <WeightForm
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                onCreate={addWeight}
            />
        </div>
    );
};

export default WeightManagement;
