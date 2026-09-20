import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

// Preserve the source palette while contact shading makes depth and curved surfaces visible.
export function createPainter(renderer){
 const prepared=new WeakSet();
 // Source colours are albedos, not sunlit plastic. Bound the lighting ratio in
 // linear space so the reference palette survives without clipping to neon.
 function prepare(root,deepStone=false){
  const copies=new Map();
  if(deepStone)root.traverse(object=>{if(!object.material)return;const copy=material=>{if(!material.isMeshStandardMaterial)return material;if(!copies.has(material))copies.set(material,material.clone());return copies.get(material);};object.material=Array.isArray(object.material)?object.material.map(copy):copy(object.material);});
  root.traverse(object=>{
   for(const material of (Array.isArray(object.material)?object.material:[object.material])){
    if(!material?.isMeshStandardMaterial||prepared.has(material))continue;
    prepared.add(material);
    material.onBeforeCompile=shader=>{
     shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      vec3 referenceLight = outgoingLight / max(diffuseColor.rgb, vec3(0.025));
      ${deepStone?'outgoingLight = diffuseColor.rgb * clamp(vec3(0.42) + referenceLight * 0.45, vec3(0.45), vec3(1.05));':'outgoingLight = diffuseColor.rgb * clamp(vec3(0.63) + referenceLight * 0.32, vec3(0.64), vec3(1.025));'}
      #include <opaque_fragment>
     `);
    };
    material.customProgramCacheKey=()=> (deepStone?'deep-stone:':'')+'manor-reference-colour-v1';
    material.needsUpdate=true;
   }
  });
 }
 let composer,beauty,occlusion,stats={calls:0,triangles:0},width=1,height=1;
 function init(scene,camera){
  const target=new THREE.WebGLRenderTarget(width,height,{type:THREE.HalfFloatType,samples:4});
  composer=new EffectComposer(renderer,target);composer.setPixelRatio(1);
  beauty=new RenderPass(scene,camera);
  const render=beauty.render.bind(beauty);beauty.render=(...args)=>{render(...args);stats={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};};
  occlusion=new SSAOPass(scene,camera,width,height,12);occlusion.kernelRadius=.58;occlusion.minDistance=.0006;occlusion.maxDistance=.012;
  const visibility=occlusion.overrideVisibility.bind(occlusion);
  occlusion.overrideVisibility=()=>{visibility();scene.traverse(o=>{if(o.isMesh&&o.material?.transparent)o.visible=false;});};
  composer.addPass(beauty);composer.addPass(occlusion);composer.addPass(new OutputPass());
  composer.setSize(width,height);
 }
 return {
  prepare,
  resize(w,h){width=w;height=h;composer?.setSize(w,h);},
  render(scene,camera){if(!composer)init(scene,camera);beauty.scene=scene;beauty.camera=camera;occlusion.scene=scene;occlusion.camera=camera;occlusion.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(camera.projectionMatrix);occlusion.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);composer.render();return stats;},
 };
}
