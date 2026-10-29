import {fresh,migrate} from './domain.js';
import {createCloudClient} from './firebase-client.js';
import {extractShared} from './shared-state.js';
export const LOCAL_KEY='reward-quest-local-v3';
const LEGACY_KEY='reward-quest-v1';
const localKeys=['items','motion','seen','ack','plan'];
export const viewRole=search=>new URLSearchParams(search).get('role')==='bride'?'bride':'groom';
export function createRepository({storage=localStorage,search=()=>location.search,cloud=createCloudClient()}={}){
 let queue=Promise.resolve();
 function preferences(){
  const current=storage.getItem(LOCAL_KEY);if(current)return JSON.parse(current);
  const old=storage.getItem(LEGACY_KEY);if(!old)return {};
  const legacy=migrate(JSON.parse(old));const prefs=Object.fromEntries(localKeys.filter(k=>legacy[k]!==undefined).map(k=>[k,legacy[k]]));
  storage.setItem(LOCAL_KEY,JSON.stringify(prefs));
  // Old numerical game data remains as a backup, but per-device image blobs are retired.
  if(legacy.images){delete legacy.images;storage.setItem(LEGACY_KEY,JSON.stringify(legacy));}
  return prefs;
 }
 return {
  cloud,get session(){return cloud.session;},get lastSharedChange(){return cloud.lastSharedChange;},
  load(){const result={...fresh(),...preferences(),role:viewRole(search())};if(cloud.session.status==='ready')Object.assign(result,extractShared(cloud.shared));return result;},
  subscribe(fn){return cloud.subscribe(fn);},start(){return cloud.start();},login(){return cloud.login();},logout(){return cloud.logout();},createShared(){return cloud.create();},
  legacyBackup(){const raw=storage.getItem(LEGACY_KEY);if(!raw)return null;const data=JSON.parse(raw);delete data.images;return data;},
  async transact(fn){
   const run=async()=>{
    const before=this.load(),next=fn(structuredClone(before));
    if(next.images)throw Error('画像はassetsから読み込みます。端末には保存しません。');
    if(JSON.stringify(extractShared(before))!==JSON.stringify(extractShared(next)))await cloud.transact(before,next);
    const prefs=Object.fromEntries(localKeys.map(k=>[k,next[k]]));storage.setItem(LOCAL_KEY,JSON.stringify(prefs));return this.load();
   };
   const serialized=()=>{const task=queue.then(run,run);queue=task.catch(()=>{});return task;};
   if(typeof navigator!=='undefined'&&navigator.locks)return navigator.locks.request(LOCAL_KEY,serialized);
   return serialized();
  }
 };
}
export const repository=createRepository();
