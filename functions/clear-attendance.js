'use strict';
const {createHash}=require('node:crypto'),{dayAt}=require('./overview');
const statuses=['present','late','absent','leave'],id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
const fingerprint=d=>JSON.stringify([d.revision||0,d.status,d.note||'',d.updatedAt?.toMillis?.()??0,d.teacherUid||'',d.studentId||'',d.classId||'']);
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function service(db,T,input,actor,liveAdmin,now){
 if(!id(input.classId)||!['all','morning','subject'].includes(input.kind)||typeof input.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!Number.isFinite(Date.parse(input.date+'T00:00:00Z'))||new Date(input.date+'T00:00:00Z').toISOString().slice(0,10)!==input.date||input.date>dayAt(now))fail('invalid-argument','เลือกห้อง วันที่ และประเภทให้ถูกต้อง');
 const roomRef=db.doc('attendance_classes/'+input.classId),room=await roomRef.get();if(!room.exists)fail('not-found','ไม่พบห้องเรียน');
 const key=input.date.replaceAll('-',''),jobs=await db.collection('attendance_assignments').where('classId','==',input.classId).get();
 if(jobs.docs.length>300)fail('failed-precondition','งานของห้องนี้มีจำนวนมาก กรุณาติดต่อผู้ดูแลฐานข้อมูล');
 const sources=jobs.docs.filter(s=>['morning','subject','substitute'].includes(s.data().kind)&&(input.kind==='all'||input.kind==='morning'&&s.data().kind==='morning'||input.kind==='subject'&&s.data().kind!=='morning')).map(s=>({kind:s.data().kind==='morning'?'morning':'subject',ref:s.ref.collection('days').doc(key).collection('marks')}));
 if(input.kind!=='subject')sources.push({kind:'morning',ref:db.doc('attendance_morning_sessions/'+input.classId+'_'+key).collection('marks')});
 const rows=[];for(let offset=0;offset<sources.length;offset+=10){const results=await Promise.all(sources.slice(offset,offset+10).map(async source=>({source,snap:await source.ref.limit(3001).get()})));for(const {source,snap}of results){if(snap.docs.length>3000)fail('failed-precondition','ข้อมูลมีจำนวนมากเกินไป กรุณาติดต่อผู้ดูแลฐานข้อมูล');for(const s of snap.docs){const d=s.data();if(!statuses.includes(d.status))continue;if(d.classId!==input.classId||d.studentId!==s.id)fail('failed-precondition','พบข้อมูลเช็คชื่อไม่ตรงกับห้อง กรุณาตรวจสอบก่อนล้าง');rows.push({ref:s.ref,before:d,kind:source.kind});}}if(rows.length>3000)fail('failed-precondition','ข้อมูลมีจำนวนมากเกินไป กรุณาเลือกแยกประเภท');}
 rows.sort((a,b)=>a.ref.path.localeCompare(b.ref.path));
 const roomKey=d=>[d.name,d.academicYear,d.term],token=digest([input.classId,input.date,input.kind,roomKey(room.data()),rows.map(r=>[r.ref.path,fingerprint(r.before)])]),summary={classId:input.classId,className:room.data().name,academicYear:room.data().academicYear,term:room.data().term,date:input.date,kind:input.kind,count:rows.length,students:new Set(rows.map(r=>r.before.studentId)).size,morning:rows.filter(r=>r.kind==='morning').length,subject:rows.filter(r=>r.kind==='subject').length};
 if(input.method==='previewClearAttendance'){await db.runTransaction(async tx=>liveAdmin(db,tx,actor));return {...summary,token};}
 if(!id(input.requestId)||typeof input.token!=='string'||!/^[a-f0-9]{64}$/.test(input.token))fail('invalid-argument','กรุณาตรวจสอบข้อมูลก่อนล้าง');
 if(token!==input.token)fail('aborted','ข้อมูลเปลี่ยนจากตอนตรวจสอบ กรุณาตรวจสอบใหม่ก่อนล้าง');
 let cleared=0;const stamp=T.fromDate(now);
 try{for(let offset=0;offset<rows.length;offset+=180){const chunk=rows.slice(offset,offset+180);await db.runTransaction(async tx=>{
  await liveAdmin(db,tx,actor);const currentRoom=await tx.get(roomRef);if(!currentRoom.exists||JSON.stringify(roomKey(currentRoom.data()))!==JSON.stringify(roomKey(room.data())))fail('aborted','ข้อมูลห้องเปลี่ยนแล้ว กรุณาตรวจสอบใหม่');
  const current=await Promise.all(chunk.map(row=>tx.get(row.ref)));for(let i=0;i<chunk.length;i++)if(!current[i].exists||fingerprint(current[i].data())!==fingerprint(chunk[i].before))fail('aborted','มีการแก้ไขข้อมูลระหว่างล้าง กรุณาตรวจสอบใหม่');
  for(const row of chunk){const next={...row.before,status:'cleared',note:'',revision:(row.before.revision||0)+1,updatedAt:stamp,editedBy:actor.uid,editorName:actor.name,clearedAt:stamp,clearRequestId:input.requestId};tx.set(row.ref,next);tx.create(row.ref.collection('history').doc(String(next.revision)),next);}
  tx.create(db.collection('attendance_admin_audit').doc(),{method:'clearAttendance',classId:input.classId,date:input.date,kind:input.kind,requestId:input.requestId,actorUid:actor.uid,actorName:actor.name,count:chunk.length,createdAt:stamp});
 });cleared+=chunk.length;}}catch(error){if(cleared)fail(error.code||'aborted',`ล้างแล้ว ${cleared} รายการ แต่ยังไม่ครบ: ${error.message} กรุณาตรวจสอบใหม่เพื่อล้างรายการที่เหลือ`);throw error;}
 return {...summary,cleared,ok:true};
}
module.exports={service};
