const path     = require('path');
const fs       = require('fs');
const StlOrder = require('../models/StlOrder');
const Order    = require('../models/Order');
const { calculateCost, estimateInitialPrice } = require('../utils/pricing');

const uploadStl = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File required' });
    const { name, email, email2, phone, address, message, material, quantity } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });
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

const getMyStlOrders = async (req, res) => {
  try {
    res.json(await StlOrder.find({ $or:[{userId:req.user._id},{customerEmail:req.user.email}] }).sort({createdAt:-1}));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateMyStlOrder = async (req, res) => {
  try {
    const o = await StlOrder.findById(req.params.id);
    if (!o) return res.status(404).json({ error: 'Order not found' });
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

const confirmStlOrder = async (req, res) => {
  try {
    const o = await StlOrder.findById(req.params.id);
    if (!o) return res.status(404).json({ error: 'Order not found' });
    const own = (o.userId?.toString()===req.user._id.toString()) || o.customerEmail===req.user.email;
    if (!own) return res.status(403).json({ error: 'Forbidden' });
    if (o.status!=='QUOTED') return res.status(400).json({ error: 'Can only confirm QUOTED orders' });
    o.status = 'CONFIRMED';
    await o.save();
    const namePart = o.fileName.replace(/^[0-9a-f-]+-/i,'') || o.fileName;
    await Order.create({ userId:req.user._id, items:[{productName:`3D Print: ${namePart} (${o.material})`, price:o.estimatedPrice, quantity:o.quantity}], totalAmount:o.estimatedPrice, category:'STL', status:'PENDING' });
    res.json(o);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getAllStlOrders = async (req, res) => {
  try { res.json(await StlOrder.find().sort({createdAt:-1})); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

const updateStlStatus = async (req, res) => {
  try {
    const o = await StlOrder.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true});
    if (!o) return res.status(404).json({ error: 'Order not found' });
    res.json(o);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

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
    if (o.status==='PENDING_QUOTE') o.status = 'QUOTED';
    await o.save();
    res.json(o);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const downloadStlFile = async (req, res) => {
  try {
    const o = await StlOrder.findById(req.params.id);
    if (!o) return res.status(404).json({ error: 'Order not found' });
    const fp = path.join(__dirname,'../../uploads/stl-files',o.fileName);
    if (!fs.existsSync(fp)) return res.status(404).json({ error: 'File not found' });
    res.download(fp, o.fileName);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

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

const calculateCostEndpoint = async (req, res) => {
  try {
    const { printTimeHours, printTimeMinutes, weightGrams, material, supportStructures } = req.body;
    res.json(calculateCost({ printTimeHours, printTimeMinutes, weightGrams, material, supportStructures }));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { uploadStl, getMyStlOrders, updateMyStlOrder, confirmStlOrder, getAllStlOrders, updateStlStatus, setStlPrice, downloadStlFile, deleteStlOrder, calculateCostEndpoint };
