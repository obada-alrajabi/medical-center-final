import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace variables in FinancialSummaryScreen

# Old block:
#  const totalRevenue=engFinSum.revenue;
#  const netProfit=engFinSum.profit;
#  const totalReceiptVouchersAll=_rvKPI.filter(v=>ir(v.date||"")).reduce((s,v)=>s+(Number(v.amount)||0),0);
#  const totalWithdrawals=filteredTxs.filter(t=>t.type==="out"&&t.category!=="رصيد افتتاحي").reduce((s,t)=>s+t.amount,0);

# New block:
new_block = """  const totalRevenue=engFinSum.revenue;
  const netProfit=engFinSum.profit;
  const totalReceiptVouchersAll=engFinSum.breakdown.revenue.receiptVouchers;
  const totalWithdrawals=engFinSum.breakdown.expenses.personalExpenseVouchers; // User explicitly requested this for إجمالي المصروفات
  const totalPurchases=engFinSum.breakdown.expenses.purchaseRequests;
"""

pattern = re.compile(r"const totalRevenue=engFinSum\.revenue;[\s\S]*?const totalWithdrawals=[^;]+;")
if pattern.search(content):
    content = pattern.sub(new_block, content)
    with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced FinancialSummaryScreen calculations")
else:
    print("Could not find FinancialSummaryScreen block")

