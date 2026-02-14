const { Client } = require('pg');
const initializeDatabase = require('../db-init');

// Function to connect to the database
async function connectToDatabase() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    await client.connect();
    return client;
}

// Main handler for the serverless function
module.exports = async (req, res) => {
    try {
        await initializeDatabase();
    } catch (error) {
        console.error('Database initialization failed:', error);
        return res.status(500).json({ success: false, message: 'Database initialization failed.' });
    }

    const { utr } = req.params; // Using Express req.params for dynamic routes
    let client;

    try {
        client = await connectToDatabase();

        // Handle PUT request to update a registration
        if (req.method === 'PUT') {
            const data = req.body;
            if (!data || typeof data !== 'object') {
                return res.status(400).json({ success: false, message: 'Invalid data format.' });
            }

            // Define the fields that are allowed to be updated
            const updateableFields = ['name', 'course', 'branch', 'section', 'year', 'campus', 'amount', 'events'];
            const queryParts = [];
            const queryValues = [];
            let valueIndex = 1;

            for (const field of updateableFields) {
                if (data.hasOwnProperty(field)) {
                    queryParts.push(`${field} = $${valueIndex++}`);
                    let value = data[field];
                    // Ensure 'events' is stored as a JSON string if it's an array
                    if (field === 'events' && Array.isArray(value)) {
                        value = JSON.stringify(value);
                    }
                    queryValues.push(value);
                }
            }

            if (queryParts.length === 0) {
                return res.status(400).json({ success: false, message: 'No updateable fields provided.' });
            }

            queryValues.push(utr);
            const updateQuery = `UPDATE registrations SET ${queryParts.join(', ')} WHERE utr = $${valueIndex}`;
            
            await client.query(updateQuery, queryValues);
            res.json({ success: true, message: 'Registration updated successfully.' });

        // Handle DELETE request to remove a registration
        } else if (req.method === 'DELETE') {
            if (!utr) {
                return res.status(400).json({ success: false, message: 'UTR is required for deletion.' });
            }
            await client.query('DELETE FROM registrations WHERE utr = $1', [utr]);
            res.json({ success: true, message: 'Registration deleted successfully.' });

        // Handle GET request to fetch a registration
        } else if (req.method === 'GET') {
            if (!utr) {
                return res.status(400).json({ success: false, message: 'UTR is required.' });
            }
            const { rows } = await client.query('SELECT * FROM registrations WHERE utr = $1', [utr]);
            if (rows.length > 0) {
                res.json({ success: true, registration: rows[0] });
            } else {
                res.status(404).json({ success: false, message: 'Registration not found.' });
            }

        // Handle other methods
        } else {
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (e) {
        // Log the error for debugging
        console.error(`Error in /api/registrations/[utr].js for UTR ${utr}:`, e);
        res.status(500).json({ success: false, message: 'An internal server error occurred.', error: e.message });
    } finally {
        // Ensure the database client is closed
        if (client) {
            await client.end();
        }
    }
};