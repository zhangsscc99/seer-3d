import * as THREE from 'three';
import {group, flat, mat, rng} from '../scene-kit.js';

// These are plan-view control points, with +z toward the foreground.
// The photographed pool is open beyond the left/bottom frame, not an ellipse.
export const CHURCH_TERRACE = Object.freeze({
  baseHeight:.05, rise:.24, treadDepth:.55, backZ:-10,
  anchors:[[-15,.6],[-12.2,1.60],[-9,2.0],[-6.4,1.78],[-4,1.25],[-.9,.24],[2.5,-1.0]],
});
export const CHURCH_POND = Object.freeze({
  rimWidth:.50, rimHeight:.36, waterHeight:.036, safeMargin:.23,
  anchors:[[-26,6.4],[-15.5,6.4],[-9.5,6.4],[-6.5,7.7],[-2.5,9],[1.5,8.8],[3.6,9.3],[4.8,11.6],[5.3,18],[5.3,26]],
});

function sampleCurve(anchors,segments=180){
  const curve=new THREE.CatmullRomCurve3(anchors.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
  return curve.getPoints(segments).map(p=>[p.x,p.z]);
}
function offsetCurve(points,amount){
  return points.map((p,i)=>{
    const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)];
    const dx=after[0]-before[0],dz=after[1]-before[1],length=Math.hypot(dx,dz)||1;
    return [p[0]-dz/length*amount,p[1]+dx/length*amount];
  });
}
function platformPolygon(front){
  return [[front[0][0],CHURCH_TERRACE.backZ],...front,[front.at(-1)[0],CHURCH_TERRACE.backZ]];
}
function inPolygon(x,z,points){
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];
    if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
function distanceToPath(x,z,points){
  let best=Infinity;
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1];
    const t=THREE.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);
    best=Math.min(best,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));
  }
  return best;
}

export const churchTerraceFront=sampleCurve(CHURCH_TERRACE.anchors,160);
export const churchShoreline=sampleCurve(CHURCH_POND.anchors,240);
export const churchTerracePolygons=[0,1,2].map(i=>platformPolygon(offsetCurve(churchTerraceFront,i*CHURCH_TERRACE.treadDepth)));
export const churchWaterPolygon=[...churchShoreline,[-30,26],[-30,6.4]];

export function churchTerrainHeightAt(x,z){
  for(let i=0;i<churchTerracePolygons.length;i++){
    if(inPolygon(x,z,churchTerracePolygons[i]))return CHURCH_TERRACE.baseHeight+(3-i)*CHURCH_TERRACE.rise;
  }
  return CHURCH_TERRACE.baseHeight;
}
export function churchTerrainWalkable(x,z){
  return !inPolygon(x,z,churchWaterPolygon)&&distanceToPath(x,z,churchShoreline)>CHURCH_POND.rimWidth/2+CHURCH_POND.safeMargin;
}

