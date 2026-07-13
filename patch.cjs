const fs = require('fs');

const oldCode = fs.readFileSync('04c6f2e_App.tsx', 'utf8');
const newCode = fs.readFileSync('src/app/App.tsx', 'utf8');

const startMarker = 'function RadSessionScreen({toast,doDeposit,setDebts,debts,patientId,radImages:_radImgs=initialRadImages}:{\n  toast:(m:string,t?:any)=>void;doDeposit:(dept:string,amount:number,title:string,type:string)=>void;\n  setDebts:React.Dispatch<React.SetStateAction<DebtRow[]>>;debts:DebtRow[];patientId?:string;\n  radImages?:RadImage[];\n}){';
const endMarker = '                    {debts.filter(d=>d.pid===p.id).reduce((s,d)=>s+d.amount,0)>0&&<span className="text-xs font-bold text-[#D32F2F]">{fmt(debts.filter(d=>d.pid===p.id).reduce((s,d)=>s+d.amount,0))}</span>}';

const startIdx = oldCode.indexOf(startMarker);
const endIdx = oldCode.indexOf(endMarker, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const missingChunk = oldCode.substring(startIdx + startMarker.length, endIdx);
    
    const targetStartIdx = newCode.indexOf(startMarker);
    const targetEndIdx = newCode.indexOf(endMarker, targetStartIdx);
    
    if (targetStartIdx !== -1 && targetEndIdx !== -1) {
        const patchedCode = newCode.substring(0, targetStartIdx + startMarker.length) + missingChunk + newCode.substring(targetEndIdx);
        fs.writeFileSync('src/app/App.tsx', patchedCode, 'utf8');
        console.log("Successfully patched RadSessionScreen");
    } else {
        console.log("Failed to find boundaries in App.tsx");
    }
} else {
    console.log("Failed to find boundaries in 04c6f2e_App.tsx");
}
