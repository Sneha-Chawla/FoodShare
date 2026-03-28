const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// JWT Secret (in production, use process.env.JWT_SECRET)
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-foodshare';

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password, role, location } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `INSERT INTO users (name, email, password, role, location) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [name, email, hashedPassword, role, location], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      const userId = this.lastID;
      const token = jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '24h' });

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: { id: userId, name, email, role, location }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, location: user.location }
    });
  });
});

module.exports = router;