let pavingTexture;
/** PlaneGeometry uses width/depth; shape geometry already has world-sized UVs. */
export function createChurchPavingMaterial({width=1,depth=1}={}){
  if(!pavingTexture){
    const W=1024,canvas=document.createElement('canvas');canvas.width=canvas.height=W;
    const ctx=canvas.getContext('2d'),random=rng(612),sites=[],step=W/7;
    // A few groups of small rounded pebbles replace large flags, as in the photo.
    const clusters=new Set(['1,2','5,1','3,5','6,4']);
    for(let j=0;j<7;j++)for(let i=0;i<7;i++){
      const x=(i+.5+(random()-.5)*.62)*step,y=(j+.5+(random()-.5)*.62)*step;
      if(clusters.has(`${i},${j}`)){
        sites.push([x,y]);
        for(let k=0;k<7;k++){
          const a=k*Math.PI*2/7+(random()-.5)*.22,r=step*(.30+random()*.1);
          sites.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);
        }
      }else sites.push([x,y]);
    }
    const copies=[];for(const p of sites)for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)copies.push([p[0]+dx*W,p[1]+dz*W]);
    const clip=(poly,nx,ny,c)=>{
      const out=[];
      for(let i=0;i<poly.length;i++){
        const a=poly[i],b=poly[(i+1)%poly.length],da=a[0]*nx+a[1]*ny-c,db=b[0]*nx+b[1]*ny-c;
        if(da<=0)out.push(a);
        if((da<0)!==(db<0)){const f=da/(da-db);out.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]);}
      }
      return out;
    };
    ctx.fillStyle='#f2dfac';ctx.fillRect(0,0,W,W);
    const palette=['#e4ccb9','#d9d8b6','#e8d6b6','#e7cfc1','#d1d7b6','#ead9bd','#e0d1b5','#e1cbb8'];
    sites.forEach(([x,y],index)=>{
      let poly=[[x-step*2,y-step*2],[x+step*2,y-step*2],[x+step*2,y+step*2],[x-step*2,y+step*2]];
      for(const [bx,by]of copies){
        if(Math.hypot(bx-x,by-y)<.01||Math.hypot(bx-x,by-y)>step*3)continue;
        poly=clip(poly,bx-x,by-y,(bx*bx+by*by-x*x-y*y)/2);
        if(!poly.length)break;
      }
      const inset=.77+random()*.11;
      poly=poly.map(([px,py])=>[x+(px-x)*inset,y+(py-y)*inset]);
      for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
        ctx.save();ctx.translate(dx*W,dz*W);ctx.beginPath();
        for(let i=0;i<poly.length;i++){
          const p=poly[i],prev=poly[(i+poly.length-1)%poly.length],next=poly[(i+1)%poly.length];
          const a=[p[0]+(prev[0]-p[0])*.31,p[1]+(prev[1]-p[1])*.31],b=[p[0]+(next[0]-p[0])*.31,p[1]+(next[1]-p[1])*.31];
          if(!i)ctx.moveTo(...a);else ctx.lineTo(...a);ctx.quadraticCurveTo(p[0],p[1],b[0],b[1]);
        }
        ctx.closePath();ctx.fillStyle=palette[index%palette.length];ctx.fill();
        ctx.lineWidth=1.8;ctx.strokeStyle='rgba(153,148,112,.26)';ctx.stroke();ctx.restore();
      }
    });
    pavingTexture=new THREE.CanvasTexture(canvas);pavingTexture.colorSpace=THREE.SRGBColorSpace;
    pavingTexture.wrapS=pavingTexture.wrapT=THREE.RepeatWrapping;pavingTexture.anisotropy=4;
  }
  const map=pavingTexture.clone();map.repeat.set(width/10,depth/10);map.needsUpdate=true;
  return new THREE.MeshStandardMaterial({map,roughness:.96,bumpMap:map,bumpScale:.012});
}

function addMesh(parent,vertices,indices,color,name){
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,color?.isMaterial?color:mat(color));mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=name;parent.add(mesh);return mesh;
}
function wall(parent,points,bottom,top,color,name,closed=false){
  const positions=[],indices=[],count=closed?points.length:points.length-1;
  for(let i=0;i<count;i++){
    const a=points[i],b=points[(i+1)%points.length],n=positions.length/3;
    positions.push(a[0],bottom,a[1],a[0],top,a[1],b[0],top,b[1],b[0],bottom,b[1]);
    indices.push(n,n+2,n+1,n,n+3,n+2);
  }
  const m=addMesh(parent,positions,indices,color,name);m.material=mat(color).clone();m.material.side=THREE.DoubleSide;return m;
}
function lineSegments(parent,segments,color,name){
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(segments.flat(2),3));
  const lines=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity:.74}));lines.name=name;parent.add(lines);return lines;
}
function stoneTread(parent,inner,outer,height,name){
  // Shared edges guarantee a continuous crescent, while wider joint intervals
  // keep the individual masonry blocks legible from the reference camera.
  const colors=[0xd1d0c2,0xd9d7c8,0xc4c6ba,0xd2cec0,0xcacec0],positions=[],indices=[],vertexColors=[];
  const seams=[],edgeSegments=[];let distance=0,lastJoint=-1;
  for(let i=0;i<outer.length-1;i++){
    const a=inner[i],b=inner[i+1],c=outer[i+1],d=outer[i],n=positions.length/3;
    const col=new THREE.Color(colors[Math.floor(distance/.64)%colors.length]);
    positions.push(a[0],height,a[1],b[0],height,b[1],c[0],height,c[1],d[0],height,d[1]);
    for(let k=0;k<4;k++)vertexColors.push(col.r,col.g,col.b);
    indices.push(n,n+3,n+2,n,n+2,n+1);
    const joint=Math.floor(distance/.64);
    if(joint!==lastJoint){seams.push([[a[0],height+.009,a[1]],[d[0],height+.009,d[1]]]);lastJoint=joint;}
    edgeSegments.push([[d[0],height+.008,d[1]],[c[0],height+.008,c[1]]]);
    distance+=Math.hypot(c[0]-d[0],c[1]-d[1]);
  }
  const mesh=addMesh(parent,positions,indices,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}),name);
  mesh.geometry.setAttribute('color',new THREE.Float32BufferAttribute(vertexColors,3));
  lineSegments(parent,seams,0x777e75,name+' block joints');lineSegments(parent,edgeSegments,0x899185,name+' outer lip');
  return seams;
}

