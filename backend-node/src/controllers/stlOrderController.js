/**
 * stlOrderController.js — STL / 3D Print Order Controller
 *
 * Manages the full lifecycle of 3D print orders:
 *   1. Customer uploads an STL file with contact details → order created as PENDING_QUOTE
 *   2. Admin reviews, sets price/specs → status changes to QUOTED
 *   3. Customer confirms → CONFIRMED, and a corresponding shop Order is created
 *   4. Admin progresses through PRINTING → READY → DELIVERED
 *
 * Endpoints (via routes/stlOrders.js):
 *   POST /api/uploads/stl              → Upload STL file and submit order
 *   GET  /stl-orders/my                → Get current user's STL orders
 *   PUT  /stl-orders/my/:id            → Edit own pending order
 *   PUT  /stl-orders/my/:id/confirm    → Confirm a quoted order
 *   POST /stl-orders/calculate-cost    → Calculate printing cost breakdown
 *   GET  /stl-orders/admin             → Get all STL orders (admin)
 *   PUT  /stl-orders/admin/:id/status  → Update status (admin)
 *   PUT  /stl-orders/admin/:id/price   → Set price and specs (admin)
 *   GET  /stl-orders/admin/:id/download→ Download the STL file (admin)
 *   DELETE /stl-orders/admin/:id       → Delete order and file (admin)
 *
 * @module controllers/stlOrderController
 * @requires path
 * @requires fs
 * @requires ../models/StlOrder
 * @requires ../models/Order
 * @requires ../utils/pricing
 */

const path     = require('path');
const fs       = require('fs');
const StlOrder = require('../models/StlOrder');
const Order    = require('../models/Order');
const { calculateCost, estimateInitialPrice } = require('../utils/pricing');

/**
 * Upload an STL file and create a new 3D print order.
 * Uses multer for file handling. Estimates initial price based on file size.
 */
