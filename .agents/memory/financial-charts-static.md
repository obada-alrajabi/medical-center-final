---
name: Financial charts static arrays bug
description: revenueByDept, monthlyTrend, withdrawCats were module-level empty arrays — fix is to compute them dynamically inside each screen component.
---

## The Rule
Never use module-level arrays for chart data derived from `drawers.txs`. Always compute inside the screen component from `filteredTxs`.

## What Was Wrong
Lines ~1000-1003 in App.tsx declared:
```js
const revenueByDept:{name:string;إيرادات:number}[] = [];
const monthlyTrend:{month:string;إيرادات:number;سحوبات:number}[] = [];
const withdrawCats:{name:string;value:number}[] = [];
```
These were referenced in `FinancialSummaryScreen` and `FinProfitScreen` chart `data={}` props, so charts always showed empty even with real data.

## Fix Applied
- `FinancialSummaryScreen`: compute `revenueByDept`, `monthlyTrend`, `withdrawCats` after `filteredTxs` is derived
- `FinProfitScreen`: compute `revenueByDept` from `filteredDrawers` entries before `return(`
- The module-level declarations remain as type hints only (no data)

**Why:** React components re-render on prop changes; module-level constants never update.

**How to apply:** If adding a new chart to a financial screen, compute its data array locally inside the component using the same `ir()` date filter and `filteredTxs`/`drawers` state already available.
