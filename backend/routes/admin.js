const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-foodshare';

const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    if (verified.role !== 'admin') throw new Error('Not admin');
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Admin access required' });
  }
};

router.get('/analytics', authenticateAdmin, (req, res) => {
  const analytics = {};

  db.serialize(() => {
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => analytics.users = row?.count || 0);
    db.get('SELECT COUNT(*) as count FROM donations', (err, row) => analytics.donationsTotal = row?.count || 0);
    db.get('SELECT COUNT(*) as count FROM donations WHERE status = "delivered"', (err, row) => analytics.donationsDelivered = row?.count || 0);
    db.get('SELECT COUNT(*) as count FROM requests', (err, row) => {
      analytics.requests = row?.count || 0;
      res.json(analytics);
    });
  });
});

module.exports = router;
