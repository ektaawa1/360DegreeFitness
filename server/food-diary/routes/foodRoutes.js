const express = require("express");
const router = express.Router();
const {
    search_food,
    details_by_id
} = require('../controller/foodController');

const {
    get_meal_details,
    add_meal
} = require('../controller/mealController');

router.get('/search-food/:name', search_food);
router.get('/food-nutrition/:id', details_by_id);

router.post('/add-meal', add_meal);
router.get('/get-diary', get_meal_details);


module.exports = router;
