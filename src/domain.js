import {initial,effects} from './data.js';
export const fresh=()=>({version:1,players:structuredClone(initial),done:[],items:[],role:'groom',motion:true,seen:false,logs:{}});
export const unlocked=(q,now)=>Date.parse(q.at)<=now;
export function applyEvent(state,id,day){const key=`${day}:${id}`;const effect=effects.find(e=>e.id===id);if(!effect||state.done.includes(key))return state;const next=structuredClone(state);for(const p of Object.values(next.players)){for(const k of Object.keys(p)){p[k][1]+=effect.max[k]||0;p[k][0]=Math.max(0,Math.min(p[k][1],p[k][0]+(effect.current[k]||0)));}}next.done.push(key);return next;}
export function setCurrent(state,role,values,date){const next=structuredClone(state);for(const [k,v] of Object.entries(values)){if(!next.players[role]?.[k]||!Number.isFinite(v))throw Error('入力値を確認してください');next.players[role][k][0]=Math.max(0,Math.min(next.players[role][k][1],Math.round(v)));}next.logs[`${date}:${role}`]={...values};return next;}
export const tokyoDate=now=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(now);
export const tripDay=now=>Math.max(1,Math.min(3,Math.floor((Date.parse(tokyoDate(now)+'T00:00:00+09:00')-Date.parse('2026-10-31T00:00:00+09:00'))/86400000)+1));
