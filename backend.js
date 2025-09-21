const { exec } = require('child_process');
const path = require('path');
const express = require('express');
const fs = require('fs');

const otpStore = {};

console.log(' SHREST MAHOTSAV OTP System Initialized');
console.log(' Email-free OTP generation enabled');

async function sendOtp(email) {
    // Disabled: OTP verification is no longer required
    return {
        success: true,
        message: 'OTP verification disabled.'
    };
}

function verifyOtp(email, otp) {
    // Disabled: OTP verification is no longer required
    return { success: true };
}

// Function to get current OTP for debugging
function getCurrentOtp(email) {
    return otpStore[email] || null;
}

const bringAllRouter = express.Router();

// GET /bring-all: Run Python script and show download page
bringAllRouter.get('/', (req, res) => {
    const scriptPath = path.join(__dirname, 'fetch_all_registrations.py');
    exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send('Error running Python script: ' + stderr);
        }
        // Show download page
        res.send(`
            <html>
            <head><title>Bring All Registrations</title></head>
            <body>
                <h2>All registrations fetched!</h2>
                <a href="/bring-all/download"><button>Download Excel File</button></a>
            </body>
            </html>
        `);
    });
});

// GET /bring-all/download: Serve the generated Excel file
bringAllRouter.get('/download', (req, res) => {
    const filePath = path.join(__dirname, 'registrations_all.xlsx');
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Excel file not found. Please run /bring-all first.');
    }
    res.download(filePath, 'registrations_all.xlsx');
});

// Export the router for use in your main server file
module.exports = { sendOtp, verifyOtp, otpStore, getCurrentOtp, bringAllRouter };
