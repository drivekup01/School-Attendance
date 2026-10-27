'use strict';
const {createHash}=require('node:crypto');
const norm=v=>String(v||'').replace(/\s+/g,'');
async function timetable(db){
 const pointer=await db.doc('timetable_public/current').get();if(!pointer.exists)return null;
 const ref=db.doc('timetable_public_versions/'+pointer.data().version),meta=await ref.get();if(!meta.exists||meta.data().status!=='ready')throw Object.assign(Error('ตารางสอนต้นทางยังไม่พร้อม'),{code:'failed-precondition'});
 const parts=await ref.collection('parts').get(),chunks=[];for(const part of parts.docs)chunks[Number(part.id)]=part.data().json;
 const content=chunks.join('');if(chunks.filter(x=>typeof x==='string').length!==meta.data().partCount||createHash('sha256').update(content).digest('hex')!==meta.data().hash)throw Object.assign(Error('ตารางสอนต้นทางไม่ครบ กรุณาโหลดใหม่'),{code:'failed-precondition'});
 return JSON.parse(content);
}
function selectClasses(classes,data){
 if(!data)return null;
 return data.rooms.map(r=>{const matches=classes.filter(c=>c.active&&c.academicYear===Number(data.school.year)&&c.term===Number(data.school.semester)&&norm(c.name)===norm(r.label));if(matches.length!==1)throw Object.assign(Error('ข้อมูลห้อง '+r.label+' ในภาคเรียนปัจจุบันไม่ครบหรือซ้ำ'),{code:'failed-precondition'});return {...matches[0],name:r.label};});
}
module.exports={timetable,selectClasses};
