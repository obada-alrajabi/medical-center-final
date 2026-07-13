import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. First mapping block
target1 = """      if(dbLabTests&&(dbLabTests as any[]).length>0){
        const mapped=(dbLabTests as any[]).map((t:any)=>{
          const ranges = Array.isArray(t.ranges) 
            ? t.ranges.map((r: any) => ({
                param: r.parameter_name || "",
                unit: r.unit || "",
                min: r.min_value || "",
                max: r.max_value || "",
                note: r.normal_value || ""
              }))
            : [];
          return {
            id:t.id,
            code:t.code||"",
            name:t.name||"",
            nameEn:t.name_en||"",
            cat:t.category||"تحاليل الدم",
            priceOfficial:Number(t.price_official)||0,
            price:Number(t.price)||0,
            consumablesCost:Number(t.consumables_cost)||0,
            priceCost:Number(t.price_cost)||0,
            isL2L:!!t.is_l2l,
            kit:t.kit||"",
            kitQty:Number(t.kit_qty)||0,
            kitUnit:t.kit_unit||"وحدة",
            kitThreshold:Number(t.kit_threshold)||10,
            time:t.time_estimate||"",
            timeUnit:"ساعة",
            normalRanges: ranges
          };
        });
        initialLabTests.splice(0,initialLabTests.length,...mapped);
        setLabTests([...mapped]);
      }"""

replacement1 = """      if(dbLabTests&&(dbLabTests as any[]).length>0){
        const mapped=(dbLabTests as any[]).map((t:any)=>{
          const ranges = Array.isArray(t.normalRanges) 
            ? t.normalRanges.map((r: any) => ({
                param: r.param || "",
                unit: r.unit || "",
                min: r.min || "",
                max: r.max || "",
                note: r.note || ""
              }))
            : [];
          return {
            id:t.id,
            code:t.code||"",
            name:t.name||"",
            nameEn:t.name_en||"",
            cat:t.category||"تحاليل الدم",
            priceOfficial:Number(t.price_official)||0,
            price:Number(t.price)||0,
            consumablesCost:Number(t.consumables_cost)||0,
            priceCost:Number(t.price_cost)||0,
            isL2L:!!t.is_l2l,
            kit:t.kit||"",
            kitQty:Number(t.kit_qty)||0,
            kitUnit:t.kit_unit||"وحدة",
            kitThreshold:Number(t.kit_threshold)||10,
            time:t.time_estimate||"",
            timeUnit:"ساعة",
            normalRanges: ranges
          };
        });
        initialLabTests.splice(0,initialLabTests.length,...mapped);
        setLabTests([...mapped]);
      }"""

# 2. Second mapping block
target2 = """      if(dbLabTests&&(dbLabTests as any[]).length>0){
        const mapped=(dbLabTests as any[]).map((t:any)=>({id:t.id,code:t.code||"",name:t.name||"",nameEn:t.name_en||"",cat:t.category||"تحاليل الدم",priceOfficial:Number(t.price_official)||0,price:Number(t.price)||0,consumablesCost:Number(t.consumables_cost)||0,priceCost:Number(t.price_cost)||0,isL2L:!!t.is_l2l,kit:t.kit||"",kitQty:Number(t.kit_qty)||0,kitUnit:t.kit_unit||"وحدة",kitThreshold:Number(t.kit_threshold)||10,time:t.time_estimate||"",timeUnit:"ساعة",normalRanges:[]}));
        initialLabTests.splice(0,initialLabTests.length,...mapped);
        setLabTests([...mapped]);
      }"""

replacement2 = """      if(dbLabTests&&(dbLabTests as any[]).length>0){
        const mapped=(dbLabTests as any[]).map((t:any)=>{
          const ranges = Array.isArray(t.normalRanges) 
            ? t.normalRanges.map((r: any) => ({
                param: r.param || "",
                unit: r.unit || "",
                min: r.min || "",
                max: r.max || "",
                note: r.note || ""
              }))
            : [];
          return {
            id:t.id,
            code:t.code||"",
            name:t.name||"",
            nameEn:t.name_en||"",
            cat:t.category||"تحاليل الدم",
            priceOfficial:Number(t.price_official)||0,
            price:Number(t.price)||0,
            consumablesCost:Number(t.consumables_cost)||0,
            priceCost:Number(t.price_cost)||0,
            isL2L:!!t.is_l2l,
            kit:t.kit||"",
            kitQty:Number(t.kit_qty)||0,
            kitUnit:t.kit_unit||"وحدة",
            kitThreshold:Number(t.kit_threshold)||10,
            time:t.time_estimate||"",
            timeUnit:"ساعة",
            normalRanges: ranges
          };
        });
        initialLabTests.splice(0,initialLabTests.length,...mapped);
        setLabTests([...mapped]);
      }"""

