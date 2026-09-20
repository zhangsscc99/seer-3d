import * as THREE from 'three';
import {group,box,ellipsoid,cyl,torus,beam,arch,mat} from '../scene-kit.js';

function mesh(p,g,color){const m=new THREE.Mesh(g,mat(color));m.castShadow=m.receiveShadow=true;p.add(m);return m;}
function tube(p,points,r,color){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),48,r,8,false),color);}
function shapeMesh(p,s,depth,color){return mesh(p,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,curveSegments:24}),color);}

export function giftMasonry(p){
 const cream=[0xe5d298,0xefdfa8,0xd9c48e,0xe8d39f];
 for(let row=0;row<4;row++)for(let col=0;col<6;col++){
  const x=-10.78+col*.91+(row%2)*.23;if(x>-5.78)continue;
  box(p,x,2.97+row*.32,-2.385,.73,.23,.06,cream[(row+col)%4]);
 }
 for(const x of [-10.96,-5.57])for(let row=0;row<7;row++)box(p,x,.42+row*.61,-2.32,.50+(row%2)*.09,.59,.21,row%2?0xc7787f:0xd48b90);
 const lower=group(p);
 for(const side of [-1,1]){
  for(let row=0;row<4;row++)box(lower,-10.20+side*1.90,.42+row*.61,1.61,.43+(row%2)*.11,.60,.18,row%2?0xd58e94:0xc47b83);
 }
 // Pink-and-butter stripes support the intermediate landing beside the roof.
 box(lower,-12.45,1.21,.46,2.0,2.42,1.64,0xe3cc83);
 for(let i=0;i<5;i++)box(lower,-13.35+i*.45,1.20,1.302,.20,2.36,.042,0xc480a0);
 for(let i=0;i<3;i++)box(lower,-13.461,1.20,-.16+i*.53,.042,2.36,.20,0xb886ac);
 box(lower,-12.45,2.47,.46,2.08,.13,1.72,0xdb7faa);
 box(lower,-12.45,2.545,.46,1.91,.035,1.55,0xf8e5a4);
 for(let i=0;i<9;i++)ellipsoid(lower,-13.31+i*.22,2.58,1.19,.057,.02,.049,0xf089bb);
 return lower;
}

export function giftToolSign(p,x,y,z){
 const g=group(p,x,y,z);g.name='Rounded hanging shovel shield';
 const s=new THREE.Shape();s.moveTo(-1.11,.89);s.bezierCurveTo(-.8,1.08,.65,1.08,1.10,.92);s.bezierCurveTo(1.03,.12,1.00,-.75,.22,-1.03);s.bezierCurveTo(-.57,-1.27,-1.10,-.61,-1.12,.20);s.closePath();
 shapeMesh(g,s,.19,0xd8b364);const inner=shapeMesh(g,s,.025,0x986b35);inner.scale.set(.88,.87,1);inner.position.z=.222;
 const face=shapeMesh(g,s,.025,0xba913c);face.scale.set(.75,.76,1);face.position.set(.015,.02,.263);
 beam(g,[-.42,-.30,.35],[.51,.36,.35],.11,0xcf8e32);
 const blade=new THREE.Shape();blade.moveTo(-.57,-.63);blade.quadraticCurveTo(-.93,-.47,-.69,-.11);blade.lineTo(-.48,.10);blade.lineTo(-.23,-.13);blade.quadraticCurveTo(-.11,-.42,-.20,-.62);blade.quadraticCurveTo(-.38,-.72,-.57,-.63);
 const bm=shapeMesh(g,blade,.065,0xd5dcd7);bm.position.z=.33;
 tube(g,[[.38,.50,.37],[.59,.55,.37],[.71,.29,.37],[.54,.21,.37]],.058,0xe4e5dc);
 beam(g,[-1.22,1.34,0],[1.25,1.34,0],.105,0xf1d956);
 for(const xx of [-.68,.67]){tube(g,[[xx,1.04,.05],[xx-.11,1.16,.13],[xx-.1,1.44,.16],[xx+.05,1.50,.07],[xx+.11,1.31,-.025]],.055,0x9da6a4);}
 for(const xx of [-1.25,1.28])ellipsoid(g,xx,1.34,0,.15,.16,.15,0xf1d954);
 return g;
}

