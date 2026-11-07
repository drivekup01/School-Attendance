const {test}=require('node:test'),assert=require('node:assert/strict');
const {memory}=require('./memory.cjs'),{service:requests}=require('../behavior-requests'),{service:behavior}=require('../behavior'),{grants,capabilities}=require('../school-roles');
const T={fromDate:d=>({toDate:()=>d,toMillis:()=>d.getTime()})},now=new Date('2026-10-27T04:00:00Z');
const req=(uid,data)=>({auth:{uid,token:{email:uid+'@kbws.ac.th',email_verified:true,firebase:{sign_in_provider:'google.com'}}},data});
const form={requestId:'role-request',requestDate:'2026-10-27',activity:'Synthetic activity',location:'Synthetic room',startDate:'2026-10-26',endDate:'2026-10-26',points:5,teacherPosition:'Teacher',evidenceTypes:[],otherEvidence:'',students:[{classId:'c1',studentId:'s1'}],photos:[]};
const seed=(docs,uid,role)=>docs.set('school_users/'+uid,{name:uid,active:true,...grants(role)});
test('all eight roles read every class; only admin/support directly change scores',async()=>{
 for(const role of ['admin','director','deputy','teacher','timetable','budget','procurement','student_support']){
  const {db,docs}=memory();seed(docs,'u',role);const setup=await behavior(db,T,req('u',{method:'classes'}),now);assert.equal(setup.classes.length,2);
  const room=await behavior(db,T,req('u',{method:'room',classId:'c1'}),now);assert.equal(room.canWrite,!['director','deputy'].includes(role));
  const call=()=>behavior(db,T,req('u',{method:'add',classId:'c1',studentIds:['s1'],delta:7,category:'other',reason:'Synthetic individual award',date:'2026-10-27',requestId:'award-'+role}),now);
  if(['admin','student_support'].includes(role)){await call();await call();assert.equal([...docs.keys()].filter(p=>p.startsWith('attendance_behavior/')).length,1);}else await assert.rejects(call(),{code:'permission-denied'});
 }
});
test('director can approve but cannot create, edit or delete, even their own former requests',async()=>{
 const {db,docs}=memory();seed(docs,'t1','teacher');const saved=await requests(db,T,req('t1',{method:'submit',form}),now);seed(docs,'director','director');
 assert.equal((await requests(db,T,req('director',{method:'list'}),now)).requests.length,1);
 const d=await requests(db,T,req('director',{method:'detail',requestId:saved.id}),now);assert.equal(d.canEdit,false);assert.equal(d.canDelete,false);
 await assert.rejects(requests(db,T,req('director',{method:'submit',form}),now),{code:'permission-denied'});
 await assert.rejects(requests(db,T,req('director',{method:'update',requestId:saved.id,revision:0,form}),now),{code:'permission-denied'});
 await assert.rejects(requests(db,T,req('director',{method:'delete',requestId:saved.id,revision:0}),now),{code:'permission-denied'});
 assert.equal((await requests(db,T,req('director',{method:'approve',requestId:saved.id,note:''}),now)).status,'awarded');
 seed(docs,'t1','director');const own=await requests(db,T,req('t1',{method:'detail',requestId:saved.id}),now);assert.equal(own.canEdit,false);
});
test('support retains ordinary ownership on requests; only admin edits or approves another teacher request',async()=>{
 const {db,docs}=memory();seed(docs,'t1','teacher');seed(docs,'t2','teacher');seed(docs,'support','student_support');seed(docs,'admin','admin');const saved=await requests(db,T,req('t1',{method:'submit',form}),now);
 assert.equal((await requests(db,T,req('support',{method:'detail',requestId:saved.id}),now)).canEdit,false);
 await assert.rejects(requests(db,T,req('support',{method:'update',requestId:saved.id,revision:0,form}),now),{code:'permission-denied'});
 await assert.rejects(requests(db,T,req('support',{method:'approve',requestId:saved.id,note:''}),now),{code:'permission-denied'});
 await requests(db,T,req('admin',{method:'update',requestId:saved.id,revision:0,form}),now);
 await requests(db,T,req('admin',{method:'approve',requestId:saved.id,note:''}),now);
 await requests(db,T,req('t1',{method:'update',requestId:saved.id,revision:2,form}),now);
 assert.equal((await requests(db,T,req('t1',{method:'detail',requestId:saved.id}),now)).status,'pending');
});

test('unified director ignores legacy admin fields and grants; unknown/disabled roles deny',()=>{
 assert.equal(capabilities({active:true,...grants('director'),attendanceRole:'admin',identityAdmin:true}).admin,false);
 assert.equal(capabilities({active:false,...grants('admin')}).active,false);
 assert.equal(capabilities({active:true,schoolRole:'unknown',identityAdmin:true}).active,false);
 assert.throws(()=>grants('unknown'));
});

test('staff deduct one student only; support can award or deduct groups with idempotency',async()=>{
 for(const role of ['teacher','budget','timetable','procurement','student_support','admin']){const {db,docs}=memory();seed(docs,'u',role);const add={method:'add',classId:'c1',studentIds:['s1'],delta:-5,category:'other',reason:'Individual deduction',date:'2026-10-27',requestId:'single'};await behavior(db,T,req('u',add),now);const group={...add,studentIds:['s1','s2'],requestId:'group'};if(['admin','student_support'].includes(role)){await behavior(db,T,req('u',group),now);const award={...group,delta:5,requestId:'award'};await behavior(db,T,req('u',award),now);await behavior(db,T,req('u',award),now);assert.equal([...docs.keys()].filter(p=>p.startsWith('attendance_behavior/')).length,5);}else{await assert.rejects(behavior(db,T,req('u',group),now),{code:'permission-denied'});await assert.rejects(behavior(db,T,req('u',{...add,delta:5,requestId:'positive'}),now),{code:'permission-denied'});}}
});