# 3. TestCatalogScreen handleSave dbPayload
target3 = """    const base={code:form.code,name:form.name,nameEn:form.nameEn,cat:form.cat,priceOfficial:parseFloat(form.priceOfficial)||0,price:parseFloat(form.price)||0,consumablesCost:parseFloat(form.consumablesCost)||0,priceCost:parseFloat(form.priceCost)||0,isL2L:form.isL2L==="true",kit:form.kit,kitQty:parseInt(form.kitQty)||0,kitUnit:form.kitUnit,kitThreshold:parseInt(form.kitThreshold)||10,time:form.time,normalRanges};
    const dbPayload={code:form.code,name:form.name,name_en:form.nameEn,category:form.cat,price_official:parseFloat(form.priceOfficial)||0,price:parseFloat(form.price)||0,consumables_cost:parseFloat(form.consumables_cost)||0,price_cost:parseFloat(form.price_cost)||0,is_l2l:form.isL2L==="true",kit:form.kit,kit_qty:parseInt(form.kit_qty)||0,kit_unit:form.kit_unit,kit_threshold:parseInt(form.kit_threshold)||10,time_estimate:form.time};"""

replacement3 = """    const base={code:form.code,name:form.name,nameEn:form.nameEn,cat:form.cat,priceOfficial:parseFloat(form.priceOfficial)||0,price:parseFloat(form.price)||0,consumablesCost:parseFloat(form.consumablesCost)||0,priceCost:parseFloat(form.priceCost)||0,isL2L:form.isL2L==="true",kit:form.kit,kitQty:parseInt(form.kitQty)||0,kitUnit:form.kitUnit,kitThreshold:parseInt(form.kitThreshold)||10,time:form.time,normalRanges};
    const dbPayload={code:form.code,name:form.name,name_en:form.nameEn,category:form.cat,price_official:parseFloat(form.priceOfficial)||0,price:parseFloat(form.price)||0,consumables_cost:parseFloat(form.consumablesCost)||0,price_cost:parseFloat(form.priceCost)||0,is_l2l:form.isL2L==="true",kit:form.kit,kit_qty:parseInt(form.kitQty)||0,kit_unit:form.kitUnit,kit_threshold:parseInt(form.kitThreshold)||10,time_estimate:form.time,normalRanges};"""

# 4. LabSessionScreen openResults queue lookup
target4 = """    s.tests.forEach(testName=>{
      const t=_labTests.find(x=>x.name===testName);
      const defaults=t?DEFAULT_TEST_PARAMS[t.code]:undefined;
      if(defaults&&defaults.length>0){
        p[testName]=defaults.map(d=>({name:d.name,unit:d.unit,min:d.min,max:d.max}));
      } else {
        p[testName]=(t?.normalRanges||[]).map(r=>({name:r.param,unit:r.unit,min:r.min,max:r.max}));
      }
    });"""

replacement4 = """    s.tests.forEach(testName=>{
      const isL2L = s.labType === "external";
      const t = _labTests.find(x => x.name === testName && x.isL2L === isL2L) || _labTests.find(x => x.name === testName);
      const defaults=t?DEFAULT_TEST_PARAMS[t.code]:undefined;
      if(defaults&&defaults.length>0){
        p[testName]=defaults.map(d=>({name:d.name,unit:d.unit,min:d.min,max:d.max}));
      } else {
        p[testName]=(t?.normalRanges||[]).map(r=>({name:r.param,unit:r.unit,min:r.min,max:r.max}));
      }
    });"""

