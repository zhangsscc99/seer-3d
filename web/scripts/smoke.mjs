import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--allow-file-access-from-files']});
const context=await browser.newContext({viewport:{width:1280,height:800}});
await context.setOffline(true);
const page=await context.newPage(),errors=[],requests=[],views=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
const url=pathToFileURL(path.resolve('dist/摩尔庄园.html')).href;
let failure;
try{
  await page.goto(url+'#island');
  await page.waitForFunction(()=>window.__manor?.ready);
  const destinations=await page.evaluate(()=>Object.keys(window.__manor.getRoutes()));
  assert.equal(destinations.length,16);
  for(const id of destinations){
    await page.evaluate(id=>{location.hash=id;},id);
    await page.waitForFunction(id=>{
      const state=window.__manor?.getState();
      return state?.destination===id&&state.assetsPending===0&&state.calls>0&&state.triangles>1000;
    },id,{timeout:60000});
    const state=await page.evaluate(()=>window.__manor.getState());
    assert.equal(state.playerModel,'pink-winged-mole');
    // The desktop edition caches visited scenes; the mobile edition retires them.
    assert(state.sceneCount>=1&&state.sceneCount<=destinations.length);
    assert(Math.abs(state.zoom-(id==='island'?1.32:1.1))<0.00001);
    views.push({destination:id,triangles:state.triangles,zoom:state.zoom,cachedScenes:state.sceneCount});
    console.log('PASS '+id);
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual(requests,[]);
}catch(error){failure=String(error.stack||error);process.exitCode=1;console.error(failure);}
finally{
  await mkdir('evidence',{recursive:true});
  await writeFile('evidence/smoke.json',JSON.stringify({passed:!failure,views,errors,requests,failure},null,2));
  await browser.close();
}
