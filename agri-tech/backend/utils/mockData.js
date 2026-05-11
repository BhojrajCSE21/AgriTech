const generateMockData = () => {
  return {
    humidity: parseFloat((60 + Math.random() * 20).toFixed(1)),
    temperature: parseFloat((18 + Math.random() * 10).toFixed(1)),
    soilMoisture: parseFloat((30 + Math.random() * 40).toFixed(1))
  };
};

const getRandomGrowthStage = () => {
  const stages = [
    'Planted',
    'Germination',
    'Seedling',
    'Tillering',
    'Shooting',
    'Flowering',
    'Grain Filling',
    'Maturity'
  ];
  return stages[Math.floor(Math.random() * stages.length)];
};

const getRandomWeatherCode = () => {
  const codes = [0, 1, 2, 3, 61, 63, 80, 95];
  return codes[Math.floor(Math.random() * codes.length)];
};

module.exports = { generateMockData, getRandomGrowthStage, getRandomWeatherCode };