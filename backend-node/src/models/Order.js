/**
 * Order.js — Order Mongoose Model
 *
 * Represents a completed shop order or a confirmed STL print order.
 *
 * Sub-schema — orderItemSchema (embedded array):
 *   - productId   {ObjectId|null} — Reference to Product (null if product was deleted or STL).
 *   - productName {String}        — Display name preserved even after product deletion.
 *   - price       {Number}        — Unit price at the time of purchase.
 *   - quantity    {Number}        — Number of units ordered (min: 1).
 *
 * Main schema — orderSchema:
 *   - userId          {ObjectId} — Reference to the User who placed the order (required).
 *   - items           {Array}    — Array of orderItemSchema sub-documents.
 *   - totalAmount     {Number}   — Total order value in LKR (computed server-side).
 *   - category        {String}   — 'SHOP' for catalogue orders, 'STL' for 3D print orders.
 *   - status          {String}   — Order lifecycle status (PENDING → PROCESSING → SHIPPED → DELIVERED | CANCELLED).
 *   - shippingAddress {String}   — Multi-line delivery address.
 *   - trackingNumber  {String}   — Courier tracking number (set by admin after shipping).
 *   - createdAt       {Date}     — Auto-generated timestamp.
 *
 * @module models/Order
 * @requires mongoose
 */

const mongoose = require('mongoose');

// Sub-document schema for individual line items within an order
const orderItemSchema = new mongoose.Schema({
  // Reference to the Product document. Can be null if the product is deleted or if it's a custom STL order.
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  
  // The display name of the product at the time of purchase. Preserved even if the original product is deleted.
  productName: { type: String, required: true },
  
  // The unit price of the product at the time of purchase.
  price:       { type: Number, required: true },
  
  // The number of units ordered. Must be at least 1.
  quantity:    { type: Number, required: true, min: 1 },
}, { _id: false }); // No separate _id for sub-documents to keep the array clean

const orderSchema = new mongoose.Schema({
  // Reference to the User who placed the order. Required.
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Array of orderItemSchema sub-documents representing the products purchased.
  items:           { type: [orderItemSchema], default: [] },
  
  // The calculated total cost of the order in LKR.
  totalAmount:     { type: Number, required: true },
  
  // Categorizes the order as either a standard shop purchase ('SHOP') or a custom 3D print request ('STL').
  category:        { type: String, enum: ['SHOP','STL'], default: 'SHOP' },
  
  // The current lifecycle state of the order. Defaults to 'PENDING'.
  status:          { type: String, enum: ['PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED'], default: 'PENDING' },
  
  // The full shipping address provided by the user during checkout.
  shippingAddress: { type: String, default: '' },
  
  // An optional tracking number set by the admin once the order is shipped.
  trackingNumber:  { type: String, default: null },
  
  // URL to the payment proof / receipt image uploaded by the user
  receiptUrl:      { type: String, default: null },
}, { 
  // Automatically track when the order was created. We do not need an updatedAt timestamp for orders.
  timestamps: { createdAt: 'createdAt', updatedAt: false } 
});

module.exports = mongoose.model('Order', orderSchema);
