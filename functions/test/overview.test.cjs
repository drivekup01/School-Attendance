const {test}=require('node:test'),assert=require('node:assert/strict');
const {build,service,currentClasses,dayAt}=require('../overview');
const stamp=n=>({toMillis:()=>n});
test('morning totals deduplicate teachers, use latest result, ignore lessons and unknown students',()=>{
 const classes=[{id:'room',name:'ม.1/1'}],rosters=new Map([['room',[{id:'s1',number:1,code:'00001',name:'One'},{id:'s2',number:2,code:'00002',name:'Two'},{id:'s3',number:3,code:'00003',name:'Three'},{id:'old',active:false}]]]);
 const assignments=[{id:'a',kind:'morning',classId:'room'},{id:'b',kind:'morning',classId:'room'},{id:'lesson',kind:'subject',classId:'room'}];
 const marks=[{assignmentId:'a',classId:'room',studentId:'s1',status:'present',updatedAt:stamp(1)},{assignmentId:'b',classId:'room',studentId:'s1',status:'late',updatedAt:stamp(2)},{assignmentId:'a',classId:'room',studentId:'s2',status:'leave',updatedAt:stamp(3)},{assignmentId:'lesson',classId:'room',studentId:'s3',status:'absent',updatedAt:stamp(8)},{assignmentId:'a',classId:'room',studentId:'unknown',status:'present',updatedAt:stamp(10)}];
 const r=build({date:'2026-10-26',classes,rosters,assignments,marks});
 assert.deepEqual(r.totals,{present:0,late:1,absent:0,leave:1,pending:1,total:3});assert.equal(r.rooms[0].students[0].status,'late');assert.equal(r.updatedAt,new Date(3).toISOString());
});
test('unmarked students stay pending and Bangkok date crosses UTC midnight correctly',()=>{
 assert.equal(dayAt(new Date('2026-10-25T18:00:00Z')),'2026-10-26');
 const r=build({date:'2026-10-26',classes:[{id:'c',name:'ม.1/1'}],assignments:[],marks:[],rosters:new Map([['c',[{id:'s',number:1}]]])});assert.equal(r.totals.pending,1);assert.equal(r.totals.absent,0);assert.equal(r.updatedAt,null);
});
test('only the latest active year/term roster per room contributes to school totals',()=>{
 const rows=[{id:'old',name:'ม.1/1',academicYear:2568,term:2,active:true},{id:'now',name:'ม.1/1',academicYear:2569,term:1,active:true},{id:'future',name:'ม.1/1',academicYear:2570,term:1,active:true},{id:'off',name:'ม.2/1',academicYear:2569,term:1,active:false}];assert.deepEqual(currentClasses(rows,2569).map(x=>x.id),['now']);
});

function fakeDB(){
 const rows={attendance_classes:[{id:'room',active:true,name:'ม.1/1',academicYear:2569,term:1}],attendance_assignments:[], 'attendance_classes/room/students':[{id:'s1',number:1,code:'001',name:'Example',active:true,privateNote:'not public'}]};
 const ref=path=>({where:()=>ref(path),doc:id=>ref(path+'/'+id),collection:name=>ref(path+'/'+name),get:async()=>({docs:(rows[path]||[]).map(({id,...data})=>({id,data:()=>data}))})});
 return {collection:ref};
}
const timestamp={fromDate:d=>({toMillis:()=>d.getTime()})},now=new Date('2026-10-26T01:00:00Z');
test('anonymous visitors can read today summary and filtered details without profile access',async()=>{
 const summary=await service(fakeDB(),timestamp,{data:{method:'summary'}},now);
 assert.equal(summary.date,'2026-10-26');assert.equal(summary.totals.total,1);assert.equal(summary.rooms[0].students,undefined);
 const details=await service(fakeDB(),timestamp,{data:{method:'details',classId:'room',status:'pending'}},now);
 assert.deepEqual(details.students,[{id:'s1',number:1,code:'001',name:'Example',status:'pending'}]);
 assert.deepEqual((await service(fakeDB(),timestamp,{data:{method:'details',classId:'room',status:'absent'}},now)).students,[]);
});
test('public overview rejects writes, arbitrary dates, invalid filters and unknown rooms',async()=>{
 for(const data of [{method:'save'},{method:'summary',date:'2026-10-25'},{method:'details',classId:'../secret',status:'all'},{method:'details',classId:'room',status:'invalid'}])await assert.rejects(service(fakeDB(),timestamp,{data},now),{code:'invalid-argument'});
 await assert.rejects(service(fakeDB(),timestamp,{data:{method:'details',classId:'missing',status:'all'}},now),{code:'not-found'});
});
