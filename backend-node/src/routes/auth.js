/**
 * routes/auth.js — Authentication Routes
 *
 * Defines the public API endpoints for user authentication:
 *   POST /auth/register
 *   POST /auth/login
 *   POST /auth/verify-email
 *   POST /auth/resend-otp
 *   POST /auth/forgot-password
 *   POST /auth/reset-password
 *
 * @module routes/auth
 */

const router = require('express').Router();
const { 
  register, login, verifyEmail, resendOTP, forgotPassword, resetPassword 
} = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validate');

// Existing Routes
router.post('/register', validateRegister, register);
router.post('/login',    validateLogin,    login);

// New OTP / Email Auth Routes
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
