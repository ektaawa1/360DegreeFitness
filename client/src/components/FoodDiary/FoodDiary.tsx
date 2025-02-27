import React, { useEffect, useState } from "react";
import { DatePicker, Table, Button, Drawer } from "antd";
import moment from "moment";
import { BASE_URL } from "../../config/Config";
import Axios from "axios";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

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

const FoodDiary = ({ onAdd }) => {
    const [date, setDate] = useState(moment());
    const [data, setResponseList] = useState({});
    const [visible, setVisible] = useState(false);
    const styles = { color: "#1890ff", fontWeight: 600 };

    useEffect(() => {
        const getData = async () => {
            const renderedDate = moment.utc(date).local().format("YYYY-MM-DD");
            let token = localStorage.getItem("auth-token");
            const headers = { "x-auth-token": token };
            const url = BASE_URL + `/api/food/get-diary?date=${renderedDate}`;
            const response = await Axios.get(url, { headers });
            if (response.status === 200) {
                setResponseList(response.data);
            }
        };
        getData();
    }, [date]);

    const columns = [
        {
            title: <span style={styles}>Food Item</span>,
            dataIndex: "name",
            key: "name",
            render: (text: string, record: FoodEntry) =>
                record.children ? <strong>{text}</strong> : text,
        },
        { title: <span style={styles}>Quantity</span>, dataIndex: "quantity", key: "quantity" },
        { title: <span style={styles}>Calories (kcal)</span>, dataIndex: "calories", key: "calories" },
        { title: <span style={styles}>Carbs (g)</span>, dataIndex: "carbs", key: "carbs" },
        { title: <span style={styles}>Fat (g)</span>, dataIndex: "fat", key: "fat" },
        { title: <span style={styles}>Protein (g)</span>, dataIndex: "protein", key: "protein" },
    ];

    const nutritionSummary = data.daily_nutrition_summary || {
        total_calories: 0,
        total_carbs: 0,
        total_fat: 0,
        total_protein: 0,
    };

    const chartOptions = {
        chart: { type: "pie" },
        title: { text: "Nutrition Breakdown" },
        series: [
            {
                name: "Nutrients",
                data: [
                    { name: "Calories", y: nutritionSummary.total_calories },
                    { name: "Carbs", y: nutritionSummary.total_carbs },
                    { name: "Fat", y: nutritionSummary.total_fat },
                    { name: "Protein", y: nutritionSummary.total_protein },
                ],
            },
        ],
    };

    return (
        <div style={{ padding: 20 }}>
            <DatePicker value={date} onChange={(d) => setDate(d || moment())} />
            <Table
                expandedRowKeys={data.meal_diary?.map((o) => o.key)}
                columns={columns}
                dataSource={data.meal_diary}
                pagination={false}
                expandable={{ defaultExpandAllRows: true }}
                size={"small"}
            />
            <Button type="primary" style={{ marginTop: 10 }} onClick={onAdd}>
                Add Food
            </Button>
            <Button type="primary" style={{ marginTop: 10, marginLeft: 10 }} onClick={() => setVisible(true)}>
                Nutrition Info
            </Button>
            <Drawer
                title="Nutrition Information"
                placement="right"
                closable={true}
                onClose={() => setVisible(false)}
                visible={visible}
                width={400}
            >
                <p><strong>Total Calories:</strong> {nutritionSummary.total_calories}</p>
                <p><strong>Total Carbs:</strong> {nutritionSummary.total_carbs}g</p>
                <p><strong>Total Fat:</strong> {nutritionSummary.total_fat}g</p>
                <p><strong>Total Protein:</strong> {nutritionSummary.total_protein}g</p>
                <HighchartsReact highcharts={Highcharts} options={chartOptions} />
            </Drawer>
        </div>
    );
};

export default FoodDiary;
