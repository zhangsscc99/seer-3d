import {readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve('dist');
let html=await readFile(path.join(output,'index.html'),'utf8');
const script=html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
const style=html.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/);
if(!script||!style)throw new Error('Build must contain one JS bundle and one stylesheet.');
let js=await readFile(path.join(output,script[1]),'utf8');
let css=await readFile(path.join(output,style[1]),'utf8');
for(const name of await readdir(path.join(output,'references'))){
 const data=await readFile(path.join(output,'references',name));
 const url=`data:image/${name.endsWith('.png')?'png':'jpeg'};base64,${data.toString('base64')}`;
 const source='/references/'+name;
 js=js.replaceAll(source,url);css=css.replaceAll(source,url);html=html.replaceAll(source,url);
}
html=html.replace(script[0],()=>`<script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script>`);
html=html.replace(style[0],()=>`<style>${css}</style>`);
await writeFile(path.join(output,'摩尔庄园.html'),html);
console.log('Offline single-file build: dist/摩尔庄园.html');
