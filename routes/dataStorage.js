const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Local data storage configuration
const DATA_DIR = path.join(__dirname, '../data');
const REGISTRATIONS_FILE = path.join(DATA_DIR, 'registrations.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize registrations file if it doesn't exist
if (!fs.existsSync(REGISTRATIONS_FILE)) {
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify([], null, 2));
}

// Save registration data to local storage
router.post('/save-to-sheets', async (req, res) => {
    try {
        const registrationData = req.body;
        
        // Add timestamp if not present
        if (!registrationData.timestamp) {
            registrationData.timestamp = new Date().toISOString();
        }
        
        // Add unique ID
        registrationData.id = `REG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Read existing registrations
        let registrations = [];
        try {
            const data = fs.readFileSync(REGISTRATIONS_FILE, 'utf8');
            registrations = JSON.parse(data);
        } catch (error) {
            console.log('Creating new registrations file');
            registrations = [];
        }
        
        // Add new registration
        registrations.push(registrationData);
        
        // Save to file
        fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(registrations, null, 2));
        
        console.log(`New registration saved: ${registrationData.name} (${registrationData.regno})`);
        
        res.json({
            success: true,
            message: 'Registration data saved successfully',
            registrationId: registrationData.id
        });

    } catch (error) {
        console.error('Error saving registration data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save registration data',
            error: error.message
        });
    }
});

// Get all registrations (for admin use)
router.get('/registrations', async (req, res) => {
    try {
        let registrations = [];
        
        if (fs.existsSync(REGISTRATIONS_FILE)) {
            const data = fs.readFileSync(REGISTRATIONS_FILE, 'utf8');
            registrations = JSON.parse(data);
        }
        
        res.json({
            success: true,
            data: registrations,
            count: registrations.length
        });

    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registrations',
            error: error.message
        });
    }
});

// Export registrations as CSV (for organizers)
router.get('/export-csv', async (req, res) => {
    try {
        let registrations = [];
        
        if (fs.existsSync(REGISTRATIONS_FILE)) {
            const data = fs.readFileSync(REGISTRATIONS_FILE, 'utf8');
            registrations = JSON.parse(data);
        }
        
        if (registrations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No registrations found'
            });
        }
        
        // Create CSV headers
        const headers = [
            'ID', 'Timestamp', 'Name', 'Registration Number', 'Course', 'Branch', 
            'Section', 'Year', 'Campus', 'Payment Method', 'UTR', 'Transaction ID'
        ];
        
        // Create CSV rows
        const csvRows = [headers.join(',')];
        
        registrations.forEach(reg => {
            const row = [
                reg.id || '',
                reg.timestamp || '',
                reg.name || '',
                reg.regno || '',
                reg.course || '',
                reg.branch || '',
                reg.section || '',
                reg.year || '',
                reg.campus || '',
                reg.paymentMethod || '',
                reg.utr || '',
                reg.transactionId || ''
            ].map(field => `"${field}"`).join(',');
            
            csvRows.push(row);
        });
        
        const csvContent = csvRows.join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="shrest_registrations.csv"');
        res.send(csvContent);

    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export registrations',
            error: error.message
        });
    }
});

module.exports = router;
