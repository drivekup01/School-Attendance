import {firebase} from './firebase-client.js?v=20261027-roles1';
import {settings} from './settings.js?v=20261025-firebase2';
import {validDate,validateMarks,validateRange,today,assignmentsOn} from './core.js?v=20261025-firebase2';
const C=Object.freeze({teachers:'attendance_teachers',access:'attendance_access',assignments:'attendance_assignments',classes:'attendance_classes',behavior:'attendance_behavior'});
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(id);
const key=date=>date.replaceAll('-','');
const iso=ts=>ts?.toDate?today(ts.toDate()):'';
const instant=ts=>ts?.toDate?.().toISOString()||'';
async function ready(){if(!settings.databaseReady)throw Error('ยังไม่เปิดเชื่อมฐานข้อมูลจริง');const c=await firebase();if(!c.auth.currentUser)throw Error('กรุณาเข้าสู่ระบบด้วย Google');return {...c,uid:c.auth.currentUser.uid};}
function timestamp(F,date){if(!validDate(date)||date>today())throw Error('วันที่ไม่ถูกต้อง หรือเป็นวันที่ในอนาคต');return F.Timestamp.fromDate(new Date(date+'T00:00:00+07:00'));}
function markRef(c,a,date,sid){if(!validId(a.id)||!validId(sid)||!validDate(date))throw Error('รหัสข้อมูลไม่ถูกต้อง');return c.F.doc(c.db,C.assignments,a.id,'days',key(date),'marks',sid);}
function asAssignment(snap){const d=snap.data();return {...d,id:snap.id,from:iso(d.from),to:iso(d.to),date:d.date?iso(d.date):null};}
export const store={
 async assignments(){const c=await ready();const profile=await (await import('./school-auth.js?v=20261027-roles1')).profile();const admin=profile.attendanceRole==='admin';if(profile.schoolRole){const snaps=await c.F.getDocsFromServer(c.F.query(c.F.collection(c.db,C.assignments),c.F.where('active','==',true)));return snaps.docs.map(asAssignment).map(a=>({...a,canWrite:admin||profile.attendanceRole==='teacher'&&a.teacherUid===c.uid}));}if(admin){const data=await (await import('./school-auth.js?v=20261027-roles1')).call('attendanceAdmin',{method:'list'});return data.assignments.filter(a=>a.active).map(a=>({...a,teacherName:data.teachers.find(t=>t.id===a.teacherUid)?.name||'บัญชีเดิม'}));}const constraints=admin?[c.F.where('active','==',true)]:[c.F.where('teacherUid','==',c.uid),c.F.where('active','==',true)];const snaps=await c.F.getDocsFromServer(c.F.query(c.F.collection(c.db,C.assignments),...constraints));return snaps.docs.map(asAssignment);},
 async students(classId){const c=await ready();if(!validId(classId))throw Error('รหัสห้องไม่ถูกต้อง');const s=await c.F.getDocsFromServer(c.F.collection(c.db,C.classes,classId,'students'));return s.docs.map(d=>({...d.data(),id:d.id})).filter(s=>s.active!==false).sort((a,b)=>a.number-b.number);},
 async session(a,date){const c=await ready();if(!validDate(date)||!validId(a.id))throw Error('วันที่หรือคาบไม่ถูกต้อง');const snaps=await c.F.getDocsFromServer(c.F.collection(c.db,C.assignments,a.id,'days',key(date),'marks'));const marks={},revision={};let updatedAt='';for(const snap of snaps.docs){const d=snap.data();marks[snap.id]={status:d.status,note:d.note};revision[snap.id]=d.revision;const time=instant(d.updatedAt);if(time>updatedAt)updatedAt=time;}return {marks,revision,updatedAt};},
 async save(a,date,students,marks,revision){
  validateMarks(students,marks);const c=await ready(),day=timestamp(c.F,date);const profile=await (await import('./school-auth.js?v=20261027-roles1')).profile();if(profile.attendanceRole==='viewer'||profile.schoolRole&&a.canWrite===false)throw Error('ห้องหรือคาบนี้ดูได้อย่างเดียว');if(profile.attendanceRole==='admin'){await (await import('./school-auth.js?v=20261027-roles1')).call('attendanceAdmin',{method:'saveMarks',assignmentId:a.id,date,marks,revisions:revision});return this.session(a,date);}
  if(!assignmentsOn([a],date,a.kind==='morning'?'morning':'subject').length)throw Error('ไม่มีสิทธิ์เช็คชื่อคาบนี้ในวันที่เลือก');
  let completed=0;
  // A transaction saves at most 5 students: roster + mark/audit cross-checks
  // stay below the 20 security-rule document access limit for multi-writes.
  try{for(let offset=0;offset<students.length;offset+=5){const chunk=students.slice(offset,offset+5);await c.F.runTransaction(c.db,async tx=>{
    const prior=await Promise.all(chunk.map(s=>tx.get(markRef(c,a,date,s.id))));
    for(let i=0;i<chunk.length;i++){const s=chunk[i],snap=prior[i],old=snap.exists()?snap.data():null;if((old?.revision||0)!==(revision[s.id]||0))throw Error('ข้อมูลมีการเปลี่ยนแปลงจากอีกหน้าจอ กรุณาโหลดใหม่ก่อนบันทึก');}
    for(let i=0;i<chunk.length;i++){const s=chunk[i],snap=prior[i],old=snap.exists()?snap.data():null,m=marks[s.id];if(old?.status===m.status&&old?.note===(m.note||''))continue;const ref=markRef(c,a,date,s.id),next={assignmentId:a.id,teacherUid:c.uid,classId:a.classId,studentId:s.id,day,status:m.status,note:m.note||'',revision:(old?.revision||0)+1,createdAt:old?.createdAt||c.F.serverTimestamp(),updatedAt:c.F.serverTimestamp()};tx.set(ref,next);tx.set(c.F.doc(ref,'history',String(next.revision)),next);}
   });completed+=chunk.length;}
  }catch(error){if(completed)throw Error(`บันทึกไปบางส่วนแล้ว (${completed} คน) กรุณาจดการแก้ไขที่เหลือ แล้วกดโหลดใหม่ก่อนบันทึกอีกครั้ง: ${error.message}`);throw error;}
  return this.session(a,date);
 },
 async behavior(classId){const c=await ready();if(!validId(classId))throw Error('รหัสห้องไม่ถูกต้อง');const profile=await (await import('./school-auth.js?v=20261027-roles1')).profile();const filters=(profile.schoolRole||profile.attendanceRole==='admin')?[c.F.where('classId','==',classId)]:[c.F.where('teacherUid','==',c.uid),c.F.where('classId','==',classId)];const snaps=await c.F.getDocsFromServer(c.F.query(c.F.collection(c.db,C.behavior),...filters));return snaps.docs.map(s=>{const d=s.data();return {...d,id:s.id,date:iso(d.day),createdAt:instant(d.createdAt)};}).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));},
 async addBehavior(item){if(item.delta>0)throw Error('การเพิ่มคะแนนทุกครั้งต้องยื่นแบบคำร้องและได้รับอนุมัติก่อน');const {call}=await import('./school-auth.js?v=20261027-roles1');return call('attendanceBehavior',{method:'add',classId:item.classId,studentIds:[item.studentId],delta:item.delta,category:item.category,reason:item.reason,date:item.date,requestId:item.requestId||crypto.randomUUID()});},
 async report(from,to,kind){validateRange(from,to);const assignments=await this.assignments();const classes=[...new Map(assignments.map(a=>[a.classId,a])).values()];const rosters=new Map();for(const a of classes)rosters.set(a.classId,await this.students(a.classId));const records=[];
  if(kind==='behavior'){for(const a of classes){const events=await this.behavior(a.classId);for(const event of events.filter(e=>e.date>=from&&e.date<=to)){const student=rosters.get(a.classId).find(s=>s.id===event.studentId);records.push({...event,className:a.className,studentCode:student?.code||'',studentName:student?.name||'(ไม่พบในรายชื่อปัจจุบัน)'});}}return records;}
  for(let d=new Date(from+'T00:00:00Z');d<=new Date(to+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1)){const date=d.toISOString().slice(0,10);const daily=assignmentsOn(assignments,date).filter(a=>kind==='all'||(kind==='morning'?a.kind==='morning':a.kind!=='morning'));for(const a of daily){const session=await this.session(a,date);if(Object.keys(session.marks).length)records.push({...session,date,assignmentId:a.id,classId:a.classId,className:a.className,subject:a.subject,kind:a.kind,period:a.period,students:rosters.get(a.classId)});}}
  return records;
 }
};
