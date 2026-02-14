const { Client } = require('pg');
const initializeDatabase = require('./db-init');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ valid: false, message: 'Method Not Allowed' });
  }

  // Check DATABASE_URL first
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not configured');
    return res.status(500).json({ valid: false, message: 'Database not configured. Contact admin.' });
  }

  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Continue anyway - tables might already exist
  }

  const { utr } = req.body;
  if (!utr || !/^\d{12}$/.test(utr)) {
    return res.status(200).json({ valid: false, message: 'Invalid UTR number format. Must be 12 digits.' });
  }
  
  let client;
  try {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    const { rows } = await client.query('SELECT * FROM registrations WHERE utr = $1', [utr]);
    
    if (rows.length > 0) { 
      // UTR exists, so it's invalid for new registration
      return res.status(200).json({ valid: false, message: 'THIS UTR IS INVALID 😠' });
    } else {
      // UTR not found, so it's valid for registration
      return res.status(200).json({ valid: true, message: 'UTR is valid' });
    }
  } catch (e) {
    console.error('Error validating UTR:', e);
    return res.status(500).json({ valid: false, message: 'Server error validating UTR. Please try again.' });
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
    }
  }
};
