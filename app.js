// Gurukrupa Creation - Frontend Core Application Logic
// Integrated with Supabase Cloud Database + Local Server Sync
// Passcode: 6390

const APP_PASSCODE = '6390';
const SUPABASE_URL = 'https://vlzcckwtufnqfqdwblgk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_J7FK-c4VtzqWUGAImyj6_w_e9G4GQwd';
const DEFAULT_COMPANY_TAGLINE = 'Kurti Pant Manufacturer & Wholesaler';
const DEFAULT_COMPANY_PHONE = 'Solanki Rajnikant: 9427009253 | Vaghela Dilipbhai: 99790 50582';
const DEFAULT_COMPANY_ADDRESS = '157, 2nd Floor, Gayatri Society, Near Rachna Circle, Surat.';

let currentPin = '';
let authToken = '';
let currentTab = 'dashboard';
let currentDashboardFilter = 'all';

// State Cache
let state = {
  merchants: [],
  designs: [],
  lots: [],
  challans: [],
  karigars: [],
  karigarWork: [],
  karigarUpad: [],
  pressVendors: [],
  pressEntries: [],
  materials: [],
  expenses: [],
  staff: [],
  staffAttendance: [],
  settings: {},
};

// ===================================================================
// THEME & DISPLAY PREFERENCES
// ===================================================================
function initTheme() {
  const saved = localStorage.getItem('gk_theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const theme = saved || (prefersLight ? 'light' : 'dark');
  setTheme(theme);

  // Restore collapsed sidebar if on desktop
  if (window.innerWidth > 900 && localStorage.getItem('gk_sidebar_collapsed') === 'true') {
    const sb = document.getElementById('sidebar');
    if (sb) sb.classList.add('collapsed');
  }
}

function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  setTheme(isLight ? 'dark' : 'light');
}

function setTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('gk_theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('gk_theme', 'dark');
  }
  updateThemeUI(theme);
}

function updateThemeUI(theme) {
  const text = document.getElementById('themeText');
  const icon = document.getElementById('themeIconDark');
  if (text) text.textContent = theme === 'light' ? 'ડાર્ક મોડ' : 'લાઇટ મોડ';
  if (icon) {
    if (theme === 'light') {
      icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>';
    } else {
      icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>';
    }
  }
}

// ===================================================================
// PROFIT SECTION TOGGLE (Dashboard Privacy)
// ===================================================================
let profitVisible = false;

function toggleProfitSection() {
  profitVisible = !profitVisible;
  const sec = document.getElementById('profitSection');
  const btn = document.getElementById('profitToggleBtn');
  if (!sec || !btn) return;

  if (profitVisible) {
    sec.className = 'profit-section-visible';
    btn.classList.add('active');
    btn.innerHTML = `
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
             a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243
             M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29
             M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
             a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
      </svg>
      છુપાવો`;
  } else {
    sec.className = 'profit-section-hidden';
    btn.classList.remove('active');
    btn.innerHTML = `
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
             -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
      નફો જુઓ`;
  }
}

