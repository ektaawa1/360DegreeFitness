const express = require("express");
const router = express.Router();
const {
    getProfile,
    createProfile,
    updateProfile
} = require('../controller/profileController');

const {
    getPlan
} = require('../controller/fitnessPlanController');

router.get('/get-profile', getProfile);
router.post('/create-profile', createProfile);
router.put('/update-profile', updateProfile);

router.get('/get-fitness-plan', getPlan);


module.exports = router;
