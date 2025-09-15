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
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }
  const client = await connectToDatabase();
  try {
    const result = await client.query('SELECT * FROM registrations ORDER BY timestamp DESC');
    const rows = result.rows;
    const headers = rows.length ? Object.keys(rows[0]) : ['name', 'regno', 'course', 'branch', 'section', 'year', 'campus', 'email', 'utr', 'amount', 'events', 'timestamp'];
    const htmlHead = `<th>Actions</th>` + headers.map(h => `<th>${h}</th>`).join('');
    const htmlRows = rows.length ? rows.map((r, idx) => {
        const cells = headers.map(h => {
          const val = String(r[h] ?? '');
          const key = h;
          const readOnly = h === 'utr';
          return `<td data-key="${key}">${readOnly ? `<span>${val}</span>` : `<input value="${val.replace(/"/g, '&quot;')}" />`}</td>`;
        }).join('');
        return `<tr data-index="${idx}"><td><button class="edit" data-i="${idx}">Edit</button> <button class="save" data-i="${idx}" style="display:none;">Save</button> <button class="cancel" data-i="${idx}" style="display:none;">Cancel</button> <button class="delete" data-i="${idx}">Delete</button></td>${cells}</tr>`;
      }).join('') :
      '<tr><td colspan="99">No registrations found.</td></tr>';
    const page = `<!DOCTYPE html>...` // The rest of your HTML code remains the same
    res.send(page);
  } catch (e) {
    console.error('Error rendering live excel:', e);
    res.status(500).send('Failed to render live excel.');
  } finally {
    await client.end();
  }
};