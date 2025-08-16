const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'turntable.proxy.rlwy.net',
  user: 'root',
  password: 'LtOqcrnXBVZyIsHjHxEmGGMLNzPtfboV',
  database: 'railway',
  port: 22318
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Connection error details:', err.code, err.message);
    return;
  }
  console.log('✅ Connected!');
  connection.end();
});
