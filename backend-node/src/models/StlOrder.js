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
  // Full name of the customer placing the order. Required and whitespace-trimmed.
  customerName:     { type: String, required: true, trim: true },
  
  // Primary email of the customer. Required, stored in lowercase, and whitespace-trimmed.
  customerEmail:    { type: String, required: true, lowercase: true, trim: true },
  
  // Optional secondary email address for the customer.
  customerEmail2:   { type: String, default: null },
  
  // Optional contact phone number for the customer.
  phone:            { type: String, default: null },
  
  // The delivery address provided by the customer.
  address:          { type: String, default: '' },
  
  // The physical filename of the uploaded STL file on the server. Required.
  fileName:         { type: String, required: true },
  
  // The size of the uploaded STL file in bytes. Used for initial cost estimation.
  fileSizeBytes:    { type: Number, default: 0 },
  
  // The requested printing material (e.g., 'PLA', 'ABS', 'RESIN'). Defaults to 'PLA'.
  material:         { type: String, default: 'PLA' },
  
  // The number of copies requested. Defaults to 1, cannot be less than 1.
  quantity:         { type: Number, default: 1, min: 1 },
  
  // The estimated price. Initially calculated automatically, but can be updated by the admin.
  estimatedPrice:   { type: Number, default: null },
  
  // The estimated number of hours required to print the model (set by admin).
  printTimeHours:   { type: Number, default: null },
  
  // The estimated number of minutes required to print the model (set by admin).
  printTimeMinutes: { type: Number, default: null },
  
  // The estimated weight of the required material in grams (set by admin).
  weightGrams:      { type: Number, default: null },
  
  // Boolean flag indicating if support structures are needed for printing (set by admin).
  supportStructures:{ type: Boolean, default: false },
  
  // Reference to the registered User document, if the customer was logged in. Null for guest orders.
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  // Any special instructions or notes provided by the customer.
  note:             { type: String, default: null },
  
  // The current lifecycle status of the STL order. Defaults to 'PENDING_QUOTE'.
  status: {
    type: String,
    enum: ['PENDING_QUOTE','QUOTED','CONFIRMED','PRINTING','READY','DELIVERED','CANCELLED'],
    default: 'PENDING_QUOTE',
  },
}, { 
  // Automatically track when the STL order was created. Updates are not automatically timestamped.
  timestamps: { createdAt: 'createdAt', updatedAt: false } 
});

module.exports = mongoose.model('StlOrder', stlOrderSchema);
