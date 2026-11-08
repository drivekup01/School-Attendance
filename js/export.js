import {statuses,toCSV,download} from './core.js?v=20261031-student1';
export function reportRows(records,kind){
 if(kind==='behavior')return [['วันที่','ห้อง','รหัสนักเรียน','ชื่อ – สกุล','เพิ่ม / ลดคะแนน','เหตุผล','ครูผู้บันทึก'],...records.map(r=>[r.date,r.className,r.studentCode,r.studentName,r.delta,r.reason,r.teacherUid])];
 const rows=[['วันที่','ประเภท','ห้อง','วิชา / กิจกรรม','คาบ','รหัสนักเรียน','เลขที่','ชื่อ – สกุล','สถานะ','หมายเหตุ']];
 for(const session of records)for(const student of session.students){const m=session.marks[student.id];rows.push([session.date,session.exchangeId?'แลกคาบ':session.kind==='morning'?'เข้าแถว':session.kind==='substitute'?'สอนแทน':'รายวิชา',session.className,session.subject,session.period||'',student.code,student.number,student.name,statuses[m?.status]||'ยังไม่เช็ค',m?.note||'']);}
 return rows;
}
export function csvExport(rows,name){download(new Blob([toCSV(rows)],{type:'text/csv;charset=utf-8;'}),name+'.csv');}
export function subjectReportFilename(report){
 const safe=value=>String(value??'').normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/\s+/g,' ').replace(/[. ]+$/g,'').trim().slice(0,100);
 return `${safe(report.subject)||'รายวิชา'}_ภาคเรียนที่-${safe(report.term)}-${safe(report.year)}_ห้อง-${safe(report.className)}`;
}
function measureText(){
 let context;try{context=document.createElement('canvas').getContext('2d');}catch{}
 return (value,bold=false)=>{const text=String(value??'');if(context){context.font=`${bold?'bold ':''}11pt Tahoma`;const width=context.measureText(text).width;if(width>0)return width;}
 return [...text].reduce((sum,c)=>sum+(/\p{Mark}/u.test(c)?0:/[\u0e00-\u0e7f]/.test(c)?9:/[MW@]/.test(c)?11:7),0)*(bold?1.08:1);};
}
export function fitReportColumns(sheet,rows){
 const measure=measureText();sheet.columns.forEach((col,index)=>{let width=0;for(let row=0;row<rows.length;row++)for(const line of String(rows[row][index]??'').split(/\r?\n/))width=Math.max(width,measure(line,row===0));col.width=Math.min(64,Math.max(7,Math.ceil((width+18)/7*10)/10));});
 sheet.eachRow((row,rowNumber)=>{let lines=1;row.font={name:'Tahoma',size:11,...(rowNumber===1?{bold:true,color:{argb:'FFFFFFFF'}}:{})};row.alignment={vertical:'middle',wrapText:true};
 row.eachCell((cell,index)=>{const available=Math.max(20,sheet.getColumn(index).width*7-14),count=String(cell.value??'').split(/\r?\n/).reduce((n,line)=>n+Math.max(1,Math.ceil(measure(line,rowNumber===1)/available)),0);lines=Math.max(lines,count);});row.height=Math.max(rowNumber===1?30:24,lines*19+8);});
}
let excelReady;
export async function excel(){
 if(!excelReady)excelReady=new Promise((resolve,reject)=>{if(window.ExcelJS)return resolve(window.ExcelJS);const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';s.onload=()=>resolve(window.ExcelJS);s.onerror=()=>{excelReady=null;s.remove();reject(Error('โหลดเครื่องมือ Excel ไม่สำเร็จ กรุณาลองใหม่ หรือส่งออก CSV'));};document.head.append(s);});
 return excelReady;
}
export async function xlsxExport(rows,name){
 const ExcelJS=await excel(),book=new ExcelJS.Workbook();book.creator='School Attendance';const sheet=book.addWorksheet('ข้อมูล',{views:[{state:'frozen',ySplit:1}]});
 for(const row of rows)sheet.addRow(row.map(v=>v==null?'':v));sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF663394'}};fitReportColumns(sheet,rows);sheet.autoFilter={from:{row:1,column:1},to:{row:rows.length,column:rows[0].length}};
 download(new Blob([await book.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),name+'.xlsx');
}
