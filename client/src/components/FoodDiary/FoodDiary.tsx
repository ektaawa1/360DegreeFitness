import React, { useState } from "react";
import { DatePicker, Table, Button } from "antd";
import moment from "moment";

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

const FoodDiary: React.FC = () => {
    const [date, setDate] = useState(moment());
    const styles = { color: "#1890ff", fontWeight: 600 };

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

    const data: FoodEntry[] = [
        {
            key: "1",
            name: "Breakfast",
            children: [
                { key: "1-1", name: "Diet Omelette - 1/2 Large", calories: 210, carbs: 5, fat: 9, protein: 27, quantity: 361 },
            ],
        },
        {
            key: "2",
            name: "Lunch",
            children: [
                { key: "2-1", name: "Home Made - Chapati, 2 piece", calories: 136, carbs: 22, fat: 1, protein: 6, quantity: 110 },
                { key: "2-2", name: "Paul's Quinoa - 0.13 cup", calories: 78, carbs: 13, fat: 1, protein: 3, quantity: 0 },
            ],
        },
        {
            key: "3",
            name: "Dinner",
            children: [
                { key: "3-1", name: "quinoa khichdi - 1 cup", calories: 250, carbs: 40, fat: 10, protein: 10, quantity: 0 },
            ],
        },
        {
            key: "4",
            name: "Snacks",
            children: [],
        },
    ];

    return (
        <div style={{ padding: 20 }}>
            <DatePicker value={date} onChange={(d) => setDate(d || moment())} />
            <Table
                expandedRowKeys={data.map(o => o.key)}
                columns={columns}
                dataSource={data}
                pagination={false}
                expandable={{ defaultExpandAllRows: true }}
                size={"small"}
            />
            <Button type="primary" style={{ marginTop: 10 }}>
                Add Food
            </Button>
        </div>
    );
};

export default FoodDiary;