import {readFile,appendFile} from 'node:fs/promises';
const release=JSON.parse(await readFile('work/firebase-release/release.json','utf8'));
const rules=await readFile('work/firebase-release/firestore.rules','utf8');
const text=`## 検証済みリリース（公開はしていません）

- 通常テスト・本番RulesのEmulatorコンパイル/アクセス確認・正常/異常系・ビルドが成功しました。
- 検証実行番号: **${release.runId}**
- コミットSHA: **${release.sha}**
- 承認欄に貼る文字列: \`DEPLOY ${release.sha}\`
- UID登録数: **${release.uidCount}**（0なら共有アクセス拒否の初期設定）
- mainのpush/手動検証だけが公開候補です。PR成果物は公開できません。
- 公開する場合だけ Approve and deploy Firebase を手動実行します。
- Rulesも適用する場合は別途 \`APPLY VERIFIED RULES\` の明示承認が必要です。

### 適用予定の本番Rules

このブラウザ画面で生成されたルールを確認できます。確認だけでは本番へ反映されません。

\`\`\`text
${rules}
\`\`\`
`;
if(!process.env.GITHUB_STEP_SUMMARY)throw Error('GitHub Actions専用です');
await appendFile(process.env.GITHUB_STEP_SUMMARY,text);
