هاي محتويات ملف PRD كاملاً بالإنجليزي:

---

# Product Requirements Document (PRD)
## Integrated Medical & Financial Management System — Health Center

**Version:** 1.0 | **Audience:** UI/UX Designer | **Platform:** Web (Desktop-first) | **Direction:** Arabic RTL | **Currency:** ₪ ILS (Israeli Shekel)

---

## 1. System Overview

A unified digital platform to manage a health center comprising four medical departments plus a centralized financial system. The admin monitors all medical and financial operations in one place.

**Medical Departments:**
- General Surgery & Emergency Clinic
- Medical Analysis Laboratory
- Diagnostic Radiology Department
- Rehabilitation Therapy Clinic

---

## 2. User

Single user only — the Admin (center owner). No multi-role permission system.

- One account, full unrestricted access to all sections and settings
- Single password login
- No roles or permission tiers

---

## 3. Design Requirements — UI/UX Guidelines

### 3.1 Visual Identity

| Element | Value |
|---|---|
| Background | Pure white #FFFFFF throughout |
| Primary Color | Medical blue #1A6FA8 |
| Secondary Color | Green #2E9E7A (success, confirmations) |
| Card/Table backgrounds | Light gray #F3F4F6 |
| Text colors | #374151 (primary), #6B7280 (secondary) |
| Alerts / Debts | Red #DC2626 |
| Font | Tajawal (Arabic) / Inter |
| Base font size | 14px–16px |
| Currency | ₪ (ILS) next to all financial figures |

### 3.2 Mandatory Design Rules

- Full RTL layout (right to left)
- No dark backgrounds — white interface throughout
- Modern clean design — NOT a generic AI template
- Border radius: 8–12px on cards, 6px on inputs
- Subtle shadows: `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`
- Consistent spacing: 8px grid system (8, 16, 24, 32px)
- Icons: Phosphor Icons or Heroicons (outline style)
- Tables: alternating rows white/#F9FAFB, header #F3F4F6
- Primary buttons: blue background, white text, rounded

### 3.3 Main Layout Structure

- Fixed right sidebar — 260px wide
- Fixed top bar — shows center name, notifications, current section name
- Main content fills remaining width
- No more than 2 levels of nested tabs
- Charts: Chart.js or Recharts in system colors

---

## 4. Main Admin Dashboard

### 4.1 Alert Bar (top)
- Prominent yellow/orange-tinted banner showing: total outstanding patient debts in ₪
- Direct link to debt details
- Inventory alert: if any item reaches its threshold, shows in same bar

### 4.2 KPI Cards

| Indicator | Content | Design |
|---|---|---|
| Total Revenue | All departments combined (₪) | Icon + large number + % change |
| Total Expenses | Personal expenses + purchase invoices (₪) | Icon + number + quick breakdown |
| Total Patients | Center-wide patient count | Icon + number + monthly comparison |
| Net Debt | Patient debts + supplier debts (₪) | Icon + red number |

### 4.3 Charts (all support free Date Range Picker)
- Revenue by department (Bar Chart)
- Personal expenses by department (Bar Chart)
- Purchases by department (Bar Chart)
- Patient count by department (Bar Chart)
- Patient debts by department (Bar Chart)
- Monthly comparison of all indicators (Line Chart)

---

## 5. Medical Departments — Shared Structure

All four departments share the same sidebar structure:
- Open Patient File
- Dashboard & Statistics
- Expenses & Purchase Invoice
- (Tests/Images Directory — Lab & Radiology only)

### 5.1 Open Patient File

**Entry screen options:**

| Option | Behavior |
|---|---|
| Register New Patient | Opens full registration form + session financial details |
| Start Session for Registered Patient | Opens search (by ID or name) + session financial details |

### 5.2 New Patient Registration Fields

| Field | Required |
|---|---|
| Full name | ✓ |
| ID number (= Medical File Number) | ✓ |
| Mobile number | ✓ |
| Date of birth | ✓ |
| Gender (Male/Female) | ✓ |
| Blood type | ✓ |
| Email | Optional |
| Address | Optional |
| Drug allergies/contraindications (Yes/No → detail) | ✓ |
| Chronic/previous illnesses (Yes/No → detail) | ✓ |
| Health insurance (Yes/No → select company from list) | ✓ |
| Additional notes | Optional |

### 5.3 Session Financial Details (every session)

| Field | Note |
|---|---|
| Service price (₪) | Manual entry |
| Discount (value or %) | Manual entry |
| Amount paid (₪) | Manual entry |
| Remaining = Price − Discount − Paid (₪) | Auto-calculated, added as patient debt |

