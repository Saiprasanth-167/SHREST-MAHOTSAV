const { Client } = require('pg');
const initializeDatabase = require('./db-init');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Database initialization failed:', error);
    return res.status(500).json({ valid: false, message: 'Database initialization failed.' });
  }

  const { utr } = req.body;
  if (!utr || !/^\d{12}$/.test(utr)) {
    return res.status(400).json({ valid: false, message: 'Invalid UTR number.' });
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
        return res.json({ valid: false, message: 'THIS UTR IS INVALID 😠' });
    } else {
        // UTR not found, so it's valid for registration
        return res.json({ valid: true, message: 'UTR is valid' });
    }
  } catch (e) {
    console.error('Error validating UTR:', e);
    return res.status(500).json({ valid: false, message: 'Server error validating UTR.' });
  } finally {
    if (client) {
      await client.end();
    }
  }
};
