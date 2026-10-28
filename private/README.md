# 非公開の管理データ
実旅程 `itinerary.json` と交通情報 `transport.json` は .gitignore 対象。公開リポジトリ・静的ホスティングへアップロードしないでください。初期値は依頼の仮予定であり、公式確認済みではありません。夕方・朝などの曖昧な時刻も仮に数値化しています。

各項目の plannedAt（訪問予定）、revealAt（公開時刻、初期値は訪問予定の1分後）、needsVerification、stayMinutes を個別編集します。交通時刻変更時は revealAt も更新してください。3時間枠より優先して目的地ごとの revealAt をサーバー側で判定します。

本番ではデータを Secret Manager またはクライアントが一切読めないサーバー専用DBに移してください。新婦のリクエストでも認証前に返してはいけません。

## 改修後のデータ
クエストごとにactionIdsで細かい行動をまとめ、各行にsafeTextを追加しました。revealAtは交通区間や注記の目的地も到着前に漏れないよう、クエスト/訪問に合わせて遅らせています。手動でクエストをクリアしてもrevealAtは変えません。DAY3のクエストは9・12・15時だけです。

recoveryEventsはIDごとに独立した回復イベント、availableAtは出現時刻、questIdは関連予定。statusPromptsはDAY1/2が21時、DAY3は15時です。旧記載の「公開は一律1分後」より、現在の各行revealAtを優先してください。plannedAtは以前の入力値を維持しています。
