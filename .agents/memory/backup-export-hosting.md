---
name: Backup export/restore on shared hosting
description: Why pg_dump/psql-based backup broke on Hostinger cPanel and how the pure-JS replacement must order its output
---

`pg_dump`/`psql` CLI binaries are not available on Hostinger shared hosting (no shell access to external binaries from Node app processes). Any backup/restore feature must be implemented in pure JS using the `pg` driver + `pg_catalog`/`information_schema` introspection — never `child_process.spawn('pg_dump'/'psql', ...)`.

**Why:** this was the root cause of the production "فشل تصدير النسخة الاحتياطية" (backup export failure) — it worked in the Replit dev container (which has the binaries) but silently/loudly failed on the actual hosting target.

**How to apply:** when regenerating a pure-JS SQL dump for this app, statement order must be: sequences → bare `CREATE TABLE` → PK/UNIQUE constraints → data `INSERT` → plain indexes → FK constraints (added last) → `setval`. Putting FK constraints before data breaks insert order across tables; putting indexes before data is harmless but conventionally goes after. Also: generated columns (e.g. `invoices.remaining`) must be emitted as `GENERATED ALWAYS AS (...) STORED` and excluded from INSERT column lists; real Postgres array columns (`text[]`) must use `{...}` literal syntax, not JSON `[...]`.

**Testing gotcha:** never test restore logic against the live dev DB using `SET search_path` tricks with unqualified `DROP TABLE ... CASCADE` — objects not yet created in the test schema fall through the search_path to the real `public` schema and can drop/empty live tables. Also, `pg_get_indexdef`/`pg_get_constraintdef` output is always fully schema-qualified (e.g. `ON public.foo`), so even schema-isolated restore tests can silently mutate the real `public` schema's indexes/constraints. Safe restore testing requires a fully separate throwaway database (`CREATE DATABASE`), not just a separate schema.
