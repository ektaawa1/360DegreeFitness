import React, { useEffect, useState } from "react";
import {DatePicker, Table, Button, Drawer, message} from "antd";
import moment from "moment";
import { BASE_URL } from "../../config/Config";
import Axios from "axios";
import { ArrowLeftRounded, ArrowRightRounded } from "@material-ui/icons";
import { useNavigate } from "react-router-dom";
import ExerciseForm from "./ExerciseForm";

const ExerciseDiary = ({ onAdd }) => {
    const [date, setDate] = useState(moment());
    const [data, setData] = useState({});
    const styles = { color: "#1890ff", fontWeight: 600 };
    const [modalVisible, setModalVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        getData();
    }, [date]);

    const getData = async () => {
        const formattedDate = moment.utc(date).local().format("YYYY-MM-DD");
        let token = localStorage.getItem("auth-token");
        const headers = { "x-auth-token": token };
        const url = BASE_URL + `/api/exercise/get-diary?date=${formattedDate}`;
        const response = await Axios.get(url, { headers });
        if (response.status === 200) {
            setData(response.data.exercise_diary || {});
        }
    };

    const handlePreviousDay = () => {
        setDate(prevDate => moment(prevDate).subtract(1, 'days'));
    };

    const handleNextDay = () => {
        setDate(prevDate => moment(prevDate).add(1, 'days'));
    };

    const addExercise = async (values, callback) => {
        let token = localStorage.getItem("auth-token");
        const headers = { "x-auth-token": token };
        const url = `${BASE_URL}/api/exercise/add-exercise`;
        const payload = {
            date: values.date,
            exercises: [
                {
                    "exercise_type": values.exercise_type,
                    "duration_minutes": values.duration_minutes,
                    "calories_burnt": values.calories_burnt
                }
            ]
        };

        try {
            const response = await Axios.post(url, payload, { headers });
            if (response.status === 200) {
                message.success("Exercise added successfully!", 2);
                callback();
                setModalVisible(false);
                getData();
            }
        } catch (error) {
            message.error("Error adding exercise. Please try again.");
        }
    };


    const columns = [
        {
            title: <span style={styles}>Exercise Type</span>,
            dataIndex: "exercise_type",
            key: "exercise_type",
        },
        { title: <span style={styles}>Duration (min)</span>, dataIndex: "duration_minutes", key: "duration_minutes" },
        { title: <span style={styles}>Calories Burnt</span>, dataIndex: "calories_burnt", key: "calories_burnt" },
    ];

    const exerciseSummary = data.daily_exercise_summary || {
        total_calories_burnt: 0,
        total_duration: 0,
    };

    return (
        <div style={{padding: 20}}>
            <Button onClick={handlePreviousDay} style={{margin: 0, border: "none", padding: 0}}><ArrowLeftRounded
                fontSize={'30px'}/></Button>
            <DatePicker value={date} onChange={(d) => setDate(d || moment())}/>
            <Button onClick={handleNextDay} style={{margin: 0, border: "none", padding: 0}}><ArrowRightRounded
                fontSize={'30px'}/></Button>
            <Table columns={columns} dataSource={data.exercises || []} rowKey={(record, index) => index} />
            <h3>Summary</h3>
            <p>Total Duration: {exerciseSummary.total_duration} min</p>
            <p>Total Calories Burnt: {exerciseSummary.total_calories_burnt} kcal</p>
            <Button type="primary" onClick={() => setModalVisible(true)}>Add Exercise</Button>

            <ExerciseForm
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                onCreate={addExercise}
            />        </div>
    );
};

export default ExerciseDiary;
