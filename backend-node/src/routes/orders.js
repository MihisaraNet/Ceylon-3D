/**
 * routes/orders.js — Shop Order Routes
 *
 * Endpoints:
 *   POST /orders                    — Place a new order (auth, validated)
 *   GET  /orders                    — Get the current user's orders (auth)
 *   GET  /orders/admin              — Get ALL orders (admin only)
 *   PUT  /orders/admin/:id/status   — Update order status (admin only)
 *   PUT  /orders/admin/:id/tracking — Set tracking number (admin only)
 *
 * @module routes/orders
 */

const router = require('express').Router();
const { verifyToken, requireAuth, requireAdmin } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validate');
const { uploadImage } = require('../middleware/upload');
const { placeOrder, getMyOrders, getAllOrders, updateOrderStatus, updateTracking } = require('../controllers/orderController');

// User endpoints (require authentication)
router.post('/',                  verifyToken, requireAuth,  uploadImage.single('receipt'), validateOrder, placeOrder);   // Place order
router.get('/',                   verifyToken, requireAuth,  getMyOrders);                 // My orders

// Admin endpoints (require admin role)
router.get('/admin',              verifyToken, requireAdmin, getAllOrders);                 // All orders
router.put('/admin/:id/status',   verifyToken, requireAdmin, updateOrderStatus);           // Update status
router.put('/admin/:id/tracking', verifyToken, requireAdmin, updateTracking);              // Set tracking

module.exports = router;
