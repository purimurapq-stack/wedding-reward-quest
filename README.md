# 結婚式お疲れ様旅行 — クリア後のごほうびクエスト
既存の旅行RPGにGoogleログインと夫婦の共有保存を追加した静的Webアプリです。HOME / QUEST / STATUS / ITEM / SETTINGS、実旅程、NEXT ACTION、22秒のオープニング、成長演出を維持しています。

**この変更はデプロイしていません。本番データ・本番ルールを変更していません。許可UIDは空欄なので初期状態は全員アクセス拒否です。**

## 今回の保存方式
| データ | 保存先 |
|---|---|
| 2人の現在値・最大値、回復イベント達成、クエスト達成、夜の数値記録 | Cloud Firestoreの1つの共有ドキュメント |
| 持ち物チェック、演出設定、初回再生済み、通知確認、旅程の端末内編集 | 各端末のlocalStorage |
| 新郎/新婦のキャラクター画像 | リポジトリのassets（自動読込） |
| 新郎/新婦の表示モード | URLのroleパラメータ |

持ち物はFirestoreへ一切送信しません。共有値はログイン・許可・サーバーからの取得が確認できるまで表示しません。匿名、未許可アカウント、読取拒否、エラー、取得中は案内画面になります。ログアウト時も共有値を消します。

GoogleのUIDで許可と本人の編集対象を判定します。`?role=bride` を付けても新婦のGoogle権限にはなりません。ログインUIDが新郎なら、URLが新婦表示でも現在値の編集は新郎だけです。

- `?role=bride`：新婦表示。旅程をすべて閲覧・端末内編集
- `?role=groom` またはパラメータなし：新郎表示。未訪問の場所名を「？？？」で表示

URL制御は演出上のネタバレ防止だけで、機密保護ではありません。実旅程はJavaScriptに収録しています。

## キャラクターPNG
自動で以下の相対パスを読み込みます。アップロードUIと画像のlocalStorage保存は削除しました。

- `assets/characters/character_hanayome_01_black.png`
- `assets/characters/character_hanamuko_gray_black.png`

**チャット内の画像は見えていますが、元PNGのファイルID/ローカルファイルが提供されていないため、この2ファイルの配置はまだ完了していません。** 元のPNGをこの場所へ保存してください。別のイラストは作成していません。画像ファイル未配置時だけ代替ラベルを表示します。

`src/visuals.js` の相対パスを全画面で共通使用。`object-fit:contain` と `image-rendering:pixelated` で比率と輪郭を維持。結婚式シーンだけ2人のジャンプをずらし、帰宅シーンでは止めます。GitHub Pagesの `/wedding-reward-quest/` 配下でもFirebase Hostingのルートでも同じ相対パスで動作します。

## Windows PCでの準備
1. Node.js公式サイトから **Node.js 22 LTS以降** をインストールします。
2. GitHubで今回の作業ブランチを選び、緑色の **Code → Download ZIP** でダウンロードし、展開します。既存の別作業フォルダと取り違えないようにしてください。
3. 展開したフォルダをエクスプローラーで開き、アドレス欄に `cmd` と入力してEnter。コマンドプロンプトがそのフォルダで開きます。
4. 次を順に実行します（通常テストとビルドだけならnpm install前でも動きます）。

```bat
npm install
npm test
npm run build
npm run dev
```

表示された `http://localhost:5173` をブラウザで開きます。終了はコマンドプロンプトでCtrl+Cです。HTMLをダブルクリックするfile://方式ではGoogleログインは使えません。`reward-quest-preview.html` は演出・公開UIの確認用です。

## Firebase Consoleで実施すること
既存の **wedding-reward-quest** プロジェクトを開きます。サービスアカウント秘密鍵の作成・ダウンロードは不要です。

### 1. Googleログインを有効にする
1. **Authentication → Sign-in method（ログイン方法）→ Google** を選びます。
2. 有効にし、プロジェクトのサポート用メールアドレスを選んで保存します。
3. **Authentication → Settings → Authorized domains（承認済みドメイン）** を確認します。
4. ローカル確認用に `localhost` を追加します（新しいFirebaseプロジェクトでは自動登録されない場合があります）。
5. Hosting公開時には `wedding-reward-quest.web.app`、必要に応じて `wedding-reward-quest.firebaseapp.com` を確認します。GitHub Pagesからログインする場合は `purimurapq-stack.github.io` も追加します。ここはパスを含めずホスト名だけです。

