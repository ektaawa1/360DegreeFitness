const axios = require("axios");
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;

exports.search_food = async (req, res) => {
     const { name } = req.params;
     console.log(req);
     try {
        const response = await axios.get(`${FASTAPI_BASE_URL}/search_food/${name}`);
         return res.json(response.data);
     } catch (error) {
         return res.json(false);
     }
};

exports.details_by_id = async (req, res) => {
    const { id } = req.params;
    console.log(req);
    try {
        const response = await axios.get(`${FASTAPI_BASE_URL}/getDetailsByFoodId?food_id=${id}`);
        return res.json(response.data);
    } catch (error) {
        return res.json(null);
    }
};
