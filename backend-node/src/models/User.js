/**
 * User.js — User Mongoose Model
 *
 * Represents a registered user of the Ceylon3D platform.
 *
 * Fields:
 *   - email     {String}   — User's email address (required, unique, stored lowercase).
 *   - password  {String}   — Bcrypt-hashed password (required, never returned in API responses).
 *   - fullName  {String}   — User's display name (required).
 *   - roles     {[String]} — Array of role strings. Default: ['ROLE_USER'].
 *                             Admin users have ['ROLE_ADMIN'] (or both).
 *   - createdAt {Date}     — Auto-generated registration timestamp.
 *
 * @module models/User
 * @requires mongoose
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  roles:    { type: [String], default: ['ROLE_USER'] },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

module.exports = mongoose.model('User', userSchema);
