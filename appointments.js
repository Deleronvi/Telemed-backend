// routes/appointments.js

const express = require('express');
const router = express.Router();
const db = require('./db');

// GET all appointments
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM appointments');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Book an appointment
router.post('/book', async (req, res) => {
    const { patient_id, doctor_id, appointment_date, appointment_time } = req.body;

    try {
        await db.query(
            `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status)
             VALUES (?, ?, ?, ?, 'scheduled')`,
            [patient_id, doctor_id, appointment_date, appointment_time]
        );
        res.status(201).json({ message: 'Appointment booked successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to book appointment' });
    }
});


// Get all appointments for a logged-in patient
router.get('/appointments', async (req, res) => {
    if (!req.session.patientId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const [appointments] = await db.query(
            `SELECT * FROM appointments WHERE patient_id = ?`,
            [req.session.patientId]
        );
        res.json(appointments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Update an appointment
router.put('/appointments/:id', async (req, res) => {
    const appointmentId = req.params.id;
    const { appointment_date, appointment_time } = req.body;

    try {
        await db.query(
            `UPDATE appointments SET appointment_date = ?, appointment_time = ? WHERE id = ?`,
            [appointment_date, appointment_time, appointmentId]
        );
        res.json({ message: 'Appointment rescheduled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reschedule appointment' });
    }
});


// Cancel an appointment
router.delete('/appointments/:id', async (req, res) => {
    const appointmentId = req.params.id;

    try {
        await db.query(`UPDATE appointments SET status = 'canceled' WHERE id = ?`, [appointmentId]);
        res.json({ message: 'Appointment canceled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to cancel appointment' });
    }
});



module.exports = router;
