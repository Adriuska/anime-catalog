const dotenv = require('dotenv');
const app = require('../app');
const connectDB = require('../src/config/db');

dotenv.config();

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('Serverless request failed:', error.message);

    return res.status(500).json({
      error: {
        message: 'Server initialization failed',
        statusCode: 500,
      },
    });
  }
};
