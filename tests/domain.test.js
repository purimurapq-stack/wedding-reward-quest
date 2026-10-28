import test from 'node:test';import assert from 'node:assert/strict';
import {fresh,applyEvent,setCurrent,unlocked,tripDay,tokyoDate,nextAction,actionText,clearQuest,questState,notifications,migrate,actionNote,maskText,editPlan} from '../src/domain.js';
import {quests,actions,recoveryEvents,statusPrompts,configureSchedule,eventEffect,openingTiming} from '../src/data.js';
const time=s=>Date.parse(s+'+09:00');
test('scheduled independent events, shared growth, clamping and duplicate idempotency',()=>{
 let s=fresh();const event=recoveryEvents.find(e=>e.id==='d1-bath'),t=Date.parse(event.availableAt);
 assert.deepEqual(applyEvent(s,event.id,t-1),s);
 s=applyEvent(s,event.id,t);assert.deepEqual(s.players.bride.hp,[100,130]);assert.deepEqual(s.players.groom.hp,[110,130]);assert.deepEqual(applyEvent(s,event.id,t),s);
 s=applyEvent(s,'d2-bath',time('2026-11-01T21:00:00'));assert.equal(s.players.bride.hp[1],230);
 for(const id of ['d1-meal','d2-snack','d2-meal'])s=applyEvent(s,id,time('2026-11-02T21:00:00'));
 assert.equal(s.players.bride.hunger[0],0);assert.equal(s.done.length,5);
 s=applyEvent(s,'d2-view',time('2026-11-02T21:00:00'));assert.equal(s.players.bride.joy[0],s.players.bride.joy[1]);
});
test('night entries only change selected player and retain date-specific records',()=>{
 const s=fresh();const n=setCurrent(s,'groom',{hp:999,mp:-4},'2026-10-31');assert.deepEqual(n.players.groom.hp,[100,100]);assert.equal(n.players.groom.mp[0],0);assert.deepEqual(n.players.bride,s.players.bride);assert.ok(n.logs['2026-10-31:groom']);assert.throws(()=>setCurrent(s,'groom',{hp:NaN},''));
});
test('next action rolls over exactly at departure; names are independently masked',()=>{
 const a=actions.find(a=>a.id==='a2-2'),t=Date.parse(a.at);
 assert.equal(nextAction(t-1).id,a.id);assert.notEqual(nextAction(t).id,a.id);
 assert.ok(!actionText(a,'groom',t-1).includes('サンメドウズ清里'));assert.equal(actionText(a,'bride',t-1),a.detail);assert.equal(actionText(a,'groom',Date.parse(a.revealAt)),a.detail);
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
test('previously visited stations remain visible on the return journey; future parks stay hidden',()=>{
 configureSchedule();const a=actions.find(a=>a.id==='a3-3'),t=Date.parse(a.at);
 assert.ok(actionText(a,'groom',t).includes('甲斐大泉駅'));
 const park=actions.find(a=>a.id==='a2-10');const before=Date.parse(park.at);
 assert.ok(!actionText(park,'groom',before).includes('まきば公園'));
 const q=quests.find(q=>q.id==='q2-2');clearQuest(fresh(),q.id,Date.parse(q.revealAt));
 assert.ok(!actionText(park,'groom',before).includes('まきば公園'));
 assert.ok(actionText(park,'groom',Date.parse(actions.find(a=>a.id==='a2-11').at)).includes('まきば公園'));
});
test('bus candidate switches departure, arrival, reveal and next action together',()=>{
 configureSchedule();assert.equal(actions.find(a=>a.id==='a2-10').time,'14:20');
 configureSchedule({bus:'late'});assert.equal(actions.find(a=>a.id==='a2-10').time,'15:10');assert.equal(actions.find(a=>a.id==='a2-11').time,'15:19');
 const t=time('2026-11-01T14:30:00');assert.ok(!maskText('まきば公園','groom',t).includes('まきば公園'));assert.equal(nextAction(t).id,'a2-10');
 assert.equal(quests.find(q=>q.id==='q2-2').revealAt.slice(11,16),'15:19');configureSchedule();
});
test('bride edits time, details and lunch; groom edits are rejected and persisted custom names remain hidden',()=>{
 const s=fresh();assert.throws(()=>editPlan(s,'actions','a2-lunch',{time:'12:30'}));s.role='bride';
 const n=editPlan(s,'actions','a2-lunch',{time:'12:30',detail:'変更したレストランで昼食',safeText:'昼食',revealTime:'11:04'});
 configureSchedule(n.plan);const row=actions.find(a=>a.id==='a2-lunch');assert.equal(row.time,'12:30');assert.equal(actionText(row,'bride',0),'変更したレストランで昼食');assert.equal(actionText(row,'groom',0),'昼食');
 assert.throws(()=>editPlan(s,'actions',row.id,{time:'25:00'}));configureSchedule();
});
test('all future place names and private notes are consistently masked; first visit reveals them',()=>{
 configureSchedule();const t=time('2026-10-30T00:00:00');const future=['グランドメルキュール','甲斐大泉駅','小淵沢駅','清里駅','清泉寮','まきば公園','清里テラス','サンメドウズ清里','サンダンス'];
 const text=actions.map(a=>actionText(a,'groom',t)+' '+actionNote(a,'groom',t)).join();for(const word of future)assert.ok(!text.includes(word),word);
 assert.equal(maskText('清泉寮','groom',time('2026-11-01T13:18:00')),'清泉寮');
 const deadline=actions.find(a=>a.id==='a2-return-ready');assert.equal(deadline.time,'15:50');assert.equal(actions.find(a=>a.id==='a2-13').time,'16:04');
});

test('growth ramps from early to late and reaches HP580/MP505 with a complete trip',()=>{
 const early=eventEffect(recoveryEvents.find(e=>e.id==='d1-rest'));
 const middle=eventEffect(recoveryEvents.find(e=>e.id==='d2-bath'));
 const late=eventEffect(recoveryEvents.find(e=>e.id==='d2-sleep'));
 assert.equal(early.max.hp,25);assert.equal(middle.max.hp,100);assert.equal(late.max.hp,150);assert.equal(late.max.mp,100);
 let s=fresh();for(const event of recoveryEvents)s=applyEvent(s,event.id,Date.parse('2026-11-03T00:00:00+09:00'));
 for(const role of ['groom','bride']){assert.equal(s.players[role].hp[1],580);assert.equal(s.players[role].mp[1],505);assert.equal(s.players[role].joy[1],410);for(const [current,max] of Object.values(s.players[role]))assert.ok(current>=0&&current<=max);}
 assert.equal(Object.keys(s.rewardHistory).length,recoveryEvents.length);
});
test('legacy saves preserve every value and completed event without retroactive growth',()=>{
 const old={...fresh(),players:{groom:{hp:[60,110],mp:[30,80],hunger:[10,100],joy:[100,100]},bride:{hp:[50,110],mp:[20,80],hunger:[10,100],joy:[100,100]}},done:['d1-bath'],items:[1,3],seen:true,ack:['groom:quest:q1-0'],plan:{bus:'late'},logs:{'2026-10-31:groom':{hp:60}},questClears:{'q1-0':'2026-10-31T15:00:00Z'}};
 const migrated=migrate(JSON.parse(JSON.stringify(old)));assert.deepEqual(migrated,old);
 assert.deepEqual(applyEvent(migrated,'d1-bath',Date.parse('2026-11-03T00:00:00+09:00')),old);
 const next=applyEvent(migrated,'d2-sleep',Date.parse('2026-11-03T00:00:00+09:00'));assert.equal(next.players.groom.hp[1],260);assert.equal(next.players.groom.mp[1],180);assert.deepEqual(next.items,old.items);assert.deepEqual(next.logs,old.logs);assert.deepEqual(next.questClears,old.questClears);
});
test('opening scene boundaries are 8/17/22 seconds',()=>{assert.deepEqual(openingTiming,{homecoming:8000,unlock:17000,end:22000});});
