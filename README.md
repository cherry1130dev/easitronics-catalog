# Project Catalog — Engineering Final-Year & Mini Projects

A production-ready full-stack web application built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**. It connects seamlessly to a **Google Sheet** as a dynamic data backend, allowing real-time searching, multi-criteria filtering, URL state synchronization, and detailed project previews.

---

## 🚀 Features

- **Automatic Excel Sheet Sync**: Whenever a project is added (via single form or batch CSV upload at `/upload`), it automatically updates **`project_catalog_data.xlsx`** (Microsoft Excel) and **`project_catalog_data.csv`** in real-time!
- **Live Google Sheet Auto-Update**: Supports direct Google Apps Script Webhook integration so every uploaded project is automatically pushed and appended into your online Google Sheet.
- **Easi — AI Project Advisor (Powered by Gemini AI)**: Interactive, grounded chatbot providing project recommendations and instant developer support.
- **Developer & Support Contacts**: Directly contact Charan (`+91 7989604815`) or Mouli (`+91 7731943179`) via WhatsApp or Call.
- **Instant Search**: Real-time Amazon-style search bar querying project titles, descriptions, branch names, and tags.
- **Multi-Criteria Filter Panel**:
  - **Branch**: Multi-select across `ECE`, `CSE`, `EEE`, `Mechanical`, `Medical`, `Civil`.
  - **Domain**: Multi-select across `IoT`, `Embedded`, `Robotics`, `Machine Learning`, `Simulation`, `Large AI`.
  - **Type**: `Product` vs `Prototype` filter.
  - **Price Range**: Multi-bracket filter (all costs are estimations only).
- **Cost Estimation Notice**: Prominently informs students that all pricing is an estimation and not fixed.
- **Project Detail View (`/projects/[id]`)**: Full specifications, badges, developer WhatsApp actions, and rich clipboard specification copy.

---

## 🛠️ Step-by-Step Setup Guide

Follow these numbered steps to connect your own Google Sheet:

### Part 1: Prepare the Google Sheet

1. Open [Google Sheets](https://sheets.new) and create a new spreadsheet named **`Project Catalog Data`**.
2. Click **File > Import > Upload** and select the provided dataset file:
   ```
   project_catalog_data.csv
   ```
3. Set the import location to **Replace spreadsheet** and click **Import data**.
4. Confirm your header row in Row 1 matches:
   ```
   Title | Domain | Branch | Type | Price | Description | ImageURL | DemoVideoURL | Tags | Featured
   ```
5. Copy your **Spreadsheet ID** from the browser URL:
   `https://docs.google.com/spreadsheets/d/`**`1ABC123xyz_YOUR_SHEET_ID_HERE`**`/edit`

---

### Part 2: Create Google Cloud Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. In the left navigation menu, go to **APIs & Services > Library**.
4. Search for **Google Sheets API** and click **Enable**.
5. Go to **APIs & Services > Credentials** and click **Create Credentials > Service Account**.
6. Enter a name (e.g. `project-catalog-reader`) and click **Create and Continue**, then click **Done**.
7. Click on the newly created Service Account email (e.g. `project-catalog-reader@your-project.iam.gserviceaccount.com`).
8. Navigate to the **Keys** tab, click **Add Key > Create new key**, select **JSON**, and click **Create**.
9. Save the downloaded `.json` key file securely on your computer.

---

### Part 3: Share Google Sheet with Service Account

1. Open your Google Sheet (**Project Catalog Data**).
2. Click the top-right **Share** button.
3. Paste your Service Account Email (found in the JSON key as `client_email`):
   ```
   project-catalog-reader@your-project-id.iam.gserviceaccount.com
   ```
4. Set permission role to **Viewer** (uncheck "Notify people") and click **Share**.

---

### Part 4: Configure Environment Variables

1. In the project root, duplicate `.env.example` to create `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.json` key file downloaded in Part 2 and populate `.env.local`:

```env
GOOGLE_SHEET_ID=your_sheet_id_from_part_1
GOOGLE_CLIENT_EMAIL=your_service_account_client_email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_LONG_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

> ⚠️ **Important Note for `GOOGLE_PRIVATE_KEY`**: Keep quotes around the private key and ensure newline characters `\n` are preserved.

---

## 💻 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Launch dev server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploy to Vercel

1. Push code repository to GitHub / GitLab.
2. Import project into [Vercel](https://vercel.com).
3. In Project Settings > **Environment Variables**, add:
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (Make sure literal linebreaks or `\n` formatting is maintained)
4. Click **Deploy**.

---

## 📋 Checklist of Manual Steps Required

Here is the quick checklist of actions to perform manually:

1. [ ] Import `project_catalog_data.csv` into a Google Sheet named **Project Catalog Data**.
2. [ ] Create a Service Account in GCP Console & enable Google Sheets API.
3. [ ] Download the JSON Service Account Key.
4. [ ] Share the Google Sheet with the `client_email` (Viewer access).
5. [ ] Copy `GOOGLE_SHEET_ID`, `GOOGLE_CLIENT_EMAIL`, and `GOOGLE_PRIVATE_KEY` into `.env.local`.
6. [ ] Run `npm run dev` to test your live sheet data!
