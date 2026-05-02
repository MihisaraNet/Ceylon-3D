const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

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
    const user = await User.create({ fullName, email, password: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: sign(user), user: fmt(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: sign(user), user: fmt(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { register, login };
