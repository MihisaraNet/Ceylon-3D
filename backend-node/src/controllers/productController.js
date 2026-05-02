/**
 * productController.js — Product CRUD Controller
 *
 * Manages the product catalogue for the LayerForge 3D shop.
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
  try { 
    // Fetch all products from the database, sorting them by creation date descending
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

/** Get a single product by ID. Returns 404 if not found. */
const getProduct = async (req, res) => {
  try {
    // Attempt to find the specific product using the ID from the URL parameters
    const p = await Product.findById(req.params.id);
    
    // If the product doesn't exist in the database, return a 404 Not Found response
    if (!p) return res.status(404).json({ error: 'Product not found' });
    
    res.json(p);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

/**
 * Create a new product (admin only).
 * Accepts multipart/form-data with an optional `image` file field.
 * Body fields: name, description, price, stock, category, photoUrl.
 */
const createProduct = async (req, res) => {
  try {
    // Extract product details from the request body
    const { name, description, price, stock, category, photoUrl } = req.body;
    
    // Validate required fields: name and price must be provided
    if (!name || price == null) {
      return res.status(400).json({ error: 'name and price required' });
    }

    // Determine the image path: 
    // If a file was uploaded via multer (req.file), construct the local URL path.
    // Otherwise, fall back to the provided photoUrl string, or set to null if neither exists.
    const imagePath = req.file ? `/api/products/images/${req.file.filename}` : (photoUrl || null);

    // Create the new product in the database. 
    // Convert price and stock to Numbers, and set defaults for optional fields.
    const p = await Product.create({ 
      name, 
      description: description || '', 
      price: Number(price), 
      stock: Number(stock || 0), 
      imagePath, 
      category: category || 'custom' 
    });
    
    res.status(201).json(p);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

/**
 * Update an existing product (admin only).
 * If a new image is uploaded, the old image file is deleted from disk.
 */
const updateProduct = async (req, res) => {
  try {
    // Find the existing product to update
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    
    // Extract potentially updated fields from the request body
    const { name, description, price, stock, category, photoUrl } = req.body;

    // Update only the fields that are explicitly provided in the request
    if (name)           p.name        = name;
    if (description != null) p.description = description; // Allow empty strings for description
    if (price != null)  p.price       = Number(price);
    if (stock != null)  p.stock       = Number(stock);
    if (category)       p.category    = category;

    // Handle image replacement logic
    if (req.file) {
      // If a new file is uploaded and the old image was locally stored, delete the old file to save space
      if (p.imagePath?.startsWith('/api/products/images/')) {
        const old = path.join(__dirname, '../../uploads/product-images', path.basename(p.imagePath));
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      // Set the new local image path
      p.imagePath = `/api/products/images/${req.file.filename}`;
    } else if (photoUrl) { 
      // If no file was uploaded but a new photoUrl was provided, use that
      p.imagePath = photoUrl; 
    }
    
    // Save the updated document to the database
    await p.save();
    res.json(p);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

/**
 * Delete a product (admin only).
 * Also removes related cart items, nullifies product references in orders,
 * and deletes the associated image file from disk.
 */
const deleteProduct = async (req, res) => {
  try {
    // Find the product to ensure it exists before attempting deletion
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Product not found' });

    // Cascade deletion: Remove all cart items referencing this product so users don't have broken carts
    await CartItem.deleteMany({ productId: p._id });

    // Nullify product references in existing orders
    // This preserves the order history (the user still sees what they bought and the price), 
    // but breaks the hard link to the deleted product document.
    await Order.updateMany(
      { 'items.productId': p._id }, 
      { $set: { 'items.$[e].productId': null } }, 
      { arrayFilters: [{ 'e.productId': p._id }] }
    );

    // Delete the associated image file from the disk if it was locally stored
    if (p.imagePath?.startsWith('/api/products/images/')) {
      const f = path.join(__dirname, '../../uploads/product-images', path.basename(p.imagePath));
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    
    // Finally, remove the product document from the database
    await Product.findByIdAndDelete(p._id);
    res.json({ message: 'Product deleted' });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
