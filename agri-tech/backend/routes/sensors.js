const express = require('express');
const router = express.Router();
const Sensor = require('../models/Sensor');
const Reading = require('../models/Reading');
const { generateMockData } = require('../utils/mockData');

router.get('/', async (req, res) => {
  try {
    const sensors = await Sensor.find().populate('fieldId');
    res.json(sensors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/', async (req, res) => {
  try {
    const newSensor = new Sensor(req.body);
    const sensor = await newSensor.save();
    res.json(sensor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/field/:fieldId', async (req, res) => {
  try {
    const sensors = await Sensor.find({ fieldId: req.params.fieldId });
    res.json(sensors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/:id/readings', async (req, res) => {
  try {
    const readings = await Reading.find({ sensorId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(readings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/:id/latest', async (req, res) => {
  try {
    const mockData = generateMockData();
    res.json({
      ...mockData,
      sensorId: req.params.id,
      timestamp: new Date()
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;