import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoHome,lessonHTML} from '../js/home-data.js';
test('home totals and visible groups agree for own teacher, school scope and simultaneous rooms',()=>{
 const rows=[1,2,3].map(n=>({id:'a'+n,teacherUid:'u',kind:'subject',period:1,weekday:2,classId:'c'+n,className:'ม.1/'+n,subject:'ไทย',from:'2026-01-01',to:'2026-12-31'}));
 rows.push({...rows[0],id:'other',teacherUid:'other'});
 const own=demoHome(rows,{uid:'u',role:'teacher'},'2026-10-27');assert.equal(own.counts.subject,1);assert.equal(own.lessons[0].cells.length,3);
 assert.equal(demoHome(rows,{uid:'u',role:'admin'},'2026-10-27').counts.subject,2);
});
test('lesson cards expose all rooms, escape data and never link an unavailable assignment to another lesson',()=>{
 const html=lessonHTML({period:1,teacherName:'<ครู>',kind:'substitute',time:'08:30–09:20',cells:[{className:'ม.1/1',subject:'<ไทย>',assignmentId:'job'},{className:'ม.1/2',subject:'<ไทย>',assignmentId:''},{className:'ม.1/3',subject:'<ไทย>',assignmentId:'third'}]},{school:true,isDemo:false,date:'2026-10-27',url:p=>p+'.html'});
 assert.ok(html.includes('ม.1/1')&&html.includes('ม.1/2')&&html.includes('ม.1/3'));
 assert.ok(html.includes('&lt;ครู&gt;')&&html.includes('&lt;ไทย&gt;'));
 assert.equal((html.match(/href=/g)||[]).length,2);assert.ok(html.includes('assignment=third&date=2026-10-27'));assert.ok(html.includes('ยังไม่เปิดเช็คชื่อ'));
});
