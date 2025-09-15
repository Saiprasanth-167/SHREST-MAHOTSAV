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
  let { utr } = req.body || {};
  utr = (utr || '').toString().trim();
  
  if (!utr || utr.length !== 12 || !/^\d{12}$/.test(utr)) {
    return res.json({ valid: false, duplicate: false, message: 'Invalid UTR number.' });
  }
  
  // UTR format is valid, now check for duplicates in database
  try {
    const client = await connectToDatabase();
    try {
      const result = await client.query('SELECT COUNT(*) FROM registrations WHERE utr = $1', [utr]);
      const duplicate = result.rows[0].count > 0;
      return res.json({ valid: true, duplicate });
    } finally {
      await client.end();
    }
  } catch (dbError) {
    // If database is unavailable, allow UTR validation to proceed
    return res.json({ valid: true, duplicate: false });
  }
};