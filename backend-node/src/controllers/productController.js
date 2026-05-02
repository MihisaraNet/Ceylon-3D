/**
 * productController.js — Product CRUD Controller
 *
 * Manages the product catalogue for the Ceylon3D shop.
 *
 * Endpoints (via routes/products.js):
 *   GET    /api/products      → List all products
 *   GET    /api/products/:id  → Get a single product
 *   POST   /api/products      → Create a new product (admin, supports image upload)
 *   PUT    /api/products/:id  → Update a product (admin, supports image upload)
 *   DELETE /api/products/:id  → Delete a product (admin, cleans up cart/orders/files)
 *
 * @module controllers/productController
 * @requires path
 * @requires fs
 * @requires ../models/Product
 * @requires ../models/CartItem
 * @requires ../models/Order
 */

const path     = require('path');
const fs       = require('fs');
const Product  = require('../models/Product');
const CartItem = require('../models/CartItem');
const Order    = require('../models/Order');

/** List all products, newest first. */
const listProducts = async (req, res) => {
  try { res.json(await Product.find().sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

/** Get a single product by ID. Returns 404 if not found. */
const getProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * Create a new product (admin only).
 * Accepts multipart/form-data with an optional `image` file field.
 * Body fields: name, description, price, stock, category, photoUrl.
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, photoUrl } = req.body;
    if (!name || price == null) return res.status(400).json({ error: 'name and price required' });

    // Use uploaded file path if present, otherwise use the provided photoUrl
    const imagePath = req.file ? `/api/products/images/${req.file.filename}` : (photoUrl || null);

    const p = await Product.create({ name, description: description||'', price: Number(price), stock: Number(stock||0), imagePath, category: category||'custom' });
    res.status(201).json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * Update an existing product (admin only).
 * If a new image is uploaded, the old image file is deleted from disk.
 */
const updateProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    const { name, description, price, stock, category, photoUrl } = req.body;

    // Update only the fields that are provided
    if (name)           p.name        = name;
    if (description != null) p.description = description;
    if (price != null)  p.price       = Number(price);
    if (stock != null)  p.stock       = Number(stock);
    if (category)       p.category    = category;

    // Handle image replacement: delete old file if a new one is uploaded
    if (req.file) {
      if (p.imagePath?.startsWith('/api/products/images/')) {
        const old = path.join(__dirname,'../../uploads/product-images', path.basename(p.imagePath));
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      p.imagePath = `/api/products/images/${req.file.filename}`;
    } else if (photoUrl) { p.imagePath = photoUrl; }
    await p.save();
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * Delete a product (admin only).
 * Also removes related cart items, nullifies product references in orders,
 * and deletes the associated image file from disk.
 */
const deleteProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });

    // Remove all cart items referencing this product
    await CartItem.deleteMany({ productId: p._id });

    // Nullify product references in existing orders (preserves order history)
    await Order.updateMany({ 'items.productId': p._id }, { $set: { 'items.$[e].productId': null } }, { arrayFilters: [{ 'e.productId': p._id }] });

    // Delete the image file from disk if it was locally stored
    if (p.imagePath?.startsWith('/api/products/images/')) {
      const f = path.join(__dirname,'../../uploads/product-images', path.basename(p.imagePath));
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    await Product.findByIdAndDelete(p._id);
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
