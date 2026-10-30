import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
const parts=[];
for(const name of ['itinerary','data','domain','storage','home','visuals','app']){
 let source=await readFile(`src/${name}.js`,'utf8');
 source=source.replace(/import \{[^}]*\} from '[^']+';/g,'').replace(/\bexport\s+(?=(?:const|function|class)\b)/g,'');
 parts.push(source);
}
let js=parts.join('\n');
for(const name of ['character_hanamuko_gray_black.png','character_hanayome_01_black.png']){
 const path=`./assets/characters/${name}`;
 try{const bytes=await readFile(path);js=js.split(path).join(`data:image/png;base64,${bytes.toString('base64')}`);}
 catch(e){if(e.code!=='ENOENT')throw e;js=js.split(path).join('data:image/png;base64,');console.log(`元PNG未配置: ${name}`);}
}

for(const name of await readdir('assets/backgrounds'))if(name.endsWith('.svg')){
 const path=`./assets/backgrounds/${name}`,bytes=await readFile(path);
 js=js.split(path).join(`data:image/svg+xml;base64,${bytes.toString('base64')}`);
}

let html=await readFile('index.html','utf8');
html=html.replace('<link rel="stylesheet" href="./src/style.css">',`<style>${await readFile('src/style.css','utf8')}</style>`).replace('<script type="module" src="./src/app.js"></script>',`<script type="module">\n${js}\n</script>`);
if(/^import /m.test(js)||/<(?:script|link)[^>]+(?:src|href)=/.test(html))throw Error('Preview still requires external files');
await writeFile('reward-quest-preview.html',html);
await mkdir('work',{recursive:true});await writeFile('work/preview-check.mjs',js);
console.log('Standalone preview: reward-quest-preview.html');
