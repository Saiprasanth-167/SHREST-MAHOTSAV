require('dotenv').config();
const DEBUG = process.env.DEBUG === 'true';
const XLSX = require('xlsx');
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 8000;
// Request logging disabled per requirements; keep minimal logging only where needed.
// Serve home at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Serve the Excel file for download
app.get('/download-excel', (req, res) => {
    const excelPath = path.join(__dirname, 'shrestmahotsav-2k25.xls');
    if (fs.existsSync(excelPath)) {
        res.download(excelPath, 'shrestmahotsav-2k25.xls');
    } else {
        // Create a blank Excel file with headers and save it as shrestmahotsav-2k25.xls
        const blankData = [{
            Name: '', RegistrationNumber: '', Course: '', Branch: '', Section: '', Year: '', Campus: '', Email: '', UTR: '', Events: '', Timestamp: ''
        }];
        const worksheet = XLSX.utils.json_to_sheet(blankData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
        XLSX.writeFile(workbook, excelPath);
        res.download(excelPath, 'shrestmahotsav-2k25.xls');
    }
});

// AJAX endpoint to check if there are any registrations
app.get('/api/has-registrations', (req, res) => {
    const filePath = path.join(__dirname, 'registrations.json');
    if (fs.existsSync(filePath)) {
        const registrations = JSON.parse(fs.readFileSync(filePath));
        res.json({ hasRegistrations: registrations.length > 0 });
    } else {
        res.json({ hasRegistrations: false });
    }
});
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Real OTP logic from backend.js
const { sendOtp, verifyOtp } = require('./backend.js');

// Nodemailer setup for sending emails
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

// Health check
app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

// Public UPI config (read from env)
app.get('/api/upi-config', (req, res) => {
    try {
        const pa = process.env.UPI_VPA || '';
        const pn = process.env.UPI_NAME || 'SHREST MAHOTSAV';
        res.json({ pa, pn });
    } catch (e) {
        res.json({ pa: '', pn: 'SHREST MAHOTSAV' });
    }
});

// Generate QR PNG for a UPI deep link with given amount
app.get('/api/upi-qr', async (req, res) => {
    try {
        const pa = process.env.UPI_VPA || '';
        const pn = process.env.UPI_NAME || 'SHREST MAHOTSAV';
        const am = String(req.query.am || '').trim();
        const tn = String(req.query.tn || '').trim();
        const tr = String(req.query.tr || '').trim();
        if (!pa) return res.status(400).send('UPI VPA not configured');
        if (!am || isNaN(Number(am)) || Number(am) <= 0) return res.status(400).send('Invalid amount');
        const params = new URLSearchParams();
        params.set('pa', pa);
        if (pn) params.set('pn', pn);
        params.set('am', String(Number(am)));
        params.set('cu', 'INR');
        if (tn) params.set('tn', tn);
        if (tr) params.set('tr', tr);
        const url = 'upi://pay?' + params.toString();
        const buf = await QRCode.toBuffer(url, { width: 520, margin: 1 });
        res.setHeader('Content-Type', 'image/png');
        res.send(buf);
    } catch (e) {
        if (DEBUG) console.error('Error in /api/upi-qr:', e);
        res.status(500).send('Failed to generate QR');
    }
});

// Startup migration: ensure Section exists in JSON and Excel
(function migrateSectionField() {
    try {
        const jsonPath = path.join(__dirname, 'registrations.json');
        if (fs.existsSync(jsonPath)) {
            let registrations = JSON.parse(fs.readFileSync(jsonPath));
            let changed = false;
            registrations = registrations.map(r => {
                if (r && r.section === undefined) { changed = true; return { ...r, section: '' }; }
                return r;
            });
            if (changed) {
                fs.writeFileSync(jsonPath, JSON.stringify(registrations, null, 2));
                if (DEBUG) console.log('Migration: added section to registrations.json');
            }
        }
        const excelPath = path.join(__dirname, 'shrestmahotsav-2k25.xls');
        if (fs.existsSync(excelPath)) {
            try {
                const wb = XLSX.readFile(excelPath);
                const sheetName = wb.SheetNames[0];
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
                if (rows && rows.length) {
                    let updated = false;
                    const normalized = rows.map(row => {
                        if (!('Section' in row)) { updated = true; return { Section: '', ...row }; }
                        return row;
                    });
                    if (updated) {
                        const ws = XLSX.utils.json_to_sheet(normalized);
                        const nwb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(nwb, ws, 'Registrations');
                        XLSX.writeFile(nwb, excelPath);
                        if (DEBUG) console.log('Migration: added Section column to Excel');
                    }
                }
            } catch (e) {
                if (DEBUG) console.warn('Migration warning (Excel):', e && e.message ? e.message : e);
            }
        }
    } catch (e) {
    if (DEBUG) console.warn('Migration warning:', e && e.message ? e.message : e);
    }
})();

 

// Simulate UTR validation (accept any 12-digit number for demo)
app.post('/api/validate-utr', (req, res) => {
    try {
        const { utr } = req.body || {};
        if (!/^\d{12}$/.test(utr || '')) {
            return res.json({ valid: false, duplicate: false, message: 'Invalid UTR number.' });
        }
        const filePath = path.join(__dirname, 'registrations.json');
        let duplicate = false;
        if (fs.existsSync(filePath)) {
            const registrations = JSON.parse(fs.readFileSync(filePath));
            duplicate = Array.isArray(registrations) && registrations.some(r => String((r && r.utr) || '').trim() === String(utr).trim());
        }
        return res.json({ valid: true, duplicate });
    } catch (e) {
        return res.json({ valid: false, duplicate: false, message: 'Validation error.' });
    }
});

// Real sending OTP
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    try {
        const result = await sendOtp(email);
        if (result.success) {
            console.log('OTP sent to:', email);
        } else if (DEBUG) {
            console.error('OTP send failed:', result.message, 'for email:', email);
        }
        res.json(result);
    } catch (err) {
    if (DEBUG) console.error('Unexpected error in /api/send-otp:', err);
        res.json({ success: false, message: 'Internal server error.' });
    }
});

