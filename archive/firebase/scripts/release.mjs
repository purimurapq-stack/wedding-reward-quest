import {readFile,writeFile,readdir,mkdir,cp,rm,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {firebaseConfig,allowedUsers} from '../src/firebase-config.js';
import {expectedRepository,expectedProject} from './actions-gate.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function hashes(root){
 const found={};
 async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name),rel=relative(root,path).replaceAll('\\','/');const stat=await lstat(path);if(stat.isSymbolicLink())throw Error('シンボリックリンクはリリースに含めません');if(stat.isDirectory())await scan(path);else if(rel!=='release.json')found[rel]=hash(await readFile(path));}}
 await scan(root);return Object.fromEntries(Object.entries(found).sort(([a],[b])=>a.localeCompare(b)));
}
export async function prepareRelease(root='work/firebase-release',env=process.env){
 if(env.RULES_TESTED!=='true')throw Error('Rules Emulator成功後だけパッケージを作成してください');
 if(!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA||''))throw Error('CIコミットSHAが不足しています');
 if(firebaseConfig.projectId!==expectedProject)throw Error('Firebaseプロジェクトが異なります');
 const uids=Object.values(allowedUsers);if(uids.some(Boolean)&&(!uids.every(Boolean)||new Set(uids).size!==2))throw Error('UIDは両方空欄、または異なる2人分を登録してください');
 await rm(root,{recursive:true,force:true});await mkdir(root,{recursive:true});
 for(const path of ['dist','firestore.rules','package.json','package-lock.json'])await cp(path,join(root,path),{recursive:true});
 // Only explicitly supported deployment targets. Never include functions, remote config, DB imports or indexes.
 const source=JSON.parse(await readFile('firebase.json','utf8'));
 await writeFile(join(root,'firebase.json'),JSON.stringify({hosting:source.hosting,firestore:{rules:'firestore.rules'}},null,2)+'\n');
 const manifest={schema:1,repository:env.GITHUB_REPOSITORY,sha:env.GITHUB_SHA,ref:env.GITHUB_REF,runId:String(env.GITHUB_RUN_ID),projectId:expectedProject,uidCount:uids.filter(Boolean).length,verified:{ordinary:true,emulator:true,build:true},files:await hashes(root)};
 if(manifest.repository!==expectedRepository)throw Error('リポジトリが異なります');
 await writeFile(join(root,'release.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
export async function validateRelease(root,{sha,runId}){
 const manifest=JSON.parse(await readFile(join(root,'release.json'),'utf8'));
 if(manifest.schema!==1||manifest.repository!==expectedRepository||manifest.sha!==sha||manifest.ref!=='refs/heads/main'||manifest.runId!==String(runId)||manifest.projectId!==expectedProject)throw Error('成果物と承認対象が一致しません');
 if(![0,2].includes(manifest.uidCount)||!manifest.verified?.ordinary||!manifest.verified?.emulator||!manifest.verified?.build)throw Error('検証情報が不足しています');
 if(JSON.stringify(await hashes(root))!==JSON.stringify(manifest.files))throw Error('検証後に成果物が変更されています');
 for(const path of ['firestore.rules','firebase.json','package.json','package-lock.json','dist/index.html','dist/src/firebase-config.js'])if(!manifest.files[path])throw Error(`成果物が不足しています: ${path}`);
 if(Object.keys(manifest.files).some(p=>!p.startsWith('dist/')&&!['firestore.rules','firebase.json','package.json','package-lock.json'].includes(p)))throw Error('未許可のファイルが含まれています');
 const config=JSON.parse(await readFile(join(root,'firebase.json'),'utf8'));
 if(Object.keys(config).sort().join(',')!=='firestore,hosting'||config.hosting.public!=='dist'||JSON.stringify(config.firestore)!==JSON.stringify({rules:'firestore.rules'}))throw Error('公開対象が想定と異なります');
 const lock=JSON.parse(await readFile(join(root,'package-lock.json'),'utf8'));
 if(lock.packages?.['node_modules/firebase-tools']?.version!=='14.12.0')throw Error('検証済みFirebase CLIのバージョンが異なります');
 return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv[2]==='prepare')console.log(JSON.stringify(await prepareRelease()));
 else if(process.argv[2]==='validate')console.log(JSON.stringify(await validateRelease(process.argv[3],{sha:process.env.APPROVED_SHA,runId:process.env.APPROVED_RUN_ID})));
 else throw Error('prepare / validate を指定してください');
}
