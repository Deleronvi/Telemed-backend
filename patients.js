// routes/patients.js

const express = require('express');
const authRouter = require('./auth');
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const { generateToken } = authRouter;
const router = express.Router();



router.use(express.json());

router.use((req, res, next) => {
    console.log('Session middleware check:', req.session);
    next();
});

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
            `INSERT INTO patients (first_name, last_name, email, password_hash, phone, date_of_birth, gender)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, password_hash, phone, date_of_birth, gender]
        );
        res.json({ message: 'Patient added', patientId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add patient' });
    }
});



// registration
router.post('/register', async (req, res) => {
    const { first_name, last_name, email, password, phone, date_of_birth, gender} = req.body;

    if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Password must be a valid string' });
    }
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Insert patient into the database
        const result = await db.query(
            `INSERT INTO patients (first_name, last_name, email, password_hash, phone, date_of_birth, gender)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, hashedPassword, phone, date_of_birth, gender]
        );

        res.status(201).json({ message: 'Patient registered successfully', 
            patientId: result.insertId,
            name: first_name,
            email: email
         });
       
    } catch (err) {
        console.error('Error hashing password:', err)
        res.status(500).json({ error: 'Failed to register patient' });
    }
});

// log in 
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Session before any action:', req.session); 
    console.log('Email:', email);
    console.log("password from reques:", password)

    console.log('Request body:', req.body);

    try {
        const [patients] = await db.query(`SELECT * FROM patients WHERE email = ?`, [email]);
        if (patients.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const patient = patients[0];
       

        const match = await bcrypt.compare(password, patient.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
  
        // Fetch upcoming appointments
        const [upcomingAppointments] = await db.query(
            `SELECT doctor_id, appointment_date, appointment_time
             FROM appointments 
             WHERE patient_id = ? AND appointment_date >= CURDATE() 
             ORDER BY appointment_date, appointment_time`,
            [patient.id]
        );

        // Fetch appointment history
        const [appointmentHistory] = await db.query(
            `SELECT doctor_id, appointment_date, status 
             FROM appointments 
             WHERE patient_id = ? AND appointment_date < CURDATE() 
             ORDER BY appointment_date DESC`, 
            [patient.id]
        );
        
        req.session.patientId = patient.id;
        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Session failed to save' });
            }
            console.log('Session after saving:', req.session);

            const token = generateToken(patient.id);
        res.json({ 
            message: 'Logged in successfully',
            patientId: patient.id,
            token,
            name: patient.first_name,
            email: patient.email,
             appointments: {
                upcoming: upcomingAppointments,
                history: appointmentHistory,
            }
        });
    }); 
} catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to log in' });
    }
});

// profile view
router.get('/profile', (req, res) => {
    console.log('Session data in profile route:', req.session);
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

// Get appointments
router.get('/appointments/:id', (req, res) => {
    const patientId = req.params.id;
    console.log('Session data:', req.session);
    console.log('Requested patientId:', patientId);
    console.log('Session patientId:', req.session.patientId);

    //if (!req.session.patientId) {
      //  return res.status(401).json({ error: 'Unauthorized' });
//    }

    const query = `
        SELECT a.id, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
               a.appointment_date, a.appointment_time, a.status
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.patient_id = ? AND a.appointment_date >= CURDATE()
        ORDER BY a.appointment_date, a.appointment_time
    `;

    db.query(query, [patientId], (err, results) => {
        if (err) {
            console.error('Error fetching appointments:', err);
            return res.status(500).json({ error: 'Failed to fetch appointments' });
        }

        res.json({ appointments: results });
    });
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
router.get('/admin', async (req, res) => {
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

router.get('/test-session', (req, res) => {
    try {
        console.log('Session data:', req.session); // Log session details for debugging
        if (req.session && req.session.patientId) {
            res.json({ message: 'Session exists', session: req.session });
        } else {
            res.json({ message: 'No session available' });
        }
    } catch (error) {
        console.error('Error in /test-session:', error);
        res.status(500).json({ error: 'Something went wrong!' });
    }
});



module.exports = router;
