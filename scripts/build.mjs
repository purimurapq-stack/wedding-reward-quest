import {mkdir,rm,cp,readFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');for(const f of ['index.html','src','assets'])await cp(f,`dist/${f}`,{recursive:true});
const banned=['小淵沢','清里','甲斐大泉','グランメルキュール','清泉寮','まきば公園','大口駅','新子安'];
for(const f of ['src/data.js','src/app.js','index.html']){const text=await readFile(`dist/${f}`,'utf8');for(const word of banned)if(text.includes(word))throw Error(`公開禁止情報: ${word}`);}console.log('Build OK: dist/ (dummy itinerary only)');
