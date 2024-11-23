// routes/doctors.js

const express = require('express');
const router = express.Router();
const db = require('./db');

// GET all doctors
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM doctors');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
});
// doc managemnt by admin 

router.post('/add', async (req, res) => {
    const { first_name, last_name, specialization, email, phone, schedule } = req.body;

    try {
        await db.query(
            `INSERT INTO doctors (first_name, last_name, specialization, email, phone, schedule)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, specialization, email, phone, schedule]
        );
        res.status(201).json({ message: 'Doctor added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add doctor' });
    }
});


// display doctors list
router.get('/', async (req, res) => {
    try {
        const [doctors] = await db.query(`SELECT id, first_name, last_name, specialization, email, phone FROM doctors`);
        res.json(doctors);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
});

//allow doc and admin to update schedules
router.put('/:id', async (req, res) => {
    const doctorId = req.params.id;
    const { first_name, last_name, specialization, email, phone, schedule } = req.body;

    try {
        await db.query(
            `UPDATE doctors SET first_name = ?, last_name = ?, specialization = ?, email = ?, phone = ?, schedule = ?
             WHERE id = ?`,
            [first_name, last_name, specialization, email, phone, schedule, doctorId]
        );
        res.json({ message: 'Doctor updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update doctor' });
    }
});

// delete a doctor
router.delete('/:id', async (req, res) => {
    const doctorId = req.params.id;

    try {
        await db.query(`DELETE FROM doctors WHERE id = ?`, [doctorId]);
        res.json({ message: 'Doctor deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete doctor' });
    }
});



module.exports = router;
