const axios = require("axios");
const jwt = require("jsonwebtoken");
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;

exports.getProfile = async (req, res) => {
    const token = req.header('x-auth-token');
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) {
            return res.json(false);
        }

        const response = await axios.get(`${FASTAPI_BASE_URL}/get_fitness_profile/${verified.id}`);
        return res.json(response.data);
    } catch (error) {
        return res.json(false);
    }
};

function makeNullIfEmpty(obj) {
    if (Object.keys(obj).length === 0 && obj.constructor === Object) {
        return null;
    }
    return obj;
}


exports.createProfile = async (req, res) => {
    let data = req.body;
    const token = req.header('x-auth-token');
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) {
            return res.json(false);
        }
        const formattedData = {
            user_id: verified.id,
            user_basic_details: {
                age: data.user_basic_details.age,
                height_in_cm: data.user_basic_details.height_in_cm,
                weight_in_kg: data.user_basic_details.weight_in_kg,
                gender: data.user_basic_details.gender
            },
            user_initial_measurements:  makeNullIfEmpty(data.user_initial_measurements),
            user_health_details:  makeNullIfEmpty(data.user_health_details),
            user_habits_assessment: makeNullIfEmpty(data.user_habits_assessment),
            user_routine_assessment: data.user_routine_assessment,
            user_fitness_goals: data.user_basic_details.user_fitness_goals
        };

        console.log("Formatted Payload:", JSON.stringify(formattedData, null, 2));

        const response = await axios.post(
            `${FASTAPI_BASE_URL}/create_fitness_profile`,
            formattedData,
            { headers: { "Content-Type": "application/json" } }
        );
        return res.json(response.data);
    } catch (error) {
        return res.json(false);
    }
};


exports.updateProfile = async (req, res) => {
    const token = req.header('x-auth-token');
    let data = req.body;
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) {
            return res.json(false);
        }
        data.user_id = verified.id;
        data.fitness_goals = data.user_details.fitness_goals;
        delete data.user_details.fitness_goals;
        data = removeEmptyObjects(data);
        const response = await axios.put(`${FASTAPI_BASE_URL}/edit_fitness_profile/${verified.id}`, data);
        return res.json(response.data);
    } catch (error) {
        return res.json(false);
    }
};