### 5.4 Session File — by Department

**General Surgery & Rehab Clinic:**
- Select diagnosis from existing list or add new
- Free-text session description
- Select medications given (from pre-added list or add new)
- Attach files (images, documents)

**Medical Laboratory:**
- Select required tests (multi-select) from tests directory with prices (₪)
- Session description
- Tests go to "In Progress" queue
- On completion: "Enter Results" → input results & kit data → print results form → "Mark Delivered" → moves to Completed

**Radiology Department:**
- Select required images (multi-select) from images directory with prices (₪)
- Session description
- Images go to "In Progress" queue
- On completion: "Upload Results" → upload files → "Mark Delivered" → moves to Completed

### 5.5 Patient File

- File number = ID number
- Full patient data shown at top
- Chronological list of all sessions
- Click any session → full session details
- Admin sees complete financial details per patient (total debt, financial history in ₪)

---

## 6. Department-Level Sections

### 6.1 Cash Drawer (الجرار) — Fixed top card in each department dashboard

| Element | Detail |
|---|---|
| Current cash in drawer (₪) | Large prominent number |
| "Withdraw from Drawer" button | Records as bank deposit (NOT an expense) |
| "Add to Drawer" button | Records as receipt voucher with secondary label |

### 6.2 Department Summary

- Patient count in this department
- Total revenue (₪)
- Total personal expenses of department staff (₪)

### 6.3 Staff List

- Names of staff in department (view/tracking only — no permission editing)

### 6.4 Personal Expenses

- Create expense: title + amount (₪)
- Table of past expenses: date, title, amount, responsible person

### 6.5 Purchase Invoices

- Create new invoice: product list + prices (₪)
- Financial fields: total, supplier discount, amount paid, remaining balance (₪)
- Previous invoices table with status (Paid / Unpaid)
- Print button per invoice
- "Settle" button for unpaid invoices → modal to enter partial or full payment amount (₪)

### 6.6 Tests Directory (Lab only)

- Table: test name, description, price (₪), linked Kit
- Add / Edit / Delete tests

### 6.7 Images Directory (Radiology only)

- Table: image name, description, price (₪)
- Add / Edit / Delete images

---

## 7. Central Financial System

### 7.1 Finance Section — Tabs

| Tab | Content |
|---|---|
| Financial Summary | Full KPIs + comparative charts for all departments + export Excel/PDF |
| Cash Drawer | Full drawer details with numbers, dates, charts + export |
| Revenue | Total + by department + by month + free date filter + export |
| Expenses & Supplier Invoices | Personal expenses + purchase invoices by dept/employee/company + settlement |
| Salaries | Total + calculate net after deductions + disburse monthly salary |
| Debts | Patient debts + aging classification + SMS reminder + export |

#### Financial Summary tab details:
- Total revenue (₪)
- Total personal expenses (₪)
- Total purchase invoices (₪)
- Total patient debts (₪)
- Patient debts by department (Bar Chart)
- Supplier debts + by department
- Total cash in drawer (₪)
- Total cash withdrawn from drawer (₪)
- Net profit (₪)
- Revenue by department (Bar Chart)
- Personal expenses by department (Bar Chart)
- Purchase invoices by department (Bar Chart)
- Profit by department (Bar Chart)
- Single Date Range Picker controls all indicators
- Export buttons: Excel & PDF

#### Salaries tab details:
- Total salaries for current month (₪)
- Total salaries for custom period (₪)
- Department salaries chart
- Employee table: Name — Base Salary — Total Personal Expenses — Net Salary (all in ₪)
- "Calculate Salary" button: deducts personal expenses, shows net
- "Disburse This Month's Salary" button: records disbursement

#### Debts tab details:
- Total patient debts (₪)
- Aging classification: <30 days / 30–90 days / >90 days
- Detail table: Patient name — ID — Department — Amount (₪) — Session date — Aging
- "Send SMS Reminder" button: sends text to patient's number with debt details
- "Settle" button: record partial or full payment
- Filters: by department / date range / aging bracket
- Export: Excel & PDF

### 7.2 Statements Section — Tabs

| Tab | Export Options |
|---|---|
| Patient Statements | Detailed financial history per patient — PDF/Excel per patient or all |
| Company Statements | Supplier companies & payments — PDF/Excel per company or all |
| Insurance Company Statements | Insurance companies & insured patients — PDF/Excel per company or all |
| Department Statements | Full financial report per department — PDF/Excel per dept or all |
| Custom Reports | Build custom report from any available data fields — PDF/Excel |

