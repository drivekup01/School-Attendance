'use strict';
const {createHash}=require('node:crypto');
// Teachers write immutable per-student mark history directly under Firestore
// Rules. Log the committed history, not a browser's claim that saving succeeded.
async function recordMarkHistory(db,event){
 const data=event.data?.data();if(!data?.teacherUid||!data.updatedAt)return;
 const profile=(await db.doc('school_users/'+data.teacherUid).get()).data();
 // Admin saves go through attendanceAdmin and are logged once by its wrapper.
 if(profile?.schoolRole==='admin'||profile?.attendanceRole==='admin')return;
 const legacy=profile?null:(await db.doc('attendance_teachers/'+data.teacherUid).get()).data(),person=profile||legacy;
 if(!person)return;
 const id=createHash('sha256').update(event.data.ref.path).digest('hex');
 try{await db.doc('school_usage_events/mark_'+id).create({uid:data.teacherUid,name:String(person.name||'ครู').slice(0,200),email:String(person.email||'').slice(0,254),role:person.schoolRole||'teacher',kind:'action',source:'server',outcome:'success',module:'attendance',action:'บันทึกหรือแก้ไขการมาเรียนรายคาบ',api:'attendanceHistory',method:'saveMarks',path:'',section:'',createdAt:data.updatedAt});}
 catch(error){if(error.code!==6&&error.code!=='already-exists')throw error;}
}
module.exports={recordMarkHistory};
