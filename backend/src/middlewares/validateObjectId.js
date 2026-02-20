const mongoose = require('mongoose');

const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: {
        message: `Invalid ${paramName}`,
        statusCode: 400,
      },
    });
  }
  return next();
};

module.exports = validateObjectId;
