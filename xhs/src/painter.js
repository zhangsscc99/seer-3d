// One rendering pass keeps the scene affordable on a phone, including WebGL 1.
// The original reference colour correction is retained on the model materials.
export function createPainter(renderer){
 const prepared=new WeakSet();
 function prepare(root,deepStone=false){
  const copies=new Map();
  if(deepStone)root.traverse(object=>{if(!object.material)return;const copy=material=>{if(!material.isMeshStandardMaterial)return material;if(!copies.has(material))copies.set(material,material.clone());return copies.get(material);};object.material=Array.isArray(object.material)?object.material.map(copy):copy(object.material);});
  root.traverse(object=>{
   for(const material of (Array.isArray(object.material)?object.material:[object.material])){
    if(!material||!material.isMeshStandardMaterial||prepared.has(material))continue;
    prepared.add(material);
    material.onBeforeCompile=shader=>{
     shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',[
      'vec3 referenceLight = outgoingLight / max(diffuseColor.rgb, vec3(0.025));',
      deepStone?'outgoingLight = diffuseColor.rgb * clamp(vec3(0.42) + referenceLight * 0.45, vec3(0.45), vec3(1.05));':'outgoingLight = diffuseColor.rgb * clamp(vec3(0.63) + referenceLight * 0.32, vec3(0.64), vec3(1.025));',
      '#include <opaque_fragment>'
     ].join('\n'));
    };
    material.customProgramCacheKey=()=> (deepStone?'deep-stone:':'')+'manor-reference-colour-mobile-v1';
    material.needsUpdate=true;
   }
  });
 }
 return {prepare,resize(){},render(scene,camera){renderer.render(scene,camera);return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}};
}
