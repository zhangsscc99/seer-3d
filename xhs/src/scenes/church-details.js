import * as THREE from 'three';
import {referenceLandscape} from '../reference-landscape.js';
import {group,box,ellipsoid,cyl,torus,flat,mat,beam} from '../scene-kit.js';

export function createChurchLandscape(root){
  return referenceLandscape(root,{ground:0x85ba54,seed:7,snowX:2,church:true});
}

function tube(parent,points,radius,color){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,40,radius,8,false),mat(color));
  m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}

// A continuous radial shell, including the inside of the bowl. Its scallops
// are actual changes of radius and height, so the silhouette survives an orbit.
function carvedShell(parent,rings,lobes=8){
  const count=96,vertices=[],uv=[],indices=[];
  for(let row=0;row<rings.length;row++){
    const [r,y,flute=0,crown=0]=rings[row];
    for(let i=0;i<=count;i++){
      const a=i/count*Math.PI*2,c=Math.cos(a*lobes),rr=r+flute*c;
      vertices.push(Math.cos(a)*rr,y+crown*(c+1)/2,Math.sin(a)*rr);uv.push(i/count,row/(rings.length-1));
      if(row&&i<count){const a0=(row-1)*(count+1)+i,b=row*(count+1)+i;indices.push(a0,b,a0+1,a0+1,b,b+1);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=mat(0xd5cbbc).clone();material.side=THREE.DoubleSide;
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
  return mesh;
}

function star(parent,x,y,z,s,color){
  const shape=new THREE.Shape();
  for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=s*(i%2?.44:1);if(i)shape.lineTo(Math.cos(a)*r,Math.sin(a)*r);else shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
  shape.closePath();const m=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:false}),mat(color));
  m.position.set(x,y,z);parent.add(m);return m;
}

export function createChurchFountains(root){
  const animated=group(root);animated.name='许愿池细水与星光';
  // The small rear sculpture is a stone character in a blue cap, not a bowl.
  const statue=group(root,-8.45,.08,8.80);statue.rotation.y=-.15;
  cyl(statue,0,.10,0,.49,.60,.20,0xc9c1b3,32);
  carvedShell(statue,[[.34,.17],[.26,.28,.035],[.30,.48,.04],[.43,.65,.06],[.42,.83,.04],[.34,.94]],6);
  cyl(statue,0,1.03,0,.48,.51,.17,0xe0d9ca,32);
  ellipsoid(statue,0,1.37,0,.38,.45,.30,0xe4dfd0);
  ellipsoid(statue,0,1.91,.04,.40,.40,.34,0xe7e1d5);
  ellipsoid(statue,.19,1.81,.31,.25,.20,.16,0xf0e8d9);
  for(const s of [-1,1]){ellipsoid(statue,s*.36,1.35,.03,.13,.29,.18,0xd8d2c5).rotation.z=-s*.30;ellipsoid(statue,s*.21,1.14,.21,.20,.10,.23,0xcfc9bb);}
  ellipsoid(statue,-.16,2.14,-.015,.42,.34,.31,0x3794b9);
  ellipsoid(statue,.19,2.20,.23,.27,.21,.22,0xf3eee2);
  ellipsoid(statue,-.43,1.87,.05,.17,.32,.12,0x3898bf).rotation.z=-.34;
  tube(statue,[[-.46,1.62,.0],[-.53,1.56,.02],[-.42,1.48,.1]],.10,0x348db0);

  const wishing=group(root,-4.64,.08,11.13);wishing.name='八瓣雕花许愿喷泉';
  cyl(wishing,0,.10,0,.46,.57,.19,0xbeb9ae,32);
  carvedShell(wishing,[[.34,.20],[.20,.44,.025],[.32,.63,.045],[.38,.77,.035],[.34,.84],[.57,.94,.055],[.82,1.13,.075],[.99,1.40,.09,.10],[.96,1.54,.13,.23],[.82,1.50,.11,.22],[.68,1.28,.06],[.37,1.05,.035]],8);
  // Thin pale lips and carved meridians follow the crown; no circular torus.
  const lip=[];for(let i=0;i<=128;i++){const a=i/128*Math.PI*2,c=Math.cos(8*a),r=.96+.13*c;lip.push([Math.cos(a)*r,1.55+.23*(c+1)/2,Math.sin(a)*r]);}
  tube(wishing,lip,.032,0xeee3cf);
  for(let n=0;n<8;n++){
    const a=n*Math.PI/4,pts=[];
    for(const [r,y]of [[.37,.85],[.59,.98],[.84,1.20],[1.055,1.53]])pts.push([Math.cos(a)*r,y,Math.sin(a)*r]);
    tube(wishing,pts,.035,0xaea99e);
  }
  cyl(wishing,0,1.265,0,.63,.63,.025,0x63b4cd,48);
  carvedShell(wishing,[[.24,1.08],[.19,1.55],[.25,1.98],[.27,2.04],[.19,2.04],[.17,1.85]],6);
  for(const [x,y,c]of [[-.83,2.08,0xffe04c],[-.15,2.45,0x65ea30],[.72,2.14,0xf078dc]])star(wishing,x,y,.08,.18,c);
  for(let n=0;n<4;n++){
    const a=n*Math.PI/2+.3,p=group(animated,-4.64,.08,11.13);
    tube(p,[[Math.cos(a)*.20,1.91,Math.sin(a)*.20],[Math.cos(a)*.39,1.67,Math.sin(a)*.39],[Math.cos(a)*.68,1.29,Math.sin(a)*.68]],.028,0xb6e4df);
  }
  // Floating messages are one of the recognizable details of this water area.
  for(const [x,z,a]of [[-9.4,9.8,.35],[-7.8,10.3,-.1],[-6.8,11.6,.28]]){
    const bottle=group(root,x,.24,z);bottle.rotation.y=a;bottle.rotation.z=.05;
    const body=cyl(bottle,0,0,0,.10,.10,.48,0x73c6e1,16);body.rotation.z=Math.PI/2;
    const neck=cyl(bottle,-.30,0,0,.055,.055,.16,0xa9dce3,14);neck.rotation.z=Math.PI/2;
    box(bottle,-.40,0,0,.09,.13,.14,0x8b714b);
    box(bottle,0,.08,.035,.26,.025,.12,0xebefdc);
  }
  return {dynamic:[animated],update:t=>{animated.children.forEach((o,i)=>o.scale.y=1+Math.sin(t*2.1+i)*.012);}};
}

