import {escapeHTML as e} from './core.js?v=20261028-exchange1';
const key='attendance-request-print-signers-v1';
export function choosePrintSigners(names=[]){
 let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
 const defaults={headName:'นางสาวอรลักษณ์ ธูปบูชากรณ์',directorName:'นายเรวัฒน์ พรหมสะโร'};
 const options=[...new Set([...names,...Object.values(defaults),...Object.values(saved)].filter(n=>typeof n==='string'&&n.trim()&&n.length<=160))].sort((a,b)=>a.localeCompare(b,'th'));
 const dialog=document.createElement('dialog');dialog.className='behavior-confirm';
 dialog.innerHTML='<h2>เลือกชื่อผู้ลงนามในแบบพิมพ์</h2><form><p class="fine-print">เลือกชื่อที่ต้องการให้ปรากฏใต้ช่องลงนาม</p>'+[['headName','หัวหน้างานระบบดูแลช่วยเหลือนักเรียน'],['directorName','ผู้อำนวยการโรงเรียน']].map(([field,label])=>`<label class="field" style="margin-top:16px"><span>${label}</span><select name="${field}"><option value="">เว้นชื่อว่างสำหรับเขียนเอง</option>${options.map(name=>`<option value="${e(name)}">${e(name)}</option>`).join('')}<option value="__custom">ระบุชื่ออื่น…</option></select><input name="${field}Custom" maxlength="160" aria-label="ระบุชื่อ${label}" placeholder="พิมพ์ชื่อ–นามสกุล" hidden disabled></label>`).join('')+'<div class="behavior-modes"><button class="button" type="submit">พิมพ์คำร้อง</button><button class="button secondary" type="button" data-cancel>ยกเลิก</button></div></form>';
 const form=dialog.querySelector('form');for(const field of Object.keys(defaults)){
  form.elements[field].value=typeof saved[field]==='string'?saved[field]:defaults[field];
  form.elements[field].onchange=()=>{const custom=form.elements[field+'Custom'],active=form.elements[field].value==='__custom';custom.hidden=!active;custom.disabled=!active;custom.required=active;if(active)custom.focus();};
 }
 document.body.append(dialog);dialog.showModal();
 return new Promise(resolve=>{
  let done=false;const finish=value=>{if(done)return;done=true;dialog.close();dialog.remove();resolve(value);};
  form.onsubmit=event=>{event.preventDefault();const result={};for(const field of Object.keys(defaults)){const select=form.elements[field],custom=form.elements[field+'Custom'];const name=select.value==='__custom'?custom.value.trim():select.value;if(select.value==='__custom'&&!name){custom.setCustomValidity('กรุณาระบุชื่อ');custom.reportValidity();custom.oninput=()=>custom.setCustomValidity('');return;}result[field]=name;}try{localStorage.setItem(key,JSON.stringify(result));}catch{}finish(result);};
  dialog.querySelector('[data-cancel]').onclick=()=>finish(null);dialog.oncancel=event=>{event.preventDefault();finish(null);};dialog.onclose=()=>finish(null);
 });
}
