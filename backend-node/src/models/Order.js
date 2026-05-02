const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productName: { type: String, required: true },
  price:       { type: Number, required: true },
  quantity:    { type: Number, required: true, min: 1 },
}, { _id: false });

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
