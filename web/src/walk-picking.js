import * as THREE from 'three';

// A ray aimed at an upper deck can cross y=0 beyond the deck's footprint.
// Check the room's real floor levels before falling back to ground iteration.
export function pickWalkSurface(ray,levels,heightAt,walkable) {
 const plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 const point=new THREE.Vector3();
 if(levels&&levels.length) {
  let closest=null,distance=Infinity;
  for(const height of levels) {
   plane.constant=-height;
   if(!ray.intersectPlane(plane,point)||!walkable(point.x,point.z))continue;
   if(Math.abs(heightAt(point.x,point.z)-height)>.025)continue;
   const nextDistance=ray.origin.distanceToSquared(point);
   if(nextDistance<distance){closest=point.clone();distance=nextDistance;}
  }
  return closest;
 }
 if(!ray.intersectPlane(plane,point))return null;
 for(let i=0;i<3;i++){
  plane.constant=-heightAt(point.x,point.z);
  if(!ray.intersectPlane(plane,point))return null;
 }
 return point;
}
