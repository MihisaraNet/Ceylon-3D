/**
 * routes/reviews.js — Product Review Routes
 *
 * Endpoints:
 *   GET    /reviews/recent              — Latest reviews across all products (public)
 *   GET    /reviews/summary/:productId  — Rating summary for a product (public)
 *   GET    /reviews/:productId          — All reviews for a product (public)
 *   POST   /reviews/:productId          — Submit/update a review (auth required)
 *   DELETE /reviews/:id                 — Delete own review (auth required)
 *
 * @module routes/reviews
 */

const router = require('express').Router();
const { verifyToken, requireAuth } = require('../middleware/auth');
const {
  submitReview,
  getReviews,
  getReviewSummary,
  getRecentReviews,
  deleteReview,
} = require('../controllers/reviewController');

// Public routes
router.get('/recent',              getRecentReviews);              // Landing page feed
router.get('/summary/:productId',  getReviewSummary);             // Rating summary widget
router.get('/:productId',          getReviews);                   // Product reviews list

// Authenticated routes
router.post('/:productId',         verifyToken, requireAuth, submitReview);   // Submit review
router.delete('/:id',              verifyToken, requireAuth, deleteReview);   // Delete own review

module.exports = router;
