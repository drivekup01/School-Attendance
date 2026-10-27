import {firebaseConfig} from './firebase-config.js?v=20261027-catalog1';
import {settings} from './settings.js?v=20261027-catalog1';
let client;
export async function firebase(){
 if(!client) client=(async()=>{
   const [appSDK,authSDK,storeSDK]=await Promise.all(['app','auth','firestore'].map(name=>import(`https://www.gstatic.com/firebasejs/12.4.0/firebase-${name}.js`)));
   // ใช้ชื่อ app เดียวกับระบบงบประมาณเพื่อแชร์ Auth persistence บน origin เดียวกัน
   const app=appSDK.getApps().find(a=>a.name==='school-budget')||appSDK.initializeApp(firebaseConfig,'school-budget');
   const auth=authSDK.getAuth(app);
   if(settings.databaseId!=='(default)'||firebaseConfig.projectId!=='school-budget-3e69d')throw Error('ฐานข้อมูลไม่ตรงกับเป้าหมายที่ตรวจสอบแล้ว');
   const db=storeSDK.getFirestore(app,settings.databaseId);
   await auth.authStateReady();
   return {auth,db,A:authSDK,F:storeSDK};
 })().catch(e=>{client=null;throw e;});
 return client;
}
export async function login(){const {auth,A}=await firebase();const provider=new A.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});return A.signInWithPopup(auth,provider);}
export async function logout(){const {auth,A}=await firebase();return A.signOut(auth);}
export async function currentUser(){return (await firebase()).auth.currentUser;}
export const real={
 async profile(){
   if(!settings.databaseReady)throw Error('กำลังเตรียมสิทธิ์ชุดข้อมูลเช็คชื่อ ยังไม่เปิดบันทึกข้อมูลจริง');
   const {auth}=await firebase();if(!auth.currentUser)return null;
   const p=await (await import('./school-auth.js?v=20261027-catalog1')).profile();
   if(!p?.active||!['teacher','admin','viewer'].includes(p.attendanceRole))throw Error('บัญชีนี้ยังไม่ได้รับสิทธิ์ระบบเช็คชื่อ กรุณาติดต่อผู้ดูแลบัญชีกลาง');
   return {...p,role:p.attendanceRole};
 },
 async classes(){const store=(await import('./store.js?v=20261027-catalog1')).store;return store.catalog?.classes||[];},
 async assignments(){return (await import('./store.js?v=20261027-catalog1')).store.assignments();},
 async students(classId){return (await import('./store.js?v=20261027-catalog1')).store.students(classId);},
 async session(a,date){return (await import('./store.js?v=20261027-catalog1')).store.session(a,date);},
 async save(a,date,students,marks,revision){return (await import('./store.js?v=20261027-catalog1')).store.save(a,date,students,marks,revision);},
 async behavior(classId){return (await import('./store.js?v=20261027-catalog1')).store.behavior(classId);},
 async addBehavior(item){return (await import('./store.js?v=20261027-catalog1')).store.addBehavior(item);},
 async report(from,to,kind){return (await import('./store.js?v=20261027-catalog1')).store.report(from,to,kind);}
};
