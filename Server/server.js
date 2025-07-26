const express = require('express');
const cors = require('cors');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
const compression = require('compression');
app.use(compression());

const PORT = 3001;
const SECRET_KEY = 'your_secret_key';


app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
// Middleware
app.use(cors());

app.use(express.json());

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ตั้งค่า multer สำหรับเก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// ฟังก์ชันสร้าง employee_id แบบง่าย
function generateEmployeeId() {
  return 'EMP' + Date.now().toString().slice(-6);
}

// ฟังก์ชันแปลงวันที่เป็น YYYY-MM-DD
function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

// --- API ---

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.json({
      user_id: user.user_id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    });
  });
});

// ดึงข้อมูลพนักงานทั้งหมด
function formatDateToYMD(date) {
  if (!date) return null;
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

app.get('/api/employees', (req, res) => {
  const sql = 'SELECT * FROM employee';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching employees:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    // แปลงวันที่เป็น yyyy-mm-dd
    const formattedResults = results.map(emp => ({
      ...emp,
      birth_date: formatDateToYMD(emp.birth_date),
      start_date: formatDateToYMD(emp.start_date),
      resign_date: formatDateToYMD(emp.resign_date),
    }));

    res.json(formattedResults);
  });
});

// ค้นหาพนักงานตามชื่อ
app.get('/api/employees/search', (req, res) => {
  const { name } = req.query;
  const sql = `SELECT * FROM employee WHERE full_name LIKE ?`;
  db.query(sql, [`%${name}%`], (err, results) => {
    if (err) return res.status(500).json(err);

    const formattedResults = results.map(emp => ({
      ...emp,
      birth_date: formatDateToYMD(emp.birth_date),
      start_date: formatDateToYMD(emp.start_date),
      resign_date: formatDateToYMD(emp.resign_date),
    }));

    res.json(formattedResults);
  });
});

// เพิ่มพนักงาน พร้อมรับไฟล์ profile_image
app.post('/api/employees', upload.single('profile_image'), (req, res) => {
  const {
    employee_id,
    full_name,
    gender,
    age,
    birth_date,
    citizen_id,
    start_date,
    bank_account,
    current_salary,
    department,
    position,
    Google_drive
  } = req.body;

  const profileImage = req.file ? req.file.filename : null;

  // คำนวณปีทำงาน
  const formattedStartDate = start_date ? new Date(start_date) : null;
  const formattedNow = new Date();
  let years_of_service = 0;
  if (formattedStartDate) {
    years_of_service = formattedNow.getFullYear() - formattedStartDate.getFullYear();
    const hasNotCompletedYear =
      formattedNow.getMonth() < formattedStartDate.getMonth() ||
      (formattedNow.getMonth() === formattedStartDate.getMonth() &&
        formattedNow.getDate() < formattedStartDate.getDate());
    if (hasNotCompletedYear) {
      years_of_service -= 1;
    }
  }

  

  const sql = `
    INSERT INTO employee (
      employee_id, full_name, gender, age, birth_date, citizen_id,
      start_date, years_of_service, bank_account, current_salary, department, profile_image,position,Google_drive
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
  `;

  const values = [
    employee_id,
    full_name,
    gender,
    age ? parseInt(age) : 0,
    birth_date || null,
    citizen_id,
    start_date || null,
    years_of_service,
    bank_account || null,
    current_salary ? parseFloat(current_salary) : 0,
    department,
    profileImage,
    position,
    Google_drive
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล' });
    }
    res.json({ message: 'เพิ่มข้อมูลพนักงานสำเร็จ', employee_id });
  });
});

// อัปเดตข้อมูลพนักงาน


