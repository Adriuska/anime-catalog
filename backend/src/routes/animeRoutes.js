const express = require('express');
const {
  getAnimeDiscover,
  getAnimes,
  getAnimeById,
  createAnime,
  updateAnime,
  deleteAnime,
} = require('../controllers/animeController');
const validateObjectId = require('../middlewares/validateObjectId');

const router = express.Router();

router.get('/discover', getAnimeDiscover);
router.route('/').get(getAnimes).post(createAnime);

router
  .route('/:id')
  .get(validateObjectId(), getAnimeById)
  .patch(validateObjectId(), updateAnime)
  .delete(validateObjectId(), deleteAnime);

module.exports = router;
