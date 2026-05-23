# Jio CRM — Sales Funnel Automation Platform

> Enterprise-grade internal CRM for Jio's Management Consulting team.  
> Built with React + Vite + Tailwind CSS + Supabase · Deployed on Vercel · Free tier

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                     │
│   Tailwind CSS · Recharts · react-select · react-hot-toast     │
│                   Deployed on: Vercel (free)                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS + JWT
┌──────────────────────────────▼──────────────────────────────────┐
│               BACKEND + DATABASE (Supabase)                     │
│   PostgreSQL · REST API · Realtime · Storage · RLS Security    │
│                   Free tier: 500MB DB + 1GB Storage            │
└─────────────────────────────────────────────────────────────────┘
```

**Why this stack?**
- **Supabase** = PostgreSQL + REST API + file storage + row-level security, all in one free service
- **Vercel** = zero-config React deployment, global CDN, free for personal/team use
- **React + Vite** = fastest dev experience, tiny production bundle
- **Tailwind CSS** = utility-first styling, no unused CSS in production

---

## Database Schema

```
leads            → Active sales funnel (is_deleted = false)
deleted_leads    → Soft-delete archive (complete row snapshots)
po_files         → PO / payment file metadata + storage URLs
audit_log        → Every create/update/delete action with actor + diff
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account

### 1. Clone and install

```bash
git clone <your-repo-url>
cd jio-crm
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `jio-crm`, choose a strong database password, pick a region close to India
3. After creation, go to **SQL Editor**
4. Run `supabase/schema.sql` (paste and execute)
5. Run `supabase/rls_policies.sql` (paste and execute)
6. Go to **Storage** → Create bucket named `po-uploads` → check **Public bucket**
7. In Storage → Policies, add INSERT and SELECT policies for `anon` role (allow all)

### 3. Get your Supabase credentials

Go to Project Settings → API:
- **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
- **anon public key**: `eyJ...` (long JWT string)

### 4. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_PMO_PIN=123456
VITE_APP_NAME=Jio CRM
VITE_APP_SUBTITLE=Sales Funnel Automation Platform
VITE_STORAGE_BUCKET=po-uploads
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment to Vercel (Free)

### Option A: Vercel Dashboard (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → Select your repo
3. In **Environment Variables**, add all 6 variables from `.env.example`
4. Click **Deploy** — done in ~90 seconds

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
# Follow prompts, add env vars when asked
```

---

## Login Guide

### BD Login
1. Select **BD Executive** on the login screen
2. Pick your name from the dropdown (Tushar / Karuna / Som / Uday)
3. If your name isn't listed, select **Other** and type it
4. Click **Enter Dashboard**

### PMO Login
1. Select **PMO** on the login screen
2. Enter the 6-digit PIN (default: `123456`)
3. Set `VITE_PMO_PIN` in your environment to change it

---

## Feature Reference

| Feature | Role | Description |
|---------|------|-------------|
| Enter New Lead | BD + PMO | Add lead with all fields; entry date auto-captured |
| Update Lead | BD + PMO | Search-select lead, edit any field; last_update auto-updated |
| Remove Lead | BD + PMO | Soft-delete to archive; full record preserved |
| PO Upload | BD + PMO | Upload PDF/JPG/PNG; drag-and-drop supported |
| Analytics Dashboard | PMO only | 12 KPIs + 8 charts + stale alerts |
| Export Excel | PMO only | .xlsx with active funnel + summary sheet |

---

## Testing Guide

### Step 1 — Seed data (optional)
Uncomment the INSERT block in `supabase/rls_policies.sql` and run it to populate 10 sample leads.

### Step 2 — BD flow
1. Login as BD → Tushar
2. Enter New Lead → fill all fields → save
3. Update Lead → search "Tushar" → change phase → save
4. PO Upload → select the lead → upload a test PDF
5. Delete Lead → select → archive

### Step 3 — PMO flow
1. Login as PMO (PIN: 123456)
2. Check home page quick KPIs
3. Open Analytics Dashboard → verify all charts load
4. Click Export Excel → verify download

### Step 4 — Verify database
In Supabase → Table Editor:
- `leads` → should show your test data
- `deleted_leads` → should show archived lead
- `po_files` → should show uploaded file metadata
- `audit_log` → should show all actions

---

## Folder Structure

```
jio-crm/
├── public/                  Static assets
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── auth/            (future: user management)
│   │   ├── layout/          Sidebar, Header, Layout wrapper
│   │   ├── ui/              Reusable: Modal, Spinner, Dropdowns, Badges
│   │   └── dashboard/       (charts moved into pages/Dashboard)
│   ├── context/
│   │   └── AuthContext.jsx  Session management (sessionStorage)
│   ├── lib/
│   │   ├── supabase.js      All DB calls centralized here
│   │   ├── constants.js     BD names, phases, solutions, colors
│   │   ├── dateUtils.js     Aging calc, formatDate, etc.
│   │   └── exportToExcel.js Excel export logic (xlsx library)
│   ├── pages/
│   │   ├── LoginPage.jsx    Role selector + BD name + PMO PIN
│   │   ├── BDHome.jsx       BD dashboard homepage
│   │   ├── PMOHome.jsx      PMO homepage with live KPIs
│   │   ├── NewLead.jsx      Feature 1
│   │   ├── UpdateLead.jsx   Feature 2
│   │   ├── DeleteLead.jsx   Feature 3
│   │   ├── POUpload.jsx     Feature 4
│   │   └── Dashboard.jsx    Full analytics (PMO)
│   ├── App.jsx              Route definitions + protected routes
│   ├── main.jsx             Entry point
│   └── index.css            Tailwind + custom classes
├── supabase/
│   ├── schema.sql           Table definitions, indexes, views, triggers
│   └── rls_policies.sql     Security policies + optional seed data
├── .env.example             Environment variable template
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## Security Notes

- PMO PIN is stored in an environment variable — never hardcode it
- The anon key is safe to expose in frontend code (it's designed for this)
- Row Level Security is enabled on all tables
- Files are uploaded to Supabase Storage — no local server needed
- Audit log captures every action with actor name + before/after data
- Soft-delete ensures no data is ever permanently lost

---

## Customization

**Change BD names**: Edit `src/lib/constants.js` → `BD_NAMES` array

**Change app branding**: Edit `VITE_APP_NAME` and `VITE_APP_SUBTITLE` in `.env.local`

**Add more solutions/phases**: Edit `SOLUTIONS` / `PHASES` arrays in `src/lib/constants.js`

**Change PMO PIN**: Update `VITE_PMO_PIN` environment variable in Vercel dashboard

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | UI framework + build tool |
| Styling | Tailwind CSS 3 | Utility-first dark theme |
| Charts | Recharts | All dashboard visualizations |
| Dropdowns | react-select | Searchable lead picker |
| Toast | react-hot-toast | Success/error notifications |
| Date utils | date-fns | Aging calculations |
| Excel export | xlsx | .xlsx file generation |
| Database | Supabase (PostgreSQL) | CRUD + real-time + storage |
| Hosting | Vercel | Frontend CDN deployment |

---

*Built for Jio Platforms Ltd. · Internal Use Only · Confidential*
