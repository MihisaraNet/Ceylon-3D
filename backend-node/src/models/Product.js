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
  // The display name of the product. Required and whitespace-trimmed.
  name:        { type: String, required: true, trim: true },
  
  // Detailed information about the product. Defaults to an empty string if not provided.
  description: { type: String, default: '' },
  
  // The selling price of the product. Must be a non-negative number.
  price:       { type: Number, required: true, min: 0 },
  
  // Current available inventory for this product. Defaults to 0, cannot be negative.
  stock:       { type: Number, default: 0, min: 0 },
  
  // URL or file path pointing to the product's image. Null if no image is uploaded.
  imagePath:   { type: String, default: null },
  
  // Grouping category for the product (e.g., 'miniatures', 'custom'). Defaults to 'custom'.
  category:    { type: String, default: 'custom', trim: true },
}, { 
  // Automatically manage 'createdAt' and 'updatedAt' timestamps for each product document.
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } 
});

// Export the Mongoose model to interact with the 'products' collection in the database
module.exports = mongoose.model('Product', productSchema);
