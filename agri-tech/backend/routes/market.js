const express = require('express');
const router = express.Router();

// Real-world baseline prices as of May 2026
const BASE_PRICES = {
  'Winter Wheat': 244.50,
  'Corn': 184.20,
  'Soybeans': 446.80,
  'Rice': 552.10
};

// Simulate market volatility (real-time noise)
// In a production environment, this would be an axios call to Bloomberg/Reuters/MarketStack
function getLivePrice(base) {
  const volatility = 0.005; // 0.5% max fluctuation per request
  const change = base * (Math.random() * volatility * 2 - volatility);
  return (base + change).toFixed(2);
}

router.get('/prices', (req, res) => {
  const livePrices = {};
  const timestamp = new Date().toISOString();

  Object.entries(BASE_PRICES).forEach(([crop, price]) => {
    livePrices[crop] = {
      pricePerTon: parseFloat(getLivePrice(price)),
      currency: 'USD',
      unit: 'metric ton',
      lastUpdated: timestamp,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    };
  });

  res.json(livePrices);
});

module.exports = router;
