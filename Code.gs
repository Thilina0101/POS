/**
 * Karena Curry Rice POS -> Google Sheets connector  (version 2)
 * Paste this into Extensions > Apps Script of your Google Sheet, then Deploy as a Web App.
 * It creates two tabs automatically:
 *   "Sales" - one row per bill (edited bills are updated in place, voided bills are marked VOID)
 *   "Items" - one row per item sold (voided bills are removed from here, so totals stay correct)
 */

const VERSION = 2;
const SALES_HEADERS = ['Bill No', 'Date & Time', 'Date', 'Type', 'Table/Ref', 'Customer', 'Items',
  'Subtotal', 'Discount %', 'Discount', 'Service', 'Tax', 'Total', 'Payment', 'Paid', 'Change', 'Note',
  'Status', 'Void Reason', 'Edited / Voided At'];
const ITEM_HEADERS = ['Bill No', 'Date', 'Item', 'Category', 'Price', 'Qty', 'Amount'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'ping') return json({ ok: true, version: VERSION, message: 'Connected' });
    if (body.action !== 'order') return json({ ok: false, error: 'Unknown action' });

    const o = body.order;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sales = getSheet(ss, 'Sales', SALES_HEADERS);
    const items = getSheet(ss, 'Items', ITEM_HEADERS);

    const isVoid = o.status === 'void';
    const status = isVoid ? 'VOID' : (o.editedAt ? 'EDITED' : 'OK');
    const day = String(o.date).slice(0, 10);
    const row = [
      o.id, o.localDate || o.date, day, o.type, o.table, o.customer,
      o.items.map(function (i) { return i.qty + 'x ' + i.name; }).join(', '),
      o.subtotal, o.discPct, o.discount, o.service, o.tax, o.total, o.payment, o.paid, o.change, o.note,
      status, o.voidReason || '', isVoid ? (o.voidedLocal || '') : (o.editedLocal || '')
    ];

    // Insert new bill, or update the existing row for this bill number
    const existing = findRow(sales, o.id);
    if (existing) sales.getRange(existing, 1, 1, row.length).setValues([row]);
    else sales.appendRow(row);
    if (isVoid) sales.getRange(existing || sales.getLastRow(), 1, 1, row.length).setFontColor('#999999').setFontLine('line-through');

    // Replace this bill's item rows (none if voided)
    deleteRowsWithId(items, o.id);
    if (!isVoid) {
      const rows = o.items.map(function (i) {
        return [o.id, day, i.name, i.category, i.price, i.qty, i.amount];
      });
      if (rows.length) items.getRange(items.getLastRow() + 1, 1, rows.length, ITEM_HEADERS.length).setValues(rows);
    }

    return json({ ok: true, version: VERSION });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json({ ok: true, version: VERSION, message: 'POS endpoint is running' });
}

function getSheet(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.setFrozenRows(1);
  }
  // Keep the header row up to date (adds new columns to sheets made by version 1)
  sh.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
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

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
