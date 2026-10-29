# PCへのインストールなしで設定・公開する手順

この手順ではブラウザだけを使います。Node.js、Java、Firebase CLI、Git、ZIP展開はPCに不要です。インストールとコマンドはGitHub Actionsの一時的な実行環境で自動実行します。

**この変更を作っただけでは公開されません。本番ルールも変わりません。** まずコードをレビューし、承認した変更をmainへ統合してください。

## 何が自動で、何をクリックするか

| 作業 | 担当 |
|---|---|
| 依存関係、Node.js、Javaの準備 | GitHub Actionsが自動 |
| 本番ルール生成、通常テスト、Emulator検証、ビルド | GitHub Actionsが自動 |
| 検証済み成果物と依存関係ロックの保存 | GitHub Actionsが自動 |
| 元PNGのアップロード、Googleログイン有効化、UID登録 | あなたがブラウザで操作 |
| Google CloudとGitHubの鍵なし認証の初回接続 | あなたがブラウザで操作 |
| 検証結果・適用するルールの確認 | あなたが確認 |
| 対象コミットと範囲を指定した公開承認 | あなたがActionsで手動操作 |
| 承認対象・Emulator成功・成果物の整合性を再確認 | GitHub Actionsが自動 |
| Firebase Hosting/承認した場合だけRulesを適用 | GitHub Actionsが自動 |
| 2端末のログインと操作確認 | あなたがブラウザ/スマホで操作 |

Codexはコード・テスト・手順を作成します。Googleアカウント選択、クラウドの権限付与、公開承認はあなたの操作です。本番データを自動で移行・初期化・削除するワークフローはありません。

## 1. GitHubの変更を確認する

リポジトリは `purimurapq-stack/wedding-reward-quest` です。既存の試作品PR、そのFirebase改修PR、今回のActions改修PRは依存しています。今回のPRはFirebase改修ブランチ向けで、mainを変更していません。

PR画面の **Checks** から **Verify travel RPG / Verify and package** を確認します。初回はActionsを有効にする確認が表示されることがあります。リポジトリの **Settings → Actions → General** でGitHub公式/Google公式Actionsが利用可能か確認してください。秘密鍵をPRのコメントやログへ貼り付ける必要はありません。

レビューして統合してよいと判断したら、依存するPRを内側から順にマージし、最後に既存試作品をmainへ統合します（今回のActions → Firebase改修 → 既存試作品）。Draftの場合は先に **Ready for review**。途中の作業ブランチはすべて統合し終わるまで削除しないでください。この作業はコード統合であり、サイト公開ではありません。

**mainへのpushでもテストだけです。公開は手動承認まで実行されません。** 手動ワークフローのボタンはワークフローファイルがデフォルトブランチmainに入った後に表示されます。

## 2. Firebase Consoleの初回設定

