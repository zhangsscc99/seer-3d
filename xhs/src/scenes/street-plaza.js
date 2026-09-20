import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {flat, group, rng} from '../scene-kit.js';

// Map the actual PlaneGeometry dimensions, not a second artificial tile scale.
// With a 36 x 23 floor the 16-unit tile repeats 2.25 x 1.4375 times.
export const STREET_PAVING = Object.freeze({
  tileWorldSize:16, sitesPerAxis:7, jointWidth:.15, seed:3914,
  grout:'#ecdbb2',
  colors:Object.freeze(['#d4d6bd','#e3ccbf','#ebdcc0','#cbd3ba','#dfc8bd','#e5d4b8','#ded7bd']),
});

// Approximate plan-view counterparts of the six reference-image anchors.
// +z faces the foreground. Translate the returned group for final framing.
export const STREET_FOREGROUND = Object.freeze({
  referencePixels:Object.freeze([[0,555],[131,460],[319,484],[479,500],[652,477],[947,554]]),
  anchors:Object.freeze([[-13,12.15],[-9.4,8.6],[-4.3,9.5],[0,10.08],[4.7,9.23],[12.65,12.11]]),
  lawnHeight:.038, curbHeight:.28, curbWidth:.40, blockLength:.53,
});

let pavingCanvases;

function clipPolygon(poly,nx,ny,c){
  const out=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length];
    const da=a[0]*nx+a[1]*ny-c,db=b[0]*nx+b[1]*ny-c;
    if(da<=0)out.push(a);
    if((da<0)!==(db<0)){
      const t=da/(da-db);
      out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);
    }
  }
  return out;
}

function roundedPolygon(ctx,poly){
  ctx.beginPath();
  for(let i=0;i<poly.length;i++){
    const p=poly[i],prev=poly[(i+poly.length-1)%poly.length],next=poly[(i+1)%poly.length];
    const a=[p[0]+(prev[0]-p[0])*.34,p[1]+(prev[1]-p[1])*.34];
    const b=[p[0]+(next[0]-p[0])*.34,p[1]+(next[1]-p[1])*.34];
    if(!i)ctx.moveTo(...a);else ctx.lineTo(...a);
    ctx.quadraticCurveTo(...p,...b);
  }
  ctx.closePath();
}

function drawStreetPaving(){
  const W=1536,n=STREET_PAVING.sitesPerAxis,step=W/n,random=rng(STREET_PAVING.seed);
  const canvas=document.createElement('canvas'),relief=document.createElement('canvas');
  canvas.width=canvas.height=relief.width=relief.height=W;
  const ctx=canvas.getContext('2d'),bump=relief.getContext('2d');
  const sites=[];
  // Broadly spaced sites and a few offset pairs create long flags without
  // the pebble clusters used in the church pavement.
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    let x=(i+.5+(random()-.5)*.86)*step;
    const y=(j+.5+(random()-.5)*.82)*step;
    if((i===2&&j===1)||(i===5&&j===4))x-=step*.24;
    sites.push([x,y]);
  }
  const copies=[];
  for(const [x,y] of sites)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)copies.push([x+dx*W,y+dy*W]);
  ctx.fillStyle=STREET_PAVING.grout;ctx.fillRect(0,0,W,W);
  bump.fillStyle='#777777';bump.fillRect(0,0,W,W);
  const halfGap=STREET_PAVING.jointWidth/STREET_PAVING.tileWorldSize*W/2;
  sites.forEach(([x,y],index)=>{
    let poly=[[x-step*2,y-step*2],[x+step*2,y-step*2],[x+step*2,y+step*2],[x-step*2,y+step*2]];
    for(const [bx,by] of copies){
      const nx=bx-x,ny=by-y,d=Math.hypot(nx,ny);
      if(d<.01||d>step*3.5)continue;
      // A fixed physical inset preserves the same narrow seam on large and
      // small stones; scaling every polygon about its center does not.
      poly=clipPolygon(poly,nx,ny,(bx*bx+by*by-x*x-y*y)/2-halfGap*d);
      if(!poly.length)break;
    }
    if(poly.length<3)return;
    const color=STREET_PAVING.colors[(index*3+Math.floor(random()*3))%STREET_PAVING.colors.length];
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      ctx.save();ctx.translate(dx*W,dy*W);roundedPolygon(ctx,poly);
      ctx.fillStyle=color;ctx.fill();
      ctx.lineWidth=1.4;ctx.strokeStyle='rgba(139,137,106,.15)';ctx.stroke();
      ctx.restore();
      bump.save();bump.translate(dx*W,dy*W);roundedPolygon(bump,poly);
      bump.fillStyle='#aaaaaa';bump.fill();bump.restore();
    }
  });
  return {canvas,relief};
}

/** width/depth are the real mesh dimensions; omit them for world-sized UVs. */
export function createStreetPavingMaterial({width=1,depth=1}={}){
  if(!Number.isFinite(width)||!Number.isFinite(depth)||width<=0||depth<=0)throw new RangeError('Street paving needs positive width and depth.');
  pavingCanvases??=drawStreetPaving();
  const map=new THREE.CanvasTexture(pavingCanvases.canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  const bumpMap=new THREE.CanvasTexture(pavingCanvases.relief);
  for(const texture of [map,bumpMap]){
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(width/STREET_PAVING.tileWorldSize,depth/STREET_PAVING.tileWorldSize);
    texture.anisotropy=4;
  }
  const material=new THREE.MeshStandardMaterial({map,bumpMap,roughness:.98,bumpScale:.009});
  material.name='Street large pastel flagstones';
  material.userData={tileWorldSize:STREET_PAVING.tileWorldSize,jointWidth:STREET_PAVING.jointWidth,sites:49};
  return material;
}

function pointAlong(curve,t,offset=0){
  const p=curve.getPointAt(t),tangent=curve.getTangentAt(t);
  return [p.x-tangent.z*offset,p.z+tangent.x*offset];
}

function colorGeometry(geometry,color){
  const c=new THREE.Color(color),values=[];
  for(let i=0;i<geometry.attributes.position.count;i++)values.push(c.r,c.g,c.b);
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(values,3));
  return geometry;
}

