import {pickWalkSurface} from './walk-picking.js';
import {referenceSky} from './sky.js';
import * as THREE from 'three';
import {createCameraRig} from './camera-rig.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {setupUI} from './ui.js';
import {ram,group,box,cone,disk} from './scene-kit.js';
import {createPlayerAvatar} from './player-avatar.js';
import {createCastleHallScene} from './scenes/castle-hall.js';
import {createCastleStudyScene} from './scenes/castle-study.js';
import {createPlaygroundScene} from './scenes/playground.js';
import {createGameHutScene} from './scenes/game-hut.js';
import {createRamClassroomScene} from './scenes/ram-classroom.js';
import {createHomeGardenScene} from './scenes/home-garden.js';
import {createHomeInteriorScene} from './scenes/home-interior.js';
import {createPetShopScene} from './scenes/pet-shop.js';
import {createCastleScene,createChurchScene,createStreetScene} from './scenes/town.js';
import {createFarmScene,createRanchScene,createRamScene} from './scenes/country.js';
import {createBeachScene} from './scenes/beach.js';
import {createIslandScene} from './scenes/island.js';
import './style.css';
import {createPainter} from './painter.js';
import {createBackgroundMusic} from './background-music.js';

const places={
 island:{title:'摩尔庄园 · 全岛',make:createIslandScene,links:[]},
 castle:{title:'摩尔城堡',make:createCastleScene,links:['church','ram','street','farm','hall']},
 hall:{title:'城堡大厅',make:createCastleHallScene,links:['castle','study']},
 study:{title:'二楼书房',make:createCastleStudyScene,links:['hall']},
 playground:{title:'西部游乐场',make:createPlaygroundScene,links:['street','gamehut']},
 gamehut:{title:'游戏小屋',make:createGameHutScene,links:['playground']},
 classroom:{title:'拉姆教室',make:createRamClassroomScene,links:['ram']},
 home:{title:'摩尔家园',make:createHomeGardenScene,links:['farm','homeinside']},
 homeinside:{title:'家园小屋',make:createHomeInteriorScene,links:['home']},
 church:{title:'爱心教堂',make:createChurchScene,links:['beach','castle','ram']},
 street:{title:'淘淘乐街',make:createStreetScene,links:['castle','ram','ranch','playground','petshop']},
 petshop:{title:'宠物店',make:createPetShopScene,links:['street']},
 beach:{title:'阳光海滩',make:createBeachScene,links:['church','farm']},
 ram:{title:'拉姆学院',make:createRamScene,links:['church','castle','street','classroom']},
 farm:{title:'摩尔农场',make:createFarmScene,links:['beach','castle','ranch','home']},
 ranch:{title:'开心牧场',make:createRanchScene,links:['farm','street']},
};
let visited=new Set();try{visited=new Set(JSON.parse(localStorage.getItem('mole-scenes-visited')||'[]').filter(id=>places[id]&&id!=='island'));}catch{}
const view='classic';
let currentId=null,current=null,mapOpen=true,sound=false,transition=0;
let moving=[],onArrival=null,time=0,last=performance.now(),player,pet,portals=[],lastPortal=null;
let ui,renderer,scene,camera,controls,rig,sun,marker,painter;
let renderStats={calls:0,triangles:0};
const cache=new Map(),keys=new Set(),pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const uiOptions={onVisit:visit,onIsland:()=>visit('island'),onReset:resetView,onSound:toggleSound};
ui=setupUI(uiOptions);
const music=createBackgroundMusic({
 buttonId:'sound-button',volume:.55,
 onStateChange:playing=>{sound=playing;ui.setSound(playing);},
 onError:()=>ui.toast('背景音乐暂时无法播放，请再点一下音乐按钮。'),
});
const stage=document.getElementById('scene-stage'),canvas=document.getElementById('world');

