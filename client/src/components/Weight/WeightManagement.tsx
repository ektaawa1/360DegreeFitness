import React, { useEffect, useState } from "react";
import { Table, Button, Select, Drawer, Modal, message, Popconfirm } from "antd";
import moment from "moment";
import { BASE_URL } from "../../config/Config";
import Axios from "axios";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import WeightForm from "./WeightForm";

const { Option } = Select;

// Function to preprocess weight logs and assign an index for each entry on the same date
const preprocessWeightLogs = (weightLogs) => {
    let processedLogs = [];
    let dateEntryMap = {};

    weightLogs.forEach((entry) => {
        if (!dateEntryMap[entry.date]) {
            dateEntryMap[entry.date] = 0;
        }
        processedLogs.push({ ...entry, entryIndex: dateEntryMap[entry.date] });
        dateEntryMap[entry.date] += 1;
    });

    return processedLogs;
};

const WeightManagement = () => {
    const [range, setRange] = useState("1w");
    const [data, setResponseList] = useState(null);
    const [visible, setVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

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
                let updatedData = response.data || {};
                updatedData.weight_logs = preprocessWeightLogs(updatedData.weight_logs || []);
                setResponseList(updatedData);
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

        const payload = {
            date: values.date.format("YYYY-MM-DD"),
            weights: [
                {
                    weight: values.weight,
                    notes: values.notes || "",
                }
            ]
        };

        try {
            const response = await Axios.post(url, payload, { headers });
            if (response.status === 200) {
                message.success("Weight added successfully!", 2);
                setModalVisible(false);
                fetchWeightData();
            }
        } catch (error) {
            message.error("Error adding weight. Please try again.");
        }
    };

    const deleteWeight = async (date, index) => {
        try {
            const token = localStorage.getItem("auth-token");
            if (!token) {
                message.error("Unauthorized: Please log in.");
                return;
            }

            const headers = { "x-auth-token": token };
            const payload = { date, index };

            const response = await Axios.delete(`${BASE_URL}/api/weight/delete_weight`, { data: payload, headers });

            if (response.status === 200) {
                message.success("Weight entry deleted successfully!");
                fetchWeightData();
            }
        } catch (error) {
            console.error("Error deleting weight entry:", error);
            message.error("Failed to delete weight entry.");
        }
    };

    const columns = [
        { title: "Date", dataIndex: "date", key: "date" },
        { title: "Weight (kg)", dataIndex: "weight_in_kg", key: "weight_in_kg" },
        { title: "Notes", dataIndex: "notes", key: "notes" },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Popconfirm
                    title="Are you sure you want to delete this entry?"
                    onConfirm={() => deleteWeight(record.date, record.entryIndex)}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button type="link" danger>Delete</Button>
                </Popconfirm>
            )
        }
    ];

    const weightChartOptions = data ? {
        chart: { type: "line" },
        title: { text: "Weight Progress" },
        xAxis: {
            categories: data.weight_logs.map(entry => entry.date),
            title: { text: "Date" }
        },
        yAxis: {
            title: { text: "Weight (kg)" },
            allowDecimals: true
        },
        tooltip: {
            formatter: function () {
                if (this.point.index === 0) {
                    return `<b>Starting Weight:</b> ${data.starting_weight} kg`;
                }
                let log = data.weight_logs[this.point.index - 1]; // Adjust index for logs
                return `<b>Date:</b> ${log.date} <br><b>Weight:</b> ${log.weight_in_kg} kg` +
                    (log.notes ? `<br><b>Notes:</b> ${log.notes}` : "");
            }
        },
        series: [{
            name: "Weight",
            data: [data.starting_weight, ...data.weight_logs.map(entry => entry.weight_in_kg)],
            marker: { enabled: true }
        }]
    } : {};

    return (
        <div style={{ padding: 20 }}>
            <Select value={range} onChange={setRange} style={{ width: 150, margin: "0 10px" }}>
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
                <Table dataSource={data?.weight_logs} columns={columns} rowKey={(record) => `${record.date}-${record.entryIndex}`} pagination={false} size={"small"} />
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
