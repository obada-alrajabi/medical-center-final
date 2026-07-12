# Threat Model

## Project Overview

This project is a hospital-management dashboard implemented as a single-page React/Vite application. In production it would ship almost all business logic, state, and sample records to the browser, with no backend API, database, or server-side authorization layer present in the current codebase.

Per scan assumptions, production runs with `NODE_ENV=production`, mockup sandbox environments are not treated as production, and TLS is handled by the platform. Because there is no server component here, the main security question is whether the browser bundle itself exposes sensitive data or privileged workflows to any visitor.

## Assets

- **Patient medical and contact data** — patient names, national IDs, phone numbers, addresses, blood groups, chronic conditions, allergies, visit history, debts, and diagnostic context appear in application state. Exposure would disclose regulated health information.
- **Staff credentials and identity data** — staff national IDs, phone numbers, passwords, and role/permission assignments are security-sensitive because they control access to operational and financial screens.
- **Financial and operational data** — drawer balances, transaction history, payroll-related fields, supplier and invoice data, and debt records affect both privacy and business integrity.
- **Administrative workflow control** — staff-management, settings, reporting, and financial screens represent privileged capabilities even when the app has no server backend.

## Trust Boundaries

- **Public browser user ↔ bundled SPA** — every visitor can download and inspect the JavaScript bundle. Any data or secrets embedded in frontend code must be treated as public.
- **Login UI ↔ privileged application state** — the current “authentication” boundary is enforced only by React state in the browser. Without a server-side verifier, this boundary is inherently weak.
- **Staff role UI ↔ sensitive workflow access** — department permissions and admin/staff distinctions are rendered client-side. They only protect against casual clicks, not against a malicious browser user.
- **Production code ↔ dev-only artifacts** — `attached_assets/`, `.agents/`, `.local/`, and guidance files are usually out of scope unless referenced by shipped code. `dist/` is relevant only as evidence of what production bundles expose.

## Scan Anchors

- Production entry points: `src/main.tsx`, `src/app/App.tsx`.
- Highest-risk area: `src/app/App.tsx` because it contains login, permissions, patient data, staff records, finance flows, reports, and settings in one file.
- Public vs authenticated vs admin surfaces: all are implemented inside the same client bundle; there is no server-enforced separation.
- Usually low-priority shared UI code: `src/app/components/ui/*` unless it receives attacker-controlled HTML/CSS/URLs.

## Threat Categories

### Spoofing

This project currently relies on browser-side checks to decide whether a user is an admin or a staff member. Any production version must treat the client as untrusted: privileged access must require a server-validated identity, sessions must be issued and verified server-side, and the frontend must never be the source of truth for who the user is.

### Tampering

Patient, drawer, debt, payroll, and staff-management workflows are executed entirely in mutable browser memory. In this architecture, an attacker can alter state, bypass disabled UI controls, or invoke privileged actions directly from the client. Any production deployment must move integrity-sensitive operations to a trusted backend that validates authorization and business rules before applying changes.

### Information Disclosure

Because the application bundle is public to every visitor, any patient records, staff passwords, or financial data embedded in source code are effectively public. Production builds must not ship real secrets, credentials, or sensitive records to the browser; sensitive data should be fetched only after authentication from a server that scopes responses to the authorized user.

### Elevation of Privilege

Department permissions, admin access, and screen-level restrictions are currently expressed as frontend booleans. That allows a malicious user to obtain broader access by bypassing the UI entirely. Production systems derived from this code must enforce authorization on the server for every privileged operation and must not rely on hidden routes, conditional rendering, or client-side flags as security controls.
