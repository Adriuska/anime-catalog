const mongoose = require('mongoose');

const userFavoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

userFavoriteSchema.index({ userId: 1, animeId: 1 }, { unique: true });

module.exports = mongoose.model('UserFavorite', userFavoriteSchema);
