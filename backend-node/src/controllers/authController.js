/**
 * authController.js — Authentication Controller
 *
 * Handles user registration, login, email verification, and password reset.
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { sendOTP } = require('../utils/mailer');

// Helper to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sign = (user) => jwt.sign(
  { id: user._id, email: user.email, roles: user.roles },
  process.env.JWT_SECRET || 'change-me',
  { expiresIn: '24h' }
);

const fmt = (u) => ({ id: u._id, email: u.email, fullName: u.fullName, roles: u.roles });

const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: 'Email already registered' });

    const rawOTP = generateOTP();
    const hashedOTP = await bcrypt.hash(rawOTP, 12);
    
    // OTP expires in 5 minutes
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const user = await User.create({ 
      fullName, 
      email, 
      password: await bcrypt.hash(password, 12),
      isVerified: false,
      otp: hashedOTP,
      otpExpiresAt
    });

    await sendOTP(user.email, rawOTP, 'verification');

    res.status(201).json({ message: 'Registration successful. Please verify your email.', email: user.email });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email to log in.', isVerified: false, email: user.email });
    }

    res.json({ token: sign(user), user: fmt(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.isVerified) return res.status(400).json({ error: 'Email is already verified' });

    if (!user.otp || !user.otpExpiresAt || Date.now() > user.otpExpiresAt) {
      return res.status(400).json({ error: 'OTP has expired or is invalid' });
    }

    const isValid = await bcrypt.compare(otp.toString(), user.otp);
    if (!isValid) return res.status(400).json({ error: 'Invalid OTP' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully', token: sign(user), user: fmt(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'Email is already verified' });

    const rawOTP = generateOTP();
    user.otp = await bcrypt.hash(rawOTP, 12);
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendOTP(user.email, rawOTP, 'verification');
    res.json({ message: 'OTP sent successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const rawOTP = generateOTP();
    user.otp = await bcrypt.hash(rawOTP, 12);
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendOTP(user.email, rawOTP, 'reset');
    res.json({ message: 'Password reset OTP sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.otp || !user.otpExpiresAt || Date.now() > user.otpExpiresAt) {
      return res.status(400).json({ error: 'OTP has expired or is invalid' });
    }

    const isValid = await bcrypt.compare(otp.toString(), user.otp);
    if (!isValid) return res.status(400).json({ error: 'Invalid OTP' });

    user.password = await bcrypt.hash(newPassword, 12);
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    
    // Auto-verify email if it wasn't already (since they verified via email OTP)
    user.isVerified = true; 

    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { register, login, verifyEmail, resendOTP, forgotPassword, resetPassword };
