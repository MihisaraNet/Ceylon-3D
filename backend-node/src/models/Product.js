const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price:       { type: Number, required: true, min: 0 },
  stock:       { type: Number, default: 0, min: 0 },
  imagePath:   { type: String, default: null },
  category:    { type: String, default: 'custom', trim: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });
module.exports = mongoose.model('Product', productSchema);
