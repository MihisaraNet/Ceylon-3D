const CartItem = require('../models/CartItem');
const Product  = require('../models/Product');

/* ── GET /cart ─────────────────────────────────────────── */
const getCart = async (req, res) => {
  try {
    const items = await CartItem.find({ userId: req.user._id }).populate('productId');
    res.json(
      items
        .filter(i => i.productId) // skip orphans whose product was deleted
        .map(i => ({
          cartItemId: i._id,
          id:         i.productId._id,
          title:      i.productId.name,
          price:      i.productId.price,
          image:      i.productId.imagePath,
          seller:     'Ceylon3D',
          quantity:   i.quantity,
          stock:      i.productId.stock,
        }))
    );
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/* ── POST /cart ────────────────────────────────────────── */
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Number(quantity);

    // ── Validation ──────────────────────────────────────
    if (!productId)      return res.status(400).json({ error: 'productId is required' });
    if (!Number.isInteger(qty) || qty < 1)
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    if (qty > 99)
      return res.status(400).json({ error: 'Maximum quantity per item is 99' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // ── Stock check ─────────────────────────────────────
    const existingItem = await CartItem.findOne({ userId: req.user._id, productId });
    const currentQty   = existingItem ? existingItem.quantity : 0;
    const newTotal     = currentQty + qty;

    if (product.stock !== null && product.stock !== undefined && product.stock >= 0) {
      if (product.stock === 0)
        return res.status(400).json({ error: `"${product.name}" is out of stock` });
      if (newTotal > product.stock)
        return res.status(400).json({
          error: `Only ${product.stock} unit(s) available. You already have ${currentQty} in your cart.`,
        });
    }

    // ── Upsert ──────────────────────────────────────────
    if (existingItem) {
      existingItem.quantity = newTotal;
      await existingItem.save();
      return res.json(existingItem);
    }
    const item = await CartItem.create({ userId: req.user._id, productId, quantity: qty });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/* ── PUT /cart/:id ─────────────────────────────────────── */
const updateCartItem = async (req, res) => {
  try {
    const item = await CartItem.findOne({ _id: req.params.id, userId: req.user._id }).populate('productId');
    if (!item) return res.status(404).json({ error: 'Cart item not found' });

    const qty = Number(req.body.quantity);
    if (!Number.isInteger(qty) || qty < 1)
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    if (qty > 99)
      return res.status(400).json({ error: 'Maximum quantity per item is 99' });

    const product = item.productId;
    if (product && product.stock !== null && product.stock !== undefined && product.stock >= 0) {
      if (qty > product.stock)
        return res.status(400).json({ error: `Only ${product.stock} unit(s) available` });
    }

    item.quantity = qty;
    await item.save();
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/* ── DELETE /cart/:id ──────────────────────────────────── */
const removeCartItem = async (req, res) => {
  try {
    const deleted = await CartItem.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ error: 'Cart item not found' });
    res.json({ message: 'Item removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/* ── DELETE /cart ──────────────────────────────────────── */
const clearCart = async (req, res) => {
  try {
    await CartItem.deleteMany({ userId: req.user._id });
    res.json({ message: 'Cart cleared' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
