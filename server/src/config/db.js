const mongoose = require('mongoose');

/**
 * Connects to MongoDB. The process exits on failure so that a broken
 * instance is replaced by the Auto Scaling Group instead of serving errors.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri, {
      // Keep a bounded pool so many EC2 instances do not exhaust Atlas limits.
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    // eslint-disable-next-line no-console
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
