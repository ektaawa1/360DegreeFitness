const axios = require("axios");
const jwt = require("jsonwebtoken");
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;

function meal_data(data) {
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
        "daily_nutrition_summary": {
            "total_calories": 250,
            "total_fat": 250,
            "total_carbs": 250,
            "total_protein": 250
        }
    };
}

exports.get_meal_details = async (req, res) => {
    const {date} = req.query;
    const token = req.header('x-auth-token');
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
        return res.json(false);
    }
    try {
        const user_id = '67b57586bc77bfb5e9e46025';
        // const user_id = verified.id;
        const response = await axios.get(`${FASTAPI_BASE_URL}/getMyMealDiary?user_id=${user_id}&meal_date=${date}`);
        const data = meal_data(response.data)
        return res.json(data);
    } catch (error) {
        return res.json([]);
    }
};


exports.add_meal = async (req, res) => {
    console.log(req);
    try {
        const response = await axios.get(`${FASTAPI_BASE_URL}/getDetailsByFoodId/${req.id}`);
        return res.json(response.data);
    } catch (error) {
        return res.json(false);
    }
};

