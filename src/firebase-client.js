import {firebaseConfig,allowedUsers,sharedDocumentPath,firebaseSetupIssues} from './firebase-config.js';
import {fresh} from './domain.js';
import {initialShared,detectCommand,executeCommand,decodeShared,extractShared} from './shared-state.js';
export function createCloudClient({sdkLoader=loadFirebaseSDK,now=()=>Date.now()}={}){
 let sdk,auth,db,ref,unsubDoc=null,unsubAuth=null,generation=0,sharedRevision=-1;
 let session={status:'unconfigured',user:null,player:null,message:'',missing:firebaseSetupIssues()},shared=null;
 const listeners=new Set();
 const notify=()=>listeners.forEach(fn=>fn());
 function reset(status,message='',user=null,player=null){generation++;unsubDoc?.();unsubDoc=null;shared=null;sharedRevision=-1;session={...session,status,message,user,player};notify();}
 function fail(error){reset(error.code==='permission-denied'?'denied':'error',friendlyError(error),session.user,session.player);}
 return {
  get session(){return session;},get shared(){return shared;},lastSharedChange:false,
  subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
  async start(){
   if(unsubAuth)return;if(typeof location!=='undefined'&&location.protocol==='file:'){reset('unconfigured','GoogleログインにはHTTP/HTTPSが必要です。npm run devで開くか、Firebase Hostingで確認してください。');return;}
   // Even without UIDs, allow Google sign-in to display the UID for setup; no Firestore read starts.
   const configMissing=session.missing.filter(x=>x.startsWith('firebaseConfig.'));
   if(configMissing.length){reset('unconfigured','FirebaseのWeb設定が不足しています');return;}
   try{
    sdk=await sdkLoader();const app=sdk.initializeApp(firebaseConfig);auth=sdk.getAuth(app);db=sdk.getFirestore(app);ref=sdk.doc(db,sharedDocumentPath);
    unsubAuth=sdk.onAuthStateChanged(auth,user=>{
     reset(user?'loading':'signed-out','',user);
     if(!user)return;
     const issues=firebaseSetupIssues();
     const player=Object.entries(allowedUsers).find(([,uid])=>uid&&uid===user.uid)?.[0];
     if(issues.length||!player){reset('unauthorized',issues.length?'許可UIDが未登録です。表示されたUIDを設定してください。':'このGoogleアカウントには共有データの利用許可がありません。',user);return;}
     reset('loading','共有データを読み込んでいます',user,player);const token=generation;
     unsubDoc=sdk.onSnapshot(ref,snapshot=>{if(token!==generation||snapshot.metadata?.fromCache)return;try{const raw=snapshot.exists()?snapshot.data():null;if(raw&&raw.revision<sharedRevision)return;shared=raw?decodeShared(raw):null;sharedRevision=raw?.revision??-1;session={...session,status:shared?'ready':'missing',message:shared?'同期済み':'共有データはまだ作成されていません。既存の別パスのデータは移行しません。'};notify();}catch(error){fail(error);}},error=>{if(token===generation)fail(error);});
    });
    await sdk.getRedirectResult(auth);
   }catch(error){fail(error);}
  },
  async login(){if(!auth)throw Error('ログインの準備ができていません。接続とWeb設定を確認して再読み込みしてください');try{await sdk.signInWithPopup(auth,new sdk.GoogleAuthProvider());}catch(error){session={...session,message:friendlyError(error)};notify();throw Error(session.message);}},
  async logout(){reset('signed-out');if(auth)await sdk.signOut(auth);},
  async create(){
   if(!auth?.currentUser||!session.player||session.status!=='missing')throw Error('許可されたアカウントでログインしてください');
   const uid=auth.currentUser.uid;await sdk.runTransaction(db,async tx=>{const doc=await tx.get(ref);if(doc.exists())throw Error('共有データが既に存在します。上書きしません。');tx.set(ref,{...initialShared(uid),updatedAt:sdk.serverTimestamp()});});
  },
  async transact(before,proposed){
   this.lastSharedChange=false;
   if(session.status!=='ready'||!auth.currentUser)throw Error('共有データへの接続・権限を確認してください');
   const uid=auth.currentUser.uid,player=session.player,token=generation,command=detectCommand(before,proposed,player);if(!command)return shared;
   const assertSession=()=>{if(token!==generation||auth.currentUser?.uid!==uid)throw Error('ログイン状態が変更されました');};
   const result=await commitSharedCommand({sdk,db,ref,uid,player,command,now,assertSession});
   if(token!==generation||auth.currentUser?.uid!==uid)throw Error('ログイン状態が変更されました');
   this.lastSharedChange=result.changed;if(result.revision>=sharedRevision){shared=result.shared;sharedRevision=result.revision;}return shared;
  }
 };
}
// Shared by production and the real Emulator race test. Read-back never substitutes for authorization.
export async function commitSharedCommand({sdk,db,ref,uid,player,command,now=()=>Date.now(),assertSession=()=>{}}){
 try{return await sdk.runTransaction(db,async tx=>{
  assertSession();const snapshot=await tx.get(ref);if(!snapshot.exists())throw Error('共有データが存在しません。自動再作成はしません。');
  const raw=snapshot.data(),current={...fresh(),...decodeShared(raw)},next=executeCommand(current,command,player,now());
  if(JSON.stringify(extractShared(current))===JSON.stringify(extractShared(next)))return {shared:decodeShared(raw),revision:raw.revision,changed:false};
  const data={...extractShared(next),schemaVersion:1,revision:raw.revision+1,lastOperation:{...command,actor:uid},updatedAt:sdk.serverTimestamp()};
  if(command.kind==='status')delete data.lastOperation.values;
  data.questClears={...raw.questClears};if(command.kind==='quest')data.questClears[command.id]=sdk.serverTimestamp();
  tx.set(ref,data);return {shared:extractShared(next),revision:data.revision,changed:true};
 });}catch(error){
  if(['event','quest'].includes(command.kind)&&['permission-denied','aborted','failed-precondition'].includes(error.code)){
   assertSession();const snapshot=await sdk.getDocFromServer(ref);assertSession();
   if(snapshot.exists()){
    const raw=snapshot.data(),state=decodeShared(raw);
    const already=command.kind==='event'?state.done.includes(command.id):Boolean(state.questClears[command.id]);
    if(already)return {shared:state,revision:raw.revision,changed:false};
   }
  }
  throw error;
 }
}
export async function loadFirebaseSDK(){
 const [app,auth,store]=await Promise.all([
  import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
  import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
  import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')
 ]);return {...app,...auth,...store};
}
export function friendlyError(error){
 return ({'auth/popup-blocked':'ポップアップがブロックされました。ブラウザで許可し、もう一度ログインしてください。','auth/popup-closed-by-user':'ログインを中断しました。','auth/unauthorized-domain':'このサイトのドメインをFirebase Authenticationの承認済みドメインへ追加してください。','auth/operation-not-allowed':'Firebase ConsoleでGoogleログインを有効にしてください。','auth/network-request-failed':'通信に失敗しました。ネットワークを確認してください。','permission-denied':'Firestoreの権限がありません。2人のUIDとデプロイ済みルールを確認してください。','unavailable':'共有サーバーへ接続できません。接続回復後に再読み込みしてください。'})[error.code]||error.message||'Firebaseに接続できませんでした。';
}
