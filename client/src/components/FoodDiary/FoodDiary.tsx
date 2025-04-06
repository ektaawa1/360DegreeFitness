import React, {useEffect, useState} from "react";
import {DatePicker, Table, Button, Drawer, message, Popconfirm} from "antd";
import moment from "moment";
import {BASE_URL} from "../../config/Config";
import Axios from "axios";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {ArrowLeftRounded, ArrowRightRounded} from "@material-ui/icons";
import { useNavigate } from "react-router-dom";

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

const FoodDiary = () => {
    const [date, setDate] = useState(moment());
    const [data, setResponseList] = useState({});
    const [visible, setVisible] = useState(false);
    const styles = {color: "#1890ff", fontWeight: 600};
    const navigate = useNavigate();
    useEffect(() => {
        getData();
    }, [date]);

    const getData = async () => {
        const renderedDate = moment.utc(date).local().format("YYYY-MM-DD");
        let token = localStorage.getItem("auth-token");
        const headers = {"x-auth-token": token};
        const url = BASE_URL + `/api/food/get-diary?date=${renderedDate}`;
        const response = await Axios.get(url, {headers});
        if (response.status === 200) {
            const data = response.data;
            setResponseList(data);

        }
    };

    const handlePreviousDay = () => {
        setDate(prevDate => moment(prevDate).subtract(1, 'days'));
    };

    const handleNextDay = () => {
        const nextDay = moment(date).add(1, 'days');
        if (nextDay.isAfter(moment(), 'day')) {
            message.warning("Cannot navigate to future dates");
            return;
        }
        setDate(nextDay);
    };


    const deleteMeal = async (record, index) => {
        try {
            const token = localStorage.getItem("auth-token");
            if (!token) {
                message.error("Unauthorized: Please log in.");
                return;
            }

            const headers = { "x-auth-token": token };
            const payload = {
                "date":moment.utc(date).local().format("YYYY-MM-DD"),
                "meal_type":record.mealType,
                index
            };

            const response = await Axios.delete(`${BASE_URL}/api/food/delete-meal`, { data: payload, headers });

            if (response.status === 200) {
                message.success("Meal entry deleted successfully!");
                getData();
            }
        } catch (error) {
            console.error("Error deleting meal entry:", error);
            message.error("Failed to delete meal entry.");
        }
    };

    const columns = [
        {
            title: <span style={styles}>Food Item</span>,
            dataIndex: "name",
            key: "name",
            render: (text: string, record: FoodEntry) =>
                record.children ? <strong>{text}</strong> : text,
        },
        {title: <span style={styles}>Quantity</span>, dataIndex: "quantity", key: "quantity"},
        {title: <span style={styles}>Calories (kcal)</span>, dataIndex: "calories", key: "calories"},
        {title: <span style={styles}>Carbs (g)</span>, dataIndex: "carbs", key: "carbs"},
        {title: <span style={styles}>Fat (g)</span>, dataIndex: "fat", key: "fat"},
        {title: <span style={styles}>Protein (g)</span>, dataIndex: "protein", key: "protein"},
        {
            title: "Action",
            key: "action",
            render: (_, record, i) => {
                if (record.children) {
                    return;
                }
                return (
                    <Popconfirm
                        title="Are you sure you want to delete this entry?"
                        onConfirm={() => deleteMeal(record, i)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger>Delete</Button>
                    </Popconfirm>
                )
            }
        }
    ];

    const nutritionSummary = data.daily_nutrition_summary || {
        total_calories: 0,
        total_carbs: 0,
        total_fat: 0,
        total_protein: 0,
    };

    const chartOptions = {
        chart: {type: "pie"},
        title: {text: "Nutrition Breakdown"},
        series: [
            {
                name: "Nutrients",
                data: [
                    // {name: "Calories", y: nutritionSummary.total_calories},
                    {name: "Carbs", y: parseFloat((nutritionSummary.total_carbs || 0).toFixed(2))},
                    {name: "Fat", y: parseFloat((nutritionSummary.total_fat || 0).toFixed(2) )},
                    {name: "Protein", y: parseFloat((nutritionSummary.total_protein || 0).toFixed(2))},
                ],
            },
        ],
    };

    return (
        <div style={{padding: 20}}>
            <Button onClick={handlePreviousDay} style={{margin: 0, border: "none", padding: 0}}><ArrowLeftRounded
                fontSize={'30px'}/></Button>
            <DatePicker value={date} disabledDate={current => current && current > moment().endOf('day')}
                        onChange={(d) => setDate(d || moment())}/>
            <Button onClick={handleNextDay} style={{margin: 0, border: "none", padding: 0}}><ArrowRightRounded
                fontSize={'30px'}/></Button>
                <Table
                    expandedRowKeys={data.meal_diary?.map((o) => o.key)}
                    columns={columns}
                    dataSource={data.meal_diary}
                    pagination={false}
                    expandable={{defaultExpandAllRows: true}}
                    size={"small"}
                />
                <Button type="primary" style={{marginTop: 10}} onClick={() => {
                    navigate("/search");
                }}>
                    Add Food
                </Button>
                <Button type="primary" style={{marginTop: 10, marginLeft: 10}} onClick={() => setVisible(true)}>
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
                    <p><strong>Total Calories:</strong> {nutritionSummary.total_calories} kcal</p>
                    <p><strong>Total Carbs:</strong> {nutritionSummary.total_carbs?.toFixed(2)}g</p>
                    <p><strong>Total Fat:</strong> {nutritionSummary.total_fat?.toFixed(2)}g</p>
                    <p><strong>Total Protein:</strong> {nutritionSummary.total_protein?.toFixed(2)}g</p>
                    <HighchartsReact highcharts={Highcharts} options={chartOptions}/>
                </Drawer>
        </div>
);
};

export default FoodDiary;