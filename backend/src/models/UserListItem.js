const mongoose = require('mongoose');

const userListItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserList',
      required: true,
      index: true,
    },
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: true,
      index: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userListItemSchema.index({ userId: 1, listId: 1, animeId: 1 }, { unique: true });

module.exports = mongoose.model('UserListItem', userListItemSchema);
