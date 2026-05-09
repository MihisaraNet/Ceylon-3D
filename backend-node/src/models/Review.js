/**
 * Review.js — Product Review Mongoose Model
 *
 * Stores customer reviews for products after a completed purchase.
 *
 * Schema fields:
 *   - productId  {ObjectId} — Reference to the reviewed Product (required).
 *   - userId     {ObjectId} — Reference to the User who wrote the review (required).
 *   - userName   {String}   — Snapshot of the reviewer's name at time of review.
 *   - rating     {Number}   — Star rating 1–5 (required).
 *   - comment    {String}   — Written review text (optional).
 *   - createdAt  {Date}     — Auto-generated timestamp.
 *
 * @module models/Review
 * @requires mongoose
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // The product being reviewed
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },

  // The user who wrote the review
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Snapshot of the reviewer name (preserved if user account is deleted)
  userName: {
    type: String,
    required: true,
  },

  // Star rating 1 through 5
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },

  // Written review text
  comment: {
    type: String,
    default: '',
    maxlength: 1000,
  },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false },
});

// One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
