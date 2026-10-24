import {readdirSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
for(const file of readdirSync(new URL('js/',root))){if(file.endsWith('.js')){const result=spawnSync(process.execPath,['--check',new URL('js/'+file,root).pathname.replace(/^\/([A-Za-z]:)/,'$1')],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);}}
for(const page of ['index','morning','subject','behavior','reports'])assert.ok(readFileSync(new URL(page+'.html',root),'utf8').includes('lang="th"'));
const settings=readFileSync(new URL('js/settings.js',root),'utf8');assert.ok(settings.includes("databaseId: '(default)'"));assert.ok(settings.includes('databaseReady: false'));
assert.ok(!readFileSync(new URL('js/firebase-client.js',root),'utf8').includes('getFirestore(app);'));
console.log('Syntax, pages, and isolated database guard passed.');
