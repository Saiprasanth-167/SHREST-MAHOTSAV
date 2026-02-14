const { Client } = require('pg');
const qr = require('qrcode');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const initializeDatabase = require('./db-init');

async function connectToDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Database initialization failed:', error);
    return res.status(500).json({ success: false, message: 'Database initialization failed.' });
  }

  let client;
  try {
    client = await connectToDatabase();
  } catch (e) {
    console.error('Database connection failed:', e);
    return res.status(500).json({ success: false, message: 'Database connection failed.', error: e.message });
  }

  try {
    const data = req.body;
    
    // Validate required fields explicitly to prevent empty data
    const requiredFields = ['name', 'regno', 'mobile', 'course', 'branch', 'section', 'year', 'campus', 'utr', 'amount', 'events'];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    const entry = { ...data, timestamp: new Date().toISOString() };
    const utrCheck = await client.query('SELECT COUNT(*) FROM registrations WHERE utr = $1', [entry.utr]);
    if (utrCheck.rows[0].count > 0) {
      return res.status(409).json({ success: false, message: 'Duplicate UTR number. This transaction ID has already been used.' });
    }
    
    // Use transaction to ensure data integrity
    try {
        await client.query('BEGIN');
        const insertQuery = `INSERT INTO registrations (name, regno, mobile, course, branch, section, year, campus, utr, amount, events, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
        const values = [entry.name, entry.regno, entry.mobile, entry.course, entry.branch, entry.section, entry.year, entry.campus, entry.utr, entry.amount, JSON.stringify(entry.events), entry.timestamp];
        const result = await client.query(insertQuery, values);
        const newReg = result.rows[0];

        // Insert audit copy as JSONB within same transaction
        try {
          const auditQuery = `INSERT INTO audit_registrations (registration_id, payload) VALUES ($1, $2)`;
          await client.query(auditQuery, [newReg.id, JSON.stringify(newReg)]);
        } catch (auditErr) {
          console.error('Failed to insert audit copy:', auditErr);
          // Do not fail the whole transaction if audit insert fails; but log it
        }

        await client.query('COMMIT');

        // Generate QR code
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

        // Send notification email to owner (if configured)
        (async function sendNotification() {
          try {
            if (!process.env.OWNER_EMAIL) {
              console.warn('OWNER_EMAIL not configured — skipping notification email');
              return;
            }

            const htmlTable = `
              <h2>New Registration Received</h2>
              <div style="margin-bottom:12px;"><img src="${qrUrl}" alt="QR" style="width:180px; height:auto; border:1px solid #eee;"/></div>
              <table border="0" cellpadding="8" style="border-collapse:collapse; font-family: Arial, sans-serif;">
                <tr><td><strong>Name</strong></td><td>${escapeHtml(newReg.name)}</td></tr>
                <tr><td><strong>Reg No</strong></td><td>${escapeHtml(newReg.regno)}</td></tr>
                <tr><td><strong>Mobile</strong></td><td>${escapeHtml(newReg.mobile)}</td></tr>
                <tr><td><strong>Course</strong></td><td>${escapeHtml(newReg.course)}</td></tr>
                <tr><td><strong>Branch</strong></td><td>${escapeHtml(newReg.branch)}</td></tr>
                <tr><td><strong>Section</strong></td><td>${escapeHtml(newReg.section)}</td></tr>
                <tr><td><strong>Year</strong></td><td>${escapeHtml(newReg.year)}</td></tr>
                <tr><td><strong>Campus</strong></td><td>${escapeHtml(newReg.campus)}</td></tr>
                <tr><td><strong>UTR</strong></td><td>${escapeHtml(newReg.utr)}</td></tr>
                <tr><td><strong>Amount</strong></td><td>${escapeHtml(newReg.amount)}</td></tr>
                <tr><td><strong>Events</strong></td><td>${escapeHtml(Array.isArray(newReg.events) ? newReg.events.join(', ') : (typeof newReg.events === 'string' ? newReg.events : JSON.stringify(newReg.events)))}</td></tr>
                <tr><td><strong>Timestamp</strong></td><td>${escapeHtml(newReg.timestamp)}</td></tr>
              </table>
            `;

            // If SendGrid API key provided, use SendGrid
            if (process.env.SENDGRID_API_KEY) {
              try {
                sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                const msg = {
                  to: process.env.OWNER_EMAIL,
                  from: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.OWNER_EMAIL,
                  subject: `New registration: ${newReg.name} (${newReg.regno})`,
                  html: htmlTable
                };
                await sgMail.send(msg);
                console.log('Notification email sent via SendGrid to', process.env.OWNER_EMAIL);
                return;
              } catch (sgErr) {
                console.error('SendGrid send failed, falling back to SMTP:', sgErr);
              }
            }

            // Fallback to SMTP (nodemailer)
            const host = process.env.EMAIL_HOST;
            const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587;
            const secure = process.env.EMAIL_SECURE === 'true';
            const user = process.env.EMAIL_USER;
            const pass = process.env.EMAIL_PASS;

            if (!host || !user || !pass) {
              console.warn('Email SMTP not fully configured — skipping notification email');
              return;
            }

            const transporter = nodemailer.createTransport({
              host,
              port,
              secure,
              auth: { user, pass }
            });

            const mailOptions = {
              from: process.env.EMAIL_FROM || user,
              to: process.env.OWNER_EMAIL,
              subject: `New registration: ${newReg.name} (${newReg.regno})`,
              html: htmlTable
            };

            await transporter.sendMail(mailOptions);
            console.log('Notification email sent to', process.env.OWNER_EMAIL);
          } catch (mailErr) {
            console.error('Failed to send notification email:', mailErr);
          }
        })();

        res.json({ success: true, message: 'Registration successful!', qrUrl: qrUrl });
    } catch (insertError) {
        await client.query('ROLLBACK');
        throw insertError; // Throw so the outer catch handles it
    }
  } catch (e) {
    console.error('Error in /api/register:', e);
    // Determine specific error message based on error type if possible
    let errorMessage = 'Failed to save registration.';
    if (e.code === '23505') { // Unique violation
        errorMessage = 'Duplicate entry detected (UTR number likely already exists).';
    } else if (e.code === '23502') { // Not null violation
        errorMessage = 'Missing required data.';
    }
    res.status(500).json({ success: false, message: errorMessage, error: e.message });
  } finally {
    if (client) {
      await client.end();
    }
  }
};

// Simple HTML-escape helper
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}