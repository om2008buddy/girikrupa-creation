// Gurukrupa Creation - Frontend Core Application Logic
// Passcode: 6390

const APP_PASSCODE = '6390';
let currentPin = '';
let authToken = localStorage.getItem('gk_auth_token') || '';
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
  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: currentPin }),
    });
    const data = await res.json();

    if (data.success && data.token) {
      authToken = data.token;
      localStorage.setItem('gk_auth_token', authToken);
      unlockApp();
      showToast('સફળ પ્રવેશ! સ્વાગત છે.', 'success');
    } else {
      handlePinError();
    }
  } catch (err) {
    if (currentPin === APP_PASSCODE) {
      authToken = 'local-valid-token';
      localStorage.setItem('gk_auth_token', authToken);
      unlockApp();
    } else {
      handlePinError();
    }
  }
}

function handlePinError() {
  const card = document.getElementById('lockCard');
  card.classList.add('shake-animation');
  showToast('ખોટો પાસવર્ડ! કૃપા કરીને 6390 દાખલ કરો.', 'error');
  setTimeout(() => {
    card.classList.remove('shake-animation');
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
  document.getElementById('appRoot').style.display = 'none';
  document.getElementById('lockScreen').style.display = 'flex';
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

// Check existing session
window.addEventListener('DOMContentLoaded', () => {
  // Set default dates on all date inputs
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(inp => {
    if (!inp.value) inp.value = today;
  });

  if (authToken) {
    unlockApp();
  } else {
    document.getElementById('lockScreen').style.display = 'flex';
  }
});

// ===================================================================
// API CLIENT WRAPPER
// ===================================================================
async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-passcode': APP_PASSCODE,
    ...(options.headers || {}),
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(endpoint, { ...options, headers });
  if (res.status === 401) {
    lockApp();
    throw new Error('સત્ર સમાપ્ત થઈ ગયું છે. ફરી પાસવર્ડ દાખલ કરો.');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'કાંઈક ભૂલ થઈ છે.');
  }
  return data;
}

// ===================================================================
// NAVIGATION & VIEWS
// ===================================================================
const viewTitles = {
  dashboard: { title: 'નફો-નુકસાન અને ડેશબોર્ડ', sub: 'સમગ્ર કારખાનાનો હિસાબ અને વાસ્તવિક ચોખ્ખો નફો' },
  lots: { title: 'વેપારી આવેલ માલ (Inward Lots)', sub: 'વેપારીઓ પાસેથી મળેલ કાપડ/ઓર્ડર અને ભાવ હિસાબ' },
  challans: { title: 'વેપારી માલ ચલણ (Delivery Challan)', sub: 'તૈયાર માલ જમા કરવા માટે ચલણ અને ઓટો પ્રિન્ટ' },
  karigars: { title: 'કારીગર કામ & ઉપાડ હિસાબ', sub: 'કુર્તી-પેન્ટ સિલાઈ પીસ, ઉપાડ અને પગાર રસીદ' },
  designs: { title: 'ડિઝાઇન કેટલોગ (Design Master)', sub: 'ડિઝાઇન મુજબ વેપારી ભાવ, સિલાઈ ભાવ અને પ્રેસ ભાવ' },
  press: { title: 'પ્રેસ હિસાબ (Ironing Work)', sub: 'પ્રેસ વાળાના પીસ અને બિલ હિસાબ' },
  materials: { title: 'મટીરીયલ્સ / કાચો માલ ખર્ચ', sub: 'દોરો, બટન, ઝિપ, ઇલાસ્ટિક, પેકિંગ બેગ વગેરે' },
  expenses: { title: 'કારખાના ખાતા ખર્ચ (Overheads)', sub: 'લાઈટ બિલ, કચરો, કારખાના ભાડું, પાણી બિલ, ચા-નાસ્તો' },
  staff: { title: 'ફિક્સ પગાર સ્ટાફ (Staff Register)', sub: 'કટિંગ, પેકિંગ, હેલ્પરની દૈનિક હાજરી અને કલાક હિસાબ' },
  settings: { title: 'સેટિંગ્સ & મોબાઇલ કનેક્ટ', sub: 'કંપની વિગત, ડેટા બેકઅપ અને એન્ડ્રોઇડ એપ લિંક' },
};

function switchTab(tabId) {
  currentTab = tabId;

  // Update sidebar active class
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(item => {
    return item.getAttribute('onclick')?.includes(`'${tabId}'`);
  });
  if (activeNav) activeNav.classList.add('active');

  // Toggle views
  document.querySelectorAll('.tab-view').forEach(view => {
    view.style.display = 'none';
  });
  const targetView = document.getElementById(`view-${tabId}`);
  if (targetView) targetView.style.display = 'block';

  // Update Header title
  if (viewTitles[tabId]) {
    document.getElementById('pageTitle').textContent = viewTitles[tabId].title;
    document.getElementById('pageSubtitle').textContent = viewTitles[tabId].sub;
  }

  // Close mobile sidebar if open
  document.getElementById('sidebar').classList.remove('open');

  // Load specific tab data
  if (tabId === 'dashboard') loadDashboard();
  else if (tabId === 'lots') loadLots();
  else if (tabId === 'challans') loadChallans();
  else if (tabId === 'karigars') loadKarigars();
  else if (tabId === 'designs') loadDesigns();
  else if (tabId === 'press') loadPress();
  else if (tabId === 'materials') loadMaterials();
  else if (tabId === 'expenses') loadExpenses();
  else if (tabId === 'staff') loadStaff();
  else if (tabId === 'settings') loadSettings();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
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
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.add('active');
    populateDropdowns();
    if (modalId === 'modal-add-challan') {
      initChallanModal();
    }
  }
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
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
  // Merchants
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

  // Designs
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

  // Karigars
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

  // Press Vendors
  const pVen = document.getElementById('pressVendorSelect');
  if (pVen) {
    pVen.innerHTML = '<option value="">-- પ્રેસ વાળા પસંદ કરો --</option>' +
      state.pressVendors.map(v => `<option value="${v.id}" data-rate="${v.default_rate}">${escapeHtml(v.name)} (ડિફોલ્ટ ₹${v.default_rate})</option>`).join('');
  }

  // Staff
  const attStaff = document.getElementById('attStaffSelect');
  if (attStaff) {
    attStaff.innerHTML = '<option value="">-- સ્ટાફ પસંદ કરો --</option>' +
      state.staff.map(s => `<option value="${s.id}">${escapeHtml(s.name)} (${escapeHtml(s.role)})</option>`).join('');
  }

  // Inward Lots for linking
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

    // Update Metric Cards
    document.getElementById('statRevenue').textContent = `₹${data.revenue.total.toLocaleString('en-IN')}`;
    document.getElementById('statPieces').textContent = `${data.revenue.pieces} પીસ • ${data.revenue.lotCount} લોટ`;

    document.getElementById('statStitching').textContent = `₹${data.expenses.stitching.toLocaleString('en-IN')}`;
    document.getElementById('statKurtiPantPcs').textContent = `કુર્તી: ${data.breakdown.kurtiPieces} • પેન્ટ: ${data.breakdown.pantPieces}`;

    document.getElementById('statPress').textContent = `₹${data.expenses.press.toLocaleString('en-IN')}`;
    document.getElementById('statPressPcs').textContent = `${data.breakdown.pressPieces} પીસ પ્રેસ થયા`;

    document.getElementById('statMaterials').textContent = `₹${data.expenses.materials.toLocaleString('en-IN')}`;
    document.getElementById('statOverheads').textContent = `₹${data.expenses.overheads.toLocaleString('en-IN')}`;
    document.getElementById('statStaffSalary').textContent = `સ્ટાફ પગાર: ₹${data.expenses.staffSalary.toLocaleString('en-IN')}`;

    const netProfitEl = document.getElementById('statNetProfit');
    netProfitEl.textContent = `₹${data.profit.netProfit.toLocaleString('en-IN')}`;
    netProfitEl.style.color = data.profit.isProfitable ? 'var(--emerald-600)' : 'var(--rose-600)';

    const marginEl = document.getElementById('statProfitMargin');
    marginEl.textContent = `નફો: ${data.profit.profitMargin}% (ચોખ્ખો)`;
    marginEl.style.color = data.profit.isProfitable ? 'var(--emerald-700)' : 'var(--rose-700)';

    // Load recent lots into Dashboard table
    const lots = await api('/api/lots');
    const tbody = document.querySelector('#dashboardLotsTable tbody');
    if (!lots || lots.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--slate-400);">હજુ સુધી કોઈ માલ નોંધાયેલ નથી. "+ નવો માલ ઉમેરો" પર ક્લિક કરો.</td></tr>`;
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
    renderKarigarWorkTable(work);
    renderKarigarUpadTable(upad);

    // If a karigar is already selected in ledger, reload it
    const selectedKarigarId = document.getElementById('ledgerKarigarSelect')?.value;
    if (selectedKarigarId) {
      loadKarigarLedger(selectedKarigarId);
    }
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
  tbody.innerHTML = karigars.map(k => `
    <tr>
      <td><strong>${escapeHtml(k.name)}</strong></td>
      <td>${escapeHtml(k.phone || '-')}</td>
      <td><span class="badge badge-info">${escapeHtml(k.speciality || 'સિલાઈ')}</span></td>
      <td>${escapeHtml(k.address || '-')}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="selectAndShowLedger(${k.id})">ખાતાવહી જુઓ</button>
      </td>
    </tr>
  `).join('');
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

    // Combine work and upad chronological items
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
  document.getElementById('ledgerKarigarSelect').value = karigarId;
  loadKarigarLedger(karigarId);
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
  const payload = {
    name: document.getElementById('karigarName').value,
    phone: document.getElementById('karigarPhone').value,
    speciality: document.getElementById('karigarSpeciality').value,
    address: document.getElementById('karigarAddress').value,
  };
  try {
    await api('/api/karigars', { method: 'POST', body: JSON.stringify(payload) });
    closeModal('modal-add-karigar');
    showToast('કારીગર સફળતાપૂર્વક ઉમેરાયા!', 'success');
    await fetchDropdownMasters();
    loadKarigars();
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
            <img src="/logo.png" class="print-logo" alt="Gurukrupa Logo">
            <div class="print-title">
              <h1>${escapeHtml(state.settings.company_name || 'GURUKRUPA CREATION')}</h1>
              <p>${escapeHtml(state.settings.company_tagline || 'Kurti - Pant Manufacturing & Jobwork')}</p>
              <p>મોબાઇલ: ${escapeHtml(state.settings.company_phone || '')}</p>
            </div>
          </div>
          <div class="print-doc-badge">
            <h2>કારીગર પગાર રસીદ</h2>
            <p>તારીખ: ${formatDate(new Date().toISOString().split('T')[0])}</p>
          </div>
        </div>

        <div style="margin-bottom: 16px; padding: 10px; background: #f9f9f9; border: 1px solid #ddd;">
          <p><strong>કારીગર નામ:</strong> ${escapeHtml(karigar.name)}</p>
          <p><strong>કામનો પ્રકાર:</strong> ${escapeHtml(karigar.speciality || 'સિલાઈ')}</p>
          <p><strong>મોબાઇલ:</strong> ${escapeHtml(karigar.phone || '-')}</p>
        </div>

        <h4 style="margin-top: 14px; margin-bottom: 6px;">સિલાઈ કામ વિગત:</h4>
        <table class="print-table">
          <thead>
            <tr>
              <th>તારીખ</th>
              <th>ડિઝાઇન નંબર</th>
              <th>કુર્તી પીસ × ભાવ</th>
              <th>પેન્ટ પીસ × ભાવ</th>
              <th>રકમ (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${data.workEntries.map(w => `
              <tr>
                <td>${formatDate(w.date)}</td>
                <td>${escapeHtml(w.design_no || '-')}</td>
                <td>${w.kurti_pieces} @ ₹${w.kurti_rate}</td>
                <td>${w.pant_pieces} @ ₹${w.pant_rate}</td>
                <td>₹${w.total_amount.toLocaleString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
          <table style="width: 320px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px; border: 1px solid #000;">કુલ સિલાઈ કામ (+):</td>
              <td style="padding: 6px; border: 1px solid #000; text-align: right; font-weight: bold;">₹${summary.totalEarned.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 6px; border: 1px solid #000; color: #c00;">કુલ ઉપાડ કપાત (-):</td>
              <td style="padding: 6px; border: 1px solid #000; text-align: right; font-weight: bold; color: #c00;">₹${summary.totalUpad.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background: #f0f0f0;">
              <td style="padding: 8px; border: 2px solid #000; font-size: 14px; font-weight: bold;">ચોખ્ખી ચૂકવવાપાત્ર રકમ:</td>
              <td style="padding: 8px; border: 2px solid #000; text-align: right; font-size: 15px; font-weight: bold;">₹${summary.netBalance.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

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
  div.style.cssText = 'display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr 1.2fr 40px; gap: 8px; align-items: center; background: #fff; padding: 6px; border: 1px solid var(--slate-200); border-radius: var(--radius-sm);';

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
  // Filter lot selector for this merchant
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
    // Automatic Print
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
            <img src="/logo.png" class="print-logo" alt="Gurukrupa Logo">
            <div class="print-title">
              <h1>${escapeHtml(state.settings.company_name || 'GURUKRUPA CREATION')}</h1>
              <p>${escapeHtml(state.settings.company_tagline || 'Kurti - Pant Manufacturing & Jobwork Specialist')}</p>
              <p>મોબાઇલ: ${escapeHtml(state.settings.company_phone || '')} • સરનામું: ${escapeHtml(state.settings.company_address || '')}</p>
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
// MODULE 10: SETTINGS & BACKUP
// ===================================================================
async function loadSettings() {
  try {
    const s = await api('/api/settings');
    state.settings = s;

    // Fill form
    const cn = document.getElementById('setCompanyName');
    if (cn) cn.value = s.company_name || 'GURUKRUPA CREATION';
    const ct = document.getElementById('setCompanyTagline');
    if (ct) ct.value = s.company_tagline || '';
    const cp = document.getElementById('setCompanyPhone');
    if (cp) cp.value = s.company_phone || '';
    const ca = document.getElementById('setCompanyAddress');
    if (ca) ca.value = s.company_address || '';
    const cpr = document.getElementById('setChallanPrefix');
    if (cpr) cpr.value = s.challan_prefix || 'GK-CH-';

    // Show network IP for Android connection
    const ips = s.serverIps || [];
    const mainIp = ips[0] || window.location.hostname;
    const port = s.port || 4500;
    const fullMobileUrl = `http://${mainIp}:${port}`;

    const ipText = document.getElementById('serverIpText');
    if (ipText) ipText.textContent = `Mobile: ${mainIp}:${port}`;

    const androidUrlDisplay = document.getElementById('androidUrlDisplay');
    if (androidUrlDisplay) {
      androidUrlDisplay.innerHTML = `<a href="${fullMobileUrl}" target="_blank" style="color:var(--sapphire-700);">${fullMobileUrl}</a>`;
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
  window.open('/api/backup/export', '_blank');
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
