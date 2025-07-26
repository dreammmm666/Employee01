const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: 'shuttle.proxy.rlwy.net',
  user: 'root',
  password: 'bVFNSxyxKbKZJMQMqxXiFoQFiXgCDYIj',
  database: 'railway',
  port: 59143
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to Railway MySQL:', err);
    return;
  }
  console.log('✅ Connected to Railway MySQL database!');
});

module.exports = connection;
