import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix FinProfitScreen to show the equations as requested.
# Lines to replace: 6714 to 6750
# We need to properly extract the breakdown from stats and put them in the UI.

old_details_section = """  const salariesOut=stats.salaryCost;
  const advancesOut=0;
  const purchasesOut=stats.breakdown.expenses.purchaseRequests;
  const paymentVoucherOut=stats.breakdown.expenses.personalExpenseVouchers;
  const personalOut=stats.breakdown.expenses.personalExpenseVouchers;
  const otherOut=0;
  const periodLabel=dateFrom||dateTo?`${dateFrom||"..."} → ${dateTo||"..."}`:new Date().toLocaleDateString("en-GB",{month:"long",year:"numeric"});
  const pcol=(v:number)=>v>=0?"text-[#2E7D32]":"text-[#C62828]";
  const pbg=(v:number):React.CSSProperties=>v>=0?{backgroundColor:"#E8F5E9",border:"1px solid #A5D6A7"}:{backgroundColor:"#FFEBEE",border:"1px solid #FFCDD2"};
  return(
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <DateRangePicker from={dateFrom} to={dateTo} onFrom={setDateFrom} onTo={setDateTo} onClear={()=>{setDateFrom("");setDateTo("");}}/>
        <div className="flex gap-2 mr-auto">
          <Btn small variant="ghost" onClick={()=>{const rows=allTxs.filter(t=>(t.category||"")!=="رصيد افتتاحي").map(t=>[t.date||"",t.title,t.category||"",t.type==="in"?t.amount:0,t.type==="out"?t.amount:0]);const ws=XLSX.utils.aoa_to_sheet([["التاريخ","البيان","التصنيف","إيراد","مصروف"],...rows,[],["","","إجمالي الإيرادات",rangeRevenue,""],["","","إجمالي المصروفات","",rangeOut],["","","صافي الربح",rangeProfit,""]]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"الأرباح");XLSX.writeFile(wb,`تقرير_الأرباح_${periodLabel}.xlsx`);}}><Download size={14}/>تصدير</Btn>
          <Btn small variant="ghost" onClick={()=>{const html=`<div class="kpi"><div class="kpi-box" style="flex:2"><div class="kpi-l">صافي الربح</div><div class="kpi-v ${rangeProfit>=0?"in":"out"}">${fmt(rangeProfit)}</div></div><div class="kpi-box"><div class="kpi-l">إجمالي الإيرادات</div><div class="kpi-v in">${fmt(rangeRevenue)}</div></div><div class="kpi-box"><div class="kpi-l">إجمالي التكاليف</div><div class="kpi-v out">${fmt(rangeOut)}</div></div></div><h2>تفاصيل الإيرادات</h2><table><thead><tr><th>البند</th><th>المبلغ</th></tr></thead><tbody>${[[" إيرادات مرضى",patientRevenue],["سندات قبض",receiptVoucherRev],["إيرادات أخرى",otherInRevenue]].filter(r=>(r[1] as number)>0).map(r=>`<tr><td>${r[0]}</td><td class="in">${fmt(r[1] as number)}</td></tr>`).join("")}<tr style="font-weight:bold"><td>الإجمالي</td><td class="in">${fmt(rangeRevenue)}</td></tr></tbody></table><h2>تفاصيل المصروفات</h2><table><thead><tr><th>البند</th><th>المبلغ</th></tr></thead><tbody>${[["رواتب",salariesOut],["سلف موظفين",advancesOut],["مشتريات",purchasesOut],["سندات صرف",paymentVoucherOut],["مصروفات شخصية",personalOut],["أخرى",otherOut]].filter(r=>(r[1] as number)>0).map(r=>`<tr><td>${r[0]}</td><td class="out">${fmt(r[1] as number)}</td></tr>`).join("")}<tr style="font-weight:bold"><td>الإجمالي</td><td class="out">${fmt(rangeOut)}</td></tr></tbody></table><h2>المعادلة — ${periodLabel}</h2><p style="font-size:14px;padding:10px;background:#F5F8FF;border-radius:8px">${fmt(rangeRevenue)} إيرادات − ${fmt(rangeOut)} مصروفات = <b class="${rangeProfit>=0?"in":"out"}">${fmt(rangeProfit)}</b></p>`;printHtml(html,`تقرير الربح والخسارة — ${periodLabel}`,dateFrom,dateTo);}}><Printer size={14}/>طباعة</Btn>
        </div>
      </div>
      <div className="rounded-2xl p-6 text-white" style={{background:"linear-gradient(135deg,#1B3A6B,#0D4B8E)"}}>
        <p className="text-white/70 text-sm mb-1">صافي الربح — {periodLabel}</p>
        <p className="text-5xl font-bold">{fmt(rangeProfit)}</p>
        <div className="flex gap-8 mt-4 flex-wrap">
          <div><p className="text-white/60 text-xs">إجمالي الإيرادات</p><p className="text-xl font-bold">{fmt(rangeRevenue)}</p></div>
          <div><p className="text-white/60 text-xs">إجمالي التكاليف</p><p className="text-xl font-bold">{fmt(rangeOut)}</p></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4 space-y-2" style={{backgroundColor:"#F0FFF4",border:"1px solid #A5D6A7"}}>
          <p className="text-xs text-[#2E7D32] font-semibold mb-2">تفاصيل الإيرادات</p>
          {[[" إيرادات مرضى","إيراد مريض",patientRevenue,"#2E7D32"],["سندات قبض","سند قبض",receiptVoucherRev,"#1B5E20"],["إيرادات أخرى","",otherInRevenue,"#388E3C"]].filter(r=>(r[2] as number)>0).map(r=>(
            <div key={String(r[0])} className="flex justify-between text-sm"><span className="text-[#555]">{r[0]}</span><span className="font-bold" style={{color:String(r[3])}}>{fmt(r[2] as number)}</span></div>
          ))}
          <div className="flex justify-between text-sm font-bold pt-1" style={{borderTop:"1px solid #C8E6C9"}}><span className="text-[#2E7D32]">الإجمالي</span><span className="text-[#2E7D32]">{fmt(rangeRevenue)}</span></div>
        </div>
        <div className="rounded-xl p-4 space-y-2" style={{backgroundColor:"#FFF8F8",border:"1px solid #FFCDD2"}}>
          <p className="text-xs text-[#C62828] font-semibold mb-2">تفاصيل المصروفات</p>
          {[["رواتب موظفين",salariesOut,"#7B1FA2"],["سلف موظفين",advancesOut,"#6A1B9A"],["مشتريات",purchasesOut,"#1565C0"],["سندات صرف",paymentVoucherOut,"#E65100"],["مصروفات شخصية",personalOut,"#F57C00"],["أخرى",otherOut,"#C62828"]].filter(r=>(r[1] as number)>0).map(r=>("""

