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
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, required: true },
  price:       { type: Number, required: true },
  quantity:    { type: Number, required: true, min: 1 },
}, { _id: false }); // No separate _id for sub-documents

const orderSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:           { type: [orderItemSchema], default: [] },
  totalAmount:     { type: Number, required: true },
  category:        { type: String, enum: ['SHOP','STL'], default: 'SHOP' },
  status:          { type: String, enum: ['PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED'], default: 'PENDING' },
  shippingAddress: { type: String, default: '' },
  trackingNumber:  { type: String, default: null },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

module.exports = mongoose.model('Order', orderSchema);
