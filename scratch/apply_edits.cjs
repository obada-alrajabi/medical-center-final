const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to \n
content = content.replace(/\r\n/g, '\n');

// Replacement 1: pass paymentVouchersGlobal state to PayrollScreen
const search1 = `      case"fin-payroll":       {const _isStaff=loggedUser?.type==="staff";const _staffName=_isStaff?(loggedUser as any).staff.name:"";const _payEmps=_isStaff?employees.filter(e=>e.name===_staffName):employees;return<PayrollScreen employees={_payEmps} setEmployees={setEmployees} drawers={drawers} doWithdraw={doWithdraw} toast={toast} customDepts={customDepts} employeeAdvances={employeeAdvances} staffList={staffList} sessions={sessions}/>;}`;
const replace1 = `      case"fin-payroll":       {const _isStaff=loggedUser?.type==="staff";const _staffName=_isStaff?(loggedUser as any).staff.name:"";const _payEmps=_isStaff?employees.filter(e=>e.name===_staffName):employees;return<PayrollScreen employees={_payEmps} setEmployees={setEmployees} drawers={drawers} doWithdraw={doWithdraw} toast={toast} customDepts={customDepts} employeeAdvances={employeeAdvances} staffList={staffList} sessions={sessions} paymentVouchers={paymentVouchersGlobal}/>;}`;

if (content.includes(search1)) {
  content = content.replace(search1, replace1);
  console.log("Replacement 1 successful!");
} else {
  // Let's also try with slightly different spacing if needed, but it should match normalized content
  console.log("Replacement 1 not found, might have been replaced or layout is slightly different.");
}

// Replacement 2: pass allPaymentVouchers state to MyFinancialAccountScreen in StaffPortal
const search2 = `              {subScreen==="my-account"&&(
                <MyFinancialAccountScreen staff={staff} employeeAdvances={employeeAdvances} attendance={attendance} employees={employees} staffAdvanceRequests={staffAdvanceRequests} onSubmitStaffAdvanceRequest={onSubmitStaffAdvanceRequest||(()=>{})} toast={staffToast}/>
              )}`;

const replace2 = `              {subScreen==="my-account"&&(
                <MyFinancialAccountScreen staff={staff} employeeAdvances={employeeAdvances} attendance={attendance} employees={employees} staffAdvanceRequests={staffAdvanceRequests} onSubmitStaffAdvanceRequest={onSubmitStaffAdvanceRequest||(()=>{})} toast={staffToast} paymentVouchers={allPaymentVouchers}/>
              )}`;

if (content.includes(search2)) {
  content = content.replace(search2, replace2);
  console.log("Replacement 2 successful!");
} else {
  console.error("Replacement 2 failed: search string not found");
}

// Replacement 3: combine BroadcastBanner and other banners under fixed container in StaffPortal
const search3 = `        {/* Banners */}
        <BroadcastBanner message={broadcastNotice}/>
        {(()=>{
          const deptDebts=debts.filter(d=>d.dept===activeDept);
          const deptDebtTotal=deptDebts.reduce((s,d)=>s+d.amount,0);
          const lowStock=activeDept==="lab"?inventory.filter(i=>i.status!=="ok"):[];
          if(!deptDebtTotal&&!lowStock.length)return null;
          return(
            <div className="fixed left-0 z-20" style={{top:56,right:sbW,transition:"right 0.25s ease"}}>
              {deptDebtTotal>0&&(
                <div className="flex items-center gap-2 px-5 py-2 text-sm font-medium" style={{backgroundColor:"#FFF3E0",borderBottom:"1px solid #FFCC02",color:"#E65100"}}>
                  <AlertTriangle size={15}/><span>ديون معلقة في <strong>{activeDeptInfo?.name||activeDept}</strong>: <strong>{fmt(deptDebtTotal)}</strong></span>
                </div>
              )}
              {lowStock.map(item=>(
                <div key={item.id} className="flex items-center gap-3 px-5 py-2 text-sm font-medium"
                  style={{backgroundColor:item.status==="empty"?"#FFEBEE":item.status==="critical"?"#FFF3E0":"#FFF8E1",borderBottom:\`1px solid \${item.status==="empty"?"#FFCDD2":item.status==="critical"?"#FFCC80":"#FFE082"}\`,color:item.status==="empty"?"#B71C1C":item.status==="critical"?"#BF360C":"#E65100"}}>
                  <AlertTriangle size={14}/><span>{item.status==="empty"?"🚫 نفد المخزون":item.status==="critical"?"⚠️ مخزون حرج":"⚠️ تحذير مخزون"}: كيت <strong>{item.name}</strong> — متبقٍ: <strong>{item.qty}</strong></span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Content */}
        {(()=>{
          const extraTop=(()=>{const dt=debts.filter(d=>d.dept===activeDept).reduce((s,d)=>s+d.amount,0);const ls=activeDept==="lab"?inventory.filter(i=>i.status!=="ok").length:0;return(dt>0?40:0)+(ls*36);})();
          return(
            <div className="px-4 pb-6 max-w-5xl" style={{paddingTop:56+extraTop+16}}>`;

