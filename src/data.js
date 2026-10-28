// 公開可能な架空データのみ。実旅程をここへコピーしないでください。
export const labels={hp:'HP',mp:'MP',hunger:'空腹度',joy:'幸福度'};
export const initial={bride:{hp:[30,100],mp:[20,80],hunger:[40,100],joy:[100,100]},groom:{hp:[40,100],mp:[30,80],hunger:[40,100],joy:[100,100]}};
export const items=['スマートフォン','充電器','モバイルバッテリー','財布','身分証','乗車券','防寒着','厚手の靴下','歩きやすい靴','手袋','マフラー','折りたたみ傘','常備薬','スキンケア用品'];
export const effects=[{id:'bath',name:'温泉に入った',icon:'♨',max:{hp:10},current:{hp:20}},{id:'meal',name:'おいしいご飯を食べた',icon:'♜',max:{hp:5},current:{hunger:-30}},{id:'view',name:'絶景を見た',icon:'✧',max:{mp:10},current:{joy:10}},{id:'rest',name:'ホテルでのんびりした',icon:'☕',max:{mp:5},current:{mp:20}},{id:'sleep',name:'ぐっすり眠った',icon:'☾',max:{hp:5},current:{hp:30}}];
export const dates=['2026-10-31','2026-11-01','2026-11-02'];
export const themes=['冒険の始まり','天空の絶景を探せ！','冒険の終わり、そして帰還'];
export const at=(day,time)=>`${dates[day-1]}T${time}:00+09:00`;
// Public demo actions use the requested times, but all names and routes are fictional.
// Each row has its own safe instruction, full instruction and destination reveal time.
const demoRows=[
[['10:00','出発する','こもれびの家を出発'],['10:24','列車に乗る','花園駅から森の線へ'],['11:30','特急に乗る','風見駅から星の特急へ'],['13:37','列車を乗り換える','木の実駅に到着'],['13:52','列車に乗る','木の実駅から高原線へ'],['14:07','駅に到着する','白樺駅に到着'],['14:15','送迎バスに乗る','白樺駅から雲の宿へ'],['15:00','チェックインする','雲の宿にチェックイン'],['17:00','ひと休みする','雲のラウンジでのんびり'],['19:00','夕食・入浴を楽しむ','月の食堂・星の温泉']],
[['10:09','バスに乗る','雲の宿付近からバス'],['10:25','乗り換える','風の駅に到着'],['10:50','バスに乗る','風の駅から展望の丘へ'],['11:04','目的地に到着する','空色の丘に到着'],['11:10','散策を楽しむ','空色テラスを観光'],['13:10','バスに乗る','空色の丘からバス'],['13:18','目的地に到着する','ミルクの牧場に到着'],['13:20','ひと休みする','ミルクの牧場でおやつ'],['14:02','バスに乗る','ミルクの牧場からバス'],['14:15','乗り換える','風の駅に到着'],['15:10','バスに乗る','風の駅から草原へ'],['15:19','目的地に到着する','ひつじの草原に到着'],['15:20','散策を楽しむ','ひつじの草原を観光'],['16:04','バスに乗る','ひつじの草原からバス'],['16:14','宿の近くに到着する','雲の宿付近に到着'],['18:00','夕食・入浴を楽しむ','雲の宿で夕食・温泉']],
[['08:00','朝食を食べる','雲の宿で朝食'],['09:00','ひと休みする','雲の宿で最後の休息'],['11:00','チェックアウトする','雲の宿をチェックアウト'],['12:05','送迎バスに乗る','雲の宿から白樺駅へ'],['13:02','列車に乗る','白樺駅から高原線へ'],['13:17','乗り換える','木の実駅に到着'],['13:52','特急に乗る','木の実駅から星の特急へ'],['15:11','乗り換える','風見駅に到着'],['16:10','おうちへ帰る','こもれびの家へ帰宅']]];
export const actions=demoRows.flatMap((rows,d)=>rows.map(([time,safeText,detail],i)=>({id:`a${d+1}-${i}`,day:d+1,time,at:at(d+1,time),revealAt:at(d+1,time).replace(':00+09:00',':01+09:00'),safeText,detail,needsVerification:true,note: (d===1?'仮バス行程・未確認': '仮予定・要確認')})));
const groups=[
[ ['旅のはじまりをたどれ！',0,7,'14:08'],['秘密の拠点を発見せよ！',7,8,'15:01'],['回復の泉でひとやすみ',8,10,'19:01']],
[ ['天空の絶景を発見せよ！',0,5,'11:11'],['伝説のソフトクリームを手に入れろ！',5,8,'13:21'],['高原の動物たちを探せ！',8,13,'15:21'],['回復の拠点へ帰還せよ！',13,16,'18:01']],
[ ['最後の回復',0,3,'09:00'],['帰還クエスト',3,9,'12:00'],['QUEST COMPLETE!',9,9,'15:00']]];
export const quests=groups.flatMap((gg,d)=>gg.map(([title,start,end,reveal],i)=>({id:`q${d+1}-${i}`,day:d+1,title,revealAt:at(d+1,reveal),actionIds:actions.filter(a=>a.day===d+1).slice(start,end).map(a=>a.id),final:d===2&&i===2})));
// Route strings can include the NEXT destination. Delay the entire row until that visit.
for (const q of quests) for (const id of q.actionIds) {
 const a=actions.find(a=>a.id===id);
 if (Date.parse(a.revealAt)<Date.parse(q.revealAt)) a.revealAt=q.revealAt;
}
for(const [id,time] of [['a1-6','15:01'],['a3-3','13:03'],['a3-4','13:18'],['a3-6','15:12']]){
 const a=actions.find(a=>a.id===id);a.revealAt=at(a.day,time);
}
// Separate instances: multiple occurrences of an effect are independent.
export const recoveryEvents=[
['d1-rest','rest',1,'17:00','q1-1'],['d1-meal','meal',1,'21:00','q1-2'],['d1-bath','bath',1,'21:00','q1-2'],['d1-sleep','sleep',2,'09:00','q1-2'],
['d2-view','view',2,'12:00','q2-0'],['d2-snack','meal',2,'14:00','q2-1'],['d2-rest','rest',2,'18:00','q2-3'],['d2-meal','meal',2,'21:00','q2-3'],['d2-bath','bath',2,'21:00','q2-3'],['d2-sleep','sleep',3,'09:00','q2-3'],
['d3-meal','meal',3,'09:00','q3-0'],['d3-rest','rest',3,'09:00','q3-0']
].map(([id,effect,day,time,questId])=>({id,effect,day,availableAt:at(day,time),questId}));
export const statusPrompts=dates.map((date,i)=>({id:`night-${date}`,date,at:at(i+1,i===2?'15:00':'21:00')}));
