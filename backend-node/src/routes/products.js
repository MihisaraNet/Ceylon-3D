const router = require('express').Router();
const path   = require('path');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { validateProduct } = require('../middleware/validate');
const { listProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');

router.get('/', listProducts);
router.get('/images/:filename', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../uploads/product-images', req.params.filename));
});
router.get('/:id', getProduct);
router.post('/',     verifyToken, requireAdmin, uploadImage.single('image'), validateProduct, createProduct);
router.put('/:id',   verifyToken, requireAdmin, uploadImage.single('image'), validateProduct, updateProduct);
router.delete('/:id',verifyToken, requireAdmin, deleteProduct);

module.exports = router;
