import test from 'node:test';import assert from 'node:assert/strict';import {visibleSchedule,visibleQuests,canEditPlayer} from '../server/policy.js';
test('anonymous blocked; future destination and notes never serialized for groom',()=>{
 const records=[{id:'a',day:2,plannedAt:'2026-11-01T10:00:00+09:00',revealAt:'2026-11-01T11:00:00+09:00',safeText:'バスに乗る',title:'SECRET STATION',note:'SECRET ROUTE',privateField:'SECRET'}];
 const groom={role:'groom',coupleId:'ours'},bride={role:'bride',coupleId:'ours'},t=Date.parse(records[0].revealAt);
 assert.throws(()=>visibleSchedule(records,null));assert.throws(()=>visibleSchedule(records,{role:'bride'}));
 const before=visibleSchedule(records,groom,t-1);assert.equal(before[0].safeText,'バスに乗る');assert.ok(!JSON.stringify(before).includes('SECRET'));
 assert.equal(visibleSchedule(records,groom,t)[0].detail,'SECRET STATION');assert.equal(visibleSchedule(records,bride,0)[0].detail,'SECRET STATION');assert.ok(!JSON.stringify(visibleSchedule(records,bride,0)).includes('privateField'));
 assert.equal(canEditPlayer(groom,'bride'),false);assert.equal(canEditPlayer(groom,'groom'),true);
 assert.ok(!JSON.stringify(visibleQuests([{id:'q',title:'SECRET QUEST',revealAt:records[0].revealAt}],groom,0)).includes('SECRET'));
});
