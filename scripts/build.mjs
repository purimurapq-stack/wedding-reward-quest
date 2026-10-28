import {mkdir,rm,cp,readFile,readdir} from 'node:fs/promises';
import './preview.mjs';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const f of ['index.html','src','assets'])await cp(f,`dist/${f}`,{recursive:true});
// Real destinations are now intentionally included. Reject obsolete fictional itinerary names.
const banned=['風の駅','雲の宿','空色の丘','ミルクの牧場','ひつじの草原','こもれびの家'];
async function scan(path){for(const file of await readdir(path,{withFileTypes:true})){const p=`${path}/${file.name}`;if(file.isDirectory())await scan(p);else if(/\.(js|html|json)$/.test(p)){const text=await readFile(p,'utf8');for(const word of banned)if(text.includes(word))throw Error(`架空の旧旅程が残っています: ${word}`);}}}
await scan('dist');const preview=await readFile('reward-quest-preview.html','utf8');for(const word of banned)if(preview.includes(word))throw Error(`旧旅程: ${word}`);
console.log('Build OK: real itinerary, localStorage only; no deployment');
