/**
 * Karena Curry Rice POS -> Google Sheets connector  (version 3)
 * Paste this into Extensions > Apps Script of your Google Sheet, then Deploy as a Web App.
 *
 * Tabs created automatically:
 *   "Sales"     - one row per bill (edited bills updated in place, voided bills marked VOID)
 *   "Items"     - one row per item sold (voided bills removed, so totals stay correct)
 *   "Menu"      - the menu customers see when they scan a table QR code (updated by the POS)
 *   "QR Orders" - orders customers send from their phones
 *
 * Security: the POS sends a secret device key. The first POS that connects sets the key.
 * If you ever need to change it, run resetPosKey() once from the Apps Script editor.
 */

const VERSION = 3;
const SALES_HEADERS = ['Bill No', 'Date & Time', 'Date', 'Type', 'Table/Ref', 'Customer', 'Items',
  'Subtotal', 'Discount %', 'Discount', 'Service', 'Tax', 'Total', 'Payment', 'Paid', 'Change', 'Note',
  'Status', 'Void Reason', 'Edited / Voided At'];
const ITEM_HEADERS = ['Bill No', 'Date', 'Item', 'Category', 'Price', 'Qty', 'Amount'];
const MENU_HEADERS = ['Name', 'Price', 'Category', 'Available'];
const QR_HEADERS = ['QR Order', 'Time', 'Table', 'Customer', 'Items', 'Subtotal', 'Note', 'Status', 'Bill No', 'Items JSON'];

/* ---------- public (customer) GET requests ---------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'menu') return json(Object.assign({ ok: true }, getMenu()));
    if (p.action === 'status') return json({ ok: true, status: getQrStatus(String(p.id || '')) });
    return json({ ok: true, version: VERSION, message: 'POS endpoint is running' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ---------- POST requests ---------- */
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'Bad request' }); }
  const lock = LockService.getScriptLock();
  try {
    // Customers (no key needed)
    if (body.action === 'placeOrder') { lock.waitLock(15000); return json(placeOrder(body)); }

    // POS only (needs the device key)
    if (!checkKey(body.key)) return json({ ok: false, error: 'BAD_KEY' });
    switch (body.action) {
      case 'ping': return json({ ok: true, version: VERSION, message: 'Connected' });
      case 'getQrOrders': return json({ ok: true, version: VERSION, orders: getQrOrders() });
      case 'order': lock.waitLock(15000); saveSale(body.order); return json({ ok: true, version: VERSION });
      case 'saveMenu': lock.waitLock(15000); saveMenu(body); return json({ ok: true, version: VERSION });
      case 'setQrStatus': lock.waitLock(15000); setQrStatus(body); return json({ ok: true, version: VERSION });
    }
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

/* ---------- sales ---------- */
function saveSale(o) {
  const sales = getSheet('Sales', SALES_HEADERS);
  const items = getSheet('Items', ITEM_HEADERS);
  const isVoid = o.status === 'void';
  const status = isVoid ? 'VOID' : (o.editedAt ? 'EDITED' : 'OK');
  const day = String(o.date).slice(0, 10);
  const row = [
    o.id, o.localDate || o.date, day, o.type, o.table, o.customer,
    o.items.map(function (i) { return i.qty + 'x ' + i.name; }).join(', '),
    o.subtotal, o.discPct, o.discount, o.service, o.tax, o.total, o.payment, o.paid, o.change, o.note,
    status, o.voidReason || '', isVoid ? (o.voidedLocal || '') : (o.editedLocal || '')
  ];
  const existing = findRow(sales, o.id);
  if (existing) sales.getRange(existing, 1, 1, row.length).setValues([row]);
  else sales.appendRow(row);
  if (isVoid) sales.getRange(existing || sales.getLastRow(), 1, 1, row.length).setFontColor('#999999').setFontLine('line-through');

  deleteRowsWithId(items, o.id);
  if (!isVoid) {
    const rows = o.items.map(function (i) { return [o.id, day, i.name, i.category, i.price, i.qty, i.amount]; });
    if (rows.length) items.getRange(items.getLastRow() + 1, 1, rows.length, ITEM_HEADERS.length).setValues(rows);
  }
}

/* ---------- menu ---------- */
function saveMenu(body) {
  const sh = getSheet('Menu', MENU_HEADERS);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, MENU_HEADERS.length).clearContent();
  const rows = (body.items || []).map(function (i) {
    return [safe(i.name, 100), Number(i.price) || 0, safe(i.category || 'Other', 50), i.available !== false];
  });
  if (rows.length) sh.getRange(2, 1, rows.length, MENU_HEADERS.length).setValues(rows);
  const s = body.shop || {};
  PropertiesService.getScriptProperties().setProperty('SHOP', JSON.stringify({
    name: String(s.name || ''), currency: String(s.currency || ''),
    servicePct: Number(s.servicePct) || 0, taxPct: Number(s.taxPct) || 0
  }));
  CacheService.getScriptCache().remove('menu');
}

