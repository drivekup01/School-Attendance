'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {service,managerId}=require('../behavior');
const now=new Date('2026-10-26T04:00:00Z'),T={fromDate:d=>({toDate:()=>d,toMillis:()=>d.getTime()})};
const req=(uid,data,email=uid+'@kbws.ac.th')=>({auth:{uid,token:{email,email_verified:true,name:uid,firebase:{sign_in_provider:'google.com'}}},data});
function memory(){
 let seq=0;const docs=new Map([
 ['school_users/t1',{name:'Teacher One',active:true,attendanceRole:'teacher'}],['school_users/t2',{name:'Teacher Two',active:true,attendanceRole:'teacher'}],
 ['attendance_behavior_managers/'+managerId('manager@kbws.ac.th'),{name:'Manager',email:'manager@kbws.ac.th',active:true}],
 ['attendance_classes/c1',{name:'ม.1/1',active:true,academicYear:2569,term:1}],['attendance_classes/c2',{name:'ม.1/2',active:true,academicYear:2569,term:1}],
 ['attendance_classes/c1/students/s1',{number:1,name:'Synthetic One',code:'001'}],['attendance_classes/c1/students/s2',{number:2,name:'Synthetic Two',code:'002'}],
 ...['t1','t2'].map(t=>['attendance_access/'+t+'/classes/c1',{active:true,canRead:true,canBehavior:true}])]);
 const snap=path=>({id:path.split('/').pop(),exists:docs.has(path),data:()=>docs.get(path)});
 const ref=path=>({path,id:path.split('/').pop(),get:async()=>snap(path),collection:n=>collection(path+'/'+n)});
 function collection(path,filter=()=>true){return {doc:(id='auto'+(++seq))=>ref(path+'/'+id),where:(key,op,v)=>collection(path,d=>filter(d)&&d[key]===v),get:async()=>({docs:[...docs.keys()].filter(k=>k.startsWith(path+'/')&&k.split('/').length===path.split('/').length+1&&filter(docs.get(k))).map(snap)})};}
 const db={doc:ref,collection,getAll:async(...refs)=>refs.map(r=>snap(r.path)),runTransaction:async fn=>{const writes=[];const result=await fn({get:async r=>snap(r.path),create:(r,data)=>{if(docs.has(r.path))throw Error('exists');writes.push([r.path,data]);}});writes.forEach(([p,d])=>docs.set(p,d));return result;}};
 return {db,docs};
}
const add=(changes={})=>({method:'add',classId:'c1',studentIds:['s1'],delta:-5,category:'dress',reason:'Synthetic test',date:'2026-10-26',requestId:'op1',...changes});
test('anonymous, unverified and unapproved accounts are denied',async()=>{
 const {db}=memory();for(const request of [{data:{method:'classes'}},req('unknown',{method:'classes'}),{...req('manager',{method:'classes'}),auth:{uid:'manager',token:{email:'manager@kbws.ac.th',email_verified:false}}}])await assert.rejects(service(db,T,request,now),e=>['unauthenticated','permission-denied'].includes(e.code));
});
test('email-bound manager sees active rooms and can write groups without becoming a school admin',async()=>{
 const {db,docs}=memory();const setup=await service(db,T,req('manager',{method:'classes'}),now);assert.equal(setup.canBulk,true);assert.equal(setup.classes.length,2);assert.equal(docs.has('school_users/manager'),false);
 const result=await service(db,T,req('manager',add({studentIds:['s1','s2']})),now);assert.equal(result.count,2);
 const room=await service(db,T,req('t1',{method:'room',classId:'c1'}),now);assert.deepEqual(room.students.map(s=>s.score),[95,95]);assert.equal(room.events[0].author,'Manager');
});
test('ordinary teachers are scoped and single-only; scores combine every author',async()=>{
 const {db}=memory();assert.equal((await service(db,T,req('t1',{method:'classes'}),now)).canBulk,false);
 await assert.rejects(service(db,T,req('t1',add({studentIds:['s1','s2']})),now),{code:'permission-denied'});
 await assert.rejects(service(db,T,req('t1',{method:'room',classId:'c2'}),now),{code:'permission-denied'});
 await service(db,T,req('t1',add()),now);await service(db,T,req('t2',add({delta:-3})),now);
 const room=await service(db,T,req('t1',{method:'room',classId:'c1'}),now);assert.equal(room.students[0].score,92);assert.equal(room.students[1].score,100);assert.equal(room.events.length,2);
});
test('retries do not duplicate scores and reuse with changed payload fails',async()=>{
 const {db}=memory();await service(db,T,req('t1',add()),now);const result=await service(db,T,req('t1',add()),now);assert.equal(result.replayed,true);
 await assert.rejects(service(db,T,req('t1',add({delta:-10})),now),{code:'already-exists'});
 assert.equal((await service(db,T,req('t1',{method:'room',classId:'c1'}),now)).students[0].score,95);
});
test('invalid or inactive students make the whole group fail without partial writes',async()=>{
 const {db,docs}=memory();await assert.rejects(service(db,T,req('manager',add({studentIds:['s1','missing']})),now),{code:'invalid-argument'});assert.equal([...docs.keys()].some(k=>k.startsWith('attendance_behavior/')),false);
 docs.set('attendance_classes/c1/students/s2',{name:'Inactive',active:false});await assert.rejects(service(db,T,req('manager',add({studentIds:['s1','s2']})),now),{code:'invalid-argument'});
});
test('revoked permission and disabled manager are denied',async()=>{
 const {db,docs}=memory();docs.set('attendance_access/t1/classes/c1',{active:true,canRead:true,canBehavior:false});await assert.rejects(service(db,T,req('t1',add()),now),{code:'permission-denied'});
 docs.set('school_users/manager',{active:false});await assert.rejects(service(db,T,req('manager',{method:'classes'}),now),{code:'permission-denied'});
});
test('rejects invalid dates, values, duplicate targets and spoofed author fields',async()=>{
 const {db}=memory();for(const change of [{date:'2026-02-30'},{date:'2026-10-27'},{delta:0},{delta:101},{delta:1.5},{reason:' '},{studentIds:['s1','s1']},{teacherUid:'manager'},{studentIds:Array.from({length:101},(_,i)=>'s'+i)}])await assert.rejects(service(db,T,req('t1',add(change)),now),{code:'invalid-argument'});
});

test('all accounts must use requests for positive scores; invalid categories cannot be saved',async()=>{
 const {db,docs}=memory();
 for(const uid of ['t1','manager'])await assert.rejects(service(db,T,req(uid,add({delta:5})),now),{code:'permission-denied'});
 for(const category of [undefined,'unknown','unspecified',{},5])await assert.rejects(service(db,T,req('t1',add({category})),now),{code:'invalid-argument'});
 assert.equal([...docs.keys()].filter(p=>p.startsWith('attendance_behavior/')).length,0);
});
test('deduction category is persisted and retry cannot silently change categories; legacy records remain readable',async()=>{
 const {db,docs}=memory();await service(db,T,req('t1',add({category:'substances'})),now);
 await assert.rejects(service(db,T,req('t1',add({category:'theft'})),now),{code:'already-exists'});
 docs.set('attendance_behavior/legacy',{classId:'c1',studentId:'s2',delta:-7,reason:'Legacy',day:T.fromDate(now)});
 const room=await service(db,T,req('t1',{method:'room',classId:'c1'}),now);
 assert.equal(room.events.find(e=>e.reason==='Synthetic test').category,'substances');
 assert.equal(room.events.find(e=>e.id==='legacy').category,'unspecified');
});
