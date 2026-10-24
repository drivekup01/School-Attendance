import {settings} from './settings.js';
export const isDemo=new URLSearchParams(location.search).get('demo')==='1';
export const url = page => `${page}.html${isDemo?'?demo=1':''}`;
export async function context(){
 if(isDemo){const {demo}=await import('./demo.js');return {provider:demo,user:await demo.profile(),assignments:await demo.assignments()};}
 if(!settings.databaseReady)return {provider:null,user:null,assignments:[]};
 const {real}=await import('./firebase-client.js');const user=await real.profile();return {provider:user?real:null,user,assignments:user?await real.assignments():[]};
}
