const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// --- Simple JSON Database Wrapper ---
function getDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ bookings: {} }, null, 2));
  }
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Auto-cleanup expired bookings on startup
function cleanupExpiredBookings() {
  const db = getDb();
  let changed = false;
  const now = new Date();
  
  for (const dateKey in db.bookings) {
    for (const timeKey in db.bookings[dateKey]) {
      const [year, month, day] = dateKey.split('-').map(Number);
      const [hour, minute] = timeKey.split(':').map(Number);
      const slotDateTime = new Date(year, month - 1, day, hour, minute);
      
      if (slotDateTime < now) {
        delete db.bookings[dateKey][timeKey];
        changed = true;
      }
    }
    // Remove empty dates
    if (Object.keys(db.bookings[dateKey]).length === 0) {
      delete db.bookings[dateKey];
      changed = true;
    }
  }
  
  if (changed) {
    saveDb(db);
    console.log(`[DB] Cleanup done.`);
  }
}

cleanupExpiredBookings();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Routes

// GET /api/bookings?date=2026-04-05 — get bookings for a specific date
app.get('/api/bookings', (req, res) => {
  try {
    const db = getDb();
    const date = req.query.date;
    
    if (date) {
      // Map {"10:00": "Name"} to array objects requested by client
      const dateBookings = db.bookings[date] || {};
      const rows = Object.entries(dateBookings).map(([time, client_name]) => ({ time, client_name }));
      res.json({ success: true, data: rows });
    } else {
      res.json({ success: true, data: db.bookings });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/bookings — create a new booking
app.post('/api/bookings', (req, res) => {
  const { date, time, client_name } = req.body;

  if (!date || !time || !client_name) {
    return res.status(400).json({ success: false, error: 'Nedostaju podaci: date, time, client_name' });
  }

  try {
    const db = getDb();
    if (!db.bookings[date]) db.bookings[date] = {};
    
    if (db.bookings[date][time] && db.bookings[date][time] !== 'BLOKIRANO') {
      return res.status(409).json({ success: false, error: 'Termin je već zauzet.' });
    }
    
    db.bookings[date][time] = client_name;
    saveDb(db);
    res.json({ success: true, message: 'Termin zakazan.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/bookings/:date/:time — update client name
app.put('/api/bookings/:date/:time', (req, res) => {
  const { date, time } = req.params;
  const { client_name } = req.body;

  if (!client_name) {
    return res.status(400).json({ success: false, error: 'Nedostaje client_name.' });
  }

  try {
    const db = getDb();
    if (db.bookings[date] && db.bookings[date][time]) {
      db.bookings[date][time] = client_name;
      saveDb(db);
      res.json({ success: true, message: 'Termin izmenjen.' });
    } else {
      res.status(404).json({ success: false, error: 'Termin nije pronađen.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/bookings/:date/:time — delete a booking
app.delete('/api/bookings/:date/:time', (req, res) => {
  const { date, time } = req.params;

  try {
    const db = getDb();
    if (db.bookings[date] && db.bookings[date][time]) {
      delete db.bookings[date][time];
      if (Object.keys(db.bookings[date]).length === 0) {
        delete db.bookings[date];
      }
      saveDb(db);
      res.json({ success: true, message: 'Termin obrisan.' });
    } else {
      res.status(404).json({ success: false, error: 'Termin nije pronađen.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🪒  Barber Shop Booking Server`);
  console.log(`📡  Pokrenut na: http://localhost:${PORT}`);
  console.log(`💾  Baza podataka: database.json`);
  console.log(`\nPritisnite Ctrl+C za zaustavljanje.\n`);
});
