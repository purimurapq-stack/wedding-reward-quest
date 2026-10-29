# 旅行前の最短手順 — GitHubのブラウザ画面だけ

**Google CloudとFirebaseは開かなくて大丈夫です。住所・支払い情報・有料プランの登録、PCへのソフトのインストール、コマンド操作は不要です。**

## 1. 新しい修正PRを確認してマージ

1. GitHubの `wedding-reward-quest` → **Pull requests** を開きます。
2. 今回の「ログイン不要・localStorage・GitHub Pages」への修正PRを開きます。
3. **Checks** で `Verify local travel RPG` が緑色の成功であることを確認します。テスト/ビルド/PNG確認はここで自動実行します。
4. 内容を確認し、反映してよければ **Merge pull request → Confirm merge**。

PR #1〜#3はすでにマージ済みなので、再操作は不要です。今回のPRだけを反映します。この時点でFirebaseへのデプロイは実行されません。

## 2. Pagesの配信方法を確認

1. リポジトリ上部の **Settings**。
2. 左メニュー **Pages**。
3. **Build and deployment → Source** を **GitHub Actions** にします。

リポジトリの公開/非公開設定や契約プランを変更する手順ではありません。既存のPagesが利用できる設定をそのまま使用します。もしここでアップグレードや支払いの画面が出た場合は、登録せず止めて、その画面の内容をCodexへ伝えてください。

今まで `Deploy from a branch / main / (root)` を使っていた場合、修正後のルートindex.htmlも相対パスで動作します。推奨のActions方式では、テストを通した小さなdistだけを公開し、Firebase退避資料などは配信しません。

## 3. 公開ボタンを押す

1. リポジトリ上部 **Actions**。
2. 左側 **Publish GitHub Pages**。
3. **Run workflow** を押します。
4. Branchは **main** のまま、緑色の **Run workflow**。
5. 新しい実行を開き、`build` と `deploy` が両方緑色になるまで待ちます。

このボタン操作が今回のPages公開操作です。内部でテスト→ビルド→GitHub Pages配信を行います。Google Cloud、Firebase、サービスアカウント、WIF、請求先の設定は使用しません。以前のFirebase公開ワークフローは退避済みで、今回は使いません。

`Publish GitHub Pages` が見えない場合は、手順1のマージ後にActions画面を再読み込みしてください。

## 4. サイトを開く

Settings → Pagesの **Visit site**、または成功したdeployのURLを開きます。

通常のURL例：
- 新郎：`https://purimurapq-stack.github.io/wedding-reward-quest/?role=groom`
- 新婦：`https://purimurapq-stack.github.io/wedding-reward-quest/?role=bride`

新郎と新婦はそれぞれ自分のURLをスマホの通常ブラウザでブックマークしてください。ログインボタンはなく、そのまま遊べます。元PNGも自動で表示されます。

## 5. 旅行前の確認

- HOMEに2人の画像・ステータス・NEXT ACTIONが出る
- QUESTを開き、新婦URLでは詳細、新郎URLでは未訪問地が「？？？」になる
- ITEMを1つチェックし、画面を再読み込みしてもチェックが残る
- SETTINGSからオープニングを再視聴できる

古いGoogleログイン画面が残る場合は、PCならCtrl+F5、スマホなら一度ページを閉じてURLから開き直します。**サイトデータや履歴全体を削除する必要はありません。** それを削除するとlocalStorageのセーブが消えることがあります。

ステータス・クエスト達成・持ち物は端末ごとに独立しています。相手の端末へ同期しません。旧端末データが同じブラウザ/同じPagesサイトにあれば自動で引き継ぎますが、Firebaseサーバーのデータを取得する処理はありません。

旅行前のデモ日時変更でイベントを達成すると、その達成も保存されます。今すぐ確認するなら画像・しおり・持ち物・再視聴を中心に確認し、本番の回復イベントは旅行中に楽しんでください。

## Codex/Actionsが行うことと、あなたの操作

| Codex/Actionsが用意・実行 | あなたがブラウザで操作 |
|---|---|
| Firebase接続を外し、全ゲーム状態を端末保存 | 今回のPRを確認してマージ |
| 原本PNGを自動表示、パスとファイルを検証 | PagesのSourceをGitHub Actionsに設定 |
| テスト・ビルド・配信ファイルの作成 | Publish GitHub PagesのRun workflow |
| 手動実行後のPages配信 | 完了URLを開き、スマホで確認 |

今回の変更作成では、Codexはmainへのマージ・サイト公開を行いません。ブラウザで上記を承認してから反映してください。
