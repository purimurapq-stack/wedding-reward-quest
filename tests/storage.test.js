import test from 'node:test';import assert from 'node:assert/strict';
// Browser storage globals must exist before the production singleton is imported.
globalThis.localStorage={getItem:()=>null,setItem(){}};globalThis.location={search:''};
const {createRepository,LOCAL_KEY,viewRole}=await import('../src/storage.js');
const {fresh,applyEvent}=await import('../src/domain.js');
function memory(seed={}){const data=new Map(Object.entries(seed));return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),data};}
function fakeCloud(status='ready') {return {session:{status,player:'groom'},shared:fresh(),calls:0,lastSharedChange:true,async transact(before,next){this.calls++;this.shared=next;},start(){},subscribe(){}};}
test('URL role is presentation only, default groom, stored role does not override URL',()=>{
 const storage=memory({'reward-quest-v1':JSON.stringify({...fresh(),role:'bride',items:[2],images:{bride:'old-base64'}})}),cloud=fakeCloud('signed-out');
 const repo=createRepository({storage,cloud,search:()=>'?role=groom'});assert.equal(repo.load().role,'groom');assert.deepEqual(repo.load().items,[2]);assert.equal(repo.load().images,undefined);assert.ok(!storage.getItem('reward-quest-v1').includes('old-base64'));assert.ok(!storage.getItem(LOCAL_KEY).includes('players'));assert.equal(viewRole('?role=bride'),'bride');assert.equal(viewRole('?role=anything'),'groom');
});
test('item/preferences never enter cloud; shared fields never enter new local preference storage',async()=>{
 const storage=memory(),cloud=fakeCloud(),repo=createRepository({storage,cloud,search:()=>'?role=bride'});
 await repo.transact(s=>({...s,items:[1,2],plan:{bus:'late'}}));assert.equal(cloud.calls,0);assert.deepEqual(repo.load().items,[1,2]);
 await repo.transact(s=>applyEvent(s,'d1-bath',Date.parse('2026-11-03T00:00:00+09:00')));assert.equal(cloud.calls,1);const prefs=JSON.parse(storage.getItem(LOCAL_KEY));for(const key of ['players','done','questClears','images','logs'])assert.ok(!(key in prefs));
});
test('old statuses remain a backup and are never automatically sent or displayed as shared data',()=>{
 const old={...fresh(),players:{...fresh().players,groom:{...fresh().players.groom,hp:[300,900]}}};const storage=memory({'reward-quest-v1':JSON.stringify(old)}),repo=createRepository({storage,cloud:fakeCloud('unauthorized'),search:()=>'?role=bride'});
 assert.deepEqual(repo.legacyBackup().players.groom.hp,[300,900]);assert.notDeepEqual(repo.load().players.groom.hp,[300,900]);
});
test('local-only operations work signed out; shared changes are denied',async()=>{
 const cloud=fakeCloud('signed-out');cloud.transact=async()=>{throw Error('denied');};const repo=createRepository({storage:memory(),cloud,search:()=>''});await repo.transact(s=>({...s,items:[0]}));await assert.rejects(()=>repo.transact(s=>applyEvent(s,'d1-bath',Date.parse('2026-11-03T00:00:00Z'))));assert.deepEqual(repo.load().items,[0]);
});
