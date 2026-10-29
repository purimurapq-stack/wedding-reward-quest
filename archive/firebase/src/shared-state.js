import {fresh,applyEvent,clearQuest,setCurrent} from './domain.js';
// Only these fields cross the network. Items, view role, pictures, plan and notifications never do.
export const sharedKeys=['players','done','questClears','logs'];
export function extractShared(state){return Object.fromEntries(sharedKeys.map(k=>[k,structuredClone(state[k])]));}
export function initialShared(uid){return {schemaVersion:1,...extractShared(fresh()),revision:0,lastOperation:{kind:'init',actor:uid}};}
export function detectCommand(before,after,player){
 if(JSON.stringify(extractShared(before))===JSON.stringify(extractShared(after)))return null;
 const added=after.done.filter(id=>!before.done.includes(id));
 if(added.length===1)return {kind:'event',id:added[0]};
 const questIds=Object.keys(after.questClears).filter(id=>!before.questClears[id]);
 if(questIds.length===1)return {kind:'quest',id:questIds[0]};
 const logKeys=Object.keys(after.logs).filter(k=>JSON.stringify(after.logs[k])!==JSON.stringify(before.logs[k]));
 if(logKeys.length===1){const [date,owner]=logKeys[0].split(':');if(owner!==player)throw Error('現在値を編集できるのはログイン中の本人だけです');return {kind:'status',date,player,values:after.logs[logKeys[0]]};}
 throw Error('対応していない共有データの変更です');
}
export function executeCommand(state,command,player,realNow){
 if(command.kind==='event')return applyEvent(state,command.id,realNow);
 if(command.kind==='quest')return clearQuest(state,command.id,realNow);
 if(command.kind==='status'){
  if(command.player!==player)throw Error('本人以外のステータスは更新できません');
  const date=command.date;if(!['2026-10-31','2026-11-01','2026-11-02'].includes(date))throw Error('記録日が不正です');
  if(realNow<Date.parse(`${date}T${date==='2026-11-02'?'15':'21'}:00:00+09:00`))throw Error('記録できる時刻になるまでお待ちください');
  return setCurrent(state,player,command.values,date);
 }
 throw Error('操作を確認してください');
}
export function decodeShared(data){
 if(data?.schemaVersion!==1||!Number.isInteger(data.revision)||!Array.isArray(data.done)||!data.players||!data.questClears||!data.logs)throw Error('共有データの形式が異なります。上書きせず管理者に確認してください');
 const out=extractShared(data);
 for(const role of ['groom','bride'])for(const key of ['hp','mp','hunger','joy']){const pair=out.players[role]?.[key];if(!Array.isArray(pair)||pair.length!==2||!pair.every(Number.isInteger)||pair[0]<0||pair[1]<=0||pair[0]>pair[1])throw Error('共有ステータスの形式が不正です');}
 for(const [id,value] of Object.entries(data.questClears)){const iso=typeof value==='string'?value:value?.toDate?.().toISOString();if(!iso||!Number.isFinite(Date.parse(iso)))throw Error('達成時刻の形式が不正です');out.questClears[id]=iso;}
 return out;
}
