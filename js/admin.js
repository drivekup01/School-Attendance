import {boot,heading,empty} from './shell.js?v=20261030-unified1';
import {isDemo} from './session.js?v=20261028-exchange1';
import {adminWorkspace} from './admin-workspace.js?v=20261028-import1';
boot('admin',async ctx=>{const host=document.querySelector('#pageContent');if(ctx.user?.role!=='admin'){host.innerHTML=heading('สิทธิ์การใช้งาน','ผู้ดูแลระบบ','สำหรับผู้ดูแลระบบเช็คชื่อ')+empty('ยังไม่มีสิทธิ์ผู้ดูแลระบบ','เข้าสู่ระบบด้วยบัญชีผู้ดูแล');return;}host.innerHTML=heading('ดูแลข้อมูลทั้งโรงเรียน','ผู้ดูแลระบบ','ตรวจตารางสอน ห้องประจำชั้น การมอบหมาย และแก้ไขข้อมูลเช็คชื่อได้จากบัญชีเดียว')+'<div id="adminWorkspace"></div>';await adminWorkspace(host.querySelector('#adminWorkspace'),{isDemo});});
