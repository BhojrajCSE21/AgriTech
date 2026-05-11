const express = require('express');
const router = express.Router();
const { getCurrentWeather, getForecast } = require('../services/weatherService');

router.get('/current', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const latVal = lat || 52.52;
    const lngVal = lng || 13.41;
    const weather = await getCurrentWeather(latVal, lngVal);
    res.json(weather);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/forecast', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const latVal = lat || 52.52;
    const lngVal = lng || 13.41;
    const forecast = await getForecast(latVal, lngVal);
    res.json(forecast);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;