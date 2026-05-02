const router = require('express').Router();
const { verifyToken, requireAuth, requireAdmin } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validate');
const { placeOrder, getMyOrders, getAllOrders, updateOrderStatus, updateTracking } = require('../controllers/orderController');

router.post('/',                  verifyToken, requireAuth,  validateOrder, placeOrder);
router.get('/',                   verifyToken, requireAuth,  getMyOrders);
router.get('/admin',              verifyToken, requireAdmin, getAllOrders);
router.put('/admin/:id/status',   verifyToken, requireAdmin, updateOrderStatus);
router.put('/admin/:id/tracking', verifyToken, requireAdmin, updateTracking);

module.exports = router;
