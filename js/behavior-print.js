import {escapeHTML as e} from './core.js?v=20261025-firebase2';

function dateParts(value){
 const [year,month,day]=String(value).split('-').map(Number);
 const months=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
 return `${day} เดือน ${months[month-1]} พ.ศ. ${year+543}`;
}

export function requestPrintHTML(d,photos=[],baseURL=new URL('../',import.meta.url).href){
 const asset=name=>e(new URL('assets/'+name,baseURL).href);
 const checked=type=>`<span class="checkbox ${d.evidenceTypes.includes(type)?'checked':''}" aria-label="${d.evidenceTypes.includes(type)?'เลือก':'ไม่เลือก'}"></span>`;
 const activityDates=d.startDate===d.endDate?dateParts(d.startDate):`${dateParts(d.startDate)} ถึงวันที่ ${dateParts(d.endDate)}`;
 return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>แบบคำร้องขอเพิ่มคะแนนความประพฤติ</title><style>
 @font-face{font-family:RequestSarabun;src:url("${asset('request-sarabun.ttf')}") format('truetype');font-weight:normal;font-display:block}
 @page{size:A4;margin:10mm 25.4mm}
 *{box-sizing:border-box}html,body{margin:0;padding:0;color:#000;background:#fff}body{font:14pt/1.15 RequestSarabun,'TH SarabunPSK',serif}
 p{margin:0}h1{font-size:16pt;line-height:1.2;text-align:center;margin:3mm 0 6mm;font-weight:bold}.emblem{display:block;width:25mm;height:25mm;object-fit:contain;margin:0 auto}
 .school{text-align:right;margin-bottom:1.5mm}.date{text-align:right;margin-bottom:1.5mm}.filled{border-bottom:.3pt solid #000;padding:0 2mm;white-space:normal;overflow-wrap:anywhere}.date .filled{display:inline-block;min-width:62mm;text-align:center}
 .subject{margin-bottom:1mm}.intro{margin-top:7mm}.indent{text-indent:12.7mm}.certification{margin-top:1mm}.activity{margin-top:1mm;text-indent:12.7mm;text-decoration:underline;text-underline-offset:2px;white-space:pre-wrap;overflow-wrap:anywhere}.location{margin-top:1mm;overflow-wrap:anywhere}.points{margin-top:1mm}.evidence-intro{margin-top:1mm}.evidence{margin-left:25.4mm}.evidence p{min-height:7mm;display:flex;gap:2mm;align-items:center;overflow-wrap:anywhere}
 .checkbox{display:inline-block;width:5mm;height:5mm;border:.65pt solid #000;vertical-align:middle;flex-shrink:0;position:relative}.checkbox.checked:after{content:'✓';position:absolute;left:.4mm;top:-1.5mm;font-family:Arial,sans-serif;font-size:15pt}
 .closing{margin-top:6mm}.requester{width:75mm;margin:7mm 0 0 auto;text-align:center;break-inside:avoid}.signature{display:inline-block;border-bottom:.4pt solid #000;width:45mm;height:5mm;vertical-align:baseline}.requester p{min-height:7mm}
 .opinions{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);gap:4mm;margin:7mm 0 0;break-inside:avoid}.opinions h2{font-size:14pt;line-height:1.15;margin:0 0 1mm;white-space:normal}.opinions p{min-height:7mm}.opinions .choice{display:flex;gap:2mm;align-items:center;margin-left:9mm}.opinions .why{margin-left:14mm}.official-sign{text-align:center;margin-top:6mm}.official-sign p{min-height:7mm}.date-line{display:inline-block;width:34mm;border-bottom:.4pt solid #000;text-align:center;letter-spacing:5mm}
 .roster{break-before:page;padding-top:8mm}.roster table{width:100%;border-collapse:collapse;table-layout:fixed;font:14pt/1.15 RequestSarabun,serif}.roster th,.roster td{border:.5pt solid #000;padding:1.2mm 2mm;height:7mm;overflow-wrap:anywhere;vertical-align:middle}.roster th{font-weight:bold;text-align:center}.roster td:first-child,.roster td:last-child{text-align:center}.roster thead{display:table-header-group}.roster tr{break-inside:avoid}
 .photos{break-before:page}.photos h2{font-size:16pt;text-align:center;margin:0 0 5mm}.photos figure{margin:0 0 8mm;break-inside:avoid}.photos img{width:100%;max-height:225mm;object-fit:contain}.photos figcaption{text-align:center;font-size:12pt;overflow-wrap:anywhere}
 </style></head><body><section class="request-form"><img class="emblem" src="${asset('request-school-emblem.png')}" alt="ตราโรงเรียนค่ายบางระจันวิทยาคม"><h1>แบบคำร้องขอเพิ่มคะแนนความประพฤติ</h1>
 <p class="school">โรงเรียนค่ายบางระจันวิทยาคม</p><p class="date">วันที่ <span class="filled">${e(dateParts(d.requestDate))}</span></p>
 <p class="subject"><b>เรื่อง</b>　ขอเพิ่มคะแนนความประพฤติ</p><p><b>เรียน</b>　ผู้อำนวยการโรงเรียนค่ายบางระจันวิทยาคม</p>
 <p class="intro indent">ด้วยข้าพเจ้า <span class="filled">${e(d.teacherName)}</span> ${e(d.teacherPosition)}</p>
 <p class="certification indent">ขอรับรองว่านักเรียนได้เป็นผู้มีความประพฤติดี</p><p>หรือประกอบคุณงามความดีในการช่วยเหลือบำเพ็ญประโยชน์ต่อโรงเรียน สังคม ชุมชน<br>หรือนำชื่อเสียงมาสู่โรงเรียน อันได้แก่</p>
 <p class="activity">${e(d.activity)}</p><p class="location">สถานที่ <span class="filled">${e(d.location)}</span> วันที่ <span class="filled">${e(activityDates)}</span></p>
 <p class="points indent">สมควรให้นักเรียนได้รับคะแนนความประพฤติ จำนวน <span class="filled">${e(d.points)}</span> คะแนน</p>
 <p class="evidence-intro">โดยข้าพเจ้าได้แนบเอกสาร/หลักฐาน เพื่อเป็นข้อมูลประกอบการพิจารณา ดังนี้</p>
 <div class="evidence"><p>${checked('certificate')} สำเนาเกียรติบัตร</p><p>${checked('participation')} ใบรับรองการเข้าร่วมกิจกรรม</p><p>${checked('photo')} ภาพถ่ายการทำกิจกรรม</p><p>${checked('other')} <span>อื่น ๆ (ระบุ)<span class="filled">${e(d.otherEvidence||'　　　　　　　　　　')}</span></span></p></div>
 <p class="closing indent">จึงเรียนมาเพื่อพิจารณา</p><div class="requester"><p>ชื่อ<span class="signature"></span></p><p>( <span class="filled">${e(d.teacherName)}</span> )</p><p>ครูผู้ดูแลกิจกรรม</p></div>
 <div class="opinions"><div><h2>ความเห็นของหัวหน้างานระบบดูแลช่วยเหลือนักเรียน</h2><p>ได้ตรวจสอบหลักฐานตามที่แจ้งมาถูกต้องเรียบร้อย</p><p class="choice"><span class="checkbox"></span> เห็นสมควรอนุญาตเพิ่มคะแนน</p><p class="choice"><span class="checkbox"></span> ไม่เห็นสมควรอนุญาต</p><p class="why">เพราะ<span class="signature" style="width:42mm"></span></p><div class="official-sign"><p>ลงชื่อ<span class="signature"></span></p><p>(นางสาวอรลักษณ์ ธูปบูชากรณ์)</p><p>หัวหน้างานระบบการดูแลช่วยเหลือนักเรียน</p><p><span class="date-line"> / / </span></p></div></div>
 <div><h2>ความเห็นของผู้อำนวยการโรงเรียน</h2><p class="choice"><span class="checkbox"></span> อนุญาตเพิ่มคะแนน</p><p class="choice"><span class="checkbox"></span> ไม่อนุญาตเพิ่มคะแนน</p><div class="official-sign" style="margin-top:11mm"><p>ลงชื่อ<span class="signature"></span></p><p>(นายเรวัฒน์ พรหมสะโร)</p><p>ผู้อำนวยการโรงเรียนค่ายบางระจันวิทยาคม</p><p><span class="date-line"> / / </span></p></div></div></div></section>
 <section class="roster"><table><colgroup><col style="width:9.4%"><col style="width:57.3%"><col style="width:33.3%"></colgroup><thead><tr><th>ที่</th><th>ชื่อ - สกุล</th><th>ชั้น</th></tr></thead><tbody>${d.students.map((s,i)=>`<tr><td>${i+1}</td><td>${e(s.name)}</td><td>${e(s.className)}</td></tr>`).join('')}</tbody></table></section>
 ${photos.length?'<section class="photos"><h2>ภาพถ่ายการทำกิจกรรม / หลักฐานประกอบ</h2>'+photos.map(p=>`<figure><img src="data:${e(p.mime)};base64,${e(p.base64)}" alt="${e(p.name)}"><figcaption>${e(p.name)}</figcaption></figure>`).join('')+'</section>':''}</body></html>`;
}

export async function printBehaviorRequest(detail,photos=[]){
 const frame=document.createElement('iframe');frame.className='request-print-frame';frame.setAttribute('title','แบบคำร้องตามแบบฟอร์มโรงเรียน');document.body.append(frame);
 try{
  const doc=frame.contentDocument;doc.open();doc.write(requestPrintHTML(detail,photos));doc.close();
  await Promise.all([...doc.images].map(img=>img.decode()));
  await doc.fonts.load('14pt RequestSarabun');await doc.fonts.ready;
  frame.contentWindow.onafterprint=()=>frame.remove();frame.contentWindow.focus();frame.contentWindow.print();
 }catch(error){frame.remove();throw new Error('เตรียมแบบคำร้องสำหรับพิมพ์ไม่สำเร็จ กรุณาลองอีกครั้ง: '+error.message);}
}
