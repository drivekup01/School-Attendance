export const roomSheets=Array.from({length:6},(_,g)=>Array.from({length:3},(_,r)=>`${g+1}.${r+1}`)).flat();
export function parseRoster(book,XLSX){
 const codes=new Set(),rooms=[],warnings=[];
 for(const sheet of roomSheets){
  if(!book.Sheets[sheet])throw Error(`ไม่พบชีต ${sheet} กรุณาใช้ไฟล์ครบ 18 ห้อง`);
  const rows=XLSX.utils.sheet_to_json(book.Sheets[sheet],{header:1,defval:'',raw:false});
  const header=rows.findIndex(r=>String(r[1]).replace(/\s/g,'')==='เลขที่'&&String(r[2]).replace(/\s/g,'')==='เลขประจำตัว');
  if(header<0)throw Error(`ชีต ${sheet}: ไม่พบหัวตารางเลขที่ / เลขประจำตัว`);
  const year=Number(rows.slice(0,header).flat().join(' ').match(/ปีการศึกษา\s*(25\d{2})/)?.[1]);
  if(!year)throw Error(`ชีต ${sheet}: ไม่พบปีการศึกษา`);
  const students=[],numbers=new Set();
  for(let i=header+1;i<rows.length;i++){
   const r=rows[i],numberText=String(r[1]).trim(),code=String(r[2]).trim();
   if(!numberText){if(code)warnings.push(`${sheet} แถว ${i+1}: ไม่มีเลขที่ จึงไม่นำเข้า (รหัส ${code})`);continue;}
   const number=Number(numberText),parts=r.slice(3,6).map(x=>String(x).trim());
   if(!Number.isInteger(number)||number<1||number>100||!/^\d{1,20}$/.test(code)||parts.length!==3||parts.some(x=>!x))throw Error(`ชีต ${sheet} แถว ${i+1}: ข้อมูลไม่ครบหรือไม่ถูกต้อง`);
   if(codes.has(code)||numbers.has(number))throw Error(`ชีต ${sheet} แถว ${i+1}: เลขประจำตัวหรือเลขที่ซ้ำ`);
   codes.add(code);numbers.add(number);students.push({number,code,name:parts[0]+parts[1]+' '+parts[2]});
  }
  if(!students.length||students.length>100)throw Error(`ชีต ${sheet}: ต้องมีนักเรียน 1–100 คน`);
  students.sort((a,b)=>a.number-b.number);
  rooms.push({sheet,label:'ม.'+sheet.replace('.','/'),academicYear:year,students});
 }
 return {rooms,warnings,total:codes.size};
}
let ready;
async function reader(){
 if(!ready)ready=new Promise((resolve,reject)=>{if(window.XLSX)return resolve(window.XLSX);const s=document.createElement('script');s.src='https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';s.onload=()=>window.XLSX?resolve(window.XLSX):reject(Error('โหลดเครื่องมือ Excel ไม่สำเร็จ'));s.onerror=()=>{ready=null;s.remove();reject(Error('โหลดเครื่องมือ Excel ไม่สำเร็จ กรุณาลองใหม่'));};document.head.append(s);});return ready;
}
export async function readRoster(file){if(file.size>10*1024*1024)throw Error('ไฟล์ต้องไม่เกิน 10 MB');const XLSX=await reader();return parseRoster(XLSX.read(await file.arrayBuffer(),{type:'array'}),XLSX);}
