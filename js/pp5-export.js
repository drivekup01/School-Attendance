import {excel,subjectReportFilename} from './export.js?v=20261108-pp5-5';
import {download} from './core.js?v=20261031-student1';
import {buildPp5Model} from './pp5-model.js?v=20261108-pp5-5';
export function pp5Filename(reports){const first=reports[0];return subjectReportFilename({...first,subject:[first.subjectCode,first.subject].filter(Boolean).join(' '),className:reports.length===1?first.className:`รวม${reports.length}ห้อง`});}
export async function pp5Export(input){
 const model=buildPp5Model(Array.isArray(input)?input:[input]),ExcelJS=await excel(),book=new ExcelJS.Workbook();book.creator='School Attendance';book.calcProperties.fullCalcOnLoad=true;book.calcProperties.forceFullCalc=true;book.calcProperties.calcMode='auto';
 for(const page of model.sheets){const sheet=book.addWorksheet(page.name,{views:[{showGridLines:false}],pageSetup:{paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:1,printArea:page.printArea,margins:{left:0.3,right:0.2,top:0.3,bottom:0.3,header:0.1,footer:0.1}}});
  // ExcelJS treats a sparse array without index 0 as one-based and shifts cells left.
  for(const row of page.values)sheet.addRow(Array.from({length:page.lastColumn},(_,i)=>row[i]??null));page.columns.forEach((width,i)=>sheet.getColumn(i+1).width=width);for(const [r,h]of Object.entries(page.rowHeights))sheet.getRow(Number(r)).height=h;
  sheet.eachRow({includeEmpty:true},(row,r)=>{row.font={name:'Angsana New',size:16,bold:true};row.alignment={horizontal:r>=9?'center':'center',vertical:'middle',wrapText:true};if(r>=4&&r<=page.studentLast)for(let c=1;c<=page.lastColumn;c++)row.getCell(c).border={top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}};});
  for(const merge of page.merges)sheet.mergeCells(merge);sheet.getRow(2).font={name:'Angsana New',size:16,bold:true};sheet.getRow(3).font={name:'Angsana New',size:16,bold:true};for(let r=4;r<=8;r++)sheet.getRow(r).font={name:'Angsana New',size:16,bold:true};sheet.getRow(8).font={name:'Angsana New',size:16,bold:true};
  for(let c=6;c<=page.scheduleEnd;c++)sheet.getCell(6,c).font={name:'Angsana New',size:16,bold:true};
  for(let r=4;r<=8;r++){sheet.getCell(r,5).alignment={horizontal:'center',vertical:'middle',wrapText:false,textRotation:0};sheet.getCell(r,5).font={name:'Angsana New',size:16,bold:true};}
  for(let c=6;c<=page.scheduleEnd;c++)for(const r of [7,8]){sheet.getCell(r,c).alignment={horizontal:'center',vertical:'middle',textRotation:90,wrapText:false};sheet.getCell(r,c).numFmt='0';}
  for(let r=9;r<=page.studentLast;r++)for(const item of page.markColumns)if(sheet.getCell(r,item.column).value==='ลา')sheet.getCell(r,item.column).font={name:'Angsana New',size:16,bold:true};
  for(let r=9;r<=page.studentLast;r++)sheet.getCell(r,2).alignment={horizontal:'left',vertical:'middle',wrapText:true};
  // Strong outer/header/week boundaries, light interior grid.
  const leftEdges=new Set([1,2,5,...page.weekHeaders.map(w=>w.from),...(page.last?[page.summaryStart,page.lastColumn]:[])]),rightEdges=new Set([page.lastColumn,...page.weekHeaders.map(w=>w.to)]);
  for(let r=4;r<=page.studentLast;r++)for(let c=1;c<=page.lastColumn;c++)sheet.getCell(r,c).border={top:{style:r===4||r===9?'medium':'thin'},bottom:{style:r===page.studentLast?'medium':'thin'},left:{style:leftEdges.has(c)?'medium':'thin'},right:{style:rightEdges.has(c)?'medium':'thin'}};
  for(const merge of page.merges){const m=merge.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);if(!m||Number(m[2])<4)continue;const col=s=>[...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0),r=Number(m[2]),lastRow=Number(m[4]),c=col(m[1]),lastCol=col(m[3]);sheet.getCell(r,c).border={top:{style:r===4||r===9?'medium':'thin'},bottom:{style:lastRow===8||lastRow===page.studentLast?'medium':'thin'},left:{style:leftEdges.has(c)?'medium':'thin'},right:{style:rightEdges.has(lastCol)||leftEdges.has(lastCol+1)?'medium':'thin'}};}
  sheet.getRow(page.weightRow).hidden=true;for(const f of page.formulas){const cell=sheet.getCell(f.cell);cell.value={formula:f.formula.slice(1),result:f.result};cell.numFmt='0';cell.alignment={horizontal:'center',vertical:'middle',textRotation:0,wrapText:false};}
 }
 const filename=pp5Filename(model.reports)+'.xlsx';download(new Blob([await book.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),filename);return {filename,rooms:model.reports.length,weeks:model.weeks};
}
