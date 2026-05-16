require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 4000);

const PROJECT_ROOT = __dirname;
const PUBLIC_DIR = PROJECT_ROOT;
const DB_FILE = path.join(PROJECT_ROOT, 'complaints.db');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(PUBLIC_DIR));

const db = new sqlite3.Database(DB_FILE);

const run = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      err ? reject(err) : resolve({ id: this.lastID, changes: this.changes });
    })
  );

const all = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => {
      err ? reject(err) : resolve(rows);
    })
  );

const asyncHandler = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: String(process.env.EMAIL_SECURE || 'false') === 'true',
  auth:
    process.env.EMAIL_USER && process.env.EMAIL_PASS
      ? {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      : undefined
});

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketNo TEXT,
      clientName TEXT,
      mobile TEXT,
      email TEXT,
      issueType TEXT,
      issueDetails TEXT,
      assignedTo TEXT,
      status TEXT,
      priority TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database Initialized');
}

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    status: 'Running',
    database: DB_FILE
  });
}));

app.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};

  if (username === 'admin' && password === '1234') {
    return res.json({
      success: true,
      user: {
        username: 'admin',
        role: 'Admin'
      }
    });
  }

  res.json({
    success: false,
    message: 'Invalid Login'
  });
}));

app.get('/complaints', asyncHandler(async (req, res) => {
  const rows = await all('SELECT * FROM complaints ORDER BY id DESC');
  res.json(rows);
}));

app.post('/complaints', asyncHandler(async (req, res) => {
  const c = req.body || {};
  const ticketNo = `CT-${Date.now()}`;

  const result = await run(
    `
    INSERT INTO complaints
    (ticketNo, clientName, mobile, email, issueType, issueDetails, assignedTo, status, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      ticketNo,
      c.clientName || '',
      c.mobile || '',
      c.email || '',
      c.issueType || '',
      c.issueDetails || '',
      c.assignedTo || '',
      c.status || 'Open',
      c.priority || 'Medium'
    ]
  );

  res.json({
    success: true,
    id: result.id,
    ticketNo
  });
}));

app.post('/send-email', asyncHandler(async (req, res) => {
  const { to, subject, body } = req.body || {};

  if (!to) {
    return res.status(400).json({
      success: false,
      message: 'Recipient email required'
    });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(400).json({
      success: false,
      message: 'Email credentials missing'
    });
  }

  const info = await transporter.sendMail({
    from: `"Support Team" <${process.env.EMAIL_USER}>`,
    to,
    subject: subject || 'Complaint Update',
    text: body || 'Complaint updated successfully'
  });

  res.json({
    success: true,
    messageId: info.messageId
  });
}));

app.use((req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Database: ${DB_FILE}`);
    });
  })
  .catch((err) => {
    console.error('Init failed', err);
    process.exit(1);
  });
