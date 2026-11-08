const line=value=>String(value??'').replace(/[\r\n\u0000-\u001f]/g,' ').trim();
export function attendanceMessage({date,assignment,students,marks,morning=true}){
 const totals={present:0,late:0,absent:0,leave:0,pending:0},details=[];
 const labels={late:'🕘 สาย',absent:'❌ ขาด',leave:'📝 ลา'};
 const roster=[...students].sort((a,b)=>(Number(a.number)||0)-(Number(b.number)||0)||String(a.name).localeCompare(String(b.name),'th'));
 for(const student of roster){const status=marks[student.id]?.status;if(['present','late','absent','leave'].includes(status))totals[status]++;else totals.pending++;if(labels[status])details.push(`${details.length+1}. ${line(student.name)} : ${labels[status]}`);}
 const text=[`📌 เช็คชื่อ${morning?'เข้าแถว':'รายคาบ'} วันที่ ${line(date)}`,`🏫 ห้อง ${line(assignment.className)} นักเรียนทั้งหมด ${roster.length} คน`];
 if(!morning){text.push(`📚 วิชา ${line(assignment.subject)} · คาบ ${line(assignment.period)}${assignment.time?' · '+line(assignment.time):''}`);if(assignment.teacherName)text.push(`👩‍🏫 ครูผู้สอน ${line(assignment.teacherName)}`);}
 text.push('',`✅ มาเรียน ${totals.present+totals.late} คน (รวมมาสาย ${totals.late} คน)`,`❌ ไม่มาเรียน ${totals.absent+totals.leave} คน`,`   ขาด ${totals.absent} คน · ลา ${totals.leave} คน`);
 if(totals.pending)text.push(`⏳ ยังไม่เช็ค ${totals.pending} คน`);
 text.push('','📊 รายชื่อนักเรียนที่สาย / ขาด / ลา',...(details.length?details:['ไม่มีนักเรียนที่สาย ขาด หรือลา']));
 return text.join('\n');
}
