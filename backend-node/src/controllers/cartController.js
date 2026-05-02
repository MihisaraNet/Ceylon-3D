/**
 * cartController.js — Shopping Cart Controller
 *
 * Manages the authenticated user's shopping cart backed by MongoDB.
 * Each cart item links a user to a product with a quantity.
 *
 * Endpoints served (via routes/cart.js):
 *   GET    /cart       → Retrieve all items in the current user's cart
 *   POST   /cart       → Add a product to the cart (or increase quantity if it already exists)
 *   PUT    /cart/:id   → Update the quantity of a specific cart item
 *   DELETE /cart/:id   → Remove a single item from the cart
 *   DELETE /cart       → Clear all items from the cart
 *
 * Key behaviours:
 *   - Items whose referenced product has been deleted are silently filtered out.
 *   - Stock is validated: users cannot add more units than available stock.
 *   - Maximum quantity per item is capped at 99.
 *   - The add-to-cart endpoint performs an "upsert": if the product is already
 *     in the cart, its quantity is incremented rather than creating a duplicate.
 *
 * @module controllers/cartController
 * @requires ../models/CartItem
 * @requires ../models/Product
 */

const path    = require('path');
const fs      = require('fs');
const CartItem = require('../models/CartItem');
const Product  = require('../models/Product');

const deleteLocalDesignFile = (customFileUrl) => {
  if (!customFileUrl?.startsWith('/api/products/images/')) return;
  const filePath = path.join(__dirname, '../../uploads/product-images', path.basename(customFileUrl));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};
/* ── GET /cart ────────────────────────────────────────────── */
/**
 * Retrieve the authenticated user's cart.
 *
 * Populates product details (name, price, image, stock) and formats
 * each item for the frontend. Orphaned items (whose product was deleted)
 * are excluded from the response.
 *
 * @param {import('express').Request}  req - Express request (req.user set by auth middleware).
 * @param {import('express').Response} res - Express response.
 */
