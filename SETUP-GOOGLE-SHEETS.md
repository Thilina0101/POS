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

## 3. Excel
Open the **📊 Sales** tab, choose a date range, and click **Export Excel**. The .xlsx file has *Sales* and *Items* sheets.
Google Sheets can also export: *File → Download → Microsoft Excel*.

## 4. Daily tips
- Edit dishes and prices in the **🍽️ Menu** tab.
- Set your shop name, currency, service charge and tax in **⚙️ Settings**.
- Receipts are sized for 80mm thermal printers. Choose your receipt printer in the print dialog, and turn off "Headers and footers".
- Click **Backup all data** once a week. Never clear this browser's history or site data.
