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
  console.log('Received UTR:', JSON.stringify(utr), 'Length:', utr.length, 'Type:', typeof utr);
  console.log('Regex test result:', /^\d{12}$/.test(utr));
  
  if (!utr || utr.length !== 12 || !/^\d{12}$/.test(utr)) {
    console.log('UTR validation failed - Length:', utr.length, 'Regex:', /^\d{12}$/.test(utr));
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
    console.error('Database connection error in /api/validate-utr:', dbError.message);
    // If database is unavailable, still allow UTR validation to proceed
    // In production, you might want to return an error or check a cache
    return res.json({ valid: true, duplicate: false, message: 'UTR format valid (database check skipped)' });
  }
};