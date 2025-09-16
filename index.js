const express = require('express');
const cors = require('cors');
const path = require('path');

// API route handlers
const registerHandler = require('./api/register');
const upiQrHandler = require('./api/upi-qr');
const upiConfigHandler = require('./api/upi-config');
const validateUtrHandler = require('./api/validate-utr');
const liveExcelHandler = require('./api/live-excel');
const downloadExcelHandler = require('./api/download-excel.js');
const registrationUtrHandler = require('./api/registrations/[utr].js');
const initializeDatabase = require('./api/db-init.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory first
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.post('/api/register', wrap(registerHandler));
app.get('/api/upi-qr', wrap(upiQrHandler));
app.get('/api/upi-config', wrap(upiConfigHandler));
app.post('/api/validate-utr', wrap(validateUtrHandler));
app.get('/api/live-excel', wrap(liveExcelHandler));
app.get('/api/download-excel', wrap(downloadExcelHandler));
app.get('/api/registrations/:utr', wrap(registrationUtrHandler));
app.put('/api/registrations/:utr', wrap(registrationUtrHandler));
app.delete('/api/registrations/:utr', wrap(registrationUtrHandler));

// Serve HTML pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'home.html')));
app.get('/shrestregistration', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shrestregistration.html')));
app.get('/events', (req, res) => res.sendFile(path.join(__dirname, 'public', 'events.html')));
app.get('/qrscanner', (req, res) => res.sendFile(path.join(__dirname, 'public', 'qrscanner.html')));
app.get('/celebration', (req, res) => res.sendFile(path.join(__dirname, 'public', 'celebration.html')));
app.get('/live-excel', wrap(liveExcelHandler)); // Also serve live excel on a clean URL

// Catch-all for any other requests - serves home.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err);
    if (!res.headersSent) {
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
});

// Start server
if (process.env.NODE_ENV !== 'test') {
    initializeDatabase().then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 SHREST MAHOTSAV Server running on port ${PORT}`);
        });
    }).catch(error => {
        console.error("Failed to initialize database. Server not started.", error);
        process.exit(1);
    });
}

module.exports = app;
