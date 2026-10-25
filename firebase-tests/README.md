# Firestore emulator tests

ไฟล์ Rules ในโฟลเดอร์นี้เป็น fixture ของกฎชุดรวมสำหรับ regression test เท่านั้น ไม่ใช่ production deployment config
ทดสอบกับโปรเจกต์ demo-school-attendance เท่านั้น
ต้องมี Node.js 22+, Java 21+ และติดตั้ง dependencies ในโฟลเดอร์นี้:

```sh
npm install
npx -y firebase-tools@latest emulators:exec --only firestore --project demo-school-attendance --config firebase.json "node --test rules.test.mjs"
```

20 กลุ่มทดสอบครอบคลุม profile/ACL/assignment scope, mark+audit atomicity, timetable/date,
validation on create/update, immutable history, append-only behavior และ legacy budget/procurement regression พร้อมทดสอบ real store adapter กับ emulator
รวมบัญชีกลางและ public/private timetable boundary; ชุดทดสอบนี้ไม่เขียนฐานจริง

Browser ใช้ Firebase SDK 12.4.0 ตามระบบเดิม; rules tests ใช้ SDK 13.1.0 + rules-unit-testing 6.0.0
ควรทดสอบ browser adapter บน emulator และ production ห้องทดลองก่อนเปิดใช้งานวงกว้าง
