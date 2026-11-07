// A student's roster ID is scoped to a classroom, not globally unique.
export class BehaviorGroupSelection {
 constructor(){this.items=new Map();}
 key(classId,studentId){return JSON.stringify([classId,studentId]);}
 has(classId,studentId){return this.items.has(this.key(classId,studentId));}
 set(room,student,checked){const key=this.key(room.id,student.id);if(checked)this.items.set(key,{classId:room.id,className:room.name,studentId:student.id,name:student.name,number:student.number,code:student.code});else this.items.delete(key);}
 remove(classId,studentId){this.items.delete(this.key(classId,studentId));}
 clear(){this.items.clear();}
 values(){return [...this.items.values()];}
 groups(){return groupBehaviorStudents(this.values());}
}
export function groupBehaviorStudents(students){
 const rooms=new Map();
 for(const student of students){if(!rooms.has(student.classId))rooms.set(student.classId,{classId:student.classId,className:student.className,students:[]});const room=rooms.get(student.classId);if(!room.students.some(s=>s.studentId===student.studentId))room.students.push({...student});}
 return [...rooms.values()];
}
export function createBehaviorPlan(students,fields,requestId){
 const batches=[];
 for(const room of groupBehaviorStudents(students))for(let offset=0;offset<room.students.length;offset+=100){
  const entries=room.students.slice(offset,offset+100);
  batches.push({payload:{...fields,method:'add',classId:room.classId,studentIds:entries.map(s=>s.studentId),requestId:requestId()},students:entries,done:false});
 }
 return {batches,total:batches.reduce((n,b)=>n+b.students.length,0)};
}
export async function saveBehaviorPlan(plan,call,onSaved=()=>{}){
 for(const batch of plan.batches){
  if(batch.done)continue;
  const result=await call(batch.payload);
  if(!result?.ok||result.count!==batch.students.length)throw Error('ยังยืนยันผลการบันทึกไม่ได้ กรุณาลองอีกครั้ง');
  batch.done=true;onSaved(batch);
 }
 return plan.total;
}
