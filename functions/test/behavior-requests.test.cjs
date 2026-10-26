const {test}=require('node:test'),assert=require('node:assert/strict');
const {memory}=require('./memory.cjs'),{service,validate}=require('../behavior-requests'),{service:behavior}=require('../behavior');
const now=new Date('2026-10-26T04:00:00Z'),T={fromDate:d=>({toDate:()=>d,toMillis:()=>d.getTime()})};
const req=(uid,data)=>({auth:{uid,token:{email:uid+'@kbws.ac.th',email_verified:true,name:uid,firebase:{sign_in_provider:'google.com'}}},data});
const photo={name:'synthetic.png',mime:'image/png',base64:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='};
const form=changes=>({requestId:'test-request',requestDate:'2026-10-26',activity:'Synthetic school activity',location:'Synthetic location',startDate:'2026-10-25',endDate:'2026-10-26',points:5,teacherPosition:'Teacher',evidenceTypes:['photo'],otherEvidence:'',students:[{classId:'c1',studentId:'s1'},{classId:'c1',studentId:'s2'}],photos:[photo],...changes});
async function submit(db,changes){return service(db,T,req('t1',{method:'submit',form:form(changes)}),now);}
test('submission preserves canonical roster and private evidence and never changes scores',async()=>{
 const {db,docs}=memory(),saved=await submit(db);assert.equal(saved.status,'pending');assert.equal([...docs.keys()].filter(k=>k.startsWith('attendance_behavior/')).length,0);
 const d=await service(db,T,req('t1',{method:'detail',requestId:saved.id}),now);assert.equal(d.teacherName,'Teacher One');assert.equal(d.students[0].name,'Synthetic One');assert.equal(d.photos.length,1);assert.equal(d.photos[0].base64,undefined);
 assert.equal((await service(db,T,req('t1',{method:'photo',requestId:saved.id,photoId:'p0'}),now)).base64,photo.base64);
 await assert.rejects(service(db,T,req('t2',{method:'detail',requestId:saved.id}),now),{code:'permission-denied'});
 await assert.rejects(service(db,T,req('t2',{method:'photo',requestId:saved.id,photoId:'p0'}),now),{code:'permission-denied'});
});
test('teacher cannot approve or award; manager cannot award before approval',async()=>{
 const {db}=memory(),saved=await submit(db);
 for(const method of ['approve','award'])await assert.rejects(service(db,T,req('t1',{method,requestId:saved.id,note:''}),now),e=>['permission-denied','invalid-argument'].includes(e.code));
 await assert.rejects(service(db,T,req('manager',{method:'award',requestId:saved.id}),now),{code:'failed-precondition'});
});
test('approval and score award are separate, group-atomic and cannot be duplicated',async()=>{
 const {db,docs}=memory(),saved=await submit(db);
 await service(db,T,req('manager',{method:'approve',requestId:saved.id,note:'Reviewed synthetic evidence'}),now);
 assert.equal([...docs.keys()].filter(k=>k.startsWith('attendance_behavior/')).length,0);
 const approved=await service(db,T,req('manager',{method:'detail',requestId:saved.id}),now);assert.equal(approved.status,'approved');assert.equal(approved.approvedName,'Manager');assert.equal(approved.approvedAt,now.toISOString());
 await service(db,T,req('manager',{method:'award',requestId:saved.id}),now);
 const replay=await service(db,T,req('manager',{method:'award',requestId:saved.id}),now);assert.equal(replay.replayed,true);
 assert.equal([...docs.keys()].filter(k=>k.startsWith('attendance_behavior/')).length,2);
 const room=await behavior(db,T,req('t1',{method:'room',classId:'c1'}),now);assert.deepEqual(room.students.map(s=>s.score),[105,105]);
 assert.equal((await service(db,T,req('t1',{method:'detail',requestId:saved.id}),now)).status,'awarded');
});
test('submission retry cannot create duplicate requests and rejects changed payload with reused id',async()=>{
 const {db,docs}=memory();const a=await submit(db),b=await submit(db);assert.equal(a.id,b.id);assert.equal(b.replayed,true);assert.equal([...docs.keys()].filter(k=>/^attendance_behavior_requests\/[^/]+$/.test(k)).length,1);
 await assert.rejects(submit(db,{points:10}),{code:'already-exists'});
});
test('manager lists all requests, ordinary teachers only their own',async()=>{
 const {db}=memory();await submit(db);assert.equal((await service(db,T,req('t2',{method:'list'}),now)).requests.length,0);assert.equal((await service(db,T,req('t1',{method:'list'}),now)).requests.length,1);assert.equal((await service(db,T,req('manager',{method:'list'}),now)).requests.length,1);
});
test('invalid roster, unauthorized classes and forged workflow fields are rejected before writing',async()=>{
 const {db}=memory();for(const patch of [{students:[{classId:'c1',studentId:'missing'}]},{students:[{classId:'c2',studentId:'s1'}]},{status:'approved'},{teacherUid:'manager'},{students:[{classId:'c1',studentId:'s1',name:'Spoof'}]}])await assert.rejects(submit(db,patch),e=>['permission-denied','invalid-argument'].includes(e.code));
});
test('disabled students prevent partial awards and revoked manager cannot approve',async()=>{
 const {db,docs}=memory(),saved=await submit(db);await service(db,T,req('manager',{method:'approve',requestId:saved.id,note:''}),now);docs.set('attendance_classes/c1/students/s2',{active:false});await assert.rejects(service(db,T,req('manager',{method:'award',requestId:saved.id}),now),{code:'failed-precondition'});assert.equal([...docs.keys()].filter(k=>k.startsWith('attendance_behavior/')).length,0);assert.equal(docs.get('attendance_behavior_requests/'+saved.id).status,'approved');
 docs.set('school_users/manager',{active:false});await assert.rejects(service(db,T,req('manager',{method:'approve',requestId:saved.id,note:''}),now),{code:'permission-denied'});
});
test('photo/date validation, quotas and request schemas reject malformed input',()=>{
 for(const patch of [{endDate:'2026-10-27'},{startDate:'2026-02-30'},{requestDate:'2026-10-27'},{points:0},{photos:[{...photo,base64:'PHN2Zz48L3N2Zz4='}]},{photos:Array(5).fill(photo)},{photos:[]},{evidenceTypes:['other']},{activity:''}])assert.throws(()=>validate(form(patch),now),{code:'invalid-argument'});
});
test('anonymous visitors and unrelated school accounts cannot access requests',async()=>{
 const {db}=memory();await assert.rejects(service(db,T,{data:{method:'list'}},now),{code:'unauthenticated'});await assert.rejects(service(db,T,req('unknown',{method:'list'}),now),{code:'permission-denied'});
});
test('manager can request and award students from different authorized rooms together',async()=>{
 const {db,docs}=memory();docs.set('attendance_classes/c2/students/s3',{number:1,name:'Synthetic Three',code:'003'});
 const result=await service(db,T,req('manager',{method:'submit',form:form({students:[{classId:'c1',studentId:'s1'},{classId:'c2',studentId:'s3'}]})}),now);
 await service(db,T,req('manager',{method:'approve',requestId:result.id,note:''}),now);await service(db,T,req('manager',{method:'award',requestId:result.id}),now);
 const events=[...docs.entries()].filter(([p])=>p.startsWith('attendance_behavior/')).map(([,d])=>d);assert.deepEqual(events.map(x=>x.classId).sort(),['c1','c2']);assert.ok(events.every(x=>x.delta===5&&x.sourceRequestId===result.id));
});
