---
name: NewPatientScreen dept-aware step 2
description: How step 2 (ملف الجلسة) differs by dept in NewPatientScreen, and what's persisted vs transient.
---

## Rule
`NewPatientScreen` receives `dept` prop. Step 2 renders one of two variants based on `isLab = dept === "lab"`:

- **Lab**: tests/analyses selector identical to `LabSessionScreen` step 2 — uses `initialLabTests` and `LAB_CATS` (defined as module-level constants). Price auto-filled from `testTotalNP` when user advances to step 3.
- **Surgery / other**: full diagnosis CRUD (modal add/edit, inline delete, search, multi-select chips) + session notes textarea + medication CRUD (modal add/edit/delete, Pill icon rows) + file upload dropzone.

## State variables (all declared unconditionally at top of component)
- Lab: `selTests`, `testSearch`, `catFilter`
- Surgery: `availDiag` (local copy of `initialDiagnoses`), `selDiagIds`, `diagSearch`, `sessionNotes`, `diagModal`, `medications`, `medModal`

## Known gap
Non-lab step-2 clinical data (`selDiagIds`, `sessionNotes`, `medications`) is **not** passed into `handleSave` or persisted — it's UI-only for now. Wire it in when backend/state persistence is added.

**Why:** handleSave only calls doDeposit + sets saved flag; sessions state not yet updated from NewPatientScreen.

**How to apply:** When adding persistence, collect `selDiagIds.map(id=>availDiag.find(d=>d.id===id)?.name)`, `sessionNotes`, and `medications` array before the save call.
