import {assignmentsOn,escapeHTML as e} from './core.js?v=20261028-exchange1';
export function demoHome(assignments,user,date){
 const school=['admin','viewer'].includes(user.role),owned=assignments.filter(a=>a.active!==false&&(school||a.teacherUid===user.uid)),groups=new Map();
 for(const a of assignmentsOn(owned,date,'subject')){const key=JSON.stringify([a.teacherUid,a.kind,a.period,a.sourceTeacherId||'']);if(!groups.has(key))groups.set(key,{teacherName:a.teacherName||user.name,period:a.period,time:a.time,kind:a.kind,cells:[]});groups.get(key).cells.push({...a,assignmentId:a.id});}
 const homerooms=[...new Map(assignmentsOn(owned,date,'morning').map(a=>[a.classId,{id:a.classId,name:a.className}])).values()],lessons=[...groups.values()];
 return {scope:school?'school':'teacher',homerooms,lessons,counts:{homerooms:homerooms.length,subject:lessons.filter(a=>a.kind==='subject').length,substitute:lessons.filter(a=>a.kind==='substitute').length}};
}
export function lessonHTML(a,{school,isDemo,date,url}){
 const exchange=a.cells.some(c=>c.exchangeId);
 const subjects=[...new Set(a.cells.map(c=>c.subject))].join(' / '),covered=[...new Set(a.cells.map(c=>c.coveredTeacherName).filter(Boolean))].join(', ');
 return `<article class="lesson"><div class="period">${e(a.period)}<small>คาบ</small></div><div class="lesson-detail"><strong>${e(subjects)}</strong>${school?`<p class="lesson-teacher">${e(a.teacherName)}</p>`:''}<p>${e(a.time)}${covered?' · สอนแทน '+e(covered):''}</p><div class="lesson-rooms">${a.cells.map(c=>c.assignmentId?`<a class="lesson-room" href="${url('subject')}${isDemo?'&':'?'}assignment=${encodeURIComponent(c.assignmentId)}&date=${encodeURIComponent(date)}">${e(c.className)} <span>เช็คชื่อ →</span></a>`:`<span class="lesson-room pending">${e(c.className)} <small>${c.teacherActivity?'กิจกรรมครู':'ยังไม่เปิดเช็คชื่อ'}</small></span>`).join('')}</div></div><span class="tag ${exchange?'exchange':a.kind==='substitute'?'substitute':''}">${exchange?'แลกคาบ':a.kind==='substitute'?'สอนแทน':'ตามตาราง'}</span></article>`;
}
