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


exports.createProfile = async (req, res) => {
    const data = req.body;
    const token = req.header('x-auth-token');
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) {
            return res.json(false);
        }
        data.user_id = verified.id;
        const response = await axios.post(`${FASTAPI_BASE_URL}/create_fitness_profile`, data);
        return res.json(response.data);
    } catch (error) {
        return res.json(false);
    }
};


exports.updateProfile = async (req, res) => {
    const token = req.header('x-auth-token');
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) {
            return res.json(false);
        }
        const response = await axios.put(`${FASTAPI_BASE_URL}/edit_fitness_profile/${verified.id}`, req.data);
        return res.json(response.data);
    } catch (error) {
        return res.json(false);
    }
};