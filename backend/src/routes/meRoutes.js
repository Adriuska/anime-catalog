const express = require('express');
const validateObjectId = require('../middlewares/validateObjectId');
const { requireAuth } = require('../middlewares/auth');
const {
  getFavorites,
  addFavorite,
  removeFavorite,
  getLists,
  createList,
  updateList,
  deleteList,
  getListItems,
  addListItem,
  removeListItem,
} = require('../controllers/meController');

const router = express.Router();

router.use(requireAuth);

router.route('/favorites').get(getFavorites).post(addFavorite);
router.delete('/favorites/:animeId', validateObjectId('animeId'), removeFavorite);

router.route('/lists').get(getLists).post(createList);
router
  .route('/lists/:listId')
  .patch(validateObjectId('listId'), updateList)
  .delete(validateObjectId('listId'), deleteList);

router
  .route('/lists/:listId/items')
  .get(validateObjectId('listId'), getListItems)
  .post(validateObjectId('listId'), addListItem);

router.delete(
  '/lists/:listId/items/:animeId',
  validateObjectId('listId'),
  validateObjectId('animeId'),
  removeListItem
);

module.exports = router;
