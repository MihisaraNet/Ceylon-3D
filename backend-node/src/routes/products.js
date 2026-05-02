/**
 * routes/products.js — Product Catalogue Routes
 *
 * Endpoints:
 *   GET    /api/products                     — List all products (public)
 *   GET    /api/products/images/:filename    — Serve a product image file (public)
 *   GET    /api/products/:id                 — Get a single product by ID (public)
 *   POST   /api/products                     — Create a new product (admin, image upload)
 *   PUT    /api/products/:id                 — Update a product (admin, image upload)
 *   DELETE /api/products/:id                 — Delete a product (admin)
 *
 * @module routes/products
 */

const router = require('express').Router();
const path   = require('path');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { validateProduct } = require('../middleware/validate');
const { listProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');

// Public routes — no authentication required
router.get('/', listProducts);                                                                 // List all products
router.get('/images/:filename', (req, res) => {                                                // Serve product image
  res.sendFile(path.resolve(__dirname, '../../uploads/product-images', req.params.filename));
});
router.get('/:id', getProduct);                                                                // Get single product

// Admin-only routes — require authentication + admin role
router.post('/',     verifyToken, requireAdmin, uploadImage.single('image'), validateProduct, createProduct);   // Create product
router.put('/:id',   verifyToken, requireAdmin, uploadImage.single('image'), validateProduct, updateProduct);   // Update product
router.delete('/:id',verifyToken, requireAdmin, deleteProduct);                                                // Delete product

module.exports = router;
