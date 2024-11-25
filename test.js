const express = require('express');
const session = require('express-session');
const app = express();

app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.get('/', (req, res) => {
    if (!req.session.test) {
        req.session.test = 'Session initialized!';
        return res.send('Session created. Refresh the page!');
    }
    res.send(`Session data: ${req.session.test}`);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
