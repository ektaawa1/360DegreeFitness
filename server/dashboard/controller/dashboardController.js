const jwt = require("jsonwebtoken");
const axios = require("axios");


exports.nutrition_info = async (req, res) => {
    const token = req.header('x-auth-token');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
        return res.json(false);
    }
    try {
        const user_id = verified.id;
        // const response = await axios.get(`${FASTAPI_BASE_URL}/nutrition_info?user_id=${user_id}`);
        // return res.json(response.data);

        return  res.json({
            dailyCalories: [1800, 1900, 1700, 2000, 2100, 1950, 1850],
            macros: { protein: 120, carbs: 200, fat: 70 },
            meals: [
                { date: "Apr 10", name: "Breakfast", calories: 450 },
                { date: "Apr 10", name: "Lunch", calories: 650 },
                { date: "Apr 9 ", name: "Dinner", calories: 700 },
            ],
        });
    } catch (error) {
        return res.json(false);
    }
};


exports.exercise_info = async (req, res) => {
    const token = req.header('x-auth-token');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
        return res.json(false);
    }
    try {
        const user_id = verified.id;
        // const response = await axios.get(`${FASTAPI_BASE_URL}/exercise_info?user_id=${user_id}`);
        // return res.json(response.data);

        return  res.json({
            weeklyWorkouts: [3, 5, 4, 6, 2, 4, 5],
            caloriesBurned: [300, 450, 500, 350, 200, 400, 550],
            lastWorkouts: [
                { type: "Running", duration: 30, calories: 350 },
                { type: "Weight Lifting", duration: 45, calories: 250 },
                { type: "Zumba", duration: 30, calories: 280 },
            ],
        });
    } catch (error) {
        return res.json(false);
    }
};