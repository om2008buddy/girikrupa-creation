// Gurukrupa Creation - Backend Server
// Built with Node.js 22 built-in modules (HTTP, SQLite, Crypto, FS, Path)

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 4500;
const DB_PATH = path.join(__dirname, 'gurukrupa.db');
const PUBLIC_DIR = path.join(__dirname, 'public');
const APP_PASSCODE = '6390';

// Ensure public dir exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Copy or link logo.png into public if needed
const rootLogo = path.join(__dirname, 'logo.png');
const publicLogo = path.join(PUBLIC_DIR, 'logo.png');
if (fs.existsSync(rootLogo) && !fs.existsSync(publicLogo)) {
  try {
    fs.copyFileSync(rootLogo, publicLogo);
  } catch (err) {
    console.error('Error copying logo to public:', err);
  }
}

// Initialize SQLite database
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys for high reliability
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  -- Merchants (વેપારી)
  CREATE TABLE IF NOT EXISTS merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Designs Master (ડિઝાઇન કેટલોગ)
  CREATE TABLE IF NOT EXISTS designs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    design_no TEXT NOT NULL UNIQUE,
    name TEXT,
    party_rate REAL DEFAULT 0,
    karigar_kurti_rate REAL DEFAULT 0,
    karigar_pant_rate REAL DEFAULT 0,
    press_rate REAL DEFAULT 0,
    material_cost REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Inward Lots (વેપારી પાસેથી આવેલ માલ)
  CREATE TABLE IF NOT EXISTS inward_lots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lot_no TEXT,
    merchant_id INTEGER NOT NULL,
    design_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    total_pieces INTEGER NOT NULL,
    rate_per_piece REAL NOT NULL,
    total_amount REAL NOT NULL,
    fabric_details TEXT,
    status TEXT DEFAULT 'કામ ચાલુ છે',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    FOREIGN KEY(design_id) REFERENCES designs(id) ON DELETE CASCADE
  );

  -- Karigars (કારીગર)
  CREATE TABLE IF NOT EXISTS karigars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    speciality TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Karigar Work Entries (કારીગર કામ / પીસ)
  CREATE TABLE IF NOT EXISTS karigar_work_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    karigar_id INTEGER NOT NULL,
    lot_id INTEGER,
    design_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    kurti_pieces INTEGER DEFAULT 0,
    kurti_rate REAL DEFAULT 0,
    pant_pieces INTEGER DEFAULT 0,
    pant_rate REAL DEFAULT 0,
    other_pieces INTEGER DEFAULT 0,
    other_rate REAL DEFAULT 0,
    other_label TEXT,
    total_amount REAL NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(karigar_id) REFERENCES karigars(id) ON DELETE CASCADE,
    FOREIGN KEY(design_id) REFERENCES designs(id) ON DELETE CASCADE
  );

  -- Karigar Upad / Advance (કારીગર ઉપાડ)
  CREATE TABLE IF NOT EXISTS karigar_upad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    karigar_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_mode TEXT DEFAULT 'રોકડ',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(karigar_id) REFERENCES karigars(id) ON DELETE CASCADE
  );

  -- Press Vendors (પ્રેસ વાળા)
  CREATE TABLE IF NOT EXISTS press_vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    default_rate REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Press Entries (પ્રેસ કામ એન્ટ્રી)
  CREATE TABLE IF NOT EXISTS press_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id INTEGER NOT NULL,
    lot_id INTEGER,
    design_id INTEGER,
    date TEXT NOT NULL,
    pieces INTEGER NOT NULL,
    rate_per_piece REAL NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'બાકી',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(vendor_id) REFERENCES press_vendors(id) ON DELETE CASCADE
  );

  -- Raw Materials (મટીરીયલ્સ / કાચો માલ ખર્ચ)
  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_name TEXT NOT NULL,
    date TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    rate REAL NOT NULL,
    total_amount REAL NOT NULL,
    supplier_name TEXT,
    bill_no TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Factory Overheads / Khata Kharch (કારખાના ખાતા ખર્ચ)
  CREATE TABLE IF NOT EXISTS factory_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    paid_to TEXT,
    payment_mode TEXT DEFAULT 'રોકડ',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Fixed Staff (ફિક્સ પગાર વાળા સ્ટાફ)
  CREATE TABLE IF NOT EXISTS fixed_staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT,
    salary_type TEXT DEFAULT 'દૈનિક',
    base_rate REAL NOT NULL,
    standard_hours REAL DEFAULT 8,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Staff Attendance & Hours (હાજરી અને કલાક)
  CREATE TABLE IF NOT EXISTS staff_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    hours_worked REAL NOT NULL,
    calculated_pay REAL NOT NULL,
    advance_deduction REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(staff_id) REFERENCES fixed_staff(id) ON DELETE CASCADE
  );

  -- Delivery Challans (વેપારી માલ ચલણ)
  CREATE TABLE IF NOT EXISTS delivery_challans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challan_no TEXT NOT NULL UNIQUE,
    date TEXT NOT NULL,
    merchant_id INTEGER NOT NULL,
    lot_id INTEGER,
    items_json TEXT NOT NULL,
    total_pieces INTEGER NOT NULL,
    grand_total REAL NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'જમા કરાવેલ',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
  );

  -- App Settings
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Insert default settings if not exists
const checkSetting = db.prepare('SELECT value FROM app_settings WHERE key = ?').get('company_name');
if (!checkSetting) {
  const insertSetting = db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)');
  insertSetting.run('company_name', 'GURUKRUPA CREATION');
  insertSetting.run('company_tagline', 'Kurti - Pant Manufacturing & Jobwork Specialist');
  insertSetting.run('company_phone', '');
  insertSetting.run('company_address', '');
  insertSetting.run('challan_prefix', 'GK-CH-');
  insertSetting.run('passcode', APP_PASSCODE);
}

