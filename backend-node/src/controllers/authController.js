/**
 * authController.js — Authentication Controller
 *
 * Handles user registration and login for the Ceylon3D platform.
 *
 * Endpoints served (via routes/auth.js):
 *   POST /auth/register — Create a new user account
 *   POST /auth/login    — Authenticate an existing user
 *
 * Security:
 *   - Passwords are hashed using bcryptjs with 12 salt rounds before storage.
 *   - JWT tokens are signed with a secret from `process.env.JWT_SECRET` (or a fallback).
 *   - Tokens expire after 24 hours.
 *   - Email addresses are normalized to lowercase before lookup/creation.
 *
 * Response format on success:
 *   { token: "<JWT>", user: { id, email, fullName, roles } }
 *
 * @module controllers/authController
 * @requires bcryptjs
 * @requires jsonwebtoken
 * @requires ../models/User
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

/**
 * Generate a signed JWT token containing the user's id, email, and roles.
 *
 * @param {Object} user            - The Mongoose user document.
 * @param {string} user._id       - MongoDB ObjectId of the user.
 * @param {string} user.email     - User's email address.
 * @param {Array}  user.roles     - Array of role strings (e.g., ['ROLE_USER']).
 * @returns {string}               - Signed JWT token string.
 */
const sign = (user) => jwt.sign(
  { id: user._id, email: user.email, roles: user.roles },
  process.env.JWT_SECRET || 'change-me',
  { expiresIn: '24h' }
);

/**
 * Format a user document into a safe public-facing object (excludes password).
 *
 * @param {Object} u - Mongoose user document.
 * @returns {Object}  - { id, email, fullName, roles }
 */
const fmt = (u) => ({ id: u._id, email: u.email, fullName: u.fullName, roles: u.roles });

/**
 * Register a new user.
 *
 * Expects `req.body` to contain: { fullName, email, password }
 *
 * Validation:
 *   - All three fields are required (400 if missing).
 *   - Email must not already be registered (409 if duplicate).
 *
 * On success: Creates user in MongoDB, returns JWT + user info (201).
 *
 * @param {import('express').Request}  req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Required payload check.
    if (!fullName || !email || !password) return res.status(400).json({ error: 'All fields required' });

    // Prevent duplicate account creation.
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email already registered' });

    // Hash password before persistence.
    const user = await User.create({ fullName, email, password: await bcrypt.hash(password, 12) });

    // Return JWT + safe user payload.
    res.status(201).json({ token: sign(user), user: fmt(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * Log in an existing user.
 *
 * Expects `req.body` to contain: { email, password }
 *
 * Validation:
 *   - Both fields are required (400 if missing).
 *   - Credentials are verified against the stored hash (401 if invalid).
 *
 * On success: Returns JWT + user info (200).
 *
 * @param {import('express').Request}  req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Required payload check.
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Find account by normalized email.
    const user = await User.findOne({ email: email.toLowerCase() });

    // Reject invalid credentials.
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });

    // Return JWT + safe user payload.
    res.json({ token: sign(user), user: fmt(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { register, login };
