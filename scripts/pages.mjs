import {readFileSync,writeFileSync} from 'node:fs';
const pages=[['index','ภาพรวมดูแลนักเรียน','home'],['morning','เช็กชื่อเข้าแถวเช้า','morning'],['subject','เช็กชื่อรายคาบ','subject'],['behavior','ความประพฤติ','behavior'],['reports','รายงานและส่งออก','reports'],['admin','จัดการข้อมูลดูแลนักเรียน','admin']];
const template=readFileSync(new URL('./student-page.tpl',import.meta.url),'utf8');
const {version}=JSON.parse(readFileSync(new URL('../styles/ui-manifest.json',import.meta.url),'utf8'));
for(const [name,title,script] of pages)writeFileSync(new URL('../'+name+'.html',import.meta.url),template.replaceAll('@@TITLE@@',title).replaceAll('@@SCRIPT@@',script).replaceAll('@@VERSION@@',version));
console.log('Generated six pages using the shared student workspace.');
