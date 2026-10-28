// Server-only projection. Input data must come from trusted storage and claims from verified ID tokens.
function authorize(claims){if(!claims||!['bride','groom'].includes(claims.role)||!claims.coupleId)throw Error('unauthorized');}
export function visibleSchedule(records,claims,serverNow=Date.now()){
 authorize(claims);
 return records.map(r=>{
  const base={id:r.id,day:r.day,at:r.plannedAt,time:r.plannedAt.slice(11,16),safeText:r.safeText,needsVerification:r.needsVerification,questId:r.questId};
  // Do not spread the private record. Notes/route names can disclose future destinations too.
  return claims.role==='bride'||Date.parse(r.revealAt)<=serverNow?{...base,detail:r.title,note:r.note}:base;
 });
}
export function visibleQuests(quests,claims,serverNow=Date.now()){
 authorize(claims);
 return quests.map(q=>({id:q.id,day:q.day,actionIds:q.actionIds,revealAt:q.revealAt,final:q.final||false,...(claims.role==='bride'||Date.parse(q.revealAt)<=serverNow?{title:q.title}:{})}));
}
export function canEditPlayer(claims,player){return Boolean(claims?.coupleId&&claims.role===player);}
// A future API must verify couple ownership and use a database transaction for all writes.
