export function normalizedStaffName(value){
 return String(value||'').normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g,'').trim().replace(/^(นางสาว|นาง|นาย)\s*/,'').replace(/\s+/g,'').toLocaleLowerCase('th');
}
export function mergeStaff(native=[],accounts=[]){
 const rows=native.map(t=>({...t,name:[t.prefix,t.first,t.last].filter(Boolean).join(' ').trim(),account:null})),used=new Set();
 // Stable teacher IDs take precedence over display names.
 for(const row of rows){const found=accounts.filter(a=>a.teacherId===row.id);if(found.length===1&&!used.has(found[0].id)){row.account=found[0];used.add(found[0].id);}}
 // Display-only pairing requires a unique full name on both sides. Never change identity records.
 for(const row of rows){if(row.account)continue;const name=normalizedStaffName(row.name);if(!name||rows.filter(r=>normalizedStaffName(r.name)===name).length!==1)continue;
  const matches=accounts.filter(a=>normalizedStaffName(a.name)===name);if(matches.length===1&&!matches[0].teacherId&&!used.has(matches[0].id)){row.account=matches[0];used.add(matches[0].id);}
 }
 for(const account of accounts)if(!used.has(account.id))rows.push({id:'account_'+account.id,name:account.name,account});
 return rows;
}
