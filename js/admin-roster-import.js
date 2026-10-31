import {readRoster} from './roster-import.js?v=20261031-student1';
import {escapeHTML as e} from './core.js?v=20261031-student1';
export function mountRosterImport(host,{data,call,reload,isDemo}){
 const section=document.createElement('div');host.prepend(section);
 section.innerHTML='<div class="panel-heading"><div><h3>อัปเดตรายชื่อนักเรียนจาก Excel</h3><p class="fine-print">แทนที่รายชื่อปัจจุบันครบ 18 ห้อง · อ่านเฉพาะชีต 1.1–6.3 · เก็บประวัติเช็กชื่อและคะแนนเดิม</p></div><button type="button" class="button secondary" data-import>นำเข้ารายชื่อจาก Excel</button></div><input type="file" accept=".xls,.xlsx" data-file hidden><div data-preview aria-live="polite"></div>';
 const file=section.querySelector('[data-file]'),button=section.querySelector('[data-import]'),preview=section.querySelector('[data-preview]');let busy=false;
 button.onclick=()=>file.click();
 file.onchange=async()=>{
  if(!file.files[0]||busy)return;button.disabled=true;preview.textContent='กำลังตรวจสอบไฟล์…';
  try{
   const result=await readRoster(file.files[0]);
   const rooms=result.rooms.map(r=>{const matches=data.classes.filter(c=>c.active&&c.academicYear===r.academicYear&&String(c.name).replace(/\s/g,'')===r.label);if(matches.length!==1)throw Error(`ต้องมีห้อง ${r.label} ปี ${r.academicYear} ที่เปิดใช้ในภาคปัจจุบันเพียงหนึ่งห้อง กรุณาตรวจทะเบียนห้อง`);return {...r,classId:matches[0].id,term:matches[0].term,oldCount:matches[0].studentCount};});
   preview.innerHTML=`<p><strong>${e(file.files[0].name)} · ${result.total} คน · 18 ห้อง${isDemo?' (ทดลอง)':''}</strong></p><div class="table-wrap"><table><thead><tr><th>ห้อง</th><th>ปี / ภาค</th><th>รายชื่อเดิม</th><th>รายชื่อใหม่</th></tr></thead><tbody>${rooms.map(r=>`<tr><td>${e(r.label)}</td><td>${r.academicYear} / ${r.term}</td><td>${r.oldCount}</td><td>${r.students.length}</td></tr>`).join('')}</tbody></table></div>${result.warnings.length?`<details open><summary>รายการไม่นำเข้า ${result.warnings.length} รายการ</summary>${result.warnings.map(w=>`<p class="fine-print">${e(w)}</p>`).join('')}</details>`:''}<p class="request-notice">รายชื่อเดิมที่ไม่มีในไฟล์จะถูกนำออกจากรายชื่อปัจจุบัน บันทึกทีละห้อง หากขัดข้องจะแจ้งห้องที่สำเร็จแล้ว และนำเข้าไฟล์เดิมซ้ำได้</p><label class="field"><span><input type="checkbox" data-consent> ตรวจสอบแล้ว ยืนยันแทนที่รายชื่อเดิมทั้ง 18 ห้อง</span></label><div class="form-actions"><button class="button" data-confirm disabled>ยืนยันแทนที่รายชื่อ</button><button class="button ghost" data-cancel>ยกเลิก</button></div><p data-progress role="status"></p>`;
   const confirm=preview.querySelector('[data-confirm]'),cancel=preview.querySelector('[data-cancel]'),consent=preview.querySelector('[data-consent]'),progress=preview.querySelector('[data-progress]');
   consent.onchange=()=>confirm.disabled=!consent.checked;cancel.onclick=()=>preview.replaceChildren();
   confirm.onclick=async()=>{if(busy)return;busy=true;host.parentElement.inert=true;button.disabled=confirm.disabled=cancel.disabled=consent.disabled=true;let done=0;const prevent=ev=>{ev.preventDefault();ev.returnValue='';};window.addEventListener('beforeunload',prevent);
    try{for(const room of rooms){progress.textContent=`กำลังแทนที่ ${room.label} (${done+1}/18)…`;await call({method:'replaceRoster',classId:room.classId,academicYear:room.academicYear,term:room.term,label:room.label,students:room.students});done++;}await reload();alert(`อัปเดตรายชื่อสำเร็จ 18 ห้อง รวม ${result.total} คน${isDemo?' (ทดลอง)':''}`);}
    catch(error){progress.textContent=`สำเร็จแล้ว ${done}/18 ห้อง · ${error.message} · กรุณาโหลดข้อมูลล่าสุดแล้วนำเข้าไฟล์เดิมอีกครั้ง`;cancel.disabled=false;}
    finally{busy=false;host.parentElement.inert=false;button.disabled=false;window.removeEventListener('beforeunload',prevent);}
   };
  }catch(error){preview.textContent=error.message;}
  finally{button.disabled=false;file.value='';}
 };
}
