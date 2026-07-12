---
name: App.tsx module split
description: How the App.tsx monolith was split into modules and how to verify a split introduced zero regressions
---

# App.tsx module split

`src/app/App.tsx` (the ~15k-line monolith) was split into: `types.ts` (all TS types), `constants.ts` (pure constants + lucide-react icons), `utils.ts` (pure utils: fmt, date/timezone, localStorage helpers, makeDefaultDeptPerms, inRangeDDMMYYYY), `toastStore.ts` (toast bus), `components/shared.tsx` (Badge/KPICard/Modal/ConfirmModal/Card/focusNext/InputField/Btn/ToastContainer/THead/TRow/TD/EmptyState/AccessDeniedScreen).

## Constraints that must hold
- Print globals (`gPrintSettings`, `gLetterheadImg`, `gDeptPrintAdv`, `gPatientPrintSettings`, `gReportContext`) stay in App.tsx as `let` — they are reassigned at runtime and named ES imports are read-only. Do NOT try to move them into a module.
- `constants.ts` also exports PRINT_FONT_FAMILIES/PRINT_FONT_SIZES/PURCHASE_UNITS/RECEIPT_TYPES but App.tsx keeps its own local copies and does NOT import them — harmless residual duplication, no behavior diff.

## Verifying a split has zero regressions (the reliable method)
The project has **no tsconfig.json and no typescript installed** — vite/esbuild strips types, so `npm run build` passing does NOT prove type-correctness. To verify:
1. `npm install --no-save typescript@5` (keeps package.json clean).
2. Write a temp tsconfig (moduleResolution bundler, jsx react-jsx, strict false, skipLibCheck true, noEmit).
3. Type-check the CURRENT refactored files.
4. Extract the ORIGINAL monolith from git (`git show <parent>:src/app/App.tsx`) into a full copy of the src tree (symlink node_modules) and type-check it too — this is the **baseline**.
5. Normalize both error lists (strip `(line,col)`), sort, and `comm -13 baseline current` → anything only in current is YOUR regression; everything else is pre-existing type-looseness (leave it alone — fixing it changes behavior and is out of scope).

**Why:** the original monolith already had ~42 latent tsc errors (missing `Invoice.description/amount`, `LabTest.timeUnit`, Btn/Modal variant/prop mismatches, `today` used out of scope). Without a baseline diff you cannot tell a pre-existing error from one you introduced.

## Regressions this split introduced (and their fixes) — watch for these patterns
- A top-level const used directly in App.tsx (`_JLM_OFFSET`) was moved into utils.ts but only `_jlmNow` was exported → must export the const too and import it.
- Giving a moved localStorage getter a generic `<T>` return made callers infer `unknown` → keep the original concrete return type (import the type into utils.ts).
- `createPortal` belongs to `react-dom`, not `react` — moving JSX-portal code into a new file needs the correct import source.
