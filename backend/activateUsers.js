require('dotenv').config();
const { Client } = require('pg');

async function activateUsers() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '12345',
    database: 'digital_wallet'
  });

  await client.connect();
  const res = await client.query('UPDATE users SET "isActive" = true WHERE role = $1', ['user']);
  console.log('✅ Activated users:', res.rowCount);
  await client.end();
}

activateUsers().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
