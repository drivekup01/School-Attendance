import {roleLabels} from './school-roles.js?v=20261028-exchange1';
import {settings} from './settings.js?v=20261028-exchange1';
import {isDemo,url} from './session.js?v=20261028-exchange1';
import {escapeHTML as e} from './core.js?v=20261028-exchange1';
import {icon} from './icons.js?v=20261028-exchange1';
export const pages=[['index','home','หน้าหลัก'],['morning','morning','เข้าแถวเช้า'],['subject','subject','รายวิชา / สอนแทน'],['behavior','behavior','ความประพฤติ'],['reports','reports','รายงาน / ส่งออก'],['admin','shield','ผู้ดูแลระบบ']];
export function shell(page){
 const links=pages.map(([id,i,t])=>`<a href="${url(id)}" ${id==='admin'?'data-admin-link hidden':''} ${id===page?'class="active" aria-current="page"':''}>${icon(i)}<span>${t}</span></a>`).join('');
 document.querySelector('#shell').innerHTML=`<a class="skip" href="#main">ข้ามไปยังเนื้อหา</a><aside class="sidebar"><a class="brand" href="${settings.schoolHome}" target="_top"><img src="assets/school-logo.png" alt="ตราโรงเรียน"><span>${e(settings.school)}<small>${e(settings.system)}</small></span></a><div class="sidebar-clock-bar"><div class="sidebar-clock" role="group" aria-label="วันที่และเวลาปัจจุบัน ประเทศไทย"><span id="sidebarClockDate" class="sidebar-clock-date"></span><time id="sidebarClockTime" class="sidebar-clock-time"></time></div></div><nav aria-label="เมนูหลัก">${links}</nav><div class="sidebar-bottom"><a class="back-school" href="${settings.schoolHome}">← กลับหน้าเลือกระบบ</a><div class="identity"><span class="avatar">${icon('users')}</span><div><strong id="userName">${isDemo?'ครูตัวอย่าง':'ผู้ใช้งาน'}</strong><small id="userRole">${isDemo?'โหมดทดลอง · ข้อมูลสมมติ':'ยังไม่เข้าสู่ระบบ'}</small></div></div><button id="authButton" class="sidebar-button">${isDemo?'ออกจากโหมดทดลอง':'เข้าสู่ระบบด้วย Google'}</button></div></aside><div class="workspace"><header class="topbar"><span class="topbar-title">งานวิชาการ <span>/ ${pages.find(x=>x[0]===page)[2]}</span></span><span class="chip">${isDemo?'ข้อมูลสมมติ':'ระบบเช็คชื่อ'}</span></header><main id="main" tabindex="-1"><div id="modeNotice" class="notice ${isDemo?'demo-notice':''}">${icon(isDemo?'file':'shield')}<div>${isDemo?'<strong>โหมดทดลอง — ใช้ข้อมูลสมมติเท่านั้น</strong><span>บันทึกไว้เฉพาะเซสชันของแท็บนี้ ไม่ส่งเข้า Firebase</span><a href="'+page+'.html">กลับระบบจริง →</a>':'<strong>ระบบเช็คชื่อของโรงเรียน</strong><span>เข้าสู่ระบบเพื่อดูห้องและคาบตามหน้าที่ที่ได้รับมอบหมาย</span><a href="'+page+'.html?demo=1">ลองใช้งานด้วยข้อมูลสมมติ →</a>'}</div></div><div id="pageContent"></div></main><footer class="footer">${settings.school} <span>ระบบเช็คชื่อ • เวอร์ชันเริ่มต้น</span></footer></div><nav class="mobile-nav" aria-label="เมนูมือถือ">${links}</nav><div id="toast" class="toast" role="status" aria-live="polite" hidden></div>`;
 if(!isDemo)document.querySelector('#modeNotice')?.remove();
 mountSchoolHomeButton(document.querySelector('.sidebar'));
 startSidebarClock();
 document.querySelector('#authButton').addEventListener('click',async event=>{
  if(isDemo){location.href=page+'.html';return;}
  const b=event.currentTarget;b.disabled=true;
  try{const F=await import('./firebase-client.js?v=20261028-exchange1');const u=await F.currentUser();if(u){await F.logout();location.reload();}else{await F.login();location.reload();}}catch(error){notify(friendlyError(error),true);}finally{b.disabled=false;}
 });
 if(!isDemo)import('./firebase-client.js?v=20261028-exchange1').then(async F=>{const u=await F.currentUser();if(u){setIdentity({name:u.displayName});document.querySelector('#userRole').textContent=settings.databaseReady?'เข้าสู่ระบบแล้ว':'เข้าสู่ระบบแล้ว · รอมอบหมายสิทธิ์';document.querySelector('#authButton').textContent='ออกจากระบบ';}}).catch(()=>{});
 window.addEventListener('offline',()=>notify('ออฟไลน์อยู่ กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนบันทึกข้อมูลจริง',true));
}
export function setIdentity(user){if(!user)return;document.querySelector('#userName').textContent=user.name||'ครู';if(user.role){document.querySelector('#userRole').textContent=roleLabels[user.schoolRole]||(user.role==='admin'?'ผู้ดูแลระบบ':'ครูผู้ใช้งาน');document.querySelectorAll('[data-admin-link]').forEach(a=>{a.hidden=user.role!=='admin';});}}
export function heading(eyebrow,title,description,extra=''){return `<div class="page-heading"><div>${eyebrow?`<span class="eyebrow">${eyebrow}</span>`:''}<h1>${title}</h1><p>${description}</p></div>${extra}</div>`;}
export function empty(title,body,action=''){return `<div class="empty"><div class="empty-icon">${icon('users')}</div><h3>${e(title)}</h3><p>${e(body)}</p>${action}</div>`;}
let timer;
export function notify(text,error=false){const t=document.querySelector('#toast');t.textContent=text;t.classList.toggle('error',error);t.hidden=false;clearTimeout(timer);timer=setTimeout(()=>{t.hidden=true;},6000);}
export function friendlyError(error){if(error.code==='auth/popup-blocked')return 'เบราว์เซอร์บล็อกหน้าต่างเข้าสู่ระบบ กรุณาอนุญาตป๊อปอัปแล้วลองใหม่';if(error.code==='auth/popup-closed-by-user')return 'ยกเลิกการเข้าสู่ระบบแล้ว';if(error.code==='auth/unauthorized-domain')return 'โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication';return error.message||'ดำเนินการไม่สำเร็จ กรุณาลองใหม่';}
export async function boot(page,render){shell(page);try{const {context}=await import('./session.js?v=20261028-exchange1');const ctx=await context(page);setIdentity(ctx.user);await render(ctx);}catch(error){document.querySelector('#pageContent').innerHTML=empty('ยังโหลดข้อมูลไม่ได้',friendlyError(error),'<button class="button" onclick="location.reload()">ลองใหม่</button> <button id="changeAccount" class="button secondary">เข้าสู่ระบบ / เปลี่ยนบัญชี</button>');document.querySelector('#changeAccount').addEventListener('click',()=>document.querySelector('#authButton').click());}}

