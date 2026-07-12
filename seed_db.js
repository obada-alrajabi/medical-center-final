import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

async function run() {
  const client = new Client({
    connectionString: 'postgresql://mjcczxsn_admin@127.0.0.1:5432/mjcczxsn_medical_center'
  });
  await client.connect();
  console.log('Connected to DB');

  const content = fs.readFileSync('seed.sql', 'utf8');
  const lines = content.split(/\r?\n/);

  let currentTable = null;
  let currentColumns = [];
  let rows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('COPY ')) {
      // Parse table name and columns
      // e.g., COPY public.admin_accounts (id, username, password_hash, display_name, created_at) FROM stdin;
      const match = line.match(/COPY\s+public\.(\w+)\s*\(([^)]+)\)\s*FROM\s+stdin/i);
      if (match) {
        currentTable = match[1];
        currentColumns = match[2].split(',').map(c => c.trim());
        rows = [];
        console.log(`Parsing table ${currentTable} columns: ${currentColumns.join(', ')}`);
      }
      continue;
    }

    if (line === '\\.') {
      if (currentTable) {
        console.log(`Inserting ${rows.length} rows into ${currentTable}...`);
        for (const row of rows) {
          const values = row.map((val, idx) => {
            if (val === '\\N' || val === '\\\\N' || val === 'N') return null;
            if (val === 't') return true;
            if (val === 'f') return false;
            return val;
          });
          
          const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
          const query = `INSERT INTO public.${currentTable} (${currentColumns.join(', ')}) VALUES (${placeholders})`;
          try {
            await client.query(query, values);
          } catch (err) {
            console.error(`Failed to insert into ${currentTable} row: ${JSON.stringify(row)}. Error: ${err.message}`);
          }
        }
        currentTable = null;
        currentColumns = [];
        rows = [];
      }
      continue;
    }

    if (currentTable) {
      // We are inside a COPY block. Split by 2 or more spaces or tabs
      const parts = lines[i].split(/\t|\s{2,}/).map(p => p.trim()).filter(p => p !== '');
      if (parts.length > 0) {
        // If the number of parsed parts is less than columns, pad it or handle it
        if (parts.length < currentColumns.length) {
          // If some columns are missing at the end, pad them with nulls
          while (parts.length < currentColumns.length) {
            parts.push('\\N');
          }
        }
        rows.push(parts);
      }
    }
  }

  // Set sequence values if present
  for (const line of lines) {
    if (line.includes("SELECT pg_catalog.setval")) {
      try {
        await client.query(line);
        console.log(`Executed sequence update: ${line}`);
      } catch (err) {
        console.error(`Failed sequence update: ${line}. Error: ${err.message}`);
      }
    }
  }

  await client.end();
  console.log('Finished seeding successfully');
}

run().catch(console.error);