### 2. Firestoreを確認する
1. **Firestore Database** を開きます。既にデータベースがある場合は削除・再作成しないでください。
2. まだなければデフォルトデータベースを **本番モード（初期拒否）** で作成します。テストモードの全開放ルールは使いません。
3. データの保存先は `couples/wedding-2026` です。既存の別パスのデータを自動移行・上書きする機能はありません。

### 3. 新郎・新婦のUIDを調べる
1. ローカルサイトのSETTINGSから **Googleでログイン** を押します。
2. まだUID未登録なので、共有データは表示されません。設定用のFirebase UIDは画面に表示します。
3. 新郎・新婦それぞれのGoogleアカウントで一度ログインしてください。Authentication → UsersでもUIDをコピーできます。メールアドレスではなく **UID** を使用します。
4. `src/firebase-config.js` をメモ帳/エディターで開き、次の空欄をそれぞれ埋めて保存します。

```js
export const allowedUsers = {
  groom: '新郎のFirebase Authentication UID',
  bride: '新婦のFirebase Authentication UID'
};
```

2人は異なるUIDが必要です。片方でも空欄ならアプリ・ルールとも共有データへのアクセスを拒否します。`firebaseConfig` は今回提供いただいたWeb設定を登録済みです。これは公開識別情報で、秘密鍵ではありません。サービスアカウントJSONやAdmin SDK秘密鍵はリポジトリに入れないでください。

## Security Rulesの確認と適用
まずPCのコマンドプロンプトで実行します。

```bat
npm run rules:generate
npm test
```

`firestore.rules` が2人のUID、既存のイベント報酬、クエスト解放時刻に合わせて生成されます。**生成だけでは本番に反映されません。** `rules:generate` はクラウド接続しません。生成ファイルを手編集するより、`src/firebase-config.js` と `src/data.js` を編集して再生成してください。

ルールは以下を検証します。
- Googleログイン済み、UIDが明示した2人のどちらか
- `couples/wedding-2026` 以外を拒否。ドキュメントの一覧取得・削除も拒否
- 初回作成は固定初期値だけ。既存データの初期化・巻き戻しを許可しない
- 許可フィールドだけ、正しいスキーマ、整数、0〜最大値、最大10000の値
- 回復は既知のイベントID、サーバー時刻が解放後、未達成であること
- 両者への最大値/現在値の増分が正確に報酬設定と一致すること
- クエストは解放済みの既知IDを一度だけ記録、達成時刻はサーバー時刻
- 夜の現在値編集はGoogle UIDに対応する本人のみ。最大値・他人の値・達成履歴を勝手に変更できない
- リビジョンを1だけ増加し、更新日時をサーバー時刻にすること

### Emulatorでルールをテストする
ルールの本当の評価は通常のNodeテストとは別です。PCにJava 21（JDK）をインストールしてから実行します。

```bat
npm run test:rules
```

このコマンドは `demo-wedding-reward-quest` の **ローカルEmulatorだけ** を使い、本番へ接続しません。匿名/未許可/他人編集/過大報酬/二重加算/未来イベント拒否/同時達成を確認します。正常系テストの時刻だけをEmulator内のテスト用ルールで過去にしています。本番のfirestore.rulesは書き換えません。

### 本番ルールの反映（内容を確認・承認した後だけ）
先にConsoleの **Rules** で現在のルールをコピーしてバックアップしてください。この生成ファイルは他のコレクションを拒否するため、同じFirebaseプロジェクトで他アプリを使っている場合は、その既存ルールを維持する統合作業が必要です。無条件で上書きしないでください。

内容とEmulator結果を確認し、反映してよいと判断した段階で実行します。

```bat
npx firebase login
npx firebase projects:list
npx firebase deploy --only firestore:rules --project wedding-reward-quest
```

`projects:list` の名前/IDを必ず確認します。`--only firestore:rules` を付け、データ削除やインデックス削除は行いません。この作業では私の側から本番ルールを適用していません。

Consoleで適用する場合は、レビュー済みfirestore.rulesの内容を **Firestore Database → Rules** へ貼り付けてPublishします。CLIかConsoleのどちらか一方で十分です。

