import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import cors from 'cors';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize SQLite database
const dbDir = process.env.DATA_DIR || path.resolve(process.cwd(), '.data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.resolve(dbDir, 'school.db');
const db = new Database(dbPath);
console.log('Connected to the SQLite database.');

function initDb() {
  // Settings Table
  db.exec(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schoolName TEXT,
    address TEXT,
    logoUrl TEXT
  )`);

  // Insert default settings if empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (settingsCount.count === 0) {
    db.prepare(`INSERT INTO settings (schoolName, address, logoUrl) VALUES (?, ?, ?)`).run(
      'Global International School', '123 Education Lane, Knowledge City', 'https://picsum.photos/seed/school/200/200'
    );
  }

  // Students Table
  db.exec(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rollNo TEXT UNIQUE NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    contact TEXT NOT NULL DEFAULT '',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Migrations for existing tables
  try {
    db.exec(`ALTER TABLE students ADD COLUMN contact TEXT NOT NULL DEFAULT ''`);
  } catch (e) {
    // Ignore if column already exists
  }
  try {
    db.exec(`ALTER TABLE students ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP`);
  } catch (e) {
    // Ignore if column already exists
  }

  // Fee Structures Table
  db.exec(`CREATE TABLE IF NOT EXISTS fee_structures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class TEXT NOT NULL,
    feeType TEXT NOT NULL,
    amount REAL NOT NULL
  )`);

  // Insert default fee structures if empty
  const feeCount = db.prepare('SELECT COUNT(*) as count FROM fee_structures').get() as { count: number };
  if (feeCount.count === 0) {
    const defaultFees = [
      ['10', 'Tuition', 5000],
      ['10', 'Library', 500],
      ['10', 'Exam', 1000],
      ['9', 'Tuition', 4500],
      ['9', 'Library', 500],
      ['9', 'Exam', 1000],
    ];
    const stmt = db.prepare(`INSERT INTO fee_structures (class, feeType, amount) VALUES (?, ?, ?)`);
    const insertMany = db.transaction((fees) => {
      for (const fee of fees) stmt.run(fee);
    });
    insertMany(defaultFees);
  }

  // Payments Table
  db.exec(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    month TEXT NOT NULL,
    amount REAL NOT NULL,
    lateFine REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    totalAmount REAL NOT NULL,
    paymentMode TEXT NOT NULL,
    paymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES students(id)
  )`);
}

initDb();

// API Routes

// --- Settings ---
app.get('/api/settings', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM settings LIMIT 1').get();
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', (req, res) => {
  const { schoolName, address, logoUrl } = req.body;
  try {
    const info = db.prepare(
      'UPDATE settings SET schoolName = ?, address = ?, logoUrl = ? WHERE id = (SELECT id FROM settings LIMIT 1)'
    ).run(schoolName, address, logoUrl);
    res.json({ success: true, changes: info.changes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Students ---
app.get('/api/students', (req, res) => {
  const { search, class: studentClass, section } = req.query;
  try {
    let query = 'SELECT * FROM students WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (name LIKE ? OR rollNo LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (studentClass) {
      query += ' AND class = ?';
      params.push(studentClass);
    }
    if (section) {
      query += ' AND section = ?';
      params.push(section);
    }

    query += ' ORDER BY name';
    
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', (req, res) => {
  const { name, rollNo, studentClass, section, contact } = req.body;
  try {
    const info = db.prepare(
      'INSERT INTO students (name, rollNo, class, section, contact) VALUES (?, ?, ?, ?, ?)'
    ).run(name, rollNo, studentClass, section, contact || '');
    res.json({ id: info.lastInsertRowid });
  } catch (err: any) {
    if (err.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'A student with this Roll Number already exists.' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.put('/api/students/:id', (req, res) => {
  const { name, rollNo, studentClass, section, contact } = req.body;
  try {
    const info = db.prepare(
      'UPDATE students SET name = ?, rollNo = ?, class = ?, section = ?, contact = ? WHERE id = ?'
    ).run(name, rollNo, studentClass, section, contact || '', req.params.id);
    res.json({ success: true, changes: info.changes });
  } catch (err: any) {
    if (err.message.includes('UNIQUE')) {
      res.status(400).json({ error: 'A student with this Roll Number already exists.' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.delete('/api/students/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    res.json({ success: true, changes: info.changes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Fee Structures ---
app.get('/api/fees/structure/:class', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM fee_structures WHERE class = ? OR class = ?').all(req.params.class, 'School');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fees/structure', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM fee_structures ORDER BY class, feeType').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fees/structure', (req, res) => {
  const { studentClass, feeType, amount } = req.body;
  try {
    const info = db.prepare(
      'INSERT INTO fee_structures (class, feeType, amount) VALUES (?, ?, ?)'
    ).run(studentClass, feeType, amount);
    res.json({ id: info.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/fees/structure/:id', (req, res) => {
  const { studentClass, feeType, amount } = req.body;
  try {
    const info = db.prepare(
      'UPDATE fee_structures SET class = ?, feeType = ?, amount = ? WHERE id = ?'
    ).run(studentClass, feeType, amount, req.params.id);
    res.json({ success: true, changes: info.changes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/fees/structure/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM fee_structures WHERE id = ?').run(req.params.id);
    res.json({ success: true, changes: info.changes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Payments ---
app.get('/api/payments', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT p.*, s.name as studentName, s.rollNo, s.class, s.section 
      FROM payments p 
      JOIN students s ON p.studentId = s.id 
      ORDER BY p.paymentDate DESC
    `).all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', (req, res) => {
  const { studentId, month, amount, lateFine, discount, totalAmount, paymentMode } = req.body;
  try {
    const info = db.prepare(
      'INSERT INTO payments (studentId, month, amount, lateFine, discount, totalAmount, paymentMode) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(studentId, month, amount, lateFine, discount, totalAmount, paymentMode);
    res.json({ id: info.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Analytics ---
app.get('/api/analytics', (req, res) => {
  try {
    const analytics: any = {};
    
    const studentsRow = db.prepare('SELECT COUNT(*) as total FROM students').get() as any;
    analytics.totalStudents = studentsRow ? studentsRow.total : 0;
    
    const paymentsRow = db.prepare('SELECT SUM(totalAmount) as total FROM payments').get() as any;
    analytics.totalCollection = paymentsRow && paymentsRow.total ? paymentsRow.total : 0;
    
    const dailyRows = db.prepare(`
      SELECT date(paymentDate) as date, SUM(totalAmount) as amount 
      FROM payments 
      GROUP BY date(paymentDate) 
      ORDER BY date(paymentDate) DESC 
      LIMIT 7
    `).all();
    analytics.dailyCollection = dailyRows || [];
    
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Defaulters ---
app.get('/api/defaulters', (req, res) => {
  try {
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const rows = db.prepare(`
      SELECT s.* 
      FROM students s
      WHERE s.id NOT IN (
        SELECT studentId FROM payments WHERE month = ?
      )
    `).all(currentMonth);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import.meta.dirname;
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
