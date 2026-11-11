import {boot,heading,empty,notify} from './shell.js?v=20261111-transfer1';
import {escapeHTML as e} from './core.js?v=20261031-student1';
import {call} from './school-auth.js?v=20261031-student1';
boot('students',async({user})=>{
 const host=document.querySelector('#pageContent');
 if(!(user?.schoolRole?['admin','timetable'].includes(user.schoolRole):user?.role==='admin')){host.innerHTML=empty('ไม่มีสิทธิ์ย้ายห้องนักเรียน','สำหรับฝ่ายวิชาการและผู้ดูแลระบบ');return;}
 const api=data=>call('attendanceAdmin',data);
 const {classes}=await api({method:'rosterClasses'});let students=[],loading=0;
 host.innerHTML=heading('ทะเบียนนักเรียน','ย้ายห้องนักเรียน','เลือกห้องเดิม แล้วเลือกนักเรียนที่ต้องการย้าย')+`<section class="panel"><label class="field"><span>ห้องเดิม</span><select data-room><option value="">เลือกห้อง</option>${classes.map(c=>`<option value="${e(c.id)}">${e(c.name)} · ภาค ${e(c.term)}/${e(c.academicYear)}</option>`).join('')}</select></label><div data-roster></div></section>`;
 const room=host.querySelector('[data-room]'),roster=host.querySelector('[data-roster]');
 async function load(){const token=++loading;students=[];roster.textContent=room.value?'กำลังโหลดรายชื่อ…':'';if(!room.value)return;try{const result=await api({method:'rosterStudents',classId:room.value});if(token!==loading)return;students=result.students;roster.innerHTML=`<div class="table-wrap"><table><thead><tr><th>เลขที่</th><th>ชื่อ–นามสกุล</th><th>รหัสนักเรียน</th><th></th></tr></thead><tbody>${students.map(s=>`<tr><td>${e(s.number)}</td><td>${e(s.name)}</td><td>${e(s.code)}</td><td><button class="button secondary" data-move="${e(s.id)}">ย้ายห้อง</button></td></tr>`).join('')||'<tr><td colspan="4">ไม่มีนักเรียนในห้องนี้</td></tr>'}</tbody></table></div>`;roster.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>move(students.find(s=>s.id===b.dataset.move)));}catch(error){if(token===loading)roster.textContent=error.message;}}
 function move(student){
  const source=classes.find(c=>c.id===room.value),targets=classes.filter(c=>c.id!==source.id&&c.term===source.term&&c.academicYear===source.academicYear);
  if(!targets.length){notify('ไม่มีห้องปลายทางในภาคเรียนเดียวกัน',true);return;}
  const el=document.createElement('dialog');el.className='behavior-confirm admin-editor';const requestId=crypto.randomUUID();
  el.innerHTML=`<h2>ย้ายห้องนักเรียน</h2><p>${e(student.name)} · ${e(student.code)}<br>ห้องเดิม ${e(source.name)} · เลขที่ ${e(student.number)}</p><form><label class="field"><span>ห้องปลายทาง</span><select name="target" required><option value="">เลือกห้อง</option>${targets.map(c=>`<option value="${e(c.id)}">${e(c.name)}</option>`).join('')}</select></label><label class="field"><span>เลขที่ในห้องใหม่</span><input name="number" type="number" min="1" max="1000" step="1" required></label><p class="fine-print">เมื่อยืนยัน นักเรียนจะอยู่ในรายชื่อห้องใหม่ ข้อมูลย้อนหลังยังอยู่กับห้องเดิม</p><p role="alert" data-error></p><div class="form-actions"><button class="button" type="submit">ยืนยันย้ายห้อง</button><button class="button ghost" type="button" data-cancel>ยกเลิก</button></div></form>`;
  document.body.append(el);el.showModal();let saving=false;
  const close=()=>{if(!saving){el.close();el.remove();}};el.querySelector('[data-cancel]').onclick=close;el.oncancel=ev=>{ev.preventDefault();close();};
  el.querySelector('form').onsubmit=async ev=>{ev.preventDefault();if(saving)return;saving=true;const form=ev.currentTarget,buttons=el.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);el.querySelector('[data-error]').textContent='กำลังย้ายห้อง…';try{await api({method:'moveStudent',classId:source.id,targetClassId:form.elements.target.value,studentId:student.id,number:Number(form.elements.number.value),requestId});saving=false;close();notify('ย้ายห้องนักเรียนเรียบร้อยแล้ว');await load();}catch(error){el.querySelector('[data-error]').textContent=error.message;saving=false;buttons.forEach(b=>b.disabled=false);}};
 }
 room.onchange=load;
});
