import test from 'node:test';import assert from 'node:assert/strict';
globalThis.localStorage={getItem:()=>null,setItem(){}};globalThis.location={search:''};
const {createRepository,LOCAL_KEY,PREFS_KEY,LEGACY_KEY,viewRole}=await import('../src/storage.js');
const {fresh,applyEvent,clearQuest,setCurrent}=await import('../src/domain.js');
const time=Date.parse('2026-11-03T00:00:00+09:00');
function memory(seed={}){const data=new Map(Object.entries(seed));return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),data};}
test('no login: events, quest clear, current values and items persist across repository reloads',async()=>{
 const storage=memory(),repo=createRepository({storage,search:()=>'?role=bride'});
 await repo.transact(s=>applyEvent(s,'d2-bath',time));await repo.transact(s=>clearQuest(s,'q1-0',time));await repo.transact(s=>setCurrent(s,'bride',{hp:100,mp:50,hunger:20,joy:100},'2026-11-02'));await repo.transact(s=>({...s,items:[1,2]}));
 const reloaded=createRepository({storage,search:()=>''});assert.equal(reloaded.load().role,'groom');assert.equal(reloaded.load().players.bride.hp[0],100);assert.equal(reloaded.load().players.bride.hp[1],200);assert.ok(reloaded.load().done.includes('d2-bath'));assert.ok(reloaded.load().questClears['q1-0']);assert.deepEqual(reloaded.load().items,[1,2]);assert.ok(storage.getItem(LOCAL_KEY));
});
test('v1/v2 full game and v3 preferences migrate without resetting old numerical data',async()=>{
 const old={...fresh(),players:{...fresh().players,groom:{...fresh().players.groom,hp:[300,900]}},done:['d1-bath'],items:[0],questClears:{'q1-0':'2026-10-31T15:00:00Z'},images:{groom:'old-image'}};
 const storage=memory({[LEGACY_KEY]:JSON.stringify(old),[PREFS_KEY]:JSON.stringify({items:[2,3],seen:true,plan:{bus:'late'}})}),repo=createRepository({storage,search:()=>'?role=bride'});
 const before=repo.load();assert.deepEqual(before.players.groom.hp,[300,900]);assert.deepEqual(before.items,[2,3]);assert.deepEqual(before.done,['d1-bath']);assert.equal(before.plan.bus,'late');assert.equal(before.images,undefined);
 await repo.transact(s=>({...s,motion:false}));const saved=JSON.parse(storage.getItem(LOCAL_KEY));assert.equal(saved.images,undefined);assert.equal(saved.role,undefined);assert.equal(saved.players.groom.hp[1],900);assert.equal(JSON.parse(storage.getItem(LEGACY_KEY)).images.groom,'old-image');
});
test('newer local game wins over old backups; roles are URL presentation only',()=>{
 const storage=memory({[LOCAL_KEY]:JSON.stringify({...fresh(),done:['d2-bath']}),[LEGACY_KEY]:JSON.stringify({...fresh(),done:['d1-bath'],role:'bride'})});const repo=createRepository({storage,search:()=>'?role=wrong'});assert.deepEqual(repo.load().done,['d2-bath']);assert.equal(repo.load().role,'groom');assert.equal(viewRole('?role=bride'),'bride');
});
test('each device has an independent save and duplicate events remain idempotent',async()=>{
 const a=createRepository({storage:memory(),search:()=>''}),b=createRepository({storage:memory(),search:()=>''});await Promise.all([a.transact(s=>applyEvent(s,'d1-bath',time)),a.transact(s=>applyEvent(s,'d1-bath',time))]);assert.equal(a.load().players.groom.hp[1],130);assert.equal(b.load().players.groom.hp[1],100);assert.equal(a.load().done.length,1);
});
test('invalid saves are not overwritten and failed storage preserves the previous full state',async()=>{
 const storage=memory({[LOCAL_KEY]:'broken'}),repo=createRepository({storage,search:()=>''});assert.throws(()=>repo.load());await assert.rejects(()=>repo.transact(s=>s));assert.equal(storage.getItem(LOCAL_KEY),'broken');
 const ok=memory(),r=createRepository({storage:ok,search:()=>''});await r.transact(s=>({...s,items:[0]}));const previous=ok.getItem(LOCAL_KEY);ok.setItem=()=>{throw Error('quota');};await assert.rejects(()=>r.transact(s=>applyEvent(s,'d1-bath',time)));assert.equal(ok.getItem(LOCAL_KEY),previous);assert.equal(r.load().players.groom.hp[1],100);
});

test('removed events and old bus settings retain their existing earned stats and history',async()=>{
 const saved={...fresh(),done:['d2-sleep','d3-meal','d3-rest'],plan:{bus:'late'},rewardHistory:{'d3-rest':{balance:2}},items:[1],questClears:{'q3-0':'2026-11-02T09:00:00+09:00'},logs:{'2026-11-02:groom':{hp:300}}};
 saved.players.groom.hp=[300,580];const storage=memory({[LOCAL_KEY]:JSON.stringify(saved)}),repo=createRepository({storage,search:()=>''});
 await repo.transact(s=>({...s,motion:false}));const loaded=repo.load();assert.deepEqual(loaded.players,saved.players);assert.deepEqual(loaded.done,saved.done);assert.deepEqual(loaded.rewardHistory,saved.rewardHistory);assert.deepEqual(loaded.plan,saved.plan);assert.deepEqual(loaded.items,saved.items);assert.deepEqual(loaded.logs,saved.logs);assert.deepEqual(loaded.questClears,saved.questClears);
});
