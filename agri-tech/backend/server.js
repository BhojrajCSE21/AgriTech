require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/auth');
const fieldRoutes = require('./routes/fields');
const sensorRoutes = require('./routes/sensors');
const weatherRoutes = require('./routes/weather');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AgriTech API is running' });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send mock sensor data every 5 seconds
  setInterval(() => {
    const mockData = {
      humidity: parseFloat((60 + Math.random() * 20).toFixed(1)),
      temperature: parseFloat((18 + Math.random() * 10).toFixed(1)),
      soilMoisture: parseFloat((30 + Math.random() * 40).toFixed(1)),
      timestamp: new Date().toISOString()
    };
    socket.emit('sensorData', mockData);
  }, 5000);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Socket.io: ws://localhost:${PORT}`);
});