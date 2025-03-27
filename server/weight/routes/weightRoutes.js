const express = require("express");
const router = express.Router();

const {
    add_weight,
    get_weight,
    delete_weight
} = require('../controller/weightController');


router.post('/add_weight', add_weight);
router.get('/get_weight', get_weight);
router.delete('/delete_weight', delete_weight);

module.exports = router;
