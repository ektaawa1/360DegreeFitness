const axios = require("axios");
const jwt = require("jsonwebtoken");
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;


exports.add_exercise = async (req, res) => {
    let data = req.body;
    const token = req.header('x-auth-token');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    try {
        data.user_id = verified.id
        const response = await axios.post(`${FASTAPI_BASE_URL}/addExerciseLog`, data);
        return res.json(response);
    } catch (error) {
        return res.json({});
    }
};

exports.delete_exercise = async (req, res) => {
    let data = req.body;
    const token = req.header('x-auth-token');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    try {
        data.user_id = verified.id;
        const response = await axios.delete(`${FASTAPI_BASE_URL}/delete_exercise_log`, {data});
        return res.json(response);
    } catch (error) {
        return res.json({});
    }
};


exports.get_exercise_details = async (req, res) => {
    const {date} = req.query;
    const token = req.header('x-auth-token');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
        return res.json({});
    }
    try {
        const user_id = verified.id;
        const response = await axios.get(`${FASTAPI_BASE_URL}/getMyExerciseDiary?user_id=${user_id}&exercise_date=${date}`);
        // const data = meal_data(response.data);
        return res.json(response.data);
    } catch (error) {
        return res.json({});
    }
};

exports.calculate_calories = async (req, res) => {
    let data = req.body;
    const token = req.header('x-auth-token');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
        return res.json({});
    }
    try {
        data.user_id = verified.id;
        const response = await axios.post(`${FASTAPI_BASE_URL}/calculateCaloriesBurnt`, data);
        return res.json(response.data);
    } catch (error) {
        return res.json({});
    }
};


