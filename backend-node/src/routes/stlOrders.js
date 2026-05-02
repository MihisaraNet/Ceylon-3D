/**
 * routes/stlOrders.js — STL / 3D Print Order Routes
 *
 * This router is mounted at BOTH `/api/uploads` and `/stl-orders` in server.js,
 * enabling the STL upload endpoint to be accessed at `/api/uploads/stl`.
 *
 * Endpoints:
 *   POST /stl                    — Upload STL file and submit a print order (auth, file upload, validated)
 *   GET  /my                     — Get the current user's STL orders (auth)
 *   PUT  /my/:id                 — Edit own pending STL order (auth)
 *   PUT  /my/:id/confirm         — Confirm a quoted STL order (auth)
 *   POST /calculate-cost         — Calculate printing cost breakdown (auth)
 *   GET  /admin                  — Get all STL orders (admin)
 *   PUT  /admin/:id/status       — Update STL order status (admin)
 *   PUT  /admin/:id/price        — Set price and print specs (admin)
 *   GET  /admin/:id/download     — Download the uploaded file (admin)
 *   DELETE /admin/:id            — Delete order and file (admin)
 *
 * @module routes/stlOrders
 */

const router = require('express').Router();
const { verifyToken, requireAuth, requireAdmin } = require('../middleware/auth');
const { uploadStl: multerStl } = require('../middleware/upload');
const { validateStlOrder } = require('../middleware/validate');
const {
  uploadStl, getMyStlOrders, updateMyStlOrder, confirmStlOrder,
  getAllStlOrders, updateStlStatus, setStlPrice, downloadStlFile, deleteStlOrder,
  calculateCostEndpoint,
} = require('../controllers/stlOrderController');

// File upload endpoint: POST /api/uploads/stl (mounted at /api/uploads AND /stl-orders)
router.post('/stl', verifyToken, multerStl.single('file'), validateStlOrder, uploadStl);

// User's own STL orders (require authentication)
router.get('/my',             verifyToken, requireAuth, getMyStlOrders);      // List my orders
router.put('/my/:id',         verifyToken, requireAuth, updateMyStlOrder);    // Edit pending order
router.put('/my/:id/confirm', verifyToken, requireAuth, confirmStlOrder);     // Confirm quoted order

// Cost calculator — optional STL file upload for auto weight/size estimation
router.post('/calculate-cost', verifyToken, requireAuth, multerStl.single('file'), calculateCostEndpoint);

// Admin endpoints (require admin role)
router.get('/admin',              verifyToken, requireAdmin, getAllStlOrders);   // List all STL orders
router.put('/admin/:id/status',   verifyToken, requireAdmin, updateStlStatus);  // Update status
router.put('/admin/:id/price',    verifyToken, requireAdmin, setStlPrice);      // Set price/specs
router.get('/admin/:id/download', verifyToken, requireAdmin, downloadStlFile);  // Download file
router.delete('/admin/:id',       verifyToken, requireAdmin, deleteStlOrder);   // Delete order

module.exports = router;
