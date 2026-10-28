import {mkdir,rm,cp,readFile,readdir} from 'node:fs/promises';
import './preview.mjs';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const f of ['index.html','src','assets'])await cp(f,`dist/${f}`,{recursive:true});
const banned=['小淵沢','清里','甲斐大泉','グランメルキュール','清泉寮','まきば公園','大口駅','新子安','八王子','サンメドウズ'];
async function scan(path){for(const file of await readdir(path,{withFileTypes:true})){const p=`${path}/${file.name}`;if(file.isDirectory())await scan(p);else{const text=await readFile(p,'utf8');for(const word of banned)if(text.includes(word))throw Error(`公開禁止情報: ${word}`);}}}
await scan('dist');const preview=await readFile('reward-quest-preview.html','utf8');for(const word of banned)if(preview.includes(word))throw Error(`Preview contains private information: ${word}`);
console.log('Build OK: dist/ and standalone preview; dummy destinations only');
