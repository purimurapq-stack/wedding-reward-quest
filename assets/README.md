# キャラクター画像
assets/characters/にユーザーがアップロードした原本PNGが配置済みです。相対パスで全端末へ自動表示し、画像の端末アップロード・画像のlocalStorage保存は使いません。原本は加工していません。


# HOME背景
`assets/backgrounds/`にオリジナルのドット絵SVGを7枚配置しました。すべて配置済みで、外部画像の準備は不要です。

| 表示 | ファイル |
|---|---|
| 旅行前・教会 | wedding.svg |
| DAY1朝昼・出発 | departure.svg |
| DAY1夜・ホテル | hotel-night.svg |
| DAY2朝昼・山と草原 | meadow.svg |
| DAY2夜・幻想的な星空 | starlight.svg |
| DAY3・帰り道 | homeward.svg |
| 旅行後・エンディング | ending.svg |

差し替えるときはSVGを同名で置き換えるか、`src/home.js`の`homeBackgrounds`に相対パスを指定してください。推奨縦横比は320:200、キャラクターは画面下部中央に別レイヤーで表示されます。背景読込に失敗した場合はCSSの山・道・空を表示します。
