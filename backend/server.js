const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./db'); // Initializes SQLite
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const requestRoutes = require('./routes/requests');
const volunteerRoutes = require('./routes/volunteer');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Attach io to req object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/admin', adminRoutes);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Platform API is running' });
});

// Socket.IO for Real-Time tracking
const connectedUsers = new Map();

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  const role = socket.handshake.query.role;
  console.log(`New client connected: ${socket.id} (User: ${userId}, Role: ${role})`);
  
  if (userId) {
    connectedUsers.set(userId, socket.id);
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (userId) {
      connectedUsers.delete(userId);
    }
  });
});

app.locals.connectedUsers = connectedUsers; // For targeted push

// Serve static React frontend files
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Send all other requests to the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, io };
