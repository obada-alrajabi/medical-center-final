// ─── CORE TYPES ───────────────────────────────────────────────────────────────

export type ToastItem = { id: number; msg: string; type: "success"|"error"|"warning"|"info" };
export type Route = { screen: string; dept?: string; patientId?: string };
export type PatientRecord = { id:string; name:string; age:string; phone:string; blood:string; insurance:boolean; dept:string; debt:number; date:string; gender?:string; address?:string; chronic?:string; allergy?:string; nationalId?:string; email?:string; notes?:string; insuranceCompany?:string };
export type DrawerTx = { id:number; type:"in"|"out"; title:string; category:string; beneficiary?:string; amount:number; balance:number; time:string; date:string; auto?:boolean };
export type DrawerState = { balance:number; txs:DrawerTx[]; openingBalance?:number; openingBalanceDate?:string };
export type Invoice = { id:string; company:string; companyId?:number; date:string; total:number; paid:number; remaining:number; status:"paid"|"partial"|"unpaid"; dept:string; claimNo?:string; patientId?:string; patientName?:string };
export type Supplier = { id: number; name: string; type: string; phone: string };
export type InsuranceCo = { id:number; name:string; phone:string; discountClinic:number; discountLab:number; discountRad:number };
export type DebtRow = { id:number; patient:string; pid:string; dept:string; amount:number; date:string; days:number; phone:string; smsSent?:boolean };
export type AttendanceRecord = { id:number; empId:string; empName:string; dept:string; date:string; dayName:string; checkIn:string; checkOut:string; totalHours?:number; };
export type AppNotification = { id:string; itemName:string; dept:string; deptLabel:string; qty:number; threshold:number; timestamp:string; };
export type Employee = { id:number; staffId?:number|null; name:string; dept:string; role:string; salary:number; expenses:number; status:"pending"|"calculated"|"paid"; paidDate?:string; commission?:number; netSalary?:number };
// ── breakdown: لقطة "تفاصيل الاحتساب" الكاملة المُجمَّدة وقت الصرف/الإغلاق —
//    نفس الشكل الذي يُرجعه buildBreakdown()/يقبله SalaryBreakdownDetail بالضبط
//    (fixedSalary, deptRows, commissionTotal, shift, daily, vouchers, advances,
//    carriedIn, net)، مخزَّنة كـ blob داخلي غير مُلزَم بنوع صارم هنا ──
export type SalaryPeriod = { id:number; employeeId:number; staffId?:number|null; yearMonth:string; netAmount:number; status:"paid"|"debt_acknowledged"; closedDate:string; carriedIn:number; breakdown?: Record<string, unknown> | null };
export type DailyAttendanceRecord = { id:number; staffId:number; date:string };
export type NormalRange = { param:string; unit:string; min:string; max:string; note:string };
export type LabTestConsumable = { id:number; inventoryId:number; qty:number; name?:string; unit?:string };
export type LabTest = { id:number; code:string; name:string; nameEn:string; cat:string; priceOfficial:number; price:number; consumablesCost:number; priceCost:number; isL2L:boolean; kit:string; kitInventoryId?:number|null; kitQty:number; kitUnit:string; kitThreshold:number; time:string; normalRanges?:NormalRange[]; consumables?:LabTestConsumable[] };
export type RadImage = { id:number; code:string; name:string; device:string; price:number; timeVal:string; timeUnit:string; instructions:string; notes:string };
export type PatientSession = { id:number; patientId:string; dept:string; doctor:string; date:string; diagnoses:string[]; medications:{name:string;dose:string;freq:string;duration:string}[]; notes:string; labRefs:string[]; radRefs:string[]; amount:number; paid:number; debt:number; grossAmount:number };
export type DiagnosisEntry = { id:number; code:string; name:string; category:string; dept?:string };
export type PurchaseItem = { id:number; name:string; qty:number; unit:string; estimatedPrice:number; note:string };
export type PurchaseRequestPayment = { id:number; requestId:number; amount:number; note:string; date:string };
export type PurchaseRequest = { id:number; dept:string; requestedBy:string; date:string; items:PurchaseItem[]; totalAmount:number; paidAmount:number; status:"pending"|"approved"|"rejected"; approvedBy?:string; approvedDate?:string; rejectionReason?:string; note:string; supplier?:string; supplierId?:number; drawerTxId?:number; payments?:PurchaseRequestPayment[]; discountAmount?:number };
export type EmployeeAdvance = { id:number; staffId?:number|null; empName:string; dept:string; amount:number; date:string; note:string; repaid:boolean; repaidDate?:string };
export type StaffAdvanceRequest = { id:number; staffId:number; staffName:string; dept:string; amount:number; date:string; reason:string; status:"pending"|"approved"|"rejected"; reviewedBy?:string; reviewDate?:string; rejectionReason?:string };
export type ExternalDebt = { id:number; dir:"given"|"received"; party:string; amount:number; date:string; note:string; status:"pending"|"settled"; settledDate?:string };
export type AdminAccount = { id:number; username:string; password:string; displayName:string };
export type SidebarSettings = { hiddenSections:string[]; hideRevenueFromStaff:boolean; deptCapacity?:Record<string,number> };

