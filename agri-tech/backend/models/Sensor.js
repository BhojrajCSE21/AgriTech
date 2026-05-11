const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  fieldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true
  },
  type: {
    type: String,
    enum: ['humidity', 'temperature', 'soilMoisture'],
    required: true
  },
  location: {
    lat: Number,
    lng: Number
  },
  installDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastReading: {
    type: Date
  }
});

module.exports = mongoose.model('Sensor', sensorSchema);