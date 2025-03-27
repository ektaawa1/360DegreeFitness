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

    let weightChartOptions = {};

    if (data) {

        const today = new Date().toISOString().split("T")[0];
        const weightLogs = data.weight_logs;
        const lastLog = weightLogs[weightLogs.length - 1];

// Calculate y-axis min/max to include starting_weight + buffer
        const minWeight = Math.min(data.starting_weight, ...weightLogs.map(entry => entry.weight_in_kg));
        const maxWeight = Math.max(data.starting_weight, ...weightLogs.map(entry => entry.weight_in_kg));
        const padding = 0.5; // Add slight padding (adjust as needed)

        weightChartOptions = {
            chart: { type: "line" },
            title: { text: "Weight Progress" },
            xAxis: {
                categories: [...weightLogs.map(entry => entry.date), today],
                title: { text: "Date" },
                tickmarkPlacement: "on",
                min: 0, // Start x-axis at first logged point (x=0)
                max: weightLogs.length, // Adjust if projecting to today
            },
            yAxis: {
                title: { text: "Weight (kg)" },
                min: minWeight - padding, // Ensures starting_weight is visible
                max: maxWeight + padding,
                allowDecimals: true,
                lineWidth: 1,
                lineColor: "#000",
            },
            tooltip: {
                formatter: function() {
                    if (this.series.name === "Projected Weight") {
                        return `<b>Date:</b> ${today}<br><b>Projected Weight:</b> ${lastLog.weight_in_kg} kg`;
                    } else if (this.series.name === "Weight") {
                        // Skip tooltip for the starting weight (x = -0.5)
                        if (this.point.x === -0.5) return `<b>Start</b> <br><b>Weight:</b> ${data.starting_weight} kg`;;

                        // Adjust index for actual logs (since x=0 is first log)
                        const logIndex = this.point.x; // x=0 → first log
                        const log = weightLogs[logIndex];

                        return `<b>Date:</b> ${log.date}<br><b>Weight:</b> ${log.weight_in_kg} kg` +
                            (log.notes ? `<br><b>Notes:</b> ${log.notes}` : "");
                    }
                }
            },
            series: [
                {
                    name: "Weight",
                    data: [
                        { x: -0.5, y: data.starting_weight }, // Slight offset to align with y-axis
                        { x: 0, y: weightLogs[0].weight_in_kg }, // First logged weight
                        ...weightLogs.slice(1).map((entry, index) => ({
                            x: index + 1,
                            y: entry.weight_in_kg,
                        })),
                    ],
                    marker: {
                        enabled: true,
                        symbol: "circle",
                        lineWidth: 1,
                    },
                    lineWidth: 2,
                },
                {
                    name: "Projected Weight",
                    data: [
                        { x: weightLogs.length - 1, y: lastLog.weight_in_kg },
                        { x: weightLogs.length, y: lastLog.weight_in_kg },
                    ],
                    dashStyle: "dot",
                    marker: { enabled: true },
                    color: "gray",
                },
            ],
            plotOptions: {
                series: {
                    // Hide the line segment between x=-0.5 and x=0 if it looks awkward
                    connectNulls: false,
                }
            }
        };
    }

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

            <div style={{ marginTop: 100}}/>

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
