const router = require('express').Router();
const { verifyToken, requireAuth, requireAdmin } = require('../middleware/auth');
const { validateAddToCart } = require('../middleware/validate');
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cartController');

router.use(verifyToken, requireAuth);
router.get('/',       getCart);
router.post('/',      validateAddToCart, addToCart);
router.put('/:id',    updateCartItem);
router.delete('/:id', removeCartItem);
router.delete('/',    clearCart);

module.exports = router;