// Static scenery is merged by material while moving characters and mechanisms keep their transforms.
function batch(root,dynamic=[]){
 root.updateMatrixWorld(true);const excluded=new Set();dynamic.filter(Boolean).forEach(g=>g.traverse(o=>excluded.add(o)));
 const batches=new Map(),lineBatches=new Map(),remove=[];
 root.traverse(o=>{
  if(excluded.has(o))return;
  if(o.isInstancedMesh)return;
  if(o.isMesh&&!Array.isArray(o.material)&&!o.material.transparent){
   const key=o.material.uuid+o.castShadow+o.receiveShadow;let a=batches.get(key);if(!a){a={material:o.material,castShadow:o.castShadow,receiveShadow:o.receiveShadow,geos:[]};batches.set(key,a);}
   let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);a.geos.push(g);remove.push(o);
  }else if(o.isLineSegments){
   let a=lineBatches.get(o.material.uuid);if(!a){a={material:o.material,geos:[]};lineBatches.set(o.material.uuid,a);}a.geos.push(o.geometry.clone().applyMatrix4(o.matrixWorld));remove.push(o);
  }
 });
 // Labels can be children of a structural mesh. Reparent them before structural meshes are removed.
 const preserved=[];root.traverse(o=>{if((o.isMesh&&o.material.transparent)&&!excluded.has(o))preserved.push(o);});preserved.forEach(o=>root.attach(o));
 for(const {material,geos,castShadow,receiveShadow} of batches.values()){const geometry=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());if(geometry){const m=new THREE.Mesh(geometry,material);m.castShadow=castShadow;m.receiveShadow=receiveShadow;root.add(m);}}
 for(const {material,geos} of lineBatches.values()){const geometry=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());if(geometry)root.add(new THREE.LineSegments(geometry,material));}
 remove.forEach(o=>o.removeFromParent());
}

function init(){
 try{
 renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 painter=createPainter(renderer);
 scene=new THREE.Scene();scene.background=new THREE.Color(0x91d5f4);scene.fog=new THREE.Fog(0xafe1ef,65,180);
 rig=createCameraRig(canvas,()=>current);camera=rig.camera;controls=rig.controls;
 scene.add(new THREE.HemisphereLight(0xffffff,0xc0c2b4,1.8));const fill=new THREE.DirectionalLight(0xffffff,.35);fill.position.set(18,12,-9);scene.add(fill);
 sun=new THREE.DirectionalLight(0xfffcf3,2.2);sun.position.set(-18,28,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-26,right:26,top:24,bottom:-24,near:1,far:95});sun.shadow.bias=-.0005;sun.shadow.normalBias=.025;sun.shadow.intensity=.72;sun.shadow.autoUpdate=false;scene.add(sun);

 player=createPlayerAvatar(scene,0,0);player.name='我的摩尔';pet=ram(scene,-1,1,0xf4c843);pet.name='小拉姆';painter.prepare(scene);
 marker=disk(scene,0,0,.32,.32,0xffe4a2,.04);marker.visible=false;
 new ResizeObserver(resize).observe(stage);addEvents();
 ui.setVisited([...visited]);ui.setLocationProgress(visited.size);
 window.__manor={ready:true,getState:()=>({mapOpen,destination:currentId,view,visited:[...visited],player:player.position.toArray(),playerModel:player.userData.modelId,playerYaw:player.rotation.y,moving:moving.length>0,portals:portals.map(p=>({target:p.target,position:p.pos.toArray()})),calls:renderStats.calls,triangles:renderStats.triangles,camera:camera.position.toArray(),projection:camera.type,fov:camera.fov,zoom:camera.zoom,assetsPending:pendingAssets,target:controls.target.toArray(),sceneCount:cache.size,sound,music:music.getState()}),getRoutes:()=>Object.fromEntries(Object.entries(places).map(([id,p])=>[id,p.links])),project:(x,y,z)=>project(new THREE.Vector3(x,y,z)),canWalk,walkHeight};
 requestAnimationFrame(animate);
 const initialId=location.hash.slice(1);visit(places[initialId]?initialId:'island');
 }catch(error){console.error(error);ui.setLoading(true,'这个浏览器暂时无法显示 3D，请使用支持 WebGL 的新版浏览器。');}
}
function resize(){if(!renderer)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const size=renderer.getDrawingBufferSize(new THREE.Vector2());painter.resize(size.x,size.y);rig.size(w,h);}
function resetView(){if(current)rig.reset();}

