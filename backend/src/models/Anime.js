const mongoose = require('mongoose');

const isHttpUrl = (value) => /^https?:\/\//i.test(value);

const normalizeSeason = (season) => {
  const map = {
    winter: 'Invierno',
    spring: 'Primavera',
    summer: 'Verano',
    fall: 'Otoño',
    otoño: 'Otoño',
    invierno: 'Invierno',
    primavera: 'Primavera',
    verano: 'Verano',
  };

  return map[String(season || '').trim().toLowerCase()] || undefined;
};

const animeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Anime title is required'],
      trim: true,
    },
    titleNormalized: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
      trim: true,
    },
    posterUrl: {
      type: String,
      required: [true, 'Poster URL is required'],
      validate: {
        validator: (value) => isHttpUrl(value),
        message: 'Poster URL must start with http:// or https://',
      },
    },
    bannerUrl: {
      type: String,
      validate: {
        validator: (value) => !value || isHttpUrl(value),
        message: 'Banner URL must start with http:// or https://',
      },
    },
    trailerUrl: {
      type: String,
      validate: {
        validator: (value) => !value || isHttpUrl(value),
        message: 'Trailer URL must start with http:// or https://',
      },
    },
    episodes: {
      type: Number,
      required: [true, 'Episodes is required'],
      min: [1, 'Episodes must be at least 1'],
    },
    durationMinutes: {
      type: Number,
      min: [1, 'Duration must be at least 1 minute'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    season: {
      type: String,
      enum: ['Invierno', 'Primavera', 'Verano', 'Otoño'],
    },
    year: {
      type: Number,
      min: [1950, 'Year must be at least 1950'],
      max: [2100, 'Year must be at most 2100'],
    },
    ageRating: {
      type: String,
      enum: ['G', 'PG', 'PG-13', 'R', 'R+', 'RX'],
    },
    isOngoing: {
      type: Boolean,
      required: [true, 'isOngoing is required'],
    },
    inLibrary: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [0, 'Rating must be at least 0'],
      max: [10, 'Rating must be at most 10'],
    },
    genres: {
      type: [String],
      required: [true, 'Genres are required'],
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 1,
        message: 'At least one genre is required',
      },
    },
    studio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Studio',
    },
  },
  { timestamps: true }
);

animeSchema.pre('validate', function preValidate() {
  if (this.title) {
    this.titleNormalized = this.title.trim().toLowerCase();
  }
  if (Array.isArray(this.genres)) {
    this.genres = this.genres
      .map((genre) => String(genre).trim())
      .filter(Boolean)
      .filter((genre, index, allGenres) => allGenres.indexOf(genre) === index);
  }
  if (!this.year && this.releaseDate) {
    this.year = new Date(this.releaseDate).getUTCFullYear();
  }
  if (this.season) {
    this.season = normalizeSeason(this.season);
  }
});

module.exports = mongoose.model('Anime', animeSchema);
