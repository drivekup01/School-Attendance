// Canonical consecutive-lesson policy. Identical copies are used by server reports
// and the student portal. Saved marks/history are never rewritten by this projection.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AttendanceBlocks=factory();})(globalThis,function(){
 'use strict';
 const valid=mark=>mark&&['present','late','leave','absent'].includes(mark.status);
 const stamp=m=>Number((typeof m?.time==='number'?m.time:undefined)??m?.updatedAt?.toMillis?.()??(typeof m?.updatedAt==='string'?Date.parse(m.updatedAt):m?.updatedAt)??0)||0;
 function clocks(lesson){const time=String(lesson.time||'').match(/(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/);return {start:lesson.start||time?.[1]||'',end:lesson.end||time?.[2]||''};}
 const minute=s=>{const m=String(s).match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):null;};
 function groups(lessons){
  const scopes=new Map();for(const lesson of lessons){const key=JSON.stringify([lesson.classId||'',lesson.date,lesson.subject||'',lesson.kind==='morning'?'morning':'subject']);if(!scopes.has(key))scopes.set(key,[]);scopes.get(key).push(lesson);}
  const result=[];for(const rows of scopes.values()){rows.sort((a,b)=>Number(a.period)-Number(b.period));let block=[];for(const lesson of rows){const prior=block.at(-1),a=prior&&clocks(prior),b=clocks(lesson),adjacent=prior&&lesson.kind!=='morning'&&Number(lesson.period)===Number(prior.period)+1&&(minute(a.end)===null||minute(b.start)===null||minute(a.end)===minute(b.start)),samePeriod=prior&&Number(lesson.period)===Number(prior.period);if(prior&&!adjacent&&!samePeriod){result.push(block);block=[];}block.push(lesson);}if(block.length)result.push(block);}
  return result;
 }
 function project(lessons,getMark){
  const result=new Map();for(const block of groups(lessons)){let chosen=null,source=null,conflict=false;for(const lesson of block){const mark=getMark(lesson);if(!valid(mark))continue;if(!chosen||stamp(mark)>stamp(chosen)){chosen=mark;source=lesson;conflict=!!mark.conflict;}else if(stamp(mark)===stamp(chosen)){conflict ||= mark.status!==chosen.status||!!mark.conflict;if(Number(lesson.period)>Number(source.period)){chosen=mark;source=lesson;}}}
   if(!chosen)continue;const blockPeriods=[...new Set(block.map(l=>Number(l.period)))];for(const lesson of block){const original=getMark(lesson);result.set(lesson.key??lesson.id,{...chosen,sourcePeriod:Number(source.period),blockPeriods,conflict,originalStatus:original?.status||''});}
  }return result;
 }
 return {groups,project,stamp};
});
