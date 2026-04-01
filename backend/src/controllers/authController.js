const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const databaseConfig = require('../config/database');

const sanitizeUser = (user) => ({
  _id: user._id,
  email: user.email,
  displayName: user.displayName,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const signToken = (userId) =>
  jwt.sign({ sub: String(userId) }, databaseConfig.jwtSecret || process.env.JWT_SECRET || 'anime-catalog-dev-secret', {
    expiresIn: databaseConfig.jwtExpiresIn || process.env.JWT_EXPIRES_IN || '7d',
  });

const register = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      res.status(400);
      throw new Error('email, password and displayName are required');
    }

    if (String(password).length < 8) {
      res.status(400);
      throw new Error('Password must be at least 8 characters');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail }).select('_id');
    if (exists) {
      res.status(409);
      throw new Error('Email already in use');
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    const user = await User.create({
      email: normalizedEmail,
      displayName: String(displayName).trim(),
      passwordHash,
    });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('email and password are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(String(password), user.passwordHash);
    if (!isValidPassword) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    const token = signToken(user._id);

    res.status(200).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  res.status(200).json({
    user: sanitizeUser(req.user),
  });
};

module.exports = {
  register,
  login,
  me,
};
