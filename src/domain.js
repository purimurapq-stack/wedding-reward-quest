import {initial,effects,actions,quests,recoveryEvents,statusPrompts,locations,eventEffect,tripStartAt} from './data.js';
export const fresh=()=>({version:2,players:structuredClone(initial),done:[],items:[],role:'groom',motion:true,seen:false,logs:{},questClears:{},ack:[],plan:{}});
export const unlocked=(q,now)=>Date.parse(q.revealAt??q.at)<=now;
export const tokyoDate=now=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(now);
export const tripDay=now=>Math.max(1,Math.min(3,Math.floor((Date.parse(tokyoDate(now)+'T00:00:00+09:00')-Date.parse('2026-10-31T00:00:00+09:00'))/86400000)+1));
export function applyEvent(state,id,now){
 const event=recoveryEvents.find(e=>e.id===id);
 if(!event||Date.parse(event.availableAt)>now||state.done.includes(id))return state;
 const effect=eventEffect(event),next=structuredClone(state);
 // Current HP/MP belong to the user, even if a future reward accidentally includes them.
 const currentReward=Object.fromEntries(Object.entries(effect.current).filter(([key])=>['hunger','joy'].includes(key)));
 for(const player of Object.values(next.players))for(const key of Object.keys(player)){
  player[key][1]+=effect.max[key]||0;
  if(key==='hp'||key==='mp')continue;
  player[key][0]=Math.max(0,Math.min(player[key][1],player[key][0]+(currentReward[key]||0)));
 }
 next.done.push(id);next.rewardHistory??={};
 next.rewardHistory[id]={balance:3,at:new Date(now).toISOString(),max:structuredClone(effect.max),current:structuredClone(currentReward)};
 return next;
}
export const canSetStartingCurrent=(state,realNow)=>state.role==='bride'&&Number.isFinite(realNow)&&realNow<Date.parse(tripStartAt)&&!state.done.length&&!Object.keys(state.questClears).length&&!Object.keys(state.logs).length;
export function setStartingCurrent(state,values,realNow){
 if(!canSetStartingCurrent(state,realNow))throw Error('旅行前・未達成の新婦モードでのみ現在値を設定できます。');
 if(!values||Object.keys(values).sort().join(',')!=='bride,groom')throw Error('2人の入力値を確認してください');
 const next=structuredClone(state);
 for(const role of ['groom','bride']){
  const input=values[role];
  if(!input||Object.keys(input).sort().join(',')!=='hp,joy,mp')throw Error('HP・MP・幸福度を入力してください');
  for(const key of ['hp','mp','joy']){
   const value=input[key];
   if(!Number.isInteger(value)||value<0||value>state.players[role][key][1])throw Error('現在値は0から最大値までの整数で入力してください');
   next.players[role][key][0]=value;
  }
 }
 return next;
}
export function clearQuest(state,id,now){const q=quests.find(q=>q.id===id);if(!q||!unlocked(q,now)||state.questClears[id])return state;return {...state,questClears:{...state.questClears,[id]:new Date(now).toISOString()}};}
export const questState=(s,q,now)=>s.questClears[q.id]?'clear':unlocked(q,now)?'open':'locked';
export function maskText(text,role,now){
 if(role==='bride')return text||'';
 let result=text||'';
 for(const location of locations){
  const visit=actions.find(a=>a.id===location.actionId);
  if(!visit||Date.parse(visit.at)>now)for(const name of location.names)result=result.split(name).join('？？？');
 }
 return result;
}
export const actionText=(a,role,now)=>role==='bride'?a.detail:a.custom&&!unlocked(a,now)?a.safeText:maskText(a.detail,role,now);
export const actionNote=(a,role,now)=>role==='bride'?a.note:a.custom&&!unlocked(a,now)?a.safeNote:maskText(a.note,role,now);
export const questTitle=(q,role,now)=>role==='bride'||unlocked(q,now)?q.title:'ひみつのクエスト';
export const returnBus=()=>actions.find(a=>a.id==='a2-13');
export const returnTarget=()=>actions.find(a=>a.id==='a2-return-ready');
export const showBusWarning=now=>tokyoDate(now)==='2026-11-01'&&now>=Date.parse('2026-11-01T14:00:00+09:00')&&now<=Date.parse(returnBus().at)+60000;
export function editPlan(state,kind,id,patch){
 if(state.role!=='bride')throw Error('旅程の編集は新婦モードで行ってください');
 for(const key of ['time','revealTime'])if(patch[key]!==undefined&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(patch[key]))throw Error('時刻を確認してください');
 for(const key of ['detail','safeText','title'])if(patch[key]!==undefined&&!patch[key].trim())throw Error('空欄を確認してください');
 if(!['actions','quests'].includes(kind))throw Error('編集対象が不正です');
 const next=structuredClone(state);next.plan??={};next.plan[kind]??={};next.plan[kind][id]={...(next.plan[kind][id]||{}),...patch};return next;
}
export const nextAction=(now)=>actions.find(a=>Date.parse(a.at)>now);
export function setCurrent(state,role,values,date){const next=structuredClone(state);for(const [k,v] of Object.entries(values)){if(!next.players[role]?.[k]||!Number.isFinite(v))throw Error('入力値を確認してください');next.players[role][k][0]=Math.max(0,Math.min(next.players[role][k][1],Math.round(v)));}next.logs[`${date}:${role}`]={...values};return next;}
export function notifications(s,now){const entries=[...quests.filter(q=>unlocked(q,now)).map(q=>({id:`quest:${q.id}`,type:q.final?'final':'quest',ref:q.id,title:q.final?'QUEST COMPLETE!':'NEW QUEST UNLOCKED!',text:questTitle(q,s.role,now)})),...recoveryEvents.filter(e=>Date.parse(e.availableAt)<=now&&!s.done.includes(e.id)).map(e=>({id:`event:${e.id}`,type:'event',ref:e.id,title:'今日もおつかれさま！',text:eventEffect(e).name+'？'})),...statusPrompts.filter(p=>Date.parse(p.at)<=now&&!s.logs[`${p.date}:${s.role}`]).map(p=>({id:`status:${p.date}`,type:'status',ref:p.date,title:"TODAY’S STATUS",text:'今日の冒険はどうだった？'}))];return entries.filter(n=>!s.ack.includes(`${s.role}:${n.id}`));}
export function migrate(s){if(s.version===1){const next={...fresh(),...s,version:2,questClears:{},ack:[],plan:{}};next.done=recoveryEvents.filter(e=>s.done.includes(`${e.id.slice(1,2)}:${e.effect}`)&&e.id===`d${e.id.slice(1,2)}-${e.effect}`).map(e=>e.id);return next;}return {...s,plan:s.plan||{}};}
