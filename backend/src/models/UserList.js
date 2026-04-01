const mongoose = require('mongoose');

const userListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'List name is required'],
      trim: true,
      minlength: [2, 'List name must be at least 2 characters'],
      maxlength: [80, 'List name must be at most 80 characters'],
    },
    isPrivate: {
      type: Boolean,
      default: true,
      immutable: true,
    },
  },
  { timestamps: true }
);

userListSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('UserList', userListSchema);
