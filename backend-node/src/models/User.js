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
  // The user's email address. Used for logging in. Must be unique, is stored lowercase, and required.
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  
  // The user's hashed password. It is never returned in API responses. Required.
  password: { type: String, required: true },
  
  // The user's full display name. Required.
  fullName: { type: String, required: true, trim: true },
  
  // Array of roles assigned to the user. Defaults to ['ROLE_USER']. Admins will include 'ROLE_ADMIN'.
  roles:    { type: [String], default: ['ROLE_USER'] },
}, { 
  // Automatically track when the user account was created. Updates are not automatically timestamped.
  timestamps: { createdAt: 'createdAt', updatedAt: false } 
});

module.exports = mongoose.model('User', userSchema);
