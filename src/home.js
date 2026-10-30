// HOMEの表示だけを決定するデータ。端末のタイムゾーンや保存データには依存しません。
export const homeBackgrounds={
 wedding:{src:'./assets/backgrounds/wedding.svg',label:'教会の前で迎える結婚式のエンディング'},
 departure:{src:'./assets/backgrounds/departure.svg',label:'電車と山々、冒険への出発'},
 hotelNight:{src:'./assets/backgrounds/hotel-night.svg',label:'山のホテルと満天の星空'},
 meadow:{src:'./assets/backgrounds/meadow.svg',label:'八ヶ岳の山々と青空の草原'},
 starlight:{src:'./assets/backgrounds/starlight.svg',label:'幻想的な星空と山々'},
 homeward:{src:'./assets/backgrounds/homeward.svg',label:'夕暮れの電車とおうちへの帰り道'},
 ending:{src:'./assets/backgrounds/ending.svg',label:'冒険を終えたふたりの温かなエンディング'}
};
export const homeChapters={
 before:{title:'二人の冒険、ふたたび。',message:['メインクエスト、おつかれさま！','食べて、休んで、幸せをレベルアップ。'],background:'wedding'},
 day1:{title:'冒険のはじまり',messages:{morning:['さあ、冒険の幕開けだ！','ふたりで最高の思い出を探しに行こう。'],afternoon:['新しい景色、新しい冒険！','寄り道もきっと、素敵な思い出になる。'],night:['今日の冒険、おつかれさま！','おいしいごはんでHPを全回復しよう。']},background:'departure',nightBackground:'hotelNight'},
 day2:{title:'八ヶ岳を大冒険！',messages:{morning:['冒険2日目、クエスト開始！','今日はどんな景色に出会えるかな？'],afternoon:['絶景を目指して、いざ出発！','ふたりの思い出をどんどん増やそう。'],night:['今日もたくさん冒険したね！','ゆっくり休んで、幸福度をチャージ。']},background:'meadow',nightBackground:'starlight'},
 day3:{title:'おうちに帰るまでが冒険',messages:{morning:['最終日も、のんびり楽しもう。','最後までふたりのペースで冒険だ！'],afternoon:['帰り道だって、冒険の一部。','おうちに着くまで気をつけてね。'],night:['おかえりなさい、勇者たち！','ふたりの冒険、大成功！']},background:'homeward'},
 after:{title:'二人の冒険、クリア！',message:['メインクエスト、クリア！','獲得した思い出は、一生の宝物。'],background:'ending'}
};
const homeDateFormatter=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'});
const homeHourFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',hourCycle:'h23'});
export function homePresentation(now){
 const date=homeDateFormatter.format(now),hour=Number(homeHourFormatter.format(now));
 const period=hour>=5&&hour<12?'morning':hour>=12&&hour<18?'afternoon':'night';
 const chapter=date<'2026-10-31'?'before':date>'2026-11-02'?'after':({'2026-10-31':'day1','2026-11-01':'day2','2026-11-02':'day3'})[date];
 const entry=homeChapters[chapter],background=period==='night'&&entry.nightBackground?entry.nightBackground:entry.background;
 return {key:`${chapter}:${entry.message?'fixed':period}`,chapter,period,title:entry.title,message:entry.message||entry.messages[period],background};
}
