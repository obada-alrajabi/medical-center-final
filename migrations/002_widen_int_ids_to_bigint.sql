-- ============================================================================
-- Migration 002 — Widen client-generated id/FK columns from integer to bigint
-- Root cause: the frontend generates temporary numeric ids via Date.now()
-- (13-digit millisecond timestamps) as optimistic local ids before the real
-- DB-assigned id comes back. These exceed PostgreSQL's `integer` range
-- (max ~2.14 billion / 10 digits), causing:
--   "value ... is out of range for type integer"
-- across many tables. This migration widens every affected id/FK column to
-- bigint, matching what the app actually sends. Safe to run multiple times.
-- ============================================================================

-- Primary key id columns
ALTER TABLE public.admin_accounts ALTER COLUMN id TYPE bigint;
ALTER TABLE public.attendance_records ALTER COLUMN id TYPE bigint;
ALTER TABLE public.debts ALTER COLUMN id TYPE bigint;
ALTER TABLE public.diagnoses_catalog ALTER COLUMN id TYPE bigint;
ALTER TABLE public.drawer_transactions ALTER COLUMN id TYPE bigint;
ALTER TABLE public.drawers ALTER COLUMN id TYPE bigint;
ALTER TABLE public.employee_advances ALTER COLUMN id TYPE bigint;
ALTER TABLE public.employees ALTER COLUMN id TYPE bigint;
ALTER TABLE public.external_debts ALTER COLUMN id TYPE bigint;
ALTER TABLE public.insurance_companies ALTER COLUMN id TYPE bigint;
ALTER TABLE public.inventory_items ALTER COLUMN id TYPE bigint;
ALTER TABLE public.lab_inventory ALTER COLUMN id TYPE bigint;
ALTER TABLE public.lab_inventory_params ALTER COLUMN id TYPE bigint;
ALTER TABLE public.lab_inventory_tests ALTER COLUMN id TYPE bigint;
ALTER TABLE public.lab_test_normal_ranges ALTER COLUMN id TYPE bigint;
ALTER TABLE public.lab_tests ALTER COLUMN id TYPE bigint;
ALTER TABLE public.patient_debts ALTER COLUMN id TYPE bigint;
ALTER TABLE public.patient_delete_requests ALTER COLUMN id TYPE bigint;
ALTER TABLE public.patient_sessions ALTER COLUMN id TYPE bigint;
ALTER TABLE public.payment_vouchers ALTER COLUMN id TYPE bigint;
ALTER TABLE public.purchase_request_items ALTER COLUMN id TYPE bigint;
ALTER TABLE public.purchase_requests ALTER COLUMN id TYPE bigint;
ALTER TABLE public.queues ALTER COLUMN id TYPE bigint;
ALTER TABLE public.rad_catalog ALTER COLUMN id TYPE bigint;
ALTER TABLE public.rad_images ALTER COLUMN id TYPE bigint;
ALTER TABLE public.receipt_vouchers ALTER COLUMN id TYPE bigint;
ALTER TABLE public.session_diagnoses ALTER COLUMN id TYPE bigint;
ALTER TABLE public.session_lab_refs ALTER COLUMN id TYPE bigint;
ALTER TABLE public.session_medications ALTER COLUMN id TYPE bigint;
ALTER TABLE public.session_rad_refs ALTER COLUMN id TYPE bigint;
ALTER TABLE public.sessions ALTER COLUMN id TYPE bigint;
ALTER TABLE public.sidebar_settings ALTER COLUMN id TYPE bigint;
ALTER TABLE public.staff_advance_requests ALTER COLUMN id TYPE bigint;
ALTER TABLE public.staff_dept_permissions ALTER COLUMN id TYPE bigint;
ALTER TABLE public.staff_members ALTER COLUMN id TYPE bigint;
ALTER TABLE public.surgery_clinic_inventory ALTER COLUMN id TYPE bigint;
ALTER TABLE public.surgery_clinic_items ALTER COLUMN id TYPE bigint;

-- Foreign key columns referencing them
ALTER TABLE public.lab_inventory_params ALTER COLUMN inventory_id TYPE bigint;
ALTER TABLE public.lab_inventory_tests ALTER COLUMN inventory_id TYPE bigint;
ALTER TABLE public.lab_test_normal_ranges ALTER COLUMN test_id TYPE bigint;
ALTER TABLE public.purchase_request_items ALTER COLUMN request_id TYPE bigint;
ALTER TABLE public.session_diagnoses ALTER COLUMN session_id TYPE bigint;
ALTER TABLE public.session_lab_refs ALTER COLUMN session_id TYPE bigint;
ALTER TABLE public.session_medications ALTER COLUMN session_id TYPE bigint;
ALTER TABLE public.session_rad_refs ALTER COLUMN session_id TYPE bigint;
ALTER TABLE public.staff_advance_requests ALTER COLUMN staff_id TYPE bigint;
ALTER TABLE public.staff_dept_permissions ALTER COLUMN staff_id TYPE bigint;
