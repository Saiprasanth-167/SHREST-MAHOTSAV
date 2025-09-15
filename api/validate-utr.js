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
    return res.status(405).send('Method Not Allowed');
  }
  const { utr } = req.body || {};
  if (!/^\d{12}$/.test(utr || '')) {
    return res.json({ valid: false, duplicate: false, message: 'Invalid UTR number.' });
  }
  const client = await connectToDatabase();
  try {
    const result = await client.query('SELECT COUNT(*) FROM registrations WHERE utr = $1', [utr]);
    const duplicate = result.rows[0].count > 0;
    return res.json({ valid: true, duplicate });
  } catch (e) {
    console.error('Error in /api/validate-utr:', e);
    return res.status(500).json({ success: false, message: 'Validation error.' });
  } finally {
    await client.end();
  }
};