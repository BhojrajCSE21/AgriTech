const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cropType: {
    type: String,
    required: true
  },
  area: {
    type: Number,
    required: true
  },
  gpsCoords: {
    lat: { type: Number },
    lng: { type: Number }
  },
  boundaries: [
    {
      lat: Number,
      lng: Number
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