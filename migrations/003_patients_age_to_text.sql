-- ============================================================================
-- Migration 003 — Widen patients.age from smallint to text
-- Root cause: age was stored as a whole-number-of-years column, so there was
-- no way to register an infant's age in months (e.g. "9 أشهر" for a 9-month-
-- old). The app now treats age as free text — plain numbers are still
-- displayed with "سنة" appended automatically by the frontend, but any text
-- (like "9 أشهر") is accepted and stored/displayed as typed.
-- Safe to run multiple times.
-- ============================================================================

ALTER TABLE public.patients ALTER COLUMN age TYPE varchar(50) USING age::varchar;
