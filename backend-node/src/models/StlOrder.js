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
