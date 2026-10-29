// Emulator only. Never point this suite at a real Firebase project.
import {readFile} from 'node:fs/promises';
import test from 'node:test';import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,deleteDoc,serverTimestamp,runTransaction} from 'firebase/firestore';
import {buildRules} from '../../scripts/firestore-rules.mjs';
import {fresh,applyEvent,setCurrent} from '../../src/domain.js';
import {initialShared,extractShared} from '../../src/shared-state.js';
import {recoveryEvents} from '../../src/data.js';
const uids={groom:'test-groom',bride:'test-bride'},path='couples/wedding-2026';
const token={firebase:{sign_in_provider:'google.com'}};
const environment=async(id,rules)=>initializeTestEnvironment({projectId:id,firestore:{host:'127.0.0.1',port:8080,rules}});
const make=(uid)=>({...initialShared(uid),updatedAt:serverTimestamp()});
// Past timestamps in this isolated fixture allow valid-operation tests independent of the real trip date.
// The production file is never altered. A separate test below keeps all event times in the future.
const dueRules=buildRules(uids).replaceAll('timestamp.date(2026,','timestamp.date(2020,');
test('checked-in default rules deny anonymous and all UIDs',async()=>{
 const env=await environment('demo-wedding-deny',buildRules({groom:'',bride:''}));try{
  for(const db of [env.unauthenticatedContext().firestore(),env.authenticatedContext(uids.groom,token).firestore()]){await assertFails(getDoc(doc(db,path)));await assertFails(setDoc(doc(db,path),make(uids.groom)));}
 }finally{await env.cleanup();}
});
test('allowed users share one transaction-safe party; outsiders, tampering and role spoofing fail',async()=>{
 const env=await environment('demo-wedding-allowed',dueRules);try{
  const groom=env.authenticatedContext(uids.groom,token).firestore(),bride=env.authenticatedContext(uids.bride,token).firestore(),outsider=env.authenticatedContext('outsider',token).firestore();
  const ref=doc(groom,path);await assertSucceeds(setDoc(ref,make(uids.groom)));await assertSucceeds(getDoc(doc(bride,path)));await assertFails(getDoc(doc(outsider,path)));await assertFails(deleteDoc(ref));
  const initial=(await getDoc(ref)).data();await assertFails(setDoc(ref,{...initial,items:[true],revision:1,updatedAt:serverTimestamp()}));
  const bad={...initial,players:{...initial.players,groom:{...initial.players.groom,hp:[999,999]}},revision:1,lastOperation:{kind:'event',id:'d1-bath',actor:uids.groom},updatedAt:serverTimestamp()};await assertFails(setDoc(ref,bad));
  // Concurrent identical completions must award exactly once.
  const complete=async(db)=>runTransaction(db,async tx=>{const r=doc(db,path),snap=await tx.get(r),raw=snap.data();if(raw.done.includes('d1-bath'))return;const next=applyEvent({...fresh(),...raw},'d1-bath',Date.parse('2026-11-03T00:00:00Z'));tx.set(r,{...extractShared(next),schemaVersion:1,revision:raw.revision+1,lastOperation:{kind:'event',id:'d1-bath',actor:db===groom?uids.groom:uids.bride},updatedAt:serverTimestamp()});});
  console.log('Emulator: concurrent d1-bath');
  await Promise.all([assertSucceeds(complete(groom)),assertSucceeds(complete(bride))]);let shared=(await getDoc(ref)).data();assert.equal(shared.players.groom.hp[1],130);assert.deepEqual(shared.done,['d1-bath']);
  // Directly replaying an event ID fails even if the attacker calculates the next totals.
  const again={...shared,players:{...shared.players,groom:{...shared.players.groom,hp:[130,160]},bride:{...shared.players.bride,hp:[130,160]}},done:[...shared.done,'d1-bath'],revision:shared.revision+1,lastOperation:{kind:'event',id:'d1-bath',actor:uids.groom},updatedAt:serverTimestamp()};await assertFails(setDoc(ref,again));
  const self=setCurrent({...fresh(),...shared},'groom',{hp:10,mp:10,hunger:10,joy:10},'2026-10-31');await assertSucceeds(setDoc(ref,{...extractShared(self),schemaVersion:1,revision:shared.revision+1,lastOperation:{kind:'status',player:'groom',date:'2026-10-31',actor:uids.groom},updatedAt:serverTimestamp()}));
  shared=(await getDoc(ref)).data();const spoof=setCurrent({...fresh(),...shared},'bride',{hp:5,mp:5,hunger:5,joy:5},'2026-10-31');await assertFails(setDoc(ref,{...extractShared(spoof),schemaVersion:1,revision:shared.revision+1,lastOperation:{kind:'status',player:'bride',date:'2026-10-31',actor:uids.groom},updatedAt:serverTimestamp()}));
  const badMax={...shared,players:{...shared.players,groom:{...shared.players.groom,hp:[10,500]}},revision:shared.revision+1,lastOperation:{kind:'status',player:'groom',date:'2026-10-31',actor:uids.groom},updatedAt:serverTimestamp()};await assertFails(setDoc(ref,badMax));
  await assertSucceeds(setDoc(ref,{...shared,questClears:{'q1-0':serverTimestamp()},revision:shared.revision+1,lastOperation:{kind:'quest',id:'q1-0',actor:uids.groom},updatedAt:serverTimestamp()}));
  // Every reward branch, including late-game HP+150/MP+100, must pass under Rules limits.
  for(const event of recoveryEvents){
   const raw=(await getDoc(ref)).data();if(raw.done.includes(event.id))continue;
   console.log('Emulator reward branch:',event.id);
   const next=applyEvent({...fresh(),...raw},event.id,Date.parse('2026-11-03T00:00:00Z'));
   await assertSucceeds(setDoc(ref,{...extractShared(next),questClears:raw.questClears,schemaVersion:1,revision:raw.revision+1,lastOperation:{kind:'event',id:event.id,actor:uids.groom},updatedAt:serverTimestamp()}));
  }
  const final=(await getDoc(ref)).data();assert.equal(final.players.groom.hp[1],580);assert.equal(final.players.bride.hp[1],580);
  for(const hp of [-1,99999,1.5]){
   const invalid={...final,players:{...final.players,groom:{...final.players.groom,hp:[hp,final.players.groom.hp[1]]}},logs:{...final.logs,'2026-10-31:groom':{hp,mp:final.players.groom.mp[0],hunger:final.players.groom.hunger[0],joy:final.players.groom.joy[0]}},revision:final.revision+1,lastOperation:{kind:'status',player:'groom',date:'2026-10-31',actor:uids.groom},updatedAt:serverTimestamp()};
   await assertFails(setDoc(ref,invalid));
  }

 }finally{await env.cleanup();}
});
test('server rules reject future event/quest/status regardless of browser clock',async()=>{
 const env=await environment('demo-wedding-future',buildRules(uids).replaceAll('timestamp.date(2026,','timestamp.date(2099,'));try{
  const db=env.authenticatedContext(uids.groom,token).firestore(),ref=doc(db,path);await assertSucceeds(setDoc(ref,make(uids.groom)));const raw=(await getDoc(ref)).data(),next=applyEvent({...fresh(),...raw},'d1-bath',Date.parse('2099-12-31T00:00:00Z'));
  await assertFails(setDoc(ref,{...extractShared(next),schemaVersion:1,revision:1,lastOperation:{kind:'event',id:'d1-bath',actor:uids.groom},updatedAt:serverTimestamp()}));
  await assertFails(setDoc(ref,{...raw,questClears:{'q1-0':serverTimestamp()},revision:1,lastOperation:{kind:'quest',id:'q1-0',actor:uids.groom},updatedAt:serverTimestamp()}));
 }finally{await env.cleanup();}
});
test('the exact generated production file compiles and enforces configured UID access',async()=>{
 const {allowedUsers}=await import('../../src/firebase-config.js');
 const exact=await readFile('firestore.rules','utf8');
 const env=await environment('demo-wedding-production-file',exact);
 try{
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),path)));
  await assertFails(getDoc(doc(env.authenticatedContext('unregistered-ci-user',token).firestore(),path)));
  const configured=allowedUsers.groom&&allowedUsers.bride&&allowedUsers.groom!==allowedUsers.bride;
  if(configured){
   const g=env.authenticatedContext(allowedUsers.groom,token).firestore(),b=env.authenticatedContext(allowedUsers.bride,token).firestore();
   await assertSucceeds(setDoc(doc(g,path),make(allowedUsers.groom)));await assertSucceeds(getDoc(doc(b,path)));
   const initial=(await getDoc(doc(g,path))).data();await assertFails(setDoc(doc(g,path),{...initial,unexpected:true,updatedAt:serverTimestamp()}));
  }else{
   for(const uid of [allowedUsers.groom||'placeholder-groom',allowedUsers.bride||'placeholder-bride'])await assertFails(setDoc(doc(env.authenticatedContext(uid,token).firestore(),path),make(uid)));
  }
 }finally{await env.cleanup();}
});
