const express = require('express');
const { Client } = require('pg');
const qr = require('qrcode');
const xlsx = require('xlsx');

const router = express.Router();

// --- Database Connection ---
async function connectToDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

// --- Middleware to wrap handlers with error catching and DB connection ---
const apiHandler = (handler) => async (req, res) => {
  let client;
  try {
    client = await connectToDatabase();
    await handler(req, res, client);
  } catch (error) {
    console.error('API Route Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'An internal server error occurred.', error: error.message });
    }
  } finally {
    if (client) {
      await client.end();
    }
  }
};

// --- API Route Definitions ---

// Registration
router.post('/register', apiHandler(async (req, res, client) => {
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
}));

// Get/Update/Delete a specific registration
router.route('/registrations/:utr')
  .get(apiHandler(async (req, res, client) => {
    const { utr } = req.params;
    const { rows } = await client.query('SELECT * FROM registrations WHERE utr = $1', [utr]);
    if (rows.length > 0) {
      res.json({ success: true, registration: rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'Registration not found.' });
    }
  }))
  .put(apiHandler(async (req, res, client) => {
    const { utr } = req.params;
    const data = req.body;
    const updateableFields = ['name', 'course', 'branch', 'section', 'year', 'campus', 'amount', 'events'];
    const queryParts = [];
    const queryValues = [];
    let valueIndex = 1;

    for (const field of updateableFields) {
      if (data.hasOwnProperty(field)) {
        queryParts.push(`${field} = $${valueIndex++}`);
        queryValues.push(Array.isArray(data[field]) ? JSON.stringify(data[field]) : data[field]);
      }
    }

    if (queryParts.length === 0) {
      return res.status(400).json({ success: false, message: 'No updateable fields provided.' });
    }

    queryValues.push(utr);
    const updateQuery = `UPDATE registrations SET ${queryParts.join(', ')} WHERE utr = $${valueIndex}`;
    await client.query(updateQuery, queryValues);
    res.json({ success: true, message: 'Registration updated successfully.' });
  }))
  .delete(apiHandler(async (req, res, client) => {
    const { utr } = req.params;
    await client.query('DELETE FROM registrations WHERE utr = $1', [utr]);
    res.json({ success: true, message: 'Registration deleted successfully.' });
  }));

// Live Excel HTML Page
router.get('/live-excel', apiHandler(async (req, res, client) => {
    const { rows } = await client.query('SELECT * FROM registrations ORDER BY timestamp DESC');
    const headers = ['name', 'regno', 'mobile', 'course', 'branch', 'section', 'year', 'campus', 'utr', 'amount', 'events', 'timestamp'];
    const htmlHead = `<th>Actions</th>` + headers.map(h => `<th>${h}</th>`).join('');
    const htmlRows = rows.map(r => {
        const cells = headers.map(h => {
          let val = r[h];
          if (h === 'events' && val) { try { val = JSON.parse(val).join(', '); } catch {} }
          val = String(val ?? '');
          const readOnly = ['utr', 'timestamp', 'regno'].includes(h);
          return `<td data-key="${h}">${readOnly ? `<span>${val}</span>` : `<input value="${val.replace(/"/g, '&quot;')}" />`}</td>`;
        }).join('');
        return `<tr data-utr="${r.utr}"><td><button class="edit">Edit</button><button class="save" style="display:none;">Save</button><button class="cancel" style="display:none;">Cancel</button><button class="delete">Delete</button></td>${cells}</tr>`;
      }).join('') || '<tr><td colspan="13">No registrations found.</td></tr>';

    const page = `
      <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Live Registrations</title>
      <style>
        body { font-family: sans-serif; background-color: #f4f4f9; color: #333; margin: 0; padding: 20px; }
        h1 { text-align: center; color: #444; }
        .controls { text-align: right; margin-bottom: 20px; }
        .download { background-color: #008CBA; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; box-shadow: 0 2px 15px rgba(0,0,0,0.1); background-color: #fff; }
        th, td { padding: 12px 15px; border: 1px solid #ddd; text-align: left; white-space: nowrap; }
        th { background-color: #4CAF50; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        input { width: 95%; padding: 5px; border: 1px solid #ccc; border-radius: 4px; }
        button { padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px; }
        .edit { background-color: #ffc107; } .save { background-color: #28a745; color: white; }
        .cancel { background-color: #6c757d; color: white; } .delete { background-color: #f44336; color: white; }
      </style></head><body>
      <h1>Live Registration Data</h1>
      <div class="controls"><a href="/api/download-excel" class="download">Download Excel</a></div>
      <div style="overflow-x:auto;"><table><thead><tr>${htmlHead}</tr></thead><tbody>${htmlRows}</tbody></table></div>
      <script>
        document.body.addEventListener('click', function(e) {
          const target = e.target; const row = target.closest('tr'); if (!row) return;
          if (target.classList.contains('edit')) {
            row.querySelectorAll('input').forEach(i => i.style.display='block'); row.querySelectorAll('span').forEach(s => s.style.display='none');
            target.style.display='none'; row.querySelector('.save').style.display='inline-block'; row.querySelector('.cancel').style.display='inline-block';
          }
          if (target.classList.contains('cancel')) {
            row.querySelectorAll('input').forEach(i => i.style.display='none'); row.querySelectorAll('span').forEach(s => s.style.display='block');
            row.querySelector('.edit').style.display='inline-block'; row.querySelector('.save').style.display='none'; row.querySelector('.cancel').style.display='none';
          }
          if (target.classList.contains('delete')) {
            if (confirm('Delete this registration?')) {
              fetch('/api/registrations/' + row.dataset.utr, { method: 'DELETE' })
                .then(res => res.ok ? row.remove() : alert('Failed to delete.'));
            }
          }
          if (target.classList.contains('save')) {
            const data = {};
            row.querySelectorAll('td[data-key]').forEach(td => {
              const input = td.querySelector('input');
              if (input) data[td.dataset.key] = input.value;
            });
            fetch('/api/registrations/' + row.dataset.utr, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
            }).then(res => res.json()).then(result => {
              if (result.success) {
                alert('Saved!');
                row.querySelectorAll('td[data-key]').forEach(td => {
                  const input = td.querySelector('input');
                  if(input) td.querySelector('span').textContent = input.value;
                });
                row.querySelector('.cancel').click(); // Revert UI
              } else { alert('Save failed: ' + result.message); }
            });
          }
        });
      </script></body></html>`;
    res.send(page);
}));

// Download Excel File
router.get('/download-excel', apiHandler(async (req, res, client) => {
    const { rows } = await client.query('SELECT * FROM registrations ORDER BY timestamp DESC');
    const data = rows.map(row => {
      const { id, ...rest } = row;
      if (rest.events) { try { rest.events = JSON.parse(rest.events).join(', '); } catch {} }
      return rest;
    });

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Registrations');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="registrations.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
}));

// Other placeholder routes from original structure
router.all('/upi-qr', (req, res) => res.status(501).send('Not Implemented'));
router.all('/upi-config', (req, res) => res.status(501).send('Not Implemented'));
router.all('/validate-utr', (req, res) => res.status(501).send('Not Implemented'));


module.exports = router;
