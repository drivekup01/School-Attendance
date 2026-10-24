# ตั้งค่า Firebase โดยเจ้าของโปรเจกต์

ฐานเป้าหมาย: `school-budget-3e69d` / `(default)` / Standard / asia-southeast1

## 1. Rules

เปิด Firestore Database → `(default)` → Rules
ดาวน์โหลดหรือคัดลอกกฎปัจจุบันเก็บสำรองก่อน
ใช้ไฟล์ `firestore-combined.rules` ที่จัดส่งแยก ซึ่งรวมกฎเดิมของเจ้าของครบแล้ว
แทนที่เนื้อหาทั้งหมดด้วยไฟล์ชุดรวม ตรวจว่าไม่มี error แล้วจึง Publish
หากมีการแก้ Rules เพิ่มหลังวันที่จัดส่ง ให้รวมกฎล่าสุดก่อน ไม่ใช้ snapshot เก่าทับ

ชุดรวมผ่าน emulator tests; ยังเป็น prototype ที่ต้องตรวจอีกครั้งก่อนเปิดใช้วงกว้าง
การ Publish อย่างเดียวไม่ทำให้บุคคลทั่วไปเข้าถึงข้อมูลนักเรียน บัญชีครูและ ACL ต้อง provision โดยผู้ดูแลก่อน

## 2. Google login

Authentication → Sign-in method → Google ต้องเปิดอยู่
Authentication → Settings → Authorized domains มี `drivekup01.github.io`
ถ้ามีอยู่แล้วคงค่าเดิม ไม่ต้องเพิ่มโดเมนหรือ provider ใหม่

## 3. บัญชีครูเริ่มต้น

Authentication → Users → คัดลอก UID ของบัญชี Google ที่จะทดสอบ
Firestore → Start collection → `attendance_teachers`
Document ID ใช้ UID นั้นตรงตัว กรอก:

| field | type | value |
|---|---|---|
| active | boolean | true |
| email | string | อีเมลเดียวกับ Authentication ตรงตัว |
| name | string | ชื่อที่ต้องการแสดง |

ขั้นตอนนี้รับรองตัวตนครูอย่างเดียว ยังไม่ให้สิทธิ์อ่านห้องใด
การมอบหมายห้อง/คาบ/ACL และการเพิ่มนักเรียนจะทำต่อหลังตกลงข้อมูลจริง
ไม่ใช้ role หรือ active ของ budget_users เป็นสิทธิ์เช็คชื่อโดยอัตโนมัติ

## 4. ข้อมูลที่ผู้ดูแลต้องเตรียมภายหลัง

ใช้ ID แบบอักษรอังกฤษ ตัวเลข `_` หรือ `-` ไม่เกิน 100 ตัว เช่น `M1_1`
รายชื่อนักเรียน: `attendance_classes/M1_1/students/STUDENT_ID`
fields: `code` string (รักษาเลขศูนย์นำหน้า), `name` string, `number` integer

ACL: `attendance_access/TEACHER_UID/classes/M1_1`
fields boolean ทั้งหมด: `active`, `canRead`, `canMorning`, `canSubject`, `canBehavior`
ตั้ง true เฉพาะหน้าที่ที่มอบหมาย ส่วนความประพฤติให้เฉพาะครูประจำชั้นในรุ่นแรก

assignment: `attendance_assignments/ASSIGNMENT_ID`
fields:
- `teacherUid`: string UID ครู
- `active`: boolean
- `kind`: string `morning` / `subject` / `substitute`
- `classId`, `className`, `subject`, `time`: strings
- `period`: integer (0 สำหรับเข้าแถว)
- `weekday`: integer 0=อาทิตย์ … 6=เสาร์
- `from`, `to`: timestamps เวลา 00:00 ของวันเริ่ม/สิ้นสุดตามเวลาไทย
- `date`: timestamp วันสอนแทน เวลา 00:00 ไทย หรือ null ถ้าไม่ใช่สอนแทน

ต้องมีทั้ง profile, ACL และ assignment ที่ active ครบก่อนเปิดเช็คชื่อ
สร้างด้วย Console/Admin SDK เท่านั้น ห้ามเปิดให้ครูเพิ่ม assignment/ACL จาก browser

## 5. เปิดใช้งานเว็บ

หลัง Rules และสิทธิ์พร้อม ให้ทดสอบบัญชีที่ได้รับสิทธิ์กับบัญชีที่ไม่ได้รับสิทธิ์ก่อน
จึงเปลี่ยน `databaseReady` ใน `js/settings.js` เป็น true และเผยแพร่เว็บ
อย่าเปลี่ยน Rules เป็น allow read,write: if true เพื่อแก้ permission-denied

ยังต้องทดสอบ login บนมือถือและการบันทึก production ในห้องทดสอบก่อนใช้งานวงกว้าง
