export const statuses = Object.freeze({present:'มา', late:'สาย', absent:'ขาด', leave:'ลา'});
export const escapeHTML = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function today(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value+'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value;
}
export function thaiDate(value = today()) {return validDate(value) ? new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Bangkok'}).format(new Date(value+'T00:00:00+07:00')) : 'วันที่ไม่ถูกต้อง';}
export function weekday(value) {return new Date(value+'T00:00:00+07:00').getUTCDay() === 6 ? 0 : new Date(value+'T00:00:00+07:00').getUTCDay()+1;}
export function assignmentsOn(assignments, date, kind) {
  return assignments.filter(a => (!kind || (kind==='morning' ? a.kind==='morning' : a.kind!=='morning')) && date>=a.from && date<=a.to && (a.kind==='substitute' ? a.date===date : a.kind==='morning' || a.weekday===weekday(date))).sort((a,b)=>(a.period||0)-(b.period||0));
}
export function counts(students, marks) {
  const out = {present:0,late:0,absent:0,leave:0,unmarked:0,total:students.length};
  for(const s of students) out[Object.hasOwn(statuses,marks[s.id]?.status) ? marks[s.id].status : 'unmarked']++;
  return out;
}
export function validateMarks(students, marks) {
  if(!students.length) throw Error('ยังไม่มีรายชื่อนักเรียน จึงยังบันทึกไม่ได้');
  if(students.length>100) throw Error('รองรับนักเรียนไม่เกิน 100 คนต่อห้อง');
  for(const s of students) {
    if(!Object.hasOwn(statuses,marks[s.id]?.status)) throw Error('กรุณาเช็คชื่อให้ครบทุกคนก่อนบันทึก');
    if(String(marks[s.id].note||'').length>300) throw Error('หมายเหตุต้องไม่เกิน 300 ตัวอักษร');
  }
}
export function csvCell(value) {
  let text = String(value ?? '');
  if(/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text="'"+text;
  return '"'+text.replace(/"/g,'""')+'"';
}
export const toCSV = rows => '\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
export function validateRange(from,to) {
  if(!validDate(from)||!validDate(to)||from>to) throw Error('กรุณาเลือกช่วงวันที่ให้ถูกต้อง');
  if((new Date(to)-new Date(from))/86400000>92) throw Error('เลือกช่วงวันที่ได้ไม่เกิน 93 วันต่อครั้ง');
}
export function download(blob,filename) {
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
