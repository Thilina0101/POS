# Restaurant POS – Setup Guide

## 1. Start using the POS
Double-click **index.html**. It opens in Chrome or Edge, and you can start taking orders right away.
- Tip: in Chrome, use menu ⋮ → *Cast, save and share* → *Install page as app* (or create a desktop shortcut) so it opens like a normal program.
- Always open it **with the same browser on the same computer**. Your data is stored in that browser.

## 2. Connect to Google Sheets (about 5 minutes, one time only)
1. Go to https://sheets.google.com and create a new blank spreadsheet (for example, "Restaurant Sales").
2. Click **Extensions → Apps Script**.
3. Delete any code you see, then paste everything from **Code.gs**. Click 💾 **Save**.
4. Click **Deploy → New deployment**.
   - Click the ⚙️ gear next to "Select type" and choose **Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Click **Deploy**, then **Authorize access**, and choose your Google account.
   - If you see "Google hasn't verified this app", click **Advanced → Go to (project) (unsafe)**. This is your own script, so it's safe to continue.
5. Copy the **Web app URL** (it ends in `/exec`).
6. In the POS, open **⚙️ Settings**, paste the URL, click **Save settings**, then click **Test connection**.

From then on, every completed sale shows up in the Sheet within a few seconds:
- **Sales** tab: one row per bill
- **Items** tab: one row per item sold (useful for pivot tables and charts)

If the internet goes down, sales are kept on the computer and marked **Pending**. They upload automatically when the internet comes back (or click **Sync to Google Sheet** on the Sales tab).

> If you edit Code.gs later, use **Deploy → Manage deployments → ✏️ Edit → Version: New version** so the URL stays the same.

## Updating Code.gs (needed for Edit / Void)
If you set up Google Sheets before Edit/Void existed, do this once:
1. Open your Sheet → **Extensions → Apps Script**.
2. Select all the old code, delete it, and paste the new **Code.gs**. Click 💾 **Save**.
3. Click **Deploy → Manage deployments**, then click ✏️ **Edit** on your deployment.
4. Under **Version**, choose **New version**, then click **Deploy**.

Your Web App URL stays the same. In the POS, **Settings → Test connection** should now show "✅ Connected".
Until you do this, edited or voided orders stay **Pending**. New sales still sync normally.

## Edit / Void orders
- In **📊 Sales**, click **✏️ Edit** to open a bill back in the cart, change it, and click **Save changes**. It keeps the same bill number.
- Click **Void** to cancel a bill. You must enter a reason. A voided bill stays in the list, marked VOID, but no longer counts in totals.
- In Google Sheets, voided bills are crossed out with Status = **VOID** on the *Sales* tab and removed from the *Items* tab.
  When you add up the *Total* column on the Sales tab, filter Status to leave out VOID.
- Set a **Manager PIN** in Settings so only you can edit or void orders, change settings or restore a backup.

## Customer QR ordering
Customers scan a QR code on their table, see your menu on their phone and send their order. It shows up in the POS under **📱 QR Orders**, with a beep.

**Setup (Google Sheets must be connected first, with Code.gs version 3):**
1. Update Code.gs as described above (Manage deployments → Edit → New version).
2. In the POS, go to **⚙️ Settings → Test connection**. It should say "✅ Connected".
3. Open **📱 QR Orders**, click **⬆ Update online menu**, then enter your number of tables and click **Generate QR codes**.
4. Click **Test link** on one code to check the customer page works, then click **🖨 Print QR codes** and put them on your tables.

**Daily use:**
- New orders appear with a 🔔 beep (click anywhere on the POS once after opening it so sound is allowed).
- **✔ Accept** prints a kitchen slip. **Reject** tells the customer it wasn't accepted.
- When the customer pays, click **💵 Add to bill**. You can add several QR orders from the same table, then take payment as normal.
- Mark items **Sold out** in the 🍽️ Menu tab. Customers can't order sold-out items.
- Prices come from your POS menu, so customers can't change them.

**POS device key:** each POS has a secret key (⚙️ Settings) that stops strangers from reading your sales through the public QR link.
The first POS that connects sets it. On other devices, copy the same key into Settings (or use Backup → Restore).
If you lose it, open Apps Script, choose **resetPosKey** in the function list, click ▶ **Run**, then click **Test connection** in the POS again.

## 3. Excel
Open the **📊 Sales** tab, choose a date range, and click **Export Excel**. The .xlsx file has *Sales* and *Items* sheets.
Google Sheets can also export: *File → Download → Microsoft Excel*.

## 4. Daily tips
- Edit dishes and prices in the **🍽️ Menu** tab.
- Set your shop name, currency, service charge and tax in **⚙️ Settings**.
- Receipts are sized for 80mm thermal printers. Choose your receipt printer in the print dialog, and turn off "Headers and footers".
- Click **Backup all data** once a week. Never clear this browser's history or site data.
