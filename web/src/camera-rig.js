import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// A single panorama camera keeps drag-to-orbit and wheel/pinch zoom together.
export function createCameraRig(canvas, getScene) {
 const camera=new THREE.PerspectiveCamera(43,1,.10,330);
 const controls=new OrbitControls(camera,canvas);
 controls.enableDamping=true;controls.dampingFactor=.12;controls.rotateSpeed=.62;
 controls.enablePan=false;controls.enableRotate=true;
 controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;
 controls.minDistance=5;controls.minPolarAngle=.12;controls.maxPolarAngle=1.48;
 const up=new THREE.Vector3(0,1,0),forward=new THREE.Vector3(),right=new THREE.Vector3();
 function size(width,height){camera.aspect=width/height;camera.updateProjectionMatrix();}
 function reset(){
  const cfg=getScene()?.camera||{};
  // Clear OrbitControls' remaining drag inertia before restoring the scene pose.
  const damping=controls.enableDamping;
  controls.enableDamping=false;
  controls.reset();
  controls.enableDamping=damping;
  camera.fov=cfg.fov||32;
  controls.target.fromArray(cfg.perspectiveTarget||cfg.target||[0,2,0]);
  camera.position.fromArray(cfg.perspectivePosition||[7,17,30]);
  const lensScale=Math.tan(THREE.MathUtils.degToRad(43/2))/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  // Start slightly closer while preserving each scene's reference angle.
  camera.position.sub(controls.target).multiplyScalar(lensScale*.94).add(controls.target);
  if(cfg.wideZoom)camera.position.sub(controls.target).multiplyScalar(1+(cfg.wideZoom-1)*THREE.MathUtils.clamp((camera.aspect-2.1)/.75,0,1)).add(controls.target);
  if(cfg.wideLift){const lift=cfg.wideLift*THREE.MathUtils.clamp((camera.aspect-2.1)/.75,0,1);controls.target.y+=lift;camera.position.y+=lift;}
  if(camera.aspect<1.25)camera.position.sub(controls.target).multiplyScalar(1.25/camera.aspect).add(controls.target);
  controls.maxDistance=Math.max(cfg.maxDistance||150,camera.position.distanceTo(controls.target)*1.12);
  camera.far=Math.max(330,controls.maxDistance+90);
  camera.zoom=(cfg.zoom||1)*1.1;camera.updateProjectionMatrix();camera.lookAt(controls.target);
  controls.update();
 }
 function groundDirection(horizontal,vertical){
  camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,up).normalize();
  return new THREE.Vector3().addScaledVector(right,horizontal).addScaledVector(forward,-vertical).normalize();
 }
 function update(){controls.update();}
 return {camera,controls,size,reset,update,groundDirection};
}
