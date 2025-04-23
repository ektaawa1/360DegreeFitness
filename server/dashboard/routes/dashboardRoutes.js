const express = require("express");
const router = express.Router();



const {
    nutrition_info,
    exercise_info
} = require('../controller/dashboardController');


router.get('/nutrition', nutrition_info);
router.get('/exercise', exercise_info);


module.exports = router;
