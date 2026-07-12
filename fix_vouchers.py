import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update savePv in DeptVouchersScreen
old_dept_savePv = """  const savePv=async()=>{
    if(!pvModal.f.amount||!pvModal.f.paid_to_name.trim()||!pvModal.f.reason.trim()){toast("أكمل الحقول الإلزامية: المبلغ، الاسم، السبب","error");return;}
    if(pvModal.f.paid_to_type!=="other"&&!pvModal.f.paid_to_id){toast("يجب اختيار الاسم من القائمة","error");return;}
    const isPersonalExpense=pvModal.f.reason.trim()==="نفقة شخصية للموظف";
    if(isPersonalExpense&&(pvModal.f.paid_to_type!=="staff"||!pvModal.f.paid_to_id)){toast("لتسجيل نفقة شخصية للموظف يجب اختيار الموظف المستفيد","error");return;}
    try{
      const amt=parseFloat(pvModal.f.amount)||0;
      const r=await api.finance.paymentVouchers.create({...pvModal.f,amount:amt,dept,category:isPersonalExpense?"نفقة شخصية للموظف":(pvModal.f.category||"")});"""
new_dept_savePv = """  const savePv=async()=>{
    if(!pvModal.f.amount||!pvModal.f.reason.trim()){toast("أكمل الحقول الإلزامية: المبلغ، السبب","error");return;}
    const empName = loggedUser?.staff?.name || loggedUser?.username || "الموظف";
    try{
      const amt=parseFloat(pvModal.f.amount)||0;
      const r=await api.finance.paymentVouchers.create({...pvModal.f, amount:amt, dept, paid_to_type:"staff", paid_to_name:empName, category:"مصروفات شخصية"});"""
content = content.replace(old_dept_savePv, new_dept_savePv)

# 2. Update savePv in FinancialSummaryScreen
old_fin_savePv = """  const savePv=async()=>{
    if(!pvModal.f.amount||!pvModal.f.paid_to_name.trim()||!pvModal.f.reason.trim()){fireToast("أكمل الحقول الإلزامية: المبلغ، الاسم، السبب","error");return;}
    if(pvModal.f.paid_to_type!=="other"&&!pvModal.f.paid_to_id){fireToast("يجب اختيار الاسم من القائمة","error");return;}
    try{
      const body={...pvModal.f,amount:parseFloat(pvModal.f.amount)||0};"""
new_fin_savePv = """  const savePv=async()=>{
    if(!pvModal.f.amount||!pvModal.f.reason.trim()){fireToast("أكمل الحقول الإلزامية: المبلغ، السبب","error");return;}
    const empName = loggedUser?.staff?.name || loggedUser?.username || "الموظف";
    try{
      const body={...pvModal.f, amount:parseFloat(pvModal.f.amount)||0, paid_to_type:"staff", paid_to_name:empName, category:"مصروفات شخصية"};"""
content = content.replace(old_fin_savePv, new_fin_savePv)

