import * as THREE from 'three';

// All gestures use the canvas's logical coordinates, including in a 90-degree shell.
export function createCameraRig(canvas,getScene,options) {
 options=options||{};
 const camera=new THREE.PerspectiveCamera(43,1,.10,330);
 const controls={target:new THREE.Vector3(),enabled:true,minDistance:5,maxDistance:150,minPolarAngle:.12,maxPolarAngle:1.48};
 const spherical=new THREE.Spherical(30,1,0),wanted=new THREE.Spherical(30,1,0);
 const offset=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),forward=new THREE.Vector3(),right=new THREE.Vector3();
 let pointers=Object.create(null),ids=[],pinchDistance=0,multiGesture=false;
 let width=1,height=1,lastTouchTime=0;
 const clamp=THREE.MathUtils.clamp;
 canvas.style.touchAction='none';

 function allowed(){return controls.enabled&&(!options.canInteract||options.canInteract());}
 function local(x,y){
  if(options.toLocal)return options.toLocal(x,y,canvas);
  const rect=canvas.getBoundingClientRect();
  return {x:(x-rect.left)*width/(rect.width||1),y:(y-rect.top)*height/(rect.height||1)};
 }
 function distance(a,b){const dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy);}
 function currentPinch(){return ids.length>1?distance(pointers[ids[0]],pointers[ids[1]]):0;}
 function release(id){
  if(canvas.releasePointerCapture&&canvas.hasPointerCapture){
   try{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}catch(error){/* A cancelled host gesture may already have released capture. */}
  }
 }
 function cancelGesture(){
  const oldIds=ids.slice();
  pointers=Object.create(null);ids=[];pinchDistance=0;multiGesture=false;
  oldIds.forEach(release);
 }
 function begin(id,clientX,clientY){
  if(!allowed())return false;
  const p=local(clientX,clientY);
  if(p.x<0||p.y<0||p.x>width||p.y>height)return false;
  pointers[id]={x:p.x,y:p.y,startX:p.x,startY:p.y,dragged:false,started:Date.now()};
  if(ids.indexOf(id)<0)ids.push(id);
  if(ids.length>1){multiGesture=true;pinchDistance=currentPinch();}
  return true;
 }
 function move(id,clientX,clientY){
  const p=pointers[id];
  if(!p)return false;
  if(!allowed()){cancelGesture();return false;}
  const next=local(clientX,clientY),dx=next.x-p.x,dy=next.y-p.y;
  p.x=next.x;p.y=next.y;
  if(distance(p,{x:p.startX,y:p.startY})>=6)p.dragged=true;
  if(ids.length>1){
   const nextDistance=currentPinch();
   if(pinchDistance>4&&nextDistance>4)wanted.radius=clamp(wanted.radius*pinchDistance/nextDistance,controls.minDistance,controls.maxDistance);
   pinchDistance=nextDistance;
  }else if(p.dragged||multiGesture){
   wanted.theta-=2*Math.PI*dx/Math.max(height,1)*.62;
   wanted.phi=clamp(wanted.phi-2*Math.PI*dy/Math.max(height,1)*.62,controls.minPolarAngle,controls.maxPolarAngle);
  }
  return true;
 }
 function end(id,clientX,clientY,cancelled){
  const p=pointers[id];
  if(!p)return;
  const point=local(clientX,clientY);
  const tap=!cancelled&&!multiGesture&&!p.dragged&&ids.length===1&&distance(point,{x:p.startX,y:p.startY})<6&&Date.now()-p.started<700&&allowed();
  delete pointers[id];ids=ids.filter(function(other){return other!==id;});
  release(id);
  pinchDistance=currentPinch();
  if(!ids.length)multiGesture=false;
  // Removing a finger from a pinch can never generate a ground tap.
  if(tap&&point.x>=0&&point.y>=0&&point.x<=width&&point.y<=height&&options.onTap)options.onTap(point);
 }
 function stopDefault(event){if(event.cancelable)event.preventDefault();}

 if(window.PointerEvent){
  canvas.addEventListener('pointerdown',function(event){
   if(event.pointerType==='mouse'&&event.button!==0)return;
   if(!begin(event.pointerId,event.clientX,event.clientY))return;
   stopDefault(event);
   if(canvas.setPointerCapture){try{canvas.setPointerCapture(event.pointerId);}catch(error){/* Window listeners still track the gesture. */}}
  });
  window.addEventListener('pointermove',function(event){if(move(event.pointerId,event.clientX,event.clientY))stopDefault(event);},{passive:false});
  window.addEventListener('pointerup',function(event){end(event.pointerId,event.clientX,event.clientY,false);});
  window.addEventListener('pointercancel',cancelGesture);
  canvas.addEventListener('lostpointercapture',function(event){if(pointers[event.pointerId])cancelGesture();});
 }else{
  canvas.addEventListener('touchstart',function(event){
   lastTouchTime=Date.now();let active=false;
   for(let i=0;i<event.changedTouches.length;i++){const t=event.changedTouches[i];active=begin(t.identifier,t.clientX,t.clientY)||active;}
   if(active)stopDefault(event);
  },{passive:false});
  window.addEventListener('touchmove',function(event){
   let active=false;
   for(let i=0;i<event.changedTouches.length;i++){const t=event.changedTouches[i];active=move(t.identifier,t.clientX,t.clientY)||active;}
   if(active)stopDefault(event);
  },{passive:false});
  window.addEventListener('touchend',function(event){
   lastTouchTime=Date.now();
   for(let i=0;i<event.changedTouches.length;i++){const t=event.changedTouches[i];end(t.identifier,t.clientX,t.clientY,false);}
  });
  window.addEventListener('touchcancel',function(){lastTouchTime=Date.now();cancelGesture();});
  canvas.addEventListener('mousedown',function(event){if(event.button===0&&Date.now()-lastTouchTime>700&&begin('mouse',event.clientX,event.clientY))stopDefault(event);});
  window.addEventListener('mousemove',function(event){if(move('mouse',event.clientX,event.clientY))stopDefault(event);});
  window.addEventListener('mouseup',function(event){if(event.button===0)end('mouse',event.clientX,event.clientY,false);});
 }
 canvas.addEventListener('wheel',function(event){
  if(!allowed())return;
  stopDefault(event);cancelGesture();
  const unit=event.deltaMode===1?16:event.deltaMode===2?height:1;
  const exponent=clamp(event.deltaY*unit*.001,-1,1);
  wanted.radius=clamp(wanted.radius*Math.exp(exponent),controls.minDistance,controls.maxDistance);
 },{passive:false});
 canvas.addEventListener('contextmenu',stopDefault);
 window.addEventListener('blur',cancelGesture);
 window.addEventListener('resize',cancelGesture);
 document.addEventListener('visibilitychange',function(){if(document.hidden)cancelGesture();});

 function apply(){camera.position.copy(offset.setFromSpherical(spherical)).add(controls.target);camera.lookAt(controls.target);}
 function size(w,h){
  if(w!==width||h!==height)cancelGesture();
  width=Math.max(1,w);height=Math.max(1,h);camera.aspect=width/height;camera.updateProjectionMatrix();
 }
 function reset(){
  cancelGesture();
  const scene=getScene(),cfg=scene&&scene.camera?scene.camera:{};
  camera.fov=cfg.fov||32;
  controls.target.fromArray(cfg.perspectiveTarget||cfg.target||[0,2,0]);
  camera.position.fromArray(cfg.perspectivePosition||[7,17,30]);
  const lensScale=Math.tan(THREE.MathUtils.degToRad(43/2))/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  offset.subVectors(camera.position,controls.target).multiplyScalar(lensScale*.94);
  if(cfg.wideZoom)offset.multiplyScalar(1+(cfg.wideZoom-1)*clamp((camera.aspect-2.1)/.75,0,1));
  if(cfg.wideLift)controls.target.y+=cfg.wideLift*clamp((camera.aspect-2.1)/.75,0,1);
  if(camera.aspect<1.25)offset.multiplyScalar(1.25/camera.aspect);
  spherical.setFromVector3(offset);spherical.phi=clamp(spherical.phi,controls.minPolarAngle,controls.maxPolarAngle);
  controls.maxDistance=Math.max(cfg.maxDistance||150,spherical.radius*1.12);
  spherical.radius=clamp(spherical.radius,controls.minDistance,controls.maxDistance);wanted.copy(spherical);
  camera.far=Math.max(330,controls.maxDistance+90);camera.zoom=(cfg.zoom||1)*1.1;camera.updateProjectionMatrix();apply();
 }
 function groundDirection(horizontal,vertical){
  camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,up).normalize();
  return new THREE.Vector3().addScaledVector(right,horizontal).addScaledVector(forward,-vertical).normalize();
 }
 function update(){
  if(!allowed()&&ids.length)cancelGesture();
  const blend=.22;
  spherical.theta+=(wanted.theta-spherical.theta)*blend;
  spherical.phi+=(wanted.phi-spherical.phi)*blend;
  spherical.radius+=(wanted.radius-spherical.radius)*blend;
  apply();
 }
 return {camera:camera,controls:controls,size:size,reset:reset,update:update,groundDirection:groundDirection,cancelGesture:cancelGesture};
}
