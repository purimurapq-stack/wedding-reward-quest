// Server-only helpers for a future authenticated API. Do not import from src/.
export function visibleSchedule(records, verifiedClaims, serverNow=Date.now()) {
  if(!verifiedClaims || !['bride','groom'].includes(verifiedClaims.role))throw Error('unauthorized');
  return records.filter(record=>verifiedClaims.role==='bride'||Date.parse(record.revealAt)<=serverNow);
}
export function canEditPlayer(verifiedClaims, player){return Boolean(verifiedClaims && verifiedClaims.role===player);}