const getCart = async (req, res) => {
  try {
    // Fetch all cart items for this user, populating the related product document
    const items = await CartItem.find({ userId: req.user._id }).populate('productId');
    res.json(
      items
        .filter(i => i.productId) // Skip orphans whose product was deleted
        .map(i => ({
          cartItemId:    i._id,            // Cart item's own ID (used for update/delete)
          id:            i.productId._id,  // Product ID
          title:         i.productId.name, // Product display name
          price:         i.productId.price,
          image:         i.productId.imagePath,
          seller:        'LayerForge 3D',        // Hardcoded seller name
          quantity:      i.quantity,
          stock:         i.productId.stock,
          customFileUrl: i.customFileUrl || null, // Optional attached design file
        }))
    );
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/* ── POST /cart ───────────────────────────────────────────── */
/**
 * Add a product to the cart, or increase its quantity if already present (upsert).
 *
 * Request body:
 *   { productId: string, quantity?: number (default 1) }
 *
 * Validation:
 *   - `productId` is required.
 *   - `quantity` must be a positive integer ≤ 99.
 *   - The product must exist in the database.
 *   - The total quantity (existing + new) must not exceed available stock.
 *
 * @param {import('express').Request}  req - Express request.
 * @param {import('express').Response} res - Express response.
 */
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Number(quantity);

    // ── Input validation ─────────────────────────────────
    if (!productId)      return res.status(400).json({ error: 'productId is required' });
    if (!Number.isInteger(qty) || qty < 1)
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    if (qty > 99)
      return res.status(400).json({ error: 'Maximum quantity per item is 99' });

    // Verify the product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // ── Stock availability check ─────────────────────────
    const existingItem = await CartItem.findOne({ userId: req.user._id, productId });
    const currentQty   = existingItem ? existingItem.quantity : 0;
    const newTotal     = currentQty + qty;

    // Only enforce stock limits if the product has a defined stock value
    if (product.stock !== null && product.stock !== undefined && product.stock >= 0) {
      if (product.stock === 0)
        return res.status(400).json({ error: `"${product.name}" is out of stock` });
      if (newTotal > product.stock)
        return res.status(400).json({
          error: `Only ${product.stock} unit(s) available. You already have ${currentQty} in your cart.`,
        });
    }

    // If a custom design/reference file was uploaded, store its path
    const customFileUrl = req.file
      ? `/api/products/images/${req.file.filename}`  // reuse image serving route
      : null;
    // ── Upsert: update existing or create new cart item ──
    if (existingItem) {
      existingItem.quantity = newTotal;
      // Update customFileUrl only if a new file was uploaded
      if (customFileUrl) {
        deleteLocalDesignFile(existingItem.customFileUrl);
        existingItem.customFileUrl = customFileUrl;
      }
      await existingItem.save();
      return res.json(existingItem);
    }
    const item = await CartItem.create({ userId: req.user._id, productId, quantity: qty, customFileUrl });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/* ── PUT /cart/:id ────────────────────────────────────────── */
/**
 * Update the quantity of a specific cart item.
 *
 * URL params:
 *   :id — The CartItem document ID.
 *
 * Request body:
 *   { quantity: number }
 *
 * Validation:
 *   - The cart item must belong to the authenticated user.
 *   - Quantity must be a positive integer ≤ 99.
 *   - Quantity must not exceed available product stock.
 *
 * @param {import('express').Request}  req - Express request.
 * @param {import('express').Response} res - Express response.
 */
const updateCartItem = async (req, res) => {
  try {
    // Find the cart item, ensuring it belongs to the current user
    const item = await CartItem.findOne({ _id: req.params.id, userId: req.user._id }).populate('productId');
    if (!item) return res.status(404).json({ error: 'Cart item not found' });

    const qty = Number(req.body.quantity);
    if (!Number.isInteger(qty) || qty < 1)
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    if (qty > 99)
      return res.status(400).json({ error: 'Maximum quantity per item is 99' });

    // Enforce stock limits on the populated product
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

/* ── DELETE /cart/:id ─────────────────────────────────────── */
/**
 * Remove a single item from the user's cart.
 *
 * URL params:
 *   :id — The CartItem document ID.
 *
 * @param {import('express').Request}  req - Express request.
 * @param {import('express').Response} res - Express response.
 */
const removeCartItem = async (req, res) => {
  try {
    const deleted = await CartItem.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ error: 'Cart item not found' });
    deleteLocalDesignFile(deleted.customFileUrl);
    res.json({ message: 'Item removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/* ── DELETE /cart ──────────────────────────────────────────── */
/**
 * Clear all items from the authenticated user's cart.
 *
 * @param {import('express').Request}  req - Express request.
 * @param {import('express').Response} res - Express response.
 */
const clearCart = async (req, res) => {
  try {
    const existingItems = await CartItem.find({ userId: req.user._id }, { customFileUrl: 1 });
    for (const item of existingItems) deleteLocalDesignFile(item.customFileUrl);
    await CartItem.deleteMany({ userId: req.user._id });
    res.json({ message: 'Cart cleared' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/* ── PUT /cart/:id/file ─────────────────────────────────── */
/**
 * Attach or remove a custom design / personalisation image for an existing cart item.
 *
 * - If req.file is present: saves the new file, deletes the old one from disk.
 * - If req.body.removeFile === 'true': clears customFileUrl and deletes the file from disk.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const updateCartItemFile = async (req, res) => {
  try {
    const item = await CartItem.findOne({ _id: req.params.id, userId: req.user._id });
    if (!item) return res.status(404).json({ error: 'Cart item not found' });

    if (req.body.removeFile === 'true' || req.body.removeFile === true) {
      // Remove the existing design file
      deleteLocalDesignFile(item.customFileUrl);
      item.customFileUrl = null;
    } else if (req.file) {
      // Replace with newly uploaded file
      deleteLocalDesignFile(item.customFileUrl);
      item.customFileUrl = `/api/products/images/${req.file.filename}`;
    } else {
      return res.status(400).json({ error: 'No file uploaded and removeFile not set' });
    }

    await item.save();
    res.json({ message: 'Design file updated', customFileUrl: item.customFileUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart, updateCartItemFile };
