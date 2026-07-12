---
name: Print report architecture
description: How printing/report generation works across departments in the hospital app, and where it tends to break.
---

All printing flows through `printHtml` / `savePdfHtml`, which build a standalone HTML document rendered in a hidden iframe. Because the doc is standalone, sidebar/nav/app chrome are never included — no extra `@media print` hiding rules are needed for that. Shared report styling classes (`.pt-card`, `.pt-info`, `.pt-field`, `.tests-title`, `.sig-area`/`.sig-box`/`.sig-line`, `.kpi`/`.kpi-box`) are defined once near the print infra and should be reused for any new report builder rather than inventing new markup.

**Why this matters:** department "طباعة" (print) buttons in this codebase have repeatedly turned out to be either missing an `onClick` entirely, or wired to print only personal/administrative data because the actual entered results (lab values, radiology findings, session assessments) were never persisted out of transient component state (e.g. `resultVals`, `modalParams`) into the board/queue entry.

**How to apply:** when asked to fix or extend a print/report feature, don't assume the button works — grep for the button's `onClick` first. Then check whether the data it needs to print (test results, findings text, assessment fields) is actually stored on a persisted state object (board entry / queue entry) rather than only living in local modal state that resets on close. If it isn't persisted, add the field to the local TS type and write it in the same handler that marks the item "done"/delivered, before building the print HTML. This app's backend has no generic "patch extra JSON fields" endpoint, so this kind of report detail is typically kept in-memory only (acceptable per "don't touch DB" scoping) rather than requiring a schema change.
