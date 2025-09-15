const { Client } = require('pg');

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
  const client = await connectToDatabase();
  try {
    const data = req.body;
    const entry = { ...data, timestamp: new Date().toISOString() };
    const utrCheck = await client.query('SELECT COUNT(*) FROM registrations WHERE utr = $1', [entry.utr]);
    if (utrCheck.rows[0].count > 0) {
      return res.status(409).json({ success: false, message: 'Duplicate UTR number.' });
    }
    const insertQuery = `INSERT INTO registrations (name, regno, course, branch, section, year, campus, email, utr, amount, events, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
    const values = [entry.name, entry.regno, entry.course, entry.branch, entry.section, entry.year, entry.campus, entry.email, entry.utr, entry.amount, JSON.stringify(entry.events), entry.timestamp];
    await client.query(insertQuery, values);

    res.json({ success: true, message: 'Registration successful!' });
  } catch (e) {
    console.error('Error in /api/register:', e);
    res.status(500).json({ success: false, message: 'Failed to save registration.', error: e.message });
  } finally {
    await client.end();
  }
};