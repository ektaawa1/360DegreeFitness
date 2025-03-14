const express = require("express");
const router = express.Router();

const {
    add_weight,
    get_weight
} = require('../controller/weightController');


router.post('/add-weight-log', add_weight);
router.get('/get-log', get_weight);


module.exports = router;
