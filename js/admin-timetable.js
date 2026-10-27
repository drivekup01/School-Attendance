import {escapeHTML as e} from './core.js?v=20261027-catalog1';
const fullName=t=>((t.prefix||'')+(t.first||'')+' '+(t.last||'')).trim();
const normalized=v=>String(v||'').normalize('NFC').replace(/[\s\u200B-\u200D\uFEFF]/g,'');
export function teacherLessons(db,teacher){
 if(!db||!teacher)return [];const rows=[],name=normalized(fullName(teacher));
 const matches=value=>value===teacher.id||name&&normalized(value)===name;
 for(const room of db.rooms||[])for(const slot of db.slots||[])for(const day of db.days||[]){
  if(slot.isBreak)continue;const cv=db.sched?.[room.id+'_'+slot.id+'_'+day];if(!cv?.subject)continue;
  const role=[cv.teacher,cv.teacher2,cv.teacher3].findIndex(matches);if(role<0)continue;
  const subject=db.subjects?.find(s=>s.id===cv.subject||s.name===cv.subject);
  rows.push({day,slotId:String(slot.id),period:slot.label||slot.id,roomId:room.id,room:room.label||`${room.grade}/${room.room}`,subject:subject?.name||cv.subject,learnRoom:String(cv.learnRoom||room.baseRoom||'').trim(),time:[slot.start,slot.end].filter(Boolean).join('–'),role:role+1,kind:'room',coTeachers:[cv.teacher,cv.teacher2,cv.teacher3].filter(v=>v&&!matches(v))});
 }
 for(const value of Object.values(db.teacherSched||{})){
  const slot=db.slots?.find(s=>String(s.id)===String(value.slotId));if(value.teacherId!==teacher.id||!slot||slot.isBreak||!db.days?.includes(value.day))continue;
  rows.push({day:value.day,slotId:String(slot.id),period:slot.label||slot.id,roomId:null,room:'กิจกรรมเฉพาะครู',subject:db.subjects?.find(s=>s.id===value.subjectId)?.name||value.subject,learnRoom:'',time:[slot.start,slot.end].filter(Boolean).join('–'),role:1,kind:'activity',coTeachers:[]});
 }
 return rows;
}
export function teacherTimetableHTML(db,teacher){
 if(!db?.slots?.length||!db?.days?.length)return '<p class="fine-print">ยังไม่มีข้อมูลวันและคาบจาก School-OS</p>';
 const lessons=teacherLessons(db,teacher),roomCount=new Set(lessons.filter(r=>r.roomId).map(r=>r.roomId)).size;
 return `<div class="native-timetable-heading"><h3>ตารางสอน ${e(fullName(teacher)||teacher.name)}</h3><p>${e(db.school?.name||'')} ${db.school?.year?' · ปีการศึกษา '+e(db.school.year):''}${db.school?.semester?' · ภาคเรียน '+e(db.school.semester):''}</p><div class="native-timetable-chips"><span>${lessons.length} คาบ/สัปดาห์</span><span>${new Set(lessons.map(r=>r.subject)).size} วิชา / กิจกรรม</span><span>${roomCount} ห้อง</span></div></div><div class="native-timetable-wrap" tabindex="0" aria-label="ตารางสอนรายครู เลื่อนแนวนอนเพื่อดูทุกคาบ"><table class="native-timetable"><thead><tr><th class="native-day">วัน/คาบ</th>${db.slots.map(s=>`<th class="${s.isBreak?'native-break-head':''}">${e(s.label)}<small>${e(s.start)}–${e(s.end)}</small></th>`).join('')}</tr></thead><tbody>${db.days.map((day,index)=>`<tr><th class="native-day" scope="row">${e(day)}</th>${db.slots.map(slot=>{
  if(slot.isBreak)return index?'':`<td class="native-break" rowspan="${db.days.length}"><span>${e(slot.label||'พักเที่ยง')}</span></td>`;
  const cells=lessons.filter(r=>r.day===day&&r.slotId===String(slot.id));return `<td>${cells.map(r=>`<article class="native-lesson"><strong>${e(r.subject)}</strong><span>${e(r.room)}</span>${r.role>1?`<small>ผู้สอนร่วม ${r.role}</small>`:''}${r.learnRoom?`<small class="native-room-tag">ห้อง ${e(r.learnRoom)}</small>`:''}${r.coTeachers.length?`<small>ร่วมกับ ${r.coTeachers.map(value=>e(db.teachers?.find(t=>t.id===value)?fullName(db.teachers.find(t=>t.id===value)):value)).join(', ')}</small>`:''}</article>`).join('')||'<span class="native-empty">—</span>'}</td>`;
 }).join('')}</tr>`).join('')}</tbody></table></div>`;
}
