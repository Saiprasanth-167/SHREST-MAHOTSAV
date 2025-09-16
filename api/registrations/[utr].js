const { Client } = require('pg');

async function connectToDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

async function handleRequest(req, res) {
  const { utr } = req.params; // Correctly get UTR from URL path
  let client;

  try {
    client = await connectToDatabase();

    if (req.method === 'GET') {
      // Get registration by UTR
      const result = await client.query('SELECT * FROM registrations WHERE utr = $1', [utr]);
      const registration = result.rows[0];

      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      return res.status(200).json({
        message: 'Registration retrieved successfully',
        registration
      });
    }

    if (req.method === 'POST') {
      // Update registration status
      const { status } = req.body;
      
      await client.query('UPDATE registrations SET status = $1 WHERE utr = $2', [status || 'pending', utr]);
      return res.status(200).json({
        message: 'Registration updated successfully',
        utr: utr,
        status: status || 'pending'
      });
    }

    if (req.method === 'PUT') {
      const data = req.body;
      if (!data || typeof data !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid data format.' });
      }
      
      const updateableFields = ['name', 'mobile', 'course', 'branch', 'section', 'year', 'campus', 'amount', 'events'];
      const queryParts = [];
      const queryValues = [];
      let valueIndex = 1;

      for (const field of updateableFields) {
        if (data.hasOwnProperty(field)) {
          queryParts.push(`${field} = $${valueIndex++}`);
          let value = data[field];
          // The 'events' field from the form will be a comma-separated string.
          // The database expects a JSON array string, so we convert it.
          if (field === 'events' && typeof value === 'string') {
            // Split the string into an array, trim whitespace from each item
            const eventsArray = value.split(',').map(event => event.trim());
            // Convert the array to a JSON string for DB storage
            value = JSON.stringify(eventsArray);
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

    } else if (req.method === 'DELETE') {
      if (!utr) {
        return res.status(400).json({ success: false, message: 'UTR is required for deletion.' });
      }
      await client.query('DELETE FROM registrations WHERE utr = $1', [utr]);
      res.json({ success: true, message: 'Registration deleted successfully.' });

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (e) {
    console.error(`Error in /api/registrations/[utr].js for UTR ${utr}:`, e);
    res.status(500).json({ success: false, message: 'An internal server error occurred.', error: e.message });
  } finally {
    if (client) {
      await client.end();
    }
  }
}

module.exports = handleRequest;