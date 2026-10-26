import {escapeHTML as e,statuses,thaiDate,today,assignmentsOn} from './core.js?v=20261025-firebase2';
const labels={all:'ทั้งหมด',...statuses,pending:'ยังไม่เช็ค'};
const colors={present:'teal',late:'gold',absent:'purple',leave:'blue'};
export async function renderOverview(host,{isDemo,provider,assignments}){
 let summary,selected='all',roomId='',requestId=0;
 host.innerHTML=`<section class="panel morning-overview"><div class="panel-heading"><div><h2>สรุปเข้าแถวเช้าวันนี้</h2><small>${e(thaiDate(today()))} · ใช้ผลเช็คชื่อตอนเช้าเท่านั้น</small></div><button class="button ghost" data-overview-refresh>ค้นหา</button></div><div data-overview-body></div></section>`;
 const body=host.querySelector('[data-overview-body]');
 let demoDetails=new Map();
 async function call(input){
  if(!isDemo)return (await import('./school-auth.js?v=20261025-firebase2')).call('attendanceOverview',input);
  if(input.method==='details')return {students:(demoDetails.get(input.classId)||[]).filter(s=>input.status==='all'||s.status===input.status)};
  const rooms=[],totals={present:0,late:0,absent:0,leave:0,pending:0,total:0};demoDetails=new Map();
  const classes=[...new Map(assignments.map(a=>[a.classId,a])).values()];
  for(const c of classes){const roster=await provider.students(c.classId),morning=assignmentsOn(assignments,today(),'morning').filter(a=>a.classId===c.classId);let marks={};for(const a of morning)Object.assign(marks,(await provider.session(a,today())).marks);const students=roster.map(s=>({...s,status:marks[s.id]?.status||'pending'})),counts={present:0,late:0,absent:0,leave:0,pending:0,total:students.length};students.forEach(s=>counts[s.status]++);for(const k of Object.keys(totals))totals[k]+=counts[k];demoDetails.set(c.classId,students);rooms.push({id:c.classId,name:c.className,counts});}
  return {date:today(),totals,rooms,updatedAt:null};
 }
 function draw(){
  const t=summary.totals,rooms=summary.rooms.filter(r=>selected==='all'||r.counts[selected]>0);
  body.innerHTML=`<div class="stats overview-statuses">${Object.entries(statuses).map(([k,v])=>`<button class="stat ${colors[k]} ${selected===k?'selected':''}" data-status="${k}" aria-pressed="${selected===k}"><span>${v}</span><strong>${t[k]} <small>คน</small></strong><small>ดูห้องและรายชื่อ</small></button>`).join('')}</div><div class="overview-meta"><button class="overview-filter" data-status="all" aria-pressed="${selected==='all'}">นักเรียนทั้งหมด ${t.total} คน</button><button class="overview-filter" data-status="pending" aria-pressed="${selected==='pending'}">ยังไม่เช็ค ${t.pending} คน</button><span>${summary.updatedAt?'บันทึกล่าสุด '+e(new Date(summary.updatedAt).toLocaleTimeString('th-TH',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit'})):'ยังไม่มีผลเช็คชื่อเช้าวันนี้'}</span></div><h3>ห้องเรียน · ${labels[selected]}</h3><div class="overview-rooms">${rooms.map(r=>`<button data-room="${e(r.id)}" class="overview-room ${roomId===r.id?'selected':''}" aria-pressed="${roomId===r.id}"><strong>${e(r.name)}</strong><span>${selected==='all'?r.counts.total:r.counts[selected]} คน</span><small>มา ${r.counts.present} · สาย ${r.counts.late} · ขาด ${r.counts.absent} · ลา ${r.counts.leave} · ยังไม่เช็ค ${r.counts.pending}</small></button>`).join('')||'<p class="fine-print">ไม่มีนักเรียนในสถานะนี้</p>'}</div><div data-overview-details aria-live="polite"><p class="fine-print">เลือกห้องเรียนเพื่อดูรายชื่อ</p></div>`;
 }
 async function load(){const token=++requestId,button=host.querySelector('[data-overview-refresh]');button.disabled=true;body.innerHTML='<p class="loading">กำลังค้นหาผลเข้าแถวเช้าวันนี้…</p>';try{const result=await call({method:'summary'});if(token!==requestId)return;summary=result;roomId='';draw();}catch(error){if(token===requestId)body.innerHTML='<p class="fine-print">'+e(error.message||'โหลดข้อมูลไม่สำเร็จ กรุณากดค้นหาอีกครั้ง')+'</p>';}finally{button.disabled=false;}}
 body.addEventListener('click',async event=>{
  const statusButton=event.target.closest('[data-status]');if(statusButton){++requestId;selected=statusButton.dataset.status;roomId='';draw();return;}
  const roomButton=event.target.closest('[data-room]');if(!roomButton)return;
  roomId=roomButton.dataset.room;const token=++requestId,room=summary.rooms.find(r=>r.id===roomId);draw();const details=body.querySelector('[data-overview-details]');details.innerHTML='<p class="loading">กำลังโหลดรายชื่อ…</p>';
  try{const result=await call({method:'details',classId:roomId,status:selected});if(token!==requestId)return;details.innerHTML=`<h3>${e(room.name)} · ${labels[selected]} · ${result.students.length} คน</h3><div class="overview-students">${result.students.map(s=>`<div class="overview-student"><span>${e(s.number)}</span><div><strong>${e(s.name)}</strong><small>เลขประจำตัว ${e(s.code)}</small></div><span class="tag">${labels[s.status]}</span></div>`).join('')||'<p class="fine-print">ไม่มีนักเรียนในสถานะนี้</p>'}</div>`;}catch(error){if(token===requestId)details.innerHTML='<p class="fine-print">'+e(error.message)+'</p>';}
 });
 host.querySelector('[data-overview-refresh]').onclick=load;await load();
}
