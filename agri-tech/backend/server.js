require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/auth');
const fieldRoutes = require('./routes/fields');
const sensorRoutes = require('./routes/sensors');
const weatherRoutes = require('./routes/weather');
const aiRoutes = require('./routes/ai');
const marketRoutes = require('./routes/market');

const app = express();
const server = http.createServer(app);

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/market', marketRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AgriTech API is running' });
});



const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});