const { Client } = require('pg');
const xlsx = require('xlsx');
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
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Database initialization failed:', error);
    return res.status(500).send('Database initialization failed.');
  }

  let client;
  try {
    client = await connectToDatabase();
    const { rows } = await client.query('SELECT * FROM registrations ORDER BY timestamp DESC');

    // Format 'events' column and remove timezone from datetimes
    const data = rows.map(row => {
      const { id, ...rest } = row;
      // Format events column
      if (rest.events) {
        if (Array.isArray(rest.events)) {
          rest.events = rest.events.join(', ');
        } else if (typeof rest.events === 'object') {
          rest.events = JSON.stringify(rest.events);
        } else {
          // If it's a string, try to parse it in case it was stored as a stringified string
          try {
            const parsed = JSON.parse(rest.events);
            if (Array.isArray(parsed)) {
              rest.events = parsed.join(', ');
            } else {
              rest.events = String(parsed);
            }
          } catch {
            rest.events = String(rest.events);
          }
        }
      } else {
        rest.events = '';
      }
      // Remove timezone from datetime columns
      if (rest.timestamp && typeof rest.timestamp === 'string' && rest.timestamp.includes('+')) {
        rest.timestamp = rest.timestamp.split('+')[0];
      }
      return rest;
    });

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Registrations');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="registrations.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    console.error('Error generating excel file:', e);
    res.status(500).send('Failed to generate excel file: ' + e.message);
  } finally {
    if (client) {
      await client.end();
    }
  }
};

