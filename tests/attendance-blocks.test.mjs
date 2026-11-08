import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/attendance-blocks.js';
const {project,groups}=globalThis.AttendanceBlocks;
const lessons=[{key:'p1',classId:'r1',date:'2026-11-05',subject:'Math',period:1,start:'08:30',end:'09:20'},{key:'p2',classId:'r1',date:'2026-11-05',subject:'Math',period:2,start:'09:20',end:'10:10'}];
test('latest recheck applies to both consecutive periods and leaves raw history untouched',()=>{const marks={p1:{status:'absent',updatedAt:'2026-11-05T01:30:00Z'},p2:{status:'present',updatedAt:'2026-11-05T02:20:00Z'}};const result=project(lessons,l=>marks[l.key]);assert.equal(result.get('p1').status,'present');assert.equal(result.get('p2').status,'present');assert.equal(result.get('p1').sourcePeriod,2);assert.equal(marks.p1.status,'absent');marks.p1={status:'leave',updatedAt:'2026-11-05T03:00:00Z'};assert.equal(project(lessons,l=>marks[l.key]).get('p2').status,'leave');});
test('never crosses room, subject, day, a skipped period or a timed break',()=>{for(const change of [{classId:'r2'},{subject:'Science'},{date:'2026-11-06'},{period:3},{start:'09:35'}])assert.equal(groups([lessons[0],{...lessons[1],...change}]).length,2);});
test('one recorded check covers the block; completely unchecked block remains pending',()=>{assert.equal(project(lessons,l=>l.key==='p2'?{status:'late',time:50}:null).get('p1').status,'late');assert.equal(project(lessons,()=>null).size,0);});
test('equal timestamps with conflicting marks require review rather than silently choosing a clear result',()=>{assert.equal(project(lessons,l=>({status:l.key==='p1'?'absent':'present',time:0})).get('p1').conflict,true);});
