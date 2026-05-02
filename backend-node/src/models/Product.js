/**
 * Product.js — Product Mongoose Model
 *
 * Represents a product in the Ceylon3D online shop catalogue.
 *
 * Fields:
 *   - name        {String} — Product display name (required, trimmed).
 *   - description {String} — Detailed product description (defaults to empty string).
 *   - price       {Number} — Unit price in LKR (required, minimum 0).
 *   - stock       {Number} — Available inventory count (default: 0, minimum 0).
 *   - imagePath   {String} — URL or relative path to the product image (null if none).
 *   - category    {String} — Product category slug (e.g., 'miniatures', 'custom'). Default: 'custom'.
 *   - createdAt   {Date}   — Auto-generated creation timestamp.
 *   - updatedAt   {Date}   — Auto-generated update timestamp.
 *
 * @module models/Product
 * @requires mongoose
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price:       { type: Number, required: true, min: 0 },
  stock:       { type: Number, default: 0, min: 0 },
  imagePath:   { type: String, default: null },
  category:    { type: String, default: 'custom', trim: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

module.exports = mongoose.model('Product', productSchema);
