# مركز وعيادة الدكتور مهند سليمان جابر — نظام الإدارة الشاملة

A comprehensive Arabic (RTL) hospital management dashboard built with **React + Vite + Tailwind CSS**, exported from Figma Make.

## Running the app

```bash
npm install
npm run dev
```

The dev server runs on **port 5000**.

## Login credentials (demo)

- **Username:** `admin`
- **Password:** `1234`

## Stack

- **React 18** with TypeScript
- **Vite 6** (build & dev server)
- **Tailwind CSS 4**
- **Recharts** for charts
- **Lucide React** for icons
- **MUI / Radix UI** component libraries
- **RTL layout** with Arabic UI (`dir="rtl"`, Tajawal font)

## Features

- **Dashboard** — KPI cards, charts, department drawer balances
- **Departments** (Surgery, Lab, Radiology, Rehab):
  - Open patient file (new or existing)
  - Drawer management (deposits, withdrawals, invoices)
  - Lab: session workflow, test catalog with normal ranges
  - Radiology: image/procedure catalog
- **Financial system** — Summary, revenue screen, payroll (deducts from drawer), debt management, reports
- **Settings** — Inventory/kits, backup, print settings, general (employees, insurance, suppliers, SMS)

## Architecture

All state lives in the top-level `App` component and is passed down as props:
- `drawers` — cash drawer balances & transactions per department
- `debts` — patient outstanding balances
- `employees` — payroll state
- `invoices` — company invoices per department

Transactions (`doDeposit` / `doWithdraw`) update the drawer state and automatically create transaction records.

## Deploying to cPanel

### Node.js requirement
The build step (`npm install && npm run build`) requires **Node.js 18 or newer** and **npm 9 or newer**.

### Setting up Node.js on cPanel
1. Log in to cPanel → **Setup Node.js App**.
2. Create or select an application and choose **Node.js 18** (or 20 LTS).
3. cPanel installs Node.js via NVM — the `.cpanel.yml` deployment script sources NVM automatically so the correct version is on `$PATH` during each deploy.
4. The `.nvmrc` file (pinned to Node 20) is picked up by NVM; cPanel's Node.js Selector will honour it.

### What happens if Node.js is missing
The `.cpanel.yml` deployment script checks for Node.js before running the build. If Node.js is absent or below version 18, the deploy **fails immediately with a clear error message** instead of producing a broken deployment silently:

```
ERROR: Node.js is not installed. Enable Node.js via cPanel > Setup Node.js App (requires Node 18+).
```

### Quick reference — pinned versions
| File | Purpose |
|------|---------|
| `.nvmrc` | Pins NVM / Node.js Selector to Node 20 |
| `package.json` → `engines` | Documents the `>=18` / npm `>=9` requirement |
| `.cpanel.yml` | Sources NVM, version-checks, then builds |

## User preferences

- Keep existing RTL Arabic structure
- Keep single-file component architecture (App.tsx)
- Use Tailwind utility classes for styling
