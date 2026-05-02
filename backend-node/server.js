require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const { seedAdmin } = require('./src/utils/dataInit');

const authRoutes     = require('./src/routes/auth');
const productRoutes  = require('./src/routes/products');
const cartRoutes     = require('./src/routes/cart');
const orderRoutes    = require('./src/routes/orders');
const stlOrderRoutes = require('./src/routes/stlOrders');

const app  = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5175', 'http://localhost:8081', '*'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/api/products/images', express.static(path.join(__dirname, 'uploads', 'product-images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/api/uploads', stlOrderRoutes);
app.use('/stl-orders', stlOrderRoutes);

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

connectDB().then(async () => {
  await seedAdmin();
  app.listen(PORT, () => console.log(`Ceylon3D backend running on port ${PORT}`));
});
