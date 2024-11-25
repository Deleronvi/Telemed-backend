//auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db'); 

const router = express.Router();

// Secret key for JWT
const JWT_SECRET = 'your_secret_key'; // Store securely in environment variables

// User Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Query user from database
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        const user = rows[0];
        console.log(user);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }


        // Check password
        console.log('Plain password:', password);
console.log('Hashed password from DB:', user.password);

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        console.log('Password from request:', password);
        console.log('Hashed password from DB:', user.password);
        
        if (typeof password !== 'string' || typeof user.password !== 'string') {
            return res.status(400).json({ message: 'Password or hashed password is not valid.' });
        }
        


        // Generate JWT token
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        return res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


router.post('/register', async (req, res) => {
    const { email, password, role } = req.body; 

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into database
        await db.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [
            email,
            hashedPassword,
            role,
        ]);

        return res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Token Verification Middleware
router.get('/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access token missing.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.status(200).json({ message: 'Token valid', decoded });
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
});

module.exports = router;
