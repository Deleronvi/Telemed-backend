// routes/admin.js

const express = require('express');
const router = express.Router();
const db = require('./db');

// Admin can manage doctors
router.get('/doctors', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM doctors');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch doctors for admin' });
    }
});

module.exports = router;
