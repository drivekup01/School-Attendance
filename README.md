# School Attendance · ระบบเช็คชื่อและความประพฤติ

เว็บสำหรับโรงเรียนค่ายบางระจันวิทยาคม แยก repo จากระบบงบประมาณ ใช้ธีมสีม่วงและ Tahoma ตามระบบเดิม รองรับมือถือและคอมพิวเตอร์

## สถานะเวอร์ชัน 0.1

**เป็นต้นแบบที่กดใช้งานได้ในโหมดทดลอง ยังไม่ใช่ระบบฐานข้อมูลจริงพร้อมใช้งาน**

- 5 หน้าแยกไฟล์: หน้าแรก / เข้าแถวเช้า / รายวิชาและสอนแทน / ความประพฤติ / รายงาน
- โหมดปกติไม่มีรายชื่อนักเรียนสมมติ และปิดการเชื่อมข้อมูล Firestore
- เติม `?demo=1` ที่ URL เพื่อลองข้อมูลสมมติ บันทึกเฉพาะ sessionStorage ของแท็บนั้น
- ทดลองเช็คชื่อ มา / สาย / ขาด / ลา หมายเหตุ มาทั้งหมด ค้นหา และแก้ย้อนหลัง
- ไม่บันทึกจนกว่าเช็คครบทุกคน มีคำเตือนเมื่อออกจากหน้าที่ยังไม่บันทึก
- เข้าแถวกับรายวิชาแยกข้อมูลกัน และสอนแทนแสดงเฉพาะวันที่มอบหมาย
- ทดลองเพิ่ม–ลดคะแนนพร้อมเหตุผล เก็บประวัติรายการ คะแนนตั้งต้นจริงยังไม่กำหนด
- ส่งออก CSV ภาษาไทยพร้อม UTF-8 BOM และไฟล์ `.xlsx` จริง
- ส่งออกเป็นข้อมูลทั่วไป **ยังไม่รับรองการนำเข้า SGS** จนกว่าจะมีไฟล์ต้นแบบ
- เตรียม Firebase Google login จาก client config เดิม; ยังไม่ยืนยัน login จริงบนโดเมนปลายทาง

## เปิดบนเครื่อง

ต้องมี Node.js 22 หรือใหม่กว่า ไม่ต้องติดตั้ง npm packages:

```sh
node scripts/serve.mjs
```

เปิด `http://127.0.0.1:4173/` หรือโหมดทดลอง `http://127.0.0.1:4173/?demo=1`
อย่าเปิด HTML ด้วย `file://` เพราะใช้ JavaScript modules

## ตรวจสอบ

```sh
node scripts/check.mjs
node --test tests/*.test.mjs
```

## GitHub Pages

ใน Settings → Pages เลือก Deploy from a branch → `main` → `/ (root)` แล้ว Save
URL ที่คาดหวังหลังเปิด Pages: `https://drivekup01.github.io/School-Attendance/`
อย่าแจ้งว่าลิงก์ใช้งานได้จนตรวจ deployment และ HTTP response แล้ว

## แก้ไขรายหน้า

| หน้า | HTML | JavaScript | CSS |
|---|---|---|---|
| หน้าแรก | index.html | js/home.js | css/home.css |
| เข้าแถว | morning.html | js/morning.js + js/attendance.js | css/attendance.css |
| รายวิชา | subject.html | js/subject.js + js/attendance.js | css/attendance.css |
| ความประพฤติ | behavior.html | js/behavior.js | css/behavior.css |
| รายงาน | reports.html | js/reports.js + js/export.js | css/reports.css |

ธีมกลางอยู่ `css/theme.css` เมนูและบัญชีอยู่ `js/shell.js` การตั้งค่าอยู่ `js/settings.js`

## แยกฐานข้อมูลจากงบประมาณ

อ่าน [แนวทางแยกระบบ](docs/ISOLATION.md) ก่อนเชื่อมฐานจริง
repo นี้ตั้งชื่อฐานที่เสนอเป็น `attendance` และปฏิเสธ `(default)`
**ยังไม่มี firebase.json, Rules, คำสั่ง deploy หรือสิทธิ์ Admin ใน repo นี้** เพื่อไม่ให้ deploy ไปทับระบบเดิมโดยไม่ได้ตั้งใจ
เพียงเปลี่ยน `databaseReady` เป็น true ยังใช้งานจริงไม่ได้ ต้องเขียน real adapter และทดสอบ Rules หลังตรวจ edition ของฐานเป้าหมายก่อน

## งานถัดไปก่อนใช้งานจริง

1. ยืนยัน Firebase เป้าหมาย: ฐานชื่อ `attendance` ในโปรเจกต์เดิม หรือโปรเจกต์ใหม่แยกทั้งชุด
2. ตรวจ edition/location/billing ของเป้าหมาย โดยไม่เปลี่ยน billing อัตโนมัติ
3. ทำ real data adapter และ Security Rules พร้อม emulator tests: ข้ามห้องไม่ได้, มอบหมายสิทธิ์เองไม่ได้, สอนแทนเฉพาะวัน, audit และป้องกันเขียนทับพร้อมกัน
4. เชื่อมตารางสอนเดิมด้วยการอ่านข้อมูลที่ได้รับอนุญาตเท่านั้น ไม่แก้ข้อมูลตารางสอนต้นทาง
5. เตรียมรายชื่อนักเรียนและจับคู่ครูกับ Google UID ผ่านผู้ดูแลที่เชื่อถือได้
6. กำหนดสิทธิ์ความประพฤติ คะแนนตั้งต้น เกณฑ์ และเงื่อนไขแก้ย้อนหลัง
7. ทดสอบ Firebase login และข้อมูลจริงบนมือถือ ก่อนเชื่อมการ์ดหน้า School-Portal

## Dependencies และเครดิต

- โลโก้และ Firebase public web config จาก repo School-Budget ของโรงเรียน
- Firebase Web SDK 12.4.0 (CDN ของ Google) สำหรับ Auth ที่เตรียมไว้
- ExcelJS 4.4.0 (MIT) โหลดเมื่อส่งออก Excel เท่านั้น: https://github.com/exceljs/exceljs
- ไม่เก็บนักเรียนจริง อีเมลครูจริง หรือ service-account keys ใน repo
