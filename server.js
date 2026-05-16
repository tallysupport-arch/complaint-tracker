```javascript
require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 4000);

// Root Project Path
const PROJECT_ROOT = __dirname;
const PUBLIC_DIR = PROJECT_ROOT;
const DB_FILE = path.join(PROJECT_ROOT, 'complaints.db');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(PUBLIC_DIR));

// Database
const db = new sqlite3.Database(DB_FILE);

const run = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      err
        ? reject(err)
        : resolve({ id: this.lastID, changes: this.changes });
    })
  );

const get = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) =>
      err ? reject(err) : resolve(row)
    )
  );

const all = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) =>
      err ? reject(err) : resolve(rows)
    )
  );

// Error Handler
const asyncHandler = fn => (req, res) =>
  Promise.resolve(fn(req, res)).catch(err => {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  });

// SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth:
    process.env.EMAIL_USER && process.env.EMAIL_PASS
      ? {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      : undefined
});

// Initialize Database
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

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Health Check
app.get('/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    database: DB_FILE,
    status: 'Running'
  });
}));

// Login API
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

// Get Complaints
app.get('/complaints', asyncHandler(async (req, res) => {
  const rows = await all(
    'SELECT * FROM complaints ORDER BY id DESC'
  );

  res.json(rows);
}));

// Create Complaint
app.post('/complaints', asyncHandler(async (req, res) => {
  const c = req.body || {};

  const result = await run(
    `INSERT INTO complaints
    (ticketNo, clientName, mobile, email, issueType, issueDetails, assignedTo, status, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `CT-${Date.now()}`,
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
    id: result.id
  });
}));

// Send Email
app.post('/send-email', asyncHandler(async (req, res) => {
  const { to, subject, body } = req.body || {};

  if (!to) {
    return res.status(400).json({
      success: false,
      message: 'Recipient email required'
    });
  }

  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: subject || 'Complaint Update',
    text: body || 'Complaint updated successfully'
  });

  res.json({
    success: true,
    messageId: info.messageId
  });
}));

// Start Server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Database: ${DB_FILE}`);
    });
  })
  .catch(err => {
    console.error('Init failed', err);
    process.exit(1);
  });
```

## GitHub Upload Steps

1. Open `server.js`
2. Delete old code
3. Paste this full code
4. Click `Commit changes`
5. Render automatically redeploy karega

## Live URL

After deploy:

```text
https://complaint-tracker-mcpl.onrender.com
```
