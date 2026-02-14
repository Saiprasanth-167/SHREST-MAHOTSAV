const { Client } = require('pg');

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not found, skipping database initialization.');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        regno VARCHAR(50) NOT NULL,
        mobile VARCHAR(20),
        course VARCHAR(100),
        branch VARCHAR(100),
        section VARCHAR(50),
        year VARCHAR(20),
        campus VARCHAR(100),
        utr VARCHAR(255) NOT NULL UNIQUE,
        amount NUMERIC(10, 2),
        events JSONB,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await client.query(createTableQuery);
    console.log('Database initialized: "registrations" table checked/created.');

    // Add mobile column if it doesn't exist, for backward compatibility
    try {
      await client.query('ALTER TABLE registrations ADD COLUMN mobile VARCHAR(20)');
      console.log('Added "mobile" column to "registrations" table.');
    } catch (err) {
      // Error code '42701' is for 'duplicate column', which we can safely ignore.
      if (err.code !== '42701') {
        console.error('Error adding mobile column:', err.message);
      }
    }

    // Create audit table for registration copies
    try {
      const createAuditQuery = `
        CREATE TABLE IF NOT EXISTS audit_registrations (
          id SERIAL PRIMARY KEY,
          registration_id INTEGER,
          payload JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      await client.query(createAuditQuery);
      console.log('Database initialized: "audit_registrations" table checked/created.');
    } catch (err) {
      console.error('Error creating audit_registrations table:', err.message);
    }

  } catch (err) {
    console.error('Error during database initialization:', err);
    // We throw the error to prevent the server from starting if the DB is not ready.
    throw err;
  } finally {
    await client.end();
  }
}

module.exports = initializeDatabase;
