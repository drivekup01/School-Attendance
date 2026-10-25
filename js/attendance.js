import {heading,empty,notify} from './shell.js?v=20261025-overview1';
import {today,thaiDate,assignmentsOn,counts,statuses,escapeHTML as e,validateMarks,validDate} from './core.js?v=20261025-firebase2';
import {icon} from './icons.js?v=20261025-firebase2';
import {isDemo} from './session.js?v=20261025-firebase2';
export async function attendancePage(ctx,kind){
 const morning=kind==='morning';let date=today(),assignment,students=[],marks={},revision=0,dirty=false,busy=false,loadVersion=0,savedAt='';
 const all=ctx.assignments.filter(a=>morning?a.kind==='morning':a.kind!=='morning');
 document.querySelector('#pageContent').innerHTML=heading('',morning?'เช็คชื่อเข้าแถวเช้า':'เช็คชื่อรายวิชา / สอนแทน',morning?'บันทึกเฉพาะการเข้าแถวตอนเช้า แยกจากการเข้าเรียนรายวิชา':'เลือกคาบตามตารางสอน หรือคาบสอนแทนที่ได้รับมอบหมาย')+`
 <div class="filters"><label class="field"><span>วันที่เช็คชื่อ</span><input id="attendanceDate" type="date" value="${date}" max="${date}" required></label><label class="field"><span>${morning?'ห้องประจำชั้น':'คาบสอนของฉัน'}</span><select id="assignmentSelect" ${!all.length?'disabled':''}><option value="">${all.length?'เลือกห้อง / คาบสอน':'ยังไม่มีงานที่ได้รับมอบหมาย'}</option></select></label><button class="button ghost" id="reload">${icon('clock')} ค้นหา</button></div>
 <div id="assignmentInfo"></div><section id="attendanceStats" class="stats" aria-label="สรุปการเช็คชื่อ"></section><div class="grid two-col"><section class="panel roster-panel"><div class="panel-heading"><h2>รายชื่อนักเรียน <span id="rosterCount" class="muted"></span></h2><div class="roster-tools"><input type="search" id="studentSearch" class="search" placeholder="ค้นหาชื่อ / รหัสนักเรียน" aria-label="ค้นหานักเรียน"><button class="button secondary" id="allPresent" disabled>${icon('check')} มาทั้งหมด</button></div></div><p id="unmarked" class="fine-print"></p><div id="roster"></div><div class="save-bar"><span id="saveState">ยังไม่มีข้อมูลที่บันทึก</span><button id="saveAttendance" class="button" disabled>${icon('check')} ${isDemo?'บันทึกการเช็คชื่อ (ทดลอง)':'บันทึกการเช็คชื่อ'}</button></div></section><aside class="panel summary-panel"><h2>สรุปห้องเรียน</h2><div id="ring" class="ring"><div><strong id="percent">—</strong><small>มาเข้าเรียนตรงเวลา</small></div></div><div id="summaryLegend"></div><p class="fine-print">${morning?'ผลเข้าแถวไม่บันทึกทับผลรายวิชา':'ผลรายวิชาไม่บันทึกทับผลเข้าแถวเช้า'}<br>สถานะที่ยังไม่เลือกจะไม่ถือว่ามาเรียน</p></aside></div>`;
 const select=document.querySelector('#assignmentSelect'),dateInput=document.querySelector('#attendanceDate'),save=document.querySelector('#saveAttendance');
 function options(preferred){const available=assignmentsOn(all,date,kind);select.innerHTML='<option value="">'+(available.length?'เลือกห้อง / คาบสอน':'ไม่มีงานที่ได้รับมอบหมายในวันนี้')+'</option>'+available.map(a=>`<option value="${e(a.id)}">${e(a.className)}${morning?'':` • คาบ ${a.period} • ${e(a.subject)}`}</option>`).join('');select.disabled=!available.length;select.value=available.some(a=>a.id===preferred)?preferred:(available[0]?.id||'');}
 function updateSummary(){
  const c=counts(students,marks);document.querySelector('#attendanceStats').innerHTML=Object.entries(statuses).map(([status,label])=>`<article class="stat count-${status}"><span>${label}</span><strong>${c[status]} <small>คน</small></strong><small>จาก ${c.total} คน</small></article>`).join('');
  document.querySelector('#rosterCount').textContent=students.length?'• '+students.length+' คน':'';document.querySelector('#unmarked').textContent=students.length?`ยังไม่ได้เช็ค ${c.unmarked} คน`:'ยังไม่มีรายชื่อนักเรียน';
  document.querySelector('#summaryLegend').innerHTML=Object.entries(statuses).map(([status,label])=>`<div class="legend-line"><span class="status-dot ${status}"></span>${label}<strong>${c[status]} คน</strong></div>`).join('')+`<div class="legend-line"><span class="status-dot unmarked"></span>ยังไม่เช็ค<strong>${c.unmarked} คน</strong></div>`;
  const p=c.total?c.present/c.total*100:0;document.querySelector('#percent').textContent=c.total?p.toFixed(1)+'%':'—';document.querySelector('#ring').style.background=`conic-gradient(#8050b3 ${p}%,#f0e9f7 0)`;
  document.querySelector('#allPresent').disabled=!students.length||busy;save.disabled=!students.length||!dirty||busy||c.unmarked>0;
  document.querySelector('#saveState').textContent=busy?'กำลังบันทึก…':dirty?'มีการเปลี่ยนแปลงที่ยังไม่บันทึก':savedAt?'บันทึกสำเร็จ • '+new Date(savedAt).toLocaleTimeString('th-TH',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit'}):'ยังไม่ได้บันทึก';
 }
 function renderRoster(){
  const search=document.querySelector('#studentSearch').value.trim().toLowerCase(),visible=students.filter(s=>(s.name+' '+s.code+' '+s.number).toLowerCase().includes(search));
  document.querySelector('#roster').innerHTML=students.length?(visible.length?`<div class="student-list">${visible.map(s=>`<article class="student-row" data-student="${e(s.id)}"><div class="student-number">${s.number}</div><div class="student-name"><strong>${e(s.name)}</strong><small>${e(s.code)}</small></div><div class="status-buttons" role="group" aria-label="สถานะของ ${e(s.name)}">${Object.entries(statuses).map(([key,label])=>`<button class="status-button ${key}" data-status="${key}" aria-pressed="${marks[s.id]?.status===key}">${label}</button>`).join('')}</div><input class="note" placeholder="หมายเหตุ" maxlength="300" value="${e(marks[s.id]?.note||'')}" aria-label="หมายเหตุของ ${e(s.name)}"></article>`).join('')}</div>`:empty('ไม่พบรายชื่อ','ลองค้นหาด้วยชื่อหรือรหัสนักเรียนอื่น')):empty(assignment?'ยังไม่มีรายชื่อนักเรียน':'ยังไม่มีห้อง / คาบสอน',assignment?'เพิ่มรายชื่อนักเรียนภายหลังได้ โดยไม่ต้องสร้างข้อมูลสมมติในระบบจริง':'ห้องและคาบที่ได้รับสิทธิ์จะแสดงให้เลือกที่ด้านบน');updateSummary();
 }
 async function load(){
  const version=++loadVersion;assignment=all.find(a=>a.id===select.value);students=[];marks={};revision=0;dirty=false;savedAt='';updateSummary();
  document.querySelector('#assignmentInfo').innerHTML=assignment?`<div class="assignment-card">${icon(morning?'morning':'subject')}<div><strong>${e(assignment.subject)} • ${e(assignment.className)}</strong><small>${e(assignment.time)} · ${thaiDate(date)}</small></div>${assignment.kind==='substitute'?'<span class="tag substitute">สอนแทน</span>':''}</div>`:'';
  if(!assignment||!ctx.provider){renderRoster();return;}
  document.querySelector('#roster').innerHTML='<div class="loading">กำลังโหลดรายชื่อ…</div>';
  try{const [roster,session]=await Promise.all([ctx.provider.students(assignment.classId),ctx.provider.session(assignment,date)]);if(version!==loadVersion)return;students=roster;marks=session.marks;revision=session.revision;savedAt=session.updatedAt||'';renderRoster();}catch(error){if(version===loadVersion){document.querySelector('#roster').innerHTML=empty('โหลดรายชื่อไม่สำเร็จ',error.message);notify(error.message,true);}}
 }
 function canLeave(){return !dirty||confirm('มีข้อมูลที่ยังไม่บันทึก ต้องการละทิ้งการแก้ไขหรือไม่?');}
 options(new URLSearchParams(location.search).get('assignment'));await load();
 select.addEventListener('change',()=>{if(!canLeave()){select.value=assignment?.id||'';return;}load();});
 dateInput.addEventListener('change',()=>{if(!validDate(dateInput.value)||dateInput.value>today()){dateInput.value=date;notify('เลือกวันที่ให้ถูกต้อง และไม่เกินวันนี้',true);return;}if(!canLeave()){dateInput.value=date;return;}date=dateInput.value;options(assignment?.id);load();});
 document.querySelector('#reload').addEventListener('click',()=>{if(canLeave())load();});
 document.querySelector('#studentSearch').addEventListener('input',renderRoster);
 document.querySelector('#allPresent').addEventListener('click',()=>{for(const s of students)marks[s.id]={status:'present',note:marks[s.id]?.note||''};dirty=true;renderRoster();});
 document.querySelector('#roster').addEventListener('click',event=>{const b=event.target.closest('[data-status]');if(!b||busy)return;const id=b.closest('[data-student]').dataset.student;marks[id]={status:b.dataset.status,note:marks[id]?.note||''};dirty=true;b.parentElement.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));updateSummary();});
 document.querySelector('#roster').addEventListener('input',event=>{if(!event.target.matches('.note'))return;const id=event.target.closest('[data-student]').dataset.student;marks[id]={...marks[id],note:event.target.value};dirty=true;updateSummary();});
 save.addEventListener('click',async()=>{
  if(busy)return;
  try{validateMarks(students,marks);busy=true;select.disabled=true;dateInput.disabled=true;document.querySelector('#roster').inert=true;updateSummary();const result=await ctx.provider.save(assignment,date,students,structuredClone(marks),revision);revision=result.revision;savedAt=result.updatedAt;dirty=false;notify(isDemo?'บันทึกข้อมูลทดลองสำเร็จ (เฉพาะแท็บนี้)':'บันทึกสำเร็จ');}catch(error){notify(error.message,true);}finally{busy=false;select.disabled=!all.length;dateInput.disabled=false;document.querySelector('#roster').inert=false;updateSummary();}
 });
 window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
 document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(a&&dirty&&!canLeave())event.preventDefault();});
}
