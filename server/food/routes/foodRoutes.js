const express = require("express");
const router = express.Router();
const {
    search_food,
    details_by_id
} = require('../controller/foodController');

router.get('/search-food/:name', search_food);
router.get('/food-nutrition', details_by_id);


module.exports = router;
