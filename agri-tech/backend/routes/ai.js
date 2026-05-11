const express = require('express');
const router = express.Router();

router.post('/crop-health', async (req, res) => {
  try {
    const { image } = req.body;

    // Mock AI response
    const mockResponses = [
      { disease: 'Healthy', confidence: 0.95, recommendations: ['Continue current practices'] },
      { disease: 'Leaf Rust', confidence: 0.87, recommendations: ['Apply fungicide', 'Improve air circulation'] },
      { disease: 'Powdery Mildew', confidence: 0.82, recommendations: ['Use organic treatment', 'Reduce humidity'] },
      { disease: 'Nitrogen Deficiency', confidence: 0.79, recommendations: ['Apply nitrogen fertilizer', 'Check soil pH'] }
    ];

    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    res.json(response);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/yield-prediction/:fieldId', async (req, res) => {
  try {
    // Mock yield prediction
    const mockYield = {
      fieldId: req.params.fieldId,
      predictedYield: (2500 + Math.random() * 1500).toFixed(0),
      unit: 'kg/ha',
      confidence: 0.85,
      factors: ['Weather conditions', 'Soil health', 'Growth stage']
    };
    res.json(mockYield);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;