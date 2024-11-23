// index.js

const express = require('express');
const app = express();
const port = process.env.PORT || 3600;
require('dotenv').config();

const patientsRoutes = require('./patients');
const doctorsRoutes = require('./doctors');
const appointmentsRoutes = require('./appointments');
const adminRoutes = require('./admin');

app.use(express.json()); // Middleware to parse JSON bodies

// Define routes
app.use('/patients', patientsRoutes);
app.use('/doctors', doctorsRoutes);
app.use('/appointments', appointmentsRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the Telemedicine API');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