**Custom Reports builder:**
- User selects desired fields
- Free filters: date, department, patient, company, transaction type
- Live preview before export
- Export as Excel or PDF

---

## 8. System Settings

### 8.1 Inventory & Kits Tool

| Field | Description |
|---|---|
| Item / Kit name | Name of material or kit |
| Linked tests | Tests linked to each Kit (auto-deducts on test completion) |
| Current quantity | With option to add new stock as a purchase invoice |
| Alert threshold | When stock hits this level → notification to admin dashboard + lab section |

### 8.2 Backup

**Automatic backup:** daily at 3:00 AM to:
- Google Drive Account 1
- Google Drive Account 2
- Google Drive Account 3
- Hosting server

Display: date & time of last successful backup

**Manual backup options:**

| Option | Description |
|---|---|
| Google Drive 1 | Direct upload to linked Drive account 1 |
| Google Drive 2 | Direct upload to linked Drive account 2 |
| Google Drive 3 | Direct upload to linked Drive account 3 |
| Hosting Backup | Upload to hosting server |
| Device Backup (ZIP) | Download ZIP file directly to device |

### 8.3 Other Settings

- Insurance Companies: add/edit/delete
- Supplier Companies: add/edit/delete
- Employees: add new, assign department, set base salary (₪)
- SMS Settings: link SMS sending service

---

## 9. Full Screen List (28 screens)

### General Screens
| # | Screen | Description |
|---|---|---|
| 1 | Login Screen | Single admin login with password + center logo |
| 2 | Main Admin Dashboard | KPI cards + charts overview |

### Medical Department Screens (×4 departments)
| # | Screen | Description |
|---|---|---|
| 3 | Open Patient File | New patient or registered patient choice |
| 4 | New Patient Registration | Full form + session financial details |
| 5 | Start Session (Registered) | Patient search + session financials |
| 6 | Medical Session File | Diagnosis, description, medications, attachments |
| 7 | Patient Medical File | Session history + full session details |
| 8 | Department Dashboard | Cash drawer + department summary + staff list |
| 9 | Personal Expenses | Expenses list + add new |
| 10 | Purchase Invoices | Invoice list + create + settle |

### Lab-Specific Screens
| # | Screen | Description |
|---|---|---|
| 11 | Tests Management | In-progress / completed + enter results + print |
| 12 | Tests & Prices Directory | Table with add/edit/delete |

### Radiology-Specific Screens
| # | Screen | Description |
|---|---|---|
| 13 | Radiology Management | In-progress / completed + upload files |
| 14 | Images & Prices Directory | Table with add/edit/delete |

### Financial System Screens
| # | Screen | Description |
|---|---|---|
| 15 | Financial Summary | KPIs + charts + export |
| 16 | Cash Drawer | Drawer details + charts |
| 17 | Revenue | Revenue details + filters |
| 18 | Expenses & Supplier Invoices | Expenses + invoices + settlement |
| 19 | Salaries | Employee salaries + calculate + disburse |
| 20 | Debts | Patient debts + SMS + settlement |
| 21–25 | Statements (5 tabs) | Patients, Companies, Insurance, Departments, Custom |

### Settings Screens
| # | Screen | Description |
|---|---|---|
| 26 | Inventory & Kits | Stock table + alerts |
| 27 | Backup | Backup status + manual options |
| 28 | General Settings | Employees, companies, insurance, SMS |

---

## 10. Technical Notes for the Designer

### 10.1 Print Templates
- Lab results print template: A4 with center logo, patient data, test results
- Purchase invoice print template: clean and simple
- Statements export: professionally formatted PDF

### 10.2 Special Interactive Elements
- **Date Range Picker:** custom range + shortcuts (This Month, Last Month, This Year)
- **Cash Drawer Modal:** simple modal with amount field and label
- **Settlement Modal:** shows remaining balance (₪), allows partial or full payment entry
- **SMS Confirmation Modal:** preview of message text before sending
- **Test Status Badge:** color-coded (In Progress: yellow / Completed: green)

### 10.3 Responsive
- Primary design: Desktop (1280px+)
- Tablet support optional (768px–1280px)
- Mobile not required in this phase

### 10.4 Accessibility
- Sufficient color contrast ratios (WCAG AA)
- Clear labels on all fields
- Inline error messages next to the relevant field

### 10.5 Design Notes
- Quality over quantity — deep design of 2 screens beats shallow design of 20
- Consistent components throughout
- Empty states: design "no data" state for every table
- Loading states: for all charts and tables
- Logical user flow, especially for opening a patient file

---

*Currency: ₪ ILS — displayed alongside all financial figures throughout the system.*