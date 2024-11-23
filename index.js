// index.js

const express = require('express');
const app = express();
const port = process.env.PORT || 3600;
require('dotenv').config();

const patientsRoutes = require('./patients');
const doctorsRoutes = require('./doctors');
const appointmentsRoutes = require('./appointments');
const adminRoutes = require('./admin');
const authRoutes = require('./auth');
const cors = require('cors');
const helmet = require('helmet');

app.use(express.json()); // Middleware to parse JSON bodies

// Define routes
app.use('/patients', patientsRoutes);
app.use('/doctors', doctorsRoutes);
app.use('/appointments', appointmentsRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use(cors());
app.use(helmet());

app.get('/', (req, res) => {
    res.send('Welcome to the Telemedicin API');
});

console.log('Available routes:');
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        console.log(middleware.route.path);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

app.use((req, res, next) => {
    res.status(404).json({ error: 'Route no found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

