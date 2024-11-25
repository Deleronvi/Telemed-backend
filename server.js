// Importing required modules
const express = require('express');
const session = require('express-session'); 
const db = require('./db'); 

// Import your route files
const patientsRouter = require('./patients');
const doctorsRouter = require('./doctors');
const appointmentsRouter = require('./appointments');

// Create an instance of express
const app = express();
const port = 3600;

// Middleware for handling sessions
app.use(session({
    secret: 'deleron1', 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false,
        httpOnly: true
     } 
}));



// Middleware for parsing JSON bodies
app.use(express.json()); // To handle JSON request bodies
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log('Session at middleware:', req.session);
    next();
});


// Use the routes
app.use('/patients', patientsRouter);
app.use('/doctors', doctorsRouter);
app.use('/appointments', appointmentsRouter);


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