# 5. NewPatientScreen declaration props
target5 = """function NewPatientScreen({dept,doDeposit,setSessions,setDebts,toast,onNavigate,radImages:radImagesP,insurances=[],setInvoices,diagnoses=[],setDiagnoses,loggedUser,drugs=[],setDrugs,rehabServices=[]}:{dept:string;doDeposit:(dept:string,amount:number,title:string,type:string)=>void;setSessions?:React.Dispatch<React.SetStateAction<PatientSession[]>>;setDebts?:React.Dispatch<React.SetStateAction<DebtRow[]>>;toast:(m:string,t?:any)=>void;onNavigate:(r:Route)=>void;radImages?:RadImage[];insurances?:InsuranceCo[];setInvoices?:React.Dispatch<React.SetStateAction<Invoice[]>>;diagnoses?:DiagnosisEntry[];setDiagnoses?:React.Dispatch<React.SetStateAction<DiagnosisEntry[]>>;loggedUser?:LoggedUser;drugs?:string[];setDrugs?:React.Dispatch<React.SetStateAction<string[]>>;rehabServices?:RehabServiceItem[]}){"""

replacement5 = """function NewPatientScreen({dept,doDeposit,setSessions,setDebts,toast,onNavigate,radImages:radImagesP,insurances=[],setInvoices,diagnoses=[],setDiagnoses,loggedUser,drugs=[],setDrugs,rehabServices=[],labTests:labTestsP=[]}:{dept:string;doDeposit:(dept:string,amount:number,title:string,type:string)=>void;setSessions?:React.Dispatch<React.SetStateAction<PatientSession[]>>;setDebts?:React.Dispatch<React.SetStateAction<DebtRow[]>>;toast:(m:string,t?:any)=>void;onNavigate:(r:Route)=>void;radImages?:RadImage[];insurances?:InsuranceCo[];setInvoices?:React.Dispatch<React.SetStateAction<Invoice[]>>;diagnoses?:DiagnosisEntry[];setDiagnoses?:React.Dispatch<React.SetStateAction<DiagnosisEntry[]>>;loggedUser?:LoggedUser;drugs?:string[];setDrugs?:React.Dispatch<React.SetStateAction<string[]>>;rehabServices?:RehabServiceItem[];labTests?:LabTest[]}){"""

# 6. NewPatientScreen test selection logic
target6 = """  const [selTests,setSelTests]=useState<string[]>([]);
  const [testSearch,setTestSearch]=useState("");
  const [catFilter,setCatFilter]=useState("الكل");
  const filteredTestsNP=initialLabTests.filter(t=>(catFilter==="الكل"||t.cat===catFilter)&&(!testSearch||(t.name+t.code).includes(testSearch)));
  const selTestsDataNP=selTests.map(c=>initialLabTests.find(t=>t.code===c)).filter(Boolean) as LabTest[];
  const testTotalNP=selTestsDataNP.reduce((s,t)=>s+t.price,0);
  const toggleTestNP=(code:string)=>setSelTests(p=>p.includes(code)?p.filter(c=>c!==code):[...p,code]);"""

replacement6 = """  const [selTests,setSelTests]=useState<number[]>([]);
  const [testSearch,setTestSearch]=useState("");
  const [catFilter,setCatFilter]=useState("الكل");
  const [labTypeFilterNP,setLabTypeFilterNP]=useState<"internal"|"external">("internal");
  const _labTestsSource = labTestsP && labTestsP.length > 0 ? labTestsP : initialLabTests;
  const filteredTestsNP=_labTestsSource.filter(t=>(catFilter==="الكل"||t.cat===catFilter)&&(labTypeFilterNP==="internal"?!t.isL2L:t.isL2L)&&(!testSearch||(t.name+t.code).includes(testSearch)));
  const selTestsDataNP=selTests.map(id=>_labTestsSource.find(t=>t.id===id)).filter(Boolean) as LabTest[];
  const testTotalNP=selTestsDataNP.reduce((s,t)=>s+t.price,0);
  const toggleTestNP=(id:number)=>setSelTests(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);"""

