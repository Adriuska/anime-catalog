const mongoose = require('mongoose');

let cachedConnection = null;
let cachedPromise = null;

const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is required in environment variables');
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
