// Firebase Web configuration is public identification, not an Admin SDK secret.
export const firebaseConfig={
 apiKey:'AIzaSyDT4Vn0RC2fHv5-gHMS-8HI10QFpZqa9h4',
 authDomain:'wedding-reward-quest.firebaseapp.com',
 projectId:'wedding-reward-quest',
 storageBucket:'wedding-reward-quest.firebasestorage.app',
 messagingSenderId:'592615226461',
 appId:'1:592615226461:web:6796544acb7e10142de1b4'
};
// Replace BOTH empty values with Authentication > Users > UID, then regenerate rules.
// Neither URL role nor email is used for authorization. Empty values deny access.
export const allowedUsers={groom:'',bride:''};
export const sharedDocumentPath='couples/wedding-2026';
export function firebaseSetupIssues(){
 const issues=[];
 for(const key of ['apiKey','authDomain','projectId','appId'])if(!firebaseConfig[key])issues.push(`firebaseConfig.${key}`);
 for(const role of ['groom','bride'])if(!allowedUsers[role])issues.push(`allowedUsers.${role}（Firebase UID）`);
 if(allowedUsers.groom&&allowedUsers.groom===allowedUsers.bride)issues.push('新郎・新婦には異なるUIDが必要です');
 return issues;
}
