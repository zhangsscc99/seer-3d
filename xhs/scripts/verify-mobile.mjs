import assert from 'node:assert/strict';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'evidence/mobile');
await mkdir(output,{recursive:true});
const {chromium}=await import('playwright-core');
const base=process.env.MANOR_URL||pathToFileURL(path.join(root,'app/index.html')).href;
const entry=base.replace(/#.*$/,'')+'#farm';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--allow-file-access-from-files']});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
const page=await context.newPage();
const cdp=await context.newCDPSession(page);
const report={startedAt:new Date().toISOString(),entry,passed:false,checks:[],scenes:[],layouts:[],screenshots:[],errors:[],consoleErrors:[],consoleWarnings:[],networkRequests:[],blockedRequests:[],failedRequests:[],cspViolations:[],artifacts:{}};
report.runtime={browserVersion:browser.version(),mobileEmulation:true,touchInput:'CDP Input.dispatchTouchEvent',deviceScaleFactor:1,physicalDevice:false};
let currentCheck='initialization';
const sha=data=>createHash('sha256').update(data).digest('hex');
for(const name of ['index.html','app.js','boot.js','style.css']){try{const data=await readFile(path.join(root,'app',name));report.artifacts[name]={sha256:sha(data),bytes:data.length};}catch(error){report.artifacts[name]={error:error.message};}}
page.on('pageerror',error=>report.errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')report.consoleErrors.push(message.text());else if(message.type()==='warning')report.consoleWarnings.push(message.text());});
page.on('requestfailed',request=>report.failedRequests.push({url:request.url().slice(0,500),error:request.failure()}));
page.on('request',request=>{if(/^https?:/.test(request.url()))report.networkRequests.push({url:request.url(),resourceType:request.resourceType()});});
const localOrigin=/^https?:/.test(base)?new URL(base).origin:null;
await context.route('**/*',async route=>{
 const request=route.request(),url=request.url();
 if(/^https?:/.test(url)){
  const localResource=localOrigin&&new URL(url).origin===localOrigin&&['document','script','stylesheet','image'].includes(request.resourceType());
  if(!localResource){report.blockedRequests.push(url);await route.abort();return;}
 }
 await route.continue();
});
await page.addInitScript(()=>{
 window.__xhsMobileCsp=[];
 document.addEventListener('securitypolicyviolation',event=>window.__xhsMobileCsp.push({directive:event.effectiveDirective,blockedURI:event.blockedURI,disposition:event.disposition}));
});
if(!localOrigin)await context.setOffline(true);
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const state=()=>page.evaluate(()=>window.__manor.getState());
const pointDistance=(a,b)=>Math.sqrt(a.reduce((sum,v,i)=>sum+(v-b[i])**2,0));
const radius=s=>pointDistance(s.camera,s.target);
async function check(name,fn){currentCheck=name;const details=await fn();report.checks.push({name,status:'PASS',details:details||null});console.log('PASS '+name);}
async function ready(id){
 await page.waitForFunction(id=>{
  const api=window.__manor;if(!api||!api.ready)return false;
  const s=api.getState(),loading=document.getElementById('stage-loading');
  return s.destination===id&&!s.mapOpen&&s.assetsPending===0&&s.sceneCount===1&&s.calls>0&&s.triangles>1000&&(!loading||loading.hidden);
 },id,{timeout:60000});
 await sleep(200);
 return state();
}
async function touch(type,points){
 await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map((p,i)=>({x:p.x,y:p.y,id:p.id===undefined?i:p.id,radiusX:2,radiusY:2,force:1}))});
}
async function tap(point){
 assert(point.x>=0&&point.y>=0&&point.x<page.viewportSize().width&&point.y<page.viewportSize().height,'Tap must be inside the physical phone viewport');
 await touch('touchStart',[point]);await sleep(45);await touch('touchEnd',[]);
}
async function tapSelector(selector){const node=page.locator(selector);await node.waitFor({state:'visible'});await node.scrollIntoViewIfNeeded();const rect=await node.boundingBox();assert(rect,selector+' must have a touch target');await tap({x:rect.x+rect.width/2,y:rect.y+rect.height/2});}
async function tapTestId(id){return tapSelector('[data-testid="'+id+'"]');}
async function canvasMetrics(){return page.locator('#world').evaluate(canvas=>{const rect=canvas.getBoundingClientRect();return {left:rect.left,right:rect.right,top:rect.top,width:rect.width,height:rect.height,logicalWidth:canvas.clientWidth,logicalHeight:canvas.clientHeight,rotated:window.__manor.getState().layout.rotated};});}
function toPhysical(metrics,x,y){return metrics.rotated?{x:metrics.right-y*metrics.width/metrics.logicalHeight,y:metrics.top+x*metrics.height/metrics.logicalWidth}:{x:metrics.left+x*metrics.width/metrics.logicalWidth,y:metrics.top+y*metrics.height/metrics.logicalHeight};}
async function drag(){
 const m=await canvasMetrics();
 let start=null;
 for(const fraction of [.46,.16,.75]){
  const candidate={x:m.logicalWidth*.39,y:m.logicalHeight*fraction};
  const physical=toPhysical(m,candidate.x,candidate.y);
  const hitCanvas=await page.evaluate(point=>document.elementFromPoint(point.x,point.y)?.id==='world',physical);
  if(hitCanvas){start=candidate;break;}
 }
 assert(start,'A drag must start on the WebGL canvas, not on an overlaid landmark button');
 const end={x:m.logicalWidth*.64,y:start.y};
 await touch('touchStart',[toPhysical(m,start.x,start.y)]);
 for(let step=1;step<=9;step++){await touch('touchMove',[toPhysical(m,start.x+(end.x-start.x)*step/9,start.y)]);await sleep(20);}
 await touch('touchEnd',[]);await sleep(700);
 return {logicalStart:start,logicalEnd:end,physicalStart:toPhysical(m,start.x,start.y),physicalEnd:toPhysical(m,end.x,end.y)};
}
async function pinch(cancel=false){
 const m=await canvasMetrics(),x=m.logicalWidth*.51,y=m.logicalHeight*.47;
 const points=d=>[{...toPhysical(m,x-d,y),id:11},{...toPhysical(m,x+d,y),id:12}];
 await touch('touchStart',points(42));
 for(let step=1;step<=8;step++){await touch('touchMove',points(42+step*5));await sleep(20);}
 await touch(cancel?'touchCancel':'touchEnd',[]);await sleep(700);
}
async function layoutSnapshot(label){
 const result=await page.evaluate(()=>{
  const state=window.__manor.getState(),shell=document.getElementById('app-shell');
  const rectOf=element=>{const r=element.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const visible=element=>{const s=getComputedStyle(element);return !element.hidden&&s.display!=='none'&&s.visibility!=='hidden'&&element.getBoundingClientRect().width>0;};
  const essentials=['#island-button','#help-button','#reset-button','[data-testid="toggle-sound"]','[data-testid="view-classic"]'].map(selector=>document.querySelector(selector)).filter(node=>node&&visible(node));
  return {viewport:{width:innerWidth,height:innerHeight},documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,state:state.layout,shell:rectOf(shell),shellTransform:getComputedStyle(shell).transform,canvas:rectOf(document.getElementById('world')),essentialControls:essentials.map(node=>({id:node.id||node.dataset.testid,rect:rectOf(node),insideShell:shell.contains(node)}))};
 });
 const {width,height}=result.viewport;
 assert.equal(result.state.rotated,height>width,label+': portrait rotation flag');
 assert.equal(result.state.width,Math.max(width,height),label+': landscape logical width');
 assert.equal(result.state.height,Math.min(width,height),label+': landscape logical height');
 assert(Math.max(result.documentWidth,result.bodyWidth)<=width+1,label+': document must not scroll horizontally');
 function contained(r,name){assert(r.left>=-1&&r.top>=-1&&r.right<=width+1&&r.bottom<=height+1,label+': '+name+' stays inside viewport: '+JSON.stringify(r));}
 contained(result.shell,'whole app');contained(result.canvas,'3D canvas');
 for(const control of result.essentialControls){assert(control.insideShell,label+': '+control.id+' follows rotated app');contained(control.rect,control.id);}
 report.layouts.push({label,...result});return result;
}
async function screenshot(name,rotated){
 const raw=path.join(output,name+'.png');await page.screenshot({path:raw,fullPage:false});
 report.screenshots.push(path.relative(root,raw));
 if(rotated){
  const python=process.env.MANOR_PYTHON||'python3';

  const upright=path.join(output,name+'-upright.png');
  execFileSync(python,['-c','from PIL import Image\nimport sys\nim=Image.open(sys.argv[1]); im.transpose(Image.Transpose.ROTATE_90).save(sys.argv[2])',raw,upright]);
  report.screenshots.push(path.relative(root,upright));
 }
}
async function assertOverlay(id){
 const node=page.locator('#'+id);await node.waitFor({state:'visible'});
 const info=await node.evaluate(node=>{const r=node.getBoundingClientRect();return {insideShell:document.getElementById('app-shell').contains(node),rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},viewport:{width:innerWidth,height:innerHeight}};});
 assert(info.insideShell,id+' belongs to rotated app shell');
 assert(info.rect.left>=-1&&info.rect.top>=-1&&info.rect.right<=info.viewport.width+1&&info.rect.bottom<=info.viewport.height+1,id+' fits physical viewport');
 return info;
}
try{
 await page.goto(entry,{waitUntil:'load',timeout:60000});
 await ready('farm');
 await check('portrait layout rotates entire app by 90 degrees',async()=>{const info=await layoutSnapshot('390x844 portrait');assert(/^matrix\(0, 1, -1, 0,/.test(info.shellTransform),'Whole app must be rotated clockwise 90 degrees');await screenshot('portrait-farm',true);return info.state;});
 await check('one panorama mode and the reduced toolbar render a real local WebGL scene',async()=>{
  const s=await state();assert.equal(s.view,'classic');assert.equal(s.projection,'PerspectiveCamera');assert(['webgl','webgl2'].includes(s.webgl));
  assert.equal(await page.locator('[data-testid="view-classic"]').count(),1);
  assert.equal(await page.locator('[data-testid="view-classic"]').innerText(),'3D 全景');
  assert.equal(await page.locator('[data-testid="view-free"],[data-testid="view-walk"],[data-testid="view-fly"],#fullscreen-button,.movement-pad,.flight-pad').count(),0);
  assert.equal(await page.getByTestId('world-overview').count(),1);
  assert.equal(await page.getByTestId('world-overview').innerText(),'全岛');
  assert.equal(await page.locator('#map-button,#reference-button,#photo-button,#map-stage,#reference-dialog,#photo-dialog,[data-testid="back-to-map"],[data-testid="toggle-reference"],[data-testid="take-photo"],[data-testid="save-photo"]').count(),0,'Removed toolbar actions and their overlays must not remain in the DOM');
  return {projection:s.projection,webgl:s.webgl,triangles:s.triangles,calls:s.calls};
 });
 const defaultCamera=(await state()).camera;
 await check('physical touch reaches projected farm ground',async()=>{
  const before=await state();const target=[.1,.05,1.3];
  const projected=await page.evaluate(target=>({point:window.__manor.projectClient(...target),canWalk:window.__manor.canWalk(target[0],target[2])}),target);
  assert(projected.canWalk&&projected.point.visible,'Farm test point must be visible and walkable');
  await tap(projected.point);
  await page.waitForFunction(before=>{const s=window.__manor.getState();return s.moving||Math.hypot(s.player[0]-before[0],s.player[2]-before[2])>.1;},before.player,{timeout:6000});
  await page.waitForFunction(target=>{const s=window.__manor.getState();return !s.moving&&Math.hypot(s.player[0]-target[0],s.player[2]-target[2])<.45;},target,{timeout:20000});
  return {target,physicalTap:projected.point,before:before.player,after:(await state()).player};
 });
 await check('logical horizontal drag orbits without walking',async()=>{
  const before=await state(),gesture=await drag(),after=await state();
  assert(pointDistance(after.camera,before.camera)>2,'Dragging changes view');assert(pointDistance(after.player,before.player)<.01&&!after.moving,'Orbit gesture must not issue a walk target');
  assert(Math.abs(radius(after)-radius(before))<.08,'Single-finger drag must not zoom');
  assert(Math.abs(gesture.physicalEnd.x-gesture.physicalStart.x)<.01&&gesture.physicalEnd.y>gesture.physicalStart.y,'Logical horizontal motion is physical vertical motion in portrait');
  return {gesture,cameraBefore:before.camera,cameraAfter:after.camera};
 });
 await check('two fingers spread to zoom in without an accidental tap',async()=>{
  await tapTestId('reset-view');await sleep(200);const before=await state();await pinch();const after=await state();
  assert(radius(after)<radius(before)*.8,'Spreading fingers zooms in');assert(!after.moving&&pointDistance(before.player,after.player)<.01,'Pinch release must not walk');
  return {radiusBefore:radius(before),radiusAfter:radius(after),player:after.player};
 });
 await check('pinch cancellation recovers for the next drag',async()=>{
  await tapTestId('reset-view');await sleep(200);const before=await state();await pinch(true);const cancelled=await state();
  assert(!cancelled.moving&&pointDistance(before.player,cancelled.player)<.01,'Touch cancellation must not tap');
  await drag();const after=await state();assert(pointDistance(cancelled.camera,after.camera)>2,'The next gesture works after cancellation');assert(!after.moving&&pointDistance(before.player,after.player)<.01);
  return {radiusAfterCancel:radius(cancelled),cameraAfterRecovery:after.camera};
 });
 await check('reset restores the slightly closer default camera',async()=>{
  await tapTestId('reset-view');await sleep(250);const s=await state();assert(pointDistance(defaultCamera,s.camera)<.001,'Reset restores exact default');return {defaultCamera,cameraAfterReset:s.camera};
 });
 await check('rotated help closes and real touch resumes panorama control',async()=>{
  await tapTestId('show-help');const help=await assertOverlay('help-dialog');await screenshot('portrait-help',true);
  await tapTestId('close-help');await page.locator('#help-dialog').waitFor({state:'hidden'});
  const before=await state();await drag();const after=await state();
  assert(pointDistance(before.camera,after.camera)>2,'Closing help restores actual touch orbit');
  assert(!after.moving&&pointDistance(before.player,after.player)<.01,'The recovered drag must not walk');
  await tapTestId('reset-view');return {help,cameraBefore:before.camera,cameraAfter:after.camera};
 });
 await check('legacy map hash enters the single 3D island view on an open page',async()=>{
  await page.evaluate(()=>{location.hash='map';});const s=await ready('island');
  assert.equal(new URL(page.url()).hash,'#island');assert.equal(s.mapOpen,false);assert.equal(s.sceneCount,1);
  assert.equal(await page.locator('#map-stage').count(),0);await screenshot('portrait-island-legacy-entry',true);
  return {hash:new URL(page.url()).hash,destination:s.destination,sceneCount:s.sceneCount};
 });
 await check('all sixteen scenes and nine island landmarks navigate offline with one retained scene',async()=>{
  for(const id of ['castle','hall','study','church','street','beach','farm','ranch','ram','playground','gamehut','classroom','home','homeinside','petshop','island']){
   await tapTestId(id==='island'?'world-overview':'destination-'+id);const s=await ready(id);
   assert.equal(s.sceneCount,1);assert.equal(s.assetsPending,0);assert(s.triangles>1000&&s.calls>0);
   assert.equal(s.playerModel,'pink-winged-mole');assert.equal(s.zoom,id==='island'?1.32:1.1);
   report.scenes.push({id,playerModel:s.playerModel,zoom:s.zoom,sceneCount:s.sceneCount,assetsPending:s.assetsPending,calls:s.calls,triangles:s.triangles,memory:s.memory,webgl:s.webgl});
   if(id==='island'){
    const markers=await page.locator('.island-marker').evaluateAll(buttons=>buttons.filter(b=>!b.hidden).map(b=>{const r=b.getBoundingClientRect(),p={x:r.x+r.width/2,y:r.y+r.height/2};return {id:b.dataset.portal,left:r.left,top:r.top,right:r.right,bottom:r.bottom,hit:b.contains(document.elementFromPoint(p.x,p.y))};}));
    assert.equal(markers.length,9,'All nine island destinations are visible initially');
    for(let i=0;i<markers.length;i++){
     const a=markers[i];assert(a.hit,'The physical touch center reaches '+a.id);
     for(let j=0;j<i;j++){const b=markers[j],w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);assert(w<=.5||h<=.5,'Island labels overlap: '+a.id+' / '+b.id);}
    }
    report.islandMarkers=markers;
   }
   await screenshot('scene-'+id,true);
  }
  report.islandMarkerVisits=[];
  for(const marker of report.islandMarkers){
   const id=marker.id.replace(/^island-/,''),before=await state();assert.equal(before.destination,'island');
   await tapTestId('portal-'+marker.id);const entered=await ready(id);assert.equal(entered.sceneCount,1);
   await tapTestId('world-overview');const returned=await ready('island');assert.equal(returned.sceneCount,1);
   report.islandMarkerVisits.push({marker:marker.id,destination:entered.destination,returnedTo:returned.destination,touchInput:'CDP Input.dispatchTouchEvent'});
  }
  assert.equal(report.islandMarkerVisits.length,9);
  return {scenes:report.scenes,landmarkVisits:report.islandMarkerVisits};
 });
 await check('landscape viewport is not rotated a second time',async()=>{
  await page.setViewportSize({width:844,height:390});await sleep(400);const info=await layoutSnapshot('844x390 landscape');assert.equal(info.shellTransform,'none');await screenshot('landscape-island',false);
  await tapTestId('reset-view');const before=await state();await drag();const after=await state();assert(pointDistance(before.camera,after.camera)>2,'Landscape drag remains usable');
  await page.setViewportSize({width:390,height:844});await sleep(300);await layoutSnapshot('390x844 portrait restored');return info.state;
 });
 await check('small and large phones fit with usable rotated dialogs',async()=>{
  for(const viewport of [{width:320,height:568},{width:430,height:932}]){
   await page.setViewportSize(viewport);await sleep(300);await tapTestId('reset-view');await layoutSnapshot(viewport.width+'x'+viewport.height);
   await tapTestId('show-help');await assertOverlay('help-dialog');await tapSelector('#help-close');await page.locator('#help-dialog').waitFor({state:'hidden'});
   await screenshot('phone-'+viewport.width+'x'+viewport.height,true);
  }
  return {viewports:['320x568','430x932'],deviceScaleFactor:1,physicalDevice:false};
 });
 await check('CSP and offline rendering produce no runtime errors or network calls',async()=>{
  report.csp=await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  assert(report.csp&&/connect-src\s+'none'/.test(report.csp),'CSP explicitly blocks connections');
  assert(!/script-src[^;]*(?:unsafe-inline|unsafe-eval)/.test(report.csp),'CSP never enables inline scripts or eval');
  report.cspViolations=await page.evaluate(()=>window.__xhsMobileCsp||[]);
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.cspViolations,[]);assert.deepEqual(report.blockedRequests,[]);assert.deepEqual(report.failedRequests,[]);
  if(!localOrigin)assert.deepEqual(report.networkRequests,[]);
  else assert(report.networkRequests.every(request=>new URL(request.url).origin===localOrigin&&!['fetch','xhr','websocket','eventsource'].includes(request.resourceType)));
  return {csp:report.csp,offline:!localOrigin,networkRequests:report.networkRequests.length,pageErrors:0,consoleErrors:0,cspViolations:0};
 });
 report.passed=true;
}catch(error){report.failure={check:currentCheck,message:error.message,stack:error.stack};console.error('FAIL '+currentCheck+': '+error.message);try{await screenshot('failure',page.viewportSize().height>page.viewportSize().width);}catch(screenshotError){report.screenshotError=screenshotError.message;}process.exitCode=1;
}finally{
 try{report.cspViolations=await page.evaluate(()=>window.__xhsMobileCsp||[]);report.finalState=await state();}catch(error){report.finalStateError=error.message;}
 report.completedAt=new Date().toISOString();report.checkCount=report.checks.length;
 await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 await browser.close();
 console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,scenes:report.scenes.length,errors:report.errors.length,consoleErrors:report.consoleErrors.length,cspViolations:report.cspViolations.length,report:path.join(output,'report.json')}));
}
