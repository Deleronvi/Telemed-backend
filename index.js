// index.js

const express = require('express');
const app = express();
const port = process.env.PORT || 3600;
require('dotenv').config();
const session = require('express-session'); 
const db = require('./db'); 

const patientsRoutes = require('./patients');
const doctorsRoutes = require('./doctors');
const appointmentsRoutes = require('./appointments');
const adminRoutes = require('./admin');
const authRoutes = require('./auth');
const cors = require('cors');
const helmet = require('helmet');

// Middleware for handling sessions
app.use(session({
    secret: 'deleron1', 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false,
        httpOnly: true,
        maxAge: 3600000
     } 
}));
app.use((req, res, next) => {
    console.log('Session middleware check:', req.session);
    next();
})

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

app.get('/test-session', (req, res) => {
    if (!req.session.views) {
        req.session.views = 1;
    } else {
        req.session.views++;
    }
    res.json({ message: `Session is working. Views: ${req.session.views}` });
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

