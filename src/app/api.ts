const BASE = window.location.hostname === 'system.mjcc.ps'
  ? 'https://system.mjcc.ps/api'
  : '/api';

export interface PrintSettingsRow {
  scope: "lab" | "surgery" | "rehab" | "radiology" | "general";
  letterhead_image: string | null;
  margin_top: number;
  margin_right: number;
  margin_bottom: number;
  margin_left: number;
  paper_size: string;
  orientation: string;
  font_size: number;
  font_family: string | null;
  show_signature: boolean;
  with_header: boolean;
}

// Admin session token — set after admin login, sent with admin-only endpoints
let _adminToken: string | null = null;
export function setAdminToken(token: string | null) { _adminToken = token; }
export function getAdminToken() { return _adminToken; }

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };
  if (_adminToken) h["Authorization"] = `Bearer ${_adminToken}`;
  return { ...h, ...(extra as Record<string, string> ?? {}) };
}

async function request<T>(path: string, opts?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: buildHeaders(),
      ...opts,
    });
    if (!res.ok) {
      try { return (await res.json()) as T; } catch { return null; }
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function get<T>(path: string) { return request<T>(path); }
function post<T>(path: string, body: unknown) { return request<T>(path, { method: "POST", body: JSON.stringify(body), headers: buildHeaders() }); }
function put<T>(path: string, body: unknown) { return request<T>(path, { method: "PUT", body: JSON.stringify(body), headers: buildHeaders() }); }
function patch<T>(path: string, body: unknown) { return request<T>(path, { method: "PATCH", body: JSON.stringify(body), headers: buildHeaders() }); }
function del<T>(path: string) { return request<T>(path, { method: "DELETE", headers: buildHeaders() }); }

function parseDateISO(ddmmyyyy: string): string {
  if (!ddmmyyyy) return new Date(Date.now()+3*60*60*1000).toISOString().split("T")[0];
  const parts = ddmmyyyy.split(/[\/\.\-]/);
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  }
  return ddmmyyyy;
}

export type DrawerTxRow = { id: number; dept: string; type: string; title: string; category: string; beneficiary: string | null; amount: number; balance_after: number; tx_time: string | null; tx_date: string; is_auto: boolean; ref_type: string | null; ref_id: string | null; created_at: string; };
export type DrawerRow = { id: number; dept: string; balance: number; opening_balance: number; opening_balance_date: string | null; updated_at: string; };
export type PatientReminderRow = { id: number; patient_name: string; source: string | null; arrival_date: string | null; procurement_date: string | null; status: "pending" | "completed"; created_at: string; };
export type BroadcastNoticeRow = { id: number; message: string | null; updated_at: string | null };

