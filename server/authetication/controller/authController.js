const User = require('../../user/model/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require("axios");
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL;
const errorMessage = (res, error) => {
    return res.status(400).json({status: 'fail', message: error.message});
};

exports.registerUser = async (req, res) => {
    try {
        const {username, password, name} = req.body;

        if (!username || !password) {
            return res.status(200).json({
                status: 'fail',
                message: 'Not all fields have been entered',
            });
        }
        if (password.length < 6 || password.length > 25) {
            return res.status(200).json({
                status: 'fail',
                message: 'Password must be between 6-25 characters',
                type: 'password',
            });
        }

        const existingUser = await User.findOne({username});
        if (existingUser) {
            return res.status(200).json({
                status: 'fail',
                message: 'An account with this username already exists.',
                type: 'username',
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({username, password: hashedPassword, name});
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        return errorMessage(res, error);
    }
};

exports.loginUser = async (req, res) => {
    try {
        const {username, password} = req.body;

        if (!username || !password) {
            return res.status(200).json({
                status: 'fail',
                message: 'Not all fields have been entered.',
            });
        }

        const user = await User.findOne({username});

        if (!user) {
            return res.status(200).json({
                status: 'fail',
                message: 'Invalid credentials. Please try again.',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(200).json({
                status: 'fail',
                message: 'Invalid credentials. Please try again.',
            });
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);
        const response = await axios.get(`${FASTAPI_BASE_URL}/check_profile_completion/${user._id}`);
        return res.status(200).json({
            token,
            user: {
                username,
                name: user.name,
                id: user._id,
                balance: user.balance,
                profile_created: response.data.profile_exists,
                profile_completed: response.data.profile_complete
            },
        });
    } catch (error) {
        return errorMessage(res, error);
    }
};

exports.validate = async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.json(false);
        }
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) {
            return res.json(false);
        }

        const user = await User.findById(verified.id);
        if (!user) {
            return res.json(false);
        }
        const response = await axios.get(`${FASTAPI_BASE_URL}/check_profile_completion/${verified.id}`);
        return res.json({
            validate: true,
            profile_created: response.data.profile_exists,
            profile_completed: response.data.profile_complete
        });
    } catch (error) {
        return res.json(false);
    }
};
