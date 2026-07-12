---
name: Rehab dept new-patient workflow
description: How the rehab dept new-patient flow works and what fields are captured
---

# Rehab New Patient Workflow

## Three-step flow (NewPatientScreen, dept="rehab")

**Step 1** — Patient demographics (shared with all depts)

**Step 2** — Physical Assessment & Treatment Plan (REHAB-ONLY UI):
- Chief Complaint, Rehab Diagnosis, Pain Scale (1-10 slider), ROM & Muscle Strength
- Service selector → from `rehabServices` shared state (App root)
- Session count (numeric +/- buttons)
- Live total = service.price × sessionCount (auto-fills form.price)
- Recommendations textarea

**Step 3** — Financial (shared, but shows rehab-specific summary banner)

## Data flow
- `rehabServices` state lives in App root → passed as prop to NewPatientScreen + RehabCatalogScreen
- `handleSave` compiles `diagnoses=[rehabDiagnosis]` + notes from all rehab fields
- `useEffect([isRehab, rehabTotal])` auto-fills `form.price` for step 3

**Why:** Rehab dept is physical therapy — needs different clinical fields than surgery/clinic.
