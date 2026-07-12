---
name: Dual-layout global banners
description: How to add a banner/notice that must appear for both admins and staff in this app
---

The admin dashboard (top-level `App()`) and `StaffPortal` are two completely separate JSX trees with independent TopBar/layout markup — there is no shared "AppShell" component between them.

**Why:** Any banner, alert, or notice intended to be visible to *all* logged-in users (admin + every staff department) must be inserted independently into both render trees, near their respective "Banners" section. Adding it only to `App()`'s return will silently make it invisible to staff, and vice versa.

**How to apply:** When adding a new global UI element (broadcast banners, system-wide alerts, etc.), grep for both the admin layout's `no-print` banner block (near `AlertBanner`/`LowStockBanner`) and StaffPortal's own `{/* Banners */}` comment, and insert into both. Also remember to thread any required prop (e.g. `broadcastNotice`) through the `<StaffPortal .../>` call site's prop list AND its function signature/destructure, since StaffPortal only receives what App explicitly passes down.

No WebSocket infra exists in this app — "live" cross-session updates (e.g. a broadcast notice appearing on other staff screens without reload) rely on the existing ~10s polling interval in `App.tsx`, not real push. This is an accepted tradeoff, not a bug.
