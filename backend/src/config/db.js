const mongoose = require('mongoose');
const databaseConfig = require('./database');

let cachedConnection = null;
let cachedPromise = null;

const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const mongoUri = databaseConfig.mongoUri?.trim() || process.env.MONGODB_URI?.trim();

  if (!mongoUri) {
    throw new Error('MongoDB URI is required in src/config/database.js (mongoUri) or MONGODB_URI environment variable');
  }

  cachedPromise = mongoose
    .connect(mongoUri)
    .then((connection) => {
      cachedConnection = connection;
      console.log('MongoDB connected');
      return connection;
    })
    .catch((error) => {
      cachedPromise = null;
      throw error;
    });

  return cachedPromise;
};

module.exports = connectDB;
