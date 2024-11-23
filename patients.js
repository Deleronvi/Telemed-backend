// routes/patients.js

const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcrypt');

// GET all patients
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM patients');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

// Add a new patient
router.post('/', async (req, res) => {
    const { first_name, last_name, email, password_hash, phone, date_of_birth, gender, address } = req.body;

    try {
        const result = await db.query(
            `INSERT INTO patients (first_name, last_name, email, password_hash, phone, date_of_birth, gender, address)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, password_hash, phone, date_of_birth, gender, address]
        );
        res.json({ message: 'Patient added', patientId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add patient' });
    }
});



// registration
router.post('/register', async (req, res) => {
    const { first_name, last_name, email, password, phone, date_of_birth, gender, address } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // Insert patient into the database
        const result = await db.query(
            `INSERT INTO patients (first_name, last_name, email, password_hash, phone, date_of_birth, gender, address)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, hashedPassword, phone, date_of_birth, gender, address]
        );

        res.status(201).json({ message: 'Patient registered successfully', patientId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to register patient' });
    }
});

// log in 
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [patient] = await db.query(`SELECT * FROM patients WHERE email = ?`, [email]);
        if (!patient) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, patient.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.patientId = patient.id;
        res.json({ message: 'Logged in successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to log in' });
    }
});

// profile view
router.get('/profile', (req, res) => {
    if (!req.session.patientId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    db.query(`SELECT first_name, last_name, phone, date_of_birth, gender, address FROM patients WHERE id = ?`, [req.session.patientId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }
        res.json(results[0]);
    });
});

router.put('/profile', async (req, res) => {
    if (!req.session.patientId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { first_name, last_name, phone, date_of_birth, gender, address } = req.body;

    try {
        await db.query(
            `UPDATE patients SET first_name = ?, last_name = ?, phone = ?, date_of_birth = ?, gender = ?, address = ?
             WHERE id = ?`,
            [first_name, last_name, phone, date_of_birth, gender, address, req.session.patientId]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/// log out
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Failed to log out' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

//admin acess
router.get('/', async (req, res) => {
    if (!req.session.admin) {
        return res.status(403).json({ error: 'Unauthorized access' });
    }

    try {
        const [patients] = await db.query(`SELECT id, first_name, last_name, email, phone FROM patients`);
        res.json(patients);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

// delete account
router.delete('/delete', async (req, res) => {
    if (!req.session.patientId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await db.query(`DELETE FROM patients WHERE id = ?`, [req.session.patientId]);
        req.session.destroy(); // End session upon deletion
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});


module.exports = router;
