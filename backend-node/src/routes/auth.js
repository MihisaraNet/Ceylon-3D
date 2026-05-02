/**
 * routes/auth.js — Authentication Routes
 *
 * Defines the public API endpoints for user authentication:
 *   POST /auth/register — Create a new account (validated by validateRegister middleware)
 *   POST /auth/login    — Sign in to an existing account (validated by validateLogin middleware)
 *
 * These routes are public (no auth middleware required).
 *
 * @module routes/auth
 */

const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validate');

// Register a new user — validates input then creates account
router.post('/register', validateRegister, register);

// Log in an existing user — validates input then returns JWT
router.post('/login',    validateLogin,    login);

module.exports = router;
