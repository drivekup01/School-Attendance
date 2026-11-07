import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BehaviorGroupSelection,createBehaviorPlan,saveBehaviorPlan} from '../js/behavior-group.js';
const room=id=>({id,name:'ห้อง '+id}),student=id=>({id,name:'นักเรียน '+id,number:1});
test('multiple rooms retain their selection, including equal roster IDs',()=>{
 const selected=new BehaviorGroupSelection();selected.set(room('a'),student('1'),true);selected.set(room('b'),student('1'),true);selected.set(room('a'),student('1'),true);
 assert.equal(selected.values().length,2);assert.equal(selected.groups().length,2);assert(selected.has('a','1'));
 selected.remove('b','1');assert(selected.has('a','1'));assert(!selected.has('b','1'));selected.clear();assert.equal(selected.values().length,0);
});
test('submission preserves classroom membership and existing 100-student API limit',()=>{
 const entries=Array.from({length:101},(_,i)=>({classId:'a',studentId:String(i)}));entries.push({classId:'b',studentId:'0'});let id=0;
 const plan=createBehaviorPlan(entries,{delta:-5,category:'late',reason:'ทดสอบ',date:'2026-11-07'},()=>String(++id));
 assert.deepEqual(plan.batches.map(b=>[b.payload.classId,b.payload.studentIds.length]),[['a',100],['a',1],['b',1]]);assert.equal(plan.total,102);
 assert.equal(new Set(plan.batches.map(b=>b.payload.requestId)).size,3);assert(plan.batches.every(b=>b.payload.delta===-5));
});
test('partial failure retries only unfinished batches with the same idempotency key',async()=>{
 let id=0;const plan=createBehaviorPlan([{classId:'a',studentId:'1'},{classId:'b',studentId:'1'}],{delta:-5},()=>String(++id));const calls=[],saved=[];let disconnect=true;
 const call=async payload=>{calls.push([payload.classId,payload.requestId]);if(payload.classId==='b'&&disconnect)throw Error('connection lost after request');return {ok:true,count:1};};
 await assert.rejects(saveBehaviorPlan(plan,call,b=>saved.push(b.payload.classId)));disconnect=false;
 assert.equal(await saveBehaviorPlan(plan,call,b=>saved.push(b.payload.classId)),2);assert.deepEqual(calls,[['a','1'],['b','2'],['b','2']]);assert.deepEqual(saved,['a','b']);
});
