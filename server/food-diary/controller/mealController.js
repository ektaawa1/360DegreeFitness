const axios = require("axios");
const jwt = require("jsonwebtoken");
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;

function meal_data(data) {
    console.log(JSON.stringify(data));
    if (!data || !data.meal_diary) {
        return {
            meal_diary: [],
            daily_nutrition_summary: {}
        };
    }

    const mealTypes = ["breakfast", "lunch", "dinner", "snacks"];
    const transformedData = mealTypes.map((mealType, index) => {
        const meals = data.meal_diary[mealType] || [];

        return {
            key: (index + 1).toString(),
            name: mealType.charAt(0).toUpperCase() + mealType.slice(1),
            children: meals.map((meal, mealIndex) => ({
                key: `${index + 1}-${mealIndex + 1}`,
                mealType,
                name: `${meal.food_name}`,
                calories: meal.total_calories,
                carbs: meal.total_carbs,
                fat: meal.total_fat,
                protein: meal.total_protein,
                quantity: meal.quantity_consumed
            })),
        };
    });

    return {
        meal_diary: transformedData,
        daily_nutrition_summary: data.meal_diary.daily_nutrition_summary
    };
}

exports.get_meal_details = async (req, res) => {
    const {date} = req.query;
    const token = req.header('x-auth-token');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
        return res.json({
            meal_diary: [],
            daily_nutrition_summary: {}
        });
    }
    try {
        const user_id = verified.id;
        const response = await axios.get(`${FASTAPI_BASE_URL}/getMyMealDiary?user_id=${user_id}&meal_date=${date}`);
        const data = meal_data(response.data);
        return res.json(data);
    } catch (error) {
        return res.json({
            meal_diary: [],
            daily_nutrition_summary: {}
        });
    }
};


exports.add_meal = async (req, res) => {
    let data = req.body;
    const token = req.header('x-auth-token');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    try {
        data.user_id = verified.id
        const response = await axios.post(`${FASTAPI_BASE_URL}/add_meal_log`, data);
        return res.json(response);
    } catch (error) {
        return res.json({
            meal_diary: [],
            daily_nutrition_summary: {}
        });
    }
};

exports.delete_meal = async (req, res) => {
    let data = req.body;
    const token = req.header('x-auth-token');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    try {
        data.user_id = verified.id;
        const response = await axios.delete(`${FASTAPI_BASE_URL}/delete_meal_log`, {data});
        return res.json(response);
    } catch (error) {
        return res.json({});
    }
};

