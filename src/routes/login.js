const express = require('express');
const { fetchLogin, fetchForgotPassword, fetchResetPassword } = require('../controllers/login');
const router = express.Router();

router.post('/login', fetchLogin);
router.post('/forgot-password', fetchForgotPassword);
router.post('/reset-password', fetchResetPassword);

module.exports = router;