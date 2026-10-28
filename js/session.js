import {settings} from './settings.js?v=20261028-exchange1';
export const isDemo=new URLSearchParams(location.search).get('demo')==='1';
export const demoAdmin=isDemo&&new URLSearchParams(location.search).get('view')==='admin';
export const url = page => `${page}.html${isDemo?'?demo=1'+(demoAdmin?'&view=admin':''):''}`;
export async function context(page){
 if(page==='index'&&!isDemo&&settings.databaseReady){const shared=await import('./school-auth.js?v=20261028-exchange1');const p=await shared.profile();if(p&&!['admin','teacher','viewer'].includes(p.attendanceRole))return {provider:null,user:{...p,role:'viewer'},assignments:[]};}
 if(isDemo){const {demo}=await import('./demo.js?v=20261028-exchange1');return {provider:demo,user:{...await demo.profile(),role:new URLSearchParams(location.search).get('view')==='viewer'?'viewer':demoAdmin?'admin':'teacher'},assignments:await demo.assignments()};}
 if(!settings.databaseReady)return {provider:null,user:null,assignments:[]};
 const {real}=await import('./firebase-client.js?v=20261028-exchange1');const user=await real.profile();if(user?.teacherId&&['teacher','admin'].includes(user.role))await (await import('./school-auth.js?v=20261028-exchange1')).call('schoolIdentity',{method:'attendanceSchedule',teacherId:user.teacherId});const assignments=user?await real.assignments():[];return {provider:user?real:null,user,assignments,classes:user?await real.classes():[]};
}