function getMenu() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('menu');
  if (cached) return JSON.parse(cached);
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Menu');
  const items = [];
  if (sh && sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, MENU_HEADERS.length).getValues().forEach(function (r) {
      if (r[0] === '') return;
      items.push({ name: String(r[0]), price: Number(r[1]) || 0, category: String(r[2] || 'Other'),
        available: r[3] !== false && String(r[3]).toUpperCase() !== 'FALSE' });
    });
  }
  const out = { shop: JSON.parse(PropertiesService.getScriptProperties().getProperty('SHOP') || '{}'), items: items };
  try { cache.put('menu', JSON.stringify(out), 300); } catch (e) {}
  return out;
}

/* ---------- QR orders ---------- */
function placeOrder(body) {
  // Prices always come from the Menu tab, never from the customer's phone
  const byName = {};
  getMenu().items.forEach(function (i) { if (i.available) byName[i.name] = i; });
  const lines = [];
  (Array.isArray(body.items) ? body.items : []).slice(0, 40).forEach(function (it) {
    const m = byName[String(it.name)];
    const qty = Math.floor(Number(it.qty));
    if (m && qty >= 1 && qty <= 50) {
      lines.push({ name: m.name, category: m.category, price: m.price, qty: qty, amount: Math.round(m.price * qty * 100) / 100 });
    }
  });
  if (!lines.length) return { ok: false, error: 'No available items in the order' };
  const subtotal = lines.reduce(function (s, l) { return s + l.amount; }, 0);
  const sh = getSheet('QR Orders', QR_HEADERS);
  const id = 'QR-' + ('0000' + sh.getLastRow()).slice(-5);
  sh.appendRow([id, new Date(), safe(body.table, 20), safe(body.customer, 60),
    lines.map(function (l) { return l.qty + 'x ' + l.name; }).join(', '),
    subtotal, safe(body.note, 200), 'NEW', '', JSON.stringify(lines)]);
  return { ok: true, id: id, subtotal: subtotal };
}

function getQrOrders() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QR Orders');
  if (!sh || sh.getLastRow() < 2) return [];
  const last = sh.getLastRow();
  const start = Math.max(2, last - 199);
  return sh.getRange(start, 1, last - start + 1, QR_HEADERS.length).getValues()
    .filter(function (r) { return r[7] === 'NEW' || r[7] === 'ACCEPTED'; })
    .map(function (r) {
      return { id: String(r[0]), time: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
        table: String(r[2]), customer: String(r[3]), subtotal: Number(r[5]) || 0, note: String(r[6]),
        status: r[7], items: parseJson(r[9]) };
    });
}

function setQrStatus(body) {
  const allowed = ['ACCEPTED', 'REJECTED', 'PAID'];
  if (allowed.indexOf(body.status) < 0) throw new Error('Bad status');
  const sh = getSheet('QR Orders', QR_HEADERS);
  const row = findRow(sh, String(body.id));
  if (!row) throw new Error('QR order not found');
  sh.getRange(row, 8).setValue(body.status);
  if (body.bill) sh.getRange(row, 9).setValue(String(body.bill));
}

function getQrStatus(id) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('QR Orders');
  if (!sh || !id) return 'UNKNOWN';
  const row = findRow(sh, id);
  return row ? String(sh.getRange(row, 8).getValue()) : 'UNKNOWN';
}

/* ---------- helpers ---------- */
function checkKey(key) {
  if (!key) return false;
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty('POS_KEY');
  if (!saved) { props.setProperty('POS_KEY', String(key)); return true; }   // first POS to connect sets the key
  return saved === String(key);
}

/** Run this once from the editor if you need to connect with a new device key. */
function resetPosKey() {
  PropertiesService.getScriptProperties().deleteProperty('POS_KEY');
}

function getSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.setFrozenRows(1);
  }
  const head = sh.getRange(1, 1, 1, headers.length);
  if (head.getValues()[0].join('|') !== headers.join('|')) {
    head.setValues([headers]).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
  }
  return sh;
}

function findRow(sh, id) {
  if (sh.getLastRow() < 2) return 0;
  const cell = sh.getRange(2, 1, sh.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
  return cell ? cell.getRow() : 0;
}

function deleteRowsWithId(sh, id) {
  const last = sh.getLastRow();
  if (last < 2) return;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === id) sh.deleteRow(i + 2);
  }
}

// Text typed by customers: limit length and stop it being treated as a formula
function safe(v, max) {
  let s = String(v == null ? '' : v).slice(0, max || 100);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function parseJson(s) {
  try { return JSON.parse(s); } catch (e) { return []; }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
