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

// POST /api/requests - NGO requests a donation
router.post('/', authenticate, (req, res) => {
  if (req.user.role !== 'ngo' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only NGOs can request food' });
  }

  const { donation_id } = req.body;
  if (!donation_id) return res.status(400).json({ error: 'Donation ID is required' });

  // Check if donation is still pending
  db.get(`SELECT status, donor_id FROM donations WHERE id = ?`, [donation_id], (err, donation) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!donation) return res.status(404).json({ error: 'Donation not found' });
    if (donation.status !== 'pending') return res.status(400).json({ error: 'Donation is no longer available' });

    // Create the request
    const query = `INSERT INTO requests (ngo_id, donation_id, status) VALUES (?, ?, 'requested')`;
    db.run(query, [req.user.id, donation_id], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to create request', details: err.message });
      
      const requestId = this.lastID;
      
      res.status(201).json({ message: 'Request sent successfully', requestId });
      
      // In future: emit socket event to Donor (donor_id)
    });
  });
});

// GET /api/requests/ngo - NGO viewing their own requests
router.get('/ngo', authenticate, (req, res) => {
  if (req.user.role !== 'ngo') return res.status(403).json({ error: 'Access denied' });

  const query = `
    SELECT r.id as request_id, r.status as request_status, d.id as donation_id, d.status as donation_status, d.*, u.name as donor_name
    FROM requests r
    JOIN donations d ON r.donation_id = d.id
    JOIN users u ON d.donor_id = u.id
    WHERE r.ngo_id = ?
    ORDER BY r.created_at DESC
  `;
  db.all(query, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// GET /api/requests/donor - Donor viewing requests made to their donations
router.get('/donor', authenticate, (req, res) => {
  if (req.user.role !== 'donor') return res.status(403).json({ error: 'Access denied' });

  const query = `
    SELECT r.id as request_id, r.status as request_status, d.food_type, d.quantity, u.name as ngo_name, u.email as ngo_email
    FROM requests r
    JOIN donations d ON r.donation_id = d.id
    JOIN users u ON r.ngo_id = u.id
    WHERE d.donor_id = ?
    ORDER BY r.created_at DESC
  `;
  db.all(query, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// PUT /api/requests/:id/status - Donor accepting/rejecting a request
router.put('/:id/status', authenticate, (req, res) => {
  if (req.user.role !== 'donor' && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });

  const { status } = req.body; // 'accepted' or 'rejected'
  const requestId = req.params.id;

  if (status !== 'accepted' && status !== 'rejected') return res.status(400).json({ error: 'Invalid status' });

  // Update request status
  db.run(`UPDATE requests SET status = ? WHERE id = ?`, [status, requestId], function(err) {
    if (err) return res.status(500).json({ error: 'Database error on request' });
    if (this.changes === 0) return res.status(404).json({ error: 'Request not found' });

    // If accepted, also mark donation as accepted, and reject other requests for that donation
    if (status === 'accepted') {
      db.get(`SELECT r.ngo_id, d.id as donation_id FROM requests r JOIN donations d ON r.donation_id = d.id WHERE r.id = ?`, [requestId], (err, row) => {
        if (!err && row) {
          const { donation_id, ngo_id } = row;
          db.run(`UPDATE donations SET status = 'accepted' WHERE id = ?`, [donation_id]);
          db.run(`UPDATE requests SET status = 'rejected' WHERE donation_id = ? AND id != ?`, [donation_id, requestId]);
          
          req.io.emit('donation_taken', { donation_id }); // Let everyone know it's off the board
          
          // Targeted push to NGO
          const targetSocketId = req.app.locals.connectedUsers.get(String(ngo_id));
          if (targetSocketId) {
            req.io.to(targetSocketId).emit('request_accepted', { request_id: requestId, donation_id });
          }
        }
      });
    } else if (status === 'rejected') {
      // Find the specific NGO and inform them they were rejected
      db.get(`SELECT ngo_id FROM requests WHERE id = ?`, [requestId], (err, row) => {
        if (!err && row) {
          const targetSocketId = req.app.locals.connectedUsers.get(String(row.ngo_id));
          if (targetSocketId) {
            req.io.to(targetSocketId).emit('request_rejected', { request_id: requestId });
          }
        }
      });
    }

    res.json({ message: `Request ${status} successfully` });
  });
});

module.exports = router;
