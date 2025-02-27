import React, {useEffect, useState} from "react";
import { DatePicker, Table, Button } from "antd";
import moment from "moment";
import {BASE_URL} from "../../config/Config";
import Axios from "axios";

type FoodEntry = {
    key: string;
    meal?: string;
    name?: string;
    calories?: number;
    carbs?: number;
    fat?: number;
    protein?: number;
    quantity?: number;
    children?: FoodEntry[];
};



const FoodDiary = ({onAdd}) => {
    const [date, setDate] = useState(moment());
    const [data, setResponseList] = useState({});
    const styles = { color: "#1890ff", fontWeight: 600 };

    useEffect(() => {
        const getData = async () => {
            const renderedDate = moment.utc(date).local().format('YYYY-MM-DD');
            let token = localStorage.getItem("auth-token");
            const headers = {
                "x-auth-token": token,
            };
            const url = BASE_URL + `/api/food/get-diary?date=${renderedDate}`;
            const response = await Axios.get(url, {headers});
            if (response.status === 200) {
                setResponseList(response.data);
            }
        };

        getData();
    }, [date]);

    const columns = [
        { title: <span style={styles}>Food Item</span>, dataIndex: "name", key: "name",
            render: (text: string, record: FoodEntry) =>
                record.children ? <strong>{text}</strong> : text },
        { title: <span style={styles}>Quantity</span>, dataIndex: "quantity", key: "quantity" },
        { title: <span style={styles}>Calories (kcal)</span>, dataIndex: "calories", key: "calories" },
        { title: <span style={styles}>Carbs (g)</span>, dataIndex: "carbs", key: "carbs" },
        { title: <span style={styles}>Fat (g)</span>, dataIndex: "fat", key: "fat" },
        { title: <span style={styles}>Protein (g)</span>, dataIndex: "protein", key: "protein" },
    ];


    return (
        <div style={{ padding: 20 }}>
            <DatePicker value={date} onChange={(d) => setDate(d || moment())} />
            <Table
                expandedRowKeys={data.meal_diary?.map(o => o.key)}
                columns={columns}
                dataSource={data.meal_diary}
                pagination={false}
                expandable={{ defaultExpandAllRows: true }}
                size={"small"}
            />
            <Button type="primary" style={{ marginTop: 10 }} onClick={onAdd}>
                Add Food
            </Button>
        </div>
    );
};

export default FoodDiary;