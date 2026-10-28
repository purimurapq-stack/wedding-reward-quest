import {itineraryDefaults} from './itinerary.js';
// 実旅程はユーザー承認によりクライアントに収録。表示上のネタバレ防止のみ。
export const labels={hp:'HP',mp:'MP',hunger:'空腹度',joy:'幸福度'};
export const initial={bride:{hp:[30,100],mp:[20,80],hunger:[40,100],joy:[100,100]},groom:{hp:[40,100],mp:[30,80],hunger:[40,100],joy:[100,100]}};
export const items=['スマートフォン','充電器','モバイルバッテリー','財布','身分証','乗車券','防寒着','厚手の靴下','歩きやすい靴','手袋','マフラー','折りたたみ傘','常備薬','スキンケア用品'];
export const effects=[{id:'bath',name:'温泉に入った',icon:'♨',max:{hp:10},current:{hp:20}},{id:'meal',name:'おいしいご飯を食べた',icon:'♜',max:{hp:5},current:{hunger:-30}},{id:'view',name:'絶景を見た',icon:'✧',max:{mp:10},current:{joy:10}},{id:'rest',name:'ホテルでのんびりした',icon:'☕',max:{mp:5},current:{mp:20}},{id:'sleep',name:'ぐっすり眠った',icon:'☾',max:{hp:5},current:{hp:30}}];
export const dates=['2026-10-31','2026-11-01','2026-11-02'];
export const themes=['冒険の始まり','天空の絶景を探せ！','冒険の終わり、そして帰還'];
export const at=(day,time)=>`${dates[day-1]}T${time}:00+09:00`;
export const actions=[];
export const quests=[];
const baseActions=itineraryDefaults.actions;
const baseQuests=itineraryDefaults.quests;
export function configureSchedule(plan={}) {
 const rows=structuredClone(baseActions);
 const late=plan.bus==='late';
 if(late){
  for(const [id,time] of [['a2-10','15:10'],['a2-11','15:19'],['a2-12','15:20']])rows.find(a=>a.id===id).time=time;
  for(const a of rows)if(a.day===2&&a.revealTime==='14:29')a.revealTime='15:19';
 }
 for(const a of rows){
  const patch=plan.actions?.[a.id]||{};
  Object.assign(a,patch);a.custom=Boolean(patch.detail||patch.note);
  a.at=at(a.day,a.time);a.revealAt=at(a.day,a.revealTime);
 }
 rows.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
 actions.splice(0,actions.length,...rows);
 quests.splice(0,quests.length,...structuredClone(baseQuests).map(q=>{
  Object.assign(q,plan.quests?.[q.id]||{});
  if(q.id==='q2-2'&&!plan.quests?.[q.id]?.revealTime)q.revealTime=rows.find(a=>a.id==='a2-11').time;
  q.revealAt=at(q.day,q.revealTime);return q;
 }));
}
configureSchedule();
// Separate instances: multiple occurrences of an effect are independent.
export const recoveryEvents=[
['d1-rest','rest',1,'17:00','q1-1'],['d1-meal','meal',1,'21:00','q1-2'],['d1-bath','bath',1,'21:00','q1-2'],['d1-sleep','sleep',2,'09:00','q1-2'],
['d2-view','view',2,'12:00','q2-0'],['d2-snack','meal',2,'14:00','q2-1'],['d2-rest','rest',2,'18:00','q2-3'],['d2-meal','meal',2,'21:00','q2-3'],['d2-bath','bath',2,'21:00','q2-3'],['d2-sleep','sleep',3,'09:00','q2-3'],
['d3-meal','meal',3,'09:00','q3-0'],['d3-rest','rest',3,'09:00','q3-0']
].map(([id,effect,day,time,questId])=>({id,effect,day,availableAt:at(day,time),questId}));
export const statusPrompts=dates.map((date,i)=>({id:`night-${date}`,date,at:at(i+1,i===2?'15:00':'21:00')}));
// Names become known at their first planned visit. Routes may contain both known and secret names.
export const locations=[
 {names:['グランドメルキュール八ヶ岳リゾート＆スパ'],actionId:'a1-7'},
 {names:['八王子駅'],actionId:'a1-2'},{names:['小淵沢駅'],actionId:'a1-3'},{names:['甲斐大泉駅'],actionId:'a1-5'},
 {names:['清里駅'],actionId:'a2-1'},{names:['サンメドウズ清里','清里テラス','サンダンス','センターハウス'],actionId:'a2-3'},
 {names:['清泉寮'],actionId:'a2-6'},{names:['まきば公園'],actionId:'a2-11'}
];