// Wait for the reference-derived sign textures before showing a rebuilt scene.
let pendingAssets=0,assetWaiters=[];
const manager=THREE.DefaultLoadingManager,oldStart=manager.itemStart.bind(manager),oldEnd=manager.itemEnd.bind(manager);
manager.itemStart=url=>{pendingAssets++;oldStart(url);};
manager.itemEnd=url=>{oldEnd(url);pendingAssets--;if(!pendingAssets)assetWaiters.splice(0).forEach(resolve=>resolve());};
const waitForAssets=()=>pendingAssets?new Promise(resolve=>assetWaiters.push(resolve)):Promise.resolve();

async function visit(id,options={}){
 if(id==='map')id='island';if(!places[id])return;
 if(options.viaPortal&&current&& !mapOpen){const portal=portals.find(p=>p.target===id);if(portal){moveTo(portal.pos.x,portal.pos.z,()=>enterScene(id,currentId));return;}}
 await enterScene(id,currentId);
}
async function enterScene(id,from){
 const ticket=++transition;moving=[];onArrival=null;keys.clear();ui.setLoading(true,'正在前往'+places[id].title+'…');
 await new Promise(resolve=>requestAnimationFrame(resolve));if(ticket!==transition)return;
 try{
  if(!cache.has(id)){const next=places[id].make();next.dynamic=next.dynamic||[];painter.prepare(next.root,id==='castle');batch(next.root,next.dynamic);cache.set(id,next);}await waitForAssets();if(ticket!==transition)return;
  if(current)scene.remove(current.root);portals.forEach(p=>{scene.remove(p.object);p.object.traverse(o=>o.geometry?.dispose());});
  current=cache.get(id);currentId=id;scene.add(current.root);scene.background=current.indoor?new THREE.Color(current.background||0xb4a69a):id==='island'?new THREE.Color(0x459ac0):referenceSky(id);
  player.visible=pet.visible=id!=='island';
  // Clear illustrated sky: atmospheric fog must not tint the reference palette.
  scene.fog=null;
  const extent=id==='island'?56:26;Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,far:id==='island'?160:95});sun.shadow.camera.updateProjectionMatrix();sun.position.set(id==='island'?-38:-18,id==='island'?64:28,id==='island'?35:18);
  if(current.indoor){sun.position.set(-7,16,12);sun.intensity=1.65;}else sun.intensity=2.2;
  portals=makePortals(id);mapOpen=false;ui.showScene(id);ui.setPortals(portals.map(p=>({id:p.id,target:p.target,title:places[p.target].title,direct:p.direct})));ui.setView(view);
  player.position.fromArray(current.spawn||[0,.05,7]);player.rotation.y=0;pet.position.copy(player.position).add(new THREE.Vector3(-.9,0,.4));
  if(from&&places[id].links.includes(from)){const back=portals.find(p=>p.target===from);if(back){player.position.set(back.pos.x*.78,.05,back.pos.z-.8);if(!canWalk(player.position.x,player.position.z))player.position.fromArray(current.spawn||[0,.05,7]);pet.position.copy(player.position).add(new THREE.Vector3(-.8,0,.3));}}
  player.position.y=walkHeight(player.position.x,player.position.z);pet.position.y=walkHeight(pet.position.x,pet.position.z);lastPortal=from;marker.visible=false;resize();rig.reset();
  if(id!=='island')visited.add(id);try{localStorage.setItem('mole-scenes-visited',JSON.stringify([...visited]));}catch{}
  ui.setVisited([...visited]);ui.setLocationProgress(visited.size);ui.setLoading(false);
  sun.shadow.needsUpdate=true;renderStats=painter.render(scene,camera);history.replaceState(null,'',location.pathname+location.search+'#'+id);
  if(visited.size===Object.keys(places).length-1&&!sessionStorage.getItem('manor-all-seen')){ui.toast('每一处风景，都留下了你的脚印。');sessionStorage.setItem('manor-all-seen','1');}
 }catch(error){console.error(error);ui.showError('场景没有加载成功，请点下方地名或“全岛”重试。');}
}
function makePortals(id){
 if(id==='island')return current.locations.map(p=>{const pos=new THREE.Vector3(p.x,p.y,p.z);return {id:'island-'+p.id,target:p.id,direct:true,pos,object:group(),labelPosition:pos.clone()};});
 const standard=[[-11.3,.05,5.5],[11.3,.05,5.5],[-7.6,.05,9],[7.6,.05,9]];
 const positions=id==='beach'?[[12,.05,3],[6,.05,7.4]]:id==='ranch'?[[-11.3,.05,5.5],[2.7,.05,8.1]]:standard;
 return places[id].links.map((target,i)=>{
  const roomDoor=current.portalLocations&&current.portalLocations[target];
  const isRoomDoor=Boolean(roomDoor)||(id==='castle'&&target==='hall');
  const pos=new THREE.Vector3(...(roomDoor||(isRoomDoor?[0,.05,1.65]:positions[i])));
  // Keep each exit on traversable ground even when reference scenery occupies a usual corner.
  if(!canWalk(pos.x,pos.z)){let nearest=null,dist=Infinity;for(let x=current.bounds.minX+.6;x<current.bounds.maxX-.6;x+=.55)for(let z=2.5;z<current.bounds.maxZ-.6;z+=.55){const d=Math.hypot(x-pos.x,z-pos.z);if(d<dist&&canWalk(x,z)){nearest=[x,z];dist=d;}}if(nearest){pos.x=nearest[0];pos.z=nearest[1];}}
  pos.y=walkHeight(pos.x,pos.z);const object=group(scene,...pos.toArray());
  if(!isRoomDoor){box(object,0,.65,0,.10,1.3,.12,0xb18c53);box(object,0,1.2,.015,.58,.16,.13,0xeed487);cone(object,0,1.65,0,.13,.19,0xf8d66b,4);}
  const labelOffset=current.portalLabelOffsets&&current.portalLabelOffsets[target];
  const p={id:id+'-'+target,target,pos,object,labelPosition:pos.clone().add(new THREE.Vector3(...(labelOffset||[0,isRoomDoor?1.8:2.3,0])))};return p;
 });
}
function project(pos){const v=pos.clone().project(camera);return{x:(v.x*.5+.5)*stage.clientWidth,y:(-.5*v.y+.5)*stage.clientHeight,visible:Math.abs(v.x)<.94&&Math.abs(v.y)<.94&&v.z>-1&&v.z<1};}

