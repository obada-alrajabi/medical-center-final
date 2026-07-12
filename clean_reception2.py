import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"reception":"queue",', '')
content = content.replace('\"reception\",...customDepts', '...customDepts')
content = content.replace('const RECEPTION_DEPT={id:"reception",name:"قسم الاستقبال",short:"الاستقبال",Icon:ClipboardList};', '')
content = content.replace('if(deptId==="reception") return "reception";', '')
content = content.replace('if(deptId==="reception"&&!!perms.canQueue) items.push({id:"reception",label:"قائمة الانتظار",screen:"reception"});', '')
content = content.replace('req.dept||"reception"', 'req.dept||"surgery"')
content = content.replace('if(route.screen==="reception")return"الاستقبال";', '')
content = content.replace('||(route.dept==="reception"?{short:"الاستقبال"}:undefined)', '')
content = content.replace('dept:screenDept="reception"', 'dept:screenDept="surgery"')
content = content.replace('{activeDept==="reception"&&(', '{false&&(')
content = content.replace('{subScreen==="reception"&&activeDept==="reception"&&(', '{false&&(')
content = content.replace('navToScreen(activeDept,"reception")', 'navToScreen(activeDept,"surgery")')

with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