let sidebarClockTimer;
function startSidebarClock(){
 clearInterval(sidebarClockTimer);
 const date=document.querySelector('#sidebarClockDate'),time=document.querySelector('#sidebarClockTime');
 const dayFormat=new Intl.DateTimeFormat('th-TH-u-ca-buddhist-nu-latn',{timeZone:'Asia/Bangkok',weekday:'long',day:'numeric',month:'long',year:'numeric'});
 const timeFormat=new Intl.DateTimeFormat('th-TH-u-nu-latn',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 const tick=()=>{const now=new Date(),parts=Object.fromEntries(dayFormat.formatToParts(now).map(p=>[p.type,p.value]));date.textContent=parts.weekday+'ที่ '+parts.day+' '+parts.month+' พ.ศ. '+parts.year;time.dateTime=now.toISOString();time.textContent='เวลา '+timeFormat.format(now)+' น. · เวลาไทย';};
 tick();sidebarClockTimer=setInterval(()=>{if(!document.hidden)tick();},1000);
}

function mountSchoolHomeButton(sidebar){
 if(!sidebar)return;
 sidebar.querySelectorAll('a.back-school,a[data-view="home"]').forEach(a=>a.remove());
 document.querySelectorAll('.school-portal-link').forEach(a=>a.remove());
 const area=document.createElement('div');area.className='school-home-area';
 const link=document.createElement('a');link.className='school-home-button';link.href='https://drivekup01.github.io/School-Portal/';link.target='_top';link.innerHTML='<span aria-hidden="true">←</span><span>หน้าหลักโรงเรียน</span>';link.setAttribute('aria-label','กลับหน้าหลักโรงเรียน');area.append(link);
 const bottom=sidebar.querySelector('.sidebar-bottom');if(bottom)bottom.prepend(area);else sidebar.append(area);
 const style=document.createElement('style');style.textContent=`
 .school-home-area{margin-top:auto;padding:16px 12px;flex-shrink:0;box-sizing:border-box}
 .sidebar-bottom>.school-home-area{margin:0;padding:0 0 16px}
 a.school-home-button{display:flex!important;align-items:center;justify-content:flex-start;gap:10px;box-sizing:border-box;min-height:44px;width:100%;padding:11px 14px!important;border:1px solid #ffffff30!important;border-radius:10px!important;background:#ffffff0c!important;color:#f0e5fa!important;font:13px/1.5 Tahoma,system-ui,sans-serif!important;text-decoration:none!important;white-space:nowrap}
 a.school-home-button:hover{background:#ffffff20!important}a.school-home-button:focus-visible{outline:3px solid #cda4ed;outline-offset:3px}
 #budgetSidebar>.school-account{margin-top:0!important}.sidebar-collapsed .school-home-area{padding:10px 7px}.sidebar-collapsed .school-home-button{padding:10px!important;justify-content:center}.sidebar-collapsed .school-home-button span+span{display:none}
 @media(max-width:820px){body>.school-home-area{position:fixed;left:14px;bottom:84px;width:190px;z-index:45;padding:0}body>.school-home-area a.school-home-button{background:#472468!important;box-shadow:0 4px 14px #29174325}}
 @media print{.school-home-area{display:none!important}}`;
 document.head.append(style);
 const media=matchMedia('(max-width:820px)');function position(){if(media.matches)document.body.append(area);else if(bottom)bottom.prepend(area);else sidebar.insertBefore(area,sidebar.querySelector(':scope>.school-account'));}position();media.addEventListener('change',position);
}
