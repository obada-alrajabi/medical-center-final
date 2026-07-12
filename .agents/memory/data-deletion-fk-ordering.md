---
name: Data Deletion FK ordering bug (fixed)
description: execute-delete and per-table delete both failed with FK violations when patients had associated debts or patient_delete_requests rows. Root cause and fix documented here.
---

## Root Cause
`routes/admin.js` execute-delete for "patients" category ran `DELETE FROM patients` **before** clearing tables with NO-ACTION FKs pointing to patients:
- `debts.patient_id → patients` (NO ACTION)
- `patient_delete_requests.patient_id → patients` (NO ACTION)

This caused the entire transaction to roll back silently, showing `{"success":false,"message":"...violates foreign key constraint..."}`.

The per-table delete (`DELETE /admin/tables/patients`) had the same issue — it ran a bare `DELETE FROM patients` with no pre-delete cleanup.

## FK Map (patients parent table)
| Child table | FK column | confdeltype |
|---|---|---|
| debts | patient_id | a (NO ACTION) |
| patient_debts | patient_id | a (NO ACTION) |
| patient_delete_requests | patient_id | a (NO ACTION) |
| patient_sessions | patient_id | a (NO ACTION) |
| session_diagnoses/medications/lab_refs/rad_refs | session_id | c (CASCADE) |

Note: `sessions.patient_id → patients` FK was dropped earlier (see db-fk-quirks.md). So sessions don't block patient deletion.

## Fix Applied
1. **execute-delete patientSteps** — reordered to delete debts+patient_delete_requests BEFORE patients:
   ```
   session_diagnoses → session_medications → session_lab_refs → session_rad_refs
   → sessions → patient_sessions → patient_debts → patient_delete_requests
   → debts WHERE patient_id IS NOT NULL → patients
   ```
2. **PRE_DELETE_STEPS map** in admin.js — per-table delete now runs pre-delete steps in a transaction for known parent tables (patients, purchase_requests) before the main DELETE.

## How to apply
- If you add a new table with FK NO ACTION pointing to patients, add it to both `patientSteps` in execute-delete AND `PRE_DELETE_STEPS.patients` in the per-table delete handler.
- If purchase_requests ever get more FK children, add them to `PRE_DELETE_STEPS.purchase_requests`.
- Never put `DELETE FROM patients` before deleting from debts/patient_delete_requests.
