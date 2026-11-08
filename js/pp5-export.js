import {excel,subjectReportFilename} from './export.js?v=20261108-pp5-3';
import {download} from './core.js?v=20261031-student1';
import {buildPp5Model} from './pp5-model.js?v=20261108-pp5-3';
export function pp5Filename(reports){const first=reports[0];return subjectReportFilename({...first,subject:[first.subjectCode,first.subject].filter(Boolean).join(' '),className:reports.length===1?first.className:`รวม${reports.length}ห้อง`});}
export async function pp5Export(input){
 const model=buildPp5Model(Array.isArray(input)?input:[input]),ExcelJS=await excel(),book=new ExcelJS.Workbook();book.creator='School Attendance';book.calcProperties.fullCalcOnLoad=true;
 for(const page of model.sheets){const sheet=book.addWorksheet(page.name,{views:[{showGridLines:false}],pageSetup:{paperSize:9,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:1,printArea:page.printArea,margins:{left:0.3,right:0.2,top:0.3,bottom:0.3,header:0.1,footer:0.1}}});
  // ExcelJS treats a sparse array without index 0 as one-based and shifts cells left.
  for(const row of page.values)sheet.addRow(Array.from({length:page.lastColumn},(_,i)=>row[i]??null));page.columns.forEach((width,i)=>sheet.getColumn(i+1).width=width);for(const [r,h]of Object.entries(page.rowHeights))sheet.getRow(Number(r)).height=h;
  sheet.eachRow({includeEmpty:true},(row,r)=>{row.font={name:'Angsana New',size:15};row.alignment={horizontal:r>=9?'center':'center',vertical:'middle',wrapText:true};if(r>=4&&r<=page.studentLast)for(let c=1;c<=page.lastColumn;c++)row.getCell(c).border={top:{style:'thin'},bottom:{style:'thin'},left:{style:'thin'},right:{style:'thin'}};});
  for(const merge of page.merges)sheet.mergeCells(merge);sheet.getRow(2).font={name:'Angsana New',size:17,bold:true};sheet.getRow(3).font={name:'Angsana New',size:13};for(let r=4;r<=8;r++)sheet.getRow(r).font={name:'Angsana New',size:12};sheet.getRow(8).font={name:'Angsana New',size:12};
  for(let c=6;c<=page.scheduleEnd;c++)sheet.getCell(6,c).font={name:'Angsana New',size:10};
  for(let r=4;r<=8;r++){sheet.getCell(r,5).alignment={horizontal:'center',vertical:'middle',wrapText:false,textRotation:0};sheet.getCell(r,5).font={name:'Angsana New',size:14};}
  for(let c=6;c<=page.scheduleEnd;c++)for(const r of [7,8]){sheet.getCell(r,c).alignment={horizontal:'center',vertical:'middle',textRotation:0,wrapText:false};sheet.getCell(r,c).numFmt='0';}
  for(let r=9;r<=page.studentLast;r++)for(const item of page.markColumns)if(sheet.getCell(r,item.column).value==='ลา')sheet.getCell(r,item.column).font={name:'Angsana New',size:12};
  for(let r=9;r<=page.studentLast;r++)sheet.getCell(r,2).alignment={horizontal:'left',vertical:'middle',wrapText:true};
  sheet.getRow(page.weightRow).hidden=true;for(const f of page.formulas)sheet.getCell(f.cell).value={formula:f.formula.slice(1),result:f.result};
 }
 const filename=pp5Filename(model.reports)+'.xlsx';download(new Blob([await book.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),filename);return {filename,rooms:model.reports.length,weeks:model.weeks};
}