# 3. Clean DeptVouchersScreen Modal UI
old_dept_modal = """          <div><label className="block text-xs font-semibold text-[#555] mb-1">نوع المصروف له</label><select value={pvModal.f.paid_to_type} onChange={e=>{const t=e.target.value as any;setPvEmpSearch("");setPvSupSearch("");setPvModal(m=>({...m,f:{...m.f,paid_to_type:t,paid_to_id:"",paid_to_name:""}}));}} className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={{border:"1px solid #DDD"}}><option value="staff">موظف</option><option value="supplier">مورد</option><option value="other">أخرى</option></select></div>
          <div><label className="block text-xs font-semibold text-[#555] mb-1">اسم المصروف له *</label>
            {pvModal.f.paid_to_type==="staff"&&(<div>
              <input autoComplete="off" value={pvEmpSearch} onChange={e=>{setPvEmpSearch(e.target.value);setPvModal(m=>({...m,f:{...m.f,paid_to_name:"",paid_to_id:""}}));}} placeholder="ابحث في الموظفين..." className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={{border:"1px solid #DDD"}}/>
              {!pvModal.f.paid_to_id&&filtEmps.length>0&&<div className="rounded-lg overflow-hidden max-h-40 overflow-y-auto mt-1" style={{border:"1px solid #DDD"}}>{filtEmps.map(e=><button key={e.id} onClick={()=>{setPvModal(m=>({...m,f:{...m.f,paid_to_name:e.name,paid_to_id:String(e.id)}}));setPvEmpSearch(e.name);}} className="w-full text-right px-3 py-2 text-sm hover:bg-[#EBF3FB] border-b last:border-b-0" style={{borderColor:"#F0F0F0"}}><span className="font-medium">{e.name}</span><span className="text-[#999] text-xs mr-2">{e.dept}</span></button>)}</div>}
              {!pvModal.f.paid_to_id&&pvEmpSearch.trim()&&filtEmps.length===0&&<p className="text-xs text-[#D32F2F] mt-1">لا يوجد موظف مطابق — تأكد من الاسم أو اختر "أخرى"</p>}
              {pvModal.f.paid_to_id&&<p className="text-xs text-[#388E3C] flex items-center gap-1 mt-1"><Check size={11}/>تم الاختيار: {pvModal.f.paid_to_name} — <button className="underline text-[#D32F2F]" onClick={()=>{setPvModal(m=>({...m,f:{...m.f,paid_to_name:"",paid_to_id:""}}));setPvEmpSearch("");}}>تغيير</button></p>}
            </div>)}
            {pvModal.f.paid_to_type==="supplier"&&(<div>
              <input autoComplete="off" value={pvSupSearch} onChange={e=>{setPvSupSearch(e.target.value);setPvModal(m=>({...m,f:{...m.f,paid_to_name:"",paid_to_id:""}}));}} placeholder="ابحث في الموردين..." className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={{border:"1px solid #DDD"}}/>
              {!pvModal.f.paid_to_id&&filtSups.length>0&&<div className="rounded-lg overflow-hidden max-h-40 overflow-y-auto mt-1" style={{border:"1px solid #DDD"}}>{filtSups.map(s=><button key={s.id} onClick={()=>{setPvModal(m=>({...m,f:{...m.f,paid_to_name:s.name,paid_to_id:String(s.id)}}));setPvSupSearch(s.name);}} className="w-full text-right px-3 py-2 text-sm hover:bg-[#EBF3FB] border-b last:border-b-0" style={{borderColor:"#F0F0F0"}}><span className="font-medium">{s.name}</span><span className="text-[#999] text-xs mr-2">{s.type}</span></button>)}</div>}
              {!pvModal.f.paid_to_id&&pvSupSearch.trim()&&filtSups.length===0&&<p className="text-xs text-[#D32F2F] mt-1">لا يوجد مورد مطابق — تأكد من الاسم أو اختر "أخرى"</p>}
              {pvModal.f.paid_to_id&&<p className="text-xs text-[#388E3C] flex items-center gap-1 mt-1"><Check size={11}/>تم الاختيار: {pvModal.f.paid_to_name} — <button className="underline text-[#D32F2F]" onClick={()=>{setPvModal(m=>({...m,f:{...m.f,paid_to_name:"",paid_to_id:""}}));setPvSupSearch("");}}>تغيير</button></p>}
            </div>)}
            {pvModal.f.paid_to_type==="other"&&<input type="text" autoComplete="off" value={pvModal.f.paid_to_name} onChange={e=>setPvModal(m=>({...m,f:{...m.f,paid_to_name:e.target.value}}))} placeholder="اسم الجهة / الشخص..." className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={{border:"1px solid #DDD"}}/>}
          </div>
          <div><label className="block text-xs font-semibold text-[#555] mb-1">سبب الصرف *</label>
            {pvModal.f.paid_to_type==="staff"&&<button type="button" onClick={()=>setPvModal(m=>({...m,f:{...m.f,reason:"نفقة شخصية للموظف"}}))} className={`mb-1 w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${pvModal.f.reason==="نفقة شخصية للموظف"?"bg-[#1B3A6B] text-white":"text-[#1B3A6B] hover:bg-[#EBF3FB]"}`} style={{border:"1px solid #1B3A6B"}}>💼 نفقة شخصية للموظف</button>}
            <input type="text" autoComplete="off" value={pvModal.f.reason} onChange={e=>setPvModal(m=>({...m,f:{...m.f,reason:e.target.value}}))} placeholder="وصف المبلغ المصروف" className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={{border:"1px solid #DDD"}}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-[#555] mb-1">ملاحظات</label><input type="text" value={pvModal.f.notes} onChange={e=>setPvModal(m=>({...m,f:{...m.f,notes:e.target.value}}))} placeholder="اختياري" className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={{border:"1px solid #DDD"}}/></div>
            <div><label className="block text-xs font-semibold text-[#555] mb-1">المعتمِد</label><input type="text" value={pvModal.f.approved_by} onChange={e=>setPvModal(m=>({...m,f:{...m.f,approved_by:e.target.value}}))} placeholder="اسم المعتمد" className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={{border:"1px solid #DDD"}}/></div>
          </div>"""
