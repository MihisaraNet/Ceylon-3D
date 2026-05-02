/**
 * auth.js — Authentication & Authorization Middleware
 *
 * Provides three Express middleware functions for securing API routes:
 *
 *   1. verifyToken  — Extracts and verifies the JWT from the Authorization header.
 *                     If valid, attaches the full user document (minus password) to `req.user`.
 *                     If invalid or missing, `req.user` remains undefined (does NOT block the request).
 *
 *   2. requireAuth  — Blocks the request with 401 if `req.user` is not set.
 *                     Must be used AFTER `verifyToken` in the middleware chain.
 *
 *   3. requireAdmin — Blocks the request with 403 if the user does not have 'ROLE_ADMIN'.
 *                     Must be used AFTER `verifyToken` in the middleware chain.
 *
 * Usage in routes:
 *   router.get('/protected', verifyToken, requireAuth, handler);
 *   router.get('/admin-only', verifyToken, requireAdmin, handler);
 *
 * @module middleware/auth
 * @requires jsonwebtoken
 * @requires ../models/User
 */

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify the JWT token from the Authorization header.
 * Sets req.user to the authenticated user document if the token is valid.
 * Always calls next() — does not block unauthenticated requests on its own.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // Decode the token and look up the user in the database
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'change-me');
      req.user = await User.findById(decoded.id).select('-password');
    } catch { /* invalid token — req.user remains undefined */ }
  }
  next();
};

/**
 * Require the request to be authenticated (req.user must be set).
 * Returns 401 if no valid token was provided.
 */
const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
};

/**
 * Require the authenticated user to have the ROLE_ADMIN role.
 * Returns 403 if the user is not an admin.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.roles.includes('ROLE_ADMIN'))
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

module.exports = { verifyToken, requireAuth, requireAdmin };
