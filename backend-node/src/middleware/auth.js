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
  // Extract the Authorization header from the incoming request
  const authHeader = req.headers.authorization;
  
  // Check if the header exists and follows the expected 'Bearer <token>' format
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // Extract the actual token string (skipping 'Bearer ')
      const token = authHeader.split(' ')[1];
      
      // Verify and decode the JWT using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
      
      // Look up the user in the database by the ID encoded in the token.
      // Exclude the password field for security using .select('-password').
      // Attach the resulting user document to the request object (req.user).
      req.user = await User.findById(decoded.id).select('-password');
    } catch { 
      // If the token is invalid, expired, or tampered with, an error is thrown.
      // We catch it silently here so that req.user remains undefined, 
      // allowing down-stream middleware (like requireAuth) to handle the rejection.
    }
  }
  
  // Proceed to the next middleware or route handler regardless of token validity
  next();
};

/**
 * Require the request to be authenticated (req.user must be set).
 * Returns 401 if no valid token was provided.
 */
const requireAuth = (req, res, next) => {
  // If verifyToken did not successfully set req.user, reject the request
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // User is authenticated, proceed
  next();
};

/**
 * Require the authenticated user to have the ROLE_ADMIN role.
 * Returns 403 if the user is not an admin.
 */
const requireAdmin = (req, res, next) => {
  // Reject the request if the user is not authenticated OR lacks the 'ROLE_ADMIN' string in their roles array
  if (!req.user || !req.user.roles.includes('ROLE_ADMIN')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  // User is an admin, proceed
  next();
};

module.exports = { verifyToken, requireAuth, requireAdmin };
