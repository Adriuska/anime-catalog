const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const {
  importFromAniList,
  importFromJikan,
  importFromKitsu,
} = require('../controllers/importController');

const router = express.Router();

router.use(requireAuth);

router.post('/anilist', importFromAniList);
router.post('/jikan', importFromJikan);
router.post('/kitsu', importFromKitsu);

module.exports = router;