new_dept_modal = """          <div><label className="block text-xs font-semibold text-[#555] mb-1">سبب الصرف *</label>
            <input type="text" autoComplete="off" value={pvModal.f.reason} onChange={e=>setPvModal(m=>({...m,f:{...m.f,reason:e.target.value}}))} placeholder="وصف المبلغ المصروف" className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={{border:"1px solid #DDD"}}/></div>
          <div><label className="block text-xs font-semibold text-[#555] mb-1">ملاحظات</label><input type="text" value={pvModal.f.notes} onChange={e=>setPvModal(m=>({...m,f:{...m.f,notes:e.target.value}}))} placeholder="اختياري" className="w-full h-9 px-3 rounded-lg text-sm outline-none" style={{border:"1px solid #DDD"}}/></div>"""
content = content.replace(old_dept_modal, new_dept_modal)

# 4. Clean FinancialSummaryScreen Modal UI
old_fin_modal = """              <div><label className="block text-xs font-semibold text-[#555] mb-1">المصروف له *</label>
                <div className="flex gap-2 mb-2">
                  {(["supplier","staff","other"] as const).map(t=><button key={t} onClick={()=>setPvModal(m=>({...m,f:{...m.f,paid_to_type:t,paid_to_id:"",paid_to_name:""}}))} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${pvModal.f.paid_to_type===t?"bg-[#1B3A6B] text-white border-[#1B3A6B]":"text-[#555] hover:border-[#1B3A6B]"}`} style={{border:"1px solid #E0E0E0"}}>{t==="supplier"?"مورد":t==="staff"?"موظف":"أخرى"}</button>)}
                </div>
                {pvModal.f.paid_to_type==="staff"&&(<div>
                  <input autoComplete="off" value={pvEmpSearch} onChange={e=>{setPvEmpSearch(e.target.value);setPvModal(m=>({...m,f:{...m.f,paid_to_name:"",paid_to_id:""}}));}} placeholder="ابحث في الموظفين..." className="w-full px-3 h-9 rounded-lg text-sm outline-none mb-1" style={{border:"1px solid #E0E0E0"}}/>
                  {!pvModal.f.paid_to_id&&filtEmps.length>0&&<div className="rounded-lg overflow-hidden max-h-48 overflow-y-auto" style={{border:"1px solid #E0E0E0"}}>{filtEmps.map(e=><button key={e.id} onClick={()=>{setPvModal(m=>({...m,f:{...m.f,paid_to_name:e.name,paid_to_id:String(e.id)}}));setPvEmpSearch(e.name);}} className="w-full text-right px-3 py-2 text-sm hover:bg-[#EBF3FB] border-b last:border-b-0" style={{borderColor:"#F0F0F0"}}><span className="font-medium">{e.name}</span><span className="text-[#999] text-xs mr-2">{e.dept}</span></button>)}</div>}
                  {!pvModal.f.paid_to_id&&pvEmpSearch.trim()&&filtEmps.length===0&&<p className="text-xs text-[#D32F2F] mt-1">لا يوجد موظف مطابق — تأكد من الاسم أو اختر "أخرى"</p>}
                  {pvModal.f.paid_to_id&&<p className="text-xs text-[#388E3C] flex items-center gap-1 mt-1"><Check size={11}/>تم الاختيار: {pvModal.f.paid_to_name} — <button className="underline text-[#D32F2F]" onClick={()=>{setPvModal(m=>({...m,f:{...m.f,paid_to_name:"",paid_to_id:""}}));setPvEmpSearch("");}}>تغيير</button></p>}
                </div>)}
                {pvModal.f.paid_to_type==="supplier"&&(<div>
                  <input autoComplete="off" value={pvSupSearch} onChange={e=>{setPvSupSearch(e.target.value);setPvModal(m=>({...m,f:{...m.f,paid_to_name:"",paid_to_id:""}}));}} placeholder="ابحث في الموردين..." className="w-full px-3 h-9 rounded-lg text-sm outline-none mb-1" style={{border:"1px solid #E0E0E0"}}/>
                  {!pvModal.f.paid_to_id&&filtSups.length>0&&<div className="rounded-lg overflow-hidden max-h-48 overflow-y-auto" style={{border:"1px solid #E0E0E0"}}>{filtSups.map(s=><button key={s.id} onClick={()=>{setPvModal(m=>({...m,f:{...m.f,paid_to_name:s.name,paid_to_id:String(s.id)}}));setPvSupSearch(s.name);}} className="w-full text-right px-3 py-2 text-sm hover:bg-[#EBF3FB] border-b last:border-b-0" style={{borderColor:"#F0F0F0"}}><span className="font-medium">{s.name}</span><span className="text-[#999] text-xs mr-2">{s.type}</span></button>)}</div>}
                  {!pvModal.f.paid_to_id&&pvSupSearch.trim()&&filtSups.length===0&&<p className="text-xs text-[#D32F2F] mt-1">لا يوجد مورد مطابق — تأكد من الاسم أو اختر "أخرى"</p>}
                  {pvModal.f.paid_to_id&&<p className="text-xs text-[#388E3C] flex items-center gap-1 mt-1"><Check size={11}/>تم الاختيار: {pvModal.f.paid_to_name} — <button className="underline text-[#D32F2F]" onClick={()=>{setPvModal(m=>({...m,f:{...m.f,paid_to_name:"",paid_to_id:""}}));setPvSupSearch("");}}>تغيير</button></p>}
                </div>)}
                {pvModal.f.paid_to_type==="other"&&<input autoComplete="off" value={pvModal.f.paid_to_name} onChange={e=>setPvModal(m=>({...m,f:{...m.f,paid_to_name:e.target.value}}))} placeholder="اسم الجهة / الشخص..." className="w-full px-3 h-9 rounded-lg text-sm outline-none" style={{border:"1px solid #E0E0E0"}}/>}
              </div>
              <div><label className="block text-xs font-semibold text-[#555] mb-1">سبب الصرف *</label><input autoComplete="off" value={pvModal.f.reason} onChange={e=>setPvModal(m=>({...m,f:{...m.f,reason:e.target.value}}))} placeholder="دفع فاتورة، راتب موظف..." className="w-full px-3 h-9 rounded-lg text-sm outline-none" style={{border:"1px solid #E0E0E0"}}/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-[#555] mb-1">القسم</label><select value={pvModal.f.dept} onChange={e=>setPvModal(m=>({...m,f:{...m.f,dept:e.target.value}}))} className="w-full px-3 h-9 rounded-lg text-sm outline-none" style={{border:"1px solid #E0E0E0"}}><option value="">— اختر —</option>{allDepts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                <div><label className="block text-xs font-semibold text-[#555] mb-1">التصنيف</label><select value={pvModal.f.category} onChange={e=>setPvModal(m=>({...m,f:{...m.f,category:e.target.value}}))} className="w-full px-3 h-9 rounded-lg text-sm outline-none" style={{border:"1px solid #E0E0E0"}}><option value="">— اختر —</option>{WITHDRAW_CATS.map(c=><option key={c.id} value={c.label}>{c.label}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-semibold text-[#555] mb-1">اعتمد من قِبل</label><input value={pvModal.f.approved_by} onChange={e=>setPvModal(m=>({...m,f:{...m.f,approved_by:e.target.value}}))} placeholder="اسم المعتمِد..." className="w-full px-3 h-9 rounded-lg text-sm outline-none" style={{border:"1px solid #E0E0E0"}}/></div>
              <div><label className="block text-xs font-semibold text-[#555] mb-1">ملاحظات</label><textarea value={pvModal.f.notes} onChange={e=>setPvModal(m=>({...m,f:{...m.f,notes:e.target.value}}))} rows={2} placeholder="ملاحظات إضافية..." className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{border:"1px solid #E0E0E0"}}/></div>"""
