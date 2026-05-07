require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function resetAll() {
  const hash = await bcrypt.hash('user123', 10);
  console.log('Generated hash:', hash);

  // Verify hash works
  const verify = await bcrypt.compare('user123', hash);
  console.log('Hash verification:', verify);

  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '12345',
    database: 'digital_wallet'
  });

  await client.connect();

  const res = await client.query(
    "UPDATE users SET password = $1 WHERE role = 'user'",
    [hash]
  );
  console.log('✅ Updated rows:', res.rowCount);

  await client.end();
}

resetAll().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
