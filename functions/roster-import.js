'use strict';
const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
function validateRoster(input){
 if(!/^[A-Za-z0-9_-]{1,100}$/.test(input.classId||'')||!Number.isInteger(input.academicYear)||![1,2].includes(input.term)||!/^ม\.[1-6]\/[1-3]$/.test(input.label||'')||!Array.isArray(input.students)||!input.students.length||input.students.length>100)fail('invalid-argument','ข้อมูลนำเข้าไม่ถูกต้อง');
 const codes=new Set(),numbers=new Set();
 for(const s of input.students){if(!s||Object.keys(s).some(k=>!['code','number','name'].includes(k))||typeof s.code!=='string'||!/^\d{1,20}$/.test(s.code)||typeof s.name!=='string'||!s.name.trim()||s.name.length>160||!Number.isInteger(s.number)||s.number<1||s.number>100||codes.has(s.code)||numbers.has(s.number))fail('invalid-argument','ข้อมูลนักเรียนไม่ครบหรือซ้ำ');codes.add(s.code);numbers.add(s.number);}
}
async function replaceRoster(db,tx,input,a,stamp){
 const ref=db.doc('attendance_classes/'+input.classId),room=await tx.get(ref);
 if(!room.exists||!room.data().active||room.data().academicYear!==input.academicYear||room.data().term!==input.term||String(room.data().name).replace(/\s/g,'')!==input.label)fail('failed-precondition','ห้องหรือภาคเรียนเปลี่ยนแล้ว กรุณาโหลดใหม่');
 const old=(await tx.get(ref.collection('students'))).docs;
 if(old.length+input.students.length>450)fail('failed-precondition','จำนวนข้อมูลเดิมมากเกินไป กรุณาติดต่อผู้ดูแล');
 const byCode=new Map();for(const s of old){const code=String(s.data().code||'').trim();if(code){if(byCode.has(code))fail('failed-precondition','รหัสนักเรียนในข้อมูลเดิมซ้ำ กรุณาแก้ไขก่อนนำเข้า');byCode.set(code,s);}}
 const kept=new Set(),before=old.map(s=>({id:s.id,...s.data()})),after=[];
 for(const s of input.students){const previous=byCode.get(s.code),target=previous?.ref||ref.collection('students').doc();kept.add(target.id);const value={...previous?.data(),...s,name:s.name.trim(),active:true,updatedAt:stamp,updatedBy:a.uid};tx.set(target,value);after.push({id:target.id,...s});}
 for(const s of old)if(!kept.has(s.id))tx.update(s.ref,{active:false,updatedAt:stamp,updatedBy:a.uid});
 tx.update(ref,{studentCount:after.length,updatedAt:stamp,updatedBy:a.uid});
 tx.create(db.collection('attendance_admin_audit').doc(),{method:'replaceRoster',path:ref.path,actorUid:a.uid,actorName:a.name,before,after,createdAt:stamp});
 return {ok:true,count:after.length};
}
module.exports={validateRoster,replaceRoster};
