import test from 'node:test';import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';import {join} from 'node:path';
import {validateApproval,validateVerification,expectedRepository} from '../scripts/actions-gate.mjs';
import {hashes,validateRelease,prepareRelease} from '../scripts/release.mjs';
const sha='a'.repeat(40),runId=12345;
const input={verification_run_id:String(runId),commit_sha:sha,scope:'hosting-only',approval:`DEPLOY ${sha}`};
const context={repository:expectedRepository,ref:'refs/heads/main',event:'workflow_dispatch',inputs:input};
const steps=['Generate production rules','Ordinary tests','Firestore Security Rules (Emulator)','Build','Package tested release'].map(name=>({name,conclusion:'success'}));
const run={repository:{full_name:expectedRepository},head_repository:{full_name:expectedRepository},event:'push',head_branch:'main',head_sha:sha,status:'completed',conclusion:'success',path:'.github/workflows/verify.yml'};
const check=(r=run,jobs=[{name:'Verify and package',conclusion:'success',steps}],mainSha=sha)=>validateVerification({run:r,jobs,approval:validateApproval(context),mainSha});
test('deploy approval requires manual main execution, typed exact SHA and separate Rules consent',()=>{
 assert.equal(validateApproval(context).artifactName,`firebase-release-${sha}`);
 for(const change of [{event:'push'},{ref:'refs/heads/feature'},{repository:'outsider/repo'},{inputs:{...input,approval:'yes'}},{inputs:{...input,commit_sha:'main'}},{inputs:{...input,verification_run_id:'123; echo leak'}}])assert.throws(()=>validateApproval({...context,...change}));
 assert.throws(()=>validateApproval({...context,inputs:{...input,scope:'hosting-and-rules'}}));
 assert.equal(validateApproval({...context,inputs:{...input,scope:'hosting-and-rules',rules_approval:'APPLY VERIFIED RULES'}}).scope,'hosting-and-rules');
});
test('failed, PR, skipped Rules, different commit/workflow/repository or stale-main builds cannot deploy',()=>{
 assert.equal(check(),true);
 for(const change of [{event:'pull_request'},{conclusion:'failure'},{status:'in_progress'},{head_branch:'feature'},{head_sha:'b'.repeat(40)},{path:'.github/workflows/other.yml'},{head_repository:{full_name:'other/repo'}}])assert.throws(()=>check({...run,...change}));
 assert.throws(()=>check(run,[{name:'Verify and package',conclusion:'success',steps:steps.map(s=>s.name.includes('Emulator')?{...s,conclusion:'skipped'}:s)}]));
 assert.throws(()=>check(run,undefined,'b'.repeat(40)));
});
async function fixture(){
 await mkdir('work',{recursive:true});const root=await mkdtemp('work/release-test-');
 const files={'dist/index.html':'<!doctype html>','dist/src/firebase-config.js':'// public configuration','firestore.rules':'rules_version = "2";','package.json':'{}','package-lock.json':JSON.stringify({lockfileVersion:3,packages:{'node_modules/firebase-tools':{version:'14.12.0'}}}),'firebase.json':JSON.stringify({hosting:{public:'dist'},firestore:{rules:'firestore.rules'}})};
 for(const [name,data]of Object.entries(files)){await mkdir(join(root,name.split('/').slice(0,-1).join('/')),{recursive:true});await writeFile(join(root,name),data);}
 const manifest={schema:1,repository:expectedRepository,sha,ref:'refs/heads/main',runId:String(runId),projectId:'wedding-reward-quest',uidCount:2,verified:{ordinary:true,emulator:true,build:true},files:await hashes(root)};
 await writeFile(join(root,'release.json'),JSON.stringify(manifest));return {root,manifest};
}
test('only exact tested bytes and matching release identity pass validation',async()=>{
 const {root}=await fixture();try{assert.equal((await validateRelease(root,{sha,runId})).sha,sha);await assert.rejects(()=>validateRelease(root,{sha,runId:999}));await writeFile(join(root,'firestore.rules'),'changed');await assert.rejects(()=>validateRelease(root,{sha,runId}));}finally{await rm(root,{recursive:true,force:true});}
});
test('release rejects extra targets, credentials, missing evidence and a different CLI',async()=>{
 for(const kind of ['functions','credentials','not-tested','other-cli']){
  const {root,manifest}=await fixture();try{
   if(kind==='functions')await writeFile(join(root,'firebase.json'),JSON.stringify({hosting:{public:'dist'},firestore:{rules:'firestore.rules'},functions:{source:'.'}}));
   if(kind==='credentials')await writeFile(join(root,'private-key.json'),'do not ship');
   if(kind==='not-tested')manifest.verified.emulator=false;
   if(kind==='other-cli')await writeFile(join(root,'package-lock.json'),JSON.stringify({packages:{'node_modules/firebase-tools':{version:'0.0.1'}}}));
   manifest.files=await hashes(root);await writeFile(join(root,'release.json'),JSON.stringify(manifest));await assert.rejects(()=>validateRelease(root,{sha,runId}));
  }finally{await rm(root,{recursive:true,force:true});}
 }
});
test('packaging cannot run before Rules test success',async()=>{await assert.rejects(()=>prepareRelease('work/should-not-exist',{RULES_TESTED:'false'}));});
test('workflows isolate read-only CI from keyless manual deploy and preserve verification order',async()=>{
 const ci=await readFile('.github/workflows/verify.yml','utf8'),deploy=await readFile('.github/workflows/deploy.yml','utf8');
 assert.ok(ci.indexOf('Firestore Security Rules (Emulator)')<ci.indexOf('Package tested release'));assert.ok(!ci.includes('id-token: write'));assert.ok(!ci.includes('secrets.'));
 assert.ok(deploy.includes('workflow_dispatch:'));assert.ok(!/^  push:/m.test(deploy));assert.ok(!/^  pull_request:/m.test(deploy));assert.ok(deploy.includes('needs: gate'));assert.ok(deploy.includes('id-token: write'));assert.ok(!deploy.includes('credentials_json:'));assert.ok(!deploy.includes('FIREBASE_TOKEN'));assert.ok(deploy.indexOf('Verify bytes, identity')<deploy.indexOf('Obtain short-lived'));
});
