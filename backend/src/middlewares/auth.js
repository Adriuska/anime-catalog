const jwt = require('jsonwebtoken');
const User = require('../models/User');
const databaseConfig = require('../config/database');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      res.status(401);
      throw new Error('Authentication token is required');
    }

    const jwtSecret = databaseConfig.jwtSecret || process.env.JWT_SECRET || 'anime-catalog-dev-secret';
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.sub).select('_id email displayName createdAt updatedAt');

    if (!user) {
      res.status(401);
      throw new Error('Invalid authentication token');
    }

    req.user = user;
    next();
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(401);
    }
    next(error);
  }
};

module.exports = {
  requireAuth,
};
