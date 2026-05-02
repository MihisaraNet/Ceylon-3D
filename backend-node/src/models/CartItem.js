/**
 * CartItem.js — Cart Item Mongoose Model
 *
 * Represents a single item in a user's shopping cart.
 * Links a user (via userId) to a product (via productId) with a quantity.
 *
 * Fields:
 *   - userId    {ObjectId} — Reference to the User who owns this cart item (required).
 *   - productId {ObjectId} — Reference to the Product being added to cart (required).
 *   - quantity  {Number}   — Number of units (default: 1, minimum: 1).
 *
 * @module models/CartItem
 * @requires mongoose
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  // Reference to the User document who owns this cart item. Required to associate the item with a specific shopper.
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Reference to the Product document being added to the cart. Required to fetch product details (price, name).
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  
  // The number of units of this product the user wants to buy. Defaults to 1, cannot be less than 1.
  quantity:  { type: Number, default: 1, min: 1 },
});

module.exports = mongoose.model('CartItem', cartItemSchema);
