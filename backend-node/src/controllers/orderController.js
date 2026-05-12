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

const Order    = require('../models/Order');
const StlOrder = require('../models/StlOrder');

/**
 * Place a new shop order. Computes totalAmount server-side.
 * Expects req.body: { shippingAddress, items: [{ productName, unitPrice|price, quantity }] }
 */
const placeOrder = async (req, res) => {
  try {
    // Extract shipping address and items array from the incoming request body
    const { shippingAddress, items } = req.body;

    // Diagnostic logging to help track down order placement issues
    console.log(`[Order] Placing order for user ${req.user._id}. Items: ${items?.length}, HasReceipt: ${!!req.file}`);
    
    // Validate that the order contains at least one item
    if (!items?.length) return res.status(400).json({ error: 'items required' });
    
    // Sanitize and format each item in the order
    // Ensures prices and quantities are treated as numbers, and missing product IDs are set to null
    const orderItems = items.map(i => ({ 
      productId: i.productId || null, 
      productName: i.productName, 
      price: Number(i.unitPrice || i.price), 
      quantity: Number(i.quantity) 
    }));
    
    // Calculate the total cost of the order securely on the server side
    const totalAmount = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    
    // Construct the URL for the uploaded receipt if present
    let receiptUrl = null;
    if (req.file) {
      receiptUrl = `/uploads/product-images/${req.file.filename}`;
    }

    // Create and save the new order document in the database
    // Links the order to the currently authenticated user (req.user._id)
    const order = await Order.create({ 
      userId: req.user._id, 
      items: orderItems, 
      totalAmount, 
      category: 'SHOP', 
      status: 'PENDING',
      shippingAddress: shippingAddress || '', 
      receiptUrl
    });
    
    // Respond with a 201 Created status and the new order data
    res.status(201).json(order);
  } catch (err) { 
    // Catch any unexpected errors and return a 500 Internal Server Error
    res.status(500).json({ error: err.message }); 
  }
};

/** Get the authenticated user's orders, newest first. */
const getMyOrders  = async (req, res) => {
  try { 
    // Find all orders matching the logged-in user's ID, sorted descending by creation date
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

/** Get ALL orders (admin). Populates user info. */
const getAllOrders  = async (req, res) => {
  try { 
    // Fetch every order in the system, sorting newest first
    // Use .populate() to join the user data (fullName and email) based on the userId reference
    const orders = await Order.find().populate('userId', 'fullName email').sort({ createdAt: -1 });
    res.json(orders); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

/** Update order status (admin). Body: { status } */
const updateOrderStatus = async (req, res) => {
  try {
    // Attempt to update the status of the order matching the provided ID
    // { new: true } ensures the updated document is returned rather than the original
    const o = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    
    // If no order is found with that ID, return a 404 Not Found error
    if (!o) return res.status(404).json({ error: 'Order not found' });
    
    // Respond with the newly updated order
    res.json(o);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

/** Set tracking number (admin). Body: { trackingNumber } */
const updateTracking = async (req, res) => {
  try {
    // Attempt to update the tracking number for the specified order
    const o = await Order.findByIdAndUpdate(req.params.id, { trackingNumber: req.body.trackingNumber }, { new: true });
    
    if (!o) return res.status(404).json({ error: 'Order not found' });
    
    res.json(o);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

/**
 * GET /orders/admin/analytics — Dashboard analytics for admin.
 *
 * Returns:
 *   - monthlyRevenue: Array of { month, revenue } for the last 6 months (shop orders only)
 *   - bestSellingProducts: Top-5 products by units sold
 *   - activePrintJobs: Count of STL orders currently in PRINTING state
 */
const getAdminAnalytics = async (req, res) => {
  try {
    // ── 1. Monthly revenue for the last 6 months ────────────────────────────
    // Calculate the start of the 6-month window (beginning of the month, 5 months ago)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const revenueAgg = await Order.aggregate([
      // Only consider orders placed in the last 6 months that were not cancelled
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'CANCELLED' } } },
      {
        $group: {
          // Group by year + month to get a monthly bucket
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
        },
      },
      // Sort ascending by date so charts render left-to-right chronologically
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Build a full 6-month array, filling in 0 for months with no orders
    const monthlyRevenue = [];
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const found = revenueAgg.find(
        r => r._id.year === d.getFullYear() && r._id.month === (d.getMonth() + 1)
      );
      monthlyRevenue.push({
        month:   monthNames[d.getMonth()],
        revenue: found ? Math.round(found.revenue) : 0,
      });
    }

    // ── 2. Best-selling products (top 5 by total units sold) ───────────────
    const bestSellingAgg = await Order.aggregate([
      // Ignore cancelled orders
      { $match: { status: { $ne: 'CANCELLED' } } },
      // Unwind items array so each item becomes its own document
      { $unwind: '$items' },
      {
        $group: {
          _id:         '$items.productName',
          totalSold:   { $sum: '$items.quantity' },
          totalRevenue:{ $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name:    '$_id',
          sold:    '$totalSold',
          revenue: { $round: ['$totalRevenue', 0] },
        },
      },
    ]);

    // ── 3. Active 3D print jobs ─────────────────────────────────────────────
    // Count STL orders currently in an active processing state
    const activePrintJobs = await StlOrder.countDocuments({
      status: { $in: ['CONFIRMED', 'PRINTING', 'READY'] },
    });

    res.json({
      monthlyRevenue,
      bestSellingProducts: bestSellingAgg,
      activePrintJobs,
    });
  } catch (err) {
    console.error('[Analytics]', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { placeOrder, getMyOrders, getAllOrders, updateOrderStatus, updateTracking, getAdminAnalytics };
