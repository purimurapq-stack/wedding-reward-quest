import test from 'node:test';import assert from 'node:assert/strict';
import {createCloudClient} from '../src/firebase-client.js';import {allowedUsers} from '../src/firebase-config.js';import {fresh,applyEvent,setCurrent} from '../src/domain.js';import {initialShared} from '../src/shared-state.js';
function fakeSDK(){
 let raw=initialShared('groomUID'),callback=null,errorCb=null,authCb=null,reads=0,txQueue=Promise.resolve();
 const auth={currentUser:null};const snapshot=()=>({exists:()=>raw!==null,data:()=>structuredClone(raw),metadata:{fromCache:false}});
 const sdk={initializeApp:()=>({}),getAuth:()=>auth,getFirestore:()=>({}),doc:()=>({}),onAuthStateChanged(a,fn){authCb=fn;fn(null);return ()=>{};},onSnapshot(ref,fn,onError){reads++;errorCb=onError;callback=fn;fn(snapshot());return ()=>{callback=null;};},getRedirectResult:async()=>null,GoogleAuthProvider:class{},signInWithPopup:async()=>{},signOut:async()=>{auth.currentUser=null;authCb(null);},serverTimestamp:()=>new Date('2026-11-03T00:00:00Z').toISOString(),
  runTransaction(db,fn){const work=async()=>{let write=null;const result=await fn({get:async()=>snapshot(),set:(ref,value)=>{write=value;}});if(write){raw=structuredClone(write);callback?.(snapshot());}return result;};const result=txQueue.then(work);txQueue=result.catch(()=>{});return result;}
 };
 return {sdk,signIn(uid){auth.currentUser={uid,email:uid+'@example.test'};authCb(auth.currentUser);},data:()=>raw,reads:()=>reads,error(error){errorCb?.(error);},absent(){raw=null;},pushRaw(data){raw=data;callback?.(snapshot());}};
}
const realNow=()=>Date.parse('2026-11-03T00:00:00+09:00');
test('empty UIDs and unknown UIDs never subscribe to Firestore; URL role cannot grant access',async()=>{
 const fake=fakeSDK(),client=createCloudClient({sdkLoader:async()=>fake.sdk,now:realNow});await client.start();fake.signIn('arbitrary');assert.equal(client.session.status,'unauthorized');assert.equal(fake.reads(),0);assert.equal(client.shared,null);
});
test('approved UID, transaction deduplication, independent events, own status and logout clearing',async()=>{
 allowedUsers.groom='groomUID';allowedUsers.bride='brideUID';try{
  const fake=fakeSDK(),client=createCloudClient({sdkLoader:async()=>fake.sdk,now:realNow});await client.start();fake.signIn('groomUID');assert.equal(client.session.status,'ready');
  const before={...fresh(),...client.shared},proposed=applyEvent(before,'d1-bath',realNow());await Promise.all([client.transact(before,proposed),client.transact(before,proposed)]);assert.equal(fake.data().players.groom.hp[1],130);assert.deepEqual(fake.data().done,['d1-bath']);
  let nextBefore={...fresh(),...client.shared};await client.transact(nextBefore,applyEvent(nextBefore,'d2-bath',realNow()));assert.equal(fake.data().players.groom.hp[1],230);
  nextBefore={...fresh(),...client.shared};await assert.rejects(()=>client.transact(nextBefore,setCurrent(nextBefore,'bride',{hp:10,mp:10,hunger:10,joy:10},'2026-11-01')));
  await client.transact(nextBefore,setCurrent(nextBefore,'groom',{hp:10,mp:10,hunger:10,joy:10},'2026-11-01'));assert.equal(fake.data().players.groom.hp[0],10);
  await client.logout();assert.equal(client.shared,null);assert.equal(client.session.status,'signed-out');
 }finally{allowedUsers.groom='';allowedUsers.bride='';}
});
test('demo time does not unlock cloud rewards; shared creation never overwrites existing data',async()=>{
 allowedUsers.groom='groomUID';allowedUsers.bride='brideUID';try{
  const fake=fakeSDK(),client=createCloudClient({sdkLoader:async()=>fake.sdk,now:()=>Date.parse('2026-10-29T00:00:00Z')});await client.start();fake.signIn('groomUID');const s={...fresh(),...client.shared};await client.transact(s,applyEvent(s,'d2-sleep',realNow()));assert.deepEqual(fake.data().done,[]);await assert.rejects(()=>client.create());
 }finally{allowedUsers.groom='';allowedUsers.bride='';}
});

test('permission errors clear previously visible shared data immediately',async()=>{
 allowedUsers.groom='groomUID';allowedUsers.bride='brideUID';try{const fake=fakeSDK(),client=createCloudClient({sdkLoader:async()=>fake.sdk,now:realNow});await client.start();fake.signIn('groomUID');assert.ok(client.shared);fake.error({code:'permission-denied'});assert.equal(client.session.status,'denied');assert.equal(client.shared,null);}finally{allowedUsers.groom='';allowedUsers.bride='';}
});
test('first authorized creation is explicit and initializes only a missing document',async()=>{
 allowedUsers.groom='groomUID';allowedUsers.bride='brideUID';try{const fake=fakeSDK();fake.absent();const client=createCloudClient({sdkLoader:async()=>fake.sdk,now:realNow});await client.start();fake.signIn('groomUID');assert.equal(client.session.status,'missing');assert.equal(fake.data(),null);await client.create();assert.equal(fake.data().revision,0);assert.deepEqual(fake.data().done,[]);assert.equal(client.session.status,'ready');await assert.rejects(()=>client.create());}finally{allowedUsers.groom='';allowedUsers.bride='';}
});
