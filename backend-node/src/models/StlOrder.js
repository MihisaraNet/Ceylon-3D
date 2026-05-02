/**
 * StlOrder.js — STL / 3D Print Order Mongoose Model
 *
 * Represents a custom 3D print order submitted by a customer.
 *
 * Fields:
 *   - customerName     {String}   — Full name of the customer (required).
 *   - customerEmail    {String}   — Primary email (required, stored lowercase).
 *   - customerEmail2   {String}   — Optional secondary/alternative email.
 *   - phone            {String}   — Contact phone number.
 *   - address          {String}   — Delivery address.
 *   - fileName         {String}   — Stored filename on disk (UUID-prefixed, required).
 *   - fileSizeBytes    {Number}   — Size of the uploaded file in bytes.
 *   - material         {String}   — Printing material (PLA, ABS, PETG, RESIN). Default: 'PLA'.
 *   - quantity         {Number}   — Number of copies to print (min: 1). Default: 1.
 *   - estimatedPrice   {Number}   — Price estimate (set initially by algorithm, refined by admin).
 *   - printTimeHours   {Number}   — Estimated print time hours (set by admin).
 *   - printTimeMinutes {Number}   — Estimated print time minutes (set by admin).
 *   - weightGrams      {Number}   — Estimated material weight in grams (set by admin).
 *   - supportStructures{Boolean}  — Whether support structures are needed. Default: false.
 *   - userId           {ObjectId} — Reference to User if the customer is logged in.
 *   - note             {String}   — Special instructions from the customer.
 *   - status           {String}   — Order lifecycle status. Default: 'PENDING_QUOTE'.
 *
 * Status lifecycle:
 *   PENDING_QUOTE → QUOTED → CONFIRMED → PRINTING → READY → DELIVERED
 *                                                            → CANCELLED
 *
 * @module models/StlOrder
 * @requires mongoose
 */

const mongoose = require('mongoose');

const stlOrderSchema = new mongoose.Schema({
  customerName:     { type: String, required: true, trim: true },
  customerEmail:    { type: String, required: true, lowercase: true, trim: true },
  customerEmail2:   { type: String, default: null },
  phone:            { type: String, default: null },
  address:          { type: String, default: '' },
  fileName:         { type: String, required: true },
  fileSizeBytes:    { type: Number, default: 0 },
  material:         { type: String, default: 'PLA' },
  quantity:         { type: Number, default: 1, min: 1 },
  estimatedPrice:   { type: Number, default: null },
  printTimeHours:   { type: Number, default: null },
  printTimeMinutes: { type: Number, default: null },
  weightGrams:      { type: Number, default: null },
  supportStructures:{ type: Boolean, default: false },
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  note:             { type: String, default: null },
  status: {
    type: String,
    enum: ['PENDING_QUOTE','QUOTED','CONFIRMED','PRINTING','READY','DELIVERED','CANCELLED'],
    default: 'PENDING_QUOTE',
  },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

module.exports = mongoose.model('StlOrder', stlOrderSchema);