function toggleSidebarCollapse() {
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  const isCollapsed = sb.classList.toggle('collapsed');
  localStorage.setItem('gk_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  const collapseText = document.querySelector('.collapse-text');
  if (collapseText) collapseText.textContent = isCollapsed ? 'વિસ્તારો' : 'સંકોચો';
}

// ===================================================================
// AUTHENTICATION & PASSCODE GATE (6390)
// ===================================================================
function enterPin(digit) {
  if (currentPin.length < 4) {
    currentPin += digit;
    updatePinDots();
    if (currentPin.length === 4) {
      setTimeout(verifyPasscode, 150);
    }
  }
}

function clearPin() {
  currentPin = '';
  updatePinDots();
}

function deletePin() {
  currentPin = currentPin.slice(0, -1);
  updatePinDots();
}

function updatePinDots() {
  const dots = document.querySelectorAll('.pin-dot');
  dots.forEach((dot, idx) => {
    if (idx < currentPin.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  });
}

async function verifyPasscode() {
  if (currentPin === APP_PASSCODE) {
    authToken = 'gk_authenticated_session';

    // Success feedback on PIN dots
    const pinDots = document.getElementById('pinDots');
    if (pinDots) pinDots.classList.add('success');

    if (navigator.vibrate) {
      navigator.vibrate([30, 20, 50]);
    }

    const lockScreen = document.getElementById('lockScreen');
    const appRoot = document.getElementById('appRoot');

    // Reveal appRoot underneath lockScreen and apply smooth dashboard entrance
    if (appRoot) {
      appRoot.style.display = 'flex';
      appRoot.classList.add('dashboard-unlock-reveal');
    }

    // Trigger subtle vault iris zoom & fade transition on lockScreen
    if (lockScreen) {
      lockScreen.classList.add('unlocking');
    }

    // Initialize dashboard data
    initApp();

    setTimeout(() => {
      if (lockScreen) {
        lockScreen.style.display = 'none';
        lockScreen.classList.remove('unlocking');
      }
      if (pinDots) pinDots.classList.remove('success');
      clearPin();
      setTimeout(() => {
        if (appRoot) appRoot.classList.remove('dashboard-unlock-reveal');
      }, 700);
      showToast('સફળ પ્રવેશ! સ્વાગત છે.', 'success');
    }, 550);
  } else {
    handlePinError();
  }
}

function handlePinError() {
  const card = document.getElementById('lockCard');
  const pinDots = document.getElementById('pinDots');
  if (card) card.classList.add('shake-animation');
  if (pinDots) pinDots.classList.add('error');
  
  if (navigator.vibrate) {
    navigator.vibrate([40, 30, 40]);
  }
  
  showToast('ખોટો પાસવર્ડ! કૃપા કરીને 6390 દાખલ કરો.', 'error');
  setTimeout(() => {
    if (card) card.classList.remove('shake-animation');
    if (pinDots) pinDots.classList.remove('error');
    clearPin();
  }, 400);
}

function unlockApp() {
  document.getElementById('lockScreen').style.display = 'none';
  document.getElementById('appRoot').style.display = 'flex';
  initApp();
}

function lockApp() {
  localStorage.removeItem('gk_auth_token');
  authToken = '';
  clearPin();
  const appRoot = document.getElementById('appRoot');
  const lockScreen = document.getElementById('lockScreen');
  if (appRoot) {
    appRoot.style.display = 'none';
    appRoot.classList.remove('dashboard-unlock-reveal');
  }
  if (lockScreen) {
    lockScreen.style.display = 'flex';
    lockScreen.classList.remove('unlocking');
    // Re-trigger entrance animation on lockCard
    const lockCard = document.getElementById('lockCard');
    if (lockCard) {
      lockCard.style.animation = 'none';
      void lockCard.offsetHeight;
      lockCard.style.animation = '';
    }
  }
}

// Support keyboard entry for passcode
window.addEventListener('keydown', (e) => {
  if (document.getElementById('lockScreen').style.display !== 'none') {
    if (e.key >= '0' && e.key <= '9') {
      enterPin(e.key);
    } else if (e.key === 'Backspace') {
      deletePin();
    } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
      clearPin();
    }
  }
});

// Check existing session & setup UI
window.addEventListener('DOMContentLoaded', () => {
  initTheme();

  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(inp => {
    if (!inp.value) inp.value = today;
  });

  // Topbar scroll shadow listener
  window.addEventListener('scroll', () => {
    const topbar = document.getElementById('appTopbar');
    if (topbar) {
      if (window.scrollY > 10) topbar.classList.add('scrolled');
      else topbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // Always require passcode on every page load / refresh
  lockApp();
});

// ===================================================================
// SUPABASE CLOUD DATABASE API CLIENT
// ===================================================================
async function supabaseFetch(table, path = '', options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${path}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Supabase error');
  }
  return res.json().catch(() => []);
}

// Unified API Router (connects to Supabase Cloud)
async function api(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  try {
    // 1. SETTINGS
    if (endpoint === '/api/settings') {
      if (method === 'GET') {
        const rows = await supabaseFetch('app_settings', '?select=*');
        const settings = {};
        rows.forEach(r => { settings[r.key] = r.value; });
        return settings;
      }
      if (method === 'POST') {
        for (const [k, v] of Object.entries(body)) {
          await supabaseFetch('app_settings', `?on_conflict=key`, {
            method: 'POST',
            body: JSON.stringify({ key: k, value: String(v) })
          });
        }
        return { success: true };
      }
    }

    // 2. MERCHANTS
    if (endpoint === '/api/merchants') {
      if (method === 'GET') {
        return await supabaseFetch('merchants', '?select=*&order=name.asc');
      }
      if (method === 'POST') {
        const rows = await supabaseFetch('merchants', '', {
          method: 'POST',
          body: JSON.stringify({
            name: body.name.trim(),
            phone: body.phone || '',
            address: body.address || '',
            notes: body.notes || ''
          })
        });
        return { id: rows[0]?.id };
      }
    }
    if (endpoint.startsWith('/api/merchants/')) {
      const id = endpoint.split('/')[3];
      if (method === 'DELETE') {
        await supabaseFetch('merchants', `?id=eq.${id}`, { method: 'DELETE' });
        return { success: true };
      }
    }

    // 3. DESIGNS
    if (endpoint === '/api/designs') {
      if (method === 'GET') {
        return await supabaseFetch('designs', '?select=*&order=design_no.asc');
      }
      if (method === 'POST') {
        const rows = await supabaseFetch('designs', '', {
          method: 'POST',
          body: JSON.stringify({
            design_no: body.design_no.trim(),
            name: body.name || '',
            party_rate: Number(body.party_rate) || 0,
            karigar_kurti_rate: Number(body.karigar_kurti_rate) || 0,
            karigar_pant_rate: Number(body.karigar_pant_rate) || 0,
            press_rate: Number(body.press_rate) || 0,
            material_cost: Number(body.material_cost) || 0,
            notes: body.notes || ''
          })
        });
        return { id: rows[0]?.id };
      }
    }
    if (endpoint.startsWith('/api/designs/')) {
      const id = endpoint.split('/')[3];
      if (method === 'DELETE') {
        await supabaseFetch('designs', `?id=eq.${id}`, { method: 'DELETE' });
        return { success: true };
      }
    }

    // 4. INWARD LOTS
    if (endpoint === '/api/lots') {
      if (method === 'GET') {
        const rows = await supabaseFetch('inward_lots', '?select=*,merchants(name),designs(design_no,name)&order=date.desc,id.desc');
        return rows.map(r => ({
          ...r,
          merchant_name: r.merchants?.name,
          design_no: r.designs?.design_no,
          design_name: r.designs?.name
        }));
      }
      if (method === 'POST') {
        const pcs = Number(body.total_pieces) || 0;
        const rate = Number(body.rate_per_piece) || 0;
        const total = pcs * rate;
        const lot_no = body.lot_no ? body.lot_no.trim() : `LOT-${Date.now().toString().slice(-5)}`;
        const rows = await supabaseFetch('inward_lots', '', {
          method: 'POST',
          body: JSON.stringify({
            lot_no,
            merchant_id: Number(body.merchant_id),
            design_id: Number(body.design_id),
            date: body.date,
            total_pieces: pcs,
            rate_per_piece: rate,
            total_amount: total,
            fabric_details: body.fabric_details || '',
            status: body.status || 'કામ ચાલુ છે',
            notes: body.notes || ''
          })
        });
        return { id: rows[0]?.id };
      }
    }
    if (endpoint.startsWith('/api/lots/')) {
      const id = endpoint.split('/')[3];
      if (method === 'DELETE') {
        await supabaseFetch('inward_lots', `?id=eq.${id}`, { method: 'DELETE' });
        return { success: true };
      }
    }

    // 5. KARIGARS & LEDGER
    if (endpoint === '/api/karigars') {
      if (method === 'GET') {
        return await supabaseFetch('karigars', '?select=*&order=name.asc');
      }
      if (method === 'POST') {
        const rows = await supabaseFetch('karigars', '', {
          method: 'POST',
          body: JSON.stringify({
            name: body.name.trim(),
            phone: body.phone || '',
            speciality: body.speciality || 'સિલાઈ',
            address: body.address || ''
          })
        });
        return { id: rows[0]?.id };
      }
    }
    if (endpoint.startsWith('/api/karigars/')) {
      const parts = endpoint.split('/');
      const id = parts[3];
      if (parts[4] === 'ledger' && method === 'GET') {
        const [kRes, wRes, uRes] = await Promise.all([
          supabaseFetch('karigars', `?id=eq.${id}&select=*`),
          supabaseFetch('karigar_work_entries', `?karigar_id=eq.${id}&select=*,designs(design_no,name)&order=date.desc,id.desc`),
          supabaseFetch('karigar_upad', `?karigar_id=eq.${id}&select=*&order=date.desc,id.desc`),
        ]);
        const karigar = kRes[0];
        const workEntries = wRes.map(w => ({ ...w, design_no: w.designs?.design_no, design_name: w.designs?.name }));
        const upadEntries = uRes;
        const totalEarned = workEntries.reduce((s, w) => s + (Number(w.total_amount) || 0), 0);
        const totalUpad = upadEntries.reduce((s, u) => s + (Number(u.amount) || 0), 0);
        return {
          karigar,
          workEntries,
          upadEntries,
          summary: { totalEarned, totalUpad, netBalance: totalEarned - totalUpad }
        };
      }
      if (method === 'DELETE') {
        await supabaseFetch('karigars', `?id=eq.${id}`, { method: 'DELETE' });
        return { success: true };
      }
    }

    // 6. KARIGAR WORK
    if (endpoint === '/api/karigar-work') {
      if (method === 'GET') {
        const rows = await supabaseFetch('karigar_work_entries', '?select=*,karigars(name),designs(design_no,name),inward_lots(lot_no)&order=date.desc,id.desc');
        return rows.map(r => ({
          ...r,
          karigar_name: r.karigars?.name,
          design_no: r.designs?.design_no,
          design_name: r.designs?.name,
          lot_no: r.inward_lots?.lot_no
        }));
      }
      if (method === 'POST') {
        const kPcs = Number(body.kurti_pieces) || 0;
        const kRate = Number(body.kurti_rate) || 0;
        const pPcs = Number(body.pant_pieces) || 0;
        const pRate = Number(body.pant_rate) || 0;
        const oPcs = Number(body.other_pieces) || 0;
        const oRate = Number(body.other_rate) || 0;
        const total = (kPcs * kRate) + (pPcs * pRate) + (oPcs * oRate);

        const rows = await supabaseFetch('karigar_work_entries', '', {
          method: 'POST',
          body: JSON.stringify({
            karigar_id: Number(body.karigar_id),
            design_id: Number(body.design_id),
            lot_id: body.lot_id ? Number(body.lot_id) : null,
            date: body.date,
            kurti_pieces: kPcs,
            kurti_rate: kRate,
            pant_pieces: pPcs,
            pant_rate: pRate,
            other_pieces: oPcs,
            other_rate: oRate,
            other_label: body.other_label || '',
            total_amount: total,
            notes: body.notes || ''
          })
        });
        return { id: rows[0]?.id, total_amount: total };
      }
    }
    if (endpoint.startsWith('/api/karigar-work/')) {
      const id = endpoint.split('/')[3];
      if (method === 'DELETE') {
        await supabaseFetch('karigar_work_entries', `?id=eq.${id}`, { method: 'DELETE' });
        return { success: true };
      }
    }

    // 7. KARIGAR UPAD
    if (endpoint === '/api/karigar-upad') {
      if (method === 'GET') {
        const rows = await supabaseFetch('karigar_upad', '?select=*,karigars(name)&order=date.desc,id.desc');
        return rows.map(r => ({ ...r, karigar_name: r.karigars?.name }));
      }
      if (method === 'POST') {
        const rows = await supabaseFetch('karigar_upad', '', {
          method: 'POST',
          body: JSON.stringify({
            karigar_id: Number(body.karigar_id),
            date: body.date,
            amount: Number(body.amount) || 0,
            payment_mode: body.payment_mode || 'રોકડ',
            notes: body.notes || ''
          })
        });
        return { id: rows[0]?.id };
      }
    }
    if (endpoint.startsWith('/api/karigar-upad/')) {
      const id = endpoint.split('/')[3];
      if (method === 'DELETE') {
        await supabaseFetch('karigar_upad', `?id=eq.${id}`, { method: 'DELETE' });
        return { success: true };
      }
    }

    // 8. PRESS VENDORS & ENTRIES
    if (endpoint === '/api/press-vendors') {
      if (method === 'GET') {
        return await supabaseFetch('press_vendors', '?select=*&order=name.asc');
      }
      if (method === 'POST') {
        const rows = await supabaseFetch('press_vendors', '', {
          method: 'POST',
          body: JSON.stringify({
            name: body.name.trim(),
            phone: body.phone || '',
            default_rate: Number(body.default_rate) || 0
          })
        });
        return { id: rows[0]?.id };
      }
    }
    if (endpoint.startsWith('/api/press-vendors/')) {
      const id = endpoint.split('/')[3];
      if (method === 'DELETE') {
        await supabaseFetch('press_vendors', `?id=eq.${id}`, { method: 'DELETE' });
        return { success: true };
      }
    }

    if (endpoint === '/api/press-entries') {
      if (method === 'GET') {
        const rows = await supabaseFetch('press_entries', '?select=*,press_vendors(name),designs(design_no,name)&order=date.desc,id.desc');
        return rows.map(r => ({
          ...r,
          vendor_name: r.press_vendors?.name,
          design_no: r.designs?.design_no,
          design_name: r.designs?.name
        }));
      }
      if (method === 'POST') {
        const pcs = Number(body.pieces) || 0;
        const rate = Number(body.rate_per_piece) || 0;
        const rows = await supabaseFetch('press_entries', '', {
          method: 'POST',
          body: JSON.stringify({
            vendor_id: Number(body.vendor_id),
            design_id: body.design_id ? Number(body.design_id) : null,
            date: body.date,
            pieces: pcs,
            rate_per_piece: rate,
            total_amount: pcs * rate,
            status: body.status || 'બાકી',
            notes: body.notes || ''
          })
        });
        return { id: rows[0]?.id, total_amount: pcs * rate };
      }
    }
    if (endpoint.startsWith('/api/press-entries/')) {
      const id = endpoint.split('/')[3];
      if (method === 'DELETE') {
        await supabaseFetch('press_entries', `?id=eq.${id}`, { method: 'DELETE' });
        return { success: true };
      }
    }

    // 9. MATERIALS
    if (endpoint === '/api/materials') {
      if (method === 'GET') {
        return await supabaseFetch('materials', '?select=*&order=date.desc,id.desc');
      }
      if (method === 'POST') {
        const qty = Number(body.quantity) || 0;
        const rate = Number(body.rate) || 0;
        const rows = await supabaseFetch('materials', '', {
          method: 'POST',
          body: JSON.stringify({
            material_name: body.material_name.trim(),
            date: body.date,
            quantity: qty,
            unit: body.unit || 'નંગ',
            rate,
            total_amount: qty * rate,
            supplier_name: body.supplier_name || '',
            bill_no: body.bill_no || '',
            notes: body.notes || ''
          })
        });
        return { id: rows[0]?.id, total_amount: qty * rate };
      }
    }
    if (endpoint.startsWith('/api/materials/')) {
      const id = endpoint.split('/')[3];
      if (method === 'DELETE') {
        await supabaseFetch('materials', `?id=eq.${id}`, { method: 'DELETE' });
        return { success: true };
      }
    }

    // 10. FACTORY EXPENSES
    if (endpoint === '/api/expenses') {
      if (method === 'GET') {
        return await supabaseFetch('factory_expenses', '?select=*&order=date.desc,id.desc');
      }
      if (method === 'POST') {
        const rows = await supabaseFetch('factory_expenses', '', {
          method: 'POST',
          body: JSON.stringify({
            category: body.category.trim(),
            date: body.date,
            amount: Number(body.amount) || 0,
            paid_to: body.paid_to || '',
            payment_mode: body.payment_mode || 'રોકડ',
            notes: body.notes || ''
          })
        });
        return { id: rows[0]?.id };
      }
    }
    if (endpoint.startsWith('/api/expenses/')) {
      const id = endpoint.split('/')[3];
      if (method === 'DELETE') {
        await supabaseFetch('factory_expenses', `?id=eq.${id}`, { method: 'DELETE' });
        return { success: true };
      }
    }

    // 11. FIXED STAFF & ATTENDANCE
    if (endpoint === '/api/staff') {
      if (method === 'GET') {
        return await supabaseFetch('fixed_staff', '?select=*&order=name.asc');
      }
      if (method === 'POST') {
        const rows = await supabaseFetch('fixed_staff', '', {
          method: 'POST',
          body: JSON.stringify({
            name: body.name.trim(),
            phone: body.phone || '',
            role: body.role || 'હેલ્પર',
            salary_type: body.salary_type || 'દૈનિક',
            base_rate: Number(body.base_rate) || 0,
            standard_hours: Number(body.standard_hours) || 8
          })
        });
        return { id: rows[0]?.id };
      }
    }
    if (endpoint.startsWith('/api/staff/')) {
      const id = endpoint.split('/')[3];
      if (method === 'DELETE') {
        await supabaseFetch('fixed_staff', `?id=eq.${id}`, { method: 'DELETE' });
        return { success: true };
      }
    }

    if (endpoint === '/api/staff-attendance') {
      if (method === 'GET') {
        const rows = await supabaseFetch('staff_attendance', '?select=*,fixed_staff(name,role)&order=date.desc,id.desc');
        return rows.map(r => ({
          ...r,
          staff_name: r.fixed_staff?.name,
          role: r.fixed_staff?.role
        }));
      }
      if (method === 'POST') {
        const rows = await supabaseFetch('staff_attendance', '', {
          method: 'POST',
          body: JSON.stringify({
            staff_id: Number(body.staff_id),
            date: body.date,
            status: body.status || 'હાજર',
            hours_worked: Number(body.hours_worked) || 8,
            calculated_pay: Number(body.calculated_pay) || 0,
            advance_deduction: Number(body.advance_deduction) || 0,
            notes: body.notes || ''
          })
        });
        return { id: rows[0]?.id };
      }
    }
    if (endpoint.startsWith('/api/staff-attendance/')) {
      const id = endpoint.split('/')[3];
      if (method === 'DELETE') {
        await supabaseFetch('staff_attendance', `?id=eq.${id}`, { method: 'DELETE' });
        return { success: true };
      }
    }

    // 12. DELIVERY CHALLANS
    if (endpoint === '/api/challans') {
      if (method === 'GET') {
        const rows = await supabaseFetch('delivery_challans', '?select=*,merchants(name,phone,address)&order=date.desc,id.desc');
        return rows.map(r => ({
          ...r,
          merchant_name: r.merchants?.name,
          merchant_phone: r.merchants?.phone,
          merchant_address: r.merchants?.address,
          items: typeof r.items_json === 'string' ? JSON.parse(r.items_json) : r.items_json
        }));
      }
      if (method === 'POST') {
        const items = Array.isArray(body.items) ? body.items : [];
        let totalPieces = 0;
        let grandTotal = 0;
        for (const item of items) {
          totalPieces += Number(item.pieces) || 0;
          grandTotal += (Number(item.pieces) || 0) * (Number(item.rate) || 0);
        }
        // Sequential bill number: count all existing challans, next = count + 1
        const prefix = state.settings.challan_prefix || 'GK-CH-';
        let challan_no = body.challan_no;
        if (!challan_no) {
          const existing = await supabaseFetch('delivery_challans', '?select=id');
          const nextNum = (existing.length || 0) + 1;
          challan_no = `${prefix}${nextNum}`;
        }

        const rows = await supabaseFetch('delivery_challans', '', {
          method: 'POST',
          body: JSON.stringify({
            challan_no,
            date: body.date,
            merchant_id: Number(body.merchant_id),
            lot_id: body.lot_id ? Number(body.lot_id) : null,
            items_json: items,
            total_pieces: totalPieces,
            grand_total: grandTotal,
            notes: body.notes || '',
            status: body.status || 'જમા કરાવેલ'
          })
        });

        if (body.lot_id) {
          await supabaseFetch('inward_lots', `?id=eq.${body.lot_id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'વેપારીને જમા' })
          });
        }

        return { id: rows[0]?.id, challan_no, total_pieces: totalPieces, grand_total: grandTotal };
      }
    }
    if (endpoint.startsWith('/api/challans/')) {
      const id = endpoint.split('/')[3];
      if (method === 'GET') {
        const rows = await supabaseFetch('delivery_challans', `?id=eq.${id}&select=*,merchants(name,phone,address)`);
        const r = rows[0];
        if (!r) throw new Error('ચલણ મળ્યું નથી');
        return {
          ...r,
          merchant_name: r.merchants?.name,
          merchant_phone: r.merchants?.phone,
          merchant_address: r.merchants?.address,
          items: typeof r.items_json === 'string' ? JSON.parse(r.items_json) : r.items_json
        };
      }
      if (method === 'DELETE') {
        await supabaseFetch('delivery_challans', `?id=eq.${id}`, { method: 'DELETE' });
        return { success: true };
      }
    }

    // 13. P&L ANALYTICS ENGINE
    if (endpoint.startsWith('/api/analytics/pnl')) {
      const urlObj = new URL(`http://dummy.com${endpoint}`);
      const from = urlObj.searchParams.get('from');
      const to = urlObj.searchParams.get('to');
      const dateFilter = (from && to) ? `&date=gte.${from}&date=lte.${to}` : '';

      const [lots, work, press, mat, exp, staffAtt, upad] = await Promise.all([
        supabaseFetch('inward_lots', `?select=total_amount,total_pieces${dateFilter}`),
        supabaseFetch('karigar_work_entries', `?select=total_amount,kurti_pieces,pant_pieces${dateFilter}`),
        supabaseFetch('press_entries', `?select=total_amount,pieces${dateFilter}`),
        supabaseFetch('materials', `?select=total_amount${dateFilter}`),
        supabaseFetch('factory_expenses', `?select=amount,category${dateFilter}`),
        supabaseFetch('staff_attendance', `?select=calculated_pay${dateFilter}`),
        supabaseFetch('karigar_upad', `?select=amount${dateFilter}`),
      ]);

      const totalRevenue = lots.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
      const totalPieces = lots.reduce((s, r) => s + (Number(r.total_pieces) || 0), 0);
      const totalStitching = work.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
      const kurtiPieces = work.reduce((s, r) => s + (Number(r.kurti_pieces) || 0), 0);
      const pantPieces = work.reduce((s, r) => s + (Number(r.pant_pieces) || 0), 0);
      const totalPress = press.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
      const pressPieces = press.reduce((s, r) => s + (Number(r.pieces) || 0), 0);
      const totalMaterials = mat.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
      const totalOverheads = exp.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const totalStaffPay = staffAtt.reduce((s, r) => s + (Number(r.calculated_pay) || 0), 0);
      const totalUpad = upad.reduce((s, r) => s + (Number(r.amount) || 0), 0);

      const totalExpense = totalStitching + totalPress + totalMaterials + totalOverheads + totalStaffPay;
      const netProfit = totalRevenue - totalExpense;
      const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

      return {
        revenue: { total: totalRevenue, pieces: totalPieces, lotCount: lots.length },
        expenses: {
          total: totalExpense,
          stitching: totalStitching,
          press: totalPress,
          materials: totalMaterials,
          overheads: totalOverheads,
          staffSalary: totalStaffPay
        },
        profit: { netProfit, profitMargin: Number(profitMargin), isProfitable: netProfit >= 0 },
        breakdown: { kurtiPieces, pantPieces, pressPieces, totalUpadPaid: totalUpad }
      };
    }

    throw new Error('Endpoint not recognized');
  } catch (err) {
    console.error('API Error on', endpoint, err);
    throw err;
  }
}

// ===================================================================
// NAVIGATION & VIEWS
// ===================================================================
const viewTitles = {
  dashboard: { title: 'નફો-નુકસાન અને ડેશબોર્ડ', sub: 'સમગ્ર કારખાનાનો હિસાબ અને વાસ્તવિક ચોખ્ખો નફો' },
  lots: { title: 'વેપારી આવેલ માલ (Inward Lots)', sub: 'વેપારીઓ પાસેથી મળેલ કાપડ/ઓર્ડર અને ભાવ હિસાબ' },
  challans: { title: 'વેપારી માલ ચલણ (Delivery Challan)', sub: 'તૈયાર માલ જમા કરવા માટે ચલણ અને ઓટો પ્રિન્ટ' },
  karigars: { title: 'કારીગર કામ & ઉપાડ હિસાબ', sub: 'કુર્તી-પેન્ટ સિલાઈ પીસ, ઉપાડ અને પગાર રસીદ — બધા કારીગર' },
  'fix-karigar': { title: 'ફિક્સ પગાર કારીગર', sub: 'માસિક નિશ્ચિત પગાર વાળા કારીગરની યાદી અને ઉપાડ' },
  'chhutak-karigar': { title: 'છૂટક કામ વાળા કારીગર', sub: 'પીસ-ભાવ / છૂટક ધોરણે કામ કરનારા કારીગર' },
  designs: { title: 'ડિઝાઇન કેટલોગ (Design Master)', sub: 'ડિઝાઇન મુજબ વેપારી ભાવ, સિલાઈ ભાવ અને પ્રેસ ભાવ' },
  press: { title: 'પ્રેસ હિસાબ (Ironing Work)', sub: 'પ્રેસ વાળાના પીસ અને બિલ હિસાબ' },
  materials: { title: 'મટીરીયલ્સ / કાચો માલ ખર્ચ', sub: 'દોરો, બટન, ઝિપ, ઇલાસ્ટિક, પેકિંગ બેગ વગેરે' },
  expenses: { title: 'કારખાના ખાતા ખર્ચ (Overheads)', sub: 'લાઈટ બિલ, કચરો, કારખાના ભાડું, પાણી બિલ, ચા-નાસ્તો' },
  staff: { title: 'ફિક્સ પગાર સ્ટાફ (Staff Register)', sub: 'કટિંગ, પેકિંગ, હેલ્પરની દૈનિક હાજરી અને કલાક હિસાબ' },
  settings: { title: 'સેટિંગ્સ & કનેક્ટ', sub: 'કંપની વિગત, ડેટા બેકઅપ અને એન્ડ્રોઇડ ક્લાઉડ સિંક' },
};

function switchTab(tabId) {
  currentTab = tabId;

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(item => {
    return item.getAttribute('onclick')?.includes(`'${tabId}'`);
  });
  if (activeNav) activeNav.classList.add('active');

  // Sync mobile bottom navigation bar active button
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-view').forEach(view => {
    view.style.display = 'none';
  });
  const targetView = document.getElementById(`view-${tabId}`);
  if (targetView) targetView.style.display = 'block';

  if (viewTitles[tabId]) {
    document.getElementById('pageTitle').textContent = viewTitles[tabId].title;
    document.getElementById('pageSubtitle').textContent = viewTitles[tabId].sub;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeSidebar();

  if (tabId === 'dashboard') loadDashboard();
  else if (tabId === 'lots') loadLots();
  else if (tabId === 'challans') loadChallans();
  else if (tabId === 'karigars') loadKarigars();
  else if (tabId === 'fix-karigar') loadFixKarigar();
  else if (tabId === 'chhutak-karigar') loadChhutakKarigar();
  else if (tabId === 'designs') loadDesigns();
  else if (tabId === 'press') loadPress();
  else if (tabId === 'materials') loadMaterials();
  else if (tabId === 'expenses') loadExpenses();
  else if (tabId === 'staff') loadStaff();
  else if (tabId === 'settings') loadSettings();
}

function openKarigarList() {
  // Switch to karigars tab then show the list sub-tab
  switchTab('karigars');
  setTimeout(() => {
    const listBtn = document.querySelector('.btn-sm.btn-outline[onclick*="\'list\'"]');
    switchKarigarSubTab('list', listBtn);
    if (listBtn) {
      // Update active button styling
      if (listBtn.parentElement) {
        listBtn.parentElement.querySelectorAll('.btn').forEach(b => b.classList.remove('active-filter'));
        listBtn.classList.add('active-filter');
      }
    }
  }, 200);
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sb) return;
  const isOpen = sb.classList.toggle('open');
  if (backdrop) {
    if (isOpen) {
      backdrop.classList.add('active');
    } else {
      backdrop.classList.remove('active');
    }
  }
}

function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sb) sb.classList.remove('open');
  if (backdrop) backdrop.classList.remove('active');
}

function switchKarigarSubTab(subId, btn) {
  ['ledger', 'work', 'upad', 'list'].forEach(id => {
    document.getElementById(`karigar-sub-${id}`).style.display = (id === subId ? 'block' : 'none');
  });
  if (btn && btn.parentElement) {
    btn.parentElement.querySelectorAll('.btn').forEach(b => b.classList.remove('active-filter'));
    btn.classList.add('active-filter');
  }
}

// ===================================================================
// TOAST NOTIFICATIONS & MODALS
// ===================================================================
function showToast(message, type = 'info') {
  let displayMsg = message;
  if (typeof message === 'string' && (message.includes('Unexpected token') || message.includes('<!DOCTYPE') || message.includes('JSON'))) {
    displayMsg = 'કનેક્શન ફરીથી જોડાઈ રહ્યું છે... ડેટા રિફ્રેશ થઈ રહ્યો છે.';
  }
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = displayMsg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.add('active');
    // Lock body scroll so only the modal scrolls on mobile
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    populateDropdowns();
    if (modalId === 'modal-add-challan') {
      initChallanModal();
    }
  }
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
  // Restore body scroll only if no other modal is still open
  if (!document.querySelector('.modal-overlay.active')) {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }
}

// ===================================================================
// APPLICATION INITIALIZATION & GLOBAL DROPDOWNS
// ===================================================================
async function initApp() {
  await Promise.all([
    fetchDropdownMasters(),
    loadSettings(),
    loadDashboard(),
  ]);
}

async function fetchDropdownMasters() {
  try {
    const [merchants, designs, karigars, vendors, lots, staff] = await Promise.all([
      api('/api/merchants'),
      api('/api/designs'),
      api('/api/karigars'),
      api('/api/press-vendors'),
      api('/api/lots'),
      api('/api/staff'),
    ]);
    state.merchants = merchants;
    state.designs = designs;
    state.karigars = karigars;
    state.pressVendors = vendors;
    state.lots = lots;
    state.staff = staff;
    populateDropdowns();
  } catch (err) {
    console.error('Error fetching dropdown masters:', err);
  }
}

function populateDropdowns() {
  const lotMerch = document.getElementById('lotMerchantSelect');
  if (lotMerch) {
    lotMerch.innerHTML = '<option value="">-- વેપારી પસંદ કરો --</option>' +
      state.merchants.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
  }
  const chalMerch = document.getElementById('challanMerchantSelect');
  if (chalMerch) {
    chalMerch.innerHTML = '<option value="">-- વેપારી પસંદ કરો --</option>' +
      state.merchants.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
  }

  const lotDes = document.getElementById('lotDesignSelect');
  if (lotDes) {
    lotDes.innerHTML = '<option value="">-- ડિઝાઇન પસંદ કરો --</option>' +
      state.designs.map(d => `<option value="${d.id}" data-rate="${d.party_rate}">${escapeHtml(d.design_no)} - ${escapeHtml(d.name || '')} (₹${d.party_rate})</option>`).join('');
  }
  const workDes = document.getElementById('workDesignSelect');
  if (workDes) {
    workDes.innerHTML = '<option value="">-- ડિઝાઇન પસંદ કરો --</option>' +
      state.designs.map(d => `<option value="${d.id}">${escapeHtml(d.design_no)} - ${escapeHtml(d.name || '')}</option>`).join('');
  }
  const pressDes = document.getElementById('pressDesignSelect');
  if (pressDes) {
    pressDes.innerHTML = '<option value="">-- ડિઝાઇન પસંદ કરો (વૈકલ્પિક) --</option>' +
      state.designs.map(d => `<option value="${d.id}" data-press="${d.press_rate}">${escapeHtml(d.design_no)} - ${escapeHtml(d.name || '')} (પ્રેસ ₹${d.press_rate})</option>`).join('');
  }

  const workKar = document.getElementById('workKarigarSelect');
  if (workKar) {
    workKar.innerHTML = '<option value="">-- કારીગર પસંદ કરો --</option>' +
      state.karigars.map(k => `<option value="${k.id}">${escapeHtml(k.name)} (${escapeHtml(k.speciality || 'સિલાઈ')})</option>`).join('');
  }
  const upadKar = document.getElementById('upadKarigarSelect');
  if (upadKar) {
    upadKar.innerHTML = '<option value="">-- કારીગર પસંદ કરો --</option>' +
      state.karigars.map(k => `<option value="${k.id}">${escapeHtml(k.name)}</option>`).join('');
  }
  const ledKar = document.getElementById('ledgerKarigarSelect');
  if (ledKar) {
    ledKar.innerHTML = '<option value="">-- કારીગર સિલેક્ટ કરો --</option>' +
      state.karigars.map(k => `<option value="${k.id}">${escapeHtml(k.name)}</option>`).join('');
  }

  const pVen = document.getElementById('pressVendorSelect');
  if (pVen) {
    pVen.innerHTML = '<option value="">-- પ્રેસ વાળા પસંદ કરો --</option>' +
      state.pressVendors.map(v => `<option value="${v.id}" data-rate="${v.default_rate}">${escapeHtml(v.name)} (ડિફોલ્ટ ₹${v.default_rate})</option>`).join('');
  }

  const attStaff = document.getElementById('attStaffSelect');
  if (attStaff) {
    attStaff.innerHTML = '<option value="">-- સ્ટાફ પસંદ કરો --</option>' +
      state.staff.map(s => `<option value="${s.id}">${escapeHtml(s.name)} (${escapeHtml(s.role)})</option>`).join('');
  }

  const workLot = document.getElementById('workLotSelect');
  if (workLot) {
    workLot.innerHTML = '<option value="">-- કોઈ લોટ નહીં (સ્વતંત્ર કામ) --</option>' +
      state.lots.map(l => `<option value="${l.id}">${escapeHtml(l.lot_no || 'Lot')} - ${escapeHtml(l.merchant_name || '')} (${l.total_pieces} pcs)</option>`).join('');
  }
  const chalLot = document.getElementById('challanLotSelect');
  if (chalLot) {
    chalLot.innerHTML = '<option value="">-- સમગ્ર લોટ સિલેક્ટ કરો (ઓટો ભરવા માટે) --</option>' +
      state.lots.map(l => `<option value="${l.id}">${escapeHtml(l.lot_no || 'Lot')} - ${escapeHtml(l.merchant_name || '')} - ${escapeHtml(l.design_no || '')} (${l.total_pieces} pcs)</option>`).join('');
  }
}

// ===================================================================
// MODULE 1: DASHBOARD & PNL ENGINE (Point 8)
// ===================================================================
function countUp(el, targetNumber, prefix = '₹') {
  if (!el) return;
  const num = Number(targetNumber) || 0;
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    el.textContent = `${prefix}${num.toLocaleString('en-IN')}`;
    return;
  }
  const duration = 400;
  const startTime = performance.now();
  const startVal = 0;
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + (num - startVal) * ease);
    el.textContent = `${prefix}${current.toLocaleString('en-IN')}`;
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = `${prefix}${num.toLocaleString('en-IN')}`;
    }
  }
  requestAnimationFrame(tick);
}

