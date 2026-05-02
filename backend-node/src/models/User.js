const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  roles:    { type: [String], default: ['ROLE_USER'] },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });
module.exports = mongoose.model('User', userSchema);
