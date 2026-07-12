import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update FinProfitScreen display
old_fin_profit_vars = """  const patientRevenue=stats.breakdown.revenue.patientPayments;
  const receiptVoucherRev=stats.breakdown.revenue.receiptVouchers;
  const otherInRevenue=0;
  // ── تفاصيل المصروفات (من المحرك الموحد) ──────────────────────────────────
  const salariesOut=stats.salaryCost;
  const advancesOut=0;
  const purchasesOut=stats.breakdown.expenses.purchaseRequests;
  const paymentVoucherOut=stats.breakdown.expenses.personalExpenseVouchers;
  const personalOut=stats.breakdown.expenses.personalExpenseVouchers;
  const otherOut=0;"""

new_fin_profit_vars = """  const patientRevenue=stats.breakdown.revenue.patientPayments;
  const receiptVoucherRev=stats.breakdown.revenue.receiptVouchers;
  const otherInRevenue=0;
  // ── تفاصيل المصروفات والرواتب ──────────────────────────────────
  const salariesOut=stats.salaryCost;
  const advancesOut=stats.breakdown.salary.advanceDeduction;
  const purchasesOut=stats.breakdown.expenses.purchaseRequests;
  const paymentVoucherOut=stats.breakdown.expenses.personalExpenseVouchers;
  const grossSalaryOut=stats.breakdown.salary.grossDisbursed;
  const personalOut=stats.breakdown.expenses.personalExpenseVouchers;
  const otherOut=0;"""

content = content.replace(old_fin_profit_vars, new_fin_profit_vars)

old_fin_profit_ui = """      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4 space-y-2" style={{backgroundColor:"#F0FFF4",border:"1px solid #A5D6A7"}}>
          <p className="text-xs text-[#2E7D32] font-semibold mb-2">تفاصيل الإيرادات</p>
          {[[" إيرادات مرضى","إيراد مريض",patientRevenue,"#2E7D32"],["سندات قبض","سند قبض",receiptVoucherRev,"#1B5E20"],["إيرادات أخرى","",otherInRevenue,"#388E3C"]].filter(r=>(r[2] as number)>0).map(r=>(
            <div key={String(r[0])} className="flex justify-between text-sm"><span className="text-[#555]">{r[0]}</span><span className="font-bold" style={{color:String(r[3])}}>{fmt(r[2] as number)}</span></div>
          ))}
          <div className="flex justify-between text-sm font-bold pt-1" style={{borderTop:"1px solid #C8E6C9"}}><span className="text-[#2E7D32]">الإجمالي</span><span className="text-[#2E7D32]">{fmt(rangeRevenue)}</span></div>
        </div>
        <div className="rounded-xl p-4 space-y-2" style={{backgroundColor:"#FFF8F8",border:"1px solid #FFCDD2"}}>
          <p className="text-xs text-[#C62828] font-semibold mb-2">تفاصيل المصروفات</p>
          {[["رواتب موظفين",salariesOut,"#7B1FA2"],["سلف موظفين",advancesOut,"#6A1B9A"],["مشتريات",purchasesOut,"#1565C0"],["سندات صرف",paymentVoucherOut,"#E65100"],["مصروفات شخصية",personalOut,"#F57C00"],["أخرى",otherOut,"#C62828"]].filter(r=>(r[1] as number)>0).map(r=>(
            <div key={String(r[0])} className="flex justify-between text-sm"><span className="text-[#555]">{r[0]}</span><span className="font-bold" style={{color:String(r[3])}}>{fmt(r[1] as number)}</span></div>
          ))}
          <div className="flex justify-between text-sm font-bold pt-1" style={{borderTop:"1px solid #FFCDD2"}}><span className="text-[#C62828]">الإجمالي</span><span className="text-[#C62828]">{fmt(rangeOut)}</span></div>
        </div>
      </div>"""

new_fin_profit_ui = """
      <div className="rounded-xl p-4 mb-4" style={{backgroundColor:"#F8FBFF",border:"1px solid #1B3A6B", color:"#1B3A6B"}}>
        <p className="font-bold text-sm mb-2 flex items-center gap-2"><div className="w-1.5 h-4 bg-[#1B3A6B] rounded-full"/> المعادلات المالية المعتمدة</p>
        <ul className="text-xs space-y-1.5 opacity-90 font-medium">
          <li>• صافي الربح = الايرادات - (المصروفات + الرواتب)</li>
          <li>• الايرادات = الدخل من المرضى + سندات القبض</li>
          <li>• الرواتب = الرواتب الاصلية - قيمة السلف المقبولة - سندات الصرف (مصروفات شخصية)</li>
        </ul>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4 space-y-2" style={{backgroundColor:"#F0FFF4",border:"1px solid #A5D6A7"}}>
          <p className="text-xs text-[#2E7D32] font-semibold mb-2">تفاصيل الإيرادات</p>
          <div className="flex justify-between text-sm"><span className="text-[#555]">الدخل من المرضى</span><span className="font-bold text-[#2E7D32]">{fmt(patientRevenue)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#555]">سندات القبض</span><span className="font-bold text-[#1B5E20]">{fmt(receiptVoucherRev)}</span></div>
          <div className="flex justify-between text-sm font-bold pt-1" style={{borderTop:"1px solid #C8E6C9"}}><span className="text-[#2E7D32]">الإجمالي</span><span className="text-[#2E7D32]">{fmt(rangeRevenue)}</span></div>
        </div>
        <div className="rounded-xl p-4 space-y-2" style={{backgroundColor:"#FFF8F8",border:"1px solid #FFCDD2"}}>
          <p className="text-xs text-[#C62828] font-semibold mb-2">المصروفات والرواتب</p>
          <div className="flex justify-between text-sm"><span className="text-[#555]">المصروفات (طلبات شراء)</span><span className="font-bold text-[#1565C0]">{fmt(purchasesOut)}</span></div>
          <div className="flex justify-between text-sm" title={`الرواتب الأصلية (${fmt(grossSalaryOut)}) - السلف (${fmt(advancesOut)}) - المصروفات الشخصية (${fmt(paymentVoucherOut)})`}><span className="text-[#555]">الرواتب (الصافي)</span><span className="font-bold text-[#7B1FA2]">{fmt(salariesOut)}</span></div>
          <div className="flex justify-between text-sm font-bold pt-1" style={{borderTop:"1px solid #FFCDD2"}}><span className="text-[#C62828]">الإجمالي</span><span className="text-[#C62828]">{fmt(rangeOut)}</span></div>
        </div>
      </div>"""

