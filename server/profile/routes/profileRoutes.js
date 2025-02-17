const express = require("express");
const router = express.Router();
const {
    getProfile,
    createProfile,
    updateProfile
} = require('../controller/profileController');

router.get('/get-profile', getProfile);
router.post('/create-profile', createProfile);
router.put('/update-profile', updateProfile);


module.exports = router;
