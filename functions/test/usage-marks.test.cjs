const {test}=require('node:test'),assert=require('node:assert/strict');
const {recordMarkHistory}=require('../usage-marks');
test('committed teacher mark history is private, idempotent on trigger retries, and admins are not duplicated',async()=>{
 const records=new Map();let profile={name:'ครูทดสอบ',email:'teacher@example.invalid',schoolRole:'teacher'};
 const db={doc:path=>({get:async()=>({data:()=>profile}),create:async value=>{if(records.has(path))throw Object.assign(Error('exists'),{code:6});records.set(path,value);}})};
 const event={data:{ref:{path:'attendance_assignments/a/days/20261107/marks/s/history/1'},data:()=>({teacherUid:'teacher',updatedAt:'server timestamp',note:'PRIVATE NOTE',studentId:'private-student'})}};
 await recordMarkHistory(db,event);await recordMarkHistory(db,event);assert.equal(records.size,1);assert.equal([...records.values()][0].uid,'teacher');assert(!JSON.stringify([...records]).includes('PRIVATE NOTE'));assert(!JSON.stringify([...records]).includes('private-student'));
 profile={schoolRole:'admin'};await recordMarkHistory(db,{data:{...event.data,ref:{path:'another'}}});assert.equal(records.size,1);
});
test('temporary sink errors propagate for managed delivery retry',async()=>{const db={doc:()=>({get:async()=>({data:()=>({name:'ครู'})}),create:async()=>{throw Error('temporary');}})};await assert.rejects(recordMarkHistory(db,{data:{ref:{path:'history'},data:()=>({teacherUid:'t',updatedAt:'stamp'})}}),/temporary/);});
