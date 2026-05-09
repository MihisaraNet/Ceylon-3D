/**
 * reviewController.js — Product Review Controller
 *
 * Endpoints:
 *   POST /reviews/:productId       — Submit a review for a product (auth required)
 *   GET  /reviews/:productId       — Get all reviews for a product (public)
 *   GET  /reviews/summary/:productId — Get rating summary (avg + count) for a product
 *   DELETE /reviews/:id            — Delete own review (auth required)
 *
 * @module controllers/reviewController
 */

const Review  = require('../models/Review');
const Order   = require('../models/Order');

/**
 * POST /reviews/:productId
 * Submit a new review. The user must have a delivered order containing this product.
 */
const submitReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    // Validate rating
    const r = Number(rating);
    if (!r || r < 1 || r > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check that the user has purchased this product (any SHOP order containing it)
    const hasPurchased = await Order.findOne({
      userId: req.user._id,
      category: 'SHOP',
      'items.productId': productId,
    });

    if (!hasPurchased) {
      return res.status(403).json({ error: 'You can only review products you have purchased' });
    }

    // Upsert: one review per user per product
    const review = await Review.findOneAndUpdate(
      { productId, userId: req.user._id },
      {
        userName: req.user.fullName || req.user.email,
        rating: r,
        comment: (comment || '').trim(),
        createdAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /reviews/:productId
 * Fetch all reviews for a product, newest first.
 */
const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /reviews/summary/:productId
 * Returns { averageRating, totalReviews, distribution: { 1:n, 2:n, ... 5:n } }
 */
const getReviewSummary = async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }, 'rating');
    const totalReviews = reviews.length;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    reviews.forEach(rv => {
      sum += rv.rating;
      distribution[rv.rating] = (distribution[rv.rating] || 0) + 1;
    });
    const averageRating = totalReviews > 0 ? Math.round((sum / totalReviews) * 10) / 10 : 0;
    res.json({ averageRating, totalReviews, distribution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /reviews/recent
 * Fetch the most recent reviews across ALL products (for the landing page).
 */
const getRecentReviews = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('productId', 'name imagePath');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /reviews/:id
 * Delete the caller's own review.
 */
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not your review' });
    }
    await review.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { submitReview, getReviews, getReviewSummary, getRecentReviews, deleteReview };