// ─── STAFF & PERMISSIONS TYPES ────────────────────────────────────────────────
export type SalaryType = "fixed"|"percentage"|"both"|"daily"|"shift";
export type DeptPermissions = {
  canView: boolean;
  canOpenPatient: boolean;
  canLabSession: boolean;
  canLabCatalog: boolean;
  canRadSession: boolean;
  canRadCatalog: boolean;
  canPurchaseReqs?: boolean;
  canLabQueue?: boolean;
  canLabInventory?: boolean;
  canRadQueue?: boolean;
  canRehabSession?: boolean;
  canRehabCatalog?: boolean;
  canRehabQueue?: boolean;
  canPrint?: boolean;
  canVouchers?: boolean;
  canDeleteVoucher?: boolean;
  canDeletePurchaseReqs?: boolean;
  canDeletePatient?: boolean;
  canEditPatient?: boolean;
  canEditDate?: boolean;
  canEditSession?: boolean;
  canViewRevenue?: boolean;
  canAddDeposit?: boolean;
  canWithdraw?: boolean;
  canDrawerView?: boolean;
  canDrawerViewBalance?: boolean;
  canDrawerAdjustBalance?: boolean;
  canDrawerViewHistory?: boolean;
  canDrawerViewStats?: boolean;
  canDrawerViewCharts?: boolean;
  canDrawerViewEmployees?: boolean;
  canDrawerViewInvoices?: boolean;
  canDrawerSettleInvoices?: boolean;
  canRegisterPatient?: boolean;
  canPrintExport?: boolean;
  canQueue?: boolean;
  canQueueAdd?: boolean;
  canQueueEditStatus?: boolean;
  canQueueDelete?: boolean;
  canCatalogAdd?: boolean;
  canCatalogEdit?: boolean;
  canCatalogDelete?: boolean;
  canInventoryAdd?: boolean;
  canInventoryEdit?: boolean;
  canInventoryDelete?: boolean;
  canAttendanceDept?: boolean;
  canAttendanceView?: boolean;
  canAttendanceMark?: boolean;
  canStaffAdvance?: boolean;
  canStaffAdvanceSubmit?: boolean;
  canSurgeryClinicInv?: boolean;
  canDeptProfit?: boolean;
  canDeptDebts?: boolean;
  canSettleDebts?: boolean;
  canDeptRevenue?: boolean;
  canDeptExpenses?: boolean;
  canAddExpense?: boolean;
};
export type StaffMember = {
  id: number;
  name: string;
  nationalId: string;
  dob?: string;
  username?: string;
  jobTitle?: string;
  primaryDept?: string;
  assignedDepts?: string[];
  phone: string;
  password: string;
  role: string;
  salaryType: SalaryType;
  fixedSalary: number;
  percentageDept: string;
  percentageDepts?: string[];
  payFromDepts?: string[];
  percentageValue: number;
  shiftStart?: string;
  shiftEnd?: string;
  shiftAmount?: number;
  dailyWageAmount?: number;
  status: "active"|"inactive";
  joinDate: string;
  deptPermissions: Record<string, DeptPermissions>;
  canAccessFinancial: boolean;
  canAccessSettings: boolean;
  canAccessReports: boolean;
  canManageStaff: boolean;
  canAttendance?: boolean;
  isAdminRole?: boolean;
  notes: string;
};
export type LoggedUser = { type:"admin"; adminName?:string } | { type:"staff"; staff: StaffMember };

// ─── DATA MODEL TYPES (defined inline in original constants section) ───────────
export type TestParam = { name:string; unit:string; min:string; max:string };
export type KitParam = { name:string; unit:string; min:string; max:string; value?:string };
export type SurgeryClinicItem = { id:number; name:string; category:string; qty:number; threshold:number; expiryDate:string; notes:string };
export type PatientDeleteRequest = { id:number; patientId:string; patientName:string; requestedBy:string; requestDept:string; requestDate:string; reason:string; status:"pending"|"approved"|"rejected"; reviewedBy?:string; reviewDate?:string; rejectionReason?:string };
export type RehabPlan = { id:number; patientId:string; patientName:string; diagnosis:string; totalSessions:number; completedSessions:number; pricePerSession:number; planPrice:number; pricingMode:"per-session"|"plan"; specialist:string; status:"active"|"completed"|"cancelled"; startDate:string };
export type RehabQueueEntry = { id:number; patientId:string; patientName:string; planId:number; diagnosis:string; specialist:string; sessionNumber:number; time:string; date:string; status:"pending"|"done"; therapistNotes?:string; sessionResult?:string; painScale?:number; movementAssessment?:string; grossMotorSkills?:string; fineMotorSkills?:string; sensoryCondition?:string; adlActivities?:string };
export type RehabServiceItem = { id:number; name:string; nameEn:string; cat:string; price:number; priceCost:number };

// ─── PRINT SETTINGS TYPES ─────────────────────────────────────────────────────
export type PrintExportSaved = { withHeader:boolean; fields:{ name:boolean; phone:boolean; nid:boolean; age:boolean; blood:boolean; doctor:boolean; tests:boolean; diagnoses:boolean; medications:boolean; amount:boolean; paid:boolean; debt:boolean; notes:boolean }; margins:{ top:number; right:number; bottom:number; left:number } };
export type DeptPrintAdv = { fontSize:number; fontFamily:string; showSignature:boolean; withHeader?:boolean };