[Firebase Console](https://console.firebase.google.com/) で **wedding-reward-quest** を開きます。

1. **Authentication → Sign-in method（ログイン方法）→ Google** を有効にし、サポートメールを選択して保存。
2. **Authentication → Settings → Authorized domains** で `wedding-reward-quest.web.app` と `wedding-reward-quest.firebaseapp.com` を確認します。GitHub Pagesも使うなら `purimurapq-stack.github.io` を追加します。
3. **Firestore Database** を開きます。未作成なら **本番モード** で作成します。テストモードの全開放ルールは使いません。既存データベースは削除・再作成しません。
4. 同じFirebaseプロジェクトに他アプリやデータがある場合、現在の **Rules** の内容を安全な場所へ保存します。今回の生成ルールは他コレクションを拒否します。既存アプリのルールを維持する統合が必要なら、適用前にCodexへ相談してください。

Sparkプランのまま始められる静的構成です。Googleログイン・Firestore・Hosting・下記のOIDCで、Functionsや有料サーバーは作りません。無料枠とGitHub Actionsの利用枠は各Consoleで確認してください。

## 3. 画像をGitHubに置く

GitHubの対象ブランチで **assets → characters → Add file → Upload files** を開き、元PNGを2枚アップロードします。

- `character_hanayome_01_black.png`
- `character_hanamuko_gray_black.png`

**Commit changes** で確定します。画像内容は変更しません。ファイル名の大文字小文字も一致させます。リポジトリに保存した原本を全端末が自動で読み込み、アップロードUIや画像の端末保存はありません。現在、チャット表示の画像は確認できていますが元PNGファイルが開発ツールへ渡っていないため、このファイル配置はまだ完了していません。

## 4. Google CloudとGitHubを一度だけ接続する（秘密鍵を作らない）

ここは最初だけ必要なブラウザ操作です。Firebaseの歯車 → **プロジェクトの設定** でプロジェクトIDを確認し、[Google Cloud Console](https://console.cloud.google.com/) でも同じ **wedding-reward-quest** を選びます。別プロジェクトと取り違えないでください。

認証方式は **Workload Identity Federation（OIDC）**。GitHubが実行ごとに短時間だけ有効な認証を受け取ります。サービスアカウントのJSON秘密鍵は作成・ダウンロード・GitHub保存しません。

### 4-A. 必要なAPIを有効にする

Google Cloudの **APIとサービス → ライブラリ** で、以下が未有効なら有効にします。

- IAM Service Account Credentials API
- Security Token Service API
- Firebase Management API
- Firebase Hosting API
- Firebase Rules API
- Cloud Firestore API
- Cloud Resource Manager API

既存のFirebaseプロジェクトでは一部がすでに有効です。請求先やプラン変更を求められた場合はその場で進めず、画面のサービス名を確認してください。

### 4-B. 公開用サービスアカウントを作る

**IAMと管理 → サービスアカウント → サービスアカウントを作成**。

名前の例：`github-firebase-deploy`。プロジェクトへの権限は次に限定します。

| 役割名 | 役割ID |
|---|---|
| Firebase Hosting Admin | `roles/firebasehosting.admin` |
| Firebase Rules Admin | `roles/firebaserules.admin` |
| Firebase Viewer | `roles/firebase.viewer` |
| Service Usage Consumer | `roles/serviceusage.serviceUsageConsumer` |

Owner/EditorやFirestore Data Ownerは付与しません。このアカウントはHostingとRulesのデプロイ用で、アプリのデータ操作には使いません。**鍵（Keys）は作成しません。** 作成したメールアドレスをコピーします（`github-firebase-deploy@wedding-reward-quest.iam.gserviceaccount.com` のような形式）。

### 4-C. Workload Identityのプールとプロバイダを作る

**IAMと管理 → Workload Identity連携** を開きます（見つからなければConsole上部検索で「Workload Identity Federation」）。

1. プール作成。名前例 `GitHub Actions`、ID例 `github-actions`。リージョンはglobal。
2. プロバイダを追加し、種類は **OpenID Connect（OIDC）**。
3. プロバイダID例 `github`、発行元URLは `https://token.actions.githubusercontent.com`。
4. オーディエンスはデフォルトを使用します。
5. 属性マッピングを登録します。

| Google属性 | 値 |
|---|---|
| `google.subject` | `assertion.sub` |
| `attribute.repository` | `assertion.repository` |
| `attribute.ref` | `assertion.ref` |

6. **属性条件（Attribute condition）** には次を指定します。ほかのリポジトリ、PR、別ブランチや別ワークフローから認証させない条件です。

```text
assertion.repository == 'purimurapq-stack/wedding-reward-quest' &&
assertion.repository_id == '1435686142' &&
assertion.ref == 'refs/heads/main' &&
assertion.event_name == 'workflow_dispatch' &&
assertion.workflow_ref == 'purimurapq-stack/wedding-reward-quest/.github/workflows/deploy.yml@refs/heads/main'
```

7. 保存後、プールの **アクセス権を付与（Grant access）** から「サービスアカウントを使用してアクセス」を選び、4-Bのアカウントを指定します。
8. 属性でIDを選別する場合は `repository` の値を `purimurapq-stack/wedding-reward-quest` に限定します。`roles/iam.workloadIdentityUser` の付与が必要です。「すべてのID」を無条件で許可しないでください。

付与されるプリンシパルは次の形式です。`PROJECT_NUMBER` はGoogle Cloud/Firebaseのプロジェクト番号（プロジェクトIDとは別）です。Consoleの選択画面から付与すれば手入力を避けられます。

```text
principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/attribute.repository/purimurapq-stack/wedding-reward-quest
```

9. プロバイダ詳細のリソース名をコピーします。

```text
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/providers/github
```

### 4-D. GitHubに公開用の接続先を登録する

GitHubリポジトリの **Settings → Secrets and variables → Actions → Variables → New repository variable**。

| Variable名 | 値 |
|---|---|
| `WIF_PROVIDER` | 4-Cでコピーしたプロバイダのリソース名 |
| `WIF_SERVICE_ACCOUNT` | 4-Bでコピーしたサービスアカウントのメールアドレス |

この2つは公開の識別子であり、秘密鍵ではないので **Variables** を使用します。**SecretsへJSON鍵を保存する方式ではありません。** GitHubは公開の手動ジョブだけでOIDC権限を取得し、一時認証ファイルは一時ランナーで後始末されます。検証用ジョブにはクラウド認証権限がありません。

## 5. UIDをFirebase Consoleから取得する

### すでに2人がGoogleログイン済みの場合

**Firebase Console → Authentication → Users（ユーザー）** を開きます。メールアドレスで新郎・新婦を探し、Googleプロバイダのユーザー行/詳細から **ユーザーUID** をコピーします。メールアドレスやGoogleの顧客IDではありません。

### Usersにまだ表示されない場合

**Googleログインを1回する前はUIDが存在しません。Consoleの「ユーザーを追加」でメール/パスワードユーザーを作成しないでください。** このアプリが許可するのはGoogleログインです。

PCの開発環境は不要です。次の「6」の手順で、UID空欄の状態の成功したmain検証を使い、最初は **hosting-only** を手動承認して公開します。Firestoreは本番モードのアクセス拒否を維持し、Rulesはこの時点では変更しません。

1. 公開されたサイトを開き、SETTINGS → **Googleでログイン** を押します。
2. 新郎のGoogleアカウントを選びます。「未許可/UID未登録」はこの段階では正常です。共有データは読み込みません。
3. ログアウトし、新婦のGoogleアカウントでも行います。別のスマホ/ブラウザでも構いません。
4. **Firebase Console → Authentication → Users** を更新すると、2人のGoogleユーザーが表示されます。それぞれのUIDをコピーします。サイトのSETTINGSにもログインしたUIDが表示されます。

### UIDをGitHub画面で登録する

1. GitHubで **main → src → firebase-config.js → 鉛筆（Edit this file）**。
2. 次の空欄だけを変更します。

```js
export const allowedUsers={
  groom:'新郎のFirebase UID',
  bride:'新婦のFirebase UID'
};
```

3. 「変更用の新しいブランチを作成してPR」を選び、PRを作成します。Codexへ2つのUIDを伝えて登録を依頼しても構いません（UIDは秘密鍵ではありません）。
4. Checksが成功したら内容を確認し、mainへマージします。
5. **firestore.rulesを手作業で書き換えたり、PCで生成したりする必要はありません。Actionsが登録UIDから生成して検証します。** 生成された本番Rulesはその実行のArtifactsに含まれます。ソースのfirestore.rulesは初期拒否のひな形のままでも、CI内で最新UIDに更新してテストします。

片方だけ登録するとリリース作成を失敗させます。両方空欄（初期設定）か、異なる2人のUIDを登録してください。

## 6. 成功した検証を見て、手動で公開を承認する

### 6-A. 検証結果を確認する

1. GitHubの **Actions → Verify travel RPG** を開きます。
2. **mainへのpush** またはmain上の手動検証で、緑色の成功になった実行を開きます。PRの成功結果は本番公開には使えません。
3. Summaryに表示される **検証実行番号** と **40文字のコミットSHA** をコピーします。
4. Summaryの **適用予定の本番Rules** に生成ルール全文を表示します。ブラウザだけで確認でき、ダウンロード不要です。配信ファイルも見たい場合だけArtifactsの `firebase-release-コミットSHA` をダウンロードできます。秘密鍵は含みません。

この検証は依存関係インストール、ルール生成、通常テスト、**実際に適用するRulesファイルのEmulatorコンパイル/許可・拒否確認**、正常系/不正操作/同時実行のEmulatorテスト、ビルドを実行します。失敗した場合は公開せず、Actionsの実行URLをCodexへ伝えてください。

初回はリポジトリにpackage-lock.jsonがないためActionsで生成します。検証済みのロックファイルを成果物へ保存し、公開ジョブはその同じ依存関係をnpm ciで使用します。公開直前に別のバージョンへ解決し直しません。

### 6-B. 承認を入力する

1. **Actions → Approve and deploy Firebase → Run workflow**。
2. ブランチは **main**。
3. 以下を入力します。

| 欄 | 入力 |
|---|---|
| verification_run_id | 成功したmain検証の実行番号 |
| commit_sha | 同じ実行の40文字コミットSHA |
| scope | 初回UID取得用は `hosting-only`、UID登録後のルール適用は `hosting-and-rules` |
| approval | `DEPLOY ` に続けて同じコミットSHA（半角空白を1つ） |
| rules_approval | Rulesも適用する場合だけ `APPLY VERIFIED RULES` |

4. 適用先が **wedding-reward-quest** であることを確認し、公開してよい場合だけ **Run workflow** を押します。

**このRun workflow操作を明示的な公開承認として扱います。** 検証前の実行、失敗/未実行のEmulator、PR成果物、別SHA、別リポジトリ、mainが移動した古い承認は拒否します。Rulesには別の承認入力が必要です。PushやPRから公開は始まりません。誰がどのコミット/範囲を承認したかはActionsの履歴とSummaryに残ります。

GitHub Environmentsの「Review deployments」は非公開リポジトリでプランに制約があるため必須にしていません。本構成は無料枠でも利用できる手動workflow_dispatch承認を必須にします。別の人のレビューを必須にする運用まで必要なら、利用プランに応じてRequired reviewersの追加が別途必要です。現時点で二者承認とは主張していません。

公開先：
- 新郎表示：`https://wedding-reward-quest.web.app/?role=groom`
- 新婦表示：`https://wedding-reward-quest.web.app/?role=bride`

UID登録後にHostingとRulesを反映してから再読み込みし、許可Googleアカウントでログインしてください。共有データがない場合のみ、SETTINGSの「共有データを新規作成」を押します。既存ドキュメントは上書きしません。

## 7. 最後に確認すること

2人の端末でログインし、ステータス/達成が同期すること、同じイベントを連打/同時操作しても二重加算されないこと、持ち物は別々であることを確認します。未ログイン/第三アカウントでは共有値が出ないことも確認してください。

デモ日時は表示確認だけです。本番のイベント達成は実際の時刻とRulesで判定されます。旅行前の成長テストはActionsのEmulatorテストで実施します。

Rules適用は既存プロジェクトのアクセス設定を変更し、Hosting公開は既存サイトの配信内容を更新します。対象と差分を確認してから上記の明示承認を行ってください。コード作成時点ではCodex側でこれらを実行していません。
