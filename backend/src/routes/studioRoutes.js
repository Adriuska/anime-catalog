const express = require('express');
const {
  getStudios,
  getStudioById,
  createStudio,
  updateStudio,
  deleteStudio,
} = require('../controllers/studioController');
const validateObjectId = require('../middlewares/validateObjectId');

const router = express.Router();

router.route('/').get(getStudios).post(createStudio);

router
  .route('/:id')
  .get(validateObjectId(), getStudioById)
  .patch(validateObjectId(), updateStudio)
  .delete(validateObjectId(), deleteStudio);

module.exports = router;
