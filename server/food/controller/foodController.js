const axios = require("axios");
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;

exports.search_food = async (req, res) => {
    // const { name } = req.params;
    // console.log(req);
    // try {
    //     const response = await axios.get(`${FASTAPI_BASE_URL}/search_food/${name}`);
    //     return res.json(response.data);
    // } catch (error) {
    //     return res.json(false);
    // }
        return res.json({
            "foods": {
                "food": [
                    {
                        "food_description": "Per 100g - Calories: 147kcal | Fat: 9.94g | Carbs: 0.77g | Protein: 12.58g",
                        "food_id": "3092",
                        "food_name": "Egg",
                        "food_type": "Generic",
                        "food_url": "https://www.fatsecret.com/calories-nutrition/generic/egg-whole-raw"
                    },
                    {
                        "brand_name": "Great Value",
                        "food_description": "Per 1 egg - Calories: 70kcal | Fat: 5.00g | Carbs: 0.00g | Protein: 6.00g",
                        "food_id": "45771060",
                        "food_name": "Egg",
                        "food_type": "Brand",
                        "food_url": "https://www.fatsecret.com/calories-nutrition/great-value/egg"
                    },
                    {
                        "food_description": "Per 100g - Calories: 201kcal | Fat: 15.31g | Carbs: 0.88g | Protein: 13.63g",
                        "food_id": "33797",
                        "food_name": "Fried Egg",
                        "food_type": "Generic",
                        "food_url": "https://www.fatsecret.com/calories-nutrition/usda/fried-egg"
                    },
                    {
                        "food_description": "Per 100g - Calories: 155kcal | Fat: 10.61g | Carbs: 1.12g | Protein: 12.58g",
                        "food_id": "3094",
                        "food_name": "Boiled Egg",
                        "food_type": "Generic",
                        "food_url": "https://www.fatsecret.com/calories-nutrition/generic/egg-whole-boiled"
                    },
                    {
                        "food_description": "Per 100g - Calories: 166kcal | Fat: 12.21g | Carbs: 2.20g | Protein: 11.09g",
                        "food_id": "33801",
                        "food_name": "Scrambled Egg (Whole, Cooked)",
                        "food_type": "Generic",
                        "food_url": "https://www.fatsecret.com/calories-nutrition/usda/scrambled-egg-(whole-cooked)"
                    },
                    {
                        "brand_name": "Eggland's Best",
                        "food_description": "Per 1 egg - Calories: 60kcal | Fat: 5.00g | Carbs: 0.00g | Protein: 6.00g",
                        "food_id": "76960",
                        "food_name": "Large Grade A Eggs",
                        "food_type": "Brand",
                        "food_url": "https://www.fatsecret.com/calories-nutrition/egglands-best/large-grade-a-eggs"
                    },
                    {
                        "food_description": "Per 100g - Calories: 52kcal | Fat: 0.17g | Carbs: 0.73g | Protein: 10.90g",
                        "food_id": "33793",
                        "food_name": "Egg White",
                        "food_type": "Generic",
                        "food_url": "https://www.fatsecret.com/calories-nutrition/usda/egg-white"
                    },
                    {
                        "food_description": "Per 53g - Calories: 102kcal | Fat: 7.75g | Carbs: 0.49g | Protein: 7.15g",
                        "food_id": "3096",
                        "food_name": "Fried Egg",
                        "food_type": "Generic",
                        "food_url": "https://www.fatsecret.com/calories-nutrition/generic/egg-whole-fried"
                    },
                    {
                        "brand_name": "Kirkland Signature",
                        "food_description": "Per 2 eggs - Calories: 70kcal | Fat: 5.00g | Carbs: 0.00g | Protein: 6.00g",
                        "food_id": "88745949",
                        "food_name": "Egg",
                        "food_type": "Brand",
                        "food_url": "https://www.fatsecret.com/calories-nutrition/kirkland-signature/egg"
                    },
                    {
                        "food_description": "Per 100g - Calories: 155kcal | Fat: 10.61g | Carbs: 1.12g | Protein: 12.58g",
                        "food_id": "33798",
                        "food_name": "Hard-Boiled Egg",
                        "food_type": "Generic",
                        "food_url": "https://www.fatsecret.com/calories-nutrition/usda/hard-boiled-egg"
                    }
                ],
                "max_results": "10",
                "page_number": "0",
                "total_results": "2008"
            }
        });

};


exports.details_by_id = async (req, res) => {
    console.log(req);
    try {
        const response = await axios.get(`${FASTAPI_BASE_URL}/getDetailsByFoodId`, {
            food_id: req.id
        });
        return res.json(response.data);
    } catch (error) {
        return res.json(false);
    }
};

