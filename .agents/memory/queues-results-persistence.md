---
name: queues results persistence
description: How lab/radiology result-entry screens persist to the queues table, and the pattern to check for similar gaps.
---

The `queues` table backs pending/done boards for reception, lab, and radiology. It originally only tracked `status`; there was no column for the actual result/report content entered by staff (lab parameter values, radiology per-image reports), so that data lived only in React state and vanished on refresh even though the "done" status itself was correctly persisted via `api.queues.updateStatus`.

**Why:** a screen calling a real API for status changes can still be a connectivity bug if the *payload* staff actually care about (test results, diagnostic reports) is never included in that call — status-only persistence gives a false impression of being "wired up."

**How to apply:** `queues.results` (jsonb) now stores this payload; `PATCH /queues/:id` accepts an optional `results` field (fetch-first merge, preserves existing value if omitted) and `api.queues.updateStatus(id, status, results?)` takes an optional third argument. When auditing any board/queue screen for real persistence, check not just whether a status-change action calls an API, but whether the actual entered content (results, reports, notes) is included in that call and re-hydrated from the API response on load — not just carried in local component state.

Also found and fixed: a screen can be a live, menu-linked route yet still be built entirely against static mock data with zero API calls (`RadResultsScreen` at "rad-results" route) even while a separate, correctly-wired duplicate of the same workflow exists elsewhere in the same file. Duplicate screens for the same real-world action are a red flag — audit each route independently, don't assume "the feature is wired somewhere" covers all entry points to it.
