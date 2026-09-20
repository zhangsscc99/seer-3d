import {chromium} from 'playwright-core';
import {readFile,writeFile,mkdir,copyFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out='evidence/runtime';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl']});
const checks=[],errors=[],requests=[];let passed=false,failure;
const appUrl=pathToFileURL(path.resolve('app/index.html')).href;
const check=(name,details={})=>checks.push({name,passed:true,...details});
let temporary;
async function assertPortraitRotation(page){
 const layout=await page.locator('#app-shell').evaluate(shell=>{
  const rect=shell.getBoundingClientRect();
  return {transform:getComputedStyle(shell).transform,left:rect.left,top:rect.top,width:rect.width,height:rect.height};
 });
 assert.equal(layout.transform,'matrix(0, 1, -1, 0, 0, 0)');
 assert.equal(layout.left,0);assert.equal(layout.top,0);assert.equal(layout.width,390);assert.equal(layout.height,844);
 return layout;
}
try{
 const cold=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false,deviceScaleFactor:1});
 await cold.setOffline(true);
 const firstPaint=await cold.newPage();await firstPaint.goto(appUrl);
 await firstPaint.locator('#stage-loading').waitFor({state:'visible'});
 const firstLayout=await assertPortraitRotation(firstPaint);
 assert.equal(await firstPaint.locator('#app-shell').getAttribute('data-rotated'),null);
 await firstPaint.screenshot({path:out+'/portrait-startup.png'});
 check('Portrait is already sideways before any JavaScript runs',{layout:firstLayout});
 await cold.close();
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,deviceScaleFactor:1});
 await context.setOffline(true);
 await context.addInitScript(()=>{
  window.__networkCalls=[];
  for(const name of ['fetch','XMLHttpRequest','WebSocket','EventSource','Worker','SharedWorker'])window[name]=function(){window.__networkCalls.push(name);throw Error('Unavailable in container: '+name);};
  window.ResizeObserver=undefined;window.PointerEvent=undefined;
  delete Array.prototype.at;delete Array.prototype.flat;delete Object.fromEntries;delete Element.prototype.replaceChildren;delete CanvasRenderingContext2D.prototype.roundRect;
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args);};
 });
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto(appUrl+'#farm');
 await page.waitForFunction(()=>window.__manor?.getState().destination==='farm'&&window.__manor.getState().assetsPending===0);
 await page.waitForTimeout(300);
 let state=await page.evaluate(()=>window.__manor.getState());assert.equal(state.webgl,'webgl');assert.equal(state.playerModel,'pink-winged-mole');assert(state.calls>0&&state.triangles>100000);
 check('WebGL1 with modern APIs removed loads farm',{state});
 await page.getByTestId('destination-church').click();
 await page.waitForFunction(()=>window.__manor.getState().destination==='church'&&window.__manor.getState().assetsPending===0);
 state=await page.evaluate(()=>window.__manor.getState());assert.equal(state.webgl,'webgl');assert.equal(state.playerModel,'pink-winged-mole');assert(state.triangles>100000);assert.equal(state.sceneCount,1);
 check('WebGL1 scene switch renders church and retires prior scenery');
 const changedScenes=[];
 for(const id of ['home','homeinside','petshop']) {
  await page.getByTestId('destination-'+id).click();
  await page.waitForFunction(id=>window.__manor.getState().destination===id&&window.__manor.getState().assetsPending===0&&document.getElementById('stage-loading').hidden,id);
  const s=await page.evaluate(()=>window.__manor.getState());assert.equal(s.webgl,'webgl');assert(s.triangles>10000);assert.equal(s.sceneCount,1);
  changedScenes.push({id,calls:s.calls,triangles:s.triangles});
 }
 check('Home scenes and furnished pet shop render in WebGL1 with missing modern APIs',{scenes:changedScenes});
 assert.equal(await page.getByTestId('world-overview').count(),1);
 assert.equal(await page.getByTestId('world-overview').innerText(),'全岛');
 assert.equal(await page.locator('#map-button,#reference-button,#photo-button,#map-stage,#reference-dialog,#photo-dialog,[data-testid="back-to-map"],[data-testid="toggle-reference"],[data-testid="take-photo"],[data-testid="save-photo"]').count(),0);
 check('Only the island overview remains; removed map, reference and photo controls and overlays are absent');
 const callsBeforeLegacyEntry=await page.evaluate(()=>window.__networkCalls);
 await page.goto('about:blank');await page.goto(appUrl+'#map');
 await page.waitForFunction(()=>window.__manor?.getState().destination==='island'&&window.__manor.getState().assetsPending===0&&document.getElementById('stage-loading').hidden);
 state=await page.evaluate(()=>window.__manor.getState());
 assert.equal(new URL(page.url()).hash,'#island');assert.equal(state.webgl,'webgl');assert.equal(state.playerModel,'pink-winged-mole');assert.equal(state.mapOpen,false);assert.equal(state.sceneCount,1);assert(state.calls>0&&state.triangles>1000);
 await page.getByTestId('show-help').click();await page.locator('#help-dialog').waitFor({state:'visible'});
 await page.getByTestId('help-start').click();await page.locator('#help-dialog').waitFor({state:'hidden'});
 await page.getByTestId('destination-farm').click();
 await page.waitForFunction(()=>window.__manor.getState().destination==='farm'&&window.__manor.getState().assetsPending===0&&document.getElementById('stage-loading').hidden);
 const resumed=await page.evaluate(()=>window.__manor.getState());assert.equal(resumed.sceneCount,1);assert.equal(resumed.webgl,'webgl');assert(resumed.calls>0);
 await page.screenshot({path:out+'/landscape-help-resumed.png'});
 check('Cold legacy map entry opens WebGL1 island and closing help allows continued navigation',{entryHash:'#map',resolvedHash:'#island',resumedDestination:resumed.destination});
 const networkCalls=callsBeforeLegacyEntry.concat(await page.evaluate(()=>window.__networkCalls));assert.deepEqual(networkCalls,[]);assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
 check('No prohibited request API called, external requests or browser errors');
 await context.close();

 const no3d=await browser.newContext({viewport:{width:390,height:844}});await no3d.setOffline(true);
 await no3d.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /^webgl|experimental-webgl/.test(type)?null:original.call(this,type,...args);};});
 const fallback=await no3d.newPage();await fallback.goto(appUrl);await fallback.locator('#fatal-error').waitFor({state:'visible'});assert.match(await fallback.locator('#fatal-error').innerText(),/3D|重新进入/);await fallback.screenshot({path:out+'/no-webgl-fallback.png'});
 const fallbackLayout=await assertPortraitRotation(fallback);
 check('Unsupported 3D shows a sideways retry screen instead of a blank page',{layout:fallbackLayout});await no3d.close();

 temporary=await mkdtemp(path.join(tmpdir(),'manor-boot-'));
 await copyFile('app/boot.js',path.join(temporary,'boot.js'));await copyFile('app/style.css',path.join(temporary,'style.css'));
 const html=(await readFile('app/index.html','utf8')).replace('src="./app.js"','src="./missing-app.js"');await writeFile(path.join(temporary,'index.html'),html);
 const broken=await browser.newPage({viewport:{width:390,height:844}});await broken.goto(pathToFileURL(path.join(temporary,'index.html')).href);await broken.locator('#fatal-error').waitFor({state:'visible'});assert.match(await broken.locator('[data-error-message]').innerText(),/重新进入/);
 const brokenLayout=await assertPortraitRotation(broken);
 await broken.screenshot({path:out+'/portrait-missing-app.png'});
 check('Independent boot keeps a missing-script retry screen sideways',{layout:brokenLayout});await broken.close();
 passed=true;
 console.log(JSON.stringify({passed,checks:checks.map(c=>c.name),errors,requests},null,2));
}catch(error){failure=String(error.stack||error);console.error(error);process.exitCode=1;}
finally{const files={};for(const name of ['index.html','app.js','boot.js','style.css'])files[name]=createHash('sha256').update(await readFile('app/'+name)).digest('hex');await writeFile(out+'/report.json',JSON.stringify({passed,checks,errors,requests,failure,files,scope:'Current Chrome with WebGL1 and missing APIs simulated; removed toolbar, legacy island entry and help recovery checked; no real Xiaohongshu device test'},null,2));await browser.close();if(temporary)await rm(temporary,{recursive:true,force:true});}
