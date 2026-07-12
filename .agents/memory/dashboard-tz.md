---
name: Dashboard Palestine timezone
description: Dashboard date helpers and chart loops must use _jlmNow() with UTC methods, not new Date() local methods, to correctly represent Palestine UTC+3 dates.
---

## The Rule
All date calculations in `DashboardScreen` and payroll screen that reference "today", "this week", or "this month" must use `_jlmNow()` (Palestine-adjusted) with `.getUTCDay()`, `.getUTCDate()`, `.getUTCMonth()`, `.getUTCFullYear()` — not `new Date()` with local methods.

## Fixes Applied
- `getWeekStart()`: `new Date()` → `_jlmNow()` with UTC subtraction
- `getMonthStart()`: `new Date()` → `_jlmNow()` UTC year/month
- 7-day occupancy loop: `new Date()` → `new Date(Date.now()+_JLM_OFFSET-i*86400000)` with `.toISOString().slice(0,10)` and `.getUTCDay()`
- `curMonthStart` (payroll): `_isoDate(new Date(...))` → `_jlmNow()` UTC year/month IIFE

**Why:** Server runs UTC; Palestine is UTC+3. After 9pm UTC (midnight Palestine), `new Date()` returns yesterday's date for Palestine, causing "today" filter to miss same-day sessions.

**How to apply:** Pattern = `new Date(Date.now()+_JLM_OFFSET)` then use `.getUTCDate()`, `.getUTCDay()`, `.getUTCMonth()`, `.getUTCFullYear()` for all date math.

## tx_date Format Note
`drawer_transactions.tx_date` (DATE column) comes back from pg as ISO timestamp string `"2026-07-03T00:00:00.000Z"`. `String(tx_date).slice(0,10)` correctly extracts `"2026-07-03"`. No special handling needed.
