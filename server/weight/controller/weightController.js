const axios = require("axios");
const jwt = require("jsonwebtoken");
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;


exports.get_weight = async (req, res) => {
    const {date} = req.query;
    const token = req.header('x-auth-token');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
        return res.json({
            weights: []
        });
    }
    try {
        const user_id = verified.id;
        const response = await axios.get(`${FASTAPI_BASE_URL}/getMyWeightDiary?user_id=${user_id}&date=${date}`);
        return res.json(response.data);
    } catch (error) {
        return res.json({
            weights: []
        });
    }
};


exports.add_weight = async (req, res) => {
    let data = req.body;
    console.log(req);
    const token = req.header('x-auth-token');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    try {
        const rest_data = {
            user_id: verified.id,
            "date": "2025-03-09",
            "weights": [
                {
                    "weight_kg": 57.5,
                    "timestamp": "2025-03-09T08:00:00",
                    "notes": "Morning weight"
                }
            ]

        }
        const response = await axios.post(`${FASTAPI_BASE_URL}/addWeightLog`, rest_data);
        console.log(response);
        return res.json(response);
    } catch (error) {
        return res.json({
            meal_diary: [],
            daily_nutrition_summary: {}
        });
    }
};

