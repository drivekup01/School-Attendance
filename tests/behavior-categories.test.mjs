import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deductionSummary} from '../js/behavior-categories.js';
test('category totals count deductions per student and do not offset them with approved increases',()=>{
 const totals=deductionSummary([{category:'substances',delta:-5},{category:'substances',delta:-10},{category:'theft',delta:-20},{category:'substances',delta:30},{delta:-3},{category:'unknown',delta:-2}]);
 assert.deepEqual(totals.substances,{count:2,points:15});
 assert.deepEqual(totals.theft,{count:1,points:20});
 assert.deepEqual(totals.unspecified,{count:2,points:5});
 assert.deepEqual(totals.violence,{count:0,points:0});
});
