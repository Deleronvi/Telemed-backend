// routes/appointments.js

const express = require('express');
const router = express.Router();
const db = require('./db');

// Middleware to check if the user is authenticated
//router.use((req, res, next) => {
  //  console.log('Session at Middlewares:', req.session);
    //if (!req.session.patientId) {
      //  return res.status(401).json({ error: 'Unauthorized' });
    //}
  ///  next();
//});

// Get all appointments for the logged-in patient
router.get('/', async (req, res) => {
    const patientId = req.session.patientId;

    try {
        const [appointments] = await db.query(
            `SELECT * FROM appointments WHERE patient_id = ?`,
            [patientId]
        );
        res.json(appointments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Book a new appointment (using patient_id from session)
router.post('/book', async (req, res) => {
    const { doctor_id, appointment_date, appointment_time } = req.body;
    const patient_id = req.session.patientId; // use the patientId from the session

    try {
        await db.query(
            `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time)
             VALUES (?, ?, ?, ?, 'scheduled')`,
            [patient_id, doctor_id, appointment_date, appointment_time]
        );
        res.status(201).json({ message: 'Appointment booked successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to book appointment' });
    }
});

// Get a specific appointment by ID (check patient authorization)
router.get('/:appointmentId', async (req, res) => {
    const patientId = req.session.patientId;
    const appointmentId = req.params.appointmentId;

    try {
        const [appointment] = await db.query(
            `SELECT * FROM appointments WHERE patient_id = ? AND id = ?`,
            [patientId, appointmentId]
        );
        if (appointment.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        res.json(appointment[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch appointment' });
    }
});

// Update an appointment by ID (check patient authorization)
router.put('/:appointmentId', async (req, res) => {
    const patientId = req.session.patientId;
    const appointmentId = req.params.appointmentId;
    const { appointment_date, appointment_time } = req.body;

    try {
        const result = await db.query(
            `UPDATE appointments SET appointment_date = ?, appointment_time = ? WHERE id = ? AND patient_id = ?`,
            [appointment_date, appointment_time, appointmentId, patientId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Appointment not found or not authorized' });
        }
        res.json({ message: 'Appointment rescheduled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reschedule appointment' });
    }
});

// Cancel an appointment by ID (check patient authorization)
router.delete('/:appointmentId', async (req, res) => {
    const patientId = req.session.patientId;
    const appointmentId = req.params.appointmentId;

    try {
        const result = await db.query(
            `UPDATE appointments SET status = 'canceled' WHERE id = ? AND patient_id = ?`,
            [appointmentId, patientId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Appointment not found or not authorized' });
        }
        res.json({ message: 'Appointment canceled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to cancel appointment' });
    }
});

module.exports = router;
