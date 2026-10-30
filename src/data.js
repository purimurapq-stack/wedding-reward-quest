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
 // 旧セーブのbus:'late'は保持しますが、旅程には適用しません。
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
['d2-view','view',2,'12:00','q2-0'],['d2-snack','meal',2,'14:00','q2-1'],['d2-rest','rest',2,'18:00','q2-3'],['d2-meal','meal',2,'21:00','q2-3'],['d2-bath','bath',2,'21:00','q2-3'],
['d3-meal','meal',3,'08:00','q3-0'],['d3-rest','rest',3,'09:00','q3-0']
].map(([id,effect,day,time,questId])=>({id,effect,day,availableAt:at(day,time),questId}));
export const statusPrompts=dates.map((date,i)=>({id:`night-${date}`,date,at:at(i+1,i===2?'15:00':'21:00')}));
// Names become known at their first planned visit. Routes may contain both known and secret names.
export const locations=[
 {names:['グランドメルキュール八ヶ岳リゾート＆スパ'],actionId:'a1-7'},
 {names:['八王子駅'],actionId:'a1-2'},{names:['小淵沢駅'],actionId:'a1-3'},{names:['甲斐大泉駅'],actionId:'a1-5'},
 {names:['清里駅'],actionId:'a2-1'},{names:['サンメドウズ清里','清里テラス','サンダンス','センターハウス'],actionId:'a2-3'},
 {names:['清泉寮'],actionId:'a2-6'},{names:['まきば公園'],actionId:'a2-11'}
];
// Per-instance rewards: early recovery -> middle growth -> late breakthrough.
export const growthRewards={
 'd1-rest':{max:{hp:25,mp:25},current:{hp:20,mp:50}},
 'd1-meal':{max:{hp:25,joy:30},current:{hp:35,hunger:-40,joy:30}},
 'd1-bath':{max:{hp:30},current:{hp:70,mp:20}},
 'd1-sleep':{max:{hp:50,mp:40},current:{hp:100,mp:80}},
 'd2-view':{max:{mp:80,joy:60},current:{mp:90,joy:60}},
 'd2-snack':{max:{hp:25,joy:40},current:{hp:40,hunger:-35,joy:40}},
 'd2-rest':{max:{mp:60},current:{mp:120}},
 'd2-meal':{max:{hp:50,joy:60},current:{hp:80,hunger:-50,joy:60}},
 'd2-bath':{max:{hp:100,mp:20},current:{hp:180,mp:50}},
 'd3-meal':{max:{hp:25,joy:80},current:{hp:60,hunger:-50,joy:80}},
 'd3-rest':{max:{mp:100,joy:40},current:{mp:200,joy:40}}
};
export function eventEffect(event){return {...effects.find(e=>e.id===event.effect),...growthRewards[event.id],...(event.id==='d3-meal'?{name:'ホテルで朝食を食べた'}:event.id==='d3-rest'?{name:'ホテルでゆっくり過ごした'}:{})};}
export const openingTiming={homecoming:5000,unlock:11000,end:15000};
