import {readFile,writeFile,mkdir} from 'node:fs/promises';
const parts=[];
for(const name of ['data','domain','storage','visuals','app']){
 let source=await readFile(`src/${name}.js`,'utf8');
 source=source.replace(/import \{[^}]*\} from '[^']+';/g,'').replace(/\bexport\s+(?=(?:const|function|class)\b)/g,'');
 parts.push(source);
}
const js=parts.join('\n');
let html=await readFile('index.html','utf8');
html=html.replace('<link rel="stylesheet" href="./src/style.css">',`<style>${await readFile('src/style.css','utf8')}</style>`).replace('<script type="module" src="./src/app.js"></script>',`<script type="module">\n${js}\n</script>`);
if(/^import /m.test(js)||/<(?:script|link)[^>]+(?:src|href)=/.test(html))throw Error('Preview still requires external files');
await writeFile('reward-quest-preview.html',html);
await mkdir('work',{recursive:true});await writeFile('work/preview-check.mjs',js);
console.log('Standalone preview: reward-quest-preview.html');