function mergeColored(parent,geometries,name,{shadow=true}={}){
  const geometry=mergeGeometries(geometries,false);
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.97}));
  mesh.castShadow=shadow;mesh.receiveShadow=true;mesh.name=name;parent.add(mesh);
  geometries.forEach(g=>g.dispose());
  return mesh;
}

function makeCurb(parent,curve){
  const {curbWidth,curbHeight,blockLength,lawnHeight}=STREET_FOREGROUND;
  const length=curve.getLength(),count=Math.ceil(length/blockLength),geometries=[],lines=[];
  const colors=[0xd4d4c8,0xc8ccbf,0xdad9cd,0xc3c8bc,0xd0d0c3,0xdfddd0];
  for(let i=0;i<count;i++){
    const t0=(i+.025)/count,t1=(i+.975)/count,edge=[];
    for(let j=0;j<=3;j++)edge.push(pointAlong(curve,THREE.MathUtils.lerp(t0,t1,j/3),-curbWidth/2));
    for(let j=3;j>=0;j--)edge.push(pointAlong(curve,THREE.MathUtils.lerp(t0,t1,j/3),curbWidth/2));
    const shape=new THREE.Shape();
    edge.forEach(([x,z],j)=>j?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:curbHeight-lawnHeight-.022,bevelEnabled:true,bevelThickness:.014,bevelSize:.014,bevelSegments:1,steps:1,curveSegments:1});
    geometry.rotateX(-Math.PI/2);geometry.translate(0,lawnHeight+.008,0);
    geometries.push(colorGeometry(geometry,colors[(i*7+Math.floor(i/5))%colors.length]));
    // A restrained dark joint, visible from the reference view, rather than
    // the heavy outline of a row of independent box primitives.
    const a=pointAlong(curve,i/count,-curbWidth/2),b=pointAlong(curve,i/count,curbWidth/2);
    lines.push(a[0],curbHeight+.001,a[1],b[0],curbHeight+.001,b[1]);
  }
  mergeColored(parent,geometries,'Street curved stone curb');
  for(const side of [-1,1]){
    for(let i=0;i<240;i++){
      const a=pointAlong(curve,i/240,side*curbWidth/2),b=pointAlong(curve,(i+1)/240,side*curbWidth/2);
      lines.push(a[0],curbHeight-.009,a[1],b[0],curbHeight-.009,b[1]);
    }
  }
  const lineGeometry=new THREE.BufferGeometry();lineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));
  const joints=new THREE.LineSegments(lineGeometry,new THREE.LineBasicMaterial({color:0x778375,transparent:true,opacity:.48}));
  joints.name='Street curb masonry joints';parent.add(joints);
}

function makeFlowers(parent,curve){
  const random=rng(114),geometries=[],height=STREET_FOREGROUND.lawnHeight+.027;
  for(let i=0;i<24;i++){
    // In the source, small white/pink flowers gather on the left foreground.
    const t=.20+random()*.24,[x,z]=pointAlong(curve,t,1.0+random()*2.4),size=.07+random()*.03;
    const color=i%5===0?0xeab6d2:0xfffae9;
    for(let p=0;p<5;p++){
      const a=p*Math.PI*2/5;
      const petal=new THREE.CircleGeometry(size,9);petal.rotateX(-Math.PI/2);
      petal.translate(x+Math.cos(a)*size*.83,height,z+Math.sin(a)*size*.83);
      geometries.push(colorGeometry(petal,color));
    }
    const center=new THREE.CircleGeometry(size*.41,9);center.rotateX(-Math.PI/2);center.translate(x,height+.003,z);
    geometries.push(colorGeometry(center,0xf3d35e));
  }
  mergeColored(parent,geometries,'Street sparse foreground flowers',{shadow:false});
}

/** Decorative foreground only: this adds no collision, walkability or heightAt. */
export function createStreetForeground(parent){
  const root=group(parent);root.name='Street reference wavy foreground';root.userData.decorative=true;
  const anchors=[[-22,14.7],[-17,13.1],...STREET_FOREGROUND.anchors,[17,13.4],[22,14.7]];
  const curve=new THREE.CatmullRomCurve3(anchors.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
  const edge=curve.getSpacedPoints(240).map(p=>[p.x,p.z]);
  flat(root,[...edge,[22,34],[-22,34]],0x9bd15e,STREET_FOREGROUND.lawnHeight).name='Street foreground lawn';
  const grassStart=[],grassTips=[];
  for(let i=0;i<=180;i++){
    const t=i/180;
    grassStart.push(pointAlong(curve,t,.14));
    grassTips.push(pointAlong(curve,t,.67+(i%3===0?.25:0)+Math.sin(i*1.73)*.08));
  }
  flat(root,[...grassStart,...grassTips.reverse()],0x76b247,STREET_FOREGROUND.lawnHeight+.004).name='Street shaded grass edge';
  makeCurb(root,curve);makeFlowers(root,curve);
  root.userData.referenceAnchors=STREET_FOREGROUND.anchors.map(p=>[...p]);
  return root;
}

export function clearPlazaCaches(){pavingCanvases=undefined;}
