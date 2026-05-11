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
      value: Number,
      date: { type: Date, default: Date.now },
      source: { type: String, default: 'Sentinel-2' }
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
  irrigationStatus: {
    type: String,
    enum: ['needs_water', 'adequate', 'excess'],
    default: 'adequate'
  },
  lastAnalyzed: {
    type: Date
  },
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