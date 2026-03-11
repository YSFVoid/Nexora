const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;

async function connectDatabase() {
  if (isConnected) return;

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('[DB] Connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[DB] MongoDB disconnected. Attempting reconnect...');
  });

  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (err) {
    console.error('[DB] Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

function getConnection() {
  return mongoose.connection;
}

module.exports = { connectDatabase, getConnection };