function trunk(parent,points,radii,color){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,y,z])=>new THREE.Vector3(x,y>7?7+(y-7)*.58:y,z))),segments=56,sides=11;
  const frames=curve.computeFrenetFrames(segments,false),vertices=[],indices=[],uv=[];
  for(let n=0;n<=segments;n++){
    const t=n/segments,p=curve.getPointAt(t),f=t*(radii.length-1),at=Math.min(Math.floor(f),radii.length-2),r=THREE.MathUtils.lerp(radii[at],radii[at+1],f-at);
    for(let i=0;i<=sides;i++){
      const a=i/sides*Math.PI*2,rr=r*(1+.065*Math.sin(i*2.73+n*.21));
      const q=p.clone().addScaledVector(frames.normals[n],Math.cos(a)*rr).addScaledVector(frames.binormals[n],Math.sin(a)*rr);
      vertices.push(q.x,q.y,q.z);uv.push(i/sides,t);
      if(n&&i<sides){const u=(n-1)*(sides+1)+i,v=n*(sides+1)+i;indices.push(u,u+1,v,u+1,v+1,v);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=mat(color).clone();material.side=THREE.DoubleSide;
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
}

export function createChurchForegroundTree(root){
  const tree=group(root,-11.4,0,6.2);tree.name='前景弯曲老树';
  trunk(tree,[[.1,0,0],[-.3,2.1,-.1],[-.9,5,-.4],[-.9,8.3,-.8],[-.25,12,-1.1]],[1.20,.79,.68,.48,.23],0x815631);
  trunk(tree,[[-.75,6.8,-.5],[.0,8.7,-.8],[2.3,9.8,-1.7],[4.0,11.5,-2.4]],[.48,.37,.27,.10],0x815631);
  trunk(tree,[[-.8,8.8,-.8],[-2.0,10.6,-1.4],[-3.1,11.9,-1.8]],[.40,.23,.10],0x815631);
  trunk(tree,[[.0,8.5,-.8],[1.7,10.5,-.5],[2.0,12.2,-1]],[.30,.19,.07],0x986638);
  for(const s of [-1,1])trunk(tree,[[0,1,0],[s*.7,.28,.25],[s*1.9,.05,.8]],[.7,.39,.06],0x825530);
  for(const [x,y,z,r]of [[-2.5,9.8,-1.9,2.6],[.2,10.6,-1.3,3],[3.4,9.8,-2.4,2.7],[5,9.7,-3.3,1.8],[-4.4,8.8,-2,2.0]]){
    ellipsoid(tree,x,y,z,r,r*.42,r*.71,0x397c36);
    for(let i=0;i<10;i++){const a=i*Math.PI*2/10;ellipsoid(tree,x+Math.cos(a)*r*.75,y-.08,z+Math.sin(a)*r*.45,r*.34,.64,r*.32,[0x418b36,0x559934,0x3e8335][i%3]);}
  }
  for(let n=0;n<3;n++)tube(tree,[[.40+n*.15,.4,.92],[.12+n*.16,2,.62],[-.40+n*.15,4.9,.25],[-.45+n*.12,7.3,-.11]],.024,0xa36e3d);
  const butterfly=group(tree,.86,3.25,1.07);butterfly.rotation.z=.25;
  for(const s of [-1,1]){ellipsoid(butterfly,s*.18,.07,0,.17,.22,.035,0xf5e56a);ellipsoid(butterfly,s*.16,-.15,0,.12,.15,.035,0xdcc44a);ellipsoid(butterfly,s*.20,.13,.04,.044,.057,.025,0x69552d);}
  beam(butterfly,[0,-.20,0],[0,.18,0],.028,0x645035);
  return tree;
}