export function createChurchTerrain(root){
  const terrain=group(root);terrain.name='Church reference curved terraces and wavy pond';
  const {baseHeight,rise,treadDepth}=CHURCH_TERRACE;
  // Exactly three risers: .05 → .29 → .53 → .77. Each exposed tread is .55 deep.
  for(let i=2;i>=0;i--){
    const top=baseHeight+(3-i)*rise,bottom=top-rise;
    const front=offsetCurve(churchTerraceFront,i*treadDepth),inner=offsetCurve(churchTerraceFront,(i-1)*treadDepth);
    const polygon=churchTerracePolygons[i];
    flat(terrain,polygon,0xd1cfc1,top);
    wall(terrain,polygon,bottom,top,i===0?0xbcb9ad:0xb5b2a6,`Terrace riser ${3-i}`,true);
    const joints=stoneTread(terrain,inner,front,top+.003,`Terrace tread ${3-i}`);
    lineSegments(terrain,joints.map(s=>[[s[1][0],bottom+.018,s[1][2]],[s[1][0],top+.007,s[1][2]]]),0x87897f,`Terrace riser ${3-i} joints`);
  }
  // The upper land is actually elevated, so the police hall and bank sit on it.
  const innerTop=offsetCurve(churchTerraceFront,-treadDepth);
  flat(terrain,platformPolygon(innerTop),createChurchPavingMaterial(),baseHeight+3*rise+.009).name='Raised pale stone platform';

  const {rimWidth,rimHeight,waterHeight}=CHURCH_POND;
  const landEdge=offsetCurve(churchShoreline,-rimWidth/2),waterEdge=offsetCurve(churchShoreline,rimWidth/2);
  const water=new THREE.MeshStandardMaterial({color:0x359dc7,roughness:.4,metalness:.01});
  flat(terrain,churchWaterPolygon,water,waterHeight).name='Open irregular S shoreline water';
  // A darker submerged ledge gives the grey wall a readable water-facing side.
  flat(terrain,[...waterEdge,...offsetCurve(churchShoreline,.72).reverse()],0x217b9b,waterHeight+.004).name='Pond submerged edge';
  wall(terrain,waterEdge,waterHeight,rimHeight,0xa3b0a6,'Pond water facing stone wall');
  wall(terrain,landEdge,baseHeight,rimHeight,0xbcc4b4,'Pond land facing stone wall');
  const pondJoints=stoneTread(terrain,landEdge,waterEdge,rimHeight,'Wavy pond coping');
  lineSegments(terrain,pondJoints.map(s=>[[s[1][0],waterHeight+.01,s[1][2]],[s[1][0],rimHeight+.007,s[1][2]]]),0x758e88,'Pond vertical stone joints');
  const wallCourse=[];
  for(let i=1;i<waterEdge.length;i++)wallCourse.push([[waterEdge[i-1][0],.18,waterEdge[i-1][1]],[waterEdge[i][0],.18,waterEdge[i][1]]]);
  lineSegments(terrain,wallCourse,0x83998f,'Pond stone course');

  return {root:terrain,heightAt:churchTerrainHeightAt,walkable:churchTerrainWalkable,
    shoreline:churchShoreline,waterPolygon:churchWaterPolygon,terracePolygons:churchTerracePolygons,
    terraceTop:baseHeight+3*rise,baseHeight,rimWidth};
}
