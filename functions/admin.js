'use strict';
const {actor}=require('./behavior');
const {dayAt}=require('./overview');
const {createHash}=require('node:crypto');
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const text=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n;
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const iso=t=>t?.toDate?dayAt(t.toDate()):'';
async function liveAdmin(db,tx,a){
 const [p,l]=await Promise.all([tx.get(db.doc('school_users/'+a.uid)),tx.get(db.doc('attendance_teachers/'+a.uid))]);
 if(p.exists?p.data().active!==true||p.data().attendanceRole!=='admin':!l.exists||l.data().active!==true||l.data().role!=='admin'||l.data().email?.toLowerCase()!==a.email)fail('permission-denied','สิทธิ์ผู้ดูแลเปลี่ยนแล้ว กรุณาโหลดใหม่');
}
async function timetable(db){
 const pointer=await db.doc('timetable_public/current').get();if(!pointer.exists)return null;
 const ref=db.doc('timetable_public_versions/'+pointer.data().version),meta=await ref.get();if(!meta.exists||meta.data().status!=='ready')fail('failed-precondition','ตารางสอนต้นทางยังไม่พร้อม');
 const parts=await ref.collection('parts').get(),chunks=[];for(const part of parts.docs)chunks[Number(part.id)]=part.data().json;
 const content=chunks.join('');if(chunks.filter(x=>typeof x==='string').length!==meta.data().partCount||createHash('sha256').update(content).digest('hex')!==meta.data().hash)fail('failed-precondition','ตารางสอนต้นทางไม่ครบ กรุณาโหลดใหม่');
 return JSON.parse(content);
}
async function service(db,T,request,now=new Date()){
 const a=await actor(db,request);if(!a.admin)fail('permission-denied','ใช้ได้เฉพาะผู้ดูแลระบบเช็คชื่อ');
 const input=request.data||{},allowed={list:['method'],students:['method','classId'],saveClass:['method','item'],saveStudent:['method','classId','item'],saveAssignment:['method','item'],saveMarks:['method','assignmentId','date','marks','revisions']};
 if(!Object.hasOwn(allowed,input.method)||Object.keys(input).some(k=>!allowed[input.method].includes(k)))fail('invalid-argument','ข้อมูลคำขอไม่ถูกต้อง');
 if(input.method==='list'){
  const [p,l,rooms,jobs,native]=await Promise.all([db.collection('school_users').get(),db.collection('attendance_teachers').get(),db.collection('attendance_classes').get(),db.collection('attendance_assignments').get(),timetable(db)]);
  const central=new Map(p.docs.map(s=>[s.id,s.data()])),profiles=[...central].map(([uid,d])=>({id:uid,...d}));for(const s of l.docs)if(!central.has(s.id))profiles.push({id:s.id,...s.data(),attendanceRole:s.data().role||'teacher'});
  const teachers=profiles.filter(p=>p.active===true&&['teacher','admin'].includes(p.attendanceRole)).map(p=>({id:p.id,name:p.name||'ไม่ระบุชื่อ',teacherId:p.teacherId||'',active:true}));
  const classes=await Promise.all(rooms.docs.map(async s=>({id:s.id,...s.data(),studentCount:(await s.ref.collection('students').get()).docs.filter(x=>x.data().active!==false).length})));
  const assignments=jobs.docs.map(s=>({id:s.id,...s.data(),from:iso(s.data().from),to:iso(s.data().to),date:iso(s.data().date)}));
  return {teachers,classes,assignments,timetable:native};
 }
 if(input.method==='students'){
  if(!id(input.classId))fail('invalid-argument','เลือกห้อง');const snaps=await db.collection('attendance_classes').doc(input.classId).collection('students').get();return {students:snaps.docs.map(s=>({id:s.id,...s.data()})).sort((x,y)=>x.number-y.number)};
 }
 const stamp=T.fromDate(now),item=input.item||{};
 if(input.method==='saveClass'){
  if(Object.keys(item).some(k=>!['id','name','academicYear','term','active'].includes(k))||!id(item.id)||!text(item.name,80)||!Number.isInteger(item.academicYear)||item.academicYear<2500||item.academicYear>2700||![1,2].includes(item.term)||typeof item.active!=='boolean')fail('invalid-argument','ข้อมูลห้องไม่ถูกต้อง');
 }else if(input.method==='saveStudent'){
  if(!id(input.classId)||Object.keys(item).some(k=>!['id','name','code','number','active'].includes(k))||!id(item.id)||!text(item.name,160)||typeof item.code!=='string'||item.code.length>100||!Number.isInteger(item.number)||item.number<1||item.number>1000||typeof item.active!=='boolean')fail('invalid-argument','ข้อมูลนักเรียนไม่ถูกต้อง');
 }else if(input.method==='saveAssignment'){
  if(Object.keys(item).some(k=>!['id','teacherUid','classId','kind','subject','period','weekday','from','to','date','time','active','grantBehavior'].includes(k))||item.id&&!id(item.id)||!id(item.teacherUid)||!id(item.classId)||!['morning','subject','substitute'].includes(item.kind)||!text(item.subject,160)||!Number.isInteger(item.period)||item.period<0||item.period>20||!Number.isInteger(item.weekday)||item.weekday<0||item.weekday>6||!date(item.from)||!date(item.to)||item.from>item.to||item.kind==='substitute'&&(!date(item.date)||item.date<item.from||item.date>item.to)||typeof item.time!=='string'||item.time.length>40||typeof item.active!=='boolean'||typeof item.grantBehavior!=='boolean')fail('invalid-argument','ข้อมูลการมอบหมายไม่ถูกต้อง');
 }else if(input.method==='saveMarks'){
  if(!id(input.assignmentId)||!date(input.date)||input.date>dayAt(now)||!input.marks||typeof input.marks!=='object'||Array.isArray(input.marks)||!input.revisions||typeof input.revisions!=='object'||Array.isArray(input.revisions)||Object.keys(input.marks).length<1||Object.keys(input.marks).length>100)fail('invalid-argument','ข้อมูลเช็คชื่อไม่ถูกต้อง');
  for(const [sid,m]of Object.entries(input.marks))if(!id(sid)||!m||Object.keys(m).some(k=>!['status','note'].includes(k))||!['present','late','absent','leave'].includes(m.status)||typeof m.note!=='string'||m.note.length>300||!Number.isInteger(input.revisions[sid]||0)||(input.revisions[sid]||0)<0)fail('invalid-argument','สถานะหรือรุ่นข้อมูลไม่ถูกต้อง');
 }
 return db.runTransaction(async tx=>{
  await liveAdmin(db,tx,a);let ref,before=null,after;
  const audit=db.collection('attendance_admin_audit').doc();
  if(input.method==='saveClass'){
   ref=db.doc('attendance_classes/'+item.id);const old=await tx.get(ref);before=old.exists?old.data():null;after={...before,...item,name:item.name.trim(),createdAt:before?.createdAt||stamp,updatedAt:stamp,updatedBy:a.uid};delete after.id;tx.set(ref,after);
  }else if(input.method==='saveStudent'){
   const room=await tx.get(db.doc('attendance_classes/'+input.classId));if(!room.exists)fail('not-found','ไม่พบห้อง');ref=db.doc('attendance_classes/'+input.classId+'/students/'+item.id);const old=await tx.get(ref);before=old.exists?old.data():null;after={...before,...item,name:item.name.trim(),updatedAt:stamp,updatedBy:a.uid};delete after.id;tx.set(ref,after);
  }else if(input.method==='saveAssignment'){
   ref=item.id?db.doc('attendance_assignments/'+item.id):db.collection('attendance_assignments').doc();const [old,room,p,l,acl]=await Promise.all([tx.get(ref),tx.get(db.doc('attendance_classes/'+item.classId)),tx.get(db.doc('school_users/'+item.teacherUid)),tx.get(db.doc('attendance_teachers/'+item.teacherUid)),tx.get(db.doc('attendance_access/'+item.teacherUid+'/classes/'+item.classId))]);
   if(!room.exists||!room.data().active)fail('invalid-argument','ห้องไม่พร้อมใช้งาน');if(p.exists?p.data().active!==true||!['teacher','admin'].includes(p.data().attendanceRole):!l.exists||l.data().active!==true)fail('invalid-argument','บัญชีครูไม่พร้อมใช้งาน');
   before=old.exists?old.data():null;const changed=before&&(before.teacherUid!==item.teacherUid||before.classId!==item.classId||before.kind!==item.kind);
   const target=changed?db.collection('attendance_assignments').doc():ref;
   const ts=v=>T.fromDate(new Date(v+'T00:00:00+07:00'));after={teacherUid:item.teacherUid,classId:item.classId,className:room.data().name,kind:item.kind,subject:item.subject.trim(),period:item.kind==='morning'?0:item.period,weekday:item.weekday,from:ts(item.from),to:ts(item.to),date:item.kind==='substitute'?ts(item.date):null,time:item.time,active:item.active,createdAt:changed||!before?stamp:before.createdAt,updatedAt:stamp,updatedBy:a.uid};
   if(changed)tx.update(ref,{active:false,updatedAt:stamp,updatedBy:a.uid});tx.set(target,after);ref=target;
   if(item.active){const prior=acl.exists?acl.data():{};tx.set(db.doc('attendance_access/'+item.teacherUid+'/classes/'+item.classId),{active:true,canRead:true,canMorning:prior.canMorning===true||item.kind==='morning',canSubject:prior.canSubject===true||item.kind!=='morning',canBehavior:prior.canBehavior===true||item.grantBehavior,updatedAt:stamp,updatedBy:a.uid});}
  }else{
   ref=db.doc('attendance_assignments/'+input.assignmentId);const snap=await tx.get(ref);if(!snap.exists||snap.data().active!==true)fail('not-found','ไม่พบงานที่เปิดใช้');const job=snap.data(),day=T.fromDate(new Date(input.date+'T00:00:00+07:00')),weekday=new Date(input.date+'T12:00:00+07:00').getUTCDay();if(day.toMillis()<job.from.toMillis()||day.toMillis()>job.to.toMillis()||job.kind==='subject'&&job.weekday!==weekday||job.kind==='substitute'&&iso(job.date)!==input.date)fail('invalid-argument','วันที่ไม่ตรงกับงานมอบหมาย');
   const entries=await Promise.all(Object.keys(input.marks).map(async sid=>{const mark=ref.collection('days').doc(input.date.replaceAll('-','')).collection('marks').doc(sid);const [old,student]=await Promise.all([tx.get(mark),tx.get(db.doc('attendance_classes/'+job.classId+'/students/'+sid))]);if(!student.exists||student.data().active===false)fail('invalid-argument','ไม่พบนักเรียนที่ใช้งาน');const prev=old.exists?old.data():null;if((prev?.revision||0)!==(input.revisions[sid]||0))fail('aborted','ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่');return {sid,mark,prev};}));
   before={};after={};for(const {sid,mark,prev}of entries){const next={assignmentId:ref.id,teacherUid:job.teacherUid,classId:job.classId,studentId:sid,day,...input.marks[sid],revision:(prev?.revision||0)+1,createdAt:prev?.createdAt||stamp,updatedAt:stamp,editedBy:a.uid,editorName:a.name};before[sid]=prev;after[sid]=next;tx.set(mark,next);tx.create(mark.collection('history').doc(String(next.revision)),next);}
  }
  tx.create(audit,{method:input.method,path:ref.path,actorUid:a.uid,actorName:a.name,before,after,createdAt:stamp});return {ok:true,id:ref.id};
 });
}
module.exports={service,timetable};
