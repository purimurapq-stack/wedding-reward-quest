import {fresh,migrate} from './domain.js';
export const LOCAL_KEY='reward-quest-device-v4';
export const PREFS_KEY='reward-quest-local-v3';
export const LEGACY_KEY='reward-quest-v1';
export const viewRole=search=>new URLSearchParams(search).get('role')==='bride'?'bride':'groom';
const savedKeys=['version','players','done','items','motion','seen','ack','plan','logs','questClears','rewardHistory'];
export function validateLocal(state){
 if(state.version!==2||!['done','items','ack'].every(k=>Array.isArray(state[k]))||!state.logs||!state.questClears||!state.plan)throw Error('端末の保存データを読み込めません。設定のバックアップで保管してください。');
 for(const role of ['groom','bride'])for(const key of ['hp','mp','hunger','joy']){const pair=state.players?.[role]?.[key];if(!Array.isArray(pair)||pair.length!==2||!pair.every(Number.isFinite)||pair[1]<=0||pair[0]<0||pair[0]>pair[1])throw Error('ステータスの保存形式が不正です。自動で初期化せず停止しました。');}
 return state;
}
export function createRepository({storage=localStorage,search=()=>location.search}={}){
 let queue=Promise.resolve();
 function read(){
  const saved=storage.getItem(LOCAL_KEY);
  if(saved!==null)return validateLocal({...fresh(),...JSON.parse(saved)});
  // Preserve old numerical game data; the Firebase version stored only preferences locally.
  const legacy=storage.getItem(LEGACY_KEY),prefs=storage.getItem(PREFS_KEY);
  const previous=legacy===null?fresh():migrate(JSON.parse(legacy));
  const localPrefs=prefs===null?{}:JSON.parse(prefs);
  const migrated={...fresh(),...previous};
  for(const key of ['items','motion','seen','ack','plan'])if(localPrefs[key]!==undefined)migrated[key]=localPrefs[key];
  delete migrated.images;delete migrated.role;
  return validateLocal(migrated);
 }
 function serialize(state){return Object.fromEntries(savedKeys.filter(k=>state[k]!==undefined).map(k=>[k,state[k]]));}
 return {
  lastChange:false,
  load(){return {...read(),role:viewRole(search())};},
  legacyBackup(){const raw=storage.getItem(LEGACY_KEY);if(!raw)return null;const copy=JSON.parse(raw);delete copy.images;return copy;},
  backup(){return {current:storage.getItem(LOCAL_KEY),previousPreferences:storage.getItem(PREFS_KEY),previousGame:storage.getItem(LEGACY_KEY)};},
  async transact(fn){
   const work=async()=>{
    const before=this.load(),next=fn(structuredClone(before));delete next.images;validateLocal(next);
    const value=serialize(next);this.lastChange=JSON.stringify(serialize(before))!==JSON.stringify(value);
    // setItem is atomic: on failure the previous complete save stays intact.
    storage.setItem(LOCAL_KEY,JSON.stringify(value));return {...next,role:viewRole(search())};
   };
   const serialized=()=>{const task=queue.then(work,work);queue=task.catch(()=>{});return task;};
   if(typeof navigator!=='undefined'&&navigator.locks)return navigator.locks.request(LOCAL_KEY,serialized);
   return serialized();
  }
 };
}
export const repository=createRepository();
