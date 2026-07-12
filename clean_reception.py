import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace list items containing reception
content = content.replace('{id:"reception",name:"الاستقبال"},', '')
content = content.replace('{id:"reception",short:"الاستقبال"},', '')
content = content.replace('{id:"reception",name:"قسم الاستقبال",short:"الاستقبال"},', '')
content = content.replace('{id:"reception",name:"قسم الاستقبال",short:"الاستقبال",Icon:ClipboardList},', '')
content = content.replace('{id:"reception",label:"قسم الاستقبال"},', '')
content = content.replace('{id:"reception",name:"قسم الاستقبال"},', '')
content = content.replace('{id:"reception",label:"الاستقبال",                emoji:"🏠",color:"#1565C0"},', '')
content = content.replace('reception:"الاستقبال",', '')
content = content.replace('"موظف استقبال":"reception",', '')
content = content.replace('"reception","surgery",', '"surgery",')
content = content.replace('["reception",...DEPARTMENTS', '[...DEPARTMENTS')
content = content.replace('[{id:"reception",name:"قسم الاستقبال"},...DEPARTMENTS', '[...DEPARTMENTS')
content = content.replace('[{id:"reception",name:"قسم الاستقبال",short:"الاستقبال"},...DEPARTMENTS', '[...DEPARTMENTS')
content = content.replace('[{id:"reception",name:"قسم الاستقبال",short:"الاستقبال",Icon:ClipboardList},...DEPARTMENTS', '[...DEPARTMENTS')
content = content.replace('{id:"reception",name:"قسم الاستقبال",short:"الاستقبال"}', '')

with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
