'use strict';
const {actor}=require('./behavior');
const {timetable,selectClasses}=require('./class-catalog');
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const permitted=a=>a.admin||a.schoolRole==='timetable';
async function service(db,T,request,now=new Date()){
 const a=await actor(db,request);if(!permitted(a))fail('permission-denied','ใช้ได้เฉพาะฝ่ายวิชาการและผู้ดูแลระบบ');
 const input=request.data||{},keys={rosterClasses:['method'],rosterStudents:['method','classId'],moveStudent:['method','classId','targetClassId','studentId','number','requestId']};
 if(!keys[input.method]||Object.keys(input).some(k=>!keys[input.method].includes(k)))fail('invalid-argument','ข้อมูลคำขอไม่ถูกต้อง');
 if(input.method==='rosterClasses'){
  const [rooms,native]=await Promise.all([db.collection('attendance_classes').where('active','==',true).get(),timetable(db)]);
  const classes=rooms.docs.map(s=>({id:s.id,...s.data()}));return {classes:(selectClasses(classes,native)||classes).map(c=>({id:c.id,name:c.name,academicYear:c.academicYear,term:c.term}))};
 }
 if(!id(input.classId))fail('invalid-argument','เลือกห้องเรียน');
 if(input.method==='rosterStudents'){
  const snaps=await db.doc('attendance_classes/'+input.classId).collection('students').get();return {students:snaps.docs.filter(s=>s.data().active!==false).map(s=>({id:s.id,name:s.data().name,code:s.data().code||'',number:s.data().number})).sort((a,b)=>a.number-b.number)};
 }
 if(!id(input.targetClassId)||input.targetClassId===input.classId||!id(input.studentId)||!id(input.requestId)||!Number.isInteger(input.number)||input.number<1||input.number>1000)fail('invalid-argument','เลือกห้องปลายทางและเลขที่ 1–1000 ให้ถูกต้อง');
 const stamp=T.fromDate(now);
 return db.runTransaction(async tx=>{
  // Re-read identity inside the transaction so revocation cannot race a transfer.
  const [p,l]=await Promise.all([tx.get(db.doc('school_users/'+a.uid)),tx.get(db.doc('attendance_teachers/'+a.uid))]);
  const profile=p.exists?p.data():null,legacy=l.exists?l.data():null;
  const allowed=profile?profile.active===true&&(profile.schoolRole?['admin','timetable'].includes(profile.schoolRole):profile.attendanceRole==='admin'):legacy?.active===true&&legacy.role==='admin'&&legacy.email?.toLowerCase()===a.email;
  if(!allowed)fail('permission-denied','สิทธิ์เปลี่ยนแล้ว กรุณาโหลดใหม่');
  const audit=db.doc('attendance_admin_audit/transfer_'+input.requestId),oldAudit=await tx.get(audit);
  if(oldAudit.exists){const old=oldAudit.data();if(old.actorUid!==a.uid||old.classId!==input.classId||old.targetClassId!==input.targetClassId||old.studentId!==input.studentId||old.number!==input.number)fail('already-exists','รหัสรายการซ้ำ');return {ok:true,id:input.studentId};}
  const sourceRoom=db.doc('attendance_classes/'+input.classId),targetRoom=db.doc('attendance_classes/'+input.targetClassId),source=sourceRoom.collection('students').doc(input.studentId),target=targetRoom.collection('students').doc(input.studentId);
  const [sr,tr,s,t,roster]=await Promise.all([tx.get(sourceRoom),tx.get(targetRoom),tx.get(source),tx.get(target),tx.get(targetRoom.collection('students'))]);
  if(!sr.exists||!tr.exists||sr.data().active!==true||tr.data().active!==true)fail('failed-precondition','ห้องเรียนไม่พร้อมใช้งาน');
  if(sr.data().academicYear!==tr.data().academicYear||sr.data().term!==tr.data().term)fail('failed-precondition','ย้ายได้เฉพาะห้องในปีการศึกษาและภาคเรียนเดียวกัน');
  if(!s.exists||s.data().active===false)fail('failed-precondition','นักเรียนย้ายห้องแล้วหรือปิดใช้งาน กรุณาโหลดใหม่');
  // Never overwrite a prior membership: its marks and behavior reference this path.
  if(t.exists)fail('already-exists','ห้องปลายทางมีประวัตินักเรียนรหัสนี้แล้ว กรุณาตรวจสอบก่อนย้าย');
  const student=s.data();
  if(roster.docs.some(d=>d.data().active!==false&&(d.data().number===input.number||student.code&&d.data().code===student.code)))fail('already-exists','เลขที่หรือรหัสนักเรียนซ้ำในห้องปลายทาง');
  const {movedToClassId,movedAt,...details}=student;
  tx.set(target,{...details,number:input.number,active:true,movedFromClassId:input.classId,transferredAt:stamp,updatedAt:stamp,updatedBy:a.uid});
  tx.update(source,{active:false,movedToClassId:input.targetClassId,movedAt:stamp,updatedAt:stamp,updatedBy:a.uid});
  tx.create(audit,{method:'moveStudent',classId:input.classId,targetClassId:input.targetClassId,studentId:input.studentId,number:input.number,actorUid:a.uid,actorName:a.name,before:student,sourceClassName:sr.data().name,targetClassName:tr.data().name,createdAt:stamp});
  return {ok:true,id:input.studentId};
 });
}
module.exports={service};
