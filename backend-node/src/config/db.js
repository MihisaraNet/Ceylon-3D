const mongoose = require('mongoose');

const connectDB = async (retries = 5, delay = 5000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ceylon3d');
      console.log('MongoDB connected');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i}/${retries} failed: ${err.message}`);
      if (i < retries) {
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        console.error('All MongoDB connection attempts failed. Exiting.');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
