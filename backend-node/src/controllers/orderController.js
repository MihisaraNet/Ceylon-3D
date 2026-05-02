/**
 * orderController.js — Shop Order Controller
 *
 * Handles creation and management of shop orders.
 *
 * Endpoints:
 *   POST /orders                    → Place a new order
 *   GET  /orders                    → Get current user's orders
 *   GET  /orders/admin              → Get ALL orders (admin)
 *   PUT  /orders/admin/:id/status   → Update order status (admin)
 *   PUT  /orders/admin/:id/tracking → Set tracking number (admin)
 *
 * @module controllers/orderController
 * @requires ../models/Order
 */

const Order = require('../models/Order');

/**
 * Place a new shop order. Computes totalAmount server-side.
 * Expects req.body: { shippingAddress, items: [{ productName, unitPrice|price, quantity }] }
 */
const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, items } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'items required' });
    const orderItems = items.map(i => ({ productId: i.productId||null, productName: i.productName, price: Number(i.unitPrice||i.price), quantity: Number(i.quantity) }));
    const totalAmount = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const order = await Order.create({ userId: req.user._id, items: orderItems, totalAmount, shippingAddress: shippingAddress||'', category: 'SHOP' });
    res.status(201).json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/** Get the authenticated user's orders, newest first. */
const getMyOrders  = async (req, res) => {
  try { res.json(await Order.find({ userId: req.user._id }).sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

/** Get ALL orders (admin). Populates user info. */
const getAllOrders  = async (req, res) => {
  try { res.json(await Order.find().populate('userId','fullName email').sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

/** Update order status (admin). Body: { status } */
const updateOrderStatus = async (req, res) => {
  try {
    const o = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!o) return res.status(404).json({ error: 'Order not found' });
    res.json(o);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/** Set tracking number (admin). Body: { trackingNumber } */
const updateTracking = async (req, res) => {
  try {
    const o = await Order.findByIdAndUpdate(req.params.id, { trackingNumber: req.body.trackingNumber }, { new: true });
    if (!o) return res.status(404).json({ error: 'Order not found' });
    res.json(o);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { placeOrder, getMyOrders, getAllOrders, updateOrderStatus, updateTracking };
