import './attendance-blocks.js?v=20261108-block1';
const Blocks=globalThis.AttendanceBlocks;
export const columnName=n=>{let out='';for(;n;n=Math.floor((n-1)/26))out=String.fromCharCode(65+(n-1)%26)+out;return out;};
const months=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const weekdays=['จ','อ','พ','พฤ','ศ'];
const dateMs=s=>Date.parse(s+'T00:00:00Z');
const iso=n=>new Date(n).toISOString().slice(0,10);
const code=h=>h.status==='present'?'/':h.status==='late'?'ส':h.status==='absent'?'ข':h.status==='leave'?(h.leaveType==='sick'?'ป':h.leaveType==='personal'?'ล':'ลา'):'';
export const PP5_WEEKS=20;
export function preparePp5Reports(reports){
 if(!Array.isArray(reports)||!reports.length)throw Error('ไม่มีรายงานสำหรับส่งออก');
 const first=reports[0],key=r=>JSON.stringify([String(r.subjectCode||'').trim(),String(r.subject||'').trim(),r.year,r.term]);
 if(reports.some(r=>key(r)!==key(first)))throw Error('รวมไฟล์ได้เฉพาะรหัสวิชา รายวิชา และภาคเรียนเดียวกัน');
 if(reports.length>1&&!first.subjectCode)throw Error('ยังไม่มีรหัสวิชาที่ชัดเจน กรุณาส่งออกแยกห้องหรือแก้ทะเบียนวิชาก่อน');
 return reports.map(report=>{
  if(!report.range||!Array.isArray(report.lessons)||report.lessons.length!==report.total)throw Error('กรุณาโหลดรายงานใหม่ก่อนส่งออก ปพ.5');
  const begin=dateMs(report.range.from),end=dateMs(report.range.to);if(!Number.isFinite(begin)||!Number.isFinite(end)||end<begin||end-begin>250*86400000)throw Error('ช่วงภาคเรียนไม่ถูกต้อง');
  const monday=begin-((new Date(begin).getUTCDay()+6)%7)*86400000,to=iso(Math.min(end,monday+(PP5_WEEKS*7-1)*86400000)),range={from:report.range.from,to};
  const lessons=report.lessons.filter(l=>l.date>=range.from&&l.date<=range.to),keys=new Set(lessons.map(l=>l.date+'_'+l.period)),today=report.asOf||range.to,elapsed=lessons.filter(l=>l.date<=today).length;
  const students=report.students.map(student=>{
   const original=student.history||[],history=original.filter(h=>keys.has(h.date+'_'+h.period));
   if(history.some(h=>h.conflict)||student.conflicts>0&&!original.some(h=>Object.hasOwn(h,'conflict')))throw Error('มีผลเช็คชื่อซ้ำที่ขัดแย้งกัน กรุณาตรวจสอบก่อนส่งออก ปพ.5');
   const totals={present:0,late:0,leave:0,absent:0};for(const h of history){if(!Object.hasOwn(totals,h.status))throw Error('สถานะเช็คชื่อไม่ถูกต้อง');totals[h.status]++;}
   const total=lessons.length,remaining=total-totals.absent;
   return {...student,...totals,history,total,elapsed,pending:Math.max(0,elapsed-history.length),percentage:total?remaining/total*100:null,risk:total>0&&remaining*100<total*70,conflicts:0,incomplete:elapsed>history.length||today<range.to};
  });
  return {...report,calendarRange:report.calendarRange||report.range,range,exportWeeks:PP5_WEEKS,lessons,total:lessons.length,students};
 });
}
export function buildPp5Model(reports){
 reports=preparePp5Reports(reports);
 const sheets=[];
 for(const report of reports){
  if(!report.range||!Array.isArray(report.lessons))throw Error('กรุณาโหลดรายงานใหม่ก่อนส่งออก ปพ.5');
  if(report.students.some(s=>s.conflicts>0))throw Error('มีผลเช็คชื่อซ้ำที่ขัดแย้งกัน กรุณาตรวจสอบก่อนส่งออก ปพ.5');
  const begin=dateMs(report.range.from),finish=dateMs(report.range.to);if(!Number.isFinite(begin)||!Number.isFinite(finish)||finish<begin||finish-begin>250*86400000)throw Error('ช่วงภาคเรียนไม่ถูกต้อง');
  const first=begin-((new Date(begin).getUTCDay()+6)%7)*86400000,weekCount=PP5_WEEKS,pageCount=4,students=[...report.students].sort((a,b)=>a.number-b.number),names=[];if(!students.length)throw Error('ไม่พบรายชื่อนักเรียนในห้องนี้');
  const lessons=report.lessons.map((l,index)=>({...l,classId:report.className,subject:report.subject,key:String(index)}));
  if(lessons.some(l=>new Date(dateMs(l.date)).getUTCDay()===0||new Date(dateMs(l.date)).getUTCDay()===6))throw Error('พบคาบเรียนวันเสาร์–อาทิตย์ ซึ่งอยู่นอกแม่แบบ จ–ศ กรุณาตรวจปฏิทินก่อนส่งออก');
  const groups=Blocks.groups(lessons).map(block=>({date:block[0].date,periods:[...new Set(block.map(l=>Number(l.period)))],lessons:block})).sort((a,b)=>a.date.localeCompare(b.date)||a.periods[0]-b.periods[0]);
  if(groups.reduce((n,g)=>n+g.periods.length,0)!==report.total)throw Error('จำนวนคาบในรายงานไม่ตรงกับรายละเอียด กรุณาโหลดใหม่');
  const checks=new Map(students.map(s=>[s.id,new Map((s.history||[]).map(h=>[h.date+'_'+h.period,h]))])),totals=new Map(students.map(s=>[s.id,{present:0,sick:0,personal:0,unknown:0,absent:0,late:0}]));
  let cumulative=0;
  const roomNumber=report.className.split('/').at(-1).replace(/[^0-9]/g,'')||'1';
  for(let page=0;page<pageCount;page++){
   const stem=report.className.replace(/[:\\/?*\[\]]/g,'-').replace(/\s+/g,''),name=`${stem} หน้า ${page+1}`;if(sheets.some(s=>s.name===name))throw Error('ชื่อห้องซ้ำในชุดส่งออก กรุณาตรวจรายชื่อห้อง');names.push(name);
   const last=page===pageCount-1,studentLast=8+students.length,weightRow=studentLast+1,values=Array.from({length:weightRow},()=>[]),merges=[],columns=[3.21875,6.44140625,8.44140625,7.77734375,8],rowHeights={1:19,2:38,3:22,4:21,5:21,6:21,7:24,8:26},markColumns=[],weekHeaders=[];
   const set=(r,c,value)=>{values[r-1][c-1]=value;};let col=6;
   set(1,1,report.schoolName||'โรงเรียน');set(2,1,`รหัสวิชา ${report.subjectCode||'—'}  ชื่อวิชา ${report.subject}  จำนวน ${report.credits==null?'........':Number.isInteger(Number(report.credits))?Number(report.credits).toFixed(1):String(report.credits)} หน่วยกิต\nชั้น ${report.className}  ภาคเรียนที่ ${report.term} ปีการศึกษา ${report.year}  หน้า ${page+1}/${pageCount}`);set(3,1,`ครูผู้สอน ${(report.teacherNames||[]).join(' / ')||'—'}`);
   set(4,1,'เลขที่');set(4,2,'ชื่อ - สกุล');merges.push('A4:A8','B4:D8');['สัปดาห์','เดือน','วัน','วันที่','คาบ'].forEach((v,i)=>set(i+4,5,v));
   for(let wi=0;wi<5;wi++){
    const weekIndex=page*5+wi,start=col,dates=Array.from({length:5},(_,d)=>iso(first+(weekIndex*7+d)*86400000)),active=weekIndex<weekCount,monthNames=[];
    for(let di=0;di<5;di++){
     const date=dates[di],inside=active&&date>=report.range.from&&date<=report.range.to,dayGroups=inside?groups.filter(g=>g.date===date):[],slots=Math.max(1,dayGroups.length),dayStart=col;
     for(let bi=0;bi<slots;bi++){
      columns[col-1]=3.4;const group=dayGroups[bi];if(group){cumulative+=group.periods.length;set(8,col,group.periods.length===1?String(cumulative):`${cumulative-group.periods.length+1}–${cumulative}`);columns[col-1]=Math.max(3.4,String(values[7][col-1]).length*0.8+1);set(weightRow,col,group.periods.length);markColumns.push({column:col,...group});for(let si=0;si<students.length;si++){const s=students[si],entries=group.periods.map(p=>checks.get(s.id).get(date+'_'+p)).filter(Boolean),mark=entries[0],symbol=mark?code(mark):'';if(entries.some(h=>h.conflict||code(h)!==symbol))throw Error('สถานะคาบติดกันไม่ตรงกัน กรุณาโหลดรายงานใหม่');if(symbol)set(si+9,col,symbol);if(symbol){const key=({'/':'present','ป':'sick','ล':'personal','ลา':'unknown','ข':'absent','ส':'late'})[symbol];if(key)totals.get(s.id)[key]+=group.periods.length;}}}else set(weightRow,col,0);col++;
     }
     set(6,dayStart,weekdays[di]);if(inside){set(7,dayStart,Number(date.slice(8)));const m=months[Number(date.slice(5,7))-1];if(!monthNames.includes(m))monthNames.push(m);}if(slots>1){merges.push(`${columnName(dayStart)}6:${columnName(col-1)}6`,`${columnName(dayStart)}7:${columnName(col-1)}7`);}
    }
    columns[col-1]=0.8;set(weightRow,col,0);col++;
    if(active)set(4,start,weekIndex+1);if(monthNames.length)set(5,start,monthNames.join('/'));merges.push(`${columnName(start)}4:${columnName(col-1)}4`,`${columnName(start)}5:${columnName(col-1)}5`);weekHeaders.push({from:start,to:col-1});
   }
   const scheduleEnd=col-1,summaryStart=col;
   if(last){for(let i=0;i<6;i++)columns[col+i-1]=i===5?6.5:3;set(4,col,'รวม');set(5,col,'เวลา');merges.push(`${columnName(col)}4:${columnName(col+4)}4`,`${columnName(col)}5:${columnName(col+4)}6`,`${columnName(col)}8:${columnName(col+4)}8`);['ป','ล','ลา','ข','ส'].forEach((v,i)=>set(7,col+i,v));set(8,col,'(คาบ)');['รวม','เวลา',null,'คงเหลือ','(คาบ)'].forEach((v,i)=>{if(v)set(i+4,col+5,v);});col+=6;}
   const end=col-1;for(const row of [1,2,3])merges.push(`A${row}:${columnName(end)}${row}`);
   for(let si=0;si<students.length;si++){set(si+9,1,students[si].number);set(si+9,2,students[si].name);merges.push(`B${si+9}:D${si+9}`);rowHeights[si+9]=String(students[si].name).length>33?29:20;}
   sheets.push({name,values,merges,columns,rowHeights,markColumns,weekHeaders,weightRow,studentLast,scheduleEnd,summaryStart,last,lastColumn:end,printArea:`A1:${columnName(end)}${studentLast}`,formulas:[],roomNumber,report});
  }
  const roomSheets=sheets.filter(s=>names.includes(s.name)),lastSheet=roomSheets.at(-1),totalCell=columnName(lastSheet.summaryStart+5)+'6',weightRanges=roomSheets.map(s=>`'${s.name}'!F$${s.weightRow}:${columnName(s.scheduleEnd)}$${s.weightRow}`);
  lastSheet.formulas.push({cell:totalCell,formula:'='+weightRanges.map(r=>`SUM(${r})`).join('+'),result:report.total});
  for(let si=0;si<students.length;si++){
   const student=students[si],row=si+9,t=totals.get(student.id);if(t.present!==student.present||t.absent!==student.absent||t.sick+t.personal+t.unknown!==student.leave||t.late!==student.late)throw Error('ยอดสรุปกับเครื่องหมายในแม่แบบไม่ตรงกัน กรุณาโหลดรายงานใหม่');
   ['ป','ล','ลา','ข','ส'].forEach((symbol,i)=>{const criteria=symbol,formula='='+roomSheets.map((s,j)=>`SUMIF('${s.name}'!F${row}:${columnName(s.scheduleEnd)}${row},"${criteria}",${weightRanges[j]})`).join('+'),result=[t.sick,t.personal,t.unknown,t.absent,t.late][i];lastSheet.formulas.push({cell:columnName(lastSheet.summaryStart+i)+row,formula,result});});
   lastSheet.formulas.push({cell:columnName(lastSheet.summaryStart+5)+row,formula:`=$${columnName(lastSheet.summaryStart+5)}$6-${columnName(lastSheet.summaryStart+3)}${row}`,result:report.total-t.absent});
  }
 }
 return {sheets,reports,weeks:PP5_WEEKS,template:'ม.5 ปพ.5 Reading.xlsx'};
}
