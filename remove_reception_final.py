import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove "موظف استقبال" from JOB_TITLES
old_job_titles = 'const JOB_TITLES = ["موظف استقبال","موظف مختبر","موظف أشعة","موظف علاج تأهيلي","موظف عيادة وطوارئ"];'
new_job_titles = 'const JOB_TITLES = ["موظف مختبر","موظف أشعة","موظف علاج تأهيلي","موظف عيادة وطوارئ"];'
content = content.replace(old_job_titles, new_job_titles)

# 2. Filter out reception from ALL_DEPTS_FOR_SELECT
old_all_depts = """  const ALL_DEPTS_FOR_SELECT = [
    ...DEPARTMENTS.map(d=>({id:d.id,name:d.name})),
    ...customDepts.map(d=>({id:d.id,name:d.name})),
  ];"""
new_all_depts = """  const ALL_DEPTS_FOR_SELECT = [
    ...DEPARTMENTS.map(d=>({id:d.id,name:d.name})),
    ...customDepts.filter(d=>d.id!=="reception" && d.name!=="قسم الاستقبال").map(d=>({id:d.id,name:d.name})),
  ];"""
content = content.replace(old_all_depts, new_all_depts)

# 3. Filter out reception from allDeptIds inside openPerms
old_allDeptIds = "const allDeptIds = ['reception','surgery','lab','radiology','rehab',"
new_allDeptIds = "const allDeptIds = ['surgery','lab','radiology','rehab',"
content = content.replace(old_allDeptIds, new_allDeptIds)

# 4. Remove reception from the default staff permissions creation
old_blank_staff = """    deptPermissions:{
      surgery: makeDefaultDeptPerms(false), lab: makeDefaultDeptPerms(false),
      radiology: makeDefaultDeptPerms(false), rehab: makeDefaultDeptPerms(false),
      reception: makeDefaultDeptPerms(false),
      ...Object.fromEntries(customDepts.map(d=>[d.id,makeDefaultDeptPerms(false)])),
    },"""
new_blank_staff = """    deptPermissions:{
      surgery: makeDefaultDeptPerms(false), lab: makeDefaultDeptPerms(false),
      radiology: makeDefaultDeptPerms(false), rehab: makeDefaultDeptPerms(false),
      ...Object.fromEntries(customDepts.map(d=>[d.id,makeDefaultDeptPerms(false)])),
    },"""
content = content.replace(old_blank_staff, new_blank_staff)

# 5. Remove 'reception' from allDeptIds global definition (around line 1395)
old_global_all_dept = """  const allDeptIds = new Set([...DEPARTMENTS.map(d=>d.id),...customDepts.map(d=>d.id)]);"""
new_global_all_dept = """  const allDeptIds = new Set([...DEPARTMENTS.map(d=>d.id),...customDepts.filter(d=>d.id!=="reception").map(d=>d.id)]);"""
content = content.replace(old_global_all_dept, new_global_all_dept)

with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.tsx to remove Reception completely")
