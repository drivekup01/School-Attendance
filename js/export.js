import {statuses,toCSV,download} from './core.js';
export function reportRows(records,kind){
 if(kind==='behavior')return [['วันที่','ห้อง','รหัสนักเรียน','ชื่อ – สกุล','เพิ่ม / ลดคะแนน','เหตุผล','ครูผู้บันทึก'],...records.map(r=>[r.date,r.className,r.studentCode,r.studentName,r.delta,r.reason,r.teacherUid])];
 const rows=[['วันที่','ประเภท','ห้อง','วิชา / กิจกรรม','คาบ','รหัสนักเรียน','เลขที่','ชื่อ – สกุล','สถานะ','หมายเหตุ']];
 for(const session of records)for(const student of session.students){const m=session.marks[student.id];rows.push([session.date,session.kind==='morning'?'เข้าแถว':session.kind==='substitute'?'สอนแทน':'รายวิชา',session.className,session.subject,session.period||'',student.code,student.number,student.name,statuses[m?.status]||'ยังไม่เช็ค',m?.note||'']);}
 return rows;
}
export function csvExport(rows,name){download(new Blob([toCSV(rows)],{type:'text/csv;charset=utf-8;'}),name+'.csv');}
let excelReady;
async function excel(){
 if(!excelReady)excelReady=new Promise((resolve,reject)=>{if(window.ExcelJS)return resolve(window.ExcelJS);const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';s.onload=()=>resolve(window.ExcelJS);s.onerror=()=>{excelReady=null;s.remove();reject(Error('โหลดเครื่องมือ Excel ไม่สำเร็จ กรุณาลองใหม่ หรือส่งออก CSV'));};document.head.append(s);});
 return excelReady;
}
export async function xlsxExport(rows,name){
 const ExcelJS=await excel(),book=new ExcelJS.Workbook();book.creator='School Attendance';const sheet=book.addWorksheet('ข้อมูล',{views:[{state:'frozen',ySplit:1}]});
 for(const row of rows)sheet.addRow(row.map(v=>v==null?'':v));sheet.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF663394'}};sheet.getRow(1).height=28;sheet.columns.forEach((col,i)=>{col.width=[15,16,13,28,10,18,10,33,18,40][i]||25;});sheet.autoFilter={from:{row:1,column:1},to:{row:rows.length,column:rows[0].length}};
 download(new Blob([await book.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),name+'.xlsx');
}
