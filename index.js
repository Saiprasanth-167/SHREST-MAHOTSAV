require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// API Routes - Wrapper function for serverless functions
const wrapHandler = (handler) => async (req, res) => {
    try {
        // If the handler is an ES module or CommonJS module with default export
        const fn = handler.default || handler;
        await fn(req, res);
    } catch (error) {
        console.error('API Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

// Middleware
app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files - AFTER API routes to prevent shadowing
// app.use(express.static('.')); // This is dangerous as it exposes backend code
app.use('/public', express.static('public'));

// Routes for HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Route definitions with higher priority
const liveExcelHandler = require('./api/live-excel');
app.get('/live-excel', wrapHandler(liveExcelHandler.default || liveExcelHandler));

const downloadExcelHandler = require('./api/download-excel');
app.get('/download-excel', wrapHandler(downloadExcelHandler.default || downloadExcelHandler));

// Explicit route for API access as well (if needed by frontend JS)
app.all('/api/live-excel', wrapHandler(liveExcelHandler.default || liveExcelHandler));
app.all('/api/download-excel', wrapHandler(downloadExcelHandler.default || downloadExcelHandler));


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

// Make API endpoints explicitly available through Express too, for robustness
// BUT: Skip this in production (Vercel) where serverless functions handle /api/*
if (process.env.NODE_ENV !== 'production') {
    app.all('/api/live-excel', wrapHandler(require('./api/live-excel')));
    app.all('/api/download-excel', wrapHandler(require('./api/download-excel')));
    app.all('/api/register', wrapHandler(require('./api/register')));
    app.all('/api/validate-utr', wrapHandler(require('./api/validate-utr')));
    app.all('/api/upi-config', wrapHandler(require('./api/upi-config')));
    app.all('/api/upi-qr', wrapHandler(require('./api/upi-qr')));
    app.all('/api/registrations/:utr', wrapHandler(require('./api/registrations/[utr]')));
}

// Catch-all route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Only start server if not in a serverless-like environment (this check is now simpler)
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'production') { // A simple check to avoid running server during tests, for example.
    const initializeDatabase = require('./api/db-init');
    initializeDatabase()
        .then(() => {
            console.log('Database initialized successfully');
        })
        .catch(error => {
            console.warn("Database initialization failed (continuing anyway):", error.message);
        })
        .finally(() => {
            app.listen(PORT, '0.0.0.0', () => {
                console.log(`🚀 SHREST MAHOTSAV Server running on port ${PORT}`);
            });
        });
}

module.exports = app;