# Gurukrupa Creation — UI/UX Audit & Design System Plan

**Date:** 2026-11-24  
**Project:** ગુરુકૃપા ક્રિએશન | Gurukrupa Creation  
**Scope:** Complete Visual Upgrade, Motion System, Dark Luxury Fintech & Light Theme System  
**Safety Commitment:** Zero breaking changes to JavaScript IDs, classes, data attributes, Supabase APIs, LocalStorage/session logic, print templates, and database interactions.

---

## 1. Codebase Architecture & Structural Audit

### 1.1 Screen Switching & App Lifecycle
- **Lock Screen Gate:**
  - Element: `#lockScreen` (`.lock-screen-wrapper`)
  - Card: `#lockCard` (`.lock-card`)
  - Input State: `currentPin` string (length 4), passcode `6390` in `app.js`
  - PIN Dots: `.pin-dots` > `.pin-dot` with `.filled` class toggled in `updatePinDots()`
  - Entry Trigger: `enterPin(digit)`, `deletePin()`, `clearPin()`, `verifyPasscode()`
  - Auth Storage: `localStorage.getItem('gk_auth_token')` with value `'gk_authenticated_session'`
  - Keyboard listener: window `keydown` handles `'0'-'9'`, `'Backspace'`, `'Escape'`, `'c'`, `'C'`
  - Transition: `unlockApp()` sets `#lockScreen.style.display = 'none'` and `#appRoot.style.display = 'flex'`, then runs `initApp()`

- **Tab Views Navigation:**
  - Container: `#appRoot` (`.app-container`)
  - Navigation Menu: `#sidebar .nav-menu` with `.nav-item` elements
  - Active Class: `.nav-item.active`
  - Tab Switch Function: `switchTab(tabId)`
  - View mapping:
    1. `dashboard` -> `#view-dashboard`
    2. `lots` -> `#view-lots`
    3. `challans` -> `#view-challans`
    4. `karigars` -> `#view-karigars` (with subtabs: `karigar-sub-ledger`, `karigar-sub-work`, `karigar-sub-upad`, `karigar-sub-list`)
    5. `designs` -> `#view-designs`
    6. `press` -> `#view-press`
    7. `materials` -> `#view-materials`
    8. `expenses` -> `#view-expenses`
    9. `staff` -> `#view-staff`
    10. `settings` -> `#view-settings`
  - Titles: `#pageTitle` and `#pageSubtitle` dynamically set by `switchTab()`
  - Mobile Sidebar: `toggleSidebar()`, `closeSidebar()` toggles `#sidebar.open` and `#sidebarBackdrop.active`

### 1.2 Modals & Form Dialogs
Modals are activated via `openModal(modalId)` by adding `.active` class to `.modal-overlay`, and closed via `closeModal(modalId)` by removing `.active`.
**Critical Modal IDs & Forms:**
1. `#modal-add-lot` (`submitInwardLot`)
2. `#modal-add-merchant` (`submitMerchant`)
3. `#modal-add-design` (`submitDesign`)
4. `#modal-add-karigar-work` (`submitKarigarWork`)
5. `#modal-add-upad` (`submitKarigarUpad`)
6. `#modal-add-karigar` (`submitKarigar`)
7. `#modal-add-press-entry` (`submitPressEntry`)
8. `#modal-add-press-vendor` (`submitPressVendor`)
9. `#modal-add-material` (`submitMaterial`)
10. `#modal-add-expense` (`submitExpense`)
11. `#modal-add-staff` (`submitStaff`)
12. `#modal-add-staff-attendance` (`submitStaffAttendance`)
13. `#modal-add-challan` (`submitDeliveryChallan`, dynamic `#challanItemsContainer`, `.challan-item-row`)

### 1.3 Data Storage & State Architecture
- Primary Backend: Supabase Cloud Database (`https://vlzcckwtufnqfqdwblgk.supabase.co`) via `supabaseFetch()` and unified `api()` router.
- Local Storage:
  - `gk_auth_token`: session indicator
  - Theme preference (to be stored in `gk_theme`)
  - Sidebar state (to be stored in `gk_sidebar_collapsed`)
- Dynamic Table Rendering: Pure JavaScript template strings into table `<tbody>` elements (`#dashboardLotsTable`, `#lotsTable`, `#challansTable`, `#karigarsListTable`, `#karigarWorkTable`, `#karigarUpadTable`, `#karigarLedgerTable`, `#designsTable`, `#pressTable`, `#materialsTable`, `#expensesTable`, `#staffAttendanceTable`).

