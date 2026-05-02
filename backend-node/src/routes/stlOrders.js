const router = require('express').Router();
const { verifyToken, requireAuth, requireAdmin } = require('../middleware/auth');
const { uploadStl: multerStl } = require('../middleware/upload');
const { validateStlOrder } = require('../middleware/validate');
const {
  uploadStl, getMyStlOrders, updateMyStlOrder, confirmStlOrder,
  getAllStlOrders, updateStlStatus, setStlPrice, downloadStlFile, deleteStlOrder,
  calculateCostEndpoint,
} = require('../controllers/stlOrderController');

// POST /api/uploads/stl  (mounted at /api/uploads AND /stl-orders)
router.post('/stl', verifyToken, multerStl.single('file'), validateStlOrder, uploadStl);

// My orders (auth)
router.get('/my',             verifyToken, requireAuth, getMyStlOrders);
router.put('/my/:id',         verifyToken, requireAuth, updateMyStlOrder);
router.put('/my/:id/confirm', verifyToken, requireAuth, confirmStlOrder);

// Cost calculator (auth)
router.post('/calculate-cost', verifyToken, requireAuth, calculateCostEndpoint);

// Admin
router.get('/admin',              verifyToken, requireAdmin, getAllStlOrders);
router.put('/admin/:id/status',   verifyToken, requireAdmin, updateStlStatus);
router.put('/admin/:id/price',    verifyToken, requireAdmin, setStlPrice);
router.get('/admin/:id/download', verifyToken, requireAdmin, downloadStlFile);
router.delete('/admin/:id',       verifyToken, requireAdmin, deleteStlOrder);

module.exports = router;