const replace3 = `        {/* Banners */}
        {(()=>{
          const deptDebts=debts.filter(d=>d.dept===activeDept);
          const deptDebtTotal=deptDebts.reduce((s,d)=>s+d.amount,0);
          const lowStock=activeDept==="lab"?inventory.filter(i=>i.status!=="ok"):[];
          if(!broadcastNotice&&!deptDebtTotal&&!lowStock.length)return null;
          return(
            <div className="fixed left-0 z-20 no-print w-full" style={{top:56,right:sbW,width:\`calc(100% - \${sbW}px)\`,transition:"right 0.25s ease"}}>
              {broadcastNotice&&<BroadcastBanner message={broadcastNotice}/>}
              {deptDebtTotal>0&&(
                <div className="flex items-center gap-2 px-5 py-2 text-sm font-medium" style={{backgroundColor:"#FFF3E0",borderBottom:"1px solid #FFCC02",color:"#E65100"}}>
                  <AlertTriangle size={15}/><span>ديون معلقة في <strong>{activeDeptInfo?.name||activeDept}</strong>: <strong>{fmt(deptDebtTotal)}</strong></span>
                </div>
              )}
              {lowStock.map(item=>(
                <div key={item.id} className="flex items-center gap-3 px-5 py-2 text-sm font-medium"
                  style={{backgroundColor:item.status==="empty"?"#FFEBEE":item.status==="critical"?"#FFF3E0":"#FFF8E1",borderBottom:\`1px solid \${item.status==="empty"?"#FFCDD2":item.status==="critical"?"#FFCC80":"#FFE082"}\`,color:item.status==="empty"?"#B71C1C":item.status==="critical"?"#BF360C":"#E65100"}}>
                  <AlertTriangle size={14}/><span>{item.status==="empty"?"🚫 نفد المخزون":item.status==="critical"?"⚠️ مخزون حرج":"⚠️ تحذير مخزون"}: كيت <strong>{item.name}</strong> — متبقٍ: <strong>{item.qty}</strong></span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Content */}
        {(()=>{
          const extraTop=(()=>{
            const dt=debts.filter(d=>d.dept===activeDept).reduce((s,d)=>s+d.amount,0);
            const ls=activeDept==="lab"?inventory.filter(i=>i.status!=="ok").length:0;
            const broadcastHeight=broadcastNotice?46:0;
            return(dt>0?40:0)+(ls*36)+broadcastHeight;
          })();
          return(
            <div className="px-4 pb-6 max-w-5xl" style={{paddingTop:56+extraTop+16}}>`;

if (content.includes(search3)) {
  content = content.replace(search3, replace3);
  console.log("Replacement 3 successful!");
} else {
  console.error("Replacement 3 failed: search string not found");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("All edits written successfully to App.tsx!");
