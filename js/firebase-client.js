import {firebaseConfig} from './firebase-config.js';
import {settings} from './settings.js';
let client;
export async function firebase(){
 if(!client) client=(async()=>{
   const [appSDK,authSDK,storeSDK]=await Promise.all(['app','auth','firestore'].map(name=>import(`https://www.gstatic.com/firebasejs/12.4.0/firebase-${name}.js`)));
   // ใช้ชื่อ app เดียวกับระบบงบประมาณเพื่อแชร์ Auth persistence บน origin เดียวกัน
   const app=appSDK.getApps().find(a=>a.name==='school-budget')||appSDK.initializeApp(firebaseConfig,'school-budget');
   const auth=authSDK.getAuth(app);
   if(settings.databaseId==='(default)'||!settings.databaseId)throw Error('ไม่อนุญาตให้ระบบเช็คชื่อใช้ฐานข้อมูลงบประมาณ');
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
   if(!settings.databaseReady)throw Error('กำลังเตรียมฐานข้อมูลเช็คชื่อแยกจากงบประมาณ ยังไม่เปิดบันทึกข้อมูลจริง');
   const {auth,db,F}=await firebase();if(!auth.currentUser)return null;
   const snap=await F.getDocFromServer(F.doc(db,'attendance_teachers',auth.currentUser.uid));
   if(!snap.exists()||!snap.data().active)throw Error('บัญชีนี้ยังไม่ได้รับสิทธิ์ระบบเช็คชื่อ กรุณาติดต่อผู้ดูแล');
   return {...snap.data(),uid:auth.currentUser.uid};
 },
 // Adapter จริงจะเปิดหลังตรวจ edition และทดสอบสิทธิ์ตามตารางสอนแล้ว
 async assignments(){throw Error('ยังไม่เปิดเชื่อมข้อมูลจริง');}
};