## ローカルで2人の同期を確認
1. UID/Rulesを設定したら、`npm run build` と `npm run dev` を実行し、再読み込みします。
2. 既存ドキュメントがない場合だけ、許可アカウントでSETTINGSの **共有データを新規作成** を押します。初期値から作成します。トランザクションで既存ドキュメントを再確認し、存在すれば上書きせず停止します。
3. 別のブラウザ/シークレットウィンドウで、もう一方のGoogleアカウントでログインします。
4. 表示URLは新郎なら `http://localhost:5173/?role=groom`、新婦なら `http://localhost:5173/?role=bride` です。
5. 実際の解放時刻を過ぎたイベントを達成すると両画面へ反映されます。共有書き込みはデモ時計では早送りできません。旅行前の報酬テストはEmulatorで行ってください。
6. 持ち物をチェックし、別ブラウザのチェックが変わらないことを確認します。
7. 未許可の第三アカウントと未ログインでは共有ステータスが表示されないことを確認します。

Firestoreは1ドキュメントのトランザクションで、イベントID確認・2人の成長・達成履歴をまとめてコミットします。複数端末の同じイベント操作は再試行後に既達成として処理し、二重加算しません。オフラインの共有更新は成功扱いにせず、案内します。キャッシュだけのスナップショットを初回のアクセス許可の証拠にはしません。

## Firebase Hosting公開（公開を確認・承認した後だけ）
設定ファイルは `.firebaserc`、`firebase.json`、`firestore.indexes.json` を追加済みです。配信対象は既存と同じ静的な `dist/` だけ。Functions、Admin SDK、Storageアップロード、Analytics、サーバー実装は使いません。Sparkプランの範囲で始められる構成ですが、Firestore等の無料枠・利用量はConsoleで確認してください。

公開前に確認する項目：PNG2枚の配置、UID2件、Googleログイン有効化、承認済みドメイン、ルールのEmulatorテストとレビュー、ローカル表示/同期/非許可拒否。既存Hostingサイトがある場合は、デプロイがそのサイトの内容を置き換えるため、プロジェクトとサイトの対象を確認してください。

```bat
npm run rules:generate
npm test
npm run test:rules
npm run build
npx firebase deploy --only hosting --project wedding-reward-quest
```

公開URLの例は `https://wedding-reward-quest.web.app/?role=groom` と `https://wedding-reward-quest.web.app/?role=bride`。実際のURLはCLI出力で確認します。この作業では公開していません。

GitHub Pagesも `dist/` の内容を配信できます。ルート絶対パスを追加していないため既存のリポジトリ名付きパスを維持します。GoogleログインにはGitHub Pagesのホスト名の登録が別途必要です。Pagesのワークフローや既存設定を勝手に変更していません。

## 旧保存データについて
旧キー `reward-quest-v1` のステータス・記録は残します（不要になった画像データだけ除去）。持ち物・演出・旅程編集・通知確認は新しい端末内キー `reward-quest-local-v3` へ引き継ぎます。共有データへは自動投入しません。

SETTINGSのバックアップは現在表示できる状態と旧端末バックアップを含みます。旧ステータスをFirestoreへ移す場合は、既存の共有データとどちらを採用するか確認する別作業が必要です。このPRでは本番データのインポート/上書き機能は実装していません。

## ソースの構造
- `src/itinerary.js`：実旅程の初期値（今回時刻変更なし）
- `src/data.js` / `src/domain.js`：成長・解放・通知・旅程編集の既存ロジック
- `src/firebase-config.js`：Web設定、UID2人、共有ドキュメントのパス
- `src/firebase-client.js`：Google認証、購読、Firestoreトランザクション
- `src/shared-state.js`：共有フィールド、共有コマンド、本人編集の検証
- `src/storage.js`：端末設定と共有値の合成、旧保存移行
- `scripts/firestore-rules.mjs`：UID・報酬・解放時刻からルールを生成
- `tests/firebase/`：ローカルEmulator用Security Rulesテスト

画面内で変更した旅程は端末内の表示設定です。Firestore Rulesの報酬と解放条件を変更する場合は、ソースを変更しルール再生成/レビュー/テストが必要です。URLやデモ時計は認可に使いません。

## 実施した検証・残件
Nodeの通常テストではゲーム数値・重複・マスク・旅程/便切替・旧保存、共有/非共有の分離、未許可時のFirestore未購読、模擬SDKでのトランザクション重複防止/本人編集/ログアウト消去、生成ルールの整合性、簡易DOMでの5画面/表示拒否/チェック部分更新を検証します。

開発環境のネットワーク制約でテスト用npmパッケージを取得できないため、**EmulatorでのSecurity Rules評価は未実施**です。Google実ログイン・Firestore実同期・iPhone/Android実機テストも未実施。これらと元PNG配置、UID登録、ルール適用、Hosting公開は上記手順で実施してください。通常テストの成功をSecurity Rulesの実評価の代わりにはしません。