export const api = {
  health: () => get<{ status: string; db: string }>("/health"),

  drawers: {
    getAll: () => get<DrawerRow[]>("/drawers"),
    getById: (id: number) => get<DrawerRow>(`/drawers/${id}`),
    getByDept: (dept: string) => get<DrawerRow>(`/drawers/dept/${dept}`),
    update: (id: number, d: unknown) => put<DrawerRow>(`/drawers/${id}`, d),
    delete: (id: number) => del<{ success: boolean }>(`/drawers/${id}`),
    reset: () => del<{ success: boolean; message: string }>("/drawers/reset"),
    upsert: (dept: string, balance: number) =>
      post<DrawerRow>("/drawers", { dept, balance }),
    updateBalance: (dept: string, balance: number) =>
      post<DrawerRow>("/drawers", { dept, balance }),
    transactions: {
      getAll: (dept?: string) => get<DrawerTxRow[]>(`/drawers/transactions/all${dept ? `?dept=${dept}` : ""}`),
      getById: (id: number) => get<DrawerTxRow>(`/drawers/transactions/${id}`),
      // balance_after is OPTIONAL and ignored by the server — the backend
      // ledger computes the authoritative running balance. It is kept optional
      // only for backward compatibility with older callers.
      create: (tx: { dept: string; type: "in"|"out"; title: string; category: string; beneficiary?: string; amount: number; balance_after?: number; tx_time?: string; tx_date: string; is_auto?: boolean; is_opening_balance?: boolean; }) =>
        post<DrawerTxRow>("/drawers/transactions", tx),
      update: (id: number, tx: unknown) => put<DrawerTxRow>(`/drawers/transactions/${id}`, tx),
      delete: (id: number) => del<{ success: boolean }>(`/drawers/transactions/${id}`),
    },
  },

  patients: {
    getAll: (q?: string) => get<unknown[]>(`/patients${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    getById: (id: string) => get<unknown>(`/patients/${id}`),
    create: (p: unknown) => post<unknown>("/patients", p),
    update: (id: string, p: unknown) => put<unknown>(`/patients/${id}`, p),
    delete: (id: string) => del<unknown>(`/patients/${id}`),
    cascadeDelete: (id: string) => del<unknown>(`/patients/cascade/${id}`),
    deleteRequests: {
      getAll: () => get<unknown[]>("/patients/delete-requests/all"),
      getById: (id: number) => get<unknown>(`/patients/delete-requests/${id}`),
      create: (r: unknown) => post<unknown>("/patients/delete-requests", r),
      update: (id: number, r: unknown) => put<unknown>(`/patients/delete-requests/${id}`, r),
      delete: (id: number) => del<unknown>(`/patients/delete-requests/${id}`),
    },
  },

  sessions: {
    getAll: (params?: { patient_id?: string; dept?: string }) => {
      const q = new URLSearchParams(params as Record<string,string>).toString();
      return get<unknown[]>(`/sessions${q ? `?${q}` : ""}`);
    },
    getById: (id: number) => get<unknown>(`/sessions/${id}`),
    create: (s: unknown) => post<unknown>("/sessions", s),
    update: (id: number, s: unknown) => put<unknown>(`/sessions/${id}`, s),
    delete: (id: number) => del<unknown>(`/sessions/${id}`),
    diagnoses: {
      getAll: (sessionId: number) => get<unknown[]>(`/sessions/${sessionId}/diagnoses`),
      create: (sessionId: number, d: unknown) => post<unknown>(`/sessions/${sessionId}/diagnoses`, d),
      delete: (sessionId: number, id: number) => del<unknown>(`/sessions/${sessionId}/diagnoses/${id}`),
    },
    medications: {
      getAll: (sessionId: number) => get<unknown[]>(`/sessions/${sessionId}/medications`),
      create: (sessionId: number, m: unknown) => post<unknown>(`/sessions/${sessionId}/medications`, m),
      delete: (sessionId: number, id: number) => del<unknown>(`/sessions/${sessionId}/medications/${id}`),
    },
    labRefs: {
      getAll: (sessionId: number) => get<unknown[]>(`/sessions/${sessionId}/lab-refs`),
      create: (sessionId: number, r: unknown) => post<unknown>(`/sessions/${sessionId}/lab-refs`, r),
      delete: (sessionId: number, id: number) => del<unknown>(`/sessions/${sessionId}/lab-refs/${id}`),
    },
    radRefs: {
      getAll: (sessionId: number) => get<unknown[]>(`/sessions/${sessionId}/rad-refs`),
      create: (sessionId: number, r: unknown) => post<unknown>(`/sessions/${sessionId}/rad-refs`, r),
      delete: (sessionId: number, id: number) => del<unknown>(`/sessions/${sessionId}/rad-refs/${id}`),
    },
    files: {
      getAll: (sessionId: number) => get<Array<{ id: number; filename: string; originalname: string; size: number }>>(`/sessions/${sessionId}/files`),
      delete: (sessionId: number, fileId: number) => del<unknown>(`/sessions/${sessionId}/files/${fileId}`),
      upload: async (sessionId: number, fd: FormData) => {
        const _tok = getAdminToken();
        const headers: Record<string, string> = {};
        if (_tok) headers["Authorization"] = `Bearer ${_tok}`;
        const res = await fetch(`${BASE}/sessions/${sessionId}/files`, { method: "POST", headers, body: fd });
        if (!res.ok) throw new Error("Upload failed");
        return res.json();
      },
    },
  },

  finance: {
    invoices: {
      getAll: (dept?: string) => get<unknown[]>(`/finance/invoices${dept ? `?dept=${dept}` : ""}`),
      getById: (id: string) => get<unknown>(`/finance/invoices/${id}`),
      create: (inv: unknown) => post<unknown>("/finance/invoices", inv),
      update: (id: string, inv: unknown) => put<unknown>(`/finance/invoices/${id}`, inv),
      delete: (id: string) => del<unknown>(`/finance/invoices/${id}`),
    },
    debts: {
      getAll: (dept?: string) => get<unknown[]>(`/finance/debts${dept ? `?dept=${dept}` : ""}`),
      getById: (id: number) => get<unknown>(`/finance/debts/${id}`),
      create: (d: unknown) => post<unknown>("/finance/debts", d),
      update: (id: number, d: unknown) => put<unknown>(`/finance/debts/${id}`, d),
      delete: (id: number) => del<unknown>(`/finance/debts/${id}`),
    },
    externalDebts: {
      getAll: () => get<unknown[]>("/finance/external-debts"),
      getById: (id: number) => get<unknown>(`/finance/external-debts/${id}`),
      create: (d: unknown) => post<unknown>("/finance/external-debts", d),
      update: (id: number, d: unknown) => put<unknown>(`/finance/external-debts/${id}`, d),
      delete: (id: number) => del<unknown>(`/finance/external-debts/${id}`),
    },
    purchaseRequests: {
      getAll: (dept?: string) => get<unknown[]>(`/finance/purchase-requests${dept ? `?dept=${dept}` : ""}`),
      getById: (id: number) => get<unknown>(`/finance/purchase-requests/${id}`),
      create: (r: unknown) => post<unknown>("/finance/purchase-requests", r),
      update: (id: number, r: unknown) => put<unknown>(`/finance/purchase-requests/${id}`, r),
      delete: (id: number) => del<unknown>(`/finance/purchase-requests/${id}`),
      items: {
        getAll: (requestId: number) => get<unknown[]>(`/finance/purchase-requests/${requestId}/items`),
        create: (requestId: number, item: unknown) => post<unknown>(`/finance/purchase-requests/${requestId}/items`, item),
        update: (id: number, item: unknown) => put<unknown>(`/finance/purchase-items/${id}`, item),
        delete: (id: number) => del<unknown>(`/finance/purchase-items/${id}`),
      },
    },
    receiptVouchers: {
      getAll: () => get<unknown[]>("/finance/receipt-vouchers"),
      getById: (id: number) => get<unknown>(`/finance/receipt-vouchers/${id}`),
      create: (v: unknown) => post<unknown>("/finance/receipt-vouchers", v),
      update: (id: number, v: unknown) => put<unknown>(`/finance/receipt-vouchers/${id}`, v),
      delete: (id: number) => del<unknown>(`/finance/receipt-vouchers/${id}`),
    },
    paymentVouchers: {
      getAll: () => get<unknown[]>("/finance/payment-vouchers"),
      getById: (id: number) => get<unknown>(`/finance/payment-vouchers/${id}`),
      create: (v: unknown) => post<unknown>("/finance/payment-vouchers", v),
      update: (id: number, v: unknown) => put<unknown>(`/finance/payment-vouchers/${id}`, v),
      delete: (id: number) => del<unknown>(`/finance/payment-vouchers/${id}`),
    },
  },

  staff: {
    getAll: () => get<unknown[]>("/staff"),
    getById: (id: number) => get<unknown>(`/staff/${id}`),
    create: (s: unknown) => post<unknown>("/staff", s),
    update: (id: number, s: unknown) => put<unknown>(`/staff/${id}`, s),
    patchCredentials: (id: number, s: { username: string; new_password?: string }) =>
      patch<unknown>(`/staff/${id}/credentials`, s),
    delete: (id: number) => del<unknown>(`/staff/${id}`),
    permissions: {
      getByStaff: (staffId: number) => get<unknown[]>(`/staff/${staffId}/permissions`),
      upsert: (staffId: number, dept: string, perms: unknown) =>
        post<unknown>(`/staff/${staffId}/permissions`, { dept, ...perms as object }),
      update: (staffId: number, dept: string, perms: unknown) =>
        put<unknown>(`/staff/${staffId}/permissions/${dept}`, perms),
      delete: (staffId: number, dept: string) => del<unknown>(`/staff/${staffId}/permissions/${dept}`),
    },
    employees: {
      getAll: (dept?: string) => get<unknown[]>(`/staff/employees/all${dept ? `?dept=${dept}` : ""}`),
      getById: (id: number) => get<unknown>(`/staff/employees/${id}`),
      create: (e: unknown) => post<unknown>("/staff/employees", e),
      update: (id: number, e: unknown) => put<unknown>(`/staff/employees/${id}`, e),
      delete: (id: number) => del<unknown>(`/staff/employees/${id}`),
    },
    advances: {
      getAll: (dept?: string) => get<unknown[]>(`/staff/advances/all${dept ? `?dept=${dept}` : ""}`),
      getById: (id: number) => get<unknown>(`/staff/advances/${id}`),
      create: (a: unknown) => post<unknown>("/staff/advances", a),
      update: (id: number, a: unknown) => put<unknown>(`/staff/advances/${id}`, a),
      delete: (id: number) => del<unknown>(`/staff/advances/${id}`),
    },
    attendance: {
      getAll: (dept?: string) => get<unknown[]>(`/staff/attendance/all${dept ? `?dept=${dept}` : ""}`),
      getById: (id: number) => get<unknown>(`/staff/attendance/${id}`),
      create: (r: unknown) => post<unknown>("/staff/attendance", r),
      update: (id: number, r: unknown) => put<unknown>(`/staff/attendance/${id}`, r),
      delete: (id: number) => del<unknown>(`/staff/attendance/${id}`),
    },
    advanceRequests: {
      getAll: () => get<unknown[]>("/staff/advance-requests"),
      create: (r: unknown) => post<unknown>("/staff/advance-requests", r),
      review: (id: number, r: unknown) => patch<unknown>(`/staff/advance-requests/${id}`, r),
      delete: (id: number) => del<unknown>(`/staff/advance-requests/${id}`),
    },
  },

  lab: {
    tests: {
      getAll: () => get<unknown[]>("/lab/tests"),
      getById: (id: number) => get<unknown>(`/lab/tests/${id}`),
      create: (t: unknown) => post<unknown>("/lab/tests", t),
      update: (id: number, t: unknown) => put<unknown>(`/lab/tests/${id}`, t),
      delete: (id: number) => del<unknown>(`/lab/tests/${id}`),
      ranges: {
        getAll: (testId: number) => get<unknown[]>(`/lab/tests/${testId}/ranges`),
        create: (testId: number, r: unknown) => post<unknown>(`/lab/tests/${testId}/ranges`, r),
        update: (id: number, r: unknown) => put<unknown>(`/lab/ranges/${id}`, r),
        delete: (id: number) => del<unknown>(`/lab/ranges/${id}`),
      },
    },
    inventory: {
      getAll: () => get<unknown[]>("/lab/inventory"),
      getById: (id: number) => get<unknown>(`/lab/inventory/${id}`),
      create: (i: unknown) => post<unknown>("/lab/inventory", i),
      update: (id: number, i: unknown) => put<unknown>(`/lab/inventory/${id}`, i),
      delete: (id: number) => del<unknown>(`/lab/inventory/${id}`),
      tests: {
        create: (inventoryId: number, t: unknown) => post<unknown>(`/lab/inventory/${inventoryId}/tests`, t),
        delete: (id: number) => del<unknown>(`/lab/inventory/tests/${id}`),
      },
      params: {
        create: (inventoryId: number, p: unknown) => post<unknown>(`/lab/inventory/${inventoryId}/params`, p),
        update: (id: number, p: unknown) => put<unknown>(`/lab/inventory/params/${id}`, p),
        delete: (id: number) => del<unknown>(`/lab/inventory/params/${id}`),
      },
    },
  },

  radiology: {
    images: {
      getAll: () => get<unknown[]>("/radiology"),
      getById: (id: number) => get<unknown>(`/radiology/${id}`),
      create: (img: unknown) => post<unknown>("/radiology", img),
      update: (id: number, img: unknown) => put<unknown>(`/radiology/${id}`, img),
      delete: (id: number) => del<unknown>(`/radiology/${id}`),
    },
  },

  departments: {
    getAll: () => get<unknown[]>("/departments"),
    getById: (id: string) => get<unknown>(`/departments/${id}`),
    create: (d: unknown) => post<unknown>("/departments", d),
    update: (id: string, d: unknown) => put<unknown>(`/departments/${id}`, d),
    delete: (id: string) => del<unknown>(`/departments/${id}`),
  },

  settings: {
    insurance: {
      getAll: () => get<unknown[]>("/settings/insurance"),
      getById: (id: number) => get<unknown>(`/settings/insurance/${id}`),
      create: (ins: unknown) => post<unknown>("/settings/insurance", ins),
      update: (id: number, ins: unknown) => put<unknown>(`/settings/insurance/${id}`, ins),
      delete: (id: number) => del<unknown>(`/settings/insurance/${id}`),
    },
    admins: {
      getAll: () => get<unknown[]>("/settings/admins"),
      getById: (id: number) => get<unknown>(`/settings/admins/${id}`),
      create: (a: unknown) => post<unknown>("/settings/admins", a),
      update: (id: number, a: unknown) => put<unknown>(`/settings/admins/${id}`, a),
      delete: (id: number) => del<unknown>(`/settings/admins/${id}`),
      patchCredentials: (id: number, body: { username: string; display_name?: string; new_password?: string }) =>
        patch<unknown>(`/settings/admins/${id}/credentials`, body),
    },
    sidebar: {
      get: () => get<unknown>("/settings/sidebar"),
      update: (s: unknown) => put<unknown>("/settings/sidebar", s),
    },
    print: {
      // scope: "lab" | "surgery" | "rehab" | "radiology" | "general"
      getAll: () => get<PrintSettingsRow[]>("/settings/print"),
      getByScope: (scope: string) => get<PrintSettingsRow>(`/settings/print/${scope}`),
      update: (scope: string, s: Partial<PrintSettingsRow>) =>
        put<PrintSettingsRow>(`/settings/print/${scope}`, s),
    },
    auth: {
      adminLogin: (username: string, password: string) =>
        post<{ id: number; username: string; display_name: string; token?: string } | { error: string }>(
          "/settings/auth/login", { username, password }
        ),
      staffLogin: (username: string, password: string) =>
        post<{ token?: string; [k: string]: unknown } | { error: string }>(
          "/settings/auth/staff-login", { username, password }
        ),
    },
  },

  sms: {
    getSettings: () => get<{ provider: string; sender_id: string; enabled: boolean; api_key_masked: string; has_key: boolean }>("/sms/settings"),
    saveSettings: (s: { provider?: string; api_key?: string; sender_id?: string; enabled?: boolean }) =>
      post<{ ok: boolean; message: string }>("/sms/settings", s),
    send: (phone: string, message: string) =>
      post<{ ok: boolean; error?: string; reason?: string }>("/sms/send", { phone, message }),
    test: (phone: string) =>
      post<{ ok: boolean; message?: string; error?: string; reason?: string }>("/sms/test", { phone }),
  },

  diagnoses: {
    getAll: (dept?: string) => get<unknown[]>(`/diagnoses${dept ? `?dept=${encodeURIComponent(dept)}` : ""}`),
    create: (d: unknown) => post<unknown>("/diagnoses", d),
    update: (id: number, d: unknown) => put<unknown>(`/diagnoses/${id}`, d),
    delete: (id: number) => del<unknown>(`/diagnoses/${id}`),
  },

  queues: {
    getAll: (dept?: string) => get<unknown[]>(`/queues${dept ? `?dept=${encodeURIComponent(dept)}` : ""}`),
    create: (entry: { dept: string; patient_id?: string; patient_name: string; patient_num?: number; phone?: string; dest_dept?: string; notes?: string; items?: string[]; queue_time?: string; status?: string }) =>
      post<{ id: number; dept: string; patient_id: string | null; patient_name: string; patient_num: number | null; phone: string | null; dest_dept: string | null; notes: string | null; items: string[]; queue_time: string | null; status: string }>("/queues", entry),
    updateStatus: (id: number, status: string, results?: unknown) => patch<unknown>(`/queues/${id}`, results !== undefined ? { status, results } : { status }),
    delete: (id: number) => del<unknown>(`/queues/${id}`),
    clearDone: (dept: string) => del<unknown>(`/queues/clear-done/${dept}`),
  },

  surgery: {
    inventory: {
      getAll: () => get<unknown[]>("/surgery-inventory"),
      getById: (id: number) => get<unknown>(`/surgery-inventory/${id}`),
      create: (item: unknown) => post<unknown>("/surgery-inventory", item),
      update: (id: number, item: unknown) => put<unknown>(`/surgery-inventory/${id}`, item),
      delete: (id: number) => del<unknown>(`/surgery-inventory/${id}`),
    },
  },

  suppliers: {
    getAll: () => get<unknown[]>("/settings/suppliers"),
    create: (s: unknown) => post<unknown>("/settings/suppliers", s),
    update: (id: number, s: unknown) => put<unknown>(`/settings/suppliers/${id}`, s),
    delete: (id: number) => del<unknown>(`/settings/suppliers/${id}`),
  },

  rehab: {
    services: {
      getAll: () => get<unknown[]>("/rehab/services"),
      create: (s: unknown) => post<unknown>("/rehab/services", s),
      update: (id: number, s: unknown) => put<unknown>(`/rehab/services/${id}`, s),
      delete: (id: number) => del<unknown>(`/rehab/services/${id}`),
    },
    plans: {
      getAll: () => get<unknown[]>("/rehab/plans"),
      create: (p: unknown) => post<unknown>("/rehab/plans", p),
      update: (id: number, p: unknown) => put<unknown>(`/rehab/plans/${id}`, p),
      delete: (id: number) => del<unknown>(`/rehab/plans/${id}`),
    },
    queue: {
      getAll: () => get<unknown[]>("/rehab/queue"),
      create: (e: unknown) => post<unknown>("/rehab/queue", e),
      patch: (id: number, e: unknown) => patch<unknown>(`/rehab/queue/${id}`, e),
      delete: (id: number) => del<unknown>(`/rehab/queue/${id}`),
    },
  },

  backup: {
    exportJSON: () => fetch(`${BASE}/backup/export`, { headers: buildHeaders() as HeadersInit }).then(r => r.ok ? r.blob() : null),
    exportZip: () => fetch(`${BASE}/backup/export`, { headers: buildHeaders() as HeadersInit }).then(r => r.ok ? r.blob() : Promise.reject(new Error("فشل تصدير النسخة الاحتياطية"))),

    local: {
      run: () => post<{ success: boolean; filename: string; size: number; created_at: string }>("/backup/local", {}),
      list: () => get<Array<{ filename: string; size: number; created_at: string }>>("/backup/local/list"),
      restore: (filename: string) => post<{ success: boolean }>(`/backup/local/restore/${encodeURIComponent(filename)}`, {}),
      delete: (filename: string) => del<{ success: boolean }>(`/backup/local/${encodeURIComponent(filename)}`),
    },

    drives: {
      getAll: () => get<Array<{ slot: number; name: string | null; folder_id: string | null; last_backup: string | null; status: string; has_credentials: boolean }>>("/backup/drives"),
      save: (slot: number, data: { name?: string; credentials_json?: string; folder_id?: string }) =>
        post<{ slot: number; name: string | null; folder_id: string | null; last_backup: string | null; status: string; has_credentials: boolean }>("/backup/drives", { slot, ...data }),
      update: (slot: number, data: { name?: string; credentials_json?: string; folder_id?: string }) =>
        put<{ slot: number; name: string | null; folder_id: string | null; last_backup: string | null; status: string; has_credentials: boolean }>(`/backup/drives/${slot}`, data),
      delete: (slot: number) => del<{ success: boolean }>(`/backup/drives/${slot}`),
      backupOne: (slot: number) => post<{ success: boolean; filename?: string }>(`/backup/drive/${slot}`, {}),
      backupAll: () => post<{ results: Array<{ slot: number; success: boolean; error?: string }> }>("/backup/drive/all", {}),
      listBackups: (slot: number) => get<Array<{ id: string; name: string; size: number | null; created_at: string }>>(`/backup/drive/${slot}/list`),
      restore: (slot: number, fileId: string) => post<{ success: boolean; safetyFilename?: string }>(`/backup/restore/drive/${slot}`, { fileId }),
    },

    zip: {
      restore: async (file: File): Promise<{ success: boolean; safetyFilename?: string; error?: string }> => {
        const form = new FormData();
        form.append("file", file);
        const headers: Record<string, string> = {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        };
        if (_adminToken) headers["Authorization"] = `Bearer ${_adminToken}`;
        const res = await fetch(`${BASE}/backup/restore/zip`, { method: "POST", headers, body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "فشل استرداد النسخة من ملف ZIP");
        return data;
      },
    },

    notifications: {
      getAll: () => get<Array<{ id: number; message: string; created_at: string }>>("/backup/notifications"),
      dismiss: (id: number) => del<{ ok: boolean }>(`/backup/notifications/${id}`),
    },
  },

  admin: {
    tables: {
      getAll: () => get<{ table: string; count: number }[]>("/admin/tables"),
      deleteAll: (table: string) => del<{ success: boolean; table: string; deleted: number }>(`/admin/tables/${table}`),
    },
    resetFinancials: () =>
      post<{ success: boolean; message: string; deleted: Record<string, number> }>("/admin/reset-financials", {}),
    executeDelete: (targetCategory: 'patients' | 'financials' | 'all') =>
      post<{ success: boolean; message: string; deleted: Record<string, number> }>("/admin/execute-delete", { targetCategory }),
  },

  reminders: {
    getAll: () => get<PatientReminderRow[]>("/reminders"),
    createBulk: (rows: Array<{ patient_name: string; source?: string; arrival_date?: string; procurement_date?: string }>) =>
      post<PatientReminderRow[]>("/reminders", { reminders: rows }),
    updateStatus: (id: number, status: "pending" | "completed") =>
      put<PatientReminderRow>(`/reminders/${id}`, { status }),
    delete: (id: number) => del<{ ok: boolean }>(`/reminders/${id}`),
  },

  broadcast: {
    get: () => get<BroadcastNoticeRow>("/broadcast"),
    set: (message: string) => put<BroadcastNoticeRow>("/broadcast", { message }),
    clear: () => del<BroadcastNoticeRow>("/broadcast"),
  },

  staffNotices: {
    getAll: () => get<unknown[]>("/staff-notices"),
    getForStaff: (staffId: number) => get<unknown[]>(`/staff-notices/${staffId}`),
    create: (message: string, targetStaffId?: number | null) =>
      post<unknown>("/staff-notices", { message, target_staff_id: targetStaffId ?? null }),
    delete: (noticeId: number) => del<unknown>(`/staff-notices/${noticeId}`),
    markRead: (noticeId: number, staffId: number) =>
      patch<unknown>(`/staff-notices/${noticeId}/read`, { staff_id: staffId }),
  },

  records: {
    delete: (table: string, id: number | string) =>
      del<{ success: boolean; table: string; deleted: string | number }>(`/admin/records/${table}/${id}`),
  },

  financialSummary: (params?: { dept?: string; from?: string; to?: string }) => {
    const qs = params
      ? "?" + Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&")
      : "";
    return get<{
      totalIncome: number;
      totalExpenses: number;
      totalDebts: number;
      netProfit: number;
      breakdown: {
        income: { patients: number; receipts: number; other: number };
        expenses: { salaries: number; advances: number; purchases: number; vouchers: number; externalDebts: number; other: number };
      };
    }>(`/finance/summary${qs}`);
  },

  parseDateISO,
};
