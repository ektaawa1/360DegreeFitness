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