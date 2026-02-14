const { Client } = require('pg');
const qr = require('qrcode');
const initializeDatabase = require('./db-init');

async function connectToDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Database initialization failed:', error);
    return res.status(500).json({ success: false, message: 'Database initialization failed.' });
  }

  let client;
  try {
    client = await connectToDatabase();
  } catch (e) {
    console.error('Database connection failed:', e);
    return res.status(500).json({ success: false, message: 'Database connection failed.', error: e.message });
  }

  try {
    const data = req.body;
    const entry = { ...data, timestamp: new Date().toISOString() };
    const utrCheck = await client.query('SELECT COUNT(*) FROM registrations WHERE utr = $1', [entry.utr]);
    if (utrCheck.rows[0].count > 0) {
      return res.status(409).json({ success: false, message: 'Duplicate UTR number.' });
    }
    const insertQuery = `INSERT INTO registrations (name, regno, mobile, course, branch, section, year, campus, utr, amount, events, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
    const values = [entry.name, entry.regno, entry.mobile, entry.course, entry.branch, entry.section, entry.year, entry.campus, entry.utr, entry.amount, JSON.stringify(entry.events), entry.timestamp];
    const result = await client.query(insertQuery, values);
    const newReg = result.rows[0];

    // Generate QR code
    const qrData = JSON.stringify({
      name: newReg.name,
      regno: newReg.regno,
      campus: newReg.campus,
      utr: newReg.utr,
      amount: newReg.amount,
      events: newReg.events,
      ts: newReg.timestamp
    });
    const qrUrl = await qr.toDataURL(qrData);

    res.json({ success: true, message: 'Registration successful!', qrUrl: qrUrl });
  } catch (e) {
    console.error('Error in /api/register:', e);
    res.status(500).json({ success: false, message: 'Failed to save registration.', error: e.message });
  } finally {
    if (client) {
      await client.end();
    }
  }
};