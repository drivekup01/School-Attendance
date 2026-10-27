'use strict';
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getFirestore,Timestamp}=require('firebase-admin/firestore');
const {service}=require('./overview');
initializeApp();
exports.attendanceAdmin=onCall({region:'asia-southeast1',invoker:'public',memory:'256MiB',maxInstances:3,timeoutSeconds:60,cors:['https://drivekup01.github.io','http://127.0.0.1:4173']},async request=>{
 try{return await require('./admin').service(getFirestore(),Timestamp,request);}catch(e){const codes=['unauthenticated','permission-denied','invalid-argument','not-found','already-exists','failed-precondition','aborted'];throw new HttpsError(codes.includes(e.code)?e.code:'internal',codes.includes(e.code)?e.message:'จัดการข้อมูลไม่สำเร็จ กรุณาลองใหม่');}
});
exports.attendanceOverview=onCall({region:'asia-southeast1',invoker:'public',memory:'256MiB',maxInstances:3,timeoutSeconds:60,cors:['https://drivekup01.github.io','http://127.0.0.1:4173']},async request=>{
 try{return await service(getFirestore(),Timestamp,request);}catch(e){const codes=['unauthenticated','permission-denied','invalid-argument','not-found','failed-precondition'];throw new HttpsError(codes.includes(e.code)?e.code:'internal',codes.includes(e.code)?e.message:'โหลดสรุปการเช็คชื่อไม่สำเร็จ กรุณาลองใหม่');}
});
exports.attendanceBehavior=onCall({region:'asia-southeast1',invoker:'public',memory:'256MiB',maxInstances:3,timeoutSeconds:60,cors:['https://drivekup01.github.io','http://127.0.0.1:4173']},async request=>{
 try{return await require('./behavior').service(getFirestore(),Timestamp,request);}catch(e){const codes=['unauthenticated','permission-denied','invalid-argument','not-found','already-exists','failed-precondition'];throw new HttpsError(codes.includes(e.code)?e.code:'internal',codes.includes(e.code)?e.message:'ดำเนินการคะแนนความประพฤติไม่สำเร็จ กรุณาลองใหม่');}
});
exports.attendanceBehaviorRequests=onCall({region:'asia-southeast1',invoker:'public',memory:'256MiB',maxInstances:3,timeoutSeconds:60,cors:['https://drivekup01.github.io','http://127.0.0.1:4173']},async request=>{
 try{return await require('./behavior-requests').service(getFirestore(),Timestamp,request);}catch(e){const codes=['unauthenticated','permission-denied','invalid-argument','not-found','already-exists','failed-precondition'];throw new HttpsError(codes.includes(e.code)?e.code:'internal',codes.includes(e.code)?e.message:'ดำเนินการแบบคำร้องไม่สำเร็จ กรุณาลองใหม่');}
});