async function loadDashboard() {
  try {
    let url = '/api/analytics/pnl';
    const now = new Date();
    if (currentDashboardFilter === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      url += `?from=${todayStr}&to=${todayStr}`;
    } else if (currentDashboardFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];
      url += `?from=${weekAgo}&to=${todayStr}`;
    } else if (currentDashboardFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];
      url += `?from=${monthStart}&to=${todayStr}`;
    }

    const data = await api(url);

    countUp(document.getElementById('statRevenue'), data.revenue.total);
    document.getElementById('statPieces').textContent = `${data.revenue.pieces.toLocaleString('en-IN')} પીસ • ${data.revenue.lotCount} લોટ`;

    countUp(document.getElementById('statStitching'), data.expenses.stitching);
    document.getElementById('statKurtiPantPcs').textContent = `કુર્તી: ${data.breakdown.kurtiPieces.toLocaleString('en-IN')} • પેન્ટ: ${data.breakdown.pantPieces.toLocaleString('en-IN')}`;

    countUp(document.getElementById('statPress'), data.expenses.press);
    document.getElementById('statPressPcs').textContent = `${data.breakdown.pressPieces.toLocaleString('en-IN')} પીસ પ્રેસ થયા`;

    countUp(document.getElementById('statMaterials'), data.expenses.materials);
    countUp(document.getElementById('statOverheads'), data.expenses.overheads);
    document.getElementById('statStaffSalary').textContent = `સ્ટાફ પગાર: ₹${data.expenses.staffSalary.toLocaleString('en-IN')}`;

    const netProfitEl = document.getElementById('statNetProfit');
    countUp(netProfitEl, data.profit.netProfit);
    netProfitEl.style.color = data.profit.isProfitable ? 'var(--success)' : 'var(--danger)';

    const marginEl = document.getElementById('statProfitMargin');
    marginEl.textContent = `નફો: ${data.profit.profitMargin}% (ચોખ્ખો)`;
    marginEl.style.color = data.profit.isProfitable ? 'var(--success)' : 'var(--danger)';

    const lots = await api('/api/lots');
    const tbody = document.querySelector('#dashboardLotsTable tbody');
    if (!lots || lots.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-faint);">હજુ સુધી કોઈ માલ નોંધાયેલ નથી. "+ નવો માલ ઉમેરો" પર ક્લિક કરો.</td></tr>`;
    } else {
      tbody.innerHTML = lots.slice(0, 5).map(l => `
        <tr>
          <td>${formatDate(l.date)}</td>
          <td><strong>${escapeHtml(l.lot_no || '-')}</strong></td>
          <td>${escapeHtml(l.merchant_name || '-')}</td>
          <td>${escapeHtml(l.design_no || '-')}</td>
          <td><strong>${l.total_pieces}</strong></td>
          <td>₹${l.rate_per_piece}</td>
          <td><strong>₹${l.total_amount.toLocaleString('en-IN')}</strong></td>
          <td><span class="badge ${getStatusBadgeClass(l.status)}">${escapeHtml(l.status)}</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

function filterDashboard(filterType, btn) {
  currentDashboardFilter = filterType;
  if (btn && btn.parentElement) {
    btn.parentElement.querySelectorAll('.btn').forEach(b => b.classList.remove('active-filter'));
    btn.classList.add('active-filter');
  }
  loadDashboard();
}

// ===================================================================
// MODULE 2: INWARD LOTS & MERCHANTS (Point 1)
// ===================================================================
async function loadLots() {
  try {
    const lots = await api('/api/lots');
    state.lots = lots;
    renderLotsTable(lots);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderLotsTable(lots) {
  const tbody = document.querySelector('#lotsTable tbody');
  if (!lots || lots.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <h4>કોઈ માલ નોંધાયેલ નથી</h4>
            <p>વેપારી પાસેથી આવેલ માલ દાખલ કરવા માટે "+ નવો માલ એન્ટ્રી" પર ક્લિક કરો.</p>
            <button class="btn btn-primary btn-sm" onclick="openModal('modal-add-lot')">+ નવો માલ એન્ટ્રી</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = lots.map(l => `
    <tr>
      <td>${formatDate(l.date)}</td>
      <td><strong>${escapeHtml(l.lot_no || '-')}</strong></td>
      <td>${escapeHtml(l.merchant_name || '-')}</td>
      <td>${escapeHtml(l.design_no || '-')} <small style="color:var(--slate-500);">${escapeHtml(l.design_name || '')}</small></td>
      <td><strong>${l.total_pieces}</strong></td>
      <td>₹${l.rate_per_piece}</td>
      <td><strong>₹${l.total_amount.toLocaleString('en-IN')}</strong></td>
      <td><span class="badge ${getStatusBadgeClass(l.status)}">${escapeHtml(l.status)}</span></td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-sm btn-outline" onclick="createChallanFromLot(${l.id})">ચલણ</button>
          <button class="btn btn-sm btn-danger" onclick="deleteLot(${l.id})">કાઢી નાખો</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function onLotDesignChange(designId) {
  const design = state.designs.find(d => d.id == designId);
  if (design) {
    document.getElementById('lotRate').value = design.party_rate || 0;
    calcLotTotal();
  }
}

function calcLotTotal() {
  const pieces = parseFloat(document.getElementById('lotPieces').value) || 0;
  const rate = parseFloat(document.getElementById('lotRate').value) || 0;
  document.getElementById('lotTotalAmount').value = `₹${(pieces * rate).toLocaleString('en-IN')}`;
}

async function submitInwardLot(e) {
  e.preventDefault();
  const payload = {
    date: document.getElementById('lotDate').value,
    lot_no: document.getElementById('lotNo').value,
    merchant_id: document.getElementById('lotMerchantSelect').value,
    design_id: document.getElementById('lotDesignSelect').value,
    total_pieces: document.getElementById('lotPieces').value,
    rate_per_piece: document.getElementById('lotRate').value,
    fabric_details: document.getElementById('lotNotes').value,
  };
  try {
    await api('/api/lots', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-lot');
    showToast('વેપારી માલ એન્ટ્રી સફળતાપૂર્વક થઈ ગઈ!', 'success');
    await fetchDropdownMasters();
    loadLots();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteLot(id) {
  if (!confirm('શું તમે ખરેખર આ લોટ એન્ટ્રી કાઢી નાખવા માંગો છો?')) return;
  try {
    await api(`/api/lots/${id}`, { method: 'DELETE' });
    showToast('એન્ટ્રી કાઢી નાખવામાં આવી', 'info');
    loadLots();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Add Merchant Modal
async function submitMerchant(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('merchantName').value,
    phone: document.getElementById('merchantPhone').value,
    address: document.getElementById('merchantAddress').value,
    notes: document.getElementById('merchantNotes').value,
  };
  try {
    await api('/api/merchants', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-merchant');
    showToast('વેપારી સફળતાપૂર્વક ઉમેરાયા!', 'success');
    await fetchDropdownMasters();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================================================================
// MODULE 3: DESIGNS CATALOG (Point 4)
// ===================================================================
async function loadDesigns() {
  try {
    const designs = await api('/api/designs');
    state.designs = designs;
    renderDesignsTable(designs);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderDesignsTable(designs) {
  const tbody = document.querySelector('#designsTable tbody');
  if (!designs || designs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
            <h4>કોઈ ડિઝાઇન ઉમેરેલ નથી</h4>
            <p>તમારા કુર્તી/પેન્ટના ડિઝાઇન નંબરો અને ભાવ સેટ કરવા માટે "+ નવી ડિઝાઇન ઉમેરો" પર ક્લિક કરો.</p>
            <button class="btn btn-primary btn-sm" onclick="openModal('modal-add-design')">+ નવી ડિઝાઇન ઉમેરો</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = designs.map(d => {
    const cost = (d.karigar_kurti_rate || 0) + (d.karigar_pant_rate || 0) + (d.press_rate || 0) + (d.material_cost || 0);
    const estProfit = (d.party_rate || 0) - cost;
    return `
      <tr>
        <td><strong>${escapeHtml(d.design_no)}</strong></td>
        <td>${escapeHtml(d.name || '-')}</td>
        <td><strong style="color:var(--sapphire-700);">₹${d.party_rate}</strong></td>
        <td>₹${d.karigar_kurti_rate}</td>
        <td>₹${d.karigar_pant_rate}</td>
        <td>₹${d.press_rate}</td>
        <td>₹${d.material_cost}</td>
        <td><strong style="color:${estProfit >= 0 ? 'var(--emerald-600)' : 'var(--rose-600)'};">₹${estProfit.toFixed(1)}</strong></td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteDesign(${d.id})">કાઢી નાખો</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function submitDesign(e) {
  e.preventDefault();
  const payload = {
    design_no: document.getElementById('designNo').value,
    name: document.getElementById('designName').value,
    party_rate: document.getElementById('designPartyRate').value,
    karigar_kurti_rate: document.getElementById('designKurtiRate').value,
    karigar_pant_rate: document.getElementById('designPantRate').value,
    press_rate: document.getElementById('designPressRate').value,
    material_cost: document.getElementById('designMaterialCost').value,
    notes: document.getElementById('designNotes').value,
  };
  try {
    await api('/api/designs', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-design');
    showToast('ડિઝાઇન સફળતાપૂર્વક ઉમેરાઈ!', 'success');
    await fetchDropdownMasters();
    loadDesigns();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteDesign(id) {
  if (!confirm('શું તમે આ ડિઝાઇન દૂર કરવા માંગો છો?')) return;
  try {
    await api(`/api/designs/${id}`, { method: 'DELETE' });
    showToast('ડિઝાઇન દૂર થઈ', 'info');
    await fetchDropdownMasters();
    loadDesigns();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================================================================
// MODULE 4: KARIGARS, WORK & UPAD (Points 2 & 3)
// ===================================================================
async function loadKarigars() {
  try {
    const [karigars, work, upad] = await Promise.all([
      api('/api/karigars'),
      api('/api/karigar-work'),
      api('/api/karigar-upad'),
    ]);
    state.karigars = karigars;
    state.karigarWork = work;
    state.karigarUpad = upad;

    renderKarigarsListTable(karigars);
    renderAllKarigarSummaryTable(karigars, work, upad);
    renderKarigarWorkTable(work);
    renderKarigarUpadTable(upad);

    const selectedKarigarId = document.getElementById('ledgerKarigarSelect')?.value;
    if (selectedKarigarId) {
      loadKarigarLedger(selectedKarigarId);
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function parseKarigarMeta(k) {
  const rawSpec = k?.speciality || 'સિલાઈ';
  const match = rawSpec.match(/\[ફિક્સ:(\d+(?:\.\d+)?)\]/);
  if (match || k?.karigar_type === 'fix_pagar') {
    const salary = match ? Number(match[1]) : (Number(k?.monthly_salary) || 0);
    const cleanSpeciality = rawSpec.replace(/\s*\[ફિક્સ:\d+(?:\.\d+)?\]/, '').trim() || 'સિલાઈ';
    return { isFix: true, salary, cleanSpeciality };
  }
  return { isFix: false, salary: 0, cleanSpeciality: rawSpec };
}

function toggleFixSalaryField(val) {
  const grp = document.getElementById('fixSalaryGroup');
  if (grp) grp.style.display = val === 'fix_pagar' ? 'block' : 'none';
}

function openAddKarigarWithType(type) {
  openModal('modal-add-karigar');
  const sel = document.getElementById('karigarType');
  if (sel) {
    sel.value = type;
    toggleFixSalaryField(type);
  }
}

function closeKarigarDetail() {
  const panel = document.getElementById('karigarDetailPanel');
  if (panel) panel.style.display = 'none';
}

function renderAllKarigarSummaryTable(karigars, work, upad) {
  const tbody = document.querySelector('#allKarigarSummaryTable tbody');
  if (!tbody) return;
  if (!karigars || karigars.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">કોઈ કારીગર ઉમેરેલ નથી.</td></tr>`;
    return;
  }

  let grandWork = 0;
  let grandUpad = 0;
  let grandBal = 0;

  const rowsHtml = karigars.map(k => {
    const meta = parseKarigarMeta(k);
    const totalW = (work || []).filter(w => w.karigar_id == k.id).reduce((s, w) => s + (Number(w.total_amount) || 0), 0);
    const totalU = (upad || []).filter(u => u.karigar_id == k.id).reduce((s, u) => s + (Number(u.amount) || 0), 0);
    const baseEarned = meta.isFix && totalW === 0 ? meta.salary : totalW;
    const bal = baseEarned - totalU;

    grandWork += baseEarned;
    grandUpad += totalU;
    grandBal += bal;

    const typeBadge = meta.isFix
      ? `<span class="badge badge-info">ફિક્સ પગાર${meta.salary ? ` (₹${meta.salary.toLocaleString('en-IN')})` : ''}</span>`
      : `<span class="badge badge-success">છૂટક (${escapeHtml(meta.cleanSpeciality)})</span>`;

    return `
      <tr>
        <td><strong>${escapeHtml(k.name)}</strong></td>
        <td>${typeBadge}</td>
        <td class="num"><strong style="color:var(--info);">₹${baseEarned.toLocaleString('en-IN')}</strong></td>
        <td class="num"><strong style="color:var(--danger);">₹${totalU.toLocaleString('en-IN')}</strong></td>
        <td class="num"><strong style="color:${bal >= 0 ? 'var(--success)' : 'var(--danger)'};">₹${bal.toLocaleString('en-IN')}</strong></td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="selectAndShowLedger(${k.id})">વિગત / રસીદ</button>
        </td>
      </tr>
    `;
  }).join('');

  const totalRow = `
    <tr style="background: var(--surface-2); font-weight: 700; border-top: 2px solid var(--border-strong);">
      <td colspan="2">કુલ સરવાળો (${karigars.length} કારીગર)</td>
      <td class="num" style="color:var(--info);">₹${grandWork.toLocaleString('en-IN')}</td>
      <td class="num" style="color:var(--danger);">₹${grandUpad.toLocaleString('en-IN')}</td>
      <td class="num" style="color:var(--accent);">₹${grandBal.toLocaleString('en-IN')}</td>
      <td></td>
    </tr>
  `;

  tbody.innerHTML = rowsHtml + totalRow;
}

async function loadFixKarigar() {
  try {
    const [karigars, upad] = await Promise.all([
      api('/api/karigars'),
      api('/api/karigar-upad'),
    ]);
    state.karigars = karigars;
    state.karigarUpad = upad;

    const fixList = karigars.filter(k => parseKarigarMeta(k).isFix);
    const tbody = document.querySelector('#fixKarigarTable tbody');
    if (!tbody) return;

    if (fixList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">કોઈ ફિક્સ પગાર કારીગર ઉમેરેલ નથી. ઉપર "+ ફિક્સ કારીગર ઉમેરો" બટન પર ક્લિક કરો.</td></tr>`;
      return;
    }

    tbody.innerHTML = fixList.map((k, idx) => {
      const meta = parseKarigarMeta(k);
      const totalU = upad.filter(u => u.karigar_id == k.id).reduce((s, u) => s + (Number(u.amount) || 0), 0);
      return `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${escapeHtml(k.name)}</strong><br><small style="color:var(--text-muted);">${escapeHtml(meta.cleanSpeciality)}</small></td>
          <td>${escapeHtml(k.phone || '-')}</td>
          <td class="num"><strong style="color:var(--success);">₹${meta.salary.toLocaleString('en-IN')}</strong></td>
          <td>${escapeHtml(k.address || '-')}</td>
          <td class="num"><strong style="color:var(--danger);">₹${totalU.toLocaleString('en-IN')}</strong></td>
          <td style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-sm btn-outline" onclick="switchTab('karigars'); setTimeout(() => selectAndShowLedger(${k.id}), 250);">ખાતાવહી</button>
            <button class="btn btn-sm btn-danger" onclick="deleteKarigar(${k.id}, '${escapeHtml(k.name).replace(/'/g, "\\'")}')">કાઢી નાખો</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadChhutakKarigar() {
  try {
    const [karigars, work, upad] = await Promise.all([
      api('/api/karigars'),
      api('/api/karigar-work'),
      api('/api/karigar-upad'),
    ]);
    state.karigars = karigars;
    state.karigarWork = work;
    state.karigarUpad = upad;

    const chhutakList = karigars.filter(k => !parseKarigarMeta(k).isFix);
    const tbody = document.querySelector('#chhutakKarigarTable tbody');
    if (!tbody) return;

    if (chhutakList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">કોઈ છૂટક કામ વાળા કારીગર નથી.</td></tr>`;
      return;
    }

    tbody.innerHTML = chhutakList.map((k, idx) => {
      const meta = parseKarigarMeta(k);
      const totalW = work.filter(w => w.karigar_id == k.id).reduce((s, w) => s + (Number(w.total_amount) || 0), 0);
      const totalU = upad.filter(u => u.karigar_id == k.id).reduce((s, u) => s + (Number(u.amount) || 0), 0);
      const bal = totalW - totalU;
      return `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${escapeHtml(k.name)}</strong><br><small style="color:var(--text-muted);">${escapeHtml(meta.cleanSpeciality)}</small></td>
          <td>${escapeHtml(k.phone || '-')}</td>
          <td>${escapeHtml(k.address || '-')}</td>
          <td class="num"><strong style="color:var(--info);">₹${totalW.toLocaleString('en-IN')}</strong></td>
          <td class="num"><strong style="color:var(--danger);">₹${totalU.toLocaleString('en-IN')}</strong></td>
          <td class="num"><strong style="color:${bal >= 0 ? 'var(--success)' : 'var(--danger)'};">₹${bal.toLocaleString('en-IN')}</strong></td>
          <td style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-sm btn-outline" onclick="switchTab('karigars'); setTimeout(() => selectAndShowLedger(${k.id}), 250);">ખાતાવહી</button>
            <button class="btn btn-sm btn-danger" onclick="deleteKarigar(${k.id}, '${escapeHtml(k.name).replace(/'/g, "\\'")}')">કાઢી નાખો</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderKarigarsListTable(karigars) {
  const tbody = document.querySelector('#karigarsListTable tbody');
  if (!karigars || karigars.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--slate-400);">કોઈ કારીગર ઉમેરેલ નથી.</td></tr>`;
    return;
  }
  tbody.innerHTML = karigars.map(k => {
    const meta = parseKarigarMeta(k);
    return `
    <tr>
      <td><strong>${escapeHtml(k.name)}</strong></td>
      <td>${escapeHtml(k.phone || '-')}</td>
      <td>
        <span class="badge ${meta.isFix ? 'badge-info' : 'badge-success'}">${meta.isFix ? `ફિક્સ પગાર (₹${meta.salary.toLocaleString('en-IN')})` : 'છૂટક કામ'}</span>
        <small style="color:var(--text-muted); display:block; margin-top:2px;">${escapeHtml(meta.cleanSpeciality)}</small>
      </td>
      <td>${escapeHtml(k.address || '-')}</td>
      <td style="display:flex; gap:6px; flex-wrap:wrap;">
        <button class="btn btn-sm btn-outline" onclick="selectAndShowLedger(${k.id})">ખાતાવહી જુઓ</button>
        <button class="btn btn-sm btn-danger" onclick="deleteKarigar(${k.id}, '${escapeHtml(k.name).replace(/'/g, "\\'")}')">કાઢી નાખો</button>
      </td>
    </tr>
  `;
  }).join('');
}

async function deleteKarigar(id, name) {
  if (!confirm(`શું તમે "${name || 'આ કારીગર'}" ને કાઢી નાખવા માંગો છો?\n(તેમના કામ અને ઉપાડની એન્ટ્રી પણ દૂર થશે)`)) return;
  try {
    await api(`/api/karigars/${id}`, { method: 'DELETE' });
    showToast('કારીગર સફળતાપૂર્વક દૂર કરવામાં આવ્યા!', 'info');
    await fetchDropdownMasters();
    if (currentTab === 'fix-karigar') loadFixKarigar();
    else if (currentTab === 'chhutak-karigar') loadChhutakKarigar();
    else loadKarigars();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderKarigarWorkTable(work) {
  const tbody = document.querySelector('#karigarWorkTable tbody');
  if (!work || work.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--slate-400);">કોઈ સિલાઈ કામ નોંધાયેલ નથી.</td></tr>`;
    return;
  }
  tbody.innerHTML = work.map(w => `
    <tr>
      <td>${formatDate(w.date)}</td>
      <td><strong>${escapeHtml(w.karigar_name || '-')}</strong></td>
      <td>${escapeHtml(w.design_no || '-')}</td>
      <td>${w.kurti_pieces} × ₹${w.kurti_rate} = <strong>₹${w.kurti_pieces * w.kurti_rate}</strong></td>
      <td>${w.pant_pieces} × ₹${w.pant_rate} = <strong>₹${w.pant_pieces * w.pant_rate}</strong></td>
      <td>${w.other_pieces > 0 ? `${w.other_pieces} × ₹${w.other_rate}` : '-'}</td>
      <td><strong style="color:var(--sapphire-700);">₹${w.total_amount.toLocaleString('en-IN')}</strong></td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteKarigarWork(${w.id})">કાઢી નાખો</button></td>
    </tr>
  `).join('');
}

function renderKarigarUpadTable(upad) {
  const tbody = document.querySelector('#karigarUpadTable tbody');
  if (!upad || upad.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--slate-400);">કોઈ ઉપાડ નોંધાયેલ નથી.</td></tr>`;
    return;
  }
  tbody.innerHTML = upad.map(u => `
    <tr>
      <td>${formatDate(u.date)}</td>
      <td><strong>${escapeHtml(u.karigar_name || '-')}</strong></td>
      <td><strong style="color:var(--rose-600); font-size:15px;">₹${u.amount.toLocaleString('en-IN')}</strong></td>
      <td><span class="badge badge-warning">${escapeHtml(u.payment_mode || 'રોકડ')}</span></td>
      <td>${escapeHtml(u.notes || '-')}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteKarigarUpad(${u.id})">કાઢી નાખો</button></td>
    </tr>
  `).join('');
}

async function loadKarigarLedger(karigarId) {
  if (!karigarId) {
    document.getElementById('karigarLedgerSummary').style.display = 'none';
    document.querySelector('#karigarLedgerTable tbody').innerHTML = '';
    return;
  }
  try {
    const data = await api(`/api/karigars/${karigarId}/ledger`);
    document.getElementById('karigarLedgerSummary').style.display = 'flex';
    document.getElementById('ledTotalWork').textContent = `₹${data.summary.totalEarned.toLocaleString('en-IN')}`;
    document.getElementById('ledTotalUpad').textContent = `₹${data.summary.totalUpad.toLocaleString('en-IN')}`;
    document.getElementById('ledNetBalance').textContent = `₹${data.summary.netBalance.toLocaleString('en-IN')}`;

    const entries = [];
    data.workEntries.forEach(w => {
      entries.push({
        date: w.date,
        type: 'કામ (સિલાઈ)',
        desc: `${w.design_no || 'Design'} - ${w.kurti_pieces} કુર્તી, ${w.pant_pieces} પેન્ટ`,
        kurtiPcs: w.kurti_pieces,
        pantPcs: w.pant_pieces,
        amount: w.total_amount,
        isWork: true,
      });
    });
    data.upadEntries.forEach(u => {
      entries.push({
        date: u.date,
        type: 'ઉપાડ (Advance)',
        desc: `${u.payment_mode || 'રોકડ'} - ${u.notes || ''}`,
        kurtiPcs: '-',
        pantPcs: '-',
        amount: u.amount,
        isWork: false,
      });
    });

    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.querySelector('#karigarLedgerTable tbody');
    if (entries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--slate-400);">આ કારીગરનું કોઈ રેકોર્ડ નથી.</td></tr>`;
      return;
    }

    tbody.innerHTML = entries.map(e => `
      <tr style="${!e.isWork ? 'background: #fff8f8;' : ''}">
        <td>${formatDate(e.date)}</td>
        <td><span class="badge ${e.isWork ? 'badge-success' : 'badge-danger'}">${e.type}</span></td>
        <td>${escapeHtml(e.desc)}</td>
        <td>${e.kurtiPcs}</td>
        <td>${e.pantPcs}</td>
        <td><strong style="color:${e.isWork ? 'var(--sapphire-700)' : 'var(--rose-600)'};">${e.isWork ? '+' : '-'} ₹${e.amount.toLocaleString('en-IN')}</strong></td>
      </tr>
    `).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function selectAndShowLedger(karigarId) {
  switchKarigarSubTab('ledger');
  const panel = document.getElementById('karigarDetailPanel');
  if (panel) {
    panel.style.display = 'block';
    const k = (state.karigars || []).find(item => item.id == karigarId);
    const titleEl = document.getElementById('ledgerDetailTitle');
    if (titleEl && k) titleEl.textContent = `${k.name} — કામ & ઉપાડ સ્ટેટમેન્ટ`;
  }
  const sel = document.getElementById('ledgerKarigarSelect');
  if (sel) sel.value = karigarId;
  loadKarigarLedger(karigarId);
  if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onWorkDesignChange(designId) {
  const design = state.designs.find(d => d.id == designId);
  if (design) {
    document.getElementById('workKurtiRate').value = design.karigar_kurti_rate || 0;
    document.getElementById('workPantRate').value = design.karigar_pant_rate || 0;
    calcWorkTotal();
  }
}

function calcWorkTotal() {
  const kPcs = parseFloat(document.getElementById('workKurtiPcs').value) || 0;
  const kRate = parseFloat(document.getElementById('workKurtiRate').value) || 0;
  const pPcs = parseFloat(document.getElementById('workPantPcs').value) || 0;
  const pRate = parseFloat(document.getElementById('workPantRate').value) || 0;
  const oPcs = parseFloat(document.getElementById('workOtherPcs').value) || 0;
  const oRate = parseFloat(document.getElementById('workOtherRate').value) || 0;

  const total = (kPcs * kRate) + (pPcs * pRate) + (oPcs * oRate);
  document.getElementById('workTotalAmount').value = `₹${total.toLocaleString('en-IN')}`;
}

async function submitKarigarWork(e) {
  e.preventDefault();
  const payload = {
    date: document.getElementById('workDate').value,
    karigar_id: document.getElementById('workKarigarSelect').value,
    design_id: document.getElementById('workDesignSelect').value,
    lot_id: document.getElementById('workLotSelect').value || null,
    kurti_pieces: document.getElementById('workKurtiPcs').value,
    kurti_rate: document.getElementById('workKurtiRate').value,
    pant_pieces: document.getElementById('workPantPcs').value,
    pant_rate: document.getElementById('workPantRate').value,
    other_pieces: document.getElementById('workOtherPcs').value,
    other_rate: document.getElementById('workOtherRate').value,
  };
  try {
    await api('/api/karigar-work', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-karigar-work');
    showToast('કારીગર કામ એન્ટ્રી ઉમેરાઈ ગઈ!', 'success');
    loadKarigars();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitKarigarUpad(e) {
  e.preventDefault();
  const payload = {
    date: document.getElementById('upadDate').value,
    karigar_id: document.getElementById('upadKarigarSelect').value,
    amount: document.getElementById('upadAmount').value,
    payment_mode: document.getElementById('upadPaymentMode').value,
    notes: document.getElementById('upadNotes').value,
  };
  try {
    await api('/api/karigar-upad', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-upad');
    showToast('કારીગર ઉપાડ સફળતાપૂર્વક નોંધાઈ ગયો!', 'success');
    loadKarigars();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitKarigar(e) {
  e.preventDefault();
  const type = document.getElementById('karigarType')?.value || 'chhutak';
  const salary = Number(document.getElementById('karigarMonthlySalary')?.value) || 0;
  const baseSpec = document.getElementById('karigarSpeciality').value;
  const speciality = type === 'fix_pagar' ? `${baseSpec} [ફિક્સ:${salary}]` : baseSpec;

  const payload = {
    name: document.getElementById('karigarName').value,
    phone: document.getElementById('karigarPhone').value,
    speciality,
    address: document.getElementById('karigarAddress').value,
  };
  try {
    await api('/api/karigars', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-karigar');
    showToast('કારીગર સફળતાપૂર્વક ઉમેરાયા!', 'success');
    e.target.reset();
    toggleFixSalaryField('chhutak');
    await fetchDropdownMasters();
    if (currentTab === 'fix-karigar') loadFixKarigar();
    else if (currentTab === 'chhutak-karigar') loadChhutakKarigar();
    else loadKarigars();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteKarigarWork(id) {
  if (!confirm('શું તમે આ કામ એન્ટ્રી કાઢી નાખવા માંગો છો?')) return;
  try {
    await api(`/api/karigar-work/${id}`, { method: 'DELETE' });
    showToast('કામ એન્ટ્રી કાઢી નાખવામાં આવી', 'info');
    loadKarigars();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteKarigarUpad(id) {
  if (!confirm('શું તમે આ ઉપાડ એન્ટ્રી કાઢી નાખવા માંગો છો?')) return;
  try {
    await api(`/api/karigar-upad/${id}`, { method: 'DELETE' });
    showToast('ઉપાડ એન્ટ્રી દૂર થઈ', 'info');
    loadKarigars();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Print Karigar Salary Slip (કારીગર પગાર રસીદ પ્રિન્ટ)
async function printKarigarSalarySlip() {
  const karigarId = document.getElementById('ledgerKarigarSelect')?.value;
  if (!karigarId) {
    showToast('કૃપા કરીને પહેલા કારીગર સિલેક્ટ કરો.', 'error');
    return;
  }
  try {
    const data = await api(`/api/karigars/${karigarId}/ledger`);
    const karigar = data.karigar;
    const summary = data.summary;

    const printableArea = document.getElementById('printableArea');
    printableArea.innerHTML = `
      <div class="print-document">
        <div class="print-header">
          <div class="print-header-left">
            <img src="./logo.png" class="print-logo" alt="Gurukrupa Logo">
            <div class="print-title">
              <h1>${escapeHtml(state.settings.company_name || 'GURUKRUPA CREATION')}</h1>
              <p>${escapeHtml(state.settings.company_tagline || DEFAULT_COMPANY_TAGLINE)}</p>
              <p>મોબાઇલ: ${escapeHtml(state.settings.company_phone || DEFAULT_COMPANY_PHONE)}</p>
              <p>સરનામું: ${escapeHtml(state.settings.company_address || DEFAULT_COMPANY_ADDRESS)}</p>
            </div>
          </div>
          <div class="print-doc-badge">
            <h2>કારીગર પગાર રસીદ</h2>
            <p>તારીખ: ${formatDate(new Date().toISOString().split('T')[0])}</p>
          </div>
        </div>

        <div style="margin-bottom: 16px; padding: 12px; background: #f9f9f9; border: 1px solid #000; border-radius: 4px;">
          <p><strong>કારીગર નામ:</strong> ${escapeHtml(karigar.name)}</p>
          <p><strong>કામનો પ્રકાર:</strong> ${escapeHtml(parseKarigarMeta(karigar).cleanSpeciality)}</p>
          <p><strong>મોબાઇલ:</strong> ${escapeHtml(karigar.phone || '-')}</p>
        </div>

        <table class="print-table" style="margin-top: 18px;">
          <thead>
            <tr>
              <th style="text-align: left;">હિસાબની વિગત (Summary)</th>
              <th style="text-align: right; width: 180px;">રકમ (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>અત્યાર સુધીનું કુલ કામ (Total Work Done):</strong></td>
              <td style="text-align: right; font-weight: 700; font-size: 14px;">₹${summary.totalEarned.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="color: #c00;"><strong>કુલ ઉપાડ કપાત (Total Upad / Advance):</strong></td>
              <td style="text-align: right; font-weight: 700; font-size: 14px; color: #c00;">- ₹${summary.totalUpad.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background: #f0f0f0;">
              <td style="font-size: 15px; font-weight: 800; border-top: 2px solid #000;">બાકી ચૂકવવાપાત્ર રકમ (Net Balance Left):</td>
              <td style="text-align: right; font-size: 16px; font-weight: 800; border-top: 2px solid #000;">₹${summary.netBalance.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div class="print-signatures">
          <div class="signature-box">
            કારીગરની સહી
          </div>
          <div class="signature-box">
            ગુરુકૃપા ક્રિએશન (સહી / સિક્કો)
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      window.print();
    }, 100);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================================================================
// MODULE 5: PRESS VENDORS & ENTRIES (Point 5)
// ===================================================================
async function loadPress() {
  try {
    const [entries, vendors] = await Promise.all([
      api('/api/press-entries'),
      api('/api/press-vendors'),
    ]);
    state.pressEntries = entries;
    state.pressVendors = vendors;
    renderPressTable(entries);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderPressTable(entries) {
  const tbody = document.querySelector('#pressTable tbody');
  if (!entries || entries.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            <h4>કોઈ પ્રેસ એન્ટ્રી નોંધાયેલ નથી</h4>
            <p>પ્રેસ વાળાનો હિસાબ અને પીસ નોંધવા માટે "+ પ્રેસ કામ નોંધો" પર ક્લિક કરો.</p>
            <button class="btn btn-primary btn-sm" onclick="openModal('modal-add-press-entry')">+ પ્રેસ કામ નોંધો</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = entries.map(p => `
    <tr>
      <td>${formatDate(p.date)}</td>
      <td><strong>${escapeHtml(p.vendor_name || '-')}</strong></td>
      <td>${escapeHtml(p.design_no || '-')}</td>
      <td><strong>${p.pieces}</strong></td>
      <td>₹${p.rate_per_piece}</td>
      <td><strong style="color:var(--sapphire-700);">₹${p.total_amount.toLocaleString('en-IN')}</strong></td>
      <td><span class="badge ${p.status === 'ચૂકવેલ' ? 'badge-success' : 'badge-warning'}">${escapeHtml(p.status)}</span></td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deletePressEntry(${p.id})">કાઢી નાખો</button>
      </td>
    </tr>
  `).join('');
}

function onPressVendorChange(vendorId) {
  const v = state.pressVendors.find(x => x.id == vendorId);
  if (v && v.default_rate) {
    document.getElementById('pressRate').value = v.default_rate;
    calcPressTotal();
  }
}

function onPressDesignChange(designId) {
  const d = state.designs.find(x => x.id == designId);
  if (d && d.press_rate) {
    document.getElementById('pressRate').value = d.press_rate;
    calcPressTotal();
  }
}

function calcPressTotal() {
  const pcs = parseFloat(document.getElementById('pressPieces').value) || 0;
  const rate = parseFloat(document.getElementById('pressRate').value) || 0;
  document.getElementById('pressTotalAmount').value = `₹${(pcs * rate).toLocaleString('en-IN')}`;
}

async function submitPressEntry(e) {
  e.preventDefault();
  const payload = {
    date: document.getElementById('pressDate').value,
    vendor_id: document.getElementById('pressVendorSelect').value,
    design_id: document.getElementById('pressDesignSelect').value || null,
    pieces: document.getElementById('pressPieces').value,
    rate_per_piece: document.getElementById('pressRate').value,
    status: document.getElementById('pressStatus').value,
  };
  try {
    await api('/api/press-entries', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-press-entry');
    showToast('પ્રેસ કામ સફળતાપૂર્વક નોંધાઈ ગયું!', 'success');
    loadPress();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitPressVendor(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('pressVendorName').value,
    phone: document.getElementById('pressVendorPhone').value,
    default_rate: document.getElementById('pressVendorDefaultRate').value,
  };
  try {
    await api('/api/press-vendors', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-press-vendor');
    showToast('પ્રેસ વાળા સફળતાપૂર્વક ઉમેરાયા!', 'success');
    await fetchDropdownMasters();
    loadPress();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deletePressEntry(id) {
  if (!confirm('શું તમે આ પ્રેસ એન્ટ્રી દૂર કરવા માંગો છો?')) return;
  try {
    await api(`/api/press-entries/${id}`, { method: 'DELETE' });
    showToast('પ્રેસ એન્ટ્રી દૂર થઈ', 'info');
    loadPress();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================================================================
// MODULE 6: RAW MATERIALS (Point 6)
// ===================================================================
async function loadMaterials() {
  try {
    const materials = await api('/api/materials');
    state.materials = materials;
    renderMaterialsTable(materials);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderMaterialsTable(materials) {
  const tbody = document.querySelector('#materialsTable tbody');
  if (!materials || materials.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
            <h4>કોઈ મટીરીયલ ખર્ચ નોંધાયેલ નથી</h4>
            <p>દોરો, બટન, ઝિપ, ઇલાસ્ટિક, લેસ, પેકિંગ બેગ નોંધવા માટે "+ મટીરીયલ ખર્ચ નોંધો" પર ક્લિક કરો.</p>
            <button class="btn btn-primary btn-sm" onclick="openModal('modal-add-material')">+ મટીરીયલ ખર્ચ નોંધો</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = materials.map(m => `
    <tr>
      <td>${formatDate(m.date)}</td>
      <td><strong>${escapeHtml(m.material_name)}</strong></td>
      <td>${m.quantity}</td>
      <td><span class="badge badge-info">${escapeHtml(m.unit)}</span></td>
      <td>₹${m.rate}</td>
      <td><strong style="color:var(--amber-700);">₹${m.total_amount.toLocaleString('en-IN')}</strong></td>
      <td>${escapeHtml(m.supplier_name || '-')}</td>
      <td>${escapeHtml(m.bill_no || '-')}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteMaterial(${m.id})">કાઢી નાખો</button></td>
    </tr>
  `).join('');
}

function calcMatTotal() {
  const qty = parseFloat(document.getElementById('matQty').value) || 0;
  const rate = parseFloat(document.getElementById('matRate').value) || 0;
  document.getElementById('matTotal').value = `₹${(qty * rate).toLocaleString('en-IN')}`;
}

async function submitMaterial(e) {
  e.preventDefault();
  const payload = {
    date: document.getElementById('matDate').value,
    material_name: document.getElementById('matName').value,
    quantity: document.getElementById('matQty').value,
    unit: document.getElementById('matUnit').value,
    rate: document.getElementById('matRate').value,
    supplier_name: document.getElementById('matSupplier').value,
    bill_no: document.getElementById('matBillNo').value,
  };
  try {
    await api('/api/materials', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-material');
    showToast('મટીરીયલ ખર્ચ નોંધાઈ ગયો!', 'success');
    loadMaterials();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteMaterial(id) {
  if (!confirm('શું તમે આ મટીરીયલ એન્ટ્રી કાઢી નાખવા માંગો છો?')) return;
  try {
    await api(`/api/materials/${id}`, { method: 'DELETE' });
    showToast('મટીરીયલ એન્ટ્રી દૂર થઈ', 'info');
    loadMaterials();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================================================================
// MODULE 7: FACTORY OVERHEADS & KHATA KHARCH (Point 7)
// ===================================================================
async function loadExpenses() {
  try {
    const expenses = await api('/api/expenses');
    state.expenses = expenses;
    renderExpensesTable(expenses);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderExpensesTable(expenses) {
  const tbody = document.querySelector('#expensesTable tbody');
  if (!expenses || expenses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <h4>કોઈ ખાતા ખર્ચ નોંધાયેલ નથી</h4>
            <p>લાઈટ બિલ, કચરો, કારખાના ભાડું, પાણી બિલ, ચા-નાસ્તો નોંધવા માટે "+ ખાતા ખર્ચ નોંધો" પર ક્લિક કરો.</p>
            <button class="btn btn-danger btn-sm" onclick="openModal('modal-add-expense')">+ ખાતા ખર્ચ નોંધો</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = expenses.map(e => `
    <tr>
      <td>${formatDate(e.date)}</td>
      <td><span class="badge badge-warning">${escapeHtml(e.category)}</span></td>
      <td><strong style="color:var(--rose-600); font-size:15px;">₹${e.amount.toLocaleString('en-IN')}</strong></td>
      <td>${escapeHtml(e.paid_to || '-')}</td>
      <td>${escapeHtml(e.payment_mode || 'રોકડ')}</td>
      <td>${escapeHtml(e.notes || '-')}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteExpense(${e.id})">કાઢી નાખો</button></td>
    </tr>
  `).join('');
}

async function submitExpense(e) {
  e.preventDefault();
  const payload = {
    date: document.getElementById('expDate').value,
    category: document.getElementById('expCategory').value,
    amount: document.getElementById('expAmount').value,
    payment_mode: document.getElementById('expPaymentMode').value,
    paid_to: document.getElementById('expPaidTo').value,
    notes: document.getElementById('expNotes').value,
  };
  try {
    await api('/api/expenses', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-expense');
    showToast('ખાતા ખર્ચ સફળતાપૂર્વક નોંધાઈ ગયો!', 'success');
    loadExpenses();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteExpense(id) {
  if (!confirm('શું તમે આ ખર્ચ એન્ટ્રી દૂર કરવા માંગો છો?')) return;
  try {
    await api(`/api/expenses/${id}`, { method: 'DELETE' });
    showToast('ખર્ચ એન્ટ્રી દૂર થઈ', 'info');
    loadExpenses();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================================================================
// MODULE 8: FIXED STAFF & ATTENDANCE (Point 9)
// ===================================================================
async function loadStaff() {
  try {
    const [staff, attendance] = await Promise.all([
      api('/api/staff'),
      api('/api/staff-attendance'),
    ]);
    state.staff = staff;
    state.staffAttendance = attendance;
    renderStaffAttendanceTable(attendance);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderStaffAttendanceTable(attendance) {
  const tbody = document.querySelector('#staffAttendanceTable tbody');
  if (!attendance || attendance.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <h4>કોઈ સ્ટાફ હાજરી નોંધાયેલ નથી</h4>
            <p>કટિંગ, પેકિંગ, હેલ્પરનો દિવસે કલાક સાથે હિસાબ રાખવા "+ દૈનિક હાજરી & કલાક નોંધો" પર ક્લિક કરો.</p>
            <button class="btn btn-primary btn-sm" onclick="openModal('modal-add-staff-attendance')">+ દૈનિક હાજરી & કલાક નોંધો</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = attendance.map(a => {
    const net = (a.calculated_pay || 0) - (a.advance_deduction || 0);
    return `
      <tr>
        <td>${formatDate(a.date)}</td>
        <td><strong>${escapeHtml(a.staff_name || '-')}</strong></td>
        <td>${escapeHtml(a.role || '-')}</td>
        <td><span class="badge ${a.status === 'હાજર' ? 'badge-success' : (a.status === 'અડધો દિવસ' ? 'badge-warning' : 'badge-danger')}">${escapeHtml(a.status)}</span></td>
        <td><strong>${a.hours_worked} કલાક</strong></td>
        <td>₹${a.calculated_pay}</td>
        <td>${a.advance_deduction > 0 ? `<span style="color:var(--rose-600);">-₹${a.advance_deduction}</span>` : '₹0'}</td>
        <td><strong style="color:var(--emerald-600);">₹${net}</strong></td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteStaffAttendance(${a.id})">કાઢી નાખો</button></td>
      </tr>
    `;
  }).join('');
}

function onStaffSelectChange(staffId) {
  calcStaffPay();
}

function onAttStatusChange(status) {
  const hrs = document.getElementById('attHours');
  if (status === 'હાજર') hrs.value = '8';
  else if (status === 'અડધો દિવસ') hrs.value = '4';
  else if (status === 'ગેરહાજર') hrs.value = '0';
  calcStaffPay();
}

function calcStaffPay() {
  const staffId = document.getElementById('attStaffSelect').value;
  const hours = parseFloat(document.getElementById('attHours').value) || 0;
  const staff = state.staff.find(s => s.id == staffId);
  if (!staff) return;

  let pay = 0;
  if (staff.salary_type === 'કલાક દીઠ') {
    pay = hours * staff.base_rate;
  } else if (staff.salary_type === 'દૈનિક') {
    const std = staff.standard_hours || 8;
    pay = (hours / std) * staff.base_rate;
  } else if (staff.salary_type === 'માસિક') {
    const daily = staff.base_rate / 26;
    const std = staff.standard_hours || 8;
    pay = (hours / std) * daily;
  }
  document.getElementById('attCalculatedPay').value = Math.round(pay);
}

async function submitStaff(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('staffName').value,
    role: document.getElementById('staffRole').value,
    phone: document.getElementById('staffPhone').value,
    salary_type: document.getElementById('staffSalaryType').value,
    base_rate: document.getElementById('staffBaseRate').value,
    standard_hours: document.getElementById('staffStdHours').value,
  };
  try {
    await api('/api/staff', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-staff');
    showToast('સ્ટાફ સફળતાપૂર્વક ઉમેરાયા!', 'success');
    await fetchDropdownMasters();
    loadStaff();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitStaffAttendance(e) {
  e.preventDefault();
  const payload = {
    date: document.getElementById('attDate').value,
    staff_id: document.getElementById('attStaffSelect').value,
    status: document.getElementById('attStatus').value,
    hours_worked: document.getElementById('attHours').value,
    calculated_pay: document.getElementById('attCalculatedPay').value,
    advance_deduction: document.getElementById('attAdvanceDeduction').value,
    notes: document.getElementById('attNotes').value,
  };
  try {
    await api('/api/staff-attendance', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-staff-attendance');
    showToast('હાજરી સફળતાપૂર્વક નોંધાઈ ગઈ!', 'success');
    loadStaff();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteStaffAttendance(id) {
  if (!confirm('શું તમે આ હાજરી રેકોર્ડ કાઢી નાખવા માંગો છો?')) return;
  try {
    await api(`/api/staff-attendance/${id}`, { method: 'DELETE' });
    showToast('હાજરી રેકોર્ડ દૂર થયો', 'info');
    loadStaff();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================================================================
// MODULE 9: DELIVERY CHALLANS (વેપારી માલ ચલણ & ઓટોમેટિક પ્રિન્ટ)
// ===================================================================
async function loadChallans() {
  try {
    const challans = await api('/api/challans');
    state.challans = challans;
    renderChallansTable(challans);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderChallansTable(challans) {
  const tbody = document.querySelector('#challansTable tbody');
  if (!challans || challans.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <h4>કોઈ ચલણ બનાવેલ નથી</h4>
            <p>વેપારીને તૈયાર માલ જમા કરાવતી વખતે સત્તાવાર ચલણ બનાવવા અને ઓટો પ્રિન્ટ કરવા માટે "+ નવું માલ ચલણ બનાવો" પર ક્લિક કરો.</p>
            <button class="btn btn-success btn-sm" onclick="openModal('modal-add-challan')">+ નવું માલ ચલણ બનાવો</button>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = challans.map(c => {
    const desc = (c.items || []).map(i => `${i.design_no || ''} (${i.pieces} pcs)`).join(', ');
    return `
      <tr>
        <td>${formatDate(c.date)}</td>
        <td><strong>${escapeHtml(c.challan_no)}</strong></td>
        <td>${escapeHtml(c.merchant_name || '-')}</td>
        <td>${escapeHtml(desc || '-')}</td>
        <td><strong>${c.total_pieces}</strong></td>
        <td><strong style="color:var(--emerald-700);">₹${c.grand_total.toLocaleString('en-IN')}</strong></td>
        <td><span class="badge badge-success">${escapeHtml(c.status || 'જમા')}</span></td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-primary" onclick="printChallanById(${c.id})">પ્રિન્ટ</button>
            <button class="btn btn-sm btn-danger" onclick="deleteChallan(${c.id})">કાઢી નાખો</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function initChallanModal() {
  document.getElementById('challanItemsContainer').innerHTML = '';
  addChallanItemRow();
}

function addChallanItemRow(defaultData = {}) {
  const container = document.getElementById('challanItemsContainer');
  const rowId = `item_row_${Date.now()}_${Math.random().toString().slice(-4)}`;
  const div = document.createElement('div');
  div.className = 'challan-item-row';
  div.id = rowId;

  div.innerHTML = `
    <div>
      <select class="form-control item-design" onchange="onChallanRowDesignChange('${rowId}', this.value)">
        <option value="">-- ડિઝાઇન --</option>
        ${state.designs.map(d => `<option value="${d.id}" data-no="${escapeHtml(d.design_no)}" data-name="${escapeHtml(d.name || '')}" data-rate="${d.party_rate}" ${defaultData.design_id == d.id ? 'selected' : ''}>${escapeHtml(d.design_no)} (₹${d.party_rate})</option>`).join('')}
      </select>
    </div>
    <div>
      <select class="form-control item-type">
        <option value="2-પીસ સેટ (કુર્તી+પેન્ટ)">2-પીસ સેટ (કુર્તી+પેન્ટ)</option>
        <option value="માત્ર કુર્તી">માત્ર કુર્તી (Kurti)</option>
        <option value="માત્ર પેન્ટ">માત્ર પેન્ટ (Pant)</option>
        <option value="અન્ય ગાર્મેન્ટ">અન્ય ગાર્મેન્ટ</option>
      </select>
    </div>
    <div>
      <input type="number" class="form-control item-pieces" placeholder="પીસ" min="1" value="${defaultData.pieces || 1}" oninput="calcChallanTotals()">
    </div>
    <div>
      <input type="number" class="form-control item-rate" placeholder="ભાવ" step="0.5" value="${defaultData.rate || 0}" oninput="calcChallanTotals()">
    </div>
    <div>
      <input type="text" class="form-control item-amount" placeholder="રકમ" readonly style="font-weight:700; background:var(--slate-100);">
    </div>
    <div>
      <button type="button" class="btn btn-sm btn-danger" style="padding:4px 8px;" onclick="removeChallanItemRow('${rowId}')">&times;</button>
    </div>
  `;
  container.appendChild(div);
  calcChallanTotals();
}

function removeChallanItemRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) row.remove();
  calcChallanTotals();
}

function onChallanRowDesignChange(rowId, designId) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const design = state.designs.find(d => d.id == designId);
  if (design) {
    row.querySelector('.item-rate').value = design.party_rate || 0;
    calcChallanTotals();
  }
}

function calcChallanTotals() {
  const rows = document.querySelectorAll('.challan-item-row');
  let totalPieces = 0;
  let grandTotal = 0;

  rows.forEach(row => {
    const pcs = parseFloat(row.querySelector('.item-pieces').value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    const amount = pcs * rate;
    row.querySelector('.item-amount').value = `₹${amount.toLocaleString('en-IN')}`;
    totalPieces += pcs;
    grandTotal += amount;
  });

  document.getElementById('challanTotalPieces').value = totalPieces;
  document.getElementById('challanGrandTotal').value = `₹${grandTotal.toLocaleString('en-IN')}`;
}

function onChallanMerchantChange(merchantId) {
  const lotSelect = document.getElementById('challanLotSelect');
  const merchantLots = state.lots.filter(l => l.merchant_id == merchantId);
  lotSelect.innerHTML = '<option value="">-- સમગ્ર લોટ સિલેક્ટ કરો (ઓટો ભરવા માટે) --</option>' +
    merchantLots.map(l => `<option value="${l.id}">${escapeHtml(l.lot_no || 'Lot')} - ${escapeHtml(l.design_no || '')} (${l.total_pieces} pcs @ ₹${l.rate_per_piece})</option>`).join('');
}

function onChallanLotChange(lotId) {
  const lot = state.lots.find(l => l.id == lotId);
  if (lot) {
    document.getElementById('challanItemsContainer').innerHTML = '';
    addChallanItemRow({
      design_id: lot.design_id,
      pieces: lot.total_pieces,
      rate: lot.rate_per_piece,
    });
  }
}

function createChallanFromLot(lotId) {
  const lot = state.lots.find(l => l.id == lotId);
  if (!lot) return;
  switchTab('challans');
  openModal('modal-add-challan');
  document.getElementById('challanMerchantSelect').value = lot.merchant_id;
  onChallanMerchantChange(lot.merchant_id);
  document.getElementById('challanLotSelect').value = lot.id;
  document.getElementById('challanItemsContainer').innerHTML = '';
  addChallanItemRow({
    design_id: lot.design_id,
    pieces: lot.total_pieces,
    rate: lot.rate_per_piece,
  });
}

async function submitDeliveryChallan(e) {
  e.preventDefault();
  const rows = document.querySelectorAll('.challan-item-row');
  const items = [];
  rows.forEach(row => {
    const sel = row.querySelector('.item-design');
    const opt = sel.options[sel.selectedIndex];
    const pcs = parseFloat(row.querySelector('.item-pieces').value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    if (pcs > 0) {
      items.push({
        design_id: sel.value,
        design_no: opt ? opt.getAttribute('data-no') : '',
        design_name: opt ? opt.getAttribute('data-name') : '',
        item_type: row.querySelector('.item-type').value,
        pieces: pcs,
        rate: rate,
        amount: pcs * rate,
      });
    }
  });

  if (items.length === 0) {
    showToast('કૃપા કરીને ઓછામાં ઓછી એક ડિઝાઇન આઈટમ ઉમેરો.', 'error');
    return;
  }

  const payload = {
    date: document.getElementById('challanDate').value,
    merchant_id: document.getElementById('challanMerchantSelect').value,
    lot_id: document.getElementById('challanLotSelect').value || null,
    notes: document.getElementById('challanNotes').value,
    items: items,
  };

  try {
    const res = await api('/api/challans', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-challan');
    showToast('ચલણ બની ગયું! ઓટોમેટિક પ્રિન્ટ થઈ રહ્યું છે...', 'success');
    loadChallans();
    loadDashboard();
    if (res.id) {
      printChallanById(res.id);
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function printChallanById(challanId) {
  try {
    const c = await api(`/api/challans/${challanId}`);
    const items = c.items || [];

    const printableArea = document.getElementById('printableArea');
    printableArea.innerHTML = `
      <div class="print-document">
        <div class="print-header">
          <div class="print-header-left">
            <img src="./logo.png" class="print-logo" alt="Gurukrupa Logo">
            <div class="print-title">
              <h1>${escapeHtml(state.settings.company_name || 'GURUKRUPA CREATION')}</h1>
              <p>${escapeHtml(state.settings.company_tagline || DEFAULT_COMPANY_TAGLINE)}</p>
              <p>મોબાઇલ: ${escapeHtml(state.settings.company_phone || DEFAULT_COMPANY_PHONE)}</p>
              <p>સરનામું: ${escapeHtml(state.settings.company_address || DEFAULT_COMPANY_ADDRESS)}</p>
            </div>
          </div>
          <div class="print-doc-badge">
            <h2>માલ ડિલિવરી ચલણ</h2>
            <p><strong>ચલણ નં:</strong> ${escapeHtml(c.challan_no)}</p>
            <p><strong>તારીખ:</strong> ${formatDate(c.date)}</p>
          </div>
        </div>

        <div style="margin-bottom: 16px; padding: 12px; background: #fafafa; border: 1px solid #000; border-radius: 4px;">
          <p><strong>વેપારીનું નામ (M/s):</strong> <span style="font-size: 15px; font-weight: bold;">${escapeHtml(c.merchant_name || '')}</span></p>
          <p><strong>મોબાઇલ:</strong> ${escapeHtml(c.merchant_phone || '-')}</p>
          <p><strong>સરનામું:</strong> ${escapeHtml(c.merchant_address || '-')}</p>
        </div>

        <table class="print-table">
          <thead>
            <tr>
              <th style="width: 40px;">ક્રમ</th>
              <th>ડિઝાઇન નંબર & નામ</th>
              <th>પ્રકાર (Item Type)</th>
              <th style="text-align: right;">કુલ પીસ (નંગ)</th>
              <th style="text-align: right;">ભાવ (₹)</th>
              <th style="text-align: right;">કુલ રકમ (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${escapeHtml(it.design_no || '')}</strong> ${escapeHtml(it.design_name || '')}</td>
                <td>${escapeHtml(it.item_type || '')}</td>
                <td style="text-align: right; font-weight: bold;">${it.pieces}</td>
                <td style="text-align: right;">₹${it.rate}</td>
                <td style="text-align: right; font-weight: bold;">₹${(it.pieces * it.rate).toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f0f0f0; font-weight: bold;">
              <td colspan="3" style="text-align: right; padding: 10px;">કુલ સરવાળો (GRAND TOTAL):</td>
              <td style="text-align: right; font-size: 14px; padding: 10px;">${c.total_pieces} પીસ</td>
              <td></td>
              <td style="text-align: right; font-size: 16px; padding: 10px;">₹${c.grand_total.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        ${c.notes ? `<p style="margin-top: 10px; font-size: 12px;"><strong>નોંધ:</strong> ${escapeHtml(c.notes)}</p>` : ''}

        <div class="print-signatures">
          <div class="signature-box">
            માલ મેળવનારની સહી
          </div>
          <div class="signature-box">
            ગુરુકૃપા ક્રિએશન (સહી / સિક્કો)
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      window.print();
    }, 100);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteChallan(id) {
  if (!confirm('શું તમે આ ચલણ દૂર કરવા માંગો છો?')) return;
  try {
    await api(`/api/challans/${id}`, { method: 'DELETE' });
    showToast('ચલણ દૂર થયું', 'info');
    loadChallans();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================================================================
// MODULE 10: SETTINGS & CLOUD SYNC
// ===================================================================
async function loadSettings() {
  try {
    const s = await api('/api/settings');
    state.settings = s;

    const cn = document.getElementById('setCompanyName');
    if (cn) cn.value = s.company_name || 'GURUKRUPA CREATION';
    const ct = document.getElementById('setCompanyTagline');
    if (ct) ct.value = s.company_tagline || DEFAULT_COMPANY_TAGLINE;
    const cp = document.getElementById('setCompanyPhone');
    if (cp) cp.value = s.company_phone || DEFAULT_COMPANY_PHONE;
    const ca = document.getElementById('setCompanyAddress');
    if (ca) ca.value = s.company_address || DEFAULT_COMPANY_ADDRESS;
    const cpr = document.getElementById('setChallanPrefix');
    if (cpr) cpr.value = s.challan_prefix || 'GK-CH-';

    const liveUrl = 'https://om2008buddy.github.io/girikrupa-creation/';
    const ipText = document.getElementById('serverIpText');
    if (ipText) ipText.textContent = `Cloud: Supabase Active`;

    const androidUrlDisplay = document.getElementById('androidUrlDisplay');
    if (androidUrlDisplay) {
      androidUrlDisplay.innerHTML = `<a href="${liveUrl}" target="_blank" style="color:var(--sapphire-700); font-weight:700;">${liveUrl}</a>`;
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

async function saveCompanySettings(e) {
  e.preventDefault();
  const payload = {
    company_name: document.getElementById('setCompanyName').value,
    company_tagline: document.getElementById('setCompanyTagline').value,
    company_phone: document.getElementById('setCompanyPhone').value,
    company_address: document.getElementById('setCompanyAddress').value,
    challan_prefix: document.getElementById('setChallanPrefix').value,
  };
  try {
    await api('/api/settings', { method: 'POST', body: JSON.stringify(payload) });
    showToast('સેટિંગ્સ સેવ થઈ ગયા!', 'success');
    loadSettings();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function downloadBackup() {
  const backup = {
    exported_at: new Date().toISOString(),
    version: '1.0.0',
    data: state
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `gurukrupa_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}

// ─── PDF / Print Full Report ───────────────────────────────────────────────
function downloadBackupPDF() {
  const s = state;
  const dateStr = new Date().toLocaleDateString('en-IN');
  const co = s.settings || {};
  const companyName = co.company_name || 'ગુરુકૃપા ક્રિએશન';

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Helpers ──
  const sectionHead = (title) => `
    <tr><td colspan="20" style="background:#222;color:#fff;font-weight:700;font-size:13px;padding:8px 10px;border:1px solid #000;">${title}</td></tr>`;

  const tableHead = (cols) => `
    <tr>${cols.map(c => `<th style="background:#e0e0e0;border:1px solid #000;padding:5px 7px;font-size:10px;font-weight:700;">${c}</th>`).join('')}</tr>`;

  const noData = (cols) => `<tr><td colspan="${cols}" style="border:1px solid #000;padding:5px 7px;font-size:10px;color:#666;text-align:center;">— કોઈ ડેટા નથી —</td></tr>`;

  // ── 1. Traders ──
  const tradersRows = (s.merchants || []).map((m, i) => `
    <tr>
      <td>${i + 1}</td><td>${m.name || '-'}</td><td>${m.phone || '-'}</td><td>${m.address || '-'}</td>
    </tr>`).join('') || noData(4);

  // ── 2. Inward Lots ──
  const lotsRows = (s.lots || []).map((l, i) => `
    <tr>
      <td>${i + 1}</td><td>${l.lot_no || '-'}</td><td>${l.lot_name || '-'}</td>
      <td>${l.merchant_name || '-'}</td><td>${l.pieces || 0}</td>
      <td>₹${fmt(l.rate)}</td><td>₹${fmt(l.total_amount)}</td>
      <td>${l.date || '-'}</td><td>${l.status || '-'}</td>
    </tr>`).join('') || noData(9);

  // ── 3. Challans ──
  const challansRows = (s.challans || []).map((c, i) => `
    <tr>
      <td>${i + 1}</td><td>${c.challan_no || '-'}</td><td>${c.merchant_name || '-'}</td>
      <td>${c.total_pieces || 0}</td><td>₹${fmt(c.grand_total)}</td>
      <td>${c.date || '-'}</td><td>${c.status || '-'}</td>
    </tr>`).join('') || noData(7);

  // ── 4. Artisan Work ──
  const workRows = (s.karigarWork || []).map((w, i) => `
    <tr>
      <td>${i + 1}</td><td>${w.karigar_name || '-'}</td><td>${w.lot_name || '-'}</td>
      <td>${w.pieces || 0}</td><td>₹${fmt(w.rate)}</td><td>₹${fmt(w.amount)}</td>
      <td>${w.date || '-'}</td>
    </tr>`).join('') || noData(7);

  // ── 5. Artisan Advances ──
  const advRows = (s.karigarUpad || []).map((a, i) => `
    <tr>
      <td>${i + 1}</td><td>${a.karigar_name || '-'}</td><td>₹${fmt(a.amount)}</td>
      <td>${a.note || '-'}</td><td>${a.date || '-'}</td>
    </tr>`).join('') || noData(5);

  // ── 6. Artisan List ──
  const karigarRows = (s.karigars || []).map((k, i) => `
    <tr>
      <td>${i + 1}</td><td>${k.name || '-'}</td><td>${k.phone || '-'}</td><td>${k.address || '-'}</td>
    </tr>`).join('') || noData(4);

  // ── 7. Designs ──
  const designRows = (s.designs || []).map((d, i) => `
    <tr>
      <td>${i + 1}</td><td>${d.design_no || '-'}</td><td>${d.design_name || '-'}</td>
      <td>${d.type || '-'}</td><td>₹${fmt(d.kurti_rate)}</td><td>₹${fmt(d.pant_rate)}</td>
      <td>${d.total_pieces || 0}</td>
    </tr>`).join('') || noData(7);

  // ── 8. Press Entries ──
  const pressRows = (s.pressEntries || []).map((p, i) => `
    <tr>
      <td>${i + 1}</td><td>${p.vendor_name || '-'}</td><td>${p.design_no || '-'}</td>
      <td>${p.type || '-'}</td><td>${p.pieces || 0}</td>
      <td>₹${fmt(p.rate)}</td><td>₹${fmt(p.total)}</td><td>${p.date || '-'}</td>
    </tr>`).join('') || noData(8);

  // ── 9. Materials ──
  const matRows = (s.materials || []).map((m, i) => `
    <tr>
      <td>${i + 1}</td><td>${m.item_name || '-'}</td><td>${m.vendor || '-'}</td>
      <td>${m.quantity || '-'}</td><td>₹${fmt(m.amount)}</td>
      <td>${m.bill_no || '-'}</td><td>${m.date || '-'}</td>
    </tr>`).join('') || noData(7);

  // ── 10. Expenses ──
  const expRows = (s.expenses || []).map((e, i) => `
    <tr>
      <td>${i + 1}</td><td>${e.category || '-'}</td><td>${e.description || '-'}</td>
      <td>₹${fmt(e.amount)}</td><td>${e.date || '-'}</td>
    </tr>`).join('') || noData(5);

  // ── 11. Staff ──
  const staffRows = (s.staff || []).map((st, i) => `
    <tr>
      <td>${i + 1}</td><td>${st.name || '-'}</td><td>${st.role || '-'}</td>
      <td>₹${fmt(st.salary)}</td><td>${st.phone || '-'}</td>
    </tr>`).join('') || noData(5);

  // ── Summary Totals ──
  const totalRevenue = (s.lots || []).reduce((a, l) => a + (Number(l.total_amount) || 0), 0);
  const totalArtisan = (s.karigarWork || []).reduce((a, w) => a + (Number(w.amount) || 0), 0);
  const totalPress   = (s.pressEntries || []).reduce((a, p) => a + (Number(p.total) || 0), 0);
  const totalMat     = (s.materials || []).reduce((a, m) => a + (Number(m.amount) || 0), 0);
  const totalExp     = (s.expenses || []).reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const netProfit    = totalRevenue - totalArtisan - totalPress - totalMat - totalExp;

  const html = `<!DOCTYPE html>
<html lang="gu">
<head>
  <meta charset="UTF-8">
  <title>ગુરુકૃપા ક્રિએશન — સંપૂર્ણ ડેટા રિપોર્ટ</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans Gujarati','Inter',Arial,sans-serif; font-size: 11px; color: #000; background: #fff; }
    h1 { font-size: 20px; font-weight: 700; }
    h2 { font-size: 13px; font-weight: 700; margin: 18px 0 6px; border-bottom: 1.5px solid #000; padding-bottom: 4px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px; }
    .header-left p { font-size: 11px; color: #444; margin-top: 2px; }
    .header-right { text-align: right; font-size: 11px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin: 12px 0 18px; }
    .summary-box { border: 1px solid #aaa; padding: 8px 10px; border-radius: 4px; }
    .summary-box .label { font-size: 10px; color: #555; }
    .summary-box .value { font-size: 14px; font-weight: 700; margin-top: 2px; }
    .summary-box.profit .value { color: #1a7a40; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    td, th { border: 1px solid #000; padding: 4px 6px; font-size: 10px; }
    th { background: #ddd; font-weight: 700; }
    tr:nth-child(even) td { background: #f5f5f5; }
    .footer { margin-top: 20px; border-top: 1px solid #000; padding-top: 8px; display: flex; justify-content: space-between; font-size: 10px; color: #555; }
    @page { size: A4 portrait; margin: 12mm 10mm; }
    @media print {
      body { font-size: 10px; }
      h2 { page-break-before: auto; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${companyName}</h1>
      <p>${co.company_tagline || DEFAULT_COMPANY_TAGLINE}</p>
      <p>મોબાઇલ: ${co.company_phone || DEFAULT_COMPANY_PHONE}</p>
      <p>સરનામું: ${co.company_address || DEFAULT_COMPANY_ADDRESS}</p>
      <p>સંપૂર્ણ ડેટા બેકઅપ રિપોર્ટ</p>
    </div>
    <div class="header-right">
      <strong>રિપોર્ટ તારીખ:</strong> ${dateStr}<br>
      <strong>કુલ વ્યાપારીઓ:</strong> ${(s.merchants||[]).length}<br>
      <strong>કુલ ચલણ:</strong> ${(s.challans||[]).length}<br>
      <strong>કુલ કારીગર:</strong> ${(s.karigars||[]).length}
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-box"><div class="label">કુલ આવક (Revenue)</div><div class="value">₹${fmt(totalRevenue)}</div></div>
    <div class="summary-box"><div class="label">કારીગર ખર્ચ</div><div class="value">₹${fmt(totalArtisan)}</div></div>
    <div class="summary-box"><div class="label">પ્રેસ ખર્ચ</div><div class="value">₹${fmt(totalPress)}</div></div>
    <div class="summary-box"><div class="label">મટીરિયલ ખર્ચ</div><div class="value">₹${fmt(totalMat)}</div></div>
    <div class="summary-box"><div class="label">અન્ય ખર્ચ</div><div class="value">₹${fmt(totalExp)}</div></div>
    <div class="summary-box profit"><div class="label">ચોખ્ખો નફો (Net Profit)</div><div class="value">${netProfit >= 0 ? '+' : ''}₹${fmt(netProfit)}</div></div>
  </div>

  <h2>1. વ્યાપારી યાદી (Traders)</h2>
  <table><thead>${tableHead(['ક્રમ','નામ','ફોન','સરનામું'])}</thead><tbody>${tradersRows}</tbody></table>

  <h2>2. ઇનવર્ડ લોટ (Inward Lots)</h2>
  <table><thead>${tableHead(['ક્રમ','લોટ નં.','નામ','વ્યાપારી','પીસ','ભાવ','કુલ','તારીખ','સ્ટેટસ'])}</thead><tbody>${lotsRows}</tbody></table>

  <h2>3. ડિલિવરી ચલણ (Delivery Challans)</h2>
  <table><thead>${tableHead(['ક્રમ','ચલણ નં.','વ્યાપારી','પીસ','કુલ','તારીખ','સ્ટેટસ'])}</thead><tbody>${challansRows}</tbody></table>

  <h2>4. કારીગર કામ (Artisan Work)</h2>
  <table><thead>${tableHead(['ક્રમ','કારીગર','લોટ','પીસ','ભાવ','રકમ','તારીખ'])}</thead><tbody>${workRows}</tbody></table>

  <h2>5. કારીગર ઉચ્ચક / ઉપાડ (Advances)</h2>
  <table><thead>${tableHead(['ક્રમ','કારીગર','રકમ','નોંધ','તારીખ'])}</thead><tbody>${advRows}</tbody></table>

  <h2>6. કારીગર યાદી (Artisan List)</h2>
  <table><thead>${tableHead(['ક્રમ','નામ','ફોન','સરનામું'])}</thead><tbody>${karigarRows}</tbody></table>

  <h2>7. ડિઝાઇન કેટેલોગ (Design Catalog)</h2>
  <table><thead>${tableHead(['ક્રમ','ડિઝ. નં.','નામ','પ્રકાર','કુર્તી ભાવ','પેન્ટ ભાવ','કુલ પીસ'])}</thead><tbody>${designRows}</tbody></table>

  <h2>8. પ્રેસ હિસાબ (Press Accounts)</h2>
  <table><thead>${tableHead(['ક્રમ','વ્યક્તિ','ડિઝ. નં.','પ્રકાર','પીસ','ભાવ','કુલ','તારીખ'])}</thead><tbody>${pressRows}</tbody></table>

  <h2>9. મટીરિયલ ખર્ચ (Materials)</h2>
  <table><thead>${tableHead(['ક્રમ','વસ્તુ','વ્યાપારી','જથ્થો','રકમ','બિલ નં.','તારીખ'])}</thead><tbody>${matRows}</tbody></table>

  <h2>10. ખાતા ખર્ચ (Account Expenses)</h2>
  <table><thead>${tableHead(['ક્રમ','વિભાગ','વિગત','રકમ','તારીખ'])}</thead><tbody>${expRows}</tbody></table>

  <h2>11. ફિક્સ પગાર સ્ટાફ (Fixed Salary Staff)</h2>
  <table><thead>${tableHead(['ક્રમ','નામ','હોદ્દો','પગાર','ફોન'])}</thead><tbody>${staffRows}</tbody></table>

  <div class="footer">
    <span>ગુરુકૃપા ક્રિએશન — સ્વ-ઉત્પન્ન રિપોર્ટ</span>
    <span>By Om Parmar and Company</span>
    <span>તારીખ: ${dateStr}</span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================
function formatDate(dStr) {
  if (!dStr) return '-';
  const parts = dStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dStr;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getStatusBadgeClass(status) {
  if (status === 'વેપારીને જમા' || status === 'ચૂકવેલ' || status === 'હાજર') return 'badge-success';
  if (status === 'કામ ચાલુ છે' || status === 'બાકી') return 'badge-warning';
  if (status === 'તૈયાર છે') return 'badge-info';
  return 'badge-info';
}

function filterLots(query) {
  const q = query.toLowerCase();
  const filtered = state.lots.filter(l => {
    return (l.merchant_name || '').toLowerCase().includes(q) ||
           (l.design_no || '').toLowerCase().includes(q) ||
           (l.lot_no || '').toLowerCase().includes(q);
  });
  renderLotsTable(filtered);
}