// Real verifying OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const result = verifyOtp(email, otp);
    res.json(result);
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
    try {
        const data = req.body;
    const entry = { ...data, timestamp: new Date().toISOString() };
        if (!entry.branch || typeof entry.branch !== 'string' || !entry.branch.trim()) {
            if (entry.course && (entry.course === 'BCA' || entry.course === 'BSC' || entry.course === 'BBA' || entry.course === 'Other')) {
                entry.branch = '-';
            }
        }
        if (!entry.section || typeof entry.section !== 'string' || !entry.section.trim()) {
            if (entry.course && entry.course !== 'B.Tech') {
                entry.section = '-';
            } else {
                // For B.Tech, if no section options applied, still default to '-'
                entry.section = entry.section || '-';
            }
        }
    if (DEBUG) console.log('/api/register received for:', entry.email || 'unknown', 'events:', Array.isArray(entry.events) ? entry.events.length : 0);

        // Ensure QR codes directory exists
        const qrDir = path.join(__dirname, 'qrcodes');
        if (!fs.existsSync(qrDir)) {
            fs.mkdirSync(qrDir, { recursive: true });
        }
        const baseName = (entry.regno || entry.email || 'user').toString().replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const qrRelPath = `qrcodes/shrest-qr-${baseName}.png`;
        const qrAbsPath = path.join(__dirname, qrRelPath);

        // Generate QR payload and image file
        const qrPayload = JSON.stringify({
            regno: entry.regno || '',
            name: entry.name || '',
            email: entry.email || '',
            campus: entry.campus || '',
            year: entry.year || '',
            events: Array.isArray(entry.events) ? entry.events : [],
            utr: entry.utr || '',
            amount: Number(entry.amount || 0),
            ts: entry.timestamp
        });
        const qrDataUrl = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'M' });
        const base64Data = qrDataUrl.split(',')[1];
        fs.writeFileSync(qrAbsPath, Buffer.from(base64Data, 'base64'));
        entry.qrFile = `/${qrRelPath}`;

        // Save to registrations.json
        const filePath = path.join(__dirname, 'registrations.json');
        let registrations = [];
        if (fs.existsSync(filePath)) {
            registrations = JSON.parse(fs.readFileSync(filePath));
        }
        // Duplicate UTR guard
        if (entry.utr) {
            const dup = registrations.some(r => String((r && r.utr) || '').trim() === String(entry.utr).trim());
            if (dup) {
                return res.status(409).json({ success: false, message: 'Duplicate UTR number.' });
            }
        }
        registrations.push(entry);
        fs.writeFileSync(filePath, JSON.stringify(registrations, null, 2));

        // Save to Excel file (shrestmahotsav-2k25.xls)
        const excelPath = path.join(__dirname, 'shrestmahotsav-2k25.xls');
        // Prepare data for Excel: flatten events array to comma-separated string
        const excelEntry = {
            Name: entry.name || '',
            RegistrationNumber: entry.regno || '',
            Course: entry.course || '',
            Branch: entry.branch || '',
            Section: entry.section || '',
            Year: entry.year || '',
            Campus: entry.campus || '',
            Email: entry.email || '',
            UTR: entry.utr || '',
            AmountPAID: Number(entry.amount || 0),
            Events: Array.isArray(entry.events) ? entry.events.join(', ') : (entry.events || ''),
            QRCodeFile: entry.qrFile || '',
            Timestamp: entry.timestamp
        };
        let excelData = [];
        if (fs.existsSync(excelPath)) {
            const existingWb = XLSX.readFile(excelPath);
            const sheetName = existingWb.SheetNames[0];
            excelData = XLSX.utils.sheet_to_json(existingWb.Sheets[sheetName]);
        }
        excelData.push(excelEntry);
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const newWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWb, worksheet, 'Registrations');
        XLSX.writeFile(newWb, excelPath);

        // Email QR attachment
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        });
        const mailOptions = {
            from: process.env.EMAIL,
            to: entry.email,
            subject: 'SHREST Registration QR Code',
            text: 'Thank you for registering. Your QR code is attached. Please present it at the venue.',
            attachments: [
                {
                    filename: `shrest-qr-${baseName}.png`,
                    path: qrAbsPath
                }
            ]
        };
        await transporter.sendMail(mailOptions);

        res.json({ success: true, qrUrl: entry.qrFile });
    } catch (e) {
    if (DEBUG) console.error('Error in /api/register:', e);
        res.status(500).json({ success: false, message: 'Failed to save registration.', error: String(e && e.message ? e.message : e) });
    }
});

