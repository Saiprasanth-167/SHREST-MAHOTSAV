require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('.'));
app.use('/public', express.static('public'));

// Routes for HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

app.get('/shrestregistration', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'shrestregistration.html'));
});

app.get('/events', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'events.html'));
});

app.get('/qrscanner', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'qrscanner.html'));
});

app.get('/celebration', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'celebration.html'));
});

// API Routes - Wrapper function for serverless functions
const wrapHandler = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (error) {
        console.error('API Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

app.all('/api/register', wrapHandler(require('./api/register')));
app.all('/api/send-otp', wrapHandler(require('./api/send-otp')));
app.all('/api/verify-otp', wrapHandler(require('./api/verify-otp')));
app.all('/api/upi-qr', wrapHandler(require('./api/upi-qr')));
app.all('/api/upi-config', wrapHandler(require('./api/upi-config')));
app.all('/api/validate-utr', wrapHandler(require('./api/validate-utr')));
app.all('/api/live-excel', wrapHandler(require('./api/live-excel')));
app.all('/api/download-excel', wrapHandler(require('./api/download-excel')));
app.all('/api/test', wrapHandler(require('./api/test')));

// Catch-all route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Only start server if not in serverless environment
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 SHREST MAHOTSAV Server running on port ${PORT}`);
    });
}

module.exports = app;