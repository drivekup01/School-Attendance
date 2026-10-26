const {test}=require('node:test'),assert=require('node:assert/strict');
const {memory}=require('./memory.cjs'),{service}=require('../admin'),{service:behavior}=require('../behavior');
const now=new Date('2026-10-26T04:00:00Z'),T={fromDate:d=>({toDate:()=>d,toMillis:()=>d.getTime()})};
const req=(uid,data)=>({auth:{uid,token:{email:uid+'@kbws.ac.th',email_verified:true,firebase:{sign_in_provider:'google.com'}}},data});
function fixture(){const f=memory();f.docs.set('school_users/admin',{active:true,name:'Admin',attendanceRole:'admin'});return f;}
test('teacher and behavior-only manager cannot use administrative data mutations',async()=>{const {db}=fixture();for(const uid of ['t1','manager'])await assert.rejects(service(db,T,req(uid,{method:'list'}),now),{code:'permission-denied'});});
test('admin manages classroom and student records with audit but cannot address arbitrary collections',async()=>{
 const {db,docs}=fixture();await service(db,T,req('admin',{method:'saveClass',item:{id:'new',name:'Synthetic Room',academicYear:2569,term:1,active:true}}),now);
 await service(db,T,req('admin',{method:'saveStudent',classId:'new',item:{id:'s1',name:'Synthetic Student',number:1,code:'001',active:true}}),now);
 const list=await service(db,T,req('admin',{method:'list'}),now);assert.equal(list.classes.find(c=>c.id==='new').studentCount,1);assert.ok(!JSON.stringify(list.teachers).includes('@'));assert.equal([...docs.keys()].filter(k=>k.startsWith('attendance_admin_audit/')).length,2);
 await assert.rejects(service(db,T,req('admin',{method:'saveClass',item:{id:'budget_users/hijack',name:'Bad',academicYear:2569,term:1,active:true}}),now),{code:'invalid-argument'});
});
test('admin can reduce scores for a whole room without a per-room ACL, but all positive scores require requests',async()=>{
 const {db}=fixture(),data={method:'add',classId:'c1',studentIds:['s1','s2'],delta:-5,category:'dress',reason:'Synthetic',date:'2026-10-26',requestId:'admin-deduction'};
 assert.equal((await behavior(db,T,req('admin',data),now)).count,2);await assert.rejects(behavior(db,T,req('admin',{...data,delta:5}),now),{code:'permission-denied'});
});
test('disabled central admin does not recover access from a legacy admin record',async()=>{const {db,docs}=fixture();docs.set('school_users/admin',{active:false,attendanceRole:'admin'});docs.set('attendance_teachers/admin',{active:true,role:'admin',email:'admin@kbws.ac.th'});await assert.rejects(service(db,T,req('admin',{method:'list'}),now),{code:'permission-denied'});});
