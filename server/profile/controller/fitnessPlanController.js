const axios = require("axios");
const jwt = require("jsonwebtoken");
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;

exports.getPlan = async (req, res) => {
    const token = req.header('x-auth-token');
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) {
            return res.json(false);
        }

        const response = await axios.get(`${FASTAPI_BASE_URL}/retrieve_fitness_plan/${verified.id}`);
        const data = {
            fitness_plan: {
                ...response.data,
                "goals": {
                    "total_calories_goal": 2200,
                    "total_fat_goal": 10,
                    "total_carbs_goal": 40,
                    "total_protein_goal": 65
                }
            }
        };
        return res.json(data);
    } catch (error) {
        console.log(error);
        return res.json(false);
    }
};
