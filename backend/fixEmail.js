require('dotenv').config();
const { Client } = require('pg');

async function fixEmail() {
  const client = new Client({
    host: 'localhost', port: 5432,
    user: 'postgres', password: '12345',
    database: 'digital_wallet'
  });
  await client.connect();
  const res = await client.query(
    "UPDATE users SET email = $1 WHERE email = $2",
    ['ahmedmasoodahmed64@gmail.com', 'admedmasoodahmed64@gmail.com']
  );
  console.log('✅ Updated rows:', res.rowCount);
  await client.end();
}

fixEmail().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
