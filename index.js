require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// API routes - Required for local development
// On Vercel, these will be handled by serverless functions in api/ folder
// but locally, Express needs to handle them
app.all('/api/upi-qr', wrapHandler(require('./api/upi-qr')));
app.all('/api/validate-utr', wrapHandler(require('./api/validate-utr')));
app.all('/api/register', wrapHandler(require('./api/register')));
app.all('/api/live-excel', wrapHandler(require('./api/live-excel')));
app.all('/api/download-excel', wrapHandler(require('./api/download-excel')));
app.all('/api/registrations/:utr', wrapHandler(require('./api/registrations/[utr]')));
app.all('/api/upi-config', wrapHandler(require('./api/upi-config')));

// Catch-all route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Only start server if not in a serverless-like environment (this check is now simpler)
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production') { // A simple check to avoid running server during tests, for example.
    const initializeDatabase = require('./api/db-init');
    initializeDatabase().then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 SHREST MAHOTSAV Server running on port ${PORT}`);
        });
    }).catch(error => {
        console.error("⚠️ Database initialization warning (non-critical in development):", error.message);
        // In development, we allow the server to start even if DB init fails
        // The DB operations will fail at runtime, but frontend can still load
        console.log('🚀 Starting server despite database initialization error...');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 SHREST MAHOTSAV Server running on port ${PORT} (without database)`);
        });
    });
}

module.exports = app;