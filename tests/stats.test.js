import test from 'node:test';import assert from 'node:assert/strict';
import {initial,recoveryEvents,eventEffect,growthRewards,tripStartAt} from '../src/data.js';
import {fresh,applyEvent,setCurrent,setStartingCurrent,canSetStartingCurrent} from '../src/domain.js';
const afterTrip=Date.parse('2026-11-03T12:00:00+09:00'),beforeTrip=Date.parse('2026-10-30T12:00:00+09:00');
test('new journey starts fatigued and all normal events reach 1000 happiness without recovering current HP/MP',()=>{
 let s=fresh();assert.deepEqual(s.players.bride.hp,[20,100]);assert.deepEqual(s.players.bride.mp,[10,80]);assert.deepEqual(s.players.groom.hp,[25,100]);assert.deepEqual(s.players.groom.mp,[15,80]);
 assert.equal(recoveryEvents.reduce((sum,event)=>sum+eventEffect(event).current.joy,0),980);
 for(const event of recoveryEvents){const before=structuredClone(s);s=applyEvent(s,event.id,Date.parse(event.availableAt));
  for(const role of ['bride','groom'])for(const key of ['hp','mp'])assert.equal(s.players[role][key][0],before.players[role][key][0],event.id+':'+role+':'+key);
  assert.deepEqual(applyEvent(s,event.id,afterTrip),s);assert.equal(s.rewardHistory[event.id].balance,3);
 }
 for(const role of ['bride','groom']){assert.equal(s.players[role].joy[0],1000);assert.equal(s.players[role].joy[1],1080);assert.equal(s.players[role].hp[1],430);assert.equal(s.players[role].mp[1],405);assert.equal(s.players[role].hunger[0],0);}
 assert.deepEqual(initial,fresh().players);
});
test('manual night input remains authoritative across later events and keeps its original date record',()=>{
 let s=fresh();s=setCurrent(s,'groom',{hp:77,mp:63,hunger:50,joy:25},'2026-10-31');
 for(const event of recoveryEvents)s=applyEvent(s,event.id,afterTrip);
 assert.equal(s.players.groom.hp[0],77);assert.equal(s.players.groom.mp[0],63);assert.equal(s.players.bride.hp[0],20);assert.equal(s.players.bride.mp[0],10);assert.equal(s.players.groom.joy[0],1005);
 assert.deepEqual(s.logs['2026-10-31:groom'],{hp:77,mp:63,hunger:50,joy:25});
});
test('all reward settings contain no current HP/MP and application refuses accidental automatic recovery',()=>{
 for(const event of recoveryEvents){const effect=eventEffect(event);assert.equal(effect.current.hp,undefined);assert.equal(effect.current.mp,undefined);assert.ok(effect.current.joy>0);}
 const effect=growthRewards['d1-bath'],original=structuredClone(effect.current);
 try{effect.current.hp=999;effect.current.mp=999;const s=fresh(),n=applyEvent(s,'d1-bath',afterTrip);assert.equal(n.players.bride.hp[0],s.players.bride.hp[0]);assert.equal(n.players.bride.mp[0],s.players.bride.mp[0]);assert.equal(n.rewardHistory['d1-bath'].current.hp,undefined);assert.equal(n.rewardHistory['d1-bath'].current.mp,undefined);}
 finally{effect.current=original;}
});
test('legacy earned values and reward history remain unchanged; only unfinished events get the new balance',()=>{
 const s=fresh();s.players.bride={hp:[280,580],mp:[190,505],joy:[410,410],hunger:[10,100]};s.players.groom=structuredClone(s.players.bride);s.done=['d1-bath'];s.rewardHistory={'d1-bath':{balance:2,max:{hp:30},current:{hp:70,mp:20}}};
 assert.deepEqual(applyEvent(s,'d1-bath',afterTrip),s);const n=applyEvent(s,'d2-bath',afterTrip);
 assert.equal(n.players.bride.hp[0],280);assert.equal(n.players.bride.mp[0],190);assert.equal(n.players.bride.hp[1],680);assert.equal(n.players.bride.joy[0],520);assert.deepEqual(n.rewardHistory['d1-bath'],s.rewardHistory['d1-bath']);assert.equal(n.done.length,2);
});
test('explicit pre-trip setup preserves maxima and all other state and rejects unauthorized or unsafe changes',()=>{
 const s={...fresh(),role:'bride',items:[1,3],seen:true,plan:{bus:'late'},ack:['bride:notice']};
 const values={groom:{hp:12,mp:11,joy:10},bride:{hp:9,mp:8,joy:7}};assert.equal(canSetStartingCurrent(s,beforeTrip),true);
 const n=setStartingCurrent(s,values,beforeTrip);for(const role of ['groom','bride'])for(const key of ['hp','mp','joy']){assert.equal(n.players[role][key][0],values[role][key]);assert.equal(n.players[role][key][1],s.players[role][key][1]);}
 for(const key of ['items','seen','plan','ack','done','logs','questClears'])assert.deepEqual(n[key],s[key]);assert.equal(s.players.groom.hp[0],25);
 assert.throws(()=>setStartingCurrent({...s,role:'groom'},values,beforeTrip));assert.throws(()=>setStartingCurrent(s,values,Date.parse(tripStartAt)));
 for(const patch of [{done:['d1-bath']},{questClears:{'q1-0':'already'}},{logs:{date:{hp:5}}}])assert.throws(()=>setStartingCurrent({...s,...patch},values,beforeTrip));
 for(const value of [-1,101,NaN,Infinity,0.5])assert.throws(()=>setStartingCurrent(s,{...values,groom:{...values.groom,hp:value}},beforeTrip));
 assert.throws(()=>setStartingCurrent(s,{groom:values.groom},beforeTrip));assert.throws(()=>setStartingCurrent(s,{...values,groom:{...values.groom,max:999}},beforeTrip));
});
