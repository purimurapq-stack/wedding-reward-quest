import test from 'node:test';import assert from 'node:assert/strict';
import {fresh,applyEvent,setCurrent,unlocked,tripDay,tokyoDate,nextAction,actionText,clearQuest,questState,notifications,migrate} from '../src/domain.js';
import {quests,actions,recoveryEvents,statusPrompts} from '../src/data.js';
const time=s=>Date.parse(s+'+09:00');
test('scheduled independent events, shared growth, clamping and duplicate idempotency',()=>{
 let s=fresh();const event=recoveryEvents.find(e=>e.id==='d1-bath'),t=Date.parse(event.availableAt);
 assert.deepEqual(applyEvent(s,event.id,t-1),s);
 s=applyEvent(s,event.id,t);assert.deepEqual(s.players.bride.hp,[50,110]);assert.deepEqual(s.players.groom.hp,[60,110]);assert.deepEqual(applyEvent(s,event.id,t),s);
 s=applyEvent(s,'d2-bath',time('2026-11-01T21:00:00'));assert.equal(s.players.bride.hp[1],120);
 for(const id of ['d1-meal','d2-snack','d2-meal'])s=applyEvent(s,id,time('2026-11-02T21:00:00'));
 assert.equal(s.players.bride.hunger[0],0);assert.equal(s.done.length,5);
 s=applyEvent(s,'d2-view',time('2026-11-02T21:00:00'));assert.equal(s.players.bride.joy[0],100);
});
test('night entries only change selected player and retain date-specific records',()=>{
 const s=fresh();const n=setCurrent(s,'groom',{hp:999,mp:-4},'2026-10-31');assert.deepEqual(n.players.groom.hp,[100,100]);assert.equal(n.players.groom.mp[0],0);assert.deepEqual(n.players.bride,s.players.bride);assert.ok(n.logs['2026-10-31:groom']);assert.throws(()=>setCurrent(s,'groom',{hp:NaN},''));
});
test('next action rolls over exactly at departure; names are independently masked',()=>{
 const a=actions.find(a=>a.id==='a2-2'),t=Date.parse(a.at);
 assert.equal(nextAction(t-1).id,a.id);assert.notEqual(nextAction(t).id,a.id);
 assert.equal(actionText(a,'groom',t-1),a.safeText);assert.equal(actionText(a,'bride',t-1),a.detail);assert.equal(actionText(a,'groom',Date.parse(a.revealAt)),a.detail);
 assert.equal(nextAction(time('2026-11-03T00:00:00')),undefined);
});
test('release and explicit quest completion remain separate and persist',()=>{
 const q=quests[0],t=Date.parse(q.revealAt);const s=fresh();assert.equal(questState(s,q,t-1),'locked');assert.equal(questState(s,q,t),'open');assert.deepEqual(clearQuest(s,q.id,t-1),s);
 const n=clearQuest(s,q.id,t);assert.equal(questState(n,q,t),'clear');assert.deepEqual(clearQuest(n,q.id,t+1),n);assert.ok(JSON.parse(JSON.stringify(n)).questClears[q.id]);
});
test('notification backlog, acknowledgement, deferred events, role and night scope',()=>{
 const s=fresh(),t=time('2026-10-31T21:00:00');const pending=notifications(s,t);
 assert.ok(pending.some(n=>n.type==='status'));assert.ok(pending.some(n=>n.ref==='d1-bath'));assert.ok(!notifications(s,t-1).some(n=>n.type==='status'));
 s.ack=pending.map(n=>`groom:${n.id}`);assert.equal(notifications(s,t).length,0);assert.ok(!s.done.includes('d1-bath'));
 assert.ok(notifications({...s,role:'bride'},t).length);assert.ok(notifications(s,time('2026-11-02T15:00:00')).some(n=>n.type==='final'));
 const finalTime=time('2026-11-02T15:00:00');assert.deepEqual(notifications(s,finalTime),notifications(s,time('2026-11-02T21:00:00')));
 assert.deepEqual(quests.filter(q=>q.day===3).map(q=>q.revealAt.slice(11,16)),['09:00','12:00','15:00']);
});
test('JST date and legacy state migration preserve stats without duplicating same-day meals',()=>{
 assert.equal(tokyoDate(Date.parse('2026-10-31T15:00:00Z')),'2026-11-01');assert.equal(tripDay(Date.parse('2026-10-31T15:00:00Z')),2);
 const old={...fresh(),version:1,done:['2:meal'],seen:true};const n=migrate(old);assert.equal(n.version,2);assert.deepEqual(n.done,['d2-meal']);assert.equal(n.seen,true);assert.deepEqual(n.players,old.players);
});
test('routes never reveal onward destinations at departure, even after manual quest clear',()=>{
 const a=actions.find(a=>a.id==='a3-3'),departure=Date.parse(a.at);
 assert.equal(actionText(a,'groom',departure+1000),a.safeText);
 const q=quests.find(q=>q.id==='q3-1'),s=clearQuest(fresh(),q.id,departure);
 assert.equal(questState(s,q,departure),'clear');assert.equal(actionText(a,'groom',departure+1000),a.safeText);
 assert.equal(actionText(a,'groom',Date.parse(a.revealAt)),a.detail);
});
