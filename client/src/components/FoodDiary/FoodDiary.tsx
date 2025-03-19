import React, {useEffect, useState} from "react";
import {DatePicker, Table, Button, Drawer} from "antd";
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

const FoodDiary = ({onAdd}) => {
    const [date, setDate] = useState(moment());
    const [data, setResponseList] = useState({});
    const [visible, setVisible] = useState(false);
    const styles = {color: "#1890ff", fontWeight: 600};
    const navigate = useNavigate();
    useEffect(() => {
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
        getData();
    }, [date]);

    const handlePreviousDay = () => {
        setDate(prevDate => moment(prevDate).subtract(1, 'days'));
    };

    const handleNextDay = () => {
        setDate(prevDate => moment(prevDate).add(1, 'days'));
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
            <DatePicker value={date} onChange={(d) => setDate(d || moment())}/>
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