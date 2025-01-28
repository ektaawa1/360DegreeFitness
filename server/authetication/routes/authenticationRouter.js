const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  registerUser,
  loginUser,
  validate,
} = require('../controller/authController');
const { getUser } = require('../../user/controller/userController');

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.post('/validate', validate);

router.get('/user', auth, getUser);

module.exports = router;
