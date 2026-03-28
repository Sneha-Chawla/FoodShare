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

// GET /api/volunteer/tasks - Get all donations waiting for pickup (status: 'accepted')
router.get('/tasks', authenticate, (req, res) => {
  if (req.user.role !== 'volunteer') return res.status(403).json({ error: 'Access denied' });

  // Get accepted donations alongside the Donor's and NGO's info
  const query = `
    SELECT d.id, d.food_type, d.quantity, d.location as pickup_location, d.status, 
           u_donor.name as donor_name,
           r.id as request_id, 
           u_ngo.name as ngo_name, u_ngo.location as delivery_location
    FROM donations d
    JOIN users u_donor ON d.donor_id = u_donor.id
    JOIN requests r ON d.id = r.donation_id
    JOIN users u_ngo ON r.ngo_id = u_ngo.id
    WHERE d.status = 'accepted' AND r.status = 'accepted'
    ORDER BY d.created_at ASC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err.message });
    res.json(rows);
  });
});

// GET /api/volunteer/my-tasks - Volunteer's assignments
router.get('/my-tasks', authenticate, (req, res) => {
  if (req.user.role !== 'volunteer') return res.status(403).json({ error: 'Access denied' });

  const query = `
    SELECT d.id as donation_id, d.food_type, d.quantity, d.location as pickup_location, d.status,
           u_donor.name as donor_name, u_ngo.name as ngo_name, u_ngo.location as delivery_location
    FROM donations d
    JOIN users u_donor ON d.donor_id = u_donor.id
    JOIN requests r ON d.id = r.donation_id
    JOIN users u_ngo ON r.ngo_id = u_ngo.id
    WHERE (d.status = 'picked' OR d.status = 'delivered') AND d.volunteer_id = ?
    ORDER BY d.created_at ASC
  `;
  
  // Note: we need to ensure the `donations` table has a `volunteer_id` column.
  // Wait, I didn't add volunteer_id to donations in db.js initially.
  // We can add it dynamically or alter the table.
  // For SQLite, ALTER TABLE donations ADD COLUMN volunteer_id INTEGER
  db.all(query, [req.user.id], (err, rows) => {
    // Graceful error if column doesn't exist yet, we can catch and schema migrate if needed.
    if (err) {
      if(err.message.includes('no such column')) {
        db.run('ALTER TABLE donations ADD COLUMN volunteer_id INTEGER', () => {
          db.all(query, [req.user.id], (err2, rows2) => {
            if (err2) return res.status(500).json({ error: 'Database retry error' });
            res.json(rows2 || []);
          });
        });
        return;
      }
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(rows);
  });
});

// PUT /api/volunteer/tasks/:id/pickup - Mark as picked up
router.put('/tasks/:id/pickup', authenticate, (req, res) => {
  if (req.user.role !== 'volunteer') return res.status(403).json({ error: 'Access denied' });

  const donationId = req.params.id;

  // Add volunteer column if not exists
  db.run(`ALTER TABLE donations ADD COLUMN volunteer_id INTEGER`, (err) => {
    // Ignore error if column already exists
    db.run(`UPDATE donations SET status = 'picked', volunteer_id = ? WHERE id = ? AND status = 'accepted'`, [req.user.id, donationId], function(updateErr) {
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      if (this.changes === 0) return res.status(400).json({ error: 'Donation not available to pick' });

      // Notify clients
      req.io.emit('donation_picked', { donation_id: donationId, volunteer_id: req.user.id, volunteer_name: req.user.name });
      res.json({ message: 'Donation picked up successfully' });
    });
  });
});

// PUT /api/volunteer/tasks/:id/deliver - Mark as delivered
router.put('/tasks/:id/deliver', authenticate, (req, res) => {
  if (req.user.role !== 'volunteer') return res.status(403).json({ error: 'Access denied' });

  const donationId = req.params.id;

  db.run(`UPDATE donations SET status = 'delivered' WHERE id = ? AND status = 'picked' AND volunteer_id = ?`, [donationId, req.user.id], function(updateErr) {
    if (updateErr) return res.status(500).json({ error: updateErr.message });
    if (this.changes === 0) return res.status(400).json({ error: 'Action not allowed' });

    // Notify clients
    req.io.emit('donation_delivered', { donation_id: donationId });
    res.json({ message: 'Donation delivered successfully' });
  });
});

module.exports = router;
