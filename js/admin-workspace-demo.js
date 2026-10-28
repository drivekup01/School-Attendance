import {today} from './core.js?v=20261028-exchange1';
const key='attendance-admin-workspace-demo-v1';
let saved;try{saved=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
const state=saved||{teachers:[{id:'demo-teacher',name:'ครูตัวอย่าง คนที่หนึ่ง',teacherId:'t1',active:true},{id:'demo-teacher2',name:'ครูตัวอย่าง คนที่สอง',teacherId:'t2',active:true}],classes:[{id:'demo-m1-1',name:'ม.1/1',academicYear:2569,term:1,active:true,studentCount:2}],assignments:[{id:'demo-morning',teacherUid:'demo-teacher',classId:'demo-m1-1',className:'ม.1/1',kind:'morning',subject:'เข้าแถวเช้า',period:0,weekday:1,from:'2026-01-01',to:'2026-12-31',date:null,time:'07:50–08:10',active:true}],students:{'demo-m1-1':[{id:'s1',name:'นักเรียนตัวอย่าง หนึ่ง',code:'D001',number:1,active:true},{id:'s2',name:'นักเรียนตัวอย่าง สอง',code:'D002',number:2,active:true}]},timetable:{teachers:[{id:'t1',prefix:'นาย',first:'ครูตัวอย่าง',last:'คนที่หนึ่ง'},{id:'t2',prefix:'นางสาว',first:'ครูตัวอย่าง',last:'คนที่สอง'}],rooms:[{id:'r1',label:'ม.1/1',homeroom:'t1'}],slots:[{id:'1',label:'1',start:'08:30',end:'09:20'}],days:['จันทร์'],subjects:[{id:'math',name:'คณิตศาสตร์'}],sched:{'r1_1_จันทร์':{teacher:'t1',subject:'math'}}}};
export async function adminCall(input){
 if(input.method==='list')return structuredClone(state);
 if(input.method==='students')return {students:structuredClone(state.students[input.classId]||[])};
 if(input.method==='replaceRoster'){
  const room=state.classes.find(c=>c.id===input.classId);if(!room)throw Error('ไม่พบห้องทดลอง');
  const prior=state.students[input.classId]||[],incoming=new Set(input.students.map(s=>s.code));
  state.students[input.classId]=[...input.students.map(s=>({...s,id:prior.find(p=>p.code===s.code)?.id||crypto.randomUUID(),active:true})),...prior.filter(s=>!incoming.has(s.code)).map(s=>({...s,active:false}))];room.studentCount=input.students.length;
  sessionStorage.setItem(key,JSON.stringify(state));return {ok:true,count:input.students.length};
 }
 const item=input.item;if(input.method==='saveClass'){const index=state.classes.findIndex(c=>c.id===item.id);if(index<0)state.classes.push({...item,studentCount:0});else state.classes[index]={...state.classes[index],...item};}
 if(input.method==='saveStudent'){const list=state.students[input.classId]||=[];const index=list.findIndex(s=>s.id===item.id);if(index<0)list.push(item);else list[index]=item;state.classes.find(c=>c.id===input.classId).studentCount=list.filter(s=>s.active).length;}
 if(input.method==='saveAssignment'){const value={...item,id:item.id||crypto.randomUUID(),className:state.classes.find(c=>c.id===item.classId).name};const index=state.assignments.findIndex(a=>a.id===value.id);if(index<0)state.assignments.push(value);else state.assignments[index]=value;}
 sessionStorage.setItem(key,JSON.stringify(state));return {ok:true};
}
