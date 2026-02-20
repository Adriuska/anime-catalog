const mongoose = require('mongoose');

const studioSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Studio name is required'],
      trim: true,
    },
    nameNormalized: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    country: {
      type: String,
      trim: true,
    },
    foundedDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

studioSchema.pre('validate', function preValidate() {
  if (this.name) {
    this.nameNormalized = this.name.trim().toLowerCase();
  }
});

module.exports = mongoose.model('Studio', studioSchema);