### 1.4 Printing Subsystem
- Container: `#printableArea` (hidden on screen, displayed in `@media print`).
- Functions: `printKarigarSalarySlip()` and `printChallanById(challanId)`.
- Uses `window.print()` with styled table, logo, and signature lines.

---

## 2. Screenshot Visual Audit & Diagnosed Problems

Screenshots were captured at 390px (mobile), 768px (tablet), and 1440px (desktop) for:
1. Lock Screen (`lock_390.png`, `lock_768.png`, `lock_1440.png`)
2. Dashboard (`dashboard_390.png`, `dashboard_768.png`, `dashboard_1440.png`)
3. Lots Table (`lots_table_390.png`, `lots_table_768.png`, `lots_table_1440.png`)
4. Modal (`modal_lot_390.png`, `modal_lot_768.png`, `modal_lot_390.png`)

### Concrete Visual Problems Identified:

1. **Lock Screen First Impression:**
   - Visual tone is generic slate rather than a high-security luxury banking vault.
   - Logo frame is a basic rounded rectangle; lacks the fine jewelry-grade champagne gold ring and entrance motion.
   - Passcode dots are standard flat blue dots with no spring scale or gold glow.
   - Keypad buttons are plain translucent circles; action buttons "C" and "⌫" are raw plain text instead of elegant icons.
   - Missing vibration feedback on error.

2. **App Shell & Theme Architecture:**
   - No light mode option: in garment workshop environments, daytime sunlight washes out dark interfaces. Need a luxury warm ivory light mode (`[data-theme="light"]`) alongside the dark luxury theme.
   - Desktop sidebar is rigid (280px); lacks an icon-only 76px compact mode with tooltips for desktop power users.
   - Mobile navigation relies entirely on opening the left drawer. Mobile users lack a quick-access bottom tab bar for the top 5 primary screens (Dashboard, Lots, Karigars, Expenses, More).
   - Sidebar active item uses a generic flat blue block instead of a smooth sliding pill indicator with champagne gold edge accent.
   - Screen switching is instant and harsh; lacks subtle opacity/translate staggering.

3. **Typography & Number Clarity:**
   - Gujarati characters occasionally clip or feel dense due to default system sans-serif. Needs Google Font `Noto Sans Gujarati` (weights 400, 500, 600, 700) with line-height 1.6.
   - Numbers and financial values lack `font-variant-numeric: tabular-nums` (`Inter`), causing misalignments in columns and jitter in live updates.
   - Some currencies and piece numbers lack consistent Indian numeral grouping formatting (`₹1,25,000`).

4. **Dashboard Hierarchy:**
   - Net Profit (ચોખ્ખો નફો) is placed as an equal 6th card in a uniform grid. It must be a **Hero Card** (larger display number 36–48px, prominent margin badge, luxury gradient surface).
   - Period filter buttons (All, Month, Week, Today) are plain outline buttons instead of a polished segmented control with a sliding pill indicator.
   - KPI numbers lack count-up motion on load or filter switch.

5. **Tables, Modals & Micro-Interactions:**
   - Table rows and headers lack refined borders, hover elevation, and status badge styling.
   - Modals open abruptly; input focus rings use default outline.
   - Icons across the app are disparate inline SVGs; need unified line-icon styling (stroke 1.75px, Lucide standard).

---

## 3. Implementation Plan & Safety Protocol

1. **Tokens & Theme Foundation:**
   - Inject `:root` tokens for `--bg`, `--bg-elev`, `--surface`, `--surface-2`, `--border`, `--border-strong`, `--accent` (champagne gold `#d4af37`), `--accent-soft`, `--text`, `--text-muted`, `--text-faint`, plus light theme overrides in `[data-theme="light"]`.
   - Add Google Fonts for `Noto Sans Gujarati` and `Inter`.
   - Motion tokens (`--ease-out`, `--dur-fast`, `--dur-base`, `--dur-slow`) and `@media (prefers-reduced-motion)`.

2. **Upgrades to Lock Screen:**
   - Deep luxury background, gold ring around logo, spring dots, Lucide icons on numpad, vibration on error, keyboard listener preserved.

3. **App Shell & Navigation Upgrades:**
   - Sliding pill indicator for desktop sidebar.
   - Collapsible 76px desktop mode.
   - Mobile bottom navigation bar for quick access + drawer with smooth backdrop blur.
   - Theme switch toggle in sidebar footer.

4. **Dashboard & Component Upgrades:**
   - Hero Net Profit card.
   - Segmented filter control with animated pill.
   - Tabular numbers with count-up animation.
   - Table styling, refined badges, unified input styles, smooth modals.
   - Keep all element IDs, onclick attributes, form submit handlers, and print layouts 100% intact.
