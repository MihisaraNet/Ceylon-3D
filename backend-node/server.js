/**
 * server.js — Main Entry Point for the LayerForge 3D Backend Server
 *
 * This file is the starting point of the Node.js/Express backend application
 * for the LayerForge 3D Printing Service. It performs the following:
 *
 * 1. Loads environment variables from the `.env` file using `dotenv`.
 * 2. Creates an Express application instance and configures middleware:
 *    - CORS (Cross-Origin Resource Sharing) to allow requests from frontend clients.
 *    - JSON and URL-encoded body parsing for incoming request bodies.
 * 3. Serves static files (uploaded product images and STL files) from the `uploads/` directory.
 * 4. Registers all API route modules:
 *    - `/auth`          → User registration and login (authentication)
 *    - `/api/products`  → Product CRUD operations (listing, creating, updating, deleting)
 *    - `/cart`          → Shopping cart management (add, update, remove, clear)
 *    - `/orders`        → Shop order placement and management
 *    - `/api/uploads`   → STL file upload and 3D print order submission
 *    - `/stl-orders`    → STL order management (user and admin endpoints)
 * 5. Provides a `/health` endpoint for server status checks.
 * 6. Includes a 404 catch-all and a global error handler for unhandled errors.
 * 7. Connects to MongoDB, seeds a default admin user, and starts listening on the configured port.
 *
 * @module server
 * @requires dotenv
 * @requires express
 * @requires cors
 * @requires path
 * @requires ./src/config/db
 * @requires ./src/utils/dataInit
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const { seedAdmin } = require('./src/utils/dataInit');

/* ── Import all route modules ─────────────────────────────── */
const authRoutes     = require('./src/routes/auth');
const productRoutes  = require('./src/routes/products');
const cartRoutes     = require('./src/routes/cart');
const orderRoutes    = require('./src/routes/orders');
const stlOrderRoutes = require('./src/routes/stlOrders');

/* ── Create Express app and define server port ────────────── */
const app  = express();
const PORT = process.env.PORT || 8080;

/* ── Middleware Configuration ─────────────────────────────── */

// Enable CORS for the specified frontend origins (React web, Expo mobile, etc.)
// The wildcard '*' is included as a fallback for development convenience.
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5175',
      'http://localhost:8081',
      'https://print-pied-eight.vercel.app',
      'https://threedink-studio.onrender.com',
    ];
    // Allow requests with no origin (like mobile apps) or if the origin is in the allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Parse incoming JSON request bodies (e.g., login credentials, order data)
app.use(express.json());

// Parse URL-encoded request bodies (e.g., form submissions)
app.use(express.urlencoded({ extended: true }));

/* ── Static File Serving ──────────────────────────────────── */

// Serve product images at `/api/products/images/<filename>`
app.use('/api/products/images', express.static(path.join(__dirname, 'uploads', 'product-images')));

// Serve all uploaded files (STL, images, etc.) at `/uploads/<path>`
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ── API Route Registration ───────────────────────────────── */

app.use('/auth', authRoutes);               // POST /auth/register, POST /auth/login
app.use('/api/products', productRoutes);     // GET/POST/PUT/DELETE /api/products
app.use('/cart', cartRoutes);                // GET/POST/PUT/DELETE /cart
app.use('/orders', orderRoutes);             // GET/POST/PUT /orders
app.use('/api/uploads', stlOrderRoutes);     // POST /api/uploads/stl (file upload)
app.use('/stl-orders', stlOrderRoutes);      // GET/PUT/DELETE /stl-orders (management)

/* ── Health Check Endpoint ────────────────────────────────── */
// Returns "OK" to indicate the server is healthy.
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* ── 404 Catch-All ────────────────────────────────────────── */
// Any route not matched above returns a 404 error.
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

/* ── Global Error Handler ─────────────────────────────────── */
// Catches any unhandled errors thrown in route handlers and returns a 500 response.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

/* ── Database Connection & Server Startup ─────────────────── */
// 1. Connect to MongoDB (with retry logic defined in db.js).
// 2. Seed the default admin account if none exists.
// 3. Start the Express server on the configured PORT.
connectDB().then(async () => {
  await seedAdmin();
  app.listen(PORT, () => console.log(`LayerForge 3D backend running on port ${PORT}`));
});
