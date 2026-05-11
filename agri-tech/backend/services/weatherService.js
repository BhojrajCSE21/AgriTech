const axios = require('axios');

const getCurrentWeather = async (lat, lng) => {
  try {
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
    );
    return response.data;
  } catch (error) {
    console.error('Weather API error:', error.message);
    throw error;
  }
};

const getForecast = async (lat, lng) => {
  try {
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
    );
    return response.data;
  } catch (error) {
    console.error('Forecast API error:', error.message);
    throw error;
  }
};

module.exports = { getCurrentWeather, getForecast };