const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  cropType: {
    type: String,
    required: true,
    default: 'Winter Wheat'
  },
  area: {
    type: Number,
    required: true
  },
  geoJson: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]],
      required: true
    }
  },
  centroid: {
    lat: Number,
    lng: Number
  },
  ndvi: {
    type: Number,
    default: null
  },
  ndviHistory: [
    {
      score: Number,
      date: { type: Date, default: Date.now }
    }
  ],
  healthScore: {
    type: Number,
    default: 0
  },
  growthStage: {
    type: String,
    default: 'Planted'
  },
  yieldForecast: {
    tons: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  irrigationStatus: {
    type: String,
    enum: ['needs_water', 'adequate', 'excess'],
    default: 'adequate'
  },
  lastAnalyzed: {
    type: Date
  },
  satelliteImage: {
    type: String
  },
  ndviThumbnail: {
    type: String
  },
  tileUrls: [{
    type: String
  }],
  ndviTileUrls: [{
    type: String
  }],
  logs: [{
    date: { type: Date, default: Date.now },
    type: { type: String, required: true },
    notes: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

fieldSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Field', fieldSchema);