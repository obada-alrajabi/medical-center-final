import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
  const enrichedTxsDash=Object.entries(drawers).flatMap(([dId,dr])=>(dr.txs||[]).map(t=>({...t,dept:dId})));
  const dashStats=calculateFinancials(sessions,receiptVouchers,paymentVouchers,purchaseRequests,enrichedTxsDash,debts,invoices,externalDebts,null,rangeFrom||undefined,rangeTo||undefined,employeeAdvances);
  
  const rangeRevenue=dashStats.revenue;
  const totalPatientDebt=dashStats.patientDebts;
  const totalCompanyDebt=dashStats.companyCreditors;
  const totalPersonalExp=dashStats.breakdown.expenses.personalExpenseVouchers;
  const totalPurchases=dashStats.breakdown.expenses.purchaseRequests;
  const totalReceiptsAll=dashStats.breakdown.revenue.receiptVouchers;
  const totalWithdrawals=totalPersonalExp; // User explicitly requested: "إجمالي المصروفات = اجمالي قيمة سندات الصرف (المصروفات الشخصية) فقط"
  const netProfit=dashStats.profit;
"""

# Let's remove the variables that used to calculate these from App.tsx
# The variables are:
# rangeRevenue (if defined before, it is `const rangeRevenue=sessions.filter(s=>ir(s.date)).reduce((sum,s)=>sum+s.paid,0)+_rvRangeDash;`)
# We will use a regex that safely captures everything we need to replace.
# Looking for `const _rvRangeDash=` to `const netProfit=`

pattern = re.compile(r"const _rvRangeDash=receiptVouchers\.filter[\s\S]*?const netProfit=[^;]+;")
if pattern.search(content):
    content = pattern.sub(replacement, content)
    with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced main dashboard KPI calculations successfully via pattern 1")
else:
    # Let's search from totalPatientDebt to netProfit
    pattern2 = re.compile(r"const totalPatientDebt=debts\.filter[\s\S]*?const netProfit=[^;]+;")
    if pattern2.search(content):
        # We also need to remove `const rangeRevenue`
        content = re.sub(r"const rangeRevenue=sessions\.filter[^;]+;", "", content)
        content = pattern2.sub(replacement, content)
        with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Replaced main dashboard KPI calculations successfully via pattern 2")
    else:
        print("Could not find main dashboard KPI calculation block")
