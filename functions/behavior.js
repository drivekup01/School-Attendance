'use strict';
const {createHash}=require('node:crypto');
const {dayAt,currentClasses}=require('./overview');
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const id=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(s);
const managerId=email=>createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
const value=s=>s.exists?s.data():null;
function validate(input,now){
 const method=input?.method;
 const allowed={classes:['method'],room:['method','classId'],add:['method','classId','studentIds','delta','reason','date','requestId']};
 if(!Object.hasOwn(allowed,method)||Object.keys(input).some(k=>!allowed[method].includes(k)))fail('invalid-argument','ไม่รองรับคำขอนี้');
 if(method!=='classes'&&!id(input.classId))fail('invalid-argument','เลือกห้องเรียนให้ถูกต้อง');
 if(method!=='add')return;
 if(!Array.isArray(input.studentIds)||!input.studentIds.length||input.studentIds.length>100||input.studentIds.some(s=>!id(s))||new Set(input.studentIds).size!==input.studentIds.length)fail('invalid-argument','เลือกนักเรียน 1–100 คน โดยไม่ซ้ำกัน');
 if(!Number.isInteger(input.delta)||input.delta===0||Math.abs(input.delta)>100)fail('invalid-argument','คะแนนต้องเป็นจำนวนเต็ม 1–100 คะแนน');
 if(typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>300)fail('invalid-argument','ระบุเหตุผล 1–300 ตัวอักษร');
 if(typeof input.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!Number.isFinite(Date.parse(input.date+'T00:00:00Z'))||new Date(input.date+'T00:00:00Z').toISOString().slice(0,10)!==input.date||input.date>dayAt(now))fail('invalid-argument','วันที่ไม่ถูกต้องหรืออยู่ในอนาคต');
 if(!id(input.requestId))fail('invalid-argument','รหัสรายการไม่ถูกต้อง');
}
async function actor(db,request){
 const a=request.auth;
 if(!a||a.token?.email_verified!==true||a.token.firebase?.sign_in_provider!=='google.com'||typeof a.token.email!=='string')fail('unauthenticated','กรุณาเข้าสู่ระบบด้วย Google');
 const email=a.token.email.trim().toLowerCase();
 const [p,l,m]=await db.getAll(db.doc('school_users/'+a.uid),db.doc('attendance_teachers/'+a.uid),db.doc('attendance_behavior_managers/'+managerId(email)));
 const profile=value(p),legacy=value(l),grant=value(m);
 if(profile&&profile.active!==true)fail('permission-denied','บัญชีนี้ถูกระงับ');
 const manager=grant?.active===true&&grant.email===email;
 const teacher=profile?profile.active===true&&['teacher','admin'].includes(profile.attendanceRole):legacy?.active===true&&legacy.email?.toLowerCase()===email;
 if(!manager&&!teacher)fail('permission-denied','บัญชีนี้ยังไม่ได้รับสิทธิ์ความประพฤติ');
 return {uid:a.uid,email,manager,admin:teacher&&(profile?profile.attendanceRole==='admin':legacy.role==='admin'),name:manager?grant.name:profile?.name||legacy?.name||a.token.name||'ครูผู้บันทึก'};
}
async function access(db,a,classId){
 if(a.manager)return {read:true,write:true};
 const acl=value(await db.doc('attendance_access/'+a.uid+'/classes/'+classId).get());
 return {read:a.admin||acl?.active===true&&acl.canRead===true,write:acl?.active===true&&acl.canRead===true&&acl.canBehavior===true};
}
const iso=t=>t?.toDate?.().toISOString()||'';
function summarize(students,events){
 return students.filter(s=>s.active!==false).map(s=>{const delta=events.filter(e=>e.studentId===s.id).reduce((n,e)=>n+e.delta,0);return {id:s.id,name:s.name,number:s.number,code:s.code,delta,score:100+delta};}).sort((a,b)=>a.number-b.number);
}
async function service(db,Timestamp,request,now=new Date()){
 const a=await actor(db,request),input=request.data||{};validate(input,now);
 if(input.method==='classes'){
  let classes;
  if(a.manager||a.admin)classes=(await db.collection('attendance_classes').where('active','==',true).get()).docs.map(d=>({id:d.id,...d.data()}));
  else {const acl=(await db.collection('attendance_access').doc(a.uid).collection('classes').get()).docs.filter(d=>d.data().active===true&&d.data().canRead===true);classes=acl.length?(await db.getAll(...acl.map(d=>db.doc('attendance_classes/'+d.id)))).filter(d=>d.exists).map(d=>({id:d.id,...d.data()})):[];}
  classes=currentClasses(classes,Number(dayAt(now).slice(0,4))+543);
  const rooms=await Promise.all(classes.map(async c=>({id:c.id,name:c.name,canWrite:(await access(db,a,c.id)).write})));
  return {manager:a.manager,canBulk:a.manager,baseScore:100,classes:rooms};
 }
 const rights=await access(db,a,input.classId);if(!rights.read)fail('permission-denied','ไม่มีสิทธิ์ดูห้องนี้');
 const roomRef=db.doc('attendance_classes/'+input.classId),room=value(await roomRef.get());if(!room?.active)fail('not-found','ไม่พบห้องเรียนที่เปิดใช้งาน');
 if(input.method==='room'){
  const [roster,ledger]=await Promise.all([roomRef.collection('students').get(),db.collection('attendance_behavior').where('classId','==',input.classId).get()]);
  const events=ledger.docs.map(d=>{const e=d.data();return {id:d.id,studentId:e.studentId,delta:e.delta,reason:e.reason,date:e.day?.toDate?dayAt(e.day.toDate()):'',createdAt:iso(e.createdAt),author:e.authorName||'ครูผู้บันทึก',groupId:e.groupId||null};}).sort((x,y)=>y.createdAt.localeCompare(x.createdAt));
  return {baseScore:100,canWrite:rights.write,students:summarize(roster.docs.map(d=>({id:d.id,...d.data()})),events),events};
 }
 if(!rights.write||(!a.manager&&input.studentIds.length!==1))fail('permission-denied','ครูทั่วไปบันทึกได้ทีละคนตามสิทธิ์ห้อง ส่วนแบบกลุ่มใช้ได้เฉพาะผู้ดูแลความประพฤติ');
 const operation=db.doc('attendance_behavior_operations/'+a.uid+'_'+input.requestId);
 const payload={classId:input.classId,studentIds:[...input.studentIds].sort(),delta:input.delta,reason:input.reason.trim(),date:input.date};
 const digest=createHash('sha256').update(JSON.stringify(payload)).digest('hex');
 return db.runTransaction(async tx=>{
  const prior=await tx.get(operation);
  if(prior.exists){if(prior.data().digest!==digest)fail('already-exists','รหัสรายการนี้ถูกใช้กับข้อมูลอื่นแล้ว');return {ok:true,count:prior.data().count,replayed:true};}
  // Recheck authorization and room state in the transaction before writing.
  const [central,manager,acl,liveRoom,legacy]=await Promise.all([tx.get(db.doc('school_users/'+a.uid)),tx.get(db.doc('attendance_behavior_managers/'+managerId(a.email))),tx.get(db.doc('attendance_access/'+a.uid+'/classes/'+input.classId)),tx.get(roomRef),tx.get(db.doc('attendance_teachers/'+a.uid))]);
  if(central.exists&&central.data().active!==true)fail('permission-denied','บัญชีนี้ถูกระงับ');
  const liveManager=value(manager),liveACL=value(acl);
  const isManager=liveManager?.active===true&&liveManager.email===a.email;
  const centralAllowed=central.exists?central.data().active===true&&['teacher','admin'].includes(central.data().attendanceRole):legacy.exists&&legacy.data().active===true&&legacy.data().email?.toLowerCase()===a.email;
  if(!liveRoom.exists||liveRoom.data().active!==true||!isManager&&(!centralAllowed||liveACL?.active!==true||liveACL.canRead!==true||liveACL.canBehavior!==true||input.studentIds.length!==1))fail('permission-denied','สิทธิ์ห้องมีการเปลี่ยนแปลง กรุณาโหลดใหม่');
  const roster=await Promise.all(payload.studentIds.map(s=>tx.get(roomRef.collection('students').doc(s))));
  if(roster.some(s=>!s.exists||s.data().active===false))fail('invalid-argument','พบรายชื่อนักเรียนที่ไม่พร้อมใช้งาน');
  const stamp=Timestamp.fromDate(now),day=Timestamp.fromDate(new Date(payload.date+'T00:00:00+07:00'));
  for(const s of roster){const event=db.collection('attendance_behavior').doc();tx.create(event,{teacherUid:a.uid,classId:payload.classId,studentId:s.id,day,delta:payload.delta,reason:payload.reason,createdAt:stamp,authorName:a.name,groupId:operation.id});}
  tx.create(operation,{digest,count:roster.length,teacherUid:a.uid,classId:payload.classId,createdAt:stamp});
  return {ok:true,count:roster.length};
 });
}
module.exports={service,actor,access,validate,summarize,managerId};
