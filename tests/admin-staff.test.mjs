import {test} from 'node:test';import assert from 'node:assert/strict';import {mergeStaff} from '../js/admin-staff.js';
test('unique teacher names from timetable and accounts appear once despite prefix and spacing differences',()=>{
 const rows=mergeStaff([{id:'t1',prefix:'นางสาว',first:'สุลีลา',last:'อิ่มรัง'}],[{id:'u1',name:'นางสาวสุลีลา   อิ่มรัง',teacherId:''}]);assert.equal(rows.length,1);assert.equal(rows[0].id,'t1');assert.equal(rows[0].account.id,'u1');
});
test('ambiguous names and conflicting teacher IDs are never merged by name',()=>{
 const source=[{id:'t1',prefix:'นาย',first:'สมชาย',last:'ตัวอย่าง'}];assert.equal(mergeStaff(source,[{id:'u1',name:'สมชาย ตัวอย่าง'},{id:'u2',name:'สมชาย ตัวอย่าง'}]).length,3);
 assert.equal(mergeStaff(source,[{id:'u1',name:'สมชาย ตัวอย่าง',teacherId:'other'}]).length,2);
});
test('explicit ID links take priority, preserve timetable data, and do not mutate the account',()=>{
 const account={id:'u1',name:'ชื่อบัญชีใหม่',teacherId:'t1'},rows=mergeStaff([{id:'t1',first:'ชื่อเดิม',last:'ตัวอย่าง'}],[account]);assert.equal(rows.length,1);assert.equal(rows[0].account.id,'u1');assert.equal(account.teacherId,'t1');
});
