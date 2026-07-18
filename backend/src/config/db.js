const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * Primary  : MongoDB Atlas  (MONGO_URI in .env points to Atlas)
 * Fallback : Local MongoDB  (set MONGO_URI=mongodb://localhost:27017/csea_events)
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are defaults in Mongoose 8+, kept explicit for clarity
      serverSelectionTimeoutMS: 5000, // fail fast if Atlas is unreachable
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
