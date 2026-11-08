import test from 'node:test';
import assert from 'node:assert/strict';
import {pp5Export} from '../js/pp5-export.js';
test('browser export writes dense zero-based rows so ExcelJS cannot shift sparse headers and weights left',async()=>{
 const sheets=[];
 class Sheet{
  constructor(){this.rows=[];this.cells=new Map();this.meta=new Map();}
  addRow(values){assert(Object.hasOwn(values,0),'ExcelJS infers one-based indexing when index 0 is absent');for(let i=0;i<values.length;i++)assert(Object.hasOwn(values,i));this.rows.push(values);}
  getColumn(){return {};}
  getRow(r){if(!this.meta.has(r))this.meta.set(r,{});return this.meta.get(r);}
  getCell(r,c){const k=r+':'+c;if(!this.cells.has(k))this.cells.set(k,{value:this.rows[r-1]?.[c-1]});return this.cells.get(k);}
  eachRow(_,fn){this.rows.forEach((values,i)=>fn({getCell:c=>this.getCell(i+1,c)},i+1));}
  mergeCells(){}
 }
 const oldWindow=globalThis.window,oldDocument=globalThis.document,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 globalThis.window={ExcelJS:{Workbook:class{constructor(){this.calcProperties={};this.xlsx={writeBuffer:async()=>new Uint8Array()};}addWorksheet(){const s=new Sheet();sheets.push(s);return s;}}}};
 globalThis.document={createElement:()=>({click(){}})};URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=()=>{};
 try{
  await pp5Export({year:2569,term:2,subjectCode:'T101',subject:'Test',className:'ม.1/1',range:{from:'2026-11-02',to:'2026-11-30'},total:2,lessons:[{date:'2026-11-02',period:1},{date:'2026-11-02',period:2}],students:[{id:'s1',number:1,name:'Synthetic student',history:[]}]});
  for(const s of sheets){assert.deepEqual(s.rows.slice(3,8).map(r=>r[4]),['สัปดาห์','เดือน','วัน','วันที่','คาบ']);assert.equal(s.rows[5][5],'จ');}
  assert.equal(sheets[0].rows[7][5],'1–2');assert.equal(sheets[0].rows[9][5],2);
 }finally{globalThis.window=oldWindow;globalThis.document=oldDocument;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;}
});