// Live Excel view for organisers
app.get('/live-excel', (req, res) => {
    try {
        const excelPath = path.join(__dirname, 'shrestmahotsav-2k25.xls');
        let rows = [];
        if (fs.existsSync(excelPath)) {
            const wb = XLSX.readFile(excelPath);
            const sheetName = wb.SheetNames[0];
            rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
        }
                const headers = rows.length ? Object.keys(rows[0]) : ['Name','RegistrationNumber','Course','Branch','Section','Year','Campus','Email','UTR','Amount','Events','QRCodeFile','Timestamp'];
                const htmlHead = `<th>Actions</th>` + headers.map(h => `<th>${h}</th>`).join('');
                const htmlRows = rows.length
                        ? rows.map((r, idx) => {
                                const cells = headers.map(h => {
                                        const val = String(r[h] ?? '');
                                        const key = h;
                                        const readOnly = h === 'UTR';
                                        return `<td data-key="${key}">${readOnly ? `<span>${val}</span>` : `<input value="${val.replace(/"/g,'&quot;')}" />`}</td>`;
                                }).join('');
                        return `<tr data-index="${idx}"><td><button class="edit" data-i="${idx}">Edit</button> <button class="save" data-i="${idx}" style="display:none;">Save</button> <button class="cancel" data-i="${idx}" style="display:none;">Cancel</button> <button class="delete" data-i="${idx}">Delete</button></td>${cells}</tr>`;
                        }).join('')
                        : '<tr><td colspan="99">No registrations found.</td></tr>';
    const page = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Live Excel - SHREST</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;margin:0;padding:20px;background:#f5f7fb}
.wrap{background:#fff;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.06);padding:16px}
h2{margin:6px 0 12px;color:#1a2980}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #e6ecf2;padding:8px 10px;font-size:.95rem}
th{background:#f0f4fa;text-align:left}
.back{display:inline-block;margin-bottom:12px;padding:8px 12px;border-radius:8px;background:linear-gradient(90deg,#1a2980 0%,#26d0ce 100%);color:#fff;text-decoration:none;font-weight:600}
 .edit{background:#1976d2;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer}
 .save{background:#2e7d32;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer}
 .cancel{background:#b23c17;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer}
 .delete{background:#e53935;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer}
.download{display:inline-block;margin-top:12px;padding:8px 12px;border-radius:8px;background:linear-gradient(90deg,#1a2980 0%,#26d0ce 100%);color:#fff;text-decoration:none;font-weight:600}
</style></head>
<body>
<div class="wrap">
<a class="back" href="/qrscanner.html">Back to Scanner</a>
<h2>Live Excel Sheet</h2>
<div style="overflow:auto;">
<table>
<thead><tr>${htmlHead}</tr></thead>
<tbody>${htmlRows}</tbody>
</table>
</div>
<div style="margin-top:12px;display:flex;gap:12px;align-items:center;">
    <a class="download" href="/download-excel">Download Excel</a>
</div>
</div>
<script>
    const tbody = document.querySelector('tbody');
    function setRowMode(tr, mode) {
        const isEditing = mode === 'edit';
        tr.querySelector('.edit').style.display = isEditing ? 'none' : '';
        tr.querySelector('.save').style.display = isEditing ? '' : 'none';
        tr.querySelector('.cancel').style.display = isEditing ? '' : 'none';
        tr.querySelectorAll('td[data-key]:not([data-key="UTR"]) input').forEach(inp => inp.disabled = !isEditing);
    }
    tbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const tr = btn.closest('tr');
                if (btn.classList.contains('delete')) {
                    const utrCell = tr.querySelector('td[data-key=\"UTR\"]');
                    let utr = '';
                    if (utrCell) {
                        const s = utrCell.querySelector('span');
                        const i = utrCell.querySelector('input');
                        utr = s ? s.textContent : (i ? i.value : utrCell.textContent);
                    }
                    utr = (utr || '').trim();
                    if (!/^\\d{12}$/.test(utr)) { alert('Invalid UTR'); return; }
                if (!confirm('Delete this row (UTR ' + utr + ')? This cannot be undone.')) return;
                try {
                    const res = await fetch('/api/registrations/' + encodeURIComponent(utr), { method: 'DELETE' });
                    const ok = res.ok; const data = await res.json().catch(()=>({}));
                    if (!ok || !data.success) throw new Error((data && data.message) || 'Delete failed');
                alert('Row deleted');
                location.reload();
                } catch (err) { alert('Failed to delete: ' + (err && err.message ? err.message : 'Unknown error')); }
                return;
            }
        if (btn.classList.contains('edit')) {
            setRowMode(tr, 'edit');
            return;
        }
        if (btn.classList.contains('cancel')) {
            // reload page to reset cells
            location.reload();
            return;
        }
        if (btn.classList.contains('save')) {
            const cells = Array.from(tr.querySelectorAll('td[data-key]'));
            const obj = {};
            cells.forEach(td => {
                const key = td.getAttribute('data-key');
                const input = td.querySelector('input');
                obj[key] = input ? input.value.trim() : (td.textContent || '').trim();
            });
            const utr = obj.UTR;
            // Map Excel header keys to API fields
            const payload = {
                name: obj.Name,
                regno: obj.RegistrationNumber,
                course: obj.Course,
                branch: obj.Branch,
                section: obj.Section,
                year: obj.Year,
                campus: obj.Campus,
                email: obj.Email,
                amount: obj.Amount,
                events: obj.Events
            };
            try {
                const res = await fetch('/api/registrations/' + encodeURIComponent(utr), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const ok = res.ok;
                const data = await res.json().catch(() => ({}));
                if (!ok || !data.success) throw new Error((data && data.message) || 'Update failed');
                alert('Row updated');
                location.reload();
            } catch (err) {
                alert('Failed to update: ' + (err && err.message ? err.message : 'Unknown error'));
            }
        }
    });
</script>
</body></html>`;
        res.send(page);
    } catch (e) {
    if (DEBUG) console.error('Error rendering live excel:', e);
        res.status(500).send('Failed to render live excel.');
    }
});


// Delete a registration by UTR (organiser action)
app.delete('/api/registrations/:utr', (req, res) => {
    try {
        const utr = String(req.params.utr || '').trim();
        if (!/^\d{12}$/.test(utr)) {
            return res.status(400).json({ success: false, message: 'Invalid UTR.' });
        }

        // Load registrations
        const jsonPath = path.join(__dirname, 'registrations.json');
        let registrations = [];
        if (fs.existsSync(jsonPath)) {
            registrations = JSON.parse(fs.readFileSync(jsonPath));
        }
        const norm = v => String(v == null ? '' : v).replace(/\D/g, '').trim();
        const toRemove = registrations.filter(r => norm((r && r.utr) || '') === norm(utr));
        if (toRemove.length === 0) {
            return res.status(404).json({ success: false, message: 'No registration found for this UTR.' });
        }

        // Delete QR image files for removed entries
        for (const entry of toRemove) {
            const qrFile = entry && entry.qrFile ? entry.qrFile.replace(/^\//, '') : null;
            if (qrFile) {
                const abs = path.join(__dirname, qrFile);
                if (fs.existsSync(abs)) {
                    try { fs.unlinkSync(abs); } catch (_) { /* ignore */ }
                }
            }
        }

        // Keep others and save
    registrations = registrations.filter(r => norm((r && r.utr) || '') !== norm(utr));
        fs.writeFileSync(jsonPath, JSON.stringify(registrations, null, 2));

        // Update Excel by filtering out rows with matching UTR
        const excelPath = path.join(__dirname, 'shrestmahotsav-2k25.xls');
        if (fs.existsSync(excelPath)) {
            try {
                const wb = XLSX.readFile(excelPath);
                const sheetName = wb.SheetNames[0];
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
                const filtered = rows.filter(row => norm((row && row.UTR) || '') !== norm(utr));
                const ws = XLSX.utils.json_to_sheet(filtered);
                const newWb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(newWb, ws, 'Registrations');
                XLSX.writeFile(newWb, excelPath);
            } catch (e) {
                if (DEBUG) console.error('Error updating Excel during delete:', e);
                // Continue; JSON already updated
            }
        }

        return res.json({ success: true, removed: toRemove.length });
    } catch (e) {
    if (DEBUG) console.error('Error in DELETE /api/registrations/:utr:', e);
        return res.status(500).json({ success: false, message: 'Failed to delete registration.' });
    }
});

// Update a registration by UTR (organiser edit)
app.put('/api/registrations/:utr', (req, res) => {
    try {
        const utr = String(req.params.utr || '').trim();
        if (!/^\d{12}$/.test(utr)) {
            return res.status(400).json({ success: false, message: 'Invalid UTR.' });
        }
        const updates = req.body || {};
        if (updates.utr && String(updates.utr).trim() !== utr) {
            return res.status(400).json({ success: false, message: 'UTR cannot be changed.' });
        }

        const jsonPath = path.join(__dirname, 'registrations.json');
        if (!fs.existsSync(jsonPath)) {
            return res.status(404).json({ success: false, message: 'No registrations found.' });
        }
        let registrations = JSON.parse(fs.readFileSync(jsonPath));
        let found = false;
        registrations = registrations.map(r => {
            if (String((r && r.utr) || '').trim() === utr) {
                found = true;
                return { ...r, ...updates };
            }
            return r;
        });
        if (!found) {
            return res.status(404).json({ success: false, message: 'Registration not found for this UTR.' });
        }
        fs.writeFileSync(jsonPath, JSON.stringify(registrations, null, 2));

        // Update Excel
        const excelPath = path.join(__dirname, 'shrestmahotsav-2k25.xls');
        let excelRows = [];
        if (fs.existsSync(excelPath)) {
            const existingWb = XLSX.readFile(excelPath);
            const sheetName = existingWb.SheetNames[0];
            excelRows = XLSX.utils.sheet_to_json(existingWb.Sheets[sheetName]);
        }
        const updatedRows = excelRows.map(row => {
            if (String((row && row.UTR) || '').trim() === utr) {
                return {
                    ...row,
                    Name: updates.name !== undefined ? updates.name : row.Name,
                    RegistrationNumber: updates.regno !== undefined ? updates.regno : row.RegistrationNumber,
                    Course: updates.course !== undefined ? updates.course : row.Course,
                    Branch: updates.branch !== undefined ? updates.branch : row.Branch,
                    Section: updates.section !== undefined ? updates.section : row.Section,
                    Year: updates.year !== undefined ? updates.year : row.Year,
                    Campus: updates.campus !== undefined ? updates.campus : row.Campus,
                    Email: updates.email !== undefined ? updates.email : row.Email,
                    Amount: updates.amount !== undefined ? updates.amount : row.Amount,
                    Events: updates.events !== undefined ? (Array.isArray(updates.events) ? updates.events.join(', ') : updates.events) : row.Events
                };
            }
            return row;
        });
        const worksheet = XLSX.utils.json_to_sheet(updatedRows);
        const newWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWb, worksheet, 'Registrations');
        XLSX.writeFile(newWb, excelPath);

        return res.json({ success: true });
    } catch (e) {
    if (DEBUG) console.error('Error in PUT /api/registrations/:utr:', e);
        return res.status(500).json({ success: false, message: 'Failed to update registration.' });
    }
});


// Fetch a registration by UTR (read-only helper for scanner)
app.get('/api/registrations/:utr', (req, res) => {
    try {
        const utr = String(req.params.utr || '').trim();
        if (!/^\d{12}$/.test(utr)) {
            return res.status(400).json({ success: false, message: 'Invalid UTR.' });
        }
        const jsonPath = path.join(__dirname, 'registrations.json');
        if (!fs.existsSync(jsonPath)) {
            return res.status(404).json({ success: false, message: 'No registrations found.' });
        }
        const registrations = JSON.parse(fs.readFileSync(jsonPath));
        const found = registrations.find(r => String((r && r.utr) || '').trim() === utr);
        if (!found) {
            return res.status(404).json({ success: false, message: 'Registration not found.' });
        }
        return res.json({ success: true, registration: found });
    } catch (e) {
        if (DEBUG) console.error('Error in GET /api/registrations/:utr:', e);
        return res.status(500).json({ success: false, message: 'Failed to fetch registration.' });
    }
});

// Serve static files (HTML, CSS, JS, etc.) from the project directory (after API routes)
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});