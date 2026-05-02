/**
 * db.js — MongoDB Database Connection Module
 *
 * This module establishes a connection to the MongoDB database using Mongoose.
 * It implements a retry mechanism to handle transient connection failures
 * (e.g., database server not yet ready, network issues).
 *
 * Configuration:
 *   - Connection URI is read from the `MONGO_URI` environment variable.
 *   - Falls back to `mongodb://localhost:27017/layerforge3d` if `MONGO_URI` is not set.
 *
 * Retry Logic:
 *   - Attempts to connect up to `retries` times (default: 5).
 *   - Waits `delay` milliseconds between attempts (default: 5000ms / 5 seconds).
 *   - If all attempts fail, the process exits with code 1 to signal failure.
 *
 * @module config/db
 * @requires mongoose
 * @returns {Function} connectDB — Async function that connects to MongoDB with retries.
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB with automatic retry logic.
 *
 * @async
 * @param {number} [retries=5]  - Maximum number of connection attempts.
 * @param {number} [delay=5000] - Delay in milliseconds between retry attempts.
 * @returns {Promise<void>}     - Resolves when connected; exits the process if all retries fail.
 */
const connectDB = async (retries = 5, delay = 5000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      // Attempt to connect using the URI from .env or the local default
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/layerforge3d');
      console.log('MongoDB connected');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i}/${retries} failed: ${err.message}`);
      if (i < retries) {
        // Wait before the next retry attempt
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        // All retries exhausted — terminate the process
        console.error('All MongoDB connection attempts failed. Exiting.');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
