'use strict';
const {timetable,selectClasses}=require('./class-catalog');
const STATUSES=['present','late','absent','leave'];
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const dayAt=now=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
const epoch=t=>t?.toMillis?.()??0;
const zero=()=>({present:0,late:0,absent:0,leave:0,pending:0});
function currentClasses(classes,year){
 const selected=new Map();
 for(const c of classes){if(!c.active||c.academicYear>year)continue;const key=c.name,prior=selected.get(key);if(!prior||c.academicYear*10+c.term>prior.academicYear*10+prior.term)selected.set(key,c);}
 return [...selected.values()].sort((a,b)=>a.name.localeCompare(b.name,'th',{numeric:true}));
}
function build({date,classes,assignments,rosters,marks}){
 const map=new Map(classes.map(c=>[c.id,c])),morning=new Map(assignments.filter(a=>a.kind==='morning'&&map.has(a.classId)).map(a=>[a.id,a]));
 const latest=new Map();let updated=0;
 for(const mark of marks){const a=morning.get(mark.assignmentId);if(!a||!STATUSES.includes(mark.status)||mark.classId!==a.classId)continue;
  const key=a.classId+'/'+mark.studentId,old=latest.get(key),ts=epoch(mark.updatedAt);
  if(!old||ts>epoch(old.updatedAt)||(ts===epoch(old.updatedAt)&&((mark.canonicalMorning&&!old.canonicalMorning)||(!!mark.canonicalMorning===!!old.canonicalMorning&&String(mark.assignmentId)>String(old.assignmentId)))))latest.set(key,mark);
 }
 const totals={...zero(),total:0},rooms=classes.map(c=>{
  const counts={...zero(),total:0},students=[];
  for(const s of rosters.get(c.id)||[]){if(s.active===false)continue;const m=latest.get(c.id+'/'+s.id),status=m?.status||'pending';counts[status]++;counts.total++;if(m)updated=Math.max(updated,epoch(m.updatedAt));students.push({id:s.id,number:s.number,code:s.code,name:s.name,status});}
  for(const k of Object.keys(totals))totals[k]+=counts[k];
  return {id:c.id,name:c.name,counts,students:students.sort((a,b)=>a.number-b.number)};
 });
 return {date,totals,rooms,updatedAt:updated?new Date(updated).toISOString():null};
}
async function service(db,Timestamp,request,now=new Date()){
 // Public, read-only overview limited to today in Bangkok. Writes still use Firestore rules.
 const input=request.data||{},method=input.method||'summary';
 if(!['summary','details'].includes(method)||Object.keys(input).some(k=>!['method','classId','status'].includes(k)))fail('invalid-argument','ไม่รองรับคำขอนี้');
 if(method==='details'&&(typeof input.classId!=='string'||!input.classId.match(/^[A-Za-z0-9_-]{1,100}$/)||!STATUSES.concat('pending','all').includes(input.status)))fail('invalid-argument','เลือกห้องและสถานะให้ถูกต้อง');
 const date=dayAt(now),key=date.replaceAll('-',''),day=Timestamp.fromDate(new Date(date+'T00:00:00+07:00'));
 const [classSnap,assignSnap,native]=await Promise.all([db.collection('attendance_classes').where('active','==',true).get(),db.collection('attendance_assignments').where('kind','==','morning').get(),timetable(db)]);
 const rawClasses=classSnap.docs.map(d=>({id:d.id,...d.data()})),classes=selectClasses(rawClasses,native)||currentClasses(rawClasses,Number(date.slice(0,4))+543);
 const rosters=new Map(await Promise.all(classes.map(async c=>[c.id,(await db.collection('attendance_classes').doc(c.id).collection('students').get()).docs.map(d=>({id:d.id,...d.data()}))])));
 const weekday=new Date(date+'T12:00:00+07:00').getUTCDay(),classIds=new Set(classes.map(c=>c.id));
 const assignments=assignSnap.docs.map(d=>({id:d.id,...d.data()})).filter(a=>classIds.has(a.classId)&&epoch(a.from)<=epoch(day)&&epoch(a.to)>=epoch(day));
 const markGroups=await Promise.all(assignments.map(async a=>(await db.collection('attendance_assignments').doc(a.id).collection('days').doc(key).collection('marks').get()).docs.map(d=>({...d.data(),assignmentId:a.id,studentId:d.id}))));
 const canonical=classes.map(c=>({id:'morning_'+c.id,kind:'morning',classId:c.id}));
 const canonicalMarks=await Promise.all(canonical.map(async a=>(await db.collection('attendance_morning_sessions').doc(a.classId+'_'+key).collection('marks').get()).docs.map(d=>({...d.data(),canonicalMorning:true,assignmentId:a.id,studentId:d.id}))));
 const result=build({date,classes,assignments:[...assignments,...canonical],rosters,marks:[...markGroups.flat(),...canonicalMarks.flat()]});
 if(method==='summary')return {...result,rooms:result.rooms.map(({students,...room})=>room)};
 const room=result.rooms.find(c=>c.id===input.classId);if(!room)fail('not-found','ไม่พบห้องเรียน');
 return {date,classId:room.id,className:room.name,status:input.status,students:room.students.filter(s=>input.status==='all'||s.status===input.status),updatedAt:result.updatedAt};
}
module.exports={currentClasses,build,dayAt,service};
