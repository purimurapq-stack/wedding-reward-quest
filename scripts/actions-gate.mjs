// Pure deployment gate. All approval values are data, never interpolated shell code.
export const expectedRepository='purimurapq-stack/wedding-reward-quest';
export const expectedProject='wedding-reward-quest';
export function validateApproval({repository,ref,event,inputs}){
 if(repository!==expectedRepository||ref!=='refs/heads/main'||event!=='workflow_dispatch')throw Error('本番公開は元リポジトリのmain上で手動実行してください');
 const sha=inputs.commit_sha||'',run=inputs.verification_run_id||'',scope=inputs.scope;
 if(!/^[a-f0-9]{40}$/.test(sha))throw Error('検証済みの完全な40文字コミットSHAを指定してください');
 if(!/^[1-9][0-9]{0,14}$/.test(run))throw Error('検証ワークフローの実行番号を指定してください');
 if(!['hosting-only','hosting-and-rules'].includes(scope))throw Error('公開範囲が不正です');
 if(inputs.approval!==`DEPLOY ${sha}`)throw Error('承認欄へ DEPLOY とコミットSHAを正確に入力してください');
 if(scope==='hosting-and-rules'&&inputs.rules_approval!=='APPLY VERIFIED RULES')throw Error('Rules適用の明示的な承認が必要です');
 return {sha,runId:Number(run),scope,artifactName:`firebase-release-${sha}`};
}
export function validateVerification({run,jobs,approval,mainSha}){
 if(mainSha!==approval.sha)throw Error('mainが移動しています。新しいコミットの検証結果を確認し、承認し直してください');
 if(run.repository?.full_name!==expectedRepository||run.head_repository?.full_name!==expectedRepository)throw Error('別リポジトリの成果物は使えません');
 if(!['push','workflow_dispatch'].includes(run.event)||run.head_branch!=='main'||run.head_sha!==approval.sha)throw Error('PR/別ブランチ/別コミットの検証結果は本番公開できません');
 if(run.status!=='completed'||run.conclusion!=='success'||run.path?.split('@')[0]!=='.github/workflows/verify.yml')throw Error('指定した実行は本番用の検証に合格していません');
 const job=jobs.find(j=>j.name==='Verify and package'&&j.conclusion==='success');
 const required=['Generate production rules','Ordinary tests','Firestore Security Rules (Emulator)','Build','Package tested release'];
 if(!job||required.some(name=>!job.steps?.some(s=>s.name===name&&s.conclusion==='success')))throw Error('通常テスト・Rules Emulator・ビルド・成果物作成の成功を確認できません');
 return true;
}
