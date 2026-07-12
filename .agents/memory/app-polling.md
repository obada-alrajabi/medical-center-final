---
name: App 1-second data polling
description: The DB LOAD useEffect includes a setInterval that refreshes all state every second — this is intentional, not a bug.
---

## Rule
Repeated `[DB LOAD] Raw API results` log entries every ~1 second are **expected** behaviour, not an infinite-loop bug.

## Why
The main App `useEffect` at line ~14943 sets up a 1-second `setInterval` calling `_doLoad()` to keep all state fresh (drawer balances, sessions, debts, etc.). The interval is skipped when the focused element is an `<input>`, `<textarea>`, or `<select>`.

```js
const _pollIv = setInterval(() => {
  const _t = (document.activeElement?.tagName || "").toLowerCase();
  if (_t !== "input" && _t !== "textarea" && _t !== "select") _doLoad().catch(() => {});
}, 1000);
return () => clearInterval(_pollIv);
```

The `{}` shown in `refresh_all_logs` console output is a JSON serialization artifact — the actual objects have real values (visible in the browser DevTools console).

## How to apply
- Don't remove or suppress this polling unless performance profiling specifically identifies it as a bottleneck.
- If you need to reduce server load, increase the interval (e.g. 5000ms) rather than removing it.
- React StrictMode causes `_doLoad()` to run twice on mount in dev — also expected.
