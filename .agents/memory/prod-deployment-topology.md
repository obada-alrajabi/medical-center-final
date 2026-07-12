---
name: Production deployment topology
description: How this project's production environment is hosted and why the agent cannot directly query/modify production data
---

Production for this app is **not** a Replit-managed deployment. It runs on external cPanel/Hostinger hosting (`system.mjcc.ps`), deployed via a git-webhook that pulls into a path on that server. The frontend's production API base URL is hardcoded to `https://system.mjcc.ps/api`.

**Why this matters:** the Replit `DATABASE_URL` secret and the "query production database" tooling only reach the dev/Replit-hosted Postgres instance — they have no path to the real production database on Hostinger. Any request to "fix/clean/inspect production data" cannot be executed directly from this environment.

**How to apply:** when a task requires changing production data (not just dev data), do the following instead of assuming direct DB access:
1. Clean/verify the local dev DB so the dev preview is consistent.
2. Ship the actual code/feature (e.g., an admin UI tool) that the site owner can use themselves once deployed to production, or that will take effect after their next git-webhook deploy.
3. Explicitly tell the user that production data changes require them to deploy this code and/or run the tool against the live site — the agent has no direct credential path to `system.mjcc.ps`'s database.