# 7. NewPatientScreen save handler and queue creation
target7 = """        const sessionLabR=isLab?selTests:[] as string[];
        const sessionRadR=isRad?selImgsDataNP.map(t=>t.name):[] as string[];
        const ns:PatientSession={id:Date.now(),patientId:effectiveId,dept,doctor:autoDoc||deptInfo.short,date:today,diagnoses:sessionDiag,medications:medications.filter(m=>m.name.trim()).map(m=>({name:m.name,dose:m.dose,freq:m.freq,duration:m.duration})),notes:sessionNotesComputed,labRefs:sessionLabR,radRefs:sessionRadR,amount:sessionNet,paid:sessionPaid,debt:sessionDebt};
        setSessions(prev=>[ns,...prev]);
        api.sessions.create({patient_id:effectiveId,dept,doctor:autoDoc||deptInfo.short,date:form.joinDate||_localISO(),diagnoses:sessionDiag,medications:medications.filter(m=>m.name.trim()),notes:sessionNotesComputed,lab_refs:sessionLabR,rad_refs:sessionRadR,amount:sessionNet,paid:sessionPaid,debt:sessionDebt}).then((r:any)=>{
          if(pendingFiles.length>0&&r&&r.id){const fd=new FormData();pendingFiles.forEach(f=>fd.append("files",f));const _tok=getAdminToken();fetch(`/api/sessions/${r.id}/files`,{method:"POST",headers:_tok?{Authorization:`Bearer ${_tok}`}:{},body:fd}).catch(()=>{});}
          if(isLab && sessionLabR.length>0){
            api.queues.create({
              dept: "lab",
              patient_name: form.name,
              items: selTestsDataNP.map(t=>t.name),
              queue_time: _nowHHMM(),
              status: "pending",
              notes: "lab_type:internal"
            }).catch(()=>{});
          }"""

replacement7 = """        const sessionLabR=isLab?selTestsDataNP.map(t=>t.code):[] as string[];
        const sessionRadR=isRad?selImgsDataNP.map(t=>t.name):[] as string[];
        const ns:PatientSession={id:Date.now(),patientId:effectiveId,dept,doctor:autoDoc||deptInfo.short,date:today,diagnoses:sessionDiag,medications:medications.filter(m=>m.name.trim()).map(m=>({name:m.name,dose:m.dose,freq:m.freq,duration:m.duration})),notes:sessionNotesComputed,labRefs:sessionLabR,radRefs:sessionRadR,amount:sessionNet,paid:sessionPaid,debt:sessionDebt};
        setSessions(prev=>[ns,...prev]);
        api.sessions.create({patient_id:effectiveId,dept,doctor:autoDoc||deptInfo.short,date:form.joinDate||_localISO(),diagnoses:sessionDiag,medications:medications.filter(m=>m.name.trim()),notes:sessionNotesComputed,lab_refs:sessionLabR,rad_refs:sessionRadR,amount:sessionNet,paid:sessionPaid,debt:sessionDebt}).then((r:any)=>{
          if(pendingFiles.length>0&&r&&r.id){const fd=new FormData();pendingFiles.forEach(f=>fd.append("files",f));const _tok=getAdminToken();fetch(`/api/sessions/${r.id}/files`,{method:"POST",headers:_tok?{Authorization:`Bearer ${_tok}`}:{},body:fd}).catch(()=>{});}
          if(isLab && sessionLabR.length>0){
            api.queues.create({
              dept: "lab",
              patient_name: form.name,
              items: selTestsDataNP.map(t=>t.name),
              queue_time: _nowHHMM(),
              status: "pending",
              notes: `lab_type:${labTypeFilterNP}`
            }).catch(()=>{});
          }"""