export function giftStar(p,x,y,z,r=.42){
 const shape=new THREE.Shape();
 for(let i=0;i<10;i++){
  const angle=Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;
  const point=[Math.cos(angle)*rr,Math.sin(angle)*rr];
  if(i===0)shape.moveTo(...point);else shape.lineTo(...point);
 }
 shape.closePath();
 const g=group(p,x,y,z);
 shapeMesh(g,shape,.035,0xa85e24);
 const face=shapeMesh(g,shape,.027,0xe88726);face.scale.set(.76,.76,1);face.position.z=.046;
 return g;
}

export function streetBell(p,x,z){
 const g=group(p,x,0,z);g.name='Gold bell beside the bean courtyard';
 const profile=[[.06,1.77],[.20,1.72],[.32,1.47],[.32,1.16],[.39,.99],[.47,.93],[.47,.87],[.36,.85]];
 mesh(g,new THREE.LatheGeometry(profile.map(a=>new THREE.Vector2(...a)),32),0xf5bc17);
 cyl(g,0,.87,0,.39,.40,.045,0xb58112,24);ellipsoid(g,0,.78,0,.13,.16,.13,0xf4b626);
 beam(g,[-.49,1.92,0],[.51,1.92,0],.055,0x986b32);beam(g,[0,1.89,0],[0,1.72,0],.038,0x936d26);
 const canopy=new THREE.Shape();canopy.moveTo(-.45,0);canopy.lineTo(.45,0);canopy.lineTo(0,.10);canopy.closePath();const roof=shapeMesh(g,canopy,.42,0xc83748);roof.position.set(0,1.87,-.21);
 return g;
}

export function clownShopBadge(p,x,y,z){
 const g=group(p,x,y,z);g.name='Blue-haired clown face badge';g.rotation.z=-.11;
 ellipsoid(g,0,0,0,.57,.64,.14,0x3669ac);
 for(const side of [-1,1])for(let i=0;i<3;i++)ellipsoid(g,side*(.46+i*.065),.22-i*.17,.005,.18,.17,.12,i%2?0x339eb7:0x3170ae);
 ellipsoid(g,0,-.04,.135,.47,.54,.06,0xf6f2e9);
 for(const xx of [-.22,.21]){beam(g,[xx-.105,.16,.213],[xx+.105,.08,.213],.029,0x818988);beam(g,[xx-.035,.25,.213],[xx+.035,-.02,.213],.028,0x818988);}
 ellipsoid(g,0,-.16,.24,.155,.15,.09,0xe53742);ellipsoid(g,-.046,-.107,.318,.046,.041,.019,0xffecdd);
 ellipsoid(g,0,-.40,.201,.17,.073,.025,0xe74a51);
 return g;
}

export function dressDoubleDoors(p){
 for(const side of [-1,1]){
  const x=.05+side*.58;
  box(p,x,1.56,-1.99,1.10,2.73,.065,0xa47725);
  box(p,x,.67,-1.925,.85,.69,.035,0xc29232);
  for(let row=0;row<3;row++)for(let col=0;col<2;col++){
   const xx=x+(col-.5)*.42,yy=1.33+row*.45;
   box(p,xx,yy,-1.923,.35,.37,.035,0x71b4c9);
   beam(p,[xx-.12,yy-.12,-1.898],[xx+.12,yy+.12,-1.898],.013,0xbce1dc);
  }
  ellipsoid(p,.05+side*.11,1.12,-1.865,.038,.058,.03,0xc2cccb);
 }
}

export function curveStreetBench(g){
 g.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.position)return;o.geometry=o.geometry.clone();const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,a.getZ(i)+a.getX(i)**2*.12);a.needsUpdate=true;o.geometry.computeVertexNormals();});
 g.scale.set(.86,.90,.90);return g;
}
