import {mkdir,rm,cp,readFile,readdir} from 'node:fs/promises';
import './preview.mjs';
for(const file of ['character_hanayome_01_black.png','character_hanamuko_gray_black.png']){const bytes=await readFile(`assets/characters/${file}`);if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error(`PNGを確認してください: ${file}`);}
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const f of ['index.html','src','assets'])await cp(f,`dist/${f}`,{recursive:true});
// Real destinations are now intentionally included. Reject obsolete fictional itinerary names.
const banned=['風の駅','雲の宿','空色の丘','ミルクの牧場','ひつじの草原','こもれびの家'];
async function scan(path){for(const file of await readdir(path,{withFileTypes:true})){const p=`${path}/${file.name}`;if(file.isDirectory())await scan(p);else if(/\.(js|html|json)$/.test(p)){const text=await readFile(p,'utf8');for(const word of banned)if(text.includes(word))throw Error(`架空の旧旅程が残っています: ${word}`);}}}
await cp('.nojekyll','dist/.nojekyll');
await scan('dist');const preview=await readFile('reward-quest-preview.html','utf8');for(const word of banned)if(preview.includes(word))throw Error(`旧旅程: ${word}`);
console.log('Build OK: local-only static Pages app; no deployment');