export function canWalk(x,z){
 if(!current)return false;const b=current.bounds||{minX:-13,maxX:13,minZ:-7,maxZ:10};
 if(x<b.minX+.25||x>b.maxX-.25||z<b.minZ+.25||z>b.maxZ-.25)return false;
 if(current.walkable&&!current.walkable(x,z))return false;
 return !(current.colliders||[]).some(c=>c.walkBlock===false?false:c.kind==='ellipse'?((x-c.x)/(c.rx+.32))**2+((z-c.z)/(c.rz+.32))**2<1:Math.abs(x-c.x)<c.rx+.28&&Math.abs(z-c.z)<c.rz+.28);
}
export function walkHeight(x,z){return current?.heightAt?.(x,z)??.05;}
function canStep(x,z,fromX,fromZ){return canWalk(x,z)&&Math.abs(walkHeight(x,z)-walkHeight(fromX,fromZ))<=.39+Math.hypot(x-fromX,z-fromZ)*.8;}
function canTraverse(fromX,fromZ,x,z){
 const steps=Math.max(1,Math.ceil(Math.hypot(x-fromX,z-fromZ)/.10));let px=fromX,pz=fromZ;
 for(let i=1;i<=steps;i++){const nx=fromX+(x-fromX)*i/steps,nz=fromZ+(z-fromZ)*i/steps;if(!canStep(nx,nz,px,pz))return false;px=nx;pz=nz;}
 return true;
}
function routeTo(x,z){
 const step=.55,b=current.bounds,ox=b.minX+.3,oz=b.minZ+.3;
 const key=(a,b)=>a+','+b,pos=n=>({x:ox+n.a*step,z:oz+n.b*step});
 let start={a:Math.round((player.position.x-ox)/step),b:Math.round((player.position.z-oz)/step)};
 if(!canWalk(pos(start).x,pos(start).z)||!canTraverse(player.position.x,player.position.z,pos(start).x,pos(start).z)){
  let nearest=null,distance=Infinity;for(let a=-2;a<=2;a++)for(let bb=-2;bb<=2;bb++){const candidate={a:start.a+a,b:start.b+bb},p=pos(candidate),d=Math.hypot(p.x-player.position.x,p.z-player.position.z);if(d<distance&&canWalk(p.x,p.z)&&canTraverse(player.position.x,player.position.z,p.x,p.z)){nearest=candidate;distance=d;}}
  if(!nearest)return [];start=nearest;
 }
 const end={a:Math.round((x-ox)/step),b:Math.round((z-oz)/step)};
 let goal=end;
 if(!canWalk(pos(end).x,pos(end).z)){let best=Infinity;for(let a=-4;a<=4;a++)for(let bb=-4;bb<=4;bb++){const n={a:end.a+a,b:end.b+bb},p=pos(n);const d=Math.hypot(p.x-x,p.z-z);if(d<best&&canWalk(p.x,p.z)){goal=n;best=d;}}if(best===Infinity)return [];}
 const h=n=>Math.hypot(n.a-goal.a,n.b-goal.b),open=[{...start,g:0,f:h(start),prev:null}],best=new Map([[key(start.a,start.b),0]]);let found;
 for(let it=0;open.length&&it<4500;it++){
  open.sort((a,b)=>a.f-b.f);const n=open.shift();if(n.a===goal.a&&n.b===goal.b){found=n;break;}
  for(const [da,db] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
   const next={a:n.a+da,b:n.b+db},p=pos(next);if(!canTraverse(pos(n).x,pos(n).z,p.x,p.z))continue;
   if(da&&db&&(!canWalk(ox+(n.a+da)*step,oz+n.b*step)||!canWalk(ox+n.a*step,oz+(n.b+db)*step)))continue;
   const g=n.g+Math.hypot(da,db),k=key(next.a,next.b);if((best.get(k)??Infinity)<=g)continue;best.set(k,g);open.push({...next,g,f:g+h(next),prev:n});
  }
 }
 if(!found)return [];const points=[];for(let n=found;n;n=n.prev){const p=pos(n);points.push(new THREE.Vector3(p.x,.05,p.z));}return points.reverse();
}
function moveTo(x,z,callback=null){
 if(mapOpen||!current||currentId==='island')return;const path=routeTo(x,z);
 if(!path.length){if(callback&&Math.hypot(player.position.x-x,player.position.z-z)<1.2){callback();return;}ui.toast('这边被挡住了，沿小路走走吧。');return;}
 moving=path;onArrival=callback;marker.position.copy(path.at(-1));marker.position.y=walkHeight(marker.position.x,marker.position.z)+.012;marker.visible=true;
}
function updatePlayer(dt){
 const dir=new THREE.Vector3();const horizontal=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),vertical=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
 const manual=Boolean(horizontal||vertical);let remaining=Infinity;
 if(manual){moving=[];onArrival=null;dir.copy(rig.groundDirection(horizontal,vertical));marker.visible=false;}
 else if(moving.length){
  while(moving.length&&Math.hypot(moving[0].x-player.position.x,moving[0].z-player.position.z)<.025){
   player.position.x=moving[0].x;player.position.z=moving[0].z;moving.shift();
  }
  if(!moving.length){marker.visible=false;const cb=onArrival;onArrival=null;player.position.y=walkHeight(player.position.x,player.position.z);cb?.();return;}
  dir.copy(moving[0]).sub(player.position);dir.y=0;remaining=dir.length();dir.normalize();
 }
 if(dir.lengthSq()){
  const step=Math.min(remaining,(keys.has('ShiftLeft')||keys.has('ShiftRight')?6.2:3.7)*dt),nx=player.position.x+dir.x*step,nz=player.position.z+dir.z*step;
  if(canTraverse(player.position.x,player.position.z,nx,nz)){player.position.x=nx;player.position.z=nz;}
  else if(manual&&canTraverse(player.position.x,player.position.z,nx,player.position.z))player.position.x=nx;
  else if(manual&&canTraverse(player.position.x,player.position.z,player.position.x,nz))player.position.z=nz;
  else if(moving.length){moving=[];onArrival=null;marker.visible=false;ui.toast('这里的台阶太高，沿小路换个方向吧。');}
  const yaw=Math.atan2(dir.x,dir.z);player.rotation.y+=Math.atan2(Math.sin(yaw-player.rotation.y),Math.cos(yaw-player.rotation.y))*.2;player.position.y=walkHeight(player.position.x,player.position.z)+(reduced?0:Math.abs(Math.sin(time*11))*.045);
 }else player.position.y=walkHeight(player.position.x,player.position.z);
 const gap=player.position.clone().sub(pet.position);gap.y=0;
 if(gap.length()>1.05){const next=pet.position.clone().addScaledVector(gap,Math.min(dt*2.7,1));if(canTraverse(pet.position.x,pet.position.z,next.x,next.z))pet.position.copy(next);else if(gap.length()>2.6)pet.position.copy(player.position);}
 pet.position.y=walkHeight(pet.position.x,pet.position.z)+.02+(reduced?0:Math.sin(time*3)*.035);
 if(manual){for(const p of portals)if(Math.hypot(player.position.x-p.pos.x,player.position.z-p.pos.z)<.55){if(lastPortal===p.target)continue;enterScene(p.target,currentId);return;}}
 if(lastPortal&&!portals.some(p=>p.target===lastPortal&&Math.hypot(player.position.x-p.pos.x,player.position.z-p.pos.z)<1.4))lastPortal=null;
}
function addEvents(){
 addEventListener('hashchange',()=>{const id=location.hash.slice(1);visit(places[id]?id:'island');});
 let down=null,multitouch=false;const activePointers=new Set();
 canvas.addEventListener('pointerdown',e=>{activePointers.add(e.pointerId);multitouch=activePointers.size>1;down={x:e.clientX,y:e.clientY,t:performance.now()};});
 canvas.addEventListener('pointerup',e=>{activePointers.delete(e.pointerId);if(down&&!multitouch&&!mapOpen&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const at=pickWalkSurface(raycaster.ray,current&&current.walkLevels,walkHeight,canWalk);if(at)moveTo(at.x,at.z);}down=null;if(!activePointers.size)multitouch=false;});
 canvas.addEventListener('pointercancel',e=>{activePointers.delete(e.pointerId);down=null;});
 addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)||document.querySelector('dialog[open]'))return;if(!mapOpen&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){keys.add(e.code);e.preventDefault();}});
 addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{keys.clear();last=performance.now();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ui.toast('画面暂时休息了，刷新页面即可重新进入。');});
}
function toggleSound(){
 music.toggle();
}
let shadowTime=-1;
function animate(now){
 requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.18);last=now;if(document.hidden||mapOpen||!current)return;time+=dt;
 const paused=Boolean(document.querySelector('dialog[open]'));
 if(!paused&&currentId!=='island'){for(let remaining=dt;remaining>0;){const step=Math.min(remaining,1/30);updatePlayer(step);remaining-=step;}}
 rig.update();
 if(current.fogRelative&&scene.fog){const distance=camera.position.distanceTo(controls.target);scene.fog.near=distance+current.fogRelative[0];scene.fog.far=distance+current.fogRelative[1];}
 if(!reduced)current.updates?.forEach(fn=>fn(time,dt));
 if(time-shadowTime>.22){sun.shadow.needsUpdate=true;shadowTime=time;}
 ui.updatePortals(portals.map(p=>({id:p.id,...project(p.labelPosition)})));renderStats=painter.render(scene,camera);
}
init();