new_fin_modal = """              <div><label className="block text-xs font-semibold text-[#555] mb-1">سبب الصرف *</label><input autoComplete="off" value={pvModal.f.reason} onChange={e=>setPvModal(m=>({...m,f:{...m.f,reason:e.target.value}}))} placeholder="دفع فاتورة، راتب موظف..." className="w-full px-3 h-9 rounded-lg text-sm outline-none" style={{border:"1px solid #E0E0E0"}}/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-[#555] mb-1">القسم</label><select value={pvModal.f.dept} onChange={e=>setPvModal(m=>({...m,f:{...m.f,dept:e.target.value}}))} className="w-full px-3 h-9 rounded-lg text-sm outline-none" style={{border:"1px solid #E0E0E0"}}><option value="">— اختر —</option>{allDepts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-semibold text-[#555] mb-1">ملاحظات</label><textarea value={pvModal.f.notes} onChange={e=>setPvModal(m=>({...m,f:{...m.f,notes:e.target.value}}))} rows={2} placeholder="ملاحظات إضافية..." className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none" style={{border:"1px solid #E0E0E0"}}/></div>"""
content = content.replace(old_fin_modal, new_fin_modal)

# 5. Remove 'المصروف له' and 'النوع' from DeptVouchersScreen Table
content = content.replace(
    """<THead cols={["رقم السند","التاريخ","المصروف له","سبب الصرف","المبلغ","إجراءات"]}/>""",
    """<THead cols={["رقم السند","التاريخ","سبب الصرف","المبلغ","إجراءات"]}/>"""
)
content = content.replace(
    """<td className="p-2">{v.paid_to_name}</td>""",
    """"""
)

