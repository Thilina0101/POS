/**
 * Restaurant POS -> Google Sheets connector
 * Paste this into Extensions > Apps Script of your Google Sheet, then Deploy as a Web App.
 * It creates two tabs automatically: "Sales" (one row per bill) and "Items" (one row per item sold).
 */

const SALES_HEADERS = ['Bill No', 'Date & Time', 'Date', 'Type', 'Table/Ref', 'Customer', 'Items',
  'Subtotal', 'Discount %', 'Discount', 'Service', 'Tax', 'Total', 'Payment', 'Paid', 'Change', 'Note'];
const ITEM_HEADERS = ['Bill No', 'Date', 'Item', 'Category', 'Price', 'Qty', 'Amount'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'ping') return json({ ok: true, message: 'Connected' });
    if (body.action !== 'order') return json({ ok: false, error: 'Unknown action' });

    const o = body.order;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sales = getSheet(ss, 'Sales', SALES_HEADERS);
    const items = getSheet(ss, 'Items', ITEM_HEADERS);

    // Skip duplicates (same bill sent twice)
    const last = sales.getLastRow();
    if (last > 1) {
      const found = sales.getRange(2, 1, last - 1, 1).createTextFinder(o.id).matchEntireCell(true).findNext();
      if (found) return json({ ok: true, duplicate: true });
    }

    const day = String(o.date).slice(0, 10);
    sales.appendRow([
      o.id, o.localDate || o.date, day, o.type, o.table, o.customer,
      o.items.map(function (i) { return i.qty + 'x ' + i.name; }).join(', '),
      o.subtotal, o.discPct, o.discount, o.service, o.tax, o.total, o.payment, o.paid, o.change, o.note
    ]);

    const rows = o.items.map(function (i) {
      return [o.id, day, i.name, i.category, i.price, i.qty, i.amount];
    });
    if (rows.length) items.getRange(items.getLastRow() + 1, 1, rows.length, ITEM_HEADERS.length).setValues(rows);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json({ ok: true, message: 'POS endpoint is running' });
}

function getSheet(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
