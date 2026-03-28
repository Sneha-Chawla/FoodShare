const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-foodshare';

// Middleware to verify token and extract user
const authenticate = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// GET /api/donations - Get all available food donations
router.get('/', (req, res) => {
  const query = `
    SELECT d.*, u.name as donor_name, u.email as donor_email 
    FROM donations d 
    JOIN users u ON d.donor_id = u.id 
    WHERE d.status = 'pending'
    ORDER BY d.created_at DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err.message });
    res.json(rows);
  });
});

// POST /api/donations - Donor creates a new donation
router.post('/', authenticate, (req, res) => {
  if (req.user.role !== 'donor' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only donors can post food' });
  }

  const { food_type, quantity, expiry_time, location } = req.body;
  
  if (!food_type || !quantity || !expiry_time || !location) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const query = `INSERT INTO donations (donor_id, food_type, quantity, expiry_time, location, status) VALUES (?, ?, ?, ?, ?, 'pending')`;
  db.run(query, [req.user.id, food_type, quantity, expiry_time, location], function(err) {
    if (err) return res.status(500).json({ error: 'Database error', details: err.message });
    
    const newDonation = {
      id: this.lastID,
      food_type, quantity, expiry_time, location,
      status: 'pending',
      donor_id: req.user.id,
      donor_name: req.user.name, 
      created_at: new Date()
    };
    
    // Broadcast to all connected clients that a new donation is available
    req.io.emit('new_donation', newDonation);
    
    res.status(201).json({
      message: 'Donation created successfully',
      donationId: this.lastID
    });
  });
});

// GET /api/donations/:id - Get specific donation details
router.get('/:id', (req, res) => {
  const query = `
    SELECT d.*, u.name as donor_name 
    FROM donations d 
    JOIN users u ON d.donor_id = u.id 
    WHERE d.id = ?
  `;
  db.get(query, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err.message });
    if (!row) return res.status(404).json({ error: 'Donation not found' });
    res.json(row);
  });
});

module.exports = router;
