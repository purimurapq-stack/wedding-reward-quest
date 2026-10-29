// Emulator only. Never point this suite at a real Firebase project.
import {readFile} from 'node:fs/promises';
import test from 'node:test';import assert from 'node:assert/strict';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,deleteDoc,serverTimestamp,runTransaction} from 'firebase/firestore';
import {buildRules} from '../../scripts/firestore-rules.mjs';
import {fresh,applyEvent,setCurrent} from '../../src/domain.js';
import {initialShared,extractShared} from '../../src/shared-state.js';
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
  await Promise.all([assertSucceeds(complete(groom)),assertSucceeds(complete(bride))]);let shared=(await getDoc(ref)).data();assert.equal(shared.players.groom.hp[1],130);assert.deepEqual(shared.done,['d1-bath']);
  // Directly replaying an event ID fails even if the attacker calculates the next totals.
  const again={...shared,players:{...shared.players,groom:{...shared.players.groom,hp:[130,160]},bride:{...shared.players.bride,hp:[130,160]}},done:[...shared.done,'d1-bath'],revision:shared.revision+1,lastOperation:{kind:'event',id:'d1-bath',actor:uids.groom},updatedAt:serverTimestamp()};await assertFails(setDoc(ref,again));
  const self=setCurrent({...fresh(),...shared},'groom',{hp:10,mp:10,hunger:10,joy:10},'2026-10-31');await assertSucceeds(setDoc(ref,{...extractShared(self),schemaVersion:1,revision:shared.revision+1,lastOperation:{kind:'status',player:'groom',date:'2026-10-31',actor:uids.groom},updatedAt:serverTimestamp()}));
  shared=(await getDoc(ref)).data();const spoof=setCurrent({...fresh(),...shared},'bride',{hp:5,mp:5,hunger:5,joy:5},'2026-10-31');await assertFails(setDoc(ref,{...extractShared(spoof),schemaVersion:1,revision:shared.revision+1,lastOperation:{kind:'status',player:'bride',date:'2026-10-31',actor:uids.groom},updatedAt:serverTimestamp()}));
  const badMax={...shared,players:{...shared.players,groom:{...shared.players.groom,hp:[10,500]}},revision:shared.revision+1,lastOperation:{kind:'status',player:'groom',date:'2026-10-31',actor:uids.groom},updatedAt:serverTimestamp()};await assertFails(setDoc(ref,badMax));
  await assertSucceeds(setDoc(ref,{...shared,questClears:{'q1-0':serverTimestamp()},revision:shared.revision+1,lastOperation:{kind:'quest',id:'q1-0',actor:uids.groom},updatedAt:serverTimestamp()}));
 }finally{await env.cleanup();}
});
test('server rules reject future event/quest/status regardless of browser clock',async()=>{
 const env=await environment('demo-wedding-future',buildRules(uids).replaceAll('timestamp.date(2026,','timestamp.date(2099,'));try{
  const db=env.authenticatedContext(uids.groom,token).firestore(),ref=doc(db,path);await assertSucceeds(setDoc(ref,make(uids.groom)));const raw=(await getDoc(ref)).data(),next=applyEvent({...fresh(),...raw},'d1-bath',Date.parse('2099-12-31T00:00:00Z'));
  await assertFails(setDoc(ref,{...extractShared(next),schemaVersion:1,revision:1,lastOperation:{kind:'event',id:'d1-bath',actor:uids.groom},updatedAt:serverTimestamp()}));
  await assertFails(setDoc(ref,{...raw,questClears:{'q1-0':serverTimestamp()},revision:1,lastOperation:{kind:'quest',id:'q1-0',actor:uids.groom},updatedAt:serverTimestamp()}));
 }finally{await env.cleanup();}
});
