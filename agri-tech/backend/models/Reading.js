const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  sensorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sensor',
    required: true
  },
  humidity: {
    type: Number
  },
  temperature: {
    type: Number
  },
  soilMoisture: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reading', readingSchema);