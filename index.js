require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const apiRouter = require('./routes/api'); // Import the new API router

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static Files ---
// Serve assets like CSS, JS, images from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---
// All API requests will be handled by the router defined in 'routes/api.js'
app.use('/api', apiRouter);

// --- Page Routes ---
// Serve the main entry page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Serve other HTML pages from the 'public' directory
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

// The /live-excel page is now served via the API router
// This avoids route conflicts and keeps the logic together.
app.get('/live-excel', (req, res) => {
    // This redirects the browser to the API endpoint that generates the page
    res.redirect('/api/live-excel');
});

// --- Catch-all for 404 ---
// This should be the last route
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'home.html'));
});


// --- Server Startup ---
if (process.env.NODE_ENV !== 'test') {
    const initializeDatabase = require('./api/db-init');
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