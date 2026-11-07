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

## 3. Excel
Open the **📊 Sales** tab, choose a date range, and click **Export Excel**. The .xlsx file has *Sales* and *Items* sheets.
Google Sheets can also export: *File → Download → Microsoft Excel*.

## 4. Daily tips
- Edit dishes and prices in the **🍽️ Menu** tab.
- Set your shop name, currency, service charge and tax in **⚙️ Settings**.
- Receipts are sized for 80mm thermal printers. Choose your receipt printer in the print dialog, and turn off "Headers and footers".
- Click **Backup all data** once a week. Never clear this browser's history or site data.
