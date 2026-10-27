// 公開可能な架空データのみ。実旅程をここへコピーしないでください。
export const labels={hp:'HP',mp:'MP',hunger:'空腹度',joy:'幸福度'};
export const initial={bride:{hp:[30,100],mp:[20,80],hunger:[40,100],joy:[100,100]},groom:{hp:[40,100],mp:[30,80],hunger:[40,100],joy:[100,100]}};
export const items=['スマートフォン','充電器','モバイルバッテリー','財布','身分証','乗車券','防寒着','厚手の靴下','歩きやすい靴','手袋','マフラー','折りたたみ傘','常備薬','スキンケア用品'];
export const effects=[{id:'bath',name:'温泉に入った',icon:'♨',max:{hp:10},current:{hp:20}},{id:'meal',name:'おいしいご飯を食べた',icon:'♜',max:{hp:5},current:{hunger:-30}},{id:'view',name:'絶景を見た',icon:'✧',max:{mp:10},current:{joy:10}},{id:'rest',name:'ホテルでのんびりした',icon:'☕',max:{mp:5},current:{mp:20}},{id:'sleep',name:'ぐっすり眠った',icon:'☾',max:{hp:5},current:{hp:30}}];
const titles=[['冒険のはじまり','風の列車に乗って','秘密の拠点を発見！','回復の時間','今日もおつかれさま'],['自然探索へ出発','天空の絶景を発見せよ！','高原の宝物を探せ！','回復の拠点へ帰還せよ！','星空の休息'],['最後のリラックスタイム','帰還クエスト','QUEST COMPLETE!']];
export const quests=titles.flatMap((a,d)=>a.map((title,i)=>({id:`d${d+1}-${i}`,day:d+1,at:`${['2026-10-31','2026-11-01','2026-11-02'][d]}T${String([9,12,15,18,21][i]).padStart(2,'0')}:00:00+09:00`,title,location:['こもれびの出発広場','星の列車','雲の宿','月の温泉','星あかりの部屋'][i],detail:'これは架空のデモ予定です。ふたりのペースで、ひと休みしながら進もう。',verify:true})));
export const themes=['冒険の始まり','天空の絶景を探せ！','冒険の終わり、そして帰還'];
