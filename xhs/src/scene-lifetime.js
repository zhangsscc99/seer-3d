import {clearPlazaCaches} from './scenes/street-plaza.js';
import {clearSceneKitCaches} from './scene-kit.js';
import {clearTownCaches} from './scenes/town-geometry.js';
import {clearCountryCaches} from './scenes/country.js';
import {clearTerrainCaches} from './scenes/church-terrain.js';
import {clearPoliceCaches} from './scenes/church-police.js';
import {clearRescueCaches} from './scenes/church-rescue.js';
import {clearPetsCaches} from './scenes/street-pets.js';
import {clearBeanCaches} from './scenes/street-bean-court.js';
import {clearSkyCaches} from './sky.js';

// Dispose a resource once, without deleting textures/materials still used by the player.
export function releaseSceneResources(scene, roots){
 const active=new Set(),released=new Set();
 function resources(object,visit){
  if(object.geometry)visit(object.geometry);
  const materials=Array.isArray(object.material)?object.material:[object.material];
  materials.forEach(material=>{if(!material)return;visit(material);Object.keys(material).forEach(key=>{if(material[key]&&material[key].isTexture)visit(material[key]);});});
 }
 scene.traverse(object=>resources(object,resource=>active.add(resource)));
 if(scene.background&&scene.background.isTexture)active.add(scene.background);
 function release(resource){
  if(!resource||active.has(resource)||released.has(resource))return;
  released.add(resource);
  if(resource.isMaterial)Object.keys(resource).forEach(key=>{if(resource[key]&&resource[key].isTexture)release(resource[key]);});
  if(resource.dispose)resource.dispose();
 }
 roots.forEach(root=>root.traverse(object=>{resources(object,release);if(object.isInstancedMesh&&object.dispose)object.dispose();}));
 clearSceneKitCaches(release);clearTownCaches(release);clearCountryCaches(release);clearTerrainCaches(release);clearPoliceCaches(release);clearRescueCaches(release);clearPetsCaches(release);clearBeanCaches(release);clearSkyCaches(release);
 clearPlazaCaches();
 return released.size;
}