# 8. NewPatientScreen Step 2 checklist UI changes
target8 = """            <Card title="اختيار الفحوصات المطلوبة">
              <div className="flex gap-1.5 mb-3 flex-wrap">{(["الكل",...LAB_CATS]).map(c=><button key={c} onClick={()=>setCatFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catFilter===c?"bg-[#0D7377] text-white":"bg-[#F5F5F5] text-[#555] hover:bg-[#E6F4F4]"}`}>{c}</button>)}</div>
              <div className="relative mb-3"><Search size={13} className="absolute top-1/2 right-3 -translate-y-1/2 text-[#999]"/><input value={testSearch} onChange={e=>setTestSearch(e.target.value)} placeholder="ابحث عن فحص..." className="w-full h-9 pr-8 pl-3 rounded-lg text-sm outline-none" style={{border:"1px solid #E0E0E0",backgroundColor:"#FAFAFA"}}/></div>
              <div className="space-y-1.5 overflow-y-auto" style={{maxHeight:360}}>
                {filteredTestsNP.map(t=>(
                  <label key={t.code} onClick={()=>toggleTestNP(t.code)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selTests.includes(t.code)?"bg-[#E6F4F4] border-[#0D7377]":"bg-[#FAFAFA] border-[#E0E0E0] hover:border-[#0D7377]"}`} style={{border:"1px solid"}}>
                    <input type="checkbox" readOnly checked={selTests.includes(t.code)} className="accent-[#0D7377] flex-shrink-0"/>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-[#999]">{t.code} · {t.cat} · {t.time}</p></div>
                    <div className="text-left flex-shrink-0"><p className="text-sm font-bold text-[#0D7377]">{fmt(t.price)}</p>{t.kitQty>0&&t.kitQty<=t.kitThreshold&&<p className="text-xs text-[#FF8F00]">⚠️ مخزون منخفض</p>}</div>
                  </label>
                ))}
              </div>
            </Card>
          </div>
          <div className="md:col-span-2">
            <div className="sticky top-4 space-y-3">
              <Card title="الفحوصات المحددة">
                {selTests.length===0?<p className="text-sm text-[#999] text-center py-4">لم يُحدَّد فحص بعد</p>:(
                  <div className="space-y-2">
                    {selTestsDataNP.map(t=>(
                      <div key={t.code} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{backgroundColor:"#E6F4F4",border:"1px solid #B2DFDB"}}>
                        <button onClick={()=>toggleTestNP(t.code)} className="text-[#D32F2F] hover:text-[#B71C1C] ml-1"><X size={12}/></button>
                        <span className="text-sm flex-1 text-right mx-2">{t.name}</span>
                        <span className="text-sm font-bold text-[#0D7377]">{fmt(t.price)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-[#E0E0E0] flex justify-between text-sm font-bold"><span>الإجمالي:</span><span className="text-[#0D7377]">{fmt(testTotalNP)}</span></div>
                  </div>
                )}
              </Card>
              <div className="flex gap-2"><Btn variant="outline" onClick={()=>setStep(1)}>رجوع</Btn><Btn variant="secondary" full onClick={()=>{setForm(p=>({...p,price:String(testTotalNP)}));setStep(3);}} disabled={selTests.length===0}>التالي: التفاصيل المالية →</Btn></div>"""

replacement8 = """            <Card title="اختيار الفحوصات المطلوبة">
              <div className="flex gap-2 mb-4 bg-[#F5F5F5] p-1 rounded-lg">
                <button type="button" onClick={()=>setLabTypeFilterNP("internal")} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${labTypeFilterNP==="internal"?"bg-[#1B3A6B] text-white shadow-sm":"text-[#555] hover:bg-white"}`}>🔬 المختبر الداخلي</button>
                <button type="button" onClick={()=>setLabTypeFilterNP("external")} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${labTypeFilterNP==="external"?"bg-[#FF8F00] text-white shadow-sm":"text-[#555] hover:bg-white"}`}>🔗 مختبر خارجي L2L</button>
              </div>
              <div className="flex gap-1.5 mb-3 flex-wrap">{(["الكل",...LAB_CATS]).map(c=><button key={c} onClick={()=>setCatFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catFilter===c?"bg-[#0D7377] text-white":"bg-[#F5F5F5] text-[#555] hover:bg-[#E6F4F4]"}`}>{c}</button>)}</div>
              <div className="relative mb-3"><Search size={13} className="absolute top-1/2 right-3 -translate-y-1/2 text-[#999]"/><input value={testSearch} onChange={e=>setTestSearch(e.target.value)} placeholder="ابحث عن فحص..." className="w-full h-9 pr-8 pl-3 rounded-lg text-sm outline-none" style={{border:"1px solid #E0E0E0",backgroundColor:"#FAFAFA"}}/></div>
              <div className="space-y-1.5 overflow-y-auto" style={{maxHeight:360}}>
                {filteredTestsNP.map(t=>(
                  <label key={t.id} onClick={()=>toggleTestNP(t.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selTests.includes(t.id)?"bg-[#E6F4F4] border-[#0D7377]":"bg-[#FAFAFA] border-[#E0E0E0] hover:border-[#0D7377]"}`} style={{border:"1px solid"}}>
                    <input type="checkbox" readOnly checked={selTests.includes(t.id)} className="accent-[#0D7377] flex-shrink-0"/>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-[#999]">{t.code} · {t.cat} · {t.time}</p></div>
                    <div className="text-left flex-shrink-0"><p className="text-sm font-bold text-[#0D7377]">{fmt(t.price)}</p>{t.kitQty>0&&t.kitQty<=t.kitThreshold&&<p className="text-xs text-[#FF8F00]">⚠️ مخزون منخفض</p>}</div>
                  </label>
                ))}
              </div>
            </Card>
          </div>
          <div className="md:col-span-2">
            <div className="sticky top-4 space-y-3">
              <Card title="الفحوصات المحددة">
                {selTests.length===0?<p className="text-sm text-[#999] text-center py-4">لم يُحدَّد فحص بعد</p>:(
                  <div className="space-y-2">
                    {selTestsDataNP.map(t=>(
                      <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{backgroundColor:"#E6F4F4",border:"1px solid #B2DFDB"}}>
                        <button onClick={()=>toggleTestNP(t.id)} className="text-[#D32F2F] hover:text-[#B71C1C] ml-1"><X size={12}/></button>
                        <span className="text-sm flex-1 text-right mx-2">{t.name}</span>
                        <span className="text-sm font-bold text-[#0D7377]">{fmt(t.price)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-[#E0E0E0] flex justify-between text-sm font-bold"><span>الإجمالي:</span><span className="text-[#0D7377]">{fmt(testTotalNP)}</span></div>
                  </div>
                )}
              </Card>
              <div className="flex gap-2"><Btn variant="outline" onClick={()=>setStep(1)}>رجوع</Btn><Btn variant="secondary" full onClick={()=>{setForm(p=>({...p,price:String(testTotalNP)}));setStep(3);}} disabled={selTests.length===0}>التالي: التفاصيل المالية →</Btn></div>"""

