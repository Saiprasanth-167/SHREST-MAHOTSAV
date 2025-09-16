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
  
  let client;
  try {
    client = await connectToDatabase();
    const { rows } = await client.query('SELECT * FROM registrations ORDER BY timestamp DESC');
    
    // Define headers manually to ensure order and exclude 'id'
    const headers = ['name', 'regno', 'mobile', 'course', 'branch', 'section', 'year', 'campus', 'utr', 'amount', 'events', 'timestamp'];
    
    const htmlHead = `<th>Actions</th>` + headers.map(h => `<th>${h}</th>`).join('');
    
    const htmlRows = rows.length ? rows.map((r, idx) => {
        const cells = headers.map(h => {
          let val = r[h];
          if (h === 'events' && val) {
            try {
              const eventsArray = JSON.parse(val);
              val = eventsArray.join(', ');
            } catch {
              // val remains as is if not valid JSON
            }
          }
          val = String(val ?? '');
          const key = h;
          const readOnly = h === 'utr' || h === 'timestamp' || h === 'regno';
          return `<td data-key="${key}">${readOnly ? `<span>${val}</span>` : `<input value="${val.replace(/"/g, '&quot;')}" />`}</td>`;
        }).join('');
        return `<tr data-utr="${r.utr}"><td><button class="edit">Edit</button> <button class="save" style="display:none;">Save</button> <button class="cancel" style="display:none;">Cancel</button> <button class="delete">Delete</button></td>${cells}</tr>`;
      }).join('') :
      '<tr><td colspan="12">No registrations found.</td></tr>';

    const page = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Live Registrations</title>
        <style>
          body { font-family: sans-serif; background-color: #f4f4f9; color: #333; }
          h1 { text-align: center; color: #444; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 2px 15px rgba(0,0,0,0.1); background-color: #fff; }
          th, td { padding: 12px 15px; border: 1px solid #ddd; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          tr:hover { background-color: #ddd; }
          input { width: 95%; padding: 5px; border: 1px solid #ccc; border-radius: 4px; }
          button { padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px; }
          .edit { background-color: #ffc107; }
          .save { background-color: #28a745; color: white; }
          .cancel { background-color: #dc3545; color: white; }
          .delete { background-color: #f44336; color: white; }
        </style>
      </head>
      <body>
        <h1>Live Registration Data</h1>
        <table>
          <thead><tr>${htmlHead}</tr></thead>
          <tbody>${htmlRows}</tbody>
        </table>
        <script>
          document.body.addEventListener('click', function(e) {
            const target = e.target;
            const row = target.closest('tr');
            if (!row) return;

            if (target.classList.contains('edit')) {
              row.querySelectorAll('input').forEach(input => input.style.display = 'block');
              row.querySelectorAll('span').forEach(span => span.style.display = 'none');
              row.querySelector('.edit').style.display = 'none';
              row.querySelector('.save').style.display = 'inline-block';
              row.querySelector('.cancel').style.display = 'inline-block';
            }

            if (target.classList.contains('cancel')) {
              row.querySelectorAll('input').forEach(input => input.style.display = 'none');
              row.querySelectorAll('span').forEach(span => span.style.display = 'block');
              row.querySelector('.edit').style.display = 'inline-block';
              row.querySelector('.save').style.display = 'none';
              row.querySelector('.cancel').style.display = 'none';
            }

            if (target.classList.contains('delete')) {
                if (confirm('Are you sure you want to delete this registration?')) {
                    const utr = row.dataset.utr;
                    fetch('/api/registrations/' + utr, { method: 'DELETE' })
                        .then(res => res.json())
                        .then(data => {
                            if (data.success) {
                                row.remove();
                            } else {
                                alert('Failed to delete: ' + data.message);
                            }
                        });
                }
            }
            
            if (target.classList.contains('save')) {
                const utr = row.dataset.utr;
                const data = {};
                row.querySelectorAll('td[data-key]').forEach(td => {
                    const key = td.dataset.key;
                    const input = td.querySelector('input');
                    if (input) {
                        data[key] = input.value;
                    }
                });

                fetch('/api/registrations/' + utr, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                .then(res => res.json())
                .then(result => {
                    if (result.success) {
                        alert('Saved successfully!');
                        row.querySelectorAll('td[data-key]').forEach(td => {
                            const input = td.querySelector('input');
                            if (input) {
                                td.querySelector('span').textContent = input.value;
                            }
                        });
                        // Toggle back to view mode
                        row.querySelectorAll('input').forEach(input => input.style.display = 'none');
                        row.querySelectorAll('span').forEach(span => span.style.display = 'block');
                        row.querySelector('.edit').style.display = 'inline-block';
                        row.querySelector('.save').style.display = 'none';
                        row.querySelector('.cancel').style.display = 'none';
                    } else {
                        alert('Failed to save: ' + result.message);
                    }
                });
            }
          });
        </script>
      </body>
      </html>
    `;
    res.send(page);
  } catch (e) {
    console.error('Error rendering live excel:', e);
    res.status(500).send('Failed to render live excel: ' + e.message);
  } finally {
    if (client) {
      await client.end();
    }
  }
};
