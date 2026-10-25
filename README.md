# School Attendance · ระบบเช็คชื่อและความประพฤติ

โรงเรียนค่ายบางระจันวิทยาคม — แยก repo และไฟล์รายหน้า ใช้สีม่วงและฟอนต์ Tahoma ตามระบบงบประมาณ รองรับมือถือและคอมพิวเตอร์

## สถานะล่าสุด

- หน้าแรก / เข้าแถวเช้า / รายวิชาและสอนแทน / ความประพฤติ / รายงาน / ผู้ดูแล แยก HTML, JS และ CSS
- โหมดทดลอง `?demo=1` ใช้รายชื่อสมมติ บันทึกเฉพาะ sessionStorage ของแท็บ ไม่ส่งข้อมูลทดลองเข้า Firebase
- ส่งออก UTF-8 CSV และไฟล์ .xlsx จริง; ยังเป็นรูปแบบทั่วไปจนกว่าจะมีต้นแบบ SGS
- ใช้ Google login และบัญชีกลาง school_users บนฐาน `(default)` โปรเจกต์ `school-budget-3e69d`
- ชุดข้อมูลใหม่ทุกชุดขึ้นต้น `attendance_` ไม่อ่านหรือเขียน `budget_*` / `procurement_*`
- เผยแพร่กฎสิทธิ์รวมและเปิดบัญชีกลางแล้ว บทบาทเช็คชื่อแยกจากวิชาการ/งบประมาณ
- ทดสอบ Google session ร่วมกับ Portal/ตารางสอนแล้ว; ยังรอข้อมูลนักเรียนและการมอบหมายเพื่อทดสอบบันทึกเช็คชื่อนักเรียนจริง

## เว็บใช้งาน

https://drivekup01.github.io/School-Portal/attendance/

School-Attendance เป็น repo ต้นฉบับ แยกไฟล์รายหน้าเหมือนเดิม ส่วน School-Portal เผยแพร่เฉพาะ static UI จาก repo นี้อัตโนมัติ ไม่คัดลอกฐานข้อมูลหรือไฟล์ Functions

## เปิดในเครื่อง

ต้องมี Node.js 22+ ไม่ต้องติดตั้ง dependencies สำหรับเปิดเว็บ:

```sh
node scripts/serve.mjs
```

เปิด http://127.0.0.1:4173/ หรือ http://127.0.0.1:4173/?demo=1
ไม่เปิดด้วย file:// เพราะใช้ JavaScript modules

## ไฟล์รายหน้า

| หน้า | HTML | JavaScript | CSS |
|---|---|---|---|
| หน้าแรก | index.html | js/home.js | css/home.css |
| เข้าแถว | morning.html | js/morning.js + js/attendance.js | css/attendance.css |
| รายวิชา | subject.html | js/subject.js + js/attendance.js | css/attendance.css |
| ความประพฤติ | behavior.html | js/behavior.js | css/behavior.css |
| รายงาน | reports.html | js/reports.js + js/export.js | css/reports.css |

ธีม: css/theme.css · เมนู: js/shell.js · ตั้งค่า: js/settings.js · Firestore: js/store.js

## ฐานข้อมูลและสิทธิ์

อ่าน docs/ISOLATION.md และ docs/FIREBASE-SETUP.md
`firebase/attendance.rules.fragment` มีเฉพาะส่วนที่เพิ่ม ให้รวมเข้า Rules ปัจจุบันก่อน catch-all deny
**ห้ามนำ fragment ไปแทน Rules ทั้งไฟล์**

Rules รวมของ production ให้ดูแลจาก repo School-Budget จุดเดียว
repo นี้ไม่มี firebase.json ระดับ root และไม่มี automatic production deploy
`firebase-tests/` เป็น fixture สำหรับ emulator ใช้โปรเจกต์ `demo-school-attendance` เท่านั้น
เมื่อ Rules เดิมเปลี่ยน ต้องดึงชุดล่าสุดมารวมใหม่ก่อน deploy ทุกครั้ง

ครูทั่วไปสร้างบัญชี ห้อง assignment รายชื่อนักเรียน หรือ ACL เองไม่ได้ ผู้ดูแลที่มี role admin จัดการห้อง/assignment/ACL ได้ตาม validator
บัญชีครู บทบาท และรายชื่อนักเรียนยัง provision ผ่าน trusted admin environment / Firebase Console
Marks บันทึกครั้งละไม่เกิน 5 นักเรียนต่อ transaction พร้อม immutable history ทุก revision
การบันทึกทั้งห้องไม่ใช่ transaction เดียว หากสำเร็จบางส่วนแล้วล้มเหลวจะแจ้งให้โหลดใหม่

## ตรวจสอบ

```sh
node scripts/check.mjs
node --test tests/*.test.mjs
```

การทดสอบ Rules ดู firebase-tests/README.md ใช้ emulator และข้อมูลสมมติ ไม่แตะฐานจริง

## GitHub Pages

Settings → Pages → Deploy from a branch → main → / (root) → Save
URL ที่คาดหวัง: https://drivekup01.github.io/School-Attendance/
การ์ดใน School-Portal จะเชื่อมหลัง URL ใหม่ตรวจว่าใช้งานได้แล้ว

## งานที่ยังเหลือก่อนใช้จริง

1. เจ้าของตรวจและ Publish Rules ชุดรวม
2. เปิด Pages และตรวจ Google login บน drivekup01.github.io
3. Provision attendance_teachers/{Google UID} และมอบหมายห้อง/คาบ/ACL ผ่านผู้ดูแล
4. เพิ่มรายชื่อนักเรียนภายหลัง พร้อมเชื่อมแหล่งตารางสอนจริง
5. ตกลงคะแนนตั้งต้น เกณฑ์ สิทธิ์ความประพฤติ และนโยบายแก้ย้อนหลัง
6. ทดสอบ Google login และข้อมูลจริงในขอบเขตเล็กก่อนใช้วงกว้าง

## เครดิต

โลโก้และ Firebase public web config จาก School-Budget ของโรงเรียน
Firebase browser SDK 12.4.0 ใช้ Google CDN · ExcelJS 4.4.0 (MIT) โหลดจาก jsDelivr เมื่อส่งออก Excel
ไม่ใส่ service account keys หรือข้อมูลนักเรียนจริงใน repo

รายละเอียดส่วนผู้ดูแล: docs/ADMIN.md