content = content.replace(old_fin_profit_ui, new_fin_profit_ui)

# And fix the HTML for printing
print_html_regex = re.compile(r'const html=`<div class="kpi"><div class="kpi-box" style="flex:2">[\s\S]*?printHtml\(html,`تقرير الربح والخسارة')
if print_html_regex.search(content):
    new_print_html = r"""const html=`<div class="kpi"><div class="kpi-box" style="flex:2"><div class="kpi-l">صافي الربح</div><div class="kpi-v ${rangeProfit>=0?"in":"out"}">${fmt(rangeProfit)}</div></div><div class="kpi-box"><div class="kpi-l">الإيرادات</div><div class="kpi-v in">${fmt(rangeRevenue)}</div></div><div class="kpi-box"><div class="kpi-l">المصروفات + الرواتب</div><div class="kpi-v out">${fmt(rangeOut)}</div></div></div>
            <h2>توضيح المعادلات المالية</h2>
            <div style="font-size:14px;padding:15px;background:#F5F8FF;border-radius:8px;line-height:1.6;margin-bottom:20px;border:1px solid #1B3A6B;color:#1B3A6B;">
              <p><b>صافي الربح</b> = الإيرادات - (المصروفات + الرواتب)</p>
              <p><b>الإيرادات</b> = الدخل من المرضى + سندات القبض</p>
              <p><b>الرواتب</b> = الرواتب الأصلية - قيمة السلف المقبولة - سندات الصرف (مصروفات شخصية)</p>
            </div>
            <h2>تفاصيل الإيرادات</h2><table><thead><tr><th>البند</th><th>المبلغ</th></tr></thead><tbody><tr><td>الدخل من المرضى</td><td class="in">${fmt(patientRevenue)}</td></tr><tr><td>سندات القبض</td><td class="in">${fmt(receiptVoucherRev)}</td></tr><tr style="font-weight:bold"><td>إجمالي الإيرادات</td><td class="in">${fmt(rangeRevenue)}</td></tr></tbody></table>
            <h2>تفاصيل المصروفات والرواتب</h2><table><thead><tr><th>البند</th><th>التفاصيل</th><th>المبلغ</th></tr></thead><tbody><tr><td>المصروفات</td><td>طلبات الشراء المسددة</td><td class="out">${fmt(purchasesOut)}</td></tr><tr><td>الرواتب</td><td>الرواتب الأصلية الموزعة (${fmt(grossSalaryOut)}) ناقصاً السلف (${fmt(advancesOut)}) والمصروفات الشخصية (${fmt(paymentVoucherOut)})</td><td class="out">${fmt(salariesOut)}</td></tr><tr style="font-weight:bold"><td>إجمالي الخصومات</td><td></td><td class="out">${fmt(rangeOut)}</td></tr></tbody></table>`;printHtml(html,`تقرير الربح والخسارة"""
    content = print_html_regex.sub(new_print_html, content)

# 2. Update FinancialSummaryScreen definitions
pattern = re.compile(r"const totalRevenue=engFinSum\.revenue;[\s\S]*?const totalWithdrawals=[^;]+;")
if pattern.search(content):
    new_block = """  const totalRevenue=engFinSum.revenue;
  const netProfit=engFinSum.profit;
  const totalReceiptVouchersAll=engFinSum.breakdown.revenue.receiptVouchers;
  const totalWithdrawals=engFinSum.breakdown.expenses.personalExpenseVouchers;
  const totalPurchases=engFinSum.breakdown.expenses.purchaseRequests;
"""
    content = pattern.sub(new_block, content)

# 3. Update main dashboard KPI definitions (lines 1880 - 1965 approx)
pattern2 = re.compile(r"const rangeRevenue=sessions\.filter[\s\S]*?const netProfit=[^;]+;")
if pattern2.search(content):
    replacement_main = """
  const enrichedTxsDash=Object.entries(drawers).flatMap(([dId,dr])=>(dr.txs||[]).map(t=>({...t,dept:dId})));
  const dashStats=calculateFinancials(sessions,receiptVouchers,paymentVouchers,purchaseRequests,enrichedTxsDash,debts,invoices,externalDebts,null,rangeFrom||undefined,rangeTo||undefined,employeeAdvances);
  
  const rangeRevenue=dashStats.revenue;
  const totalPatientDebt=dashStats.patientDebts;
  const totalCompanyDebt=dashStats.companyCreditors;
  const totalPersonalExp=dashStats.breakdown.expenses.personalExpenseVouchers;
  const totalPurchases=dashStats.breakdown.expenses.purchaseRequests;
  const totalReceiptsAll=dashStats.breakdown.revenue.receiptVouchers;
  const totalWithdrawals=totalPersonalExp;
  const netProfit=dashStats.profit;
"""
    content = pattern2.sub(replacement_main, content)

with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.tsx successfully")