# 9. Parent render pass instance 1 (StaffPortal)
target9 = """            <NewPatientScreen dept={activeDept} doDeposit={doDeposit} setSessions={setSessions} setDebts={setDebts} toast={staffToast} onNavigate={r=>{setRoute(r)}} insurances={insurances} diagnoses={diagnoses} setDiagnoses={setDiagnoses} setInvoices={setInvoices} radImages={radImages}/>"""

replacement9 = """            <NewPatientScreen dept={activeDept} doDeposit={doDeposit} setSessions={setSessions} setDebts={setDebts} toast={staffToast} onNavigate={r=>{setRoute(r)}} insurances={insurances} diagnoses={diagnoses} setDiagnoses={setDiagnoses} setInvoices={setInvoices} radImages={radImages} labTests={labTests}/>"""

# parent render pass instance 2 (Main App)
target10 = """case"new-patient":       return<NewPatientScreen dept={dept} doDeposit={(d,a,t,ty)=>doDeposit(d,a,t,ty)} setSessions={setSessions} setDebts={setDebts}
                                                toast={toast} onNavigate={setRoute} radImages={radImages} insurances={insurances} setInvoices={setInvoices}
                                                diagnoses={diagnoses} setDiagnoses={setDiagnoses}/>;"""

replacement10 = """case"new-patient":       return<NewPatientScreen dept={dept} doDeposit={(d,a,t,ty)=>doDeposit(d,a,t,ty)} setSessions={setSessions} setDebts={setDebts}
                                                toast={toast} onNavigate={setRoute} radImages={radImages} insurances={insurances} setInvoices={setInvoices}
                                                diagnoses={diagnoses} setDiagnoses={setDiagnoses} labTests={labTests}/>;"""

print("Replacing target1...")
if target1 in content:
    content = content.replace(target1, replacement1)
else:
    print("WARNING: target1 NOT found!")

print("Replacing target2...")
if target2 in content:
    content = content.replace(target2, replacement2)
else:
    print("WARNING: target2 NOT found!")

print("Replacing target3...")
if target3 in content:
    content = content.replace(target3, replacement3)
else:
    print("WARNING: target3 NOT found!")

print("Replacing target4...")
if target4 in content:
    content = content.replace(target4, replacement4)
else:
    print("WARNING: target4 NOT found!")

print("Replacing target5...")
if target5 in content:
    content = content.replace(target5, replacement5)
else:
    print("WARNING: target5 NOT found!")

print("Replacing target6...")
if target6 in content:
    content = content.replace(target6, replacement6)
else:
    print("WARNING: target6 NOT found!")

print("Replacing target7...")
if target7 in content:
    content = content.replace(target7, replacement7)
else:
    print("WARNING: target7 NOT found!")

print("Replacing target8...")
if target8 in content:
    content = content.replace(target8, replacement8)
else:
    print("WARNING: target8 NOT found!")

print("Replacing target9...")
if target9 in content:
    content = content.replace(target9, replacement9)
else:
    print("WARNING: target9 NOT found!")

print("Replacing target10...")
if target10 in content:
    content = content.replace(target10, replacement10)
else:
    print("WARNING: target10 NOT found!")

with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Modifications applied successfully.")
