const { Client } = require('pg');
const xlsx = require('xlsx');

async function connectToDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

module.exports = async (req, res) => {
  let client;
  try {
    client = await connectToDatabase();
    const { rows } = await client.query('SELECT * FROM registrations ORDER BY timestamp DESC');

    // Exclude 'id' and format 'events'
      const data = rows.map(row => {
        const { id, ...rest } = row;
        if (rest.events) {
          let eventsValue = rest.events;
          // Try to parse as JSON array
          try {
            const eventsArray = JSON.parse(eventsValue);
            if (Array.isArray(eventsArray)) {
              rest.events = eventsArray.join(', ');
            } else {
              rest.events = String(eventsValue);
            }
          } catch {
            // If not JSON, check if it's a comma-separated string
            if (typeof eventsValue === 'string' && eventsValue.includes(',')) {
              rest.events = eventsValue;
            } else if (typeof eventsValue === 'string' && eventsValue.trim() !== '') {
              rest.events = eventsValue;
            } else {
              rest.events = '';
            }
          }
        } else {
          rest.events = '';
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

