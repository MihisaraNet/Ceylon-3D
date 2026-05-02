const path     = require('path');
const fs       = require('fs');
const Product  = require('../models/Product');
const CartItem = require('../models/CartItem');
const Order    = require('../models/Order');

const listProducts = async (req, res) => {
  try { res.json(await Product.find().sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

const getProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, photoUrl } = req.body;
    if (!name || price == null) return res.status(400).json({ error: 'name and price required' });
    const imagePath = req.file ? `/api/products/images/${req.file.filename}` : (photoUrl || null);
    const p = await Product.create({ name, description: description||'', price: Number(price), stock: Number(stock||0), imagePath, category: category||'custom' });
    res.status(201).json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    const { name, description, price, stock, category, photoUrl } = req.body;
    if (name)           p.name        = name;
    if (description != null) p.description = description;
    if (price != null)  p.price       = Number(price);
    if (stock != null)  p.stock       = Number(stock);
    if (category)       p.category    = category;
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

const deleteProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    await CartItem.deleteMany({ productId: p._id });
    await Order.updateMany({ 'items.productId': p._id }, { $set: { 'items.$[e].productId': null } }, { arrayFilters: [{ 'e.productId': p._id }] });
    if (p.imagePath?.startsWith('/api/products/images/')) {
      const f = path.join(__dirname,'../../uploads/product-images', path.basename(p.imagePath));
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    await Product.findByIdAndDelete(p._id);
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
