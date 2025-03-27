const axios = require("axios");
const jwt = require("jsonwebtoken");

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;

exports.get_weight = async (req, res) => {
    try {
        const { range } = req.query;
        const token = req.header('x-auth-token');

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }

        const user_id = verified.id;

        const response = await axios.get(`${FASTAPI_BASE_URL}/get_weight_logs`, {
            params: { user_id, time_range: range }
        });

        return res.json(response.data);
    } catch (error) {
        console.error("Error fetching weight log:", error.message);
        return res.status(500).json({ message: "Error fetching weight log" });
    }
};

exports.add_weight = async (req, res) => {
    try {
        const token = req.header('x-auth-token');

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }

        const user_id = verified.id;
        const { date, weights } = req.body;

        if (!date || !weights || !Array.isArray(weights)) {
            return res.status(400).json({ message: "Invalid input: date and weights array required" });
        }

        // Ensure each weight entry includes weight and optional notes
        const formattedWeights = weights.map(entry => ({
            weight_in_kg: entry.weight,
            notes: entry.notes || null // If no notes provided, store as null
        }));

        const payload = { user_id, date, weights: formattedWeights };

        const response = await axios.post(`${FASTAPI_BASE_URL}/addWeightLog`, payload);

        return res.json(response.data);
    } catch (error) {
        console.error("Error adding weight log:", error.message);
        return res.status(500).json({ message: "Error adding weight log" });
    }
};

exports.delete_weight = async (req, res) => {
    try {
        const token = req.header('x-auth-token');

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }

        const user_id = verified.id;
        const { date, index } = req.body;

        if (!date || index === undefined) {
            return res.status(400).json({ message: "Invalid input: date and index required" });
        }

        const payload = { user_id, date, index };

        const response = await axios.delete(`${FASTAPI_BASE_URL}/delete_weight_log`, {
            data: payload
        });

        return res.json(response.data);
    } catch (error) {
        console.error("Error deleting weight log:", error.message);
        return res.status(500).json({ message: "Error deleting weight log" });
    }
};
