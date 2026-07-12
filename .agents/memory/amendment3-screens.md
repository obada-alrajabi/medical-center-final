---
name: Amendment 3 screens
description: LabSessionScreen, RadSessionScreen, ReportsScreen — architecture decisions and known pitfalls from implementation
---

## LabSessionScreen
- Full 3-step wizard: step 0 = patient choice card (new/existing), step 1a = new patient form, step 1b = existing patient search, step 2 = test selection (category chips + search + sidebar summary), step 3 = financial (price → discount → net → paid → remaining with prev-debt banner).
- When `patientId` prop is provided, start at step 2 with pre-selected patient.
- Board view: two Kanban columns (pending / done). Results modal uses `normalRanges` parameter grid with auto normal/high/low classification.
- Low-stock warning shown inline on test rows when `kitQty <= kitThreshold`.

## RadSessionScreen
- Same 3-step structure as Lab but uses `initialRadImages` / `RAD_DEVICES` for filter chips.
- Board view: pending items show "رفع نتيجة" file-upload button + "تم التسليم" button (no results modal — file upload widget instead).
- `RadImage` type uses `timeVal` / `timeUnit` (not `t.time`) — display as `{t.timeVal}{t.timeUnit?" "+t.timeUnit:""}`.

## ReportsScreen
- Props: `{toast, debts, sessions, drawers, invoices}` — matches `renderScreen` call at fin-statements route.
- 5 tabs: patients (search→hero card→expandable sessions table), companies (filter+hero+invoices table), insurance (4 KPI cards + progress-bar table), depts (pie+bar charts + comparison/transactions), custom (field selector + preview table).
- Tab 1 sessions table: wrap mapped rows in `<React.Fragment key={s.id}>` (not `<>`) to avoid React key warnings with expandable rows.
- Tab 5 custom report: all 10 fields handled in row rendering — use `cols` derived from `p5Fields` so header and data cells always stay aligned.

**Why:** These were code-review findings that would have caused runtime display bugs and React reconciliation issues.
