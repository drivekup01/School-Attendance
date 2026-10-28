const {test}=require('node:test'),assert=require('node:assert/strict');
const {memory}=require('./memory.cjs'),{service}=require('../admin');
const now=new Date('2026-10-28T04:00:00Z'),T={fromDate:d=>({toDate:()=>d,toMillis:()=>d.getTime()})};
const req=(data,uid='admin')=>({auth:{uid,token:{email:uid+'@kbws.ac.th',email_verified:true,firebase:{sign_in_provider:'google.com'}}},data});
const input=()=>({method:'replaceRoster',classId:'c1',academicYear:2569,term:1,label:'ม.1/1',students:[{code:'001',name:'New Name',number:2},{code:'003',name:'New Student',number:1}]});
function fixture(){const f=memory();f.docs.set('school_users/admin',{active:true,name:'Admin',attendanceRole:'admin'});return f;}
test('replacement keeps matching IDs and history, removes missing from current roster, and repeat imports do not duplicate',async()=>{
 const {db,docs}=fixture();docs.set('attendance_behavior/history',{studentId:'s1',delta:-5});
 await service(db,T,req(input()),now);
 assert.equal(docs.get('attendance_classes/c1/students/s1').name,'New Name');assert.equal(docs.get('attendance_classes/c1/students/s2').active,false);
 assert.equal(docs.get('attendance_classes/c2').active,true);assert.equal(docs.get('attendance_behavior/history').delta,-5);
 await service(db,T,req(input()),now);
 const rows=[...docs.entries()].filter(([p,d])=>p.startsWith('attendance_classes/c1/students/')&&d.active!==false);
 assert.equal(rows.length,2);assert.deepEqual(rows.map(([,s])=>s.code).sort(),['001','003']);
});
test('invalid, duplicate, empty and mismatched term imports leave records unchanged',async()=>{
 for(const patch of [{students:[]},{term:2},{label:'ม.1/2'},{students:[input().students[0],input().students[0]]}]){const {db,docs}=fixture(),before=JSON.stringify([...docs]);await assert.rejects(service(db,T,req({...input(),...patch}),now));assert.equal(JSON.stringify([...docs]),before);}
});
test('teacher cannot replace student roster',async()=>{const {db}=fixture();await assert.rejects(service(db,T,req(input(),'t1'),now),{code:'permission-denied'});});
