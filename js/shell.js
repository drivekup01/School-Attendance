import {roleLabels} from './school-roles.js?v=20261031-student1';
import {settings} from './settings.js?v=20261031-student1';
import {isDemo,url} from './session.js?v=20261031-student1';
import {escapeHTML as e} from './core.js?v=20261031-student1';
import {icon} from './icons.js?v=20261031-student1';
export const pages=[['index','home','หน้าหลัก'],['morning','morning','เข้าแถวเช้า'],['subject','subject','รายวิชา / สอนแทน'],['behavior','behavior','ความประพฤติ'],['reports','reports','รายงาน / ส่งออก'],['admin','shield','ผู้ดูแลระบบ']];
export function shell(page){
 const embedded=window.self!==window.top;
 document.documentElement.classList.toggle('student-embedded',embedded);
 document.body.classList.add('student-app');
 const title=pages.find(x=>x[0]===page)[2];
 const links=pages.map(([id,i,t])=>`<a href="${url(id)}" ${id==='admin'?'data-admin-link hidden':''} ${id===page?'class="active" aria-current="page"':''}>${icon(i)}<span>${t}</span></a>`).join('');
 document.querySelector('#shell').innerHTML=`<a class="skip" href="#main">ข้ามไปยังเนื้อหา</a><aside class="sidebar student-sidebar" id="studentSidebar" aria-label="เมนูดูแลนักเรียน"><button class="student-menu-close" aria-label="ซ่อนแถบเมนู">×</button><a class="brand" href="${settings.schoolHome}" target="_top"><img src="assets/school-logo.png" alt="ตราโรงเรียน"><strong>${e(settings.school)}</strong><small>ระบบดูแลนักเรียน</small></a><p class="student-nav-label">ดูแลนักเรียน</p><nav aria-label="เมนูหลัก">${links}</nav><div class="sidebar-bottom"><div class="identity"><span class="avatar">${icon('users')}</span><div><strong id="userName">${isDemo?'ครูตัวอย่าง':'บุคลากร'}</strong><small id="userRole">${isDemo?'โหมดทดลอง':'กำลังตรวจสอบบัญชี'}</small></div></div><button id="authButton" class="sidebar-button">${isDemo?'ออกจากโหมดทดลอง':'เข้าสู่ระบบด้วย Google'}</button><a class="back-school" href="${settings.schoolHome}" target="_top">← หน้าหลักโรงเรียน</a></div></aside><button class="student-scrim" aria-label="ปิดเมนู" hidden></button><div class="workspace student-workspace"><header class="topbar"><button class="student-menu-open" aria-label="เปิดเมนู" aria-controls="studentSidebar" aria-expanded="false">${icon('menu')}</button><div class="student-breadcrumb">ระบบดูแลนักเรียน <span>/</span> <strong>${e(title)}</strong></div><span class="chip">${isDemo?'ข้อมูลสมมติ':'บัญชีโรงเรียน'}</span></header><main id="main" tabindex="-1">${isDemo?'<div class="notice demo-notice" role="status"><strong>โหมดทดลอง</strong><span>ข้อมูลสมมติ บันทึกเฉพาะแท็บนี้</span><a href="'+page+'.html">กลับระบบจริง →</a></div>':''}<div id="pageContent" aria-live="polite"><p class="loading">กำลังโหลดข้อมูล…</p></div></main></div><div id="toast" class="toast" role="status" aria-live="polite" hidden></div>`;
 const sidebar=document.querySelector('#studentSidebar'),scrim=document.querySelector('.student-scrim'),menu=document.querySelector('.student-menu-open');
 const setMenu=open=>{sidebar.classList.toggle('is-open',open);scrim.hidden=!open;menu.setAttribute('aria-expanded',String(open));};
 menu.addEventListener('click',()=>setMenu(!sidebar.classList.contains('is-open')));
 document.querySelector('.student-menu-close').addEventListener('click',()=>{setMenu(false);menu.focus();});
 scrim.addEventListener('click',()=>setMenu(false));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&sidebar.classList.contains('is-open')){setMenu(false);menu.focus();}});
 if(!embedded&&matchMedia('(max-width:760px)').matches)setMenu(true);
 document.querySelector('#authButton').addEventListener('click',async event=>{
  if(isDemo){location.href=page+'.html';return;}
  const b=event.currentTarget;b.disabled=true;
  try{const F=await import('./firebase-client.js?v=20261031-student1');const u=await F.currentUser();if(u){await F.logout();location.reload();}else{await F.login();location.reload();}}catch(error){notify(friendlyError(error),true);}finally{b.disabled=false;}
 });
 if(!isDemo)import('./firebase-client.js?v=20261031-student1').then(async F=>{const u=await F.currentUser();if(u){setIdentity({name:u.displayName});document.querySelector('#userRole').textContent=settings.databaseReady?'เข้าสู่ระบบแล้ว':'เข้าสู่ระบบแล้ว · รอมอบหมายสิทธิ์';document.querySelector('#authButton').textContent='ออกจากระบบ';}}).catch(()=>{});
 window.addEventListener('offline',()=>notify('ออฟไลน์อยู่ กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนบันทึกข้อมูลจริง',true));
}
export function setIdentity(user){if(!user)return;document.querySelector('#userName').textContent=user.name||'ครู';if(user.role){document.querySelector('#userRole').textContent=roleLabels[user.schoolRole]||(user.role==='admin'?'ผู้ดูแลระบบ':'ครูผู้ใช้งาน');document.querySelectorAll('[data-admin-link]').forEach(a=>{a.hidden=user.role!=='admin';});}}
export function heading(eyebrow,title,description,extra=''){return `<div class="page-heading"><div>${eyebrow?`<span class="eyebrow">${eyebrow}</span>`:''}<h1>${title}</h1><p>${description}</p></div>${extra}</div>`;}
export function empty(title,body,action=''){return `<div class="empty"><div class="empty-icon">${icon('users')}</div><h3>${e(title)}</h3><p>${e(body)}</p>${action}</div>`;}
let timer;
export function notify(text,error=false){const t=document.querySelector('#toast');t.textContent=text;t.classList.toggle('error',error);t.hidden=false;clearTimeout(timer);timer=setTimeout(()=>{t.hidden=true;},6000);}
export function friendlyError(error){if(error.code==='auth/popup-blocked')return 'เบราว์เซอร์บล็อกหน้าต่างเข้าสู่ระบบ กรุณาอนุญาตป๊อปอัปแล้วลองใหม่';if(error.code==='auth/popup-closed-by-user')return 'ยกเลิกการเข้าสู่ระบบแล้ว';if(error.code==='auth/unauthorized-domain')return 'โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication';return error.message||'ดำเนินการไม่สำเร็จ กรุณาลองใหม่';}
export async function boot(page,render){shell(page);try{const {context}=await import('./session.js?v=20261031-student1');const ctx=await context(page);setIdentity(ctx.user);await render(ctx);}catch(error){document.querySelector('#pageContent').innerHTML=empty('ยังโหลดข้อมูลไม่ได้',friendlyError(error),'<button class="button" onclick="location.reload()">ลองใหม่</button> <button id="changeAccount" class="button secondary">เข้าสู่ระบบ / เปลี่ยนบัญชี</button>');document.querySelector('#changeAccount').addEventListener('click',()=>document.querySelector('#authButton').click());}}
