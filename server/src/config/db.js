const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  try {
    const conn = await mongoose.connect(uri, {
      dbName: process.env.DB_NAME || 'devcollab',
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // force IPv4 — fixes many DNS SRV issues on Windows
    });

    console.log(`\n✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}\n`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
  } catch (error) {
    console.error('\n❌ MongoDB connection failed:', error.message);
    console.error('\n🔧 Troubleshooting steps:');
    console.error('   1. Go to MongoDB Atlas → Network Access → Add IP: 0.0.0.0/0 (allow all)');
    console.error('   2. Check your internet connection');
    console.error('   3. Try LOCAL MongoDB: set MONGODB_URI=mongodb://localhost:27017/devcollab in .env');
    console.error('   4. Verify Atlas credentials at cloud.mongodb.com\n');
    process.exit(1);
  }
};

module.exports = connectDB;
