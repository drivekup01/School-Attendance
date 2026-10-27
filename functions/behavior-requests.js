'use strict';
const {createHash}=require('node:crypto');
const {actor,managerId}=require('./behavior');
const {dayAt}=require('./overview');
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const id=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(s);
const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const text=(s,max,required=true)=>typeof s==='string'&&s.length<=max&&(!required||!!s.trim());
const get=s=>s.exists?s.data():null;
const fields=['requestId','requestDate','activity','location','startDate','endDate','points','teacherPosition','evidenceTypes','otherEvidence','students','photos'];
function validate(data,now){
 if(!data||Object.keys(data).some(k=>!fields.includes(k))||!id(data.requestId))fail('invalid-argument','ข้อมูลแบบคำร้องไม่ถูกต้อง');
 if(!date(data.requestDate)||data.requestDate>dayAt(now)||!date(data.startDate)||!date(data.endDate)||data.startDate>data.endDate||data.endDate>data.requestDate)fail('invalid-argument','ตรวจวันที่คำร้องและช่วงวันที่กิจกรรม กิจกรรมต้องเสร็จก่อนหรือในวันที่ยื่น');
 if(!text(data.activity,1000)||!text(data.location,200)||!text(data.teacherPosition,100)||!text(data.otherEvidence,300,false))fail('invalid-argument','ระบุกิจกรรม สถานที่ และหน้าที่ผู้ยื่นให้ครบ');
 if(!Number.isInteger(data.points)||data.points<1||data.points>100)fail('invalid-argument','คะแนนที่เสนอให้เพิ่มต้องเป็นจำนวนเต็ม 1–100 คะแนน');
 if(!Array.isArray(data.evidenceTypes)||data.evidenceTypes.length>4||new Set(data.evidenceTypes).size!==data.evidenceTypes.length||data.evidenceTypes.some(t=>!['certificate','participation','photo','other'].includes(t))||data.evidenceTypes.includes('other')&&!data.otherEvidence.trim())fail('invalid-argument','ระบุประเภทหลักฐานให้ถูกต้อง');
 if(!Array.isArray(data.students)||data.students.length<1||data.students.length>100||data.students.some(s=>!s||Object.keys(s).some(k=>!['classId','studentId'].includes(k))||!id(s.classId)||!id(s.studentId))||new Set(data.students.map(s=>s.classId+'/'+s.studentId)).size!==data.students.length)fail('invalid-argument','เพิ่มรายชื่อนักเรียน 1–100 คน โดยไม่ซ้ำกัน');
 if(!Array.isArray(data.photos)||data.photos.length>4)fail('invalid-argument','แนบรูปได้ไม่เกิน 4 รูป');
 for(const p of data.photos){
  if(!p||Object.keys(p).some(k=>!['name','mime','base64'].includes(k))||!text(p.name,150)||!['image/jpeg','image/png'].includes(p.mime)||typeof p.base64!=='string'||p.base64.length>350000||!/^[A-Za-z0-9+/]+={0,2}$/.test(p.base64))fail('invalid-argument','ใช้รูป JPEG หรือ PNG ขนาดไม่เกิน 256 KB ต่อรูปหลังย่อ');
  const bytes=Buffer.from(p.base64,'base64');if(bytes.length>256*1024||bytes.toString('base64')!==p.base64||(p.mime==='image/jpeg'?!bytes.subarray(0,3).equals(Buffer.from([255,216,255])):!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))))fail('invalid-argument','ไฟล์รูปไม่ถูกต้อง');
 }
 if(data.evidenceTypes.includes('photo')&&!data.photos.length)fail('invalid-argument','เลือกหลักฐานภาพถ่ายแล้ว กรุณาเพิ่มรูป');
}
function publicRecord(s){const d=s.data();return {id:s.id,...d,createdAt:d.createdAt?.toDate?.().toISOString()||'',approvedAt:d.approvedAt?.toDate?.().toISOString()||null,awardedAt:d.awardedAt?.toDate?.().toISOString()||null};}
function authorized(a,d){return a.manager||d.teacherUid===a.uid;}
async function service(db,T,request,now=new Date()){
 const a=await actor(db,request),input=request.data||{};
 const accepted={list:['method'],printOptions:['method'],detail:['method','requestId'],photo:['method','requestId','photoId'],submit:['method','form'],approve:['method','requestId','note'],award:['method','requestId'],update:['method','requestId','revision','form'],delete:['method','requestId','revision']};
 if(!Object.hasOwn(accepted,input.method)||Object.keys(input).some(k=>!accepted[input.method].includes(k)))fail('invalid-argument','ไม่รองรับคำขอนี้');
 const collection=db.collection('attendance_behavior_requests');
 if(input.method==='printOptions'){
  const [central,legacy]=await Promise.all([db.collection('school_users').get(),db.collection('attendance_teachers').get()]);
  const profiles=new Map(central.docs.map(s=>[s.id,s.data()]));
  const names=[...profiles.values(),...legacy.docs.filter(s=>!profiles.has(s.id)).map(s=>s.data())].filter(p=>p.active===true&&typeof p.name==='string'&&p.name.trim()).map(p=>p.name.trim());
  return {names:[...new Set(names)].sort((x,y)=>x.localeCompare(y,'th'))};
 }
 if(input.method==='list'){
  const q=a.manager?collection:collection.where('teacherUid','==',a.uid);
  const result=await (a.manager?q.orderBy('createdAt','desc').limit(40):q).get();
  const sorted=[...result.docs].sort((x,y)=>(y.data().createdAt?.toMillis?.()||0)-(x.data().createdAt?.toMillis?.()||0));
  return {requests:sorted.filter(s=>s.data().status!=='deleted').slice(0,40).map(s=>{const d=s.data();return {id:s.id,requestDate:d.requestDate,activity:d.activity,teacherName:d.teacherName,count:d.students.length,points:d.points,status:d.status};})};
 }
 if(input.method==='detail'||input.method==='photo'){
  if(!id(input.requestId))fail('invalid-argument','รหัสคำร้องไม่ถูกต้อง');
  const ref=collection.doc(input.requestId),snap=await ref.get();if(!snap.exists||snap.data().status==='deleted')fail('not-found','ไม่พบคำร้อง');if(!authorized(a,snap.data()))fail('permission-denied','ไม่มีสิทธิ์ดูคำร้องนี้');
  if(input.method==='detail')return {...publicRecord(snap),canEdit:authorized(a,snap.data()),canDelete:a.manager,revision:snap.data().revision||0};
  if(typeof input.photoId!=='string'||!/^p[0-3]$/.test(input.photoId)||!snap.data().photos.some(p=>p.id===input.photoId))fail('invalid-argument','รหัสรูปไม่ถูกต้อง');
  const photo=await ref.collection('photos').doc(input.photoId).get();if(!photo.exists)fail('not-found','ไม่พบรูปแนบ');return photo.data();
 }
 if(input.method==='update'||input.method==='delete'){
  if(!id(input.requestId)||!Number.isInteger(input.revision)||input.revision<0)fail('invalid-argument','ข้อมูลการแก้ไขไม่ถูกต้อง');
  if(input.method==='update')validate(input.form,now);
  const ref=collection.doc(input.requestId);
  return db.runTransaction(async tx=>{
   const [snap,p,l,m]=await Promise.all([tx.get(ref),tx.get(db.doc('school_users/'+a.uid)),tx.get(db.doc('attendance_teachers/'+a.uid)),tx.get(db.doc('attendance_behavior_managers/'+managerId(a.email)))]);
   if(!snap.exists||snap.data().status==='deleted')fail('not-found','ไม่พบคำร้อง');
   const d=snap.data(),profile=get(p),legacy=get(l),grant=get(m);
   const teacher=profile?profile.active===true&&['teacher','admin'].includes(profile.attendanceRole):legacy?.active===true&&legacy.email?.toLowerCase()===a.email;
   const manager=grant?.active===true&&grant.email===a.email||teacher&&(profile?profile.attendanceRole==='admin':legacy.role==='admin');
   if(profile&&profile.active!==true||!manager&&!teacher||!manager&&(input.method==='delete'||d.teacherUid!==a.uid))fail('permission-denied','ไม่มีสิทธิ์จัดการคำร้องนี้');
   if((d.revision||0)!==input.revision)fail('failed-precondition','คำร้องมีการเปลี่ยนแปลง กรุณาโหลดล่าสุดก่อนทำรายการ');
   if(!['pending','approved','awarded'].includes(d.status))fail('failed-precondition','สถานะคำร้องไม่พร้อมแก้ไข');
   const revision=input.revision+1,stamp=T.fromDate(now),form=input.form;
   let body;
   if(input.method==='update'){
    const classIds=[...new Set(form.students.map(s=>s.classId))];
    const rooms=await Promise.all(classIds.map(async classId=>{
     const [room,acl]=await Promise.all([tx.get(db.doc('attendance_classes/'+classId)),tx.get(db.doc('attendance_access/'+a.uid+'/classes/'+classId))]);
     if(!room.exists||room.data().active!==true)fail('invalid-argument','พบห้องเรียนที่ไม่พร้อมใช้งาน');
     if(!manager&&(!acl.exists||acl.data().active!==true||acl.data().canRead!==true))fail('permission-denied','ไม่มีสิทธิ์ยื่นรายชื่อของห้องนี้');
     return {id:classId,name:room.data().name};
    }));
    const roster=await Promise.all(form.students.map(s=>tx.get(db.doc('attendance_classes/'+s.classId+'/students/'+s.studentId))));
    if(roster.some(s=>!s.exists||s.data().active===false))fail('invalid-argument','พบรายชื่อนักเรียนที่ไม่พร้อมใช้งาน');
    const {photos,requestId,...data}=form;
    body={...data,activity:data.activity.trim(),location:data.location.trim(),teacherPosition:data.teacherPosition.trim(),otherEvidence:data.otherEvidence.trim(),students:form.students.map((s,i)=>({...s,name:roster[i].data().name,code:roster[i].data().code||'',number:roster[i].data().number||0,className:rooms.find(c=>c.id===s.classId).name})),photos:photos.map((p,i)=>({id:'p'+i,name:p.name,mime:p.mime}))};
   }
   const oldPhotos=await Promise.all(d.photos.map(photo=>tx.get(ref.collection('photos').doc(photo.id))));
   // Append compensation entries; never rewrite the original score history.
   const ledger=(student,delta,key,endDate)=>tx.create(db.doc('attendance_behavior/'+key),{teacherUid:a.uid,classId:student.classId,studentId:student.studentId,day:T.fromDate(new Date(endDate+'T00:00:00+07:00')),delta,reason:((input.method==='delete'?'ยกเลิกคำร้อง ':'แก้ไขคำร้อง ')+ref.id).slice(0,300),createdAt:stamp,authorName:a.name,groupId:'request_'+ref.id,sourceRequestId:ref.id,requestRevision:revision});
   if(d.status==='awarded')d.students.forEach((student,i)=>ledger(student,-d.points,'request_'+ref.id+'_revision_'+revision+'_reverse_'+i,d.endDate));
   const keepAward=input.method==='update'&&manager&&d.status==='awarded';
   if(keepAward)body.students.forEach((student,i)=>ledger(student,body.points,'request_'+ref.id+'_revision_'+revision+'_award_'+i,body.endDate));
   oldPhotos.forEach(photo=>{if(photo.exists)tx.create(ref.collection('revisions').doc(String(revision)).collection('photos').doc(photo.id),photo.data());});
   tx.create(ref.collection('revisions').doc(String(revision)),{previous:d,method:input.method,actorUid:a.uid,actorName:a.name,changedAt:stamp});
   const status=input.method==='delete'?'deleted':keepAward?'awarded':'pending';
   const workflow=keepAward?{approvedBy:a.uid,approvedName:a.name,approvedAt:stamp,awardedBy:a.uid,awardedName:a.name,awardedAt:stamp}:{approvedBy:null,approvedName:null,approvedAt:null,approvalNote:'',awardedBy:null,awardedName:null,awardedAt:null};
   tx.update(ref,{...body,...workflow,status,revision,updatedBy:a.uid,updatedName:a.name,updatedAt:stamp,...(input.method==='delete'?{deletedBy:a.uid,deletedAt:stamp}:{})});
   if(body)form.photos.forEach((photo,i)=>tx.set(ref.collection('photos').doc('p'+i),photo));
   return {id:ref.id,status,revision,count:(body||d).students.length};
  });
 }
 if(input.method==='approve'||input.method==='award'){
  if(!a.manager)fail('permission-denied','เฉพาะผู้ดูแลความประพฤติที่ได้รับมอบหมายเท่านั้น');
  if(!id(input.requestId)||input.method==='approve'&&!text(input.note,300,false))fail('invalid-argument','ข้อมูลการอนุมัติไม่ถูกต้อง');
  const ref=collection.doc(input.requestId);
  return db.runTransaction(async tx=>{
   const [snap,grant,profile,legacy]=await Promise.all([tx.get(ref),tx.get(db.doc('attendance_behavior_managers/'+managerId(a.email))),tx.get(db.doc('school_users/'+a.uid)),tx.get(db.doc('attendance_teachers/'+a.uid))]);
   const admin=profile.exists?profile.data().active===true&&profile.data().attendanceRole==='admin':legacy.exists&&legacy.data().active===true&&legacy.data().role==='admin'&&legacy.data().email?.toLowerCase()===a.email;
   if(!(admin||grant.exists&&grant.data().active===true&&grant.data().email===a.email)||profile.exists&&profile.data().active!==true)fail('permission-denied','สิทธิ์ผู้อนุมัติมีการเปลี่ยนแปลง');
   if(!snap.exists||snap.data().status==='deleted')fail('not-found','ไม่พบคำร้อง');const d=snap.data(),stamp=T.fromDate(now);
   if(d.status==='awarded')return {id:ref.id,status:'awarded',count:d.students.length,replayed:true};
   if(input.method==='approve'?!['pending','approved'].includes(d.status):d.status!=='approved')fail('failed-precondition','ต้องอนุมัติเอกสารก่อนเพิ่มคะแนน');
   const classIds=[...new Set(d.students.map(s=>s.classId))];
   const [rooms,roster]=await Promise.all([Promise.all(classIds.map(c=>tx.get(db.doc('attendance_classes/'+c)))),Promise.all(d.students.map(s=>tx.get(db.doc('attendance_classes/'+s.classId+'/students/'+s.studentId))))]);
   if(rooms.some(c=>!c.exists||c.data().active!==true)||roster.some(s=>!s.exists||s.data().active===false))fail('failed-precondition','มีห้องหรือนักเรียนที่ไม่พร้อมใช้งาน กรุณาตรวจสอบก่อนเพิ่มคะแนน');
   const day=T.fromDate(new Date(d.endDate+'T00:00:00+07:00'));
   d.students.forEach((s,i)=>tx.create(db.doc('attendance_behavior/request_'+ref.id+(d.revision?'_revision_'+d.revision+'_approved':'')+'_'+i),{teacherUid:a.uid,classId:s.classId,studentId:s.studentId,day,delta:d.points,reason:('ตามคำร้อง '+ref.id+' · '+d.activity).slice(0,300),createdAt:stamp,authorName:a.name,groupId:'request_'+ref.id,sourceRequestId:ref.id}));
   const approval=d.status==='pending'?{approvedBy:a.uid,approvedName:a.name,approvedAt:stamp,approvalNote:(input.note||'').trim()}:{};
   // Approval and every ledger entry commit together; retries cannot award twice.
   tx.update(ref,{...approval,status:'awarded',revision:(d.revision||0)+1,awardedBy:a.uid,awardedName:a.name,awardedAt:stamp});return {id:ref.id,status:'awarded',count:d.students.length};
  });
 }
 const form=input.form;validate(form,now);
 const ref=collection.doc(createHash('sha256').update(a.uid+'_'+form.requestId).digest('hex')),digest=createHash('sha256').update(JSON.stringify(form)).digest('hex');
 const classIds=[...new Set(form.students.map(s=>s.classId))];
 return db.runTransaction(async tx=>{
  const prior=await tx.get(ref);if(prior.exists){if(prior.data().digest!==digest)fail('already-exists','รหัสคำร้องนี้ถูกใช้กับข้อมูลอื่นแล้ว');return {id:ref.id,status:prior.data().status,replayed:true};}
  const [p,l,m]=await Promise.all([tx.get(db.doc('school_users/'+a.uid)),tx.get(db.doc('attendance_teachers/'+a.uid)),tx.get(db.doc('attendance_behavior_managers/'+managerId(a.email)))]);
  if(p.exists&&p.data().active!==true)fail('permission-denied','บัญชีนี้ถูกระงับ');
  const manager=m.exists&&m.data().active===true&&m.data().email===a.email;
  const teacher=p.exists?p.data().active===true&&['teacher','admin'].includes(p.data().attendanceRole):l.exists&&l.data().active===true&&l.data().email?.toLowerCase()===a.email;
  const admin=teacher&&(p.exists?p.data().attendanceRole==='admin':l.data().role==='admin');
  if(!manager&&!teacher)fail('permission-denied','สิทธิ์บัญชีมีการเปลี่ยนแปลง');
  const rooms=await Promise.all(classIds.map(async classId=>{
   const [c,acl]=await Promise.all([tx.get(db.doc('attendance_classes/'+classId)),tx.get(db.doc('attendance_access/'+a.uid+'/classes/'+classId))]);
   if(!c.exists||c.data().active!==true)fail('invalid-argument','พบห้องเรียนที่ไม่พร้อมใช้งาน');
   if(!manager&&!admin&&(!acl.exists||acl.data().active!==true||acl.data().canRead!==true))fail('permission-denied','ไม่มีสิทธิ์ยื่นรายชื่อของห้องนี้');
   return {id:classId,name:c.data().name};
  }));
  const roster=await Promise.all(form.students.map(s=>tx.get(db.doc('attendance_classes/'+s.classId+'/students/'+s.studentId))));
  if(roster.some(s=>!s.exists||s.data().active===false))fail('invalid-argument','พบรายชื่อนักเรียนที่ไม่พร้อมใช้งาน');
  const {photos,requestId,...body}=form;
  const students=form.students.map((s,i)=>({classId:s.classId,studentId:s.studentId,name:roster[i].data().name,code:roster[i].data().code||'',number:roster[i].data().number||0,className:rooms.find(c=>c.id===s.classId).name}));
  const photoList=photos.map((p,i)=>({id:'p'+i,name:p.name,mime:p.mime}));
  tx.create(ref,{...body,activity:body.activity.trim(),location:body.location.trim(),teacherPosition:body.teacherPosition.trim(),otherEvidence:body.otherEvidence.trim(),students,photos:photoList,status:'pending',teacherUid:a.uid,teacherName:a.name,createdAt:T.fromDate(now),digest});
  photos.forEach((p,i)=>tx.create(ref.collection('photos').doc('p'+i),p));
  // Submitting a request never creates score ledger events or approval signatures.
  return {id:ref.id,status:'pending'};
 });
}
module.exports={service,validate};
