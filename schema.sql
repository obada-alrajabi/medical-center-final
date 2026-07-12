--
-- PostgreSQL database dump
--

\restrict 91VmopUyHlg5CJx5LcCqnFUvHPNajdpQoywLcVxwn5S833Sc07Ou743ZjZuveAr

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_accounts (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    display_name character varying(200),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_accounts_id_seq OWNED BY public.admin_accounts.id;


--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_records (
    id integer NOT NULL,
    emp_id character varying(50) NOT NULL,
    emp_name character varying(200) NOT NULL,
    dept character varying(50),
    date date NOT NULL,
    day_name character varying(20),
    check_in time without time zone,
    check_out time without time zone,
    created_at timestamp with time zone DEFAULT now(),
    total_hours numeric(5,2)
);


--
-- Name: attendance_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendance_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attendance_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendance_records_id_seq OWNED BY public.attendance_records.id;


--
-- Name: debts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debts (
    id integer NOT NULL,
    patient character varying(200) NOT NULL,
    patient_id character varying(30),
    dept character varying(50),
    amount numeric(12,2) DEFAULT 0,
    date date,
    phone character varying(30),
    sms_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: debts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.debts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: debts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.debts_id_seq OWNED BY public.debts.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    short_name character varying(100) NOT NULL,
    icon character varying(50),
    is_custom boolean DEFAULT false,
    sub_item_ids text[],
    sort_order smallint DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: diagnoses_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnoses_catalog (
    id integer NOT NULL,
    code character varying(30),
    name character varying(300) NOT NULL,
    category character varying(100),
    dept character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: diagnoses_catalog_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.diagnoses_catalog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: diagnoses_catalog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.diagnoses_catalog_id_seq OWNED BY public.diagnoses_catalog.id;


--
-- Name: drawer_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drawer_transactions (
    id integer NOT NULL,
    dept character varying(50) NOT NULL,
    type character varying(5) NOT NULL,
    title text NOT NULL,
    category character varying(100),
    beneficiary character varying(200),
    amount numeric(12,2) NOT NULL,
    balance_after numeric(12,2) NOT NULL,
    tx_time time without time zone,
    tx_date date NOT NULL,
    is_auto boolean DEFAULT false,
    ref_type character varying(50),
    ref_id integer,
    is_opening_balance boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT drawer_transactions_type_check CHECK (((type)::text = ANY ((ARRAY['in'::character varying, 'out'::character varying])::text[])))
);


--
-- Name: drawer_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.drawer_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: drawer_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.drawer_transactions_id_seq OWNED BY public.drawer_transactions.id;


--
-- Name: drawers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drawers (
    id integer NOT NULL,
    dept character varying(50) NOT NULL,
    balance numeric(12,2) DEFAULT 0,
    opening_balance numeric(12,2) DEFAULT 0,
    opening_balance_date date,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: drawers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.drawers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: drawers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.drawers_id_seq OWNED BY public.drawers.id;


--
-- Name: employee_advances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_advances (
    id integer NOT NULL,
    emp_name character varying(200) NOT NULL,
    dept character varying(50),
    amount numeric(10,2) NOT NULL,
    date date NOT NULL,
    note text,
    repaid boolean DEFAULT false,
    repaid_date date,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: employee_advances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_advances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_advances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_advances_id_seq OWNED BY public.employee_advances.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    dept character varying(50),
    role character varying(150),
    salary numeric(10,2) DEFAULT 0,
    expenses numeric(10,2) DEFAULT 0,
    status character varying(20) DEFAULT 'pending'::character varying,
    paid_date date,
    commission numeric(10,2) DEFAULT 0,
    net_salary numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: external_debts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_debts (
    id integer NOT NULL,
    direction character varying(10) NOT NULL,
    party character varying(200) NOT NULL,
    amount numeric(12,2) NOT NULL,
    date date,
    note text,
    status character varying(20) DEFAULT 'pending'::character varying,
    settled_date date,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT external_debts_direction_check CHECK (((direction)::text = ANY ((ARRAY['given'::character varying, 'received'::character varying])::text[])))
);


--
-- Name: external_debts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.external_debts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: external_debts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.external_debts_id_seq OWNED BY public.external_debts.id;


--
-- Name: insurance_companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurance_companies (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    phone character varying(30),
    discount_clinic numeric(5,2) DEFAULT 0,
    discount_lab numeric(5,2) DEFAULT 0,
    discount_rad numeric(5,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: insurance_companies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insurance_companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insurance_companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.insurance_companies_id_seq OWNED BY public.insurance_companies.id;


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_items (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    item_type character varying(100),
    tests text[],
    qty numeric(10,3) DEFAULT 0,
    threshold numeric(10,3) DEFAULT 0,
    status character varying(15) DEFAULT 'ok'::character varying,
    unit character varying(30),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT inventory_items_status_check CHECK (((status)::text = ANY ((ARRAY['ok'::character varying, 'low'::character varying, 'critical'::character varying, 'empty'::character varying])::text[])))
);


--
-- Name: inventory_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_items_id_seq OWNED BY public.inventory_items.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id character varying(30) NOT NULL,
    company character varying(200) NOT NULL,
    date date NOT NULL,
    total numeric(12,2) DEFAULT 0,
    paid numeric(12,2) DEFAULT 0,
    remaining numeric(12,2) GENERATED ALWAYS AS ((total - paid)) STORED,
    status character varying(20) DEFAULT 'unpaid'::character varying,
    dept character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: lab_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_inventory (
    id integer NOT NULL,
    name character varying(300) NOT NULL,
    item_type character varying(100),
    qty numeric(10,2) DEFAULT 0,
    threshold numeric(10,2) DEFAULT 0,
    unit character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: lab_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lab_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lab_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lab_inventory_id_seq OWNED BY public.lab_inventory.id;


--
-- Name: lab_inventory_params; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_inventory_params (
    id integer NOT NULL,
    inventory_id integer NOT NULL,
    name character varying(200) NOT NULL,
    unit character varying(50),
    min_val character varying(50),
    max_val character varying(50)
);


--
-- Name: lab_inventory_params_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lab_inventory_params_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lab_inventory_params_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lab_inventory_params_id_seq OWNED BY public.lab_inventory_params.id;


--
-- Name: lab_inventory_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_inventory_tests (
    id integer NOT NULL,
    inventory_id integer NOT NULL,
    test_name character varying(300) NOT NULL
);


--
-- Name: lab_inventory_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lab_inventory_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lab_inventory_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lab_inventory_tests_id_seq OWNED BY public.lab_inventory_tests.id;


--
-- Name: lab_test_normal_ranges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_test_normal_ranges (
    id integer NOT NULL,
    test_id integer NOT NULL,
    param character varying(300) NOT NULL,
    unit character varying(50),
    min_val character varying(50),
    max_val character varying(50),
    note text
);


--
-- Name: lab_test_normal_ranges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lab_test_normal_ranges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lab_test_normal_ranges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lab_test_normal_ranges_id_seq OWNED BY public.lab_test_normal_ranges.id;


--
-- Name: lab_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_tests (
    id integer NOT NULL,
    code character varying(50),
    name character varying(300) NOT NULL,
    name_en character varying(300),
    category character varying(100),
    price_official numeric(10,2) DEFAULT 0,
    price numeric(10,2) DEFAULT 0,
    consumables_cost numeric(10,2) DEFAULT 0,
    price_cost numeric(10,2) DEFAULT 0,
    is_l2l boolean DEFAULT false,
    kit character varying(200),
    kit_qty numeric(10,2) DEFAULT 0,
    kit_unit character varying(50),
    kit_threshold numeric(10,2) DEFAULT 0,
    time_estimate character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: lab_tests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lab_tests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lab_tests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lab_tests_id_seq OWNED BY public.lab_tests.id;


--
-- Name: patient_debts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_debts (
    id integer NOT NULL,
    patient_id character varying(20) NOT NULL,
    patient_name character varying(200) NOT NULL,
    dept character varying(50),
    amount numeric(12,2) NOT NULL,
    debt_date date DEFAULT CURRENT_DATE NOT NULL,
    days_overdue integer DEFAULT 0,
    phone character varying(30),
    sms_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: patient_debts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patient_debts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patient_debts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patient_debts_id_seq OWNED BY public.patient_debts.id;


--
-- Name: patient_delete_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_delete_requests (
    id integer NOT NULL,
    patient_id character varying(30) NOT NULL,
    patient_name character varying(200) NOT NULL,
    requested_by character varying(200) NOT NULL,
    request_dept character varying(50),
    request_date date NOT NULL,
    reason text,
    status character varying(20) DEFAULT 'pending'::character varying,
    reviewed_by character varying(200),
    review_date date,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: patient_delete_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patient_delete_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patient_delete_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patient_delete_requests_id_seq OWNED BY public.patient_delete_requests.id;


--
-- Name: patient_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_sessions (
    id integer NOT NULL,
    patient_id character varying(20) NOT NULL,
    dept character varying(50) NOT NULL,
    doctor character varying(200),
    date date DEFAULT CURRENT_DATE NOT NULL,
    notes text DEFAULT ''::text,
    amount numeric(12,2) DEFAULT 0,
    paid numeric(12,2) DEFAULT 0,
    debt numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: patient_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patient_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patient_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patient_sessions_id_seq OWNED BY public.patient_sessions.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id character varying(30) NOT NULL,
    name character varying(200) NOT NULL,
    age smallint,
    gender character varying(10),
    phone character varying(30),
    national_id character varying(50),
    blood_type character varying(10),
    address text,
    email character varying(150),
    has_allergy boolean DEFAULT false,
    allergy_detail text,
    has_chronic boolean DEFAULT false,
    chronic_detail text,
    has_insurance boolean DEFAULT false,
    insurance_company character varying(150),
    dept character varying(50),
    debt numeric(12,2) DEFAULT 0,
    notes text,
    date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: payment_voucher_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_voucher_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_vouchers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_vouchers (
    id integer NOT NULL,
    voucher_no character varying(50) NOT NULL,
    date date NOT NULL,
    amount numeric(12,2) NOT NULL,
    paid_to_type character varying(20) NOT NULL,
    paid_to_id character varying(50),
    paid_to_name character varying(200) NOT NULL,
    reason text NOT NULL,
    dept character varying(50),
    category character varying(100),
    notes text,
    approved_by character varying(200),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: payment_vouchers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_vouchers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_vouchers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_vouchers_id_seq OWNED BY public.payment_vouchers.id;


--
-- Name: purchase_request_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_request_items (
    id integer NOT NULL,
    request_id integer NOT NULL,
    name character varying(300) NOT NULL,
    qty numeric(10,2) DEFAULT 1,
    unit character varying(50),
    estimated_price numeric(10,2) DEFAULT 0,
    note text
);


--
-- Name: purchase_request_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_request_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_request_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_request_items_id_seq OWNED BY public.purchase_request_items.id;


--
-- Name: purchase_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_requests (
    id integer NOT NULL,
    dept character varying(50),
    requested_by character varying(200),
    date date NOT NULL,
    total_amount numeric(12,2) DEFAULT 0,
    status character varying(20) DEFAULT 'pending'::character varying,
    approved_by character varying(200),
    approved_date date,
    rejection_reason text,
    note text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: purchase_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchase_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchase_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchase_requests_id_seq OWNED BY public.purchase_requests.id;


--
-- Name: queues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.queues (
    id integer NOT NULL,
    dept character varying(50) NOT NULL,
    patient_name character varying(200) NOT NULL,
    patient_num integer,
    phone character varying(50),
    dest_dept character varying(50),
    notes text,
    items jsonb DEFAULT '[]'::jsonb,
    queue_time character varying(20),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    results jsonb
);


--
-- Name: queues_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.queues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: queues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.queues_id_seq OWNED BY public.queues.id;


--
-- Name: rad_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rad_catalog (
    id integer NOT NULL,
    code character varying(50),
    name character varying(300) NOT NULL,
    device character varying(100),
    price numeric(10,2) DEFAULT 0,
    time_val character varying(20),
    time_unit character varying(20),
    instructions text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: rad_catalog_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rad_catalog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rad_catalog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rad_catalog_id_seq OWNED BY public.rad_catalog.id;


--
-- Name: rad_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rad_images (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(200) NOT NULL,
    device character varying(100),
    price numeric(10,2) DEFAULT 0 NOT NULL,
    time_val character varying(20),
    time_unit character varying(20),
    instructions text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: rad_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rad_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rad_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rad_images_id_seq OWNED BY public.rad_images.id;


--
-- Name: receipt_voucher_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.receipt_voucher_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: receipt_vouchers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipt_vouchers (
    id integer NOT NULL,
    voucher_no character varying(50) NOT NULL,
    date date NOT NULL,
    amount numeric(12,2) NOT NULL,
    received_from_type character varying(20) NOT NULL,
    received_from_id character varying(50),
    received_from_name character varying(200) NOT NULL,
    reason text NOT NULL,
    dept character varying(50),
    notes text,
    approved_by character varying(200),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: receipt_vouchers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.receipt_vouchers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: receipt_vouchers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.receipt_vouchers_id_seq OWNED BY public.receipt_vouchers.id;


--
-- Name: session_diagnoses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_diagnoses (
    id integer NOT NULL,
    session_id integer NOT NULL,
    code character varying(30),
    name text NOT NULL,
    category character varying(100)
);


--
-- Name: session_diagnoses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.session_diagnoses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: session_diagnoses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.session_diagnoses_id_seq OWNED BY public.session_diagnoses.id;


--
-- Name: session_lab_refs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_lab_refs (
    id integer NOT NULL,
    session_id integer NOT NULL,
    test_name text NOT NULL
);


--
-- Name: session_lab_refs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.session_lab_refs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: session_lab_refs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.session_lab_refs_id_seq OWNED BY public.session_lab_refs.id;


--
-- Name: session_medications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_medications (
    id integer NOT NULL,
    session_id integer NOT NULL,
    name character varying(300) NOT NULL,
    dose character varying(100),
    freq character varying(100),
    duration character varying(100)
);


--
-- Name: session_medications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.session_medications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: session_medications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.session_medications_id_seq OWNED BY public.session_medications.id;


--
-- Name: session_rad_refs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_rad_refs (
    id integer NOT NULL,
    session_id integer NOT NULL,
    image_name text NOT NULL
);


--
-- Name: session_rad_refs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.session_rad_refs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: session_rad_refs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.session_rad_refs_id_seq OWNED BY public.session_rad_refs.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    patient_id character varying(30) NOT NULL,
    dept character varying(50),
    doctor character varying(200),
    date date NOT NULL,
    notes text,
    amount numeric(12,2) DEFAULT 0,
    paid numeric(12,2) DEFAULT 0,
    debt numeric(12,2) DEFAULT 0,
    discount numeric(12,2) DEFAULT 0,
    discount_type character varying(10) DEFAULT 'amount'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: sidebar_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sidebar_settings (
    id integer NOT NULL,
    hidden_sections text[] DEFAULT '{}'::text[],
    hide_revenue_from_staff boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now(),
    dept_capacity jsonb DEFAULT '{}'::jsonb
);


--
-- Name: sidebar_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sidebar_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sidebar_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sidebar_settings_id_seq OWNED BY public.sidebar_settings.id;


--
-- Name: sms_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_settings (
    id integer DEFAULT 1 NOT NULL,
    provider character varying(100) DEFAULT 'jawwal'::character varying NOT NULL,
    api_key_enc text,
    sender_id character varying(50),
    enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sms_settings_id_check CHECK ((id = 1))
);


--
-- Name: staff_advance_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_advance_requests (
    id integer NOT NULL,
    staff_id integer,
    staff_name character varying(200) NOT NULL,
    dept character varying(50),
    amount numeric(10,2) NOT NULL,
    request_date date DEFAULT CURRENT_DATE,
    reason text,
    status character varying(15) DEFAULT 'pending'::character varying,
    reviewed_by character varying(200),
    review_date date,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT staff_advance_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


--
-- Name: staff_advance_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.staff_advance_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: staff_advance_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.staff_advance_requests_id_seq OWNED BY public.staff_advance_requests.id;


--
-- Name: staff_dept_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_dept_permissions (
    id integer NOT NULL,
    staff_id integer NOT NULL,
    dept character varying(50) NOT NULL,
    can_view boolean DEFAULT false,
    can_open_patient boolean DEFAULT false,
    can_drawer_view boolean DEFAULT false,
    can_drawer_view_balance boolean DEFAULT false,
    can_drawer_adjust_balance boolean DEFAULT false,
    can_drawer_deposit boolean DEFAULT false,
    can_drawer_withdraw boolean DEFAULT false,
    can_drawer_view_history boolean DEFAULT false,
    can_drawer_view_stats boolean DEFAULT false,
    can_drawer_view_charts boolean DEFAULT false,
    can_drawer_view_employees boolean DEFAULT false,
    can_drawer_view_invoices boolean DEFAULT false,
    can_drawer_settle_invoices boolean DEFAULT false,
    can_drawer_financials boolean DEFAULT false,
    can_lab_session boolean DEFAULT false,
    can_lab_catalog boolean DEFAULT false,
    can_rad_session boolean DEFAULT false,
    can_rad_catalog boolean DEFAULT false,
    can_purchase_reqs boolean DEFAULT false,
    can_lab_queue boolean DEFAULT false,
    can_lab_inventory boolean DEFAULT false,
    can_rad_queue boolean DEFAULT false,
    can_rehab_session boolean DEFAULT false,
    can_rehab_catalog boolean DEFAULT false,
    can_rehab_queue boolean DEFAULT false,
    can_print boolean DEFAULT false,
    can_vouchers boolean DEFAULT false,
    can_delete_patient boolean DEFAULT false,
    can_edit_patient boolean DEFAULT false,
    can_edit_date boolean DEFAULT false,
    can_edit_voucher boolean DEFAULT false,
    can_delete_voucher boolean DEFAULT false,
    can_register_patient boolean DEFAULT false,
    can_print_export boolean DEFAULT false,
    can_queue boolean DEFAULT false,
    can_queue_add boolean DEFAULT false,
    can_queue_edit_status boolean DEFAULT false,
    can_queue_delete boolean DEFAULT false,
    can_catalog_add boolean DEFAULT false,
    can_catalog_edit boolean DEFAULT false,
    can_catalog_delete boolean DEFAULT false,
    can_inventory_add boolean DEFAULT false,
    can_inventory_edit boolean DEFAULT false,
    can_inventory_delete boolean DEFAULT false,
    can_attendance_dept boolean DEFAULT false,
    can_attendance_view boolean DEFAULT false,
    can_attendance_mark boolean DEFAULT false,
    can_staff_advance boolean DEFAULT false,
    can_staff_advance_submit boolean DEFAULT false,
    can_surgery_clinic_inv boolean DEFAULT false
);


--
-- Name: staff_dept_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.staff_dept_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: staff_dept_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.staff_dept_permissions_id_seq OWNED BY public.staff_dept_permissions.id;


--
-- Name: staff_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_members (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    national_id character varying(50),
    dob date,
    username character varying(100),
    password_hash character varying(255) NOT NULL,
    job_title character varying(150),
    primary_dept character varying(50),
    phone character varying(30),
    role character varying(100),
    salary_type character varying(20) DEFAULT 'fixed'::character varying,
    fixed_salary numeric(10,2) DEFAULT 0,
    percentage_dept character varying(50),
    percentage_value numeric(5,2) DEFAULT 0,
    shift_start time without time zone,
    shift_end time without time zone,
    shift_amount numeric(10,2) DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    join_date date,
    can_access_financial boolean DEFAULT false,
    can_access_settings boolean DEFAULT false,
    can_access_reports boolean DEFAULT false,
    can_manage_staff boolean DEFAULT false,
    is_admin_role boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    can_attendance boolean DEFAULT false
);


--
-- Name: staff_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.staff_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: staff_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.staff_members_id_seq OWNED BY public.staff_members.id;


--
-- Name: surgery_clinic_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.surgery_clinic_inventory (
    id integer NOT NULL,
    name character varying(300) NOT NULL,
    category character varying(100),
    qty numeric(10,2) DEFAULT 0,
    threshold numeric(10,2) DEFAULT 0,
    expiry_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: surgery_clinic_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.surgery_clinic_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: surgery_clinic_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.surgery_clinic_inventory_id_seq OWNED BY public.surgery_clinic_inventory.id;


--
-- Name: surgery_clinic_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.surgery_clinic_items (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    category character varying(100),
    qty numeric(10,2) DEFAULT 0,
    threshold numeric(10,2) DEFAULT 0,
    expiry_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: surgery_clinic_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.surgery_clinic_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: surgery_clinic_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.surgery_clinic_items_id_seq OWNED BY public.surgery_clinic_items.id;


--
-- Name: admin_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_accounts ALTER COLUMN id SET DEFAULT nextval('public.admin_accounts_id_seq'::regclass);


--
-- Name: attendance_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records ALTER COLUMN id SET DEFAULT nextval('public.attendance_records_id_seq'::regclass);


--
-- Name: debts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts ALTER COLUMN id SET DEFAULT nextval('public.debts_id_seq'::regclass);


--
-- Name: diagnoses_catalog id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses_catalog ALTER COLUMN id SET DEFAULT nextval('public.diagnoses_catalog_id_seq'::regclass);


--
-- Name: drawer_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drawer_transactions ALTER COLUMN id SET DEFAULT nextval('public.drawer_transactions_id_seq'::regclass);


--
-- Name: drawers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drawers ALTER COLUMN id SET DEFAULT nextval('public.drawers_id_seq'::regclass);


--
-- Name: employee_advances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_advances ALTER COLUMN id SET DEFAULT nextval('public.employee_advances_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: external_debts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_debts ALTER COLUMN id SET DEFAULT nextval('public.external_debts_id_seq'::regclass);


--
-- Name: insurance_companies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_companies ALTER COLUMN id SET DEFAULT nextval('public.insurance_companies_id_seq'::regclass);


--
-- Name: inventory_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items ALTER COLUMN id SET DEFAULT nextval('public.inventory_items_id_seq'::regclass);


--
-- Name: lab_inventory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_inventory ALTER COLUMN id SET DEFAULT nextval('public.lab_inventory_id_seq'::regclass);


--
-- Name: lab_inventory_params id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_inventory_params ALTER COLUMN id SET DEFAULT nextval('public.lab_inventory_params_id_seq'::regclass);


--
-- Name: lab_inventory_tests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_inventory_tests ALTER COLUMN id SET DEFAULT nextval('public.lab_inventory_tests_id_seq'::regclass);


--
-- Name: lab_test_normal_ranges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_normal_ranges ALTER COLUMN id SET DEFAULT nextval('public.lab_test_normal_ranges_id_seq'::regclass);


--
-- Name: lab_tests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_tests ALTER COLUMN id SET DEFAULT nextval('public.lab_tests_id_seq'::regclass);


--
-- Name: patient_debts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_debts ALTER COLUMN id SET DEFAULT nextval('public.patient_debts_id_seq'::regclass);


--
-- Name: patient_delete_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_delete_requests ALTER COLUMN id SET DEFAULT nextval('public.patient_delete_requests_id_seq'::regclass);


--
-- Name: patient_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_sessions ALTER COLUMN id SET DEFAULT nextval('public.patient_sessions_id_seq'::regclass);


--
-- Name: payment_vouchers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_vouchers ALTER COLUMN id SET DEFAULT nextval('public.payment_vouchers_id_seq'::regclass);


--
-- Name: purchase_request_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_request_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_request_items_id_seq'::regclass);


--
-- Name: purchase_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_requests ALTER COLUMN id SET DEFAULT nextval('public.purchase_requests_id_seq'::regclass);


--
-- Name: queues id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queues ALTER COLUMN id SET DEFAULT nextval('public.queues_id_seq'::regclass);


--
-- Name: rad_catalog id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rad_catalog ALTER COLUMN id SET DEFAULT nextval('public.rad_catalog_id_seq'::regclass);


--
-- Name: rad_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rad_images ALTER COLUMN id SET DEFAULT nextval('public.rad_images_id_seq'::regclass);


--
-- Name: receipt_vouchers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_vouchers ALTER COLUMN id SET DEFAULT nextval('public.receipt_vouchers_id_seq'::regclass);


--
-- Name: session_diagnoses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_diagnoses ALTER COLUMN id SET DEFAULT nextval('public.session_diagnoses_id_seq'::regclass);


--
-- Name: session_lab_refs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_lab_refs ALTER COLUMN id SET DEFAULT nextval('public.session_lab_refs_id_seq'::regclass);


--
-- Name: session_medications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_medications ALTER COLUMN id SET DEFAULT nextval('public.session_medications_id_seq'::regclass);


--
-- Name: session_rad_refs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_rad_refs ALTER COLUMN id SET DEFAULT nextval('public.session_rad_refs_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: sidebar_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sidebar_settings ALTER COLUMN id SET DEFAULT nextval('public.sidebar_settings_id_seq'::regclass);


--
-- Name: staff_advance_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_advance_requests ALTER COLUMN id SET DEFAULT nextval('public.staff_advance_requests_id_seq'::regclass);


--
-- Name: staff_dept_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_dept_permissions ALTER COLUMN id SET DEFAULT nextval('public.staff_dept_permissions_id_seq'::regclass);


--
-- Name: staff_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_members ALTER COLUMN id SET DEFAULT nextval('public.staff_members_id_seq'::regclass);


--
-- Name: surgery_clinic_inventory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surgery_clinic_inventory ALTER COLUMN id SET DEFAULT nextval('public.surgery_clinic_inventory_id_seq'::regclass);


--
-- Name: surgery_clinic_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surgery_clinic_items ALTER COLUMN id SET DEFAULT nextval('public.surgery_clinic_items_id_seq'::regclass);


--
-- Name: admin_accounts admin_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT admin_accounts_pkey PRIMARY KEY (id);


--
-- Name: admin_accounts admin_accounts_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT admin_accounts_username_key UNIQUE (username);


--
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- Name: debts debts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: diagnoses_catalog diagnoses_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses_catalog
    ADD CONSTRAINT diagnoses_catalog_pkey PRIMARY KEY (id);


--
-- Name: drawer_transactions drawer_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drawer_transactions
    ADD CONSTRAINT drawer_transactions_pkey PRIMARY KEY (id);


--
-- Name: drawers drawers_dept_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drawers
    ADD CONSTRAINT drawers_dept_key UNIQUE (dept);


--
-- Name: drawers drawers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drawers
    ADD CONSTRAINT drawers_pkey PRIMARY KEY (id);


--
-- Name: employee_advances employee_advances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_advances
    ADD CONSTRAINT employee_advances_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: external_debts external_debts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_debts
    ADD CONSTRAINT external_debts_pkey PRIMARY KEY (id);


--
-- Name: insurance_companies insurance_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_companies
    ADD CONSTRAINT insurance_companies_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: lab_inventory_params lab_inventory_params_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_inventory_params
    ADD CONSTRAINT lab_inventory_params_pkey PRIMARY KEY (id);


--
-- Name: lab_inventory lab_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_inventory
    ADD CONSTRAINT lab_inventory_pkey PRIMARY KEY (id);


--
-- Name: lab_inventory_tests lab_inventory_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_inventory_tests
    ADD CONSTRAINT lab_inventory_tests_pkey PRIMARY KEY (id);


--
-- Name: lab_test_normal_ranges lab_test_normal_ranges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_normal_ranges
    ADD CONSTRAINT lab_test_normal_ranges_pkey PRIMARY KEY (id);


--
-- Name: lab_tests lab_tests_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_tests
    ADD CONSTRAINT lab_tests_code_key UNIQUE (code);


--
-- Name: lab_tests lab_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_tests
    ADD CONSTRAINT lab_tests_pkey PRIMARY KEY (id);


--
-- Name: patient_debts patient_debts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_debts
    ADD CONSTRAINT patient_debts_pkey PRIMARY KEY (id);


--
-- Name: patient_delete_requests patient_delete_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_delete_requests
    ADD CONSTRAINT patient_delete_requests_pkey PRIMARY KEY (id);


--
-- Name: patient_sessions patient_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_sessions
    ADD CONSTRAINT patient_sessions_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payment_vouchers payment_vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_vouchers
    ADD CONSTRAINT payment_vouchers_pkey PRIMARY KEY (id);


--
-- Name: payment_vouchers payment_vouchers_voucher_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_vouchers
    ADD CONSTRAINT payment_vouchers_voucher_no_key UNIQUE (voucher_no);


--
-- Name: purchase_request_items purchase_request_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_request_items
    ADD CONSTRAINT purchase_request_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_requests purchase_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_pkey PRIMARY KEY (id);


--
-- Name: queues queues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_pkey PRIMARY KEY (id);


--
-- Name: rad_catalog rad_catalog_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rad_catalog
    ADD CONSTRAINT rad_catalog_code_key UNIQUE (code);


--
-- Name: rad_catalog rad_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rad_catalog
    ADD CONSTRAINT rad_catalog_pkey PRIMARY KEY (id);


--
-- Name: rad_images rad_images_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rad_images
    ADD CONSTRAINT rad_images_code_key UNIQUE (code);


--
-- Name: rad_images rad_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rad_images
    ADD CONSTRAINT rad_images_pkey PRIMARY KEY (id);


--
-- Name: receipt_vouchers receipt_vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_vouchers
    ADD CONSTRAINT receipt_vouchers_pkey PRIMARY KEY (id);


--
-- Name: receipt_vouchers receipt_vouchers_voucher_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_vouchers
    ADD CONSTRAINT receipt_vouchers_voucher_no_key UNIQUE (voucher_no);


--
-- Name: session_diagnoses session_diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_diagnoses
    ADD CONSTRAINT session_diagnoses_pkey PRIMARY KEY (id);


--
-- Name: session_lab_refs session_lab_refs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_lab_refs
    ADD CONSTRAINT session_lab_refs_pkey PRIMARY KEY (id);


--
-- Name: session_medications session_medications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_medications
    ADD CONSTRAINT session_medications_pkey PRIMARY KEY (id);


--
-- Name: session_rad_refs session_rad_refs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_rad_refs
    ADD CONSTRAINT session_rad_refs_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sidebar_settings sidebar_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sidebar_settings
    ADD CONSTRAINT sidebar_settings_pkey PRIMARY KEY (id);


--
-- Name: sms_settings sms_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_settings
    ADD CONSTRAINT sms_settings_pkey PRIMARY KEY (id);


--
-- Name: staff_advance_requests staff_advance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_advance_requests
    ADD CONSTRAINT staff_advance_requests_pkey PRIMARY KEY (id);


--
-- Name: staff_dept_permissions staff_dept_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_dept_permissions
    ADD CONSTRAINT staff_dept_permissions_pkey PRIMARY KEY (id);


--
-- Name: staff_dept_permissions staff_dept_permissions_staff_id_dept_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_dept_permissions
    ADD CONSTRAINT staff_dept_permissions_staff_id_dept_key UNIQUE (staff_id, dept);


--
-- Name: staff_members staff_members_national_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT staff_members_national_id_key UNIQUE (national_id);


--
-- Name: staff_members staff_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT staff_members_pkey PRIMARY KEY (id);


--
-- Name: staff_members staff_members_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT staff_members_username_key UNIQUE (username);


--
-- Name: surgery_clinic_inventory surgery_clinic_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surgery_clinic_inventory
    ADD CONSTRAINT surgery_clinic_inventory_pkey PRIMARY KEY (id);


--
-- Name: surgery_clinic_items surgery_clinic_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surgery_clinic_items
    ADD CONSTRAINT surgery_clinic_items_pkey PRIMARY KEY (id);


--
-- Name: idx_advance_reqs_staff; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_advance_reqs_staff ON public.staff_advance_requests USING btree (staff_id);


--
-- Name: idx_advance_reqs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_advance_reqs_status ON public.staff_advance_requests USING btree (status);


--
-- Name: idx_attendance_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_date ON public.attendance_records USING btree (date);


--
-- Name: idx_attendance_dept; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_dept ON public.attendance_records USING btree (dept);


--
-- Name: idx_attendance_emp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_emp ON public.attendance_records USING btree (emp_id);


--
-- Name: idx_debts_dept; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debts_dept ON public.debts USING btree (dept);


--
-- Name: idx_debts_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debts_patient ON public.patient_debts USING btree (patient_id);


--
-- Name: idx_debts_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debts_patient_id ON public.debts USING btree (patient_id);


--
-- Name: idx_diag_dept; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_diag_dept ON public.diagnoses_catalog USING btree (dept);


--
-- Name: idx_drawer_tx_cat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drawer_tx_cat ON public.drawer_transactions USING btree (category);


--
-- Name: idx_drawer_tx_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drawer_tx_date ON public.drawer_transactions USING btree (tx_date);


--
-- Name: idx_drawer_tx_dept; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drawer_tx_dept ON public.drawer_transactions USING btree (dept);


--
-- Name: idx_drawer_tx_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drawer_tx_type ON public.drawer_transactions USING btree (type);


--
-- Name: idx_invoices_dept; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_dept ON public.invoices USING btree (dept);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_lab_tests_cat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_tests_cat ON public.lab_tests USING btree (category);


--
-- Name: idx_lab_tests_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_tests_category ON public.lab_tests USING btree (category);


--
-- Name: idx_lab_tests_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_tests_code ON public.lab_tests USING btree (code);


--
-- Name: idx_normal_ranges_test; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_normal_ranges_test ON public.lab_test_normal_ranges USING btree (test_id);


--
-- Name: idx_patients_dept; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_dept ON public.patients USING btree (dept);


--
-- Name: idx_patients_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_name ON public.patients USING btree (name);


--
-- Name: idx_patients_national_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_national_id ON public.patients USING btree (national_id);


--
-- Name: idx_patients_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_phone ON public.patients USING btree (phone);


--
-- Name: idx_purch_reqs_dept; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purch_reqs_dept ON public.purchase_requests USING btree (dept);


--
-- Name: idx_purch_reqs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purch_reqs_status ON public.purchase_requests USING btree (status);


--
-- Name: idx_rad_catalog_device; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rad_catalog_device ON public.rad_catalog USING btree (device);


--
-- Name: idx_rad_images_device; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rad_images_device ON public.rad_images USING btree (device);


--
-- Name: idx_sess_diag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sess_diag ON public.session_diagnoses USING btree (session_id);


--
-- Name: idx_sess_med; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sess_med ON public.session_medications USING btree (session_id);


--
-- Name: idx_session_diagnoses_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_diagnoses_session ON public.session_diagnoses USING btree (session_id);


--
-- Name: idx_session_lab_refs_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_lab_refs_session ON public.session_lab_refs USING btree (session_id);


--
-- Name: idx_session_medications_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_medications_session ON public.session_medications USING btree (session_id);


--
-- Name: idx_session_rad_refs_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_rad_refs_session ON public.session_rad_refs USING btree (session_id);


--
-- Name: idx_sessions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_date ON public.sessions USING btree (date);


--
-- Name: idx_sessions_dept; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_dept ON public.sessions USING btree (dept);


--
-- Name: idx_sessions_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_patient ON public.patient_sessions USING btree (patient_id);


--
-- Name: idx_sessions_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_patient_id ON public.sessions USING btree (patient_id);


--
-- Name: idx_staff_perms_staff; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_perms_staff ON public.staff_dept_permissions USING btree (staff_id);


--
-- Name: idx_staff_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_status ON public.staff_members USING btree (status);


--
-- Name: idx_staff_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_username ON public.staff_members USING btree (username);


--
-- Name: attendance_records attendance_records_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: debts debts_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: debts debts_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: diagnoses_catalog diagnoses_catalog_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses_catalog
    ADD CONSTRAINT diagnoses_catalog_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: drawer_transactions drawer_transactions_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drawer_transactions
    ADD CONSTRAINT drawer_transactions_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: drawers drawers_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drawers
    ADD CONSTRAINT drawers_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: employee_advances employee_advances_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_advances
    ADD CONSTRAINT employee_advances_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: employees employees_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: invoices invoices_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: lab_inventory_params lab_inventory_params_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_inventory_params
    ADD CONSTRAINT lab_inventory_params_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.lab_inventory(id) ON DELETE CASCADE;


--
-- Name: lab_inventory_tests lab_inventory_tests_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_inventory_tests
    ADD CONSTRAINT lab_inventory_tests_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.lab_inventory(id) ON DELETE CASCADE;


--
-- Name: lab_test_normal_ranges lab_test_normal_ranges_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_test_normal_ranges
    ADD CONSTRAINT lab_test_normal_ranges_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.lab_tests(id) ON DELETE CASCADE;


--
-- Name: patient_debts patient_debts_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_debts
    ADD CONSTRAINT patient_debts_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: patient_debts patient_debts_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_debts
    ADD CONSTRAINT patient_debts_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_delete_requests patient_delete_requests_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_delete_requests
    ADD CONSTRAINT patient_delete_requests_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_delete_requests patient_delete_requests_request_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_delete_requests
    ADD CONSTRAINT patient_delete_requests_request_dept_fkey FOREIGN KEY (request_dept) REFERENCES public.departments(id);


--
-- Name: patient_sessions patient_sessions_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_sessions
    ADD CONSTRAINT patient_sessions_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: patient_sessions patient_sessions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_sessions
    ADD CONSTRAINT patient_sessions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patients patients_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: purchase_request_items purchase_request_items_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_request_items
    ADD CONSTRAINT purchase_request_items_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.purchase_requests(id) ON DELETE CASCADE;


--
-- Name: purchase_requests purchase_requests_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_requests
    ADD CONSTRAINT purchase_requests_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: session_diagnoses session_diagnoses_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_diagnoses
    ADD CONSTRAINT session_diagnoses_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: session_lab_refs session_lab_refs_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_lab_refs
    ADD CONSTRAINT session_lab_refs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: session_medications session_medications_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_medications
    ADD CONSTRAINT session_medications_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: session_rad_refs session_rad_refs_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_rad_refs
    ADD CONSTRAINT session_rad_refs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: staff_advance_requests staff_advance_requests_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_advance_requests
    ADD CONSTRAINT staff_advance_requests_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: staff_advance_requests staff_advance_requests_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_advance_requests
    ADD CONSTRAINT staff_advance_requests_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff_members(id);


--
-- Name: staff_dept_permissions staff_dept_permissions_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_dept_permissions
    ADD CONSTRAINT staff_dept_permissions_dept_fkey FOREIGN KEY (dept) REFERENCES public.departments(id);


--
-- Name: staff_dept_permissions staff_dept_permissions_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_dept_permissions
    ADD CONSTRAINT staff_dept_permissions_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff_members(id) ON DELETE CASCADE;


--
-- Name: staff_members staff_members_primary_dept_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT staff_members_primary_dept_fkey FOREIGN KEY (primary_dept) REFERENCES public.departments(id);


-- ── Extra tables created at runtime via server.js migrations ────────────────

CREATE TABLE IF NOT EXISTS public.suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'مستلزمات طبية',
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rehab_services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL DEFAULT 'تأهيل عظمي ومفصلي',
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_cost NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rehab_plans (
    id SERIAL PRIMARY KEY,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    total_sessions INT NOT NULL DEFAULT 1,
    completed_sessions INT NOT NULL DEFAULT 0,
    price_per_session NUMERIC(10,2) DEFAULT 0,
    plan_price NUMERIC(10,2) DEFAULT 0,
    pricing_mode TEXT DEFAULT 'per-session',
    specialist TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    start_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rehab_queue_entries (
    id SERIAL PRIMARY KEY,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    plan_id INT,
    diagnosis TEXT,
    specialist TEXT,
    session_number INT DEFAULT 1,
    session_time TEXT,
    session_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    therapist_notes TEXT,
    session_result TEXT,
    gross_motor_skills TEXT,
    fine_motor_skills TEXT,
    sensory_condition TEXT,
    adl_activities TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.patient_reminders (
    id SERIAL PRIMARY KEY,
    patient_name TEXT NOT NULL,
    source TEXT,
    arrival_date DATE,
    procurement_date DATE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.broadcast_notices (
    id INT PRIMARY KEY DEFAULT 1,
    message TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_notices (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    target_staff_id INT REFERENCES public.staff_members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_notice_reads (
    id SERIAL PRIMARY KEY,
    notice_id INT NOT NULL REFERENCES public.staff_notices(id) ON DELETE CASCADE,
    staff_id INT NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (notice_id, staff_id)
);

CREATE TABLE IF NOT EXISTS public.backup_drives (
    id SERIAL PRIMARY KEY,
    slot SMALLINT UNIQUE CHECK (slot IN (1,2,3)),
    name VARCHAR(200),
    credentials_json TEXT,
    folder_id VARCHAR(200),
    last_backup TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'inactive',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.backup_notifications (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Missing columns added at runtime (idempotent ALTER TABLE) ─────────────────

ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS assigned_depts TEXT DEFAULT '[]';
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS percentage_depts TEXT DEFAULT '[]';
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS pay_from_depts TEXT DEFAULT '[]';
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS can_attendance BOOLEAN DEFAULT false;

ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_vouchers BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_delete_patient BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_edit_patient BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_edit_date BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_edit_voucher BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_delete_voucher BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_register_patient BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_print_export BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_queue BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_queue_add BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_queue_edit_status BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_queue_delete BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_catalog_add BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_catalog_edit BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_catalog_delete BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_inventory_add BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_inventory_edit BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_inventory_delete BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_attendance_dept BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_attendance_view BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_attendance_mark BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_staff_advance BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_staff_advance_submit BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_surgery_clinic_inv BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_dept_profit BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_dept_debts BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_settle_debts BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_dept_revenue BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_dept_expenses BOOLEAN DEFAULT false;
ALTER TABLE public.staff_dept_permissions ADD COLUMN IF NOT EXISTS can_add_expense BOOLEAN DEFAULT false;

-- Drop broken FK constraints that frontend sends display names instead of dept IDs
ALTER TABLE public.debts DROP CONSTRAINT IF EXISTS debts_dept_fkey;
ALTER TABLE public.patient_debts DROP CONSTRAINT IF EXISTS patient_debts_dept_fkey;

--
-- PostgreSQL database dump complete
--

\unrestrict 91VmopUyHlg5CJx5LcCqnFUvHPNajdpQoywLcVxwn5S833Sc07Ou743ZjZuveAr

