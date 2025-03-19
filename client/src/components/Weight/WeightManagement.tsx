import React, { useEffect, useState } from "react";
import {Table, Button, Select, Drawer, Modal, message} from "antd";
import moment from "moment";
import { BASE_URL } from "../../config/Config";
import Axios from "axios";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import WeightForm from "./WeightForm";

const { Option } = Select;

const WeightManagement = () => {
    const [range, setRange] = useState("1d");
    const [data, setResponseList] = useState({});
    const [visible, setVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const styles = { color: "#1890ff", fontWeight: 600 };
    let formRef = null;

    useEffect(() => {
        const getData = async () => {
            let token = localStorage.getItem("auth-token");
            const headers = { "x-auth-token": token };
            const url = `${BASE_URL}/api/weight/get-log?range=${range}`;
            const response = await Axios.get(url, { headers });
            if (response.status === 200) {
                setResponseList(response.data);
            }
        };
        getData();
    }, [range]);

    const handleRangeChange = (value) => {
        setRange(value);
    };


    const addWeight = async (values) => {
        let token = localStorage.getItem("auth-token");
        const headers = { "x-auth-token": token };
        const url = `${BASE_URL}/api/weight/add-weight-log`;
        const response = await Axios.post(url, values,{ headers });
        if (response.status === 200) {
            setResponseList(response.data);
            message.success('Weight added successfully !!', 2);
        }
    };


    const handleCreate = () => {
        formRef.props.form.validateFields((err, values) => {
            if (err) return;
            addWeight(values);
            formRef.props.form.resetFields();
            setModalVisible(false);
        });
    };

    const saveFormRef = (formInstance) => {
        formRef = formInstance;
    };

    const columns = [
        { title: <span style={styles}>Timestamp</span>, dataIndex: "timestamp", key: "timestamp" },
        { title: <span style={styles}>Weight (kg)</span>, dataIndex: "weight", key: "weight" },
        { title: <span style={styles}>Notes</span>, dataIndex: "notes", key: "notes" }
    ];

    const weightData = data.weight_entries || [];
    const weightChartOptions = {
        chart: { type: "line" },
        title: { text: "Weight Progress" },
        xAxis: { categories: weightData.map(entry => entry.timestamp) },
        yAxis: { title: { text: "Weight (kg)" } },
        series: [{ name: "Weight", data: weightData.map(entry => entry.weight) }]
    };

    return (
        <div style={{ padding: 20 }}>
            <Select value={range} onChange={handleRangeChange} style={{ width: 150, margin: "0 10px" }}>
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
                closable={true}
                onClose={() => setVisible(false)}
                visible={visible}
                width={600}
            >
                <Table dataSource={weightData} columns={columns} rowKey="timestamp" pagination={false} />
            </Drawer>

            <WeightForm
                wrappedComponentRef={saveFormRef}
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                onCreate={handleCreate}
            />
        </div>
    );
};

export default WeightManagement;
