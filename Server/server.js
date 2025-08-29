const express = require('express');
const cors = require('cors');
const cloudinary = require('./cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const db = require('./db'); // db จะเป็น connection object
const { v4: uuidv4 } = require('uuid'); 
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const compression = require('compression');
app.use(compression());

const PORT = 3001;

const allowedOrigins = [
  'http://localhost:5173',        // Dev React
  'http://127.0.0.1:5173',        // Dev React อีกแบบ
  'https://employee01.onrender.com' // Prod React บน Render
];

// Middleware CORS
app.use(cors({
  origin: function (origin, callback) {
    // อนุญาต request จาก Postman หรือ server ภายใน
    if (!origin) return callback(null, true);

    // ถ้าเป็น dev ให้อนุญาตทุก origin
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // ถ้าอยู่ใน allowedOrigins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// รองรับ preflight requests
app.options('*', cors());



//app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
// Middleware


app.use(express.json());

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ตั้งค่า multer สำหรับเก็บไฟล์
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'employee_profile_images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => {
      // แก้ชื่อไฟล์ให้เป็นตัวอักษรภาษาอังกฤษ + ตัวเลข + _ เท่านั้น
      const originalName = file.originalname
        .toLowerCase()
        .replace(/\s+/g, '-')        // แทนช่องว่างด้วย -
        .replace(/[^a-z0-9\-\.]/g, ''); // ลบตัวอักษรพิเศษ
      return `${Date.now()}-${originalName}`;
    }
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
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  console.log('🔍 Login payload:', username, password); // log ค่าที่ส่งมา

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    console.log('🔍 Query result:', results); // log ผลลัพธ์จาก query

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

app.post('/api/employees', upload.single('profile_image'), async (req, res) => {
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
    phone_number,
    position,
    Google_drive
  } = req.body;

  if (!full_name || !citizen_id) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อและเลขบัตรประชาชน' });
  }

  const profileImage = req.file ? req.file.path : null;

  // คำนวณปีทำงาน
  let years_of_service = 0;
  if (start_date) {
    const start = new Date(start_date);
    const now = new Date();
    years_of_service = now.getFullYear() - start.getFullYear();
    if (now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) {
      years_of_service -= 1;
    }
  }

  const sql = `
    INSERT INTO employee (
      employee_id, full_name, gender, age, birth_date, citizen_id,
      start_date, years_of_service, bank_account, phone_number,
      current_salary, department, profile_image, position, Google_drive
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    employee_id || null,
    full_name,
    gender || null,
    parseInt(age) || 0,
    birth_date || null,
    citizen_id,
    start_date || null,
    years_of_service,
    bank_account || null,
    phone_number || null,
    parseFloat(current_salary?.toString().replace(/,/g, '')) || 0,
    department || null,
    profileImage || null,
    position || null,
    Google_drive || null
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูลพนักงาน', error: err });
    }

    res.status(201).json({
      message: 'เพิ่มข้อมูลพนักงานสำเร็จ',
      employee_id,
      profile_image: profileImage
    });
  });
});

// อัปเดตข้อมูลพนักงาน

app.put('/api/EDemployees/:id', upload.single('profile_image'), (req, res) => {
  const employeeId = req.params.id;

  // ตรวจสอบข้อมูลจาก client
  console.log('📥 [Backend] req.body:', req.body);
  console.log('📥 [Backend] req.file:', req.file);

  // fallback และ parse ค่าให้แน่นอน
  const full_name = req.body.full_name || '';
  const gender = req.body.gender || '';
  const age = isNaN(parseInt(req.body.age)) ? 0 : parseInt(req.body.age);
  const birth_date = req.body.birth_date || null;
  const citizen_id = req.body.citizen_id || '';
  const phone_number = req.body.phone_number || '';
  const start_date = req.body.start_date || null;
  const resign_date = req.body.resign_date || null;
  const bank_account = req.body.bank_account || '';
  const current_salary = isNaN(parseFloat(req.body.current_salary)) ? 0 : parseFloat(req.body.current_salary);
  const department = req.body.department || '';
  const position = req.body.position || '';
  const Google_drive = req.body.Google_drive || '';
  const user_id = isNaN(parseInt(req.body.user_id)) ? 0 : parseInt(req.body.user_id);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const offsetMs = d.getTimezoneOffset() * 60 * 1000;
    return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
  };

  const formatted_birth_date = formatDate(birth_date);
  const formatted_start_date = formatDate(start_date);
  const formatted_resign_date = resign_date ? formatDate(resign_date) : null;

  // ดึงข้อมูลเก่า
  db.query('SELECT * FROM employee WHERE employee_id = ?', [employeeId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Employee not found' });

    const oldData = results[0];

    const years_of_service = formatted_start_date
      ? (formatted_resign_date
          ? new Date(formatted_resign_date).getFullYear() - new Date(formatted_start_date).getFullYear()
          : new Date().getFullYear() - new Date(formatted_start_date).getFullYear())
      : 0;

    // ถ้ามีไฟล์ใหม่ ให้ใช้ URL จาก Cloudinary, ถ้าไม่มีก็ใช้ค่าเก่าใน DB
    const profile_image = req.file ? req.file.path : oldData.profile_image;

    const sqlUpdate = `
      UPDATE employee SET
        full_name=?, gender=?, age=?, birth_date=?, citizen_id=?,
        start_date=?, resign_date=?, years_of_service=?, bank_account=?, phone_number=?,
        current_salary=?, department=?, position=?, Google_drive=?, profile_image=?
      WHERE employee_id=?
    `;

    const updateValues = [
      full_name, gender, age, formatted_birth_date, citizen_id,
      formatted_start_date, formatted_resign_date, years_of_service, bank_account, phone_number,
      current_salary, department, position, Google_drive, profile_image,
      employeeId
    ];

    db.query(sqlUpdate, updateValues, (updateErr) => {
      if (updateErr) return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดต' });

      // log fields สำคัญ
      const changedFields = { phone_number, full_name, department, position };
      const logSql = `
        INSERT INTO log_edemployee (user_id, action, target_table, target_id, description, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      const logValues = [user_id, 'Edit Employee', 'employee', employeeId, JSON.stringify(changedFields)];

      db.query(logSql, logValues, (logErr) => {
        if (logErr) console.error('❌ Error logging:', logErr);
        console.log('✅ Update Success for employee_id:', employeeId);

        // ส่งกลับ URL ของ Cloudinary ให้ React แสดงรูปได้ทันที
        return res.json({ message: '✅ อัปเดตสำเร็จ', profile_image });
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

app.delete('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM employee WHERE employee_id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Deleted successfully' });
  });
});



const distPath = path.join(__dirname, 'employee-dist');

// ตรวจสอบว่ามี index.html หรือไม่
const indexPath = path.join(distPath, 'index.html');
const indexExists = fs.existsSync(indexPath);

if (!indexExists) {
  console.error('❌ ไม่พบ index.html ใน:', indexPath);
} else {
  console.log('✅ พบ index.html แล้วใน:', indexPath);
}

// ✅ เสิร์ฟไฟล์ static จาก employee-dist
app.use(express.static(distPath));

// ✅ ส่ง index.html เมื่อไม่เจอ route ที่ตรง
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});


// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



// Serve static files from React build folder