const uploadStl = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File required' });
    const { name, email, email2, phone, address, message, material, quantity } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });

    // Estimate an initial price based on file size, material, and quantity
    const estimatedPrice = estimateInitialPrice(req.file.size, material, quantity);

    const o = await StlOrder.create({
      customerName: name, customerEmail: email, customerEmail2: email2||null,
      phone: phone||null, address: address||'', fileName: req.file.filename,
      fileSizeBytes: req.file.size, material: (material||'PLA').toUpperCase(),
      quantity: Number(quantity||1), estimatedPrice, note: message||null,
      userId: req.user?._id||null, status: 'PENDING_QUOTE',
    });
    res.status(201).json({ message:'STL order submitted', fileName:o.fileName, name, email, phone, material:o.material, quantity:o.quantity, estimatedPrice, stlOrderId:o._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/** Get the authenticated user's STL orders (matches by userId OR email). */
const getMyStlOrders = async (req, res) => {
  try {
    res.json(await StlOrder.find({ $or:[{userId:req.user._id},{customerEmail:req.user.email}] }).sort({createdAt:-1}));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/** Edit own STL order (only allowed while status is PENDING_QUOTE). */
const updateMyStlOrder = async (req, res) => {
  try {
    const o = await StlOrder.findById(req.params.id);
    if (!o) return res.status(404).json({ error: 'Order not found' });
    // Verify ownership by userId or email
    const own = (o.userId?.toString()===req.user._id.toString()) || o.customerEmail===req.user.email;
    if (!own) return res.status(403).json({ error: 'Forbidden' });
    if (o.status!=='PENDING_QUOTE') return res.status(400).json({ error: 'Can only edit PENDING_QUOTE orders' });
    const { material, quantity, note } = req.body;
    if (material) o.material = material.toUpperCase();
    if (quantity) o.quantity = Number(quantity);
    if (note!=null) o.note = note;
    await o.save();
    res.json(o);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * Confirm a QUOTED STL order.
 * Changes status to CONFIRMED and creates a corresponding shop Order
 * so it appears in the user's order history.
 */
const confirmStlOrder = async (req, res) => {
  try {
    const o = await StlOrder.findById(req.params.id);
    if (!o) return res.status(404).json({ error: 'Order not found' });
    const own = (o.userId?.toString()===req.user._id.toString()) || o.customerEmail===req.user.email;
    if (!own) return res.status(403).json({ error: 'Forbidden' });
    if (o.status!=='QUOTED') return res.status(400).json({ error: 'Can only confirm QUOTED orders' });
    o.status = 'CONFIRMED';
    await o.save();

    // Create a shop Order record for unified order tracking
    const namePart = o.fileName.replace(/^[0-9a-f-]+-/i,'') || o.fileName;
    await Order.create({ userId:req.user._id, items:[{productName:`3D Print: ${namePart} (${o.material})`, price:o.estimatedPrice, quantity:o.quantity}], totalAmount:o.estimatedPrice, category:'STL', status:'PENDING' });
    res.json(o);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/** Get all STL orders (admin only), newest first. */
const getAllStlOrders = async (req, res) => {
  try { res.json(await StlOrder.find().sort({createdAt:-1})); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

/** Update the status of an STL order (admin only). */
const updateStlStatus = async (req, res) => {
  try {
    const o = await StlOrder.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true});
    if (!o) return res.status(404).json({ error: 'Order not found' });
    res.json(o);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * Set the price and print specifications for an STL order (admin only).
 * Automatically transitions PENDING_QUOTE → QUOTED when price is set.
 */
const setStlPrice = async (req, res) => {
  try {
    const o = await StlOrder.findById(req.params.id);
    if (!o) return res.status(404).json({ error: 'Order not found' });
    const { estimatedPrice, printTimeHours, printTimeMinutes, weightGrams, supportStructures, material } = req.body;
    if (estimatedPrice!=null)   o.estimatedPrice   = Number(estimatedPrice);
    if (printTimeHours!=null)   o.printTimeHours   = Number(printTimeHours);
    if (printTimeMinutes!=null) o.printTimeMinutes = Number(printTimeMinutes);
    if (weightGrams!=null)      o.weightGrams      = Number(weightGrams);
    if (supportStructures!=null)o.supportStructures= Boolean(supportStructures);
    if (material)               o.material         = material.toUpperCase();
    // Auto-transition to QUOTED when admin sets pricing
    if (o.status==='PENDING_QUOTE') o.status = 'QUOTED';
    await o.save();
    res.json(o);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/** Download the uploaded STL file for a given order (admin only). */
const downloadStlFile = async (req, res) => {
  try {
    const o = await StlOrder.findById(req.params.id);
    if (!o) return res.status(404).json({ error: 'Order not found' });
    const fp = path.join(__dirname,'../../uploads/stl-files',o.fileName);
    if (!fs.existsSync(fp)) return res.status(404).json({ error: 'File not found' });
    res.download(fp, o.fileName);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/** Delete an STL order and its uploaded file from disk (admin only). */
const deleteStlOrder = async (req, res) => {
  try {
    const o = await StlOrder.findById(req.params.id);
    if (!o) return res.status(404).json({ error: 'Order not found' });
    const fp = path.join(__dirname,'../../uploads/stl-files',o.fileName);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    await StlOrder.findByIdAndDelete(req.params.id);
    res.json({ message: 'STL order deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/** Calculate cost breakdown endpoint using the pricing utility. */
const calculateCostEndpoint = async (req, res) => {
  try {
    const { printTimeHours, printTimeMinutes, weightGrams, material, supportStructures } = req.body;
    res.json(calculateCost({ printTimeHours, printTimeMinutes, weightGrams, material, supportStructures }));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { uploadStl, getMyStlOrders, updateMyStlOrder, confirmStlOrder, getAllStlOrders, updateStlStatus, setStlPrice, downloadStlFile, deleteStlOrder, calculateCostEndpoint };
