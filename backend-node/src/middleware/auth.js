const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'change-me');
      req.user = await User.findById(decoded.id).select('-password');
    } catch { /* invalid token */ }
  }
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.roles.includes('ROLE_ADMIN'))
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

module.exports = { verifyToken, requireAuth, requireAdmin };
