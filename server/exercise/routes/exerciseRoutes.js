const express = require("express");
const router = express.Router();
const {
    add_exercise,
    calculate_calories,
    get_exercise_details,
    delete_exercise
} = require('../controller/exerciseController');


router.post('/add-exercise', add_exercise);
router.delete('/delete-exercise', delete_exercise);
router.get('/get-diary', get_exercise_details);
router.post('/calculate-calories', calculate_calories);


module.exports = router;