# 6. Remove 'المصروف له' and 'النوع' and 'المعتمد' from FinancialSummaryScreen Payment Vouchers Table
content = content.replace(
    """{["رقم السند","التاريخ","المصروف له","النوع","السبب","القسم","المبلغ","اعتمد من","إجراءات"].map(h=><th key={h} className="px-3 py-2.5 text-xs font-semibold text-[#555] whitespace-nowrap">{h}</th>)}""",
    """{["رقم السند","التاريخ","الموظف","السبب","القسم","المبلغ","إجراءات"].map(h=><th key={h} className="px-3 py-2.5 text-xs font-semibold text-[#555] whitespace-nowrap">{h}</th>)}"""
)
content = content.replace(
    """<td className="px-3 py-2.5 font-medium text-[#1A1A1A]">{v.paid_to_name}</td>
                  <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{backgroundColor:"#FFF3E0",color:"#E65100"}}>{pvTypeLabel(v.paid_to_type)}</span></td>""",
    """<td className="px-3 py-2.5 font-medium text-[#1A1A1A]">{v.paid_to_name}</td>"""
)
content = content.replace(
    """<td className="px-3 py-2.5 font-bold text-[#D32F2F] whitespace-nowrap">{fmt(v.amount)}</td>
                  <td className="px-3 py-2.5 text-xs text-[#555]">{v.approved_by||"—"}</td>""",
    """<td className="px-3 py-2.5 font-bold text-[#D32F2F] whitespace-nowrap">{fmt(v.amount)}</td>"""
)

# 7. Update printing to remove المعتمد
old_print_dept = """${v.notes?`<div class="kpi-box"><div class="kpi-l">ملاحظات</div><div class="kpi-v">${v.notes}</div></div>`:""}</div><div style="margin-top:60px;display:flex;justify-content:space-between;"><div style="text-align:center;"><div style="border-top:1px solid #333;width:200px;padding-top:8px;">المستلِم</div></div><div style="text-align:center;"><div style="border-top:1px solid #333;width:200px;padding-top:8px;">${v.approved_by||"المعتمِد"}</div></div></div>`;printHtml(html,`سند صرف — ${v.voucher_no}`);};"""
new_print_dept = """${v.notes?`<div class="kpi-box"><div class="kpi-l">ملاحظات</div><div class="kpi-v">${v.notes}</div></div>`:""}</div><div style="margin-top:60px;display:flex;justify-content:space-between;"><div style="text-align:center;"><div style="border-top:1px solid #333;width:200px;padding-top:8px;">توقيع الموظف</div></div></div>`;printHtml(html,`سند صرف — ${v.voucher_no}`);};"""
content = content.replace(old_print_dept, new_print_dept)

old_print_fin = """${v.notes?`<div class="kpi-box"><div class="kpi-l">ملاحظات</div><div class="kpi-v">${v.notes}</div></div>`:""}</div><div style="margin-top:60px;display:flex;justify-content:space-between;"><div style="text-align:center;"><div style="border-top:1px solid #333;width:200px;padding-top:8px;">المستلِم</div></div><div style="text-align:center;"><div style="border-top:1px solid #333;width:200px;padding-top:8px;">${v.approved_by||"المعتمِد"}</div></div></div>`;"""
new_print_fin = """${v.notes?`<div class="kpi-box"><div class="kpi-l">ملاحظات</div><div class="kpi-v">${v.notes}</div></div>`:""}</div><div style="margin-top:60px;display:flex;justify-content:space-between;"><div style="text-align:center;"><div style="border-top:1px solid #333;width:200px;padding-top:8px;">توقيع الموظف</div></div></div>`;"""
content = content.replace(old_print_fin, new_print_fin)

with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Update completed.")