app.put('/api/EDemployees/:id', upload.single('profile_image'), (req, res) => {
  const employeeId = req.params.id;
  const {
    full_name,
    gender,
    age,
    birth_date,
    citizen_id,
    start_date,
    resign_date,
    bank_account,
    current_salary,
    department,
    position,
    Google_drive,
    user_id
  } = req.body;

  function formatDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const offsetMs = d.getTimezoneOffset() * 60 * 1000;
    const correctedDate = new Date(d.getTime() - offsetMs);
    return correctedDate.toISOString().slice(0, 10);
  }

  function formatDateOnly(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d)) return '';
    const offsetMs = d.getTimezoneOffset() * 60 * 1000;
    const correctedDate = new Date(d.getTime() - offsetMs);
    return correctedDate.toISOString().slice(0, 10);
  }

  const formatted_birth_date = formatDate(birth_date);
  const formatted_start_date = formatDate(start_date);
  const formatted_resign_date = resign_date ? formatDate(resign_date) : null;

  const sqlSelect = 'SELECT * FROM employee WHERE employee_id = ?';
  db.query(sqlSelect, [employeeId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Employee not found' });

    const oldData = results[0];
    const years_of_service = formatted_resign_date
      ? new Date(formatted_resign_date).getFullYear() - new Date(formatted_start_date).getFullYear()
      : new Date().getFullYear() - new Date(formatted_start_date).getFullYear();

    let profile_image = oldData.profile_image;
    if (req.file) {
      // ลบรูปเก่า (ถ้ามี)
      if (profile_image && fs.existsSync(`./uploads/profile_images/${profile_image}`)) {
        fs.unlinkSync(`./uploads/profile_images/${profile_image}`);
      }
      profile_image = req.file.filename;
    }

    const newData = {
      full_name,
      gender,
      age: parseInt(age),
      birth_date: formatted_birth_date,
      citizen_id,
      start_date: formatted_start_date,
      resign_date: formatted_resign_date,
      years_of_service,
      bank_account,
      current_salary: parseFloat(current_salary),
      department,
      position,
      Google_drive,
      profile_image
    };

    const changedFields = {};
    for (const key in newData) {
      let oldVal = oldData[key];
      let newVal = newData[key];
      if (['birth_date', 'start_date', 'resign_date'].includes(key)) {
        oldVal = formatDateOnly(oldVal);
        newVal = formatDateOnly(newVal);
      } else {
        oldVal = oldVal === null ? '' : String(oldVal);
        newVal = newVal === null ? '' : String(newVal);
      }
      if (oldVal !== newVal) {
        changedFields[key] = { before: oldVal, after: newVal };
      }
    }

    if (Object.keys(changedFields).length === 0) {
      return res.json({ message: 'ไม่มีการเปลี่ยนแปลงข้อมูล' });
    }

    const sqlUpdate = `
      UPDATE employee SET
        full_name = ?, gender = ?, age = ?, birth_date = ?, citizen_id = ?,
        start_date = ?, resign_date = ?, years_of_service = ?, bank_account = ?,
        current_salary = ?, department = ?, position = ?, Google_drive = ?, profile_image = ?
      WHERE employee_id = ?
    `;
    const updateValues = [
      full_name, gender, parseInt(age), formatted_birth_date, citizen_id,
      formatted_start_date, formatted_resign_date, years_of_service, bank_account,
      parseFloat(current_salary), department, position, Google_drive, profile_image, employeeId
    ];

    db.query(sqlUpdate, updateValues, (updateErr) => {
      if (updateErr) return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดต' });

      const logSql = `
        INSERT INTO log_edemployee (user_id, action, target_table, target_id, description, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      const logValues = [
        user_id || 0, 'Edit Employee', 'employee', employeeId, JSON.stringify(changedFields)
      ];

      db.query(logSql, logValues, (logErr) => {
        if (logErr) console.error('❌ Error logging:', logErr);
        return res.json({
          message: '✅ อัปเดตสำเร็จ',
          profile_image: `/uploads${profile_image}`
        });
      });
    });
  });
});







// ตัวอย่าง API ดึง log พร้อม username จากตาราง users
app.get('/api/logs/employee-edit', (req, res) => {
  const sqlLogs = `
    SELECT
      log.log_id,
      log.user_id,
      u.username AS editor_username,
      log.action,
      log.target_table,
      log.target_id,
      e.full_name AS edited_employee_name,
      log.description,
      log.created_at
    FROM log_edemployee log
    LEFT JOIN users u ON log.user_id = u.user_id
    LEFT JOIN employee e ON log.target_id = e.employee_id
    ORDER BY log.created_at DESC
    LIMIT 100
  `;

  db.query(sqlLogs, (err, logs) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const parsedLogs = logs.map(log => {
      let descriptionParsed;

      try {
        descriptionParsed = log.description ? JSON.parse(log.description) : null;
      } catch (e) {
        descriptionParsed = log.description || null;
      }

      return {
        ...log,
        description: descriptionParsed
      };
    });

    res.json(parsedLogs);
  });
});




// ลงทะเบียนผู้ใช้ใหม่
app.post('/register', async (req, res) => {
  const { username, password, full_name, role } = req.body;

  if (!username || !password || !full_name || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const saltRounds = 10; // ✅ เพิ่มตรงนี้

  try {
    // ตรวจสอบว่าชื่อผู้ใช้ซ้ำหรือไม่
    const checkSql = 'SELECT * FROM users WHERE username = ?';
    db.query(checkSql, [username], async (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (results.length > 0) {
        return res.status(409).json({ message: 'Username already exists' });
      }

      // เข้ารหัสรหัสผ่านก่อนบันทึก
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const createdAt = new Date(); // วันที่สร้าง

      const insertSql = `
        INSERT INTO users (username, password, full_name, role, created_at)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(insertSql, [username, hashedPassword, full_name, role, createdAt], (err, result) => {
        if (err) return res.status(500).json({ message: 'Insert failed', error: err });

        res.status(201).json({ message: 'User registered successfully', user_id: result.insertId });
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});



const distPath = path.join(__dirname, '../employee/dist'); // แก้ตามโฟลเดอร์จริง

// ตรวจสอบว่ามี index.html หรือไม่
const indexPath = path.join(distPath, 'index.html');
const indexExists = fs.existsSync(indexPath);

if (!indexExists) {
  console.error('❌ ไม่พบ index.html ใน:', indexPath);
} else {
  console.log('✅ พบ index.html แล้วใน:', indexPath);
}

// ให้ Express เสิร์ฟ static ไฟล์ของ React
app.use(express.static(distPath));

// จับทุก route ที่ไม่ใช่ API → ส่งไปหน้าแรก React (SPA)
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});



// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



// Serve static files from React build folder


