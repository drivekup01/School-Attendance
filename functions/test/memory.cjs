const {managerId}=require('../behavior');
function memory(){
 let seq=0;const docs=new Map([
 ['school_users/t1',{name:'Teacher One',active:true,attendanceRole:'teacher'}],['school_users/t2',{name:'Teacher Two',active:true,attendanceRole:'teacher'}],
 ['attendance_behavior_managers/'+managerId('manager@kbws.ac.th'),{name:'Manager',email:'manager@kbws.ac.th',active:true}],
 ['attendance_classes/c1',{name:'ม.1/1',active:true,academicYear:2569,term:1}],['attendance_classes/c2',{name:'ม.1/2',active:true,academicYear:2569,term:1}],
 ['attendance_classes/c1/students/s1',{number:1,name:'Synthetic One',code:'001'}],['attendance_classes/c1/students/s2',{number:2,name:'Synthetic Two',code:'002'}],
 ...['t1','t2'].map(t=>['attendance_access/'+t+'/classes/c1',{active:true,canRead:true,canBehavior:true}])]);
 const snap=path=>({id:path.split('/').pop(),exists:docs.has(path),data:()=>docs.get(path)});
 const ref=path=>({path,id:path.split('/').pop(),get:async()=>snap(path),collection:n=>collection(path+'/'+n)});
 function collection(path,filter=()=>true,sortKey=null,direction='asc',cap=Infinity){return {doc:(id='auto'+(++seq))=>ref(path+'/'+id),where:(key,op,v)=>collection(path,d=>filter(d)&&d[key]===v,sortKey,direction,cap),orderBy:(key,dir)=>collection(path,filter,key,dir,cap),limit:n=>collection(path,filter,sortKey,direction,n),get:async()=>({docs:[...docs.keys()].filter(k=>k.startsWith(path+'/')&&k.split('/').length===path.split('/').length+1&&filter(docs.get(k))).map(snap).sort((a,b)=>sortKey?(direction==='desc'?-1:1)*((a.data()[sortKey]?.toMillis?.()||0)-(b.data()[sortKey]?.toMillis?.()||0)):0).slice(0,cap)})};}
 const db={doc:ref,collection,getAll:async(...refs)=>refs.map(r=>snap(r.path)),runTransaction:async fn=>{const writes=[];const result=await fn({get:async r=>snap(r.path),update:(r,data)=>{if(!docs.has(r.path))throw Error('missing');writes.push([r.path,{...docs.get(r.path),...data}]);},create:(r,data)=>{if(docs.has(r.path))throw Error('exists');writes.push([r.path,data]);}});writes.forEach(([p,d])=>docs.set(p,d));return result;}};
 return {db,docs};
}
module.exports={memory};
