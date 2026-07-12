import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update component definition
old_def = "function DashboardScreen({drawers,debts,invoices,purchaseRequests,onNavigate,customDepts=[],sessions=[],deptCapacity={},receiptVouchers=[],paymentVouchers=[],employeeAdvances=[]}:{drawers:Record<string,DrawerState>;debts:DebtRow[];invoices:Invoice[];purchaseRequests:PurchaseRequest[];onNavigate:(r:Route)=>void;customDepts?:Array<{id:string;name:string;short:string;iconId?:string}>;sessions?:PatientSession[];deptCapacity?:Record<string,number>;receiptVouchers?:any[];paymentVouchers?:any[];employeeAdvances?:EmployeeAdvance[]}){"
new_def = "function DashboardScreen({drawers,debts,invoices,purchaseRequests,onNavigate,customDepts=[],sessions=[],deptCapacity={},receiptVouchers=[],paymentVouchers=[],employeeAdvances=[],externalDebts=[]}:{drawers:Record<string,DrawerState>;debts:DebtRow[];invoices:Invoice[];purchaseRequests:PurchaseRequest[];onNavigate:(r:Route)=>void;customDepts?:Array<{id:string;name:string;short:string;iconId?:string}>;sessions?:PatientSession[];deptCapacity?:Record<string,number>;receiptVouchers?:any[];paymentVouchers?:any[];employeeAdvances?:EmployeeAdvance[];externalDebts?:any[]}){"

if old_def in content:
    content = content.replace(old_def, new_def)
    print("Updated component definition")
else:
    # try regex just in case
    pattern_def = re.compile(r'function DashboardScreen\(\{drawers,debts,invoices,purchaseRequests,onNavigate,customDepts=\[\],sessions=\[\],deptCapacity={},receiptVouchers=\[\],paymentVouchers=\[\],employeeAdvances=\[\]\}:\{drawers:Record<string,DrawerState>;debts:DebtRow\[\];invoices:Invoice\[\];purchaseRequests:PurchaseRequest\[\];onNavigate:\(r:Route\)=>void;customDepts\?:Array<\{id:string;name:string;short:string;iconId\?:string\}>;sessions\?:PatientSession\[\];deptCapacity\?:Record<string,number>;receiptVouchers\?:any\[\];paymentVouchers\?:any\[\];employeeAdvances\?:EmployeeAdvance\[\]\}\)\{')
    if pattern_def.search(content):
        content = pattern_def.sub(new_def, content)
        print("Updated component definition via regex")
    else:
        print("Could not find DashboardScreen definition")

# 2. Update usage 1 (case "dashboard")
old_case1 = 'case"dashboard":         return<DashboardScreen drawers={drawers} debts={debts} invoices={invoices} purchaseRequests={purchaseRequests} onNavigate={setRoute} customDepts={customDepts} sessions={sessions} deptCapacity={sidebarSettings.deptCapacity} receiptVouchers={receiptVouchersGlobal} paymentVouchers={paymentVouchersGlobal} employeeAdvances={employeeAdvances}/>;'
new_case1 = 'case"dashboard":         return<DashboardScreen drawers={drawers} debts={debts} invoices={invoices} purchaseRequests={purchaseRequests} onNavigate={setRoute} customDepts={customDepts} sessions={sessions} deptCapacity={sidebarSettings.deptCapacity} receiptVouchers={receiptVouchersGlobal} paymentVouchers={paymentVouchersGlobal} employeeAdvances={employeeAdvances} externalDebts={externalDebts}/>;'

if old_case1 in content:
    content = content.replace(old_case1, new_case1)
    print("Updated case dashboard")
else:
    print("Could not find case dashboard")

# 3. Update usage 2 (default)
old_case2 = 'default:                      return<DashboardScreen drawers={drawers} debts={debts} invoices={invoices} purchaseRequests={purchaseRequests} onNavigate={setRoute} customDepts={customDepts} sessions={sessions} deptCapacity={sidebarSettings.deptCapacity}/>;'
new_case2 = 'default:                      return<DashboardScreen drawers={drawers} debts={debts} invoices={invoices} purchaseRequests={purchaseRequests} onNavigate={setRoute} customDepts={customDepts} sessions={sessions} deptCapacity={sidebarSettings.deptCapacity} externalDebts={externalDebts}/>;'

if old_case2 in content:
    content = content.replace(old_case2, new_case2)
    print("Updated case default")
else:
    print("Could not find case default")

with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
