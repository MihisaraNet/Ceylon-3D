/**
 * routes/cart.js — Shopping Cart Routes
 *
 * All cart routes require authentication (verifyToken + requireAuth applied globally).
 *
 * Endpoints:
 *   GET    /cart       — Retrieve the user's cart items
 *   POST   /cart       — Add a product to the cart (validated by validateAddToCart)
 *   PUT    /cart/:id   — Update quantity of a cart item
 *   DELETE /cart/:id   — Remove a single cart item
 *   DELETE /cart       — Clear the entire cart
 *
 * @module routes/cart
 */

const router = require('express').Router();
const { verifyToken, requireAuth, requireAdmin } = require('../middleware/auth');
const { validateAddToCart } = require('../middleware/validate');
const { uploadImage } = require('../middleware/upload');
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart, updateCartItemFile } = require('../controllers/cartController');

// Apply authentication to ALL cart routes
router.use(verifyToken, requireAuth);

router.get('/',            getCart);                                                     // List cart items
router.post('/',           uploadImage.single('customFile'), validateAddToCart, addToCart); // Add to cart (optional design file)
router.put('/:id',         updateCartItem);                   // Update item quantity
router.put('/:id/file',    uploadImage.single('customFile'), updateCartItemFile);          // Attach / remove design file
router.delete('/:id',      removeCartItem);                   // Remove single item
router.delete('/',         clearCart);                         // Clear entire cart

module.exports = router;
