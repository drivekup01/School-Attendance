import {today,weekday,validateMarks,validateRange} from './core.js';
const key='school-attendance-demo-v1';
// ข้อมูลสมมติเท่านั้น โหมดจริงจะไม่อ่านข้อมูลจากไฟล์นี้
export const demoUser={uid:'demo-teacher',name:'ครูตัวอย่าง',email:'demo@example.invalid',active:true};
const day=today();
const assignments=[
 {id:'demo-morning',teacherUid:demoUser.uid,kind:'morning',classId:'demo-m1-1',className:'ม.1/1',subject:'เข้าแถวเช้า',period:0,weekday:0,from:'2020-01-01',to:'2099-12-31',time:'07:50–08:10'},
 {id:'demo-subject',teacherUid:demoUser.uid,kind:'subject',classId:'demo-m1-1',className:'ม.1/1',subject:'คณิตศาสตร์',period:1,weekday:weekday(day),from:'2020-01-01',to:'2099-12-31',time:'08:30–09:20'},
 {id:'demo-substitute',teacherUid:demoUser.uid,kind:'substitute',classId:'demo-m2-2',className:'ม.2/2',subject:'วิทยาศาสตร์ (สอนแทน)',period:3,weekday:weekday(day),date:day,from:day,to:day,time:'10:20–11:10'}
];
const names=['เด็กชายต้นกล้า ตัวอย่าง','เด็กหญิงใบหม่อน ตัวอย่าง','เด็กชายภูผา ตัวอย่าง','เด็กหญิงน้ำใส ตัวอย่าง','เด็กชายตะวัน ตัวอย่าง','เด็กหญิงสายรุ้ง ตัวอย่าง','เด็กชายธารา ตัวอย่าง','เด็กหญิงข้าวหอม ตัวอย่าง'];
const roster=names.map((name,i)=>({id:'demo-'+(i+1),code:'D'+String(i+1).padStart(4,'0'),number:i+1,name}));
let state;
try {state=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
state ||= {sessions:{},behavior:[],history:[]};
function persist(){sessionStorage.setItem(key,JSON.stringify(state));}
export const demo={
 async profile(){return demoUser;}, async assignments(){return structuredClone(assignments);},
 async students(classId){return structuredClone(roster.map(s=>({...s,id:classId+'-'+s.id})));},
 async session(a,date){return structuredClone(state.sessions[a.id+'_'+date]||{marks:{},revision:0});},
 async save(a,date,students,marks,revision){
   validateMarks(students,marks);const id=a.id+'_'+date,old=state.sessions[id];
   if((old?.revision||0)!==revision)throw Error('ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่ก่อนบันทึก');
   const value={assignmentId:a.id,date,classId:a.classId,className:a.className,subject:a.subject,kind:a.kind,period:a.period,marks:structuredClone(marks),students:structuredClone(students),revision:revision+1,updatedAt:new Date().toISOString()};
   state.sessions[id]=value;state.history.push({id,previous:old||null,next:structuredClone(value),teacherUid:demoUser.uid});persist();return structuredClone(value);
 },
 async behavior(classId){return structuredClone(state.behavior.filter(x=>x.classId===classId));},
 async addBehavior(item){
   if(!Number.isInteger(item.delta)||item.delta===0||Math.abs(item.delta)>100)throw Error('ระบุคะแนนจำนวนเต็ม 1–100 คะแนน');
   if(!item.reason?.trim()||item.reason.length>300)throw Error('ระบุเหตุผลไม่เกิน 300 ตัวอักษร');
   const saved={...item,id:crypto.randomUUID(),teacherUid:demoUser.uid,createdAt:new Date().toISOString()};state.behavior.unshift(saved);persist();return saved;
 },
 async report(from,to,kind){validateRange(from,to);return structuredClone(kind==='behavior'?state.behavior.filter(x=>x.date>=from&&x.date<=to):Object.values(state.sessions).filter(x=>x.date>=from&&x.date<=to&&(kind==='all'||x.kind===kind||(kind==='subject'&&x.kind==='substitute'))));},
 reset(){state={sessions:{},behavior:[],history:[]};sessionStorage.removeItem(key);}
};
