import {settings} from './settings.js';
export const isDemo=new URLSearchParams(location.search).get('demo')==='1';
export const demoAdmin=isDemo&&new URLSearchParams(location.search).get('view')==='admin';
export const url = page => `${page}.html${isDemo?'?demo=1'+(demoAdmin?'&view=admin':''):''}`;
export async function context(){
 if(isDemo){const {demo}=await import('./demo.js');return {provider:demo,user:{...await demo.profile(),role:demoAdmin?'admin':'teacher'},assignments:await demo.assignments()};}
 if(!settings.databaseReady)return {provider:null,user:null,assignments:[]};
 const {real}=await import('./firebase-client.js');const user=await real.profile();return {provider:user?real:null,user,assignments:user?await real.assignments():[]};
}
