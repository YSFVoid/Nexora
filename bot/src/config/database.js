const mongoose = require('mongoose');
const dns = require('dns');
const env = require('./env');
const logger = require('../utils/logger');

let isConnected = false;

async function connectDatabase() {
  if (isConnected) return;

  // Use Google DNS for SRV resolution (some ISPs block MongoDB SRV lookups)
  dns.setServers(['8.8.8.8', '1.1.1.1']);

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info('DB', 'Connected to MongoDB Atlas');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('DB', `MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('DB', 'MongoDB disconnected. Mongoose will attempt reconnect automatically.');
  });

  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      family: 4,
    });
  } catch (err) {
    logger.error('DB', `Failed to connect to MongoDB Atlas: ${err.message}`);
    process.exit(1);
  }
}

function getConnection() {
  return mongoose.connection;
}

module.exports = { connectDatabase, getConnection };
