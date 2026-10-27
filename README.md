# 結婚式お疲れ様旅行
「クリア後のごほうびクエスト」スマートフォン向けRPG試作品。依存パッケージなし、HTML / CSS / ES Modules、Node.js 20以上。

## 起動・検証
```sh
npm run dev
# http://localhost:5173
npm test
node tests/domain.test.js
node tests/policy.test.js
npm run build
node scripts/serve.mjs --dist
```
`dist/` だけが公開成果物です。開発サーバーもホワイトリスト方式で private/、server/、.git を返しません。実機Safari/Chromeでの確認は別途必要です。

## 遊び方
初回は10秒・8秒・12秒のプロローグ。最後に開始ボタンが出ます。スキップ、設定から再視聴、端末の動きを減らす設定に対応。動きを減らす場合は手動でシーンを送れます。
HOME / QUEST / STATUS / ITEM / SETTINGS の5画面。設定でデモの新郎・新婦を切り替え、デモ日時を旅行中にするとクエスト解放を試せます。日時は日本時間、実時刻モードでは1秒ごとと復帰時に解放を判定。未解放クエストは名称・場所を画面に表示しません。

イベントは「日×イベントID」につき1回。最大値成長と現在値変化を両者へ同時適用。現在値は0〜最大値に制限。幸福度は初期上限100なので絶景で+10しても上限を超えません。空腹度は高いほど空腹。現在値入力は選択中のプレイヤーだけを更新します。

## 編集するファイル
- `src/data.js`: 初期ステータス、効果、持ち物、13件の架空解放予定
- `src/domain.js`: 共有イベント・数値更新・日本時間
- `src/storage.js`: localStorageアダプター。ログイン・クラウド移行点
- `src/app.js` / `src/style.css`: UI、30秒演出、差し替え用SVG
- `private/itinerary.json` / `private/transport.json`: 実旅程と交通情報。Git除外、ビルド除外、HTTP非公開。別途安全な保管が必要
- `server/policy.js`: 将来のサーバー向け権限フィルター（APIそのものは未接続）

実旅程はDAY2の全仮バス便を含め初期登録済み。曖昧な朝・夕方の時間も仮置きです。すべての交通時刻を要確認として扱い、公式時刻表との照合は未実施です。訪問予定と公開時刻を個別設定し、公開時刻は初期値で訪問予定の1分後です。集合時刻・服装は目的地から独立した公開情報として管理してください。

## サプライズ保護とクラウド接続
**現状は架空デモ専用です。設定のプレイヤー選択は認証ではありません。実旅程をsrcやdistへ入れてはいけません。** 静的GitHub Pagesだけでは実旅程の秘密や共有データを守れません。

本番の推奨構成は Firebase Authentication + Cloud Functions + Firestore。
1. 非公開Firebaseプロジェクトを作り、2人のアカウントを登録。Admin SDKでUIDに `role: groom/bride` と同じ `coupleId` のカスタムクレームを付与。クライアントのrole指定は信用しない。
2. 実旅程はサーバー専用コレクションに置く。Firestore Rulesでクライアントからの実旅程読み書きと共有ステータスへの直接書き込みを拒否する。Admin SDKの鍵はサーバー環境変数/Secret Managerへ。`.env`はGit除外。FirebaseのWeb設定は認可の代わりにはならない。
3. 認証済みCallable Function `getSchedule` はIDトークンのrole/coupleIdを検証し、新婦には全件、新郎にはサーバー現在時刻がrevealAt以上の行だけ返す。`server/policy.js` がフィルター例。URLパラメータ・ブラウザ時計・localStorageは権限判断に使わない。レスポンスは `Cache-Control: private, no-store`。未来データはHTML・JS・ソースマップ・プリロードにも含めない。
4. `completeEvent` はcoupleIdに紐づく共通ドキュメントをFirestoreトランザクションで読み、「日×ID」の重複確認、サーバー設定の効果計算、両者更新、達成保存を1トランザクションで行う。クライアントから効果値を受け取らない。失敗時は全体をロールバック。
5. `setCurrent` はトークンの本人だけ変更可能にし、0〜サーバー最大値で検証する。共有データの読取は同じcoupleIdの2人だけ。Firestore購読で両端末を更新。
6. `repository` を上記API・購読に差し替え、デモ役割と時刻操作を本番では削除。認証前は実旅程を返さず、認証・時刻境界・他人のUID・二重達成・同時操作をEmulator Suiteで検証してから実旅程を有効にする。

現在のlocalStorageは端末内のみ。別端末に共有されません。Web Locks対応ブラウザでは同じ端末の複数タブの更新を直列化し、非対応環境では単一タブ利用を前提にしています。保存不可・不正データ時はエラー表示。設定からJSONバックアップ可能、復元UIは未実装。

## GitHub反映・公開
変更は作業ブランチにコミットしてpushし、mainに取り込む前に差分を確認してください。
```sh
git checkout -b feat/reward-quest-prototype
git add README.md package.json index.html .gitignore src scripts tests server assets private/README.md
git commit -m "Build wedding reward quest prototype"
git push -u origin feat/reward-quest-prototype
```
実旅程JSONはpush対象外。ローカルのprivateフォルダは別途安全にバックアップしてください。

一般公開はユーザー承認後に実施します。承認後は `npm run build` のdist内容だけをPagesの配信ブランチ等へアップロード。Actionsによる自動公開はこの試作品では追加していません。実旅程を使う場合は先に認証済みAPIを構築し、Pagesはフロントのみ配信します。

## 未実装・検証範囲
Firebase実接続、ログイン、実端末間同期、本番API、公式時刻表確認、実機Safari/Chrome検証は未実施。日記・写真・音声は対象外。テストは数値上限/下限・共有成長・重複達成・本人更新・JST日付・解放境界・サーバーポリシーを確認します。ビルドは公開対象を許可リストでコピーし、主要な実目的地の混入を検査します。