// Active sessions set (in-memory token store)
const activeTokens = new Set();

// Helper to get local IP addresses
function getNetworkIps() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

// Helper: send JSON response
function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-passcode',
  });
  res.end(JSON.stringify(data));
}

// Helper: parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Auth Verification Helper
function verifyAuth(req) {
  const authHeader = req.headers['authorization'];
  const passcodeHeader = req.headers['x-passcode'];

  if (passcodeHeader === APP_PASSCODE) return true;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (activeTokens.has(token)) return true;
  }
  return false;
}

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Request Handler
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-passcode',
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    // 1. PUBLIC / SYSTEM ENDPOINTS
    if (pathname === '/api/health') {
      return sendJSON(res, {
        status: 'ok',
        appName: 'Gurukrupa Creation',
        version: '1.0.0',
        ips: getNetworkIps(),
        port: PORT,
      });
    }

    if (pathname === '/api/auth/verify' && method === 'POST') {
      const body = await parseBody(req);
      if (body.passcode === APP_PASSCODE) {
        const token = crypto.randomBytes(24).toString('hex');
        activeTokens.add(token);
        return sendJSON(res, { success: true, token, message: 'પાસવર્ડ સાચો છે' });
      }
      return sendJSON(res, { success: false, message: 'ખોટો પાસવર્ડ! કૃપા કરીને 6390 દાખલ કરો.' }, 401);
    }

    // AUTH GUARD FOR ALL OTHER /api/* ROUTES
    if (pathname.startsWith('/api/')) {
      if (!verifyAuth(req)) {
        return sendJSON(res, { error: 'Unauthorized', message: 'કૃપા કરીને પહેલા પાસવર્ડ દાખલ કરો' }, 401);
      }
    }

    // 2. SETTINGS
    if (pathname === '/api/settings' && method === 'GET') {
      const rows = db.prepare('SELECT key, value FROM app_settings').all();
      const settings = {};
      for (const r of rows) settings[r.key] = r.value;
      settings.serverIps = getNetworkIps();
      settings.port = PORT;
      return sendJSON(res, settings);
    }

    if (pathname === '/api/settings' && method === 'POST') {
      const body = await parseBody(req);
      const updateStmt = db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
      for (const [k, v] of Object.entries(body)) {
        updateStmt.run(k, String(v));
      }
      return sendJSON(res, { success: true, message: 'સેટિંગ્સ સેવ થઈ ગયા' });
    }

    // 3. MERCHANTS (વેપારી)
    if (pathname === '/api/merchants') {
      if (method === 'GET') {
        const rows = db.prepare('SELECT * FROM merchants ORDER BY name ASC').all();
        return sendJSON(res, rows);
      }
      if (method === 'POST') {
        const b = await parseBody(req);
        if (!b.name || !b.name.trim()) return sendJSON(res, { error: 'વેપારીનું નામ જરૂરી છે' }, 400);
        const stmt = db.prepare('INSERT INTO merchants (name, phone, address, notes) VALUES (?, ?, ?, ?)');
        const result = stmt.run(b.name.trim(), b.phone || '', b.address || '', b.notes || '');
        return sendJSON(res, { id: result.lastInsertRowid, message: 'વેપારી સફળતાપૂર્વક ઉમેરાયા' });
      }
    }
    if (pathname.startsWith('/api/merchants/')) {
      const id = parseInt(pathname.split('/')[3], 10);
      if (method === 'PUT') {
        const b = await parseBody(req);
        db.prepare('UPDATE merchants SET name = ?, phone = ?, address = ?, notes = ? WHERE id = ?')
          .run(b.name.trim(), b.phone || '', b.address || '', b.notes || '', id);
        return sendJSON(res, { success: true, message: 'વેપારી વિગત અપડેટ થઈ' });
      }
      if (method === 'DELETE') {
        db.prepare('DELETE FROM merchants WHERE id = ?').run(id);
        return sendJSON(res, { success: true, message: 'વેપારી દૂર કરવામાં આવ્યા' });
      }
    }

    // 4. DESIGNS MASTER (ડિઝાઇન)
    if (pathname === '/api/designs') {
      if (method === 'GET') {
        const rows = db.prepare('SELECT * FROM designs ORDER BY design_no ASC').all();
        return sendJSON(res, rows);
      }
      if (method === 'POST') {
        const b = await parseBody(req);
        if (!b.design_no || !b.design_no.trim()) return sendJSON(res, { error: 'ડિઝાઇન નંબર જરૂરી છે' }, 400);
        const stmt = db.prepare(`
          INSERT INTO designs (design_no, name, party_rate, karigar_kurti_rate, karigar_pant_rate, press_rate, material_cost, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          b.design_no.trim(),
          b.name || '',
          Number(b.party_rate) || 0,
          Number(b.karigar_kurti_rate) || 0,
          Number(b.karigar_pant_rate) || 0,
          Number(b.press_rate) || 0,
          Number(b.material_cost) || 0,
          b.notes || ''
        );
        return sendJSON(res, { id: result.lastInsertRowid, message: 'ડિઝાઇન સફળતાપૂર્વક ઉમેરાઈ' });
      }
    }
    if (pathname.startsWith('/api/designs/')) {
      const id = parseInt(pathname.split('/')[3], 10);
      if (method === 'PUT') {
        const b = await parseBody(req);
        db.prepare(`
          UPDATE designs SET design_no = ?, name = ?, party_rate = ?, karigar_kurti_rate = ?, karigar_pant_rate = ?, press_rate = ?, material_cost = ?, notes = ?
          WHERE id = ?
        `).run(
          b.design_no.trim(),
          b.name || '',
          Number(b.party_rate) || 0,
          Number(b.karigar_kurti_rate) || 0,
          Number(b.karigar_pant_rate) || 0,
          Number(b.press_rate) || 0,
          Number(b.material_cost) || 0,
          b.notes || '',
          id
        );
        return sendJSON(res, { success: true, message: 'ડિઝાઇન વિગત અપડેટ થઈ' });
      }
      if (method === 'DELETE') {
        db.prepare('DELETE FROM designs WHERE id = ?').run(id);
        return sendJSON(res, { success: true, message: 'ડિઝાઇન દૂર કરવામાં આવી' });
      }
    }

    // 5. INWARD LOTS (વેપારી પાસેથી આવેલ માલ)
    if (pathname === '/api/lots') {
      if (method === 'GET') {
        const rows = db.prepare(`
          SELECT l.*, m.name as merchant_name, d.design_no, d.name as design_name
          FROM inward_lots l
          LEFT JOIN merchants m ON l.merchant_id = m.id
          LEFT JOIN designs d ON l.design_id = d.id
          ORDER BY l.date DESC, l.id DESC
        `).all();
        return sendJSON(res, rows);
      }
      if (method === 'POST') {
        const b = await parseBody(req);
        const pieces = Number(b.total_pieces) || 0;
        const rate = Number(b.rate_per_piece) || 0;
        const total = pieces * rate;
        const lot_no = b.lot_no ? b.lot_no.trim() : `LOT-${Date.now().toString().slice(-5)}`;
        const stmt = db.prepare(`
          INSERT INTO inward_lots (lot_no, merchant_id, design_id, date, total_pieces, rate_per_piece, total_amount, fabric_details, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          lot_no,
          Number(b.merchant_id),
          Number(b.design_id),
          b.date || new Date().toISOString().split('T')[0],
          pieces,
          rate,
          total,
          b.fabric_details || '',
          b.status || 'કામ ચાલુ છે',
          b.notes || ''
        );
        return sendJSON(res, { id: result.lastInsertRowid, message: 'માલ એન્ટ્રી સફળતાપૂર્વક થઈ ગઈ' });
      }
    }
    if (pathname.startsWith('/api/lots/')) {
      const id = parseInt(pathname.split('/')[3], 10);
      if (method === 'PUT') {
        const b = await parseBody(req);
        const pieces = Number(b.total_pieces) || 0;
        const rate = Number(b.rate_per_piece) || 0;
        const total = pieces * rate;
        db.prepare(`
          UPDATE inward_lots SET lot_no = ?, merchant_id = ?, design_id = ?, date = ?, total_pieces = ?, rate_per_piece = ?, total_amount = ?, fabric_details = ?, status = ?, notes = ?
          WHERE id = ?
        `).run(
          b.lot_no || '',
          Number(b.merchant_id),
          Number(b.design_id),
          b.date,
          pieces,
          rate,
          total,
          b.fabric_details || '',
          b.status || 'કામ ચાલુ છે',
          b.notes || '',
          id
        );
        return sendJSON(res, { success: true, message: 'માલ એન્ટ્રી અપડેટ થઈ' });
      }
      if (method === 'DELETE') {
        db.prepare('DELETE FROM inward_lots WHERE id = ?').run(id);
        return sendJSON(res, { success: true, message: 'એન્ટ્રી દૂર કરવામાં આવી' });
      }
    }

    // 6. KARIGARS (કારીગર)
    if (pathname === '/api/karigars') {
      if (method === 'GET') {
        const rows = db.prepare('SELECT * FROM karigars ORDER BY name ASC').all();
        return sendJSON(res, rows);
      }
      if (method === 'POST') {
        const b = await parseBody(req);
        if (!b.name || !b.name.trim()) return sendJSON(res, { error: 'કારીગરનું નામ જરૂરી છે' }, 400);
        const stmt = db.prepare('INSERT INTO karigars (name, phone, speciality, address) VALUES (?, ?, ?, ?)');
        const result = stmt.run(b.name.trim(), b.phone || '', b.speciality || 'સિલાઈ', b.address || '');
        return sendJSON(res, { id: result.lastInsertRowid, message: 'કારીગર સફળતાપૂર્વક ઉમેરાયા' });
      }
    }
    if (pathname.startsWith('/api/karigars/')) {
      const parts = pathname.split('/');
      const id = parseInt(parts[3], 10);

      // Karigar Ledger & Statement (/api/karigars/:id/ledger)
      if (parts[4] === 'ledger' && method === 'GET') {
        const karigar = db.prepare('SELECT * FROM karigars WHERE id = ?').get(id);
        if (!karigar) return sendJSON(res, { error: 'કારીગર મળ્યા નથી' }, 404);

        const workEntries = db.prepare(`
          SELECT w.*, d.design_no, d.name as design_name, l.lot_no
          FROM karigar_work_entries w
          LEFT JOIN designs d ON w.design_id = d.id
          LEFT JOIN inward_lots l ON w.lot_id = l.id
          WHERE w.karigar_id = ?
          ORDER BY w.date DESC, w.id DESC
        `).all(id);

        const upadEntries = db.prepare(`
          SELECT * FROM karigar_upad WHERE karigar_id = ? ORDER BY date DESC, id DESC
        `).all(id);

        const totalEarned = workEntries.reduce((sum, w) => sum + (Number(w.total_amount) || 0), 0);
        const totalUpad = upadEntries.reduce((sum, u) => sum + (Number(u.amount) || 0), 0);
        const netBalance = totalEarned - totalUpad;

        return sendJSON(res, {
          karigar,
          workEntries,
          upadEntries,
          summary: {
            totalEarned,
            totalUpad,
            netBalance,
          }
        });
      }

      if (method === 'PUT') {
        const b = await parseBody(req);
        db.prepare('UPDATE karigars SET name = ?, phone = ?, speciality = ?, address = ? WHERE id = ?')
          .run(b.name.trim(), b.phone || '', b.speciality || '', b.address || '', id);
        return sendJSON(res, { success: true, message: 'કારીગર વિગત અપડેટ થઈ' });
      }
      if (method === 'DELETE') {
        db.prepare('DELETE FROM karigars WHERE id = ?').run(id);
        return sendJSON(res, { success: true, message: 'કારીગર દૂર કરવામાં આવ્યા' });
      }
    }

    // 7. KARIGAR WORK ENTRIES (કારીગર કામ / પીસ બનાવ્યા)
    if (pathname === '/api/karigar-work') {
      if (method === 'GET') {
        const rows = db.prepare(`
          SELECT w.*, k.name as karigar_name, d.design_no, d.name as design_name, l.lot_no
          FROM karigar_work_entries w
          LEFT JOIN karigars k ON w.karigar_id = k.id
          LEFT JOIN designs d ON w.design_id = d.id
          LEFT JOIN inward_lots l ON w.lot_id = l.id
          ORDER BY w.date DESC, w.id DESC
        `).all();
        return sendJSON(res, rows);
      }
      if (method === 'POST') {
        const b = await parseBody(req);
        const kurtiPcs = Number(b.kurti_pieces) || 0;
        const kurtiRate = Number(b.kurti_rate) || 0;
        const pantPcs = Number(b.pant_pieces) || 0;
        const pantRate = Number(b.pant_rate) || 0;
        const otherPcs = Number(b.other_pieces) || 0;
        const otherRate = Number(b.other_rate) || 0;

        const total = (kurtiPcs * kurtiRate) + (pantPcs * pantRate) + (otherPcs * otherRate);

        const stmt = db.prepare(`
          INSERT INTO karigar_work_entries (karigar_id, lot_id, design_id, date, kurti_pieces, kurti_rate, pant_pieces, pant_rate, other_pieces, other_rate, other_label, total_amount, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          Number(b.karigar_id),
          b.lot_id ? Number(b.lot_id) : null,
          Number(b.design_id),
          b.date || new Date().toISOString().split('T')[0],
          kurtiPcs,
          kurtiRate,
          pantPcs,
          pantRate,
          otherPcs,
          otherRate,
          b.other_label || '',
          total,
          b.notes || ''
        );
        return sendJSON(res, { id: result.lastInsertRowid, total_amount: total, message: 'કારીગર કામ એન્ટ્રી ઉમેરાઈ ગઈ' });
      }
    }
    if (pathname.startsWith('/api/karigar-work/')) {
      const id = parseInt(pathname.split('/')[3], 10);
      if (method === 'DELETE') {
        db.prepare('DELETE FROM karigar_work_entries WHERE id = ?').run(id);
        return sendJSON(res, { success: true, message: 'એન્ટ્રી દૂર કરવામાં આવી' });
      }
    }

    // 8. KARIGAR UPAD / ADVANCE (કારીગર ઉપાડ)
    if (pathname === '/api/karigar-upad') {
      if (method === 'GET') {
        const rows = db.prepare(`
          SELECT u.*, k.name as karigar_name
          FROM karigar_upad u
          LEFT JOIN karigars k ON u.karigar_id = k.id
          ORDER BY u.date DESC, u.id DESC
        `).all();
        return sendJSON(res, rows);
      }
      if (method === 'POST') {
        const b = await parseBody(req);
        const amount = Number(b.amount) || 0;
        if (!b.karigar_id || amount <= 0) return sendJSON(res, { error: 'કારીગર અને ઉપાડ રકમ જરૂરી છે' }, 400);

        const stmt = db.prepare(`
          INSERT INTO karigar_upad (karigar_id, date, amount, payment_mode, notes)
          VALUES (?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          Number(b.karigar_id),
          b.date || new Date().toISOString().split('T')[0],
          amount,
          b.payment_mode || 'રોકડ',
          b.notes || ''
        );
        return sendJSON(res, { id: result.lastInsertRowid, message: 'કારીગર ઉપાડ નોંધાઈ ગયો' });
      }
    }
    if (pathname.startsWith('/api/karigar-upad/')) {
      const id = parseInt(pathname.split('/')[3], 10);
      if (method === 'DELETE') {
        db.prepare('DELETE FROM karigar_upad WHERE id = ?').run(id);
        return sendJSON(res, { success: true, message: 'ઉપાડ એન્ટ્રી દૂર થઈ' });
      }
    }

    // 9. PRESS VENDORS & ENTRIES (પ્રેસ વાળા અને હિસાબ)
    if (pathname === '/api/press-vendors') {
      if (method === 'GET') {
        const rows = db.prepare('SELECT * FROM press_vendors ORDER BY name ASC').all();
        return sendJSON(res, rows);
      }
      if (method === 'POST') {
        const b = await parseBody(req);
        if (!b.name || !b.name.trim()) return sendJSON(res, { error: 'પ્રેસ વાળાનું નામ જરૂરી છે' }, 400);
        const stmt = db.prepare('INSERT INTO press_vendors (name, phone, address, default_rate) VALUES (?, ?, ?, ?)');
        const result = stmt.run(b.name.trim(), b.phone || '', b.address || '', Number(b.default_rate) || 0);
        return sendJSON(res, { id: result.lastInsertRowid, message: 'પ્રેસ વાળા સફળતાપૂર્વક ઉમેરાયા' });
      }
    }
    if (pathname.startsWith('/api/press-vendors/')) {
      const id = parseInt(pathname.split('/')[3], 10);
      if (method === 'DELETE') {
        db.prepare('DELETE FROM press_vendors WHERE id = ?').run(id);
        return sendJSON(res, { success: true, message: 'પ્રેસ વાળા દૂર કરવામાં આવ્યા' });
      }
    }

    if (pathname === '/api/press-entries') {
      if (method === 'GET') {
        const rows = db.prepare(`
          SELECT p.*, v.name as vendor_name, d.design_no, d.name as design_name, l.lot_no
          FROM press_entries p
          LEFT JOIN press_vendors v ON p.vendor_id = v.id
          LEFT JOIN designs d ON p.design_id = d.id
          LEFT JOIN inward_lots l ON p.lot_id = l.id
          ORDER BY p.date DESC, p.id DESC
        `).all();
        return sendJSON(res, rows);
      }
      if (method === 'POST') {
        const b = await parseBody(req);
        const pieces = Number(b.pieces) || 0;
        const rate = Number(b.rate_per_piece) || 0;
        const total = pieces * rate;

        const stmt = db.prepare(`
          INSERT INTO press_entries (vendor_id, lot_id, design_id, date, pieces, rate_per_piece, total_amount, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          Number(b.vendor_id),
          b.lot_id ? Number(b.lot_id) : null,
          b.design_id ? Number(b.design_id) : null,
          b.date || new Date().toISOString().split('T')[0],
          pieces,
          rate,
          total,
          b.status || 'બાકી',
          b.notes || ''
        );
        return sendJSON(res, { id: result.lastInsertRowid, total_amount: total, message: 'પ્રેસ એન્ટ્રી નોંધાઈ ગઈ' });
      }
    }
    if (pathname.startsWith('/api/press-entries/')) {
      const id = parseInt(pathname.split('/')[3], 10);
      if (method === 'DELETE') {
        db.prepare('DELETE FROM press_entries WHERE id = ?').run(id);
        return sendJSON(res, { success: true, message: 'પ્રેસ એન્ટ્રી દૂર થઈ' });
      }
    }

    // 10. MATERIALS (મટીરીયલ્સ / કાચો માલ ખર્ચ)
    if (pathname === '/api/materials') {
      if (method === 'GET') {
        const rows = db.prepare('SELECT * FROM materials ORDER BY date DESC, id DESC').all();
        return sendJSON(res, rows);
      }
      if (method === 'POST') {
        const b = await parseBody(req);
        const qty = Number(b.quantity) || 0;
        const rate = Number(b.rate) || 0;
        const total = qty * rate;

        const stmt = db.prepare(`
          INSERT INTO materials (material_name, date, quantity, unit, rate, total_amount, supplier_name, bill_no, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          b.material_name.trim(),
          b.date || new Date().toISOString().split('T')[0],
          qty,
          b.unit || 'નંગ',
          rate,
          total,
          b.supplier_name || '',
          b.bill_no || '',
          b.notes || ''
        );
        return sendJSON(res, { id: result.lastInsertRowid, total_amount: total, message: 'મટીરીયલ ખર્ચ નોંધાઈ ગયો' });
      }
    }
    if (pathname.startsWith('/api/materials/')) {
      const id = parseInt(pathname.split('/')[3], 10);
      if (method === 'DELETE') {
        db.prepare('DELETE FROM materials WHERE id = ?').run(id);
        return sendJSON(res, { success: true, message: 'મટીરીયલ એન્ટ્રી દૂર થઈ' });
      }
    }

    // 11. FACTORY EXPENSES / KHATA KHARCH (કારખાના ખાતા ખર્ચ)
    if (pathname === '/api/expenses') {
      if (method === 'GET') {
        const rows = db.prepare('SELECT * FROM factory_expenses ORDER BY date DESC, id DESC').all();
        return sendJSON(res, rows);
      }
      if (method === 'POST') {
        const b = await parseBody(req);
        const amount = Number(b.amount) || 0;
        if (!b.category || amount <= 0) return sendJSON(res, { error: 'ખર્ચ કેટેગરી અને રકમ જરૂરી છે' }, 400);

        const stmt = db.prepare(`
          INSERT INTO factory_expenses (category, date, amount, paid_to, payment_mode, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          b.category.trim(),
          b.date || new Date().toISOString().split('T')[0],
          amount,
          b.paid_to || '',
          b.payment_mode || 'રોકડ',
          b.notes || ''
        );
        return sendJSON(res, { id: result.lastInsertRowid, message: 'ખાતા ખર્ચ સફળતાપૂર્વક નોંધાઈ ગયો' });
      }
    }
    if (pathname.startsWith('/api/expenses/')) {
      const id = parseInt(pathname.split('/')[3], 10);
      if (method === 'DELETE') {
        db.prepare('DELETE FROM factory_expenses WHERE id = ?').run(id);
        return sendJSON(res, { success: true, message: 'ખર્ચ એન્ટ્રી દૂર થઈ' });
      }
    }

    // 12. FIXED STAFF & ATTENDANCE (ફિક્સ પગાર સ્ટાફ અને કલાક)
    if (pathname === '/api/staff') {
      if (method === 'GET') {
        const rows = db.prepare('SELECT * FROM fixed_staff ORDER BY name ASC').all();
        return sendJSON(res, rows);
      }
      if (method === 'POST') {
        const b = await parseBody(req);
        if (!b.name || !b.name.trim()) return sendJSON(res, { error: 'સ્ટાફનું નામ જરૂરી છે' }, 400);
        const stmt = db.prepare(`
          INSERT INTO fixed_staff (name, phone, role, salary_type, base_rate, standard_hours)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          b.name.trim(),
          b.phone || '',
          b.role || 'હેલ્પર',
          b.salary_type || 'દૈનિક',
          Number(b.base_rate) || 0,
          Number(b.standard_hours) || 8
        );
        return sendJSON(res, { id: result.lastInsertRowid, message: 'ફિક્સ પગાર સ્ટાફ ઉમેરાયા' });
      }
    }
    if (pathname.startsWith('/api/staff/')) {
      const parts = pathname.split('/');
      const id = parseInt(parts[3], 10);
      if (method === 'DELETE') {
        db.prepare('DELETE FROM fixed_staff WHERE id = ?').run(id);
        return sendJSON(res, { success: true, message: 'સ્ટાફ દૂર કરવામાં આવ્યા' });
      }
    }

    if (pathname === '/api/staff-attendance') {
      if (method === 'GET') {
        const rows = db.prepare(`
          SELECT a.*, s.name as staff_name, s.role, s.salary_type, s.base_rate
          FROM staff_attendance a
          LEFT JOIN fixed_staff s ON a.staff_id = s.id
          ORDER BY a.date DESC, a.id DESC
        `).all();
        return sendJSON(res, rows);
      }
      if (method === 'POST') {
        const b = await parseBody(req);
        const hours = Number(b.hours_worked) || 0;
        let calculatedPay = Number(b.calculated_pay) || 0;

        // Auto calculate pay if not provided
        if (!calculatedPay && b.staff_id) {
          const staff = db.prepare('SELECT * FROM fixed_staff WHERE id = ?').get(b.staff_id);
          if (staff) {
            if (staff.salary_type === 'કલાક દીઠ') {
              calculatedPay = hours * staff.base_rate;
            } else if (staff.salary_type === 'દૈનિક') {
              const stdHrs = staff.standard_hours || 8;
              calculatedPay = (hours / stdHrs) * staff.base_rate;
            } else if (staff.salary_type === 'માસિક') {
              // assume 26 days month
              const daily = staff.base_rate / 26;
              const stdHrs = staff.standard_hours || 8;
              calculatedPay = (hours / stdHrs) * daily;
            }
          }
        }

        const stmt = db.prepare(`
          INSERT INTO staff_attendance (staff_id, date, status, hours_worked, calculated_pay, advance_deduction, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          Number(b.staff_id),
          b.date || new Date().toISOString().split('T')[0],
          b.status || 'હાજર',
          hours,
          Math.round(calculatedPay),
          Number(b.advance_deduction) || 0,
          b.notes || ''
        );
        return sendJSON(res, { id: result.lastInsertRowid, message: 'હાજરી સફળતાપૂર્વક નોંધાઈ ગઈ' });
      }
    }
    if (pathname.startsWith('/api/staff-attendance/')) {
      const id = parseInt(pathname.split('/')[3], 10);
      if (method === 'DELETE') {
        db.prepare('DELETE FROM staff_attendance WHERE id = ?').run(id);
        return sendJSON(res, { success: true, message: 'હાજરી રેકોર્ડ દૂર થયો' });
      }
    }

    // 13. DELIVERY CHALLANS (વેપારી માલ ચલણ)
    if (pathname === '/api/challans') {
      if (method === 'GET') {
        const rows = db.prepare(`
          SELECT c.*, m.name as merchant_name, m.phone as merchant_phone, m.address as merchant_address
          FROM delivery_challans c
          LEFT JOIN merchants m ON c.merchant_id = m.id
          ORDER BY c.date DESC, c.id DESC
        `).all();
        // Parse items_json
        const formatted = rows.map(r => {
          try {
            return { ...r, items: JSON.parse(r.items_json) };
          } catch {
            return { ...r, items: [] };
          }
        });
        return sendJSON(res, formatted);
      }
      if (method === 'POST') {
        const b = await parseBody(req);
        const prefixSetting = db.prepare("SELECT value FROM app_settings WHERE key = 'challan_prefix'").get();
        const prefix = prefixSetting ? prefixSetting.value : 'GK-CH-';
        const challan_no = b.challan_no ? b.challan_no.trim() : `${prefix}${Date.now().toString().slice(-6)}`;

        const items = Array.isArray(b.items) ? b.items : [];
        let totalPieces = 0;
        let grandTotal = 0;
        for (const item of items) {
          const pcs = Number(item.pieces) || 0;
          const rate = Number(item.rate) || 0;
          totalPieces += pcs;
          grandTotal += (pcs * rate);
        }

        const stmt = db.prepare(`
          INSERT INTO delivery_challans (challan_no, date, merchant_id, lot_id, items_json, total_pieces, grand_total, notes, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          challan_no,
          b.date || new Date().toISOString().split('T')[0],
          Number(b.merchant_id),
          b.lot_id ? Number(b.lot_id) : null,
          JSON.stringify(items),
          totalPieces,
          grandTotal,
          b.notes || '',
          b.status || 'જમા કરાવેલ'
        );

        // Auto update lot status if attached
        if (b.lot_id) {
          db.prepare("UPDATE inward_lots SET status = 'વેપારીને જમા' WHERE id = ?").run(Number(b.lot_id));
        }

        return sendJSON(res, {
          id: result.lastInsertRowid,
          challan_no,
          total_pieces: totalPieces,
          grand_total: grandTotal,
          message: 'ચલણ સફળતાપૂર્વક બની ગયું'
        });
      }
    }
    if (pathname.startsWith('/api/challans/')) {
      const parts = pathname.split('/');
      const id = parseInt(parts[3], 10);
      if (method === 'GET') {
        const r = db.prepare(`
          SELECT c.*, m.name as merchant_name, m.phone as merchant_phone, m.address as merchant_address
          FROM delivery_challans c
          LEFT JOIN merchants m ON c.merchant_id = m.id
          WHERE c.id = ?
        `).get(id);
        if (!r) return sendJSON(res, { error: 'ચલણ મળ્યું નથી' }, 404);
        try {
          r.items = JSON.parse(r.items_json);
        } catch {
          r.items = [];
        }
        return sendJSON(res, r);
      }
      if (method === 'DELETE') {
        db.prepare('DELETE FROM delivery_challans WHERE id = ?').run(id);
        return sendJSON(res, { success: true, message: 'ચલણ દૂર થયું' });
      }
    }

    // 14. FINANCIAL PROFIT & LOSS ANALYTICS (નફો હિસાબ એન્જિન)
    if (pathname === '/api/analytics/pnl') {
      const from = parsedUrl.searchParams.get('from');
      const to = parsedUrl.searchParams.get('to');

      let dateFilterLots = '';
      let dateFilterWork = '';
      let dateFilterPress = '';
      let dateFilterMaterials = '';
      let dateFilterExpenses = '';
      let dateFilterStaff = '';
      const params = [];

      if (from && to) {
        dateFilterLots = 'WHERE date BETWEEN ? AND ?';
        dateFilterWork = 'WHERE date BETWEEN ? AND ?';
        dateFilterPress = 'WHERE date BETWEEN ? AND ?';
        dateFilterMaterials = 'WHERE date BETWEEN ? AND ?';
        dateFilterExpenses = 'WHERE date BETWEEN ? AND ?';
        dateFilterStaff = 'WHERE date BETWEEN ? AND ?';
        params.push(from, to);
      }

      // Total Revenue (કુલ વેપારી પાસેથી આવક)
      const lotQuery = `SELECT SUM(total_amount) as total_revenue, SUM(total_pieces) as total_pieces, COUNT(id) as lot_count FROM inward_lots ${dateFilterLots}`;
      const lotStats = (from && to) ? db.prepare(lotQuery).get(from, to) : db.prepare(lotQuery).get();

      // Challans Revenue
      const challanQuery = `SELECT SUM(grand_total) as challan_revenue, SUM(total_pieces) as challan_pieces FROM delivery_challans ${dateFilterLots}`;
      const challanStats = (from && to) ? db.prepare(challanQuery).get(from, to) : db.prepare(challanQuery).get();

      // Stitching Cost (કારીગર સિલાઈ ખર્ચ)
      const workQuery = `SELECT SUM(total_amount) as total_stitching, SUM(kurti_pieces) as kurti_pcs, SUM(pant_pieces) as pant_pcs FROM karigar_work_entries ${dateFilterWork}`;
      const workStats = (from && to) ? db.prepare(workQuery).get(from, to) : db.prepare(workQuery).get();

      // Press Cost (પ્રેસ ખર્ચ)
      const pressQuery = `SELECT SUM(total_amount) as total_press, SUM(pieces) as press_pcs FROM press_entries ${dateFilterPress}`;
      const pressStats = (from && to) ? db.prepare(pressQuery).get(from, to) : db.prepare(pressQuery).get();

      // Materials Cost (મટીરીયલ્સ કાચો માલ ખર્ચ)
      const matQuery = `SELECT SUM(total_amount) as total_materials FROM materials ${dateFilterMaterials}`;
      const matStats = (from && to) ? db.prepare(matQuery).get(from, to) : db.prepare(matQuery).get();

      // Factory Expenses / Khata Kharch (લાઈટ બિલ, ભાડું, કચરો, પાણી, વગેરે)
      const expQuery = `SELECT SUM(amount) as total_overheads FROM factory_expenses ${dateFilterExpenses}`;
      const expStats = (from && to) ? db.prepare(expQuery).get(from, to) : db.prepare(expQuery).get();

      // Expenses by Category
      const expCatQuery = `SELECT category, SUM(amount) as total FROM factory_expenses ${dateFilterExpenses} GROUP BY category ORDER BY total DESC`;
      const expCategories = (from && to) ? db.prepare(expCatQuery).all(from, to) : db.prepare(expCatQuery).all();

      // Fixed Staff Salaries
      const staffQuery = `SELECT SUM(calculated_pay) as total_staff_pay FROM staff_attendance ${dateFilterStaff}`;
      const staffStats = (from && to) ? db.prepare(staffQuery).get(from, to) : db.prepare(staffQuery).get();

      // Karigar Upad
      const upadQuery = `SELECT SUM(amount) as total_upad FROM karigar_upad ${dateFilterLots}`;
      const upadStats = (from && to) ? db.prepare(upadQuery).get(from, to) : db.prepare(upadQuery).get();

      const totalRevenue = Number(lotStats?.total_revenue) || 0;
      const totalStitching = Number(workStats?.total_stitching) || 0;
      const totalPress = Number(pressStats?.total_press) || 0;
      const totalMaterials = Number(matStats?.total_materials) || 0;
      const totalOverheads = Number(expStats?.total_overheads) || 0;
      const totalStaffPay = Number(staffStats?.total_staff_pay) || 0;

      const totalExpense = totalStitching + totalPress + totalMaterials + totalOverheads + totalStaffPay;
      const netProfit = totalRevenue - totalExpense;
      const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

      return sendJSON(res, {
        revenue: {
          total: totalRevenue,
          pieces: Number(lotStats?.total_pieces) || 0,
          lotCount: Number(lotStats?.lot_count) || 0,
          challanTotal: Number(challanStats?.challan_revenue) || 0,
          challanPieces: Number(challanStats?.challan_pieces) || 0,
        },
        expenses: {
          total: totalExpense,
          stitching: totalStitching,
          press: totalPress,
          materials: totalMaterials,
          overheads: totalOverheads,
          staffSalary: totalStaffPay,
          byCategory: expCategories,
        },
        profit: {
          netProfit,
          profitMargin: Number(profitMargin),
          isProfitable: netProfit >= 0,
        },
        breakdown: {
          kurtiPieces: Number(workStats?.kurti_pcs) || 0,
          pantPieces: Number(workStats?.pant_pcs) || 0,
          pressPieces: Number(pressStats?.press_pcs) || 0,
          totalUpadPaid: Number(upadStats?.total_upad) || 0,
        }
      });
    }

    // 15. BACKUP & RESTORE
    if (pathname === '/api/backup/export' && method === 'GET') {
      const tables = [
        'merchants', 'designs', 'inward_lots', 'karigars',
        'karigar_work_entries', 'karigar_upad', 'press_vendors',
        'press_entries', 'materials', 'factory_expenses',
        'fixed_staff', 'staff_attendance', 'delivery_challans', 'app_settings'
      ];
      const backup = {
        exported_at: new Date().toISOString(),
        version: '1.0.0',
        tables: {}
      };
      for (const t of tables) {
        backup.tables[t] = db.prepare(`SELECT * FROM ${t}`).all();
      }
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="gurukrupa_backup_${new Date().toISOString().split('T')[0]}.json"`,
        'Access-Control-Allow-Origin': '*',
      });
      return res.end(JSON.stringify(backup, null, 2));
    }

    // STATIC FILE SERVING
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

    // If requested file doesn't exist directly in public, check if it's logo.png from root
    if (!fs.existsSync(filePath) && pathname === '/logo.png') {
      filePath = rootLogo;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const stream = fs.createReadStream(filePath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      });
      return stream.pipe(res);
    }

    // Default SPA fallback: if route is not found and not an API call, serve index.html
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath) && !pathname.startsWith('/api/')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(indexPath).pipe(res);
    }

    // 404
    sendJSON(res, { error: 'Not Found' }, 404);
  } catch (err) {
    console.error('Server error on', pathname, err);
    sendJSON(res, { error: 'Internal Server Error', message: err.message }, 500);
  }
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  const ips = getNetworkIps();
  console.log('====================================================');
  console.log('   GURUKRUPA CREATION - મેન્યુફેક્ચરિંગ સિસ્ટમ   ');
  console.log('====================================================');
  console.log(`Web App (Local):    http://localhost:${PORT}`);
  ips.forEach(ip => {
    console.log(`Android & Network:  http://${ip}:${PORT}`);
  });
  console.log(`Password Required:  ${APP_PASSCODE}`);
  console.log('====================================================');
});
