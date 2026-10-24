# การแยกระบบและป้องกันผลกระทบกับระบบเดิม

ตรวจจากสำเนา source `drivekup01/School-Budget` วันที่ 25 ตุลาคม 2569 การตรวจนี้ยังไม่ใช่การตรวจสถานะฐาน production โดยตรง

## สิ่งที่พบ

- โปรเจกต์ Firebase ที่ระบุใน config: `school-budget-3e69d`
- ฝั่งเว็บงบประมาณเรียก `getFirestore(app)` โดยไม่ระบุ database ID จึงชี้ `(default)`
- Auth ใช้ชื่อ Firebase app `school-budget` และ Google provider
- Firestore Rules เดิมมีทั้ง `budget_*`, `procurement_*` และปิด paths อื่นไว้
- `firebase.json` เดิมชี้ไฟล์ Rules ของระบบเดิม และ Functions codebase `school-budget`
- บางข้อมูลภายในงบประมาณอ่าน/เขียนผ่าน `budgetApi` ไม่ใช่ client Firestore โดยตรง
- การคัดลอก Rules ของระบบใหม่ไป deploy ทับ `(default)` อาจตัดสิทธิ์ของระบบเดิม จึงไม่ทำ

## ทางเลือก

| รูปแบบ | ข้อดี | สิ่งที่ยังร่วมกัน |
|---|---|---|
| โปรเจกต์เดิม + named database `attendance` | แยกข้อมูล Rules และ indexes; Google UID ชุดเดียวกัน | Authentication, project settings, IAM และ billing บางส่วน |
| โปรเจกต์ใหม่ | แยกข้อมูล Rules billing และ project settings มากกว่า | ใช้อีเมล Google เดิมได้ แต่ต้อง login / มอบหมายสิทธิ์ใหม่ และ UID อาจต่างกัน |
| `(default)` เดิม + collection prefixes | เปลี่ยนโครงสร้างน้อย | Rules ของฐานและความเสี่ยง deploy ทับร่วมกัน ไม่แนะนำตามความกังวลนี้ |

**การแยกฐานในโปรเจกต์เดิมไม่ได้แยกความเสี่ยงทุกอย่าง** เช่น ปิด Google provider หรือปรับ IAM ระดับโปรเจกต์ยังกระทบหลายระบบได้
Firebase ระบุว่าฐานเพิ่มเติมในโปรเจกต์ต้องเปิด billing; ไม่ควรเลือกทางนี้เพียงเพื่อเลี่ยงการเข้าสู่ระบบซ้ำ โดยไม่ตกลงค่าใช้จ่ายก่อน

อ้างอิงทางการ:
- https://firebase.google.com/docs/firestore/manage-databases
- https://firebase.google.com/docs/firestore/pricing

## สิ่งที่โค้ดรุ่นนี้ทำ

- `settings.databaseReady = false` ทำให้ระบบปกติไม่อ่าน/เขียน Firestore
- client ตรวจว่า databaseId ต้องไม่ว่างและต้องไม่ใช่ `(default)`
- ข้อมูลสมมติแยกใน `js/demo.js` โหลดเฉพาะ `?demo=1`; ไม่ seed เข้า Firebase
- ไม่เรียก `budgetApi`, ไม่เขียน `budget_*` หรือ `procurement_*`
- ไม่มี Firebase CLI deployment config และไม่มี automated Firebase deployment
- ไม่สร้าง role/assignment จาก browser; ผู้ดูแลต้อง provision จาก trusted environment ในขั้นต่อไป
- Google login ใช้ app name/config เดิมบน origin เดียวกัน จึงเตรียม reuse session ได้; session จริงยังต้องตรวจบนโดเมนปลายทาง

## Gate ก่อนเปิดบันทึกจริง

1. ตรวจฐานเป้าหมายและ edition ด้วยบัญชีผู้ดูแลที่ได้รับอนุญาต
2. ตรวจ quota / billing และตกลงตำแหน่งจัดเก็บ
3. ออกแบบ schema จริงหลังยืนยัน edition แยก identity, assignment, roster, morning, subject, behavior, audit และ export scope
4. deploy Rules เฉพาะ database ID เป้าหมาย ด้วย config ที่มีแต่ฐานใหม่
5. ห้ามใช้ blanket `firebase deploy` ใน workspace งบประมาณเพื่อเพิ่มระบบนี้
6. Security Rules ต้องบังคับครูประจำชั้น / รายวิชา / วันสอนแทน และ validation ที่ฐานข้อมูล
7. ทดสอบทั้ง positive และ negative cases พร้อม audit และ concurrent edits
8. ทดลองกับข้อมูลทดสอบในฐานใหม่ ยืนยันว่าการอ่านเขียนงบประมาณยังปกติ แล้วค่อยเปิด adapter จริง

## การ์ดหน้า School-Portal

เพิ่มการ์ดที่ repo `School-Portal` หลัง URL ใหม่ใช้งานได้ โดยแก้เฉพาะหน้า portal และ style ที่จำเป็น
ไม่คัดลอกหรือย้ายหน้าระบบงบประมาณเข้ามา
ชื่อการ์ด: `ระบบเช็คชื่อและความประพฤติ`
คำอธิบาย: `เช็คชื่อเข้าแถว รายวิชา และติดตามความประพฤตินักเรียน`
ปลายทางที่คาดหวัง: `https://drivekup01.github.io/School-Attendance/`

ยังไม่ได้แก้ repo School-Portal ในรุ่นนี้ เพื่อลดการส่งครูไปยังระบบที่ยังไม่เปิดข้อมูลจริง
