const express = require("express");
const router = express.Router();
const {
    getProfile,
    createProfile,
    updateProfile,
    getWeightGoal
} = require('../controller/profileController');

const {
    getPlan
} = require('../controller/fitnessPlanController');

router.get('/get-profile', getProfile);
router.post('/create-profile', createProfile);
router.put('/update-profile', updateProfile);


router.get('/get-fitness-plan', getPlan);

router.get('/get-weight-goal', getWeightGoal);


module.exports = router;
