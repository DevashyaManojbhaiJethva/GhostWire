const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

async function connectDB() {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is required');
    }

    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.log(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
