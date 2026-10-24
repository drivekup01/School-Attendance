# การแยกระบบ

## เป้าหมายที่เจ้าของอนุมัติ

ใช้ Firebase โปรเจกต์ `school-budget-3e69d` ฐาน `(default)` ร่วมกับระบบเดิม โดยแยกชุดข้อมูลด้วย prefix attendance_
ยืนยันจาก Console วันที่ 25 ตุลาคม 2569: Standard edition, Firestore native, asia-southeast1
Firebase CLI ของเครื่องยังไม่ได้ login จึงยังไม่ deploy production ผ่าน CLI

## โครงสร้างใหม่

- attendance_teachers/{uid}: active, email, name — บัญชีครูที่อนุมัติ อ่านเฉพาะเจ้าตัว
- attendance_access/{uid}/classes/{classId}: ACL รายห้อง — ครูแก้ไขเองไม่ได้
- attendance_classes/{classId}/students/{studentId}: รายชื่อนักเรียน — อ่านตาม ACL เท่านั้น
- attendance_assignments/{id}: งานเข้าแถว/คาบสอน/สอนแทน — teacherUid ผูกกับ Firebase Auth UID
- attendance_assignments/{id}/days/{YYYYMMDD}/marks/{studentId}: ผลรายคน
- …/marks/{studentId}/history/{revision}: ประวัติ immutable ที่ต้องบันทึกพร้อมผลทุกครั้ง
- attendance_behavior/{eventId}: รายการเพิ่ม–ลดคะแนนที่แก้หรือลบจาก browser ไม่ได้

ห้องและคาบ provision จากผู้ดูแลเท่านั้น ห้าม client เพิ่มสิทธิ์ตัวเอง
คาบตามตารางจำกัดวันในสัปดาห์และช่วงอายุ assignment สอนแทนจำกัดวันมอบหมาย
ข้อมูลเข้าแถวกับรายวิชาอยู่คนละ assignment และไม่เขียนทับกัน

## กฎเดิมและการ deploy

กฎต้นฉบับที่เจ้าของส่งมา ถูกเก็บสำรองและเพิ่มเฉพาะบล็อก BEGIN SCHOOL ATTENDANCE v1 ก่อน catch-all deny
สคริปต์ merge-rules.mjs ตรวจย้อนกลับว่าเมื่อถอดบล็อกใหม่แล้ว ได้กฎเดิมตรงทุกตัวอักษรหลัง normalize CRLF
SHA256 ของต้นฉบับ normalized: 9501bea6b663b82a33428fd3854a4978f63d3a201222708eddfe628150cc157c
ไม่ได้แก้กฎงบประมาณ/จัดซื้อเดิม หรือ Functions budgetApi

เก็บ Rules รวมสำหรับ production ใน repo School-Budget จุดเดียว ไม่เพิ่ม root Firebase deployment config ใน repo เช็คชื่อ
ถ้ามีการแก้ Rules บน Console หรือ repo อื่นหลังจาก snapshot นี้ ต้องนำมารวมก่อน Publish
ไฟล์ fixture ใน firebase-tests มีไว้ทดสอบ regression เท่านั้น ห้าม deploy fixture ไป production

การแยกชื่อ collection ไม่ใช่การแยก project: Authentication, Rules ของฐาน และ billing ยังร่วมกัน
จึงต้องตรวจ Rules รวมและใช้ขั้นตอน deploy จุดเดียวเสมอ

## ข้อจำกัดรุ่นเริ่มต้น

- ไม่เปิด production adapter จน Publish Rules และจัดสิทธิ์ครบ
- บันทึกเป็น transaction ละ 5 คน พร้อม revision ป้องกันเขียนทับจากหน้าจอเก่า
- ทั้งห้องไม่ atomic; แจ้งกรณีสำเร็จบางส่วนและให้โหลดใหม่ก่อน retry
- ประวัติความประพฤติเป็นรายการของครูผู้บันทึกเอง ยังไม่ใช่ยอดคะแนนกลางทั้งโรงเรียน
- รายงานใช้รายชื่อปัจจุบัน จึงควรรักษา student ID ให้คงเดิมและไม่ลบประวัตินักเรียนเมื่อย้ายห้อง
- การเชื่อมตารางสอนจริงและการนำเข้านักเรียนยังอยู่ขั้นถัดไป

อ้างอิง: https://firebase.google.com/docs/rules/manage-deploy