new_details_section = """  const salariesOut=stats.salaryCost;
  const advancesOut=stats.breakdown.salary.advanceDeduction;
  const purchasesOut=stats.breakdown.expenses.purchaseRequests;
  const paymentVoucherOut=stats.breakdown.expenses.personalExpenseVouchers;
  const grossSalaryOut=stats.breakdown.salary.grossDisbursed;
  
  const periodLabel=dateFrom||dateTo?`${dateFrom||"..."} → ${dateTo||"..."}`:new Date().toLocaleDateString("ar-EG",{month:"long",year:"numeric"});
  
  return(
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <DateRangePicker from={dateFrom} to={dateTo} onFrom={setDateFrom} onTo={setDateTo} onClear={()=>{setDateFrom("");setDateTo("");}}/>
        <div className="flex gap-2 mr-auto">
          <Btn small variant="ghost" onClick={()=>{
            const html=`<div class="kpi"><div class="kpi-box" style="flex:2"><div class="kpi-l">صافي الربح</div><div class="kpi-v ${rangeProfit>=0?"in":"out"}">${fmt(rangeProfit)}</div></div><div class="kpi-box"><div class="kpi-l">الإيرادات</div><div class="kpi-v in">${fmt(rangeRevenue)}</div></div><div class="kpi-box"><div class="kpi-l">المصروفات + الرواتب</div><div class="kpi-v out">${fmt(rangeOut)}</div></div></div>
            <h2>توضيح المعادلات المالية</h2>
            <div style="font-size:14px;padding:15px;background:#F5F8FF;border-radius:8px;line-height:1.6;margin-bottom:20px;border:1px solid #1B3A6B;color:#1B3A6B;">
              <p><b>صافي الربح</b> = الإيرادات - (المصروفات + الرواتب)</p>
              <p><b>الإيرادات</b> = الدخل من المرضى + سندات القبض</p>
              <p><b>الرواتب</b> = الرواتب الأصلية - قيمة السلف المقبولة - سندات الصرف (مصروفات شخصية)</p>
            </div>
            <h2>تفاصيل الإيرادات</h2><table><thead><tr><th>البند</th><th>المبلغ</th></tr></thead><tbody><tr><td>الدخل من المرضى</td><td class="in">${fmt(patientRevenue)}</td></tr><tr><td>سندات القبض</td><td class="in">${fmt(receiptVoucherRev)}</td></tr><tr style="font-weight:bold"><td>إجمالي الإيرادات</td><td class="in">${fmt(rangeRevenue)}</td></tr></tbody></table>
            <h2>تفاصيل المصروفات والرواتب</h2><table><thead><tr><th>البند</th><th>التفاصيل</th><th>المبلغ</th></tr></thead><tbody><tr><td>المصروفات</td><td>طلبات الشراء المسددة</td><td class="out">${fmt(purchasesOut)}</td></tr><tr><td>الرواتب</td><td>الرواتب الأصلية الموزعة (${fmt(grossSalaryOut)}) ناقصاً السلف (${fmt(advancesOut)}) والمصروفات الشخصية (${fmt(paymentVoucherOut)})</td><td class="out">${fmt(salariesOut)}</td></tr><tr style="font-weight:bold"><td>إجمالي الخصومات</td><td></td><td class="out">${fmt(rangeOut)}</td></tr></tbody></table>`;
            printHtml(html,`تقرير الربح والخسارة — ${periodLabel}`,dateFrom,dateTo);
          }}><Printer size={14}/>طباعة</Btn>
        </div>
      </div>
      
      <div className="rounded-2xl p-6 text-white" style={{background:"linear-gradient(135deg,#1B3A6B,#0D4B8E)"}}>
        <p className="text-white/70 text-sm mb-1">صافي الربح — {periodLabel}</p>
        <p className="text-5xl font-bold">{fmt(rangeProfit)}</p>
        <div className="flex gap-8 mt-4 flex-wrap">
          <div><p className="text-white/60 text-xs">الإيرادات</p><p className="text-xl font-bold">{fmt(rangeRevenue)}</p></div>
          <div><p className="text-white/60 text-xs">المصروفات + الرواتب</p><p className="text-xl font-bold">{fmt(rangeOut)}</p></div>
        </div>
      </div>

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
          <div className="flex justify-between text-sm"><span className="text-[#555]">الرواتب (الصافي)</span><span className="font-bold text-[#7B1FA2]">{fmt(salariesOut)}</span></div>
          <div className="flex justify-between text-sm font-bold pt-1" style={{borderTop:"1px solid #FFCDD2"}}><span className="text-[#C62828]">الإجمالي</span><span className="text-[#C62828]">{fmt(rangeOut)}</span></div>
        </div>
      </div>
      <div className="hidden">
"""

if old_details_section in content:
    content = content.replace(old_details_section, new_details_section)
    print("Replaced FinProfitScreen successfully")
else:
    print("Could not find FinProfitScreen text block to replace!")

# Also fix the array mapping logic that got cut off by the `hidden` div
old_cutoff = """        </div>
      </div>
    </div>
  );
}

function FinancialSummaryScreen"""

new_cutoff = """      </div>
    </div>
  );
}

function FinancialSummaryScreen"""

# We'll use regex for the ending of FinProfitScreen to clean up the hidden stuff.
cleanup_regex = re.compile(r'<div className="hidden">[\s\S]*?</div>\s*</div>\s*</div>\s*\);\s*}')
if cleanup_regex.search(content):
    content = cleanup_regex.sub(new_cutoff, content)
    print("Cleaned up FinProfitScreen end block")

with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
