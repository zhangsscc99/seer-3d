import * as THREE from 'three';
import {createStreetBeanCourt} from './street-bean-court.js';
import {createStreetPets} from './street-pets.js';
import {createStreetPavingMaterial,createStreetForeground} from './street-plaza.js';
import {giftMasonry,giftToolSign,giftStar,streetBell,clownShopBadge,dressDoubleDoors,curveStreetBench} from './street-shop-details.js';
import {referenceCastleTower,referenceElephant,gatheredCurtain,referenceBench,stoneGardenIsland,curvedTownGrass} from './town-fidelity.js';
import {createChurchTerrain, createChurchPavingMaterial} from './church-terrain.js';
import {createChurchPolice} from './church-police.js';
import {createChurchRescue} from './church-rescue.js';
import {createChurchFountains, createChurchForegroundTree, createChurchLandscape} from './church-details.js';
import {createCastleSurfaceKit,createCastlePavingMaterial,castleStoneCourses,deepenCastleMaterials,refineCastleTower,addCastleRearDetails} from './castle-refinement.js';
import { group, box, ellipsoid, cyl, cone, torus, beam, arch, label,
  flat, disk, tree, bush, flowers, fence, bench, ram, mole, makeBase, mat, stroke } from '../scene-kit.js';
import { bowedRoof as roof, treasureLid, fullFacades, turnBlock, stoneCourses, referenceSign, landmarkLamp as lamp } from './town-geometry.js';

// Individual geometry, signs, stairs, gardens and shop furniture follow the
// silhouettes and placement of the three original illustrated locations.
const P = { cream:0xf5f0df, stone:0xe1e4da, edge:0xaeb7af, gold:0xeab844,
  yellow:0xffd15a, wood:0xb88343, darkWood:0x74512f, glass:0x91d1da,
  blue:0x579dc7, teal:0x4c9c8b, grass:0x8dca51, pink:0xd8838d, red:0xc95548 };

function rawMesh(parent, geometry, color, x=0, y=0, z=0, outlined=true) {
  const m = new THREE.Mesh(geometry, mat(color));
  m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m);
  if(outlined)stroke(m); return m;
}
function hoop(parent,x,y,z,r,t,color,flatOnGround=false) {
  const m=torus(parent,x,y,z,r,t,color); if(flatOnGround)m.rotation.x=-Math.PI/2; return m;
}
function tube(parent, points, radius, color) {
  return rawMesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),
    Math.max(16,points.length*4),radius,7,false),color,0,0,0,false);
}
function clearLabel(parent,text,x,y,z,w,h,color='#fff2cf',fontSize=80) {
  return label(parent,text,x,y,z,w,h,{color,bg:'rgba(0,0,0,0)',border:'rgba(0,0,0,0)',fontSize});
}
function archWindow(p,x,y,z,w=0.5,h=1.1,trim=P.cream,glass=0x577b84) {
  arch(p,x,y,z,w+.17,h+.11,.06,trim);
  arch(p,x,y+.055,z+.073,w,h-.06,.025,glass);
  box(p,x,y+h*.42,z+.109,.04,h*.73,.035,P.wood);
  box(p,x,y+h*.43,z+.115,w-.03,.045,.03,P.wood);
}
function roundWindow(p,x,y,z,r=.4,trim=P.wood) {
  ellipsoid(p,x,y,z,r,r,.048,P.glass); hoop(p,x,y,z+.047,r,.065,trim);
  box(p,x,y,z+.09,r*1.75,.055,.06,trim);box(p,x,y,z+.09,.055,r*1.75,.06,trim);
}
function door(p,x,y,z,w=1.6,h=2.5,trim=P.stone,wood=P.wood) {
  arch(p,x,y,z,w+.32,h+.20,.12,trim);arch(p,x,y+.065,z+.135,w,h,.06,wood);
  box(p,x,y+h*.44,z+.216,.045,h*.83,.035,P.darkWood);
  for(const side of [-1,1])ellipsoid(p,x+side*.19,y+h*.42,z+.258,.066,.09,.035,P.gold);
  for(let i=-2;i<=2;i++)if(i)box(p,x+i*w*.16,y+h*.36,z+.212,.025,h*.66,.029,P.darkWood);
}
function stairs(p,x,z,w,count=7,rise=.23,run=.38,color=P.stone,rails=true) {
  for(let i=0;i<count;i++)box(p,x,(i+1)*rise/2,z-i*run,w,(i+1)*rise,run+.03,color);
  if(rails)for(const side of [-1,1]){
    for(const i of [0,Math.floor(count/2),count-1]){
      beam(p,[x+side*(w/2+.08),(i+1)*rise,z-i*run],[x+side*(w/2+.08),(i+1)*rise+.72,z-i*run],.07,P.gold);
      ellipsoid(p,x+side*(w/2+.08),(i+1)*rise+.79,z-i*run,.11,.11,.11,P.gold);
    }
    beam(p,[x+side*(w/2+.08),rise+.72,z],[x+side*(w/2+.08),count*rise+.72,z-(count-1)*run],.075,P.wood);
  }
}
function ringPlanter(p,x,z,rx,rz,{height=.24,flowersCount=18,seed=2}={}) {
  const base=cyl(p,x,height/2,z,rx,rx+.05,height,P.edge,48);base.scale.z=rz/rx;
  const top=cyl(p,x,height-.04,z,rx-.06,rx-.06,.15,P.stone,48);top.scale.z=rz/rx;
  disk(p,x,z,rx-.24,rz-.23,P.grass,height+.045);
  for(let i=0;i<28;i++){
    const a=i*Math.PI*2/28;
    const m=box(p,x+Math.cos(a)*(rx-.105),height+.012,z+Math.sin(a)*(rz-.105),.30,.15,.27,i%3?0xe5e2d5:0xc6c7bc);
    m.rotation.y=-a;
  }
  if(flowersCount) {
    const f=flowers(p,{x,z,w:(rx-.5)*1.65,d:(rz-.5)*1.50},flowersCount,seed);f.position.y=height+.055;
  }
  return height+.08;
}
function crenels(p,cx,cy,cz,r,count,color=P.cream) {
  for(let i=0;i<count;i++){
    const a=i*Math.PI*2/count;
    const b=box(p,cx+Math.sin(a)*r,cy,cz+Math.cos(a)*r,.52,.53,.37,color);b.rotation.y=a;
  }
}
function castleTower(p,x,z,h=5.05,r=1.03) {
  cyl(p,x,h/2,z,r,r*1.09,h,0xb7c2bc,40);
  stoneCourses(p,x,z,r*1.04,h-.5,5,r*1.09+.028,r+r*.09*(.5/h)+.028);
  for(const a of [Math.PI/2,Math.PI,-Math.PI/2]){const side=group(p,x+Math.sin(a)*(r*1.045),0,z+Math.cos(a)*(r*1.045));side.rotation.y=a;for(const y of [.92,2.58])archWindow(side,0,y,0,.40,1.07,0xf4efe2,0x52645f);}
  cyl(p,x,.21,z,r*1.12,r*1.16,.28,0xd1c8b5,24);
  cyl(p,x,h-.72,z,r*1.03,r,.38,0xdec6a0,24);
  cyl(p,x,h-.24,z,r*1.18,r*1.04,.55,0xccb994,24);
  cyl(p,x,h+.03,z,r*1.23,r*1.22,.16,P.stone,24);
  crenels(p,x,h+.34,z,r*1.17,9,P.stone);
  for(let j=0;j<2;j++)archWindow(p,x,.92+j*1.66,z+r+.021,.39,1.09,0xf4e9d3,0x40585c);
  for(let i=0;i<7;i++){
    const a=-1.2+i*.4;
    const w=group(p,x+Math.sin(a)*(r*1.07),h-.66,z+Math.cos(a)*(r*1.07));w.rotation.y=a;
    arch(w,0,0,0,.21,.27,.018,0xc092a0);
  }
  for(let k=1;k<5;k++){
    const band=hoop(p,x,k*.90,z,r+.012,.016,0xbeb5a5,true);band.scale.z=1;
  }
}
function shield(p,x,y,z,w,h,color,border=P.gold) {
  const s=new THREE.Shape();s.moveTo(-w*.50,h*.32);s.lineTo(0,h*.53);s.lineTo(w*.5,h*.32);
  s.lineTo(w*.43,-h*.27);s.lineTo(0,-h*.53);s.lineTo(-w*.43,-h*.27);s.closePath();
  const front=rawMesh(p,new THREE.ExtrudeGeometry(s,{depth:.14,bevelEnabled:true,bevelSize:.065,bevelThickness:.045,bevelSegments:1}),border,x,y,z);
  const inner=rawMesh(p,new THREE.ShapeGeometry(s),color,x,y,z+.19,false);inner.scale.set(.85,.83,1);return front;
}
function curvedRoof(p,x,y,z,w,h,d,color,rib=P.wood) {
  const s=new THREE.Shape();s.moveTo(-w/2,0);
  for(let i=0;i<=32;i++){const a=Math.PI-i/32*Math.PI;s.lineTo(Math.cos(a)*w/2,Math.sin(a)*h);}
  s.lineTo(w/2,0);s.closePath();
  rawMesh(p,new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),color,x,y,z-d/2);
  for(const zz of [z-d/2-.04,z+d/2+.05]) {
    const pts=[];for(let i=0;i<=20;i++){const a=Math.PI-i/20*Math.PI;pts.push([x+Math.cos(a)*w/2,y+Math.sin(a)*h,zz]);}
    tube(p,pts,.10,rib);
  }
  for(const a of [.42,1.16,1.98,2.72])beam(p,[x+Math.cos(a)*w/2,y+Math.sin(a)*h,z-d/2],[x+Math.cos(a)*w/2,y+Math.sin(a)*h,z+d/2],.09,rib);
}
function cross(p,x,y,z,scale=1,color=P.red) {
  box(p,x,y,z,.37*scale,1.20*scale,.15,0xffefd3);
  box(p,x,y,z,1.10*scale,.40*scale,.15,0xffefd3);
  box(p,x,y,z+.09,.26*scale,.99*scale,.10,color);
  box(p,x,y,z+.09,.89*scale,.27*scale,.10,color);
}
function paperFlag(p,x,y,z,color=P.red) {
  const pivot=group(p,x,y,z);beam(p,[x,y-.30,z],[x,y+1.0,z],.035,P.gold);
  ellipsoid(p,x,y+1.02,z,.07,.07,.07,P.gold);
  const s=new THREE.Shape();s.moveTo(0,.84);s.lineTo(-.67,.92);s.lineTo(-1.11,.66);s.lineTo(-.67,.42);s.lineTo(0,.49);s.closePath();
  const material=mat(color).clone();material.side=THREE.DoubleSide;
  const flag=new THREE.Mesh(new THREE.ShapeGeometry(s),material);pivot.add(flag);return pivot;
}
function standard(root,colliders,extra={}) {
  return {root,spawn:[0,.05,8.2],bounds:{minX:-13,maxX:13,minZ:-7,maxZ:10},colliders,
    updates:[],dynamic:[],camera:{target:[0,2,0],position:[0,22,30],perspectivePosition:[3,12.6,21],perspectiveTarget:[0,2,.2],span:22},...extra};
}

function gardenEdges(root,type){
  for(const side of [-1,1]){
    const edge=[];for(let i=0;i<=35;i++){const z=-10+i*.70,x=side*(14.2+.95*Math.sin((z+4)*.22));edge.push([x,z]);}
    flat(root,[...edge,[side*40,15],[side*40,-12]],0x87bd52,.031);
    for(let i=0;i<edge.length-1;i++){const [x,z]=edge[i],[nx,nz]=edge[i+1];const curb=box(root,(x+nx)/2,.14,(z+nz)/2,.29,.28,Math.hypot(nx-x,nz-z)*.96,i%3?0xd8ded0:0xbcc5b9);curb.rotation.y=Math.atan2(nx-x,nz-z);}
  }
  if(type==='castle'){
    const edge=[];for(let i=0;i<=42;i++){const x=-15+i*30/42,z=11.1+.011*x*x+.5*Math.sin(x*.27);edge.push([x,z]);}
    flat(root,[...edge,[22,35],[-22,35]],0x86bf50,.032);
    for(let i=0;i<edge.length-1;i++){const [x,z]=edge[i],[nx,nz]=edge[i+1];const curb=box(root,(x+nx)/2,.15,(z+nz)/2,Math.hypot(nx-x,nz-z)*.97,.29,.37,i%3?0xdbe0d4:0xbec7ba);curb.rotation.y=-Math.atan2(nz-z,nx-x);}
    flowers(root,{x:1,z:13.8,w:24,d:2},58,112);
  }
}

// The original streets are tucked into a busy village, with flowering hedges
// between the main landmarks and the small timber houses behind them.
function villageHouse(root,x,z,w,h,roofColor,yaw=0){
  const p=group(root,x,0,z);p.rotation.y=yaw;
  box(p,0,h/2,0,w,h,w*.79,0xf0d9ae);
  box(p,0,.20,0,w+.12,.32,w*.83,0xd0c3a2);
  roof(p,0,h,0,w*1.15,h*.56,w*.95,roofColor,0xb9935c);
  for(const side of [-1,1]){
    box(p,side*w*.44,h*.51,w*.40,.10,h*.91,.14,0xbd905a);
    beam(p,[side*w*.44,h,w*.425],[0,h*1.55,w*.425],.062,0xbc925f);
  }
  box(p,0,h*1.20,w*.425,.09,h*.48,.14,0xb98b57);
  archWindow(p,0,h*.39,w*.416,w*.32,h*.41,0xe3bf77,0x81b9c7);
  for(const side of [-1,1]){const f=group(p,side*w*.51,0,0);f.rotation.y=side*Math.PI/2;archWindow(f,0,h*.36,0,w*.27,h*.36,0xe0c99a,0x89bac0);}
  box(p,w*.30,h*1.40,-w*.21,.35,h*.38,.36,0xceb996);
  box(p,w*.30,h*1.61,-w*.21,.43,.12,.43,0xe0ccb0);
  return p;
}
function floweringHedge(root,x,z,s=1){
  const p=group(root,x,0,z);p.scale.setScalar(s);
  ellipsoid(p,0,.78,0,1.48,.95,.75,0x528e46);
  for(let i=0;i<7;i++){
    const xx=-1.15+i*.37,yy=.94+Math.sin(i*1.7)*.17;
    ellipsoid(p,xx,yy,.18,.38,.42,.42,[0x74b54d,0x88c251,0x5da349][i%3]);
    if(i%2===0){for(let n=0;n<5;n++){const a=n*Math.PI*2/5;ellipsoid(p,xx+Math.cos(a)*.095,yy+.02+Math.sin(a)*.095,.60,.067,.067,.025,0xfff7db);}ellipsoid(p,xx,yy+.02,.625,.035,.035,.02,0xeccc67);}
  }
}
function townBackdrop(root,type){
  const layouts={
    castle:[[-14.7,-7.7,2.2,3.1,0xbf7977,.18],[-13.3,-12.6,2.9,4.0,0x8298b9,.15],[-9.4,-16.7,2.6,4.6,0xc98378,.04],[-3.6,-15.6,2.5,3.6,0x83a7b5,-.15],[6.1,-12.7,2.9,3.7,0x789cab,.12],[9.9,-10.5,3.0,3.8,0x9997b3,-.10],[14.3,-7.3,2.9,3.7,0x739eb1,-.24]],
    church:[[-14.8,-10.2,3,3.5,0x678fb2,.19],[-9.0,-13.0,2.6,4.1,0xc58481,-.07],[-4.7,-12.8,2.7,3.4,0x7d9eae,.14],[3.7,-12.0,2.6,3.4,0xd08877,-.12],[13.2,-8.4,2.5,3.5,0xab96b5,-.25],[16.4,-5.9,3.0,3.7,0x7295b3,-.21]],
    street:[[-14.4,-8.5,2.5,3.5,0x7a9cb9,.22],[-10.9,-12.9,2.4,3.1,0xc78e91,.16],[-5.2,-12.1,2.3,3.5,0x7e9fb9,-.1],[4.6,-8.1,2.6,3.8,0x91a1b3,.05],[7.2,-9.2,2.4,3.2,0xd29a71,.06],[14.8,-7.5,2.6,3.8,0xb091a5,-.20]]};
  for(const args of layouts[type]){
    const house=villageHouse(root,...args);
    // The reference houses peek between landmarks; they do not form a second
    // row of equally tall shop façades behind the main buildings.
    if(type==='castle')house.scale.y=.74;
    if(type==='street')house.scale.y=.62;
  }
  for(let i=0;i<15;i++)floweringHedge(root,-18+i*2.6,-12.6+(i%3)*.6,1.0+(i%4)*.12);
  for(const side of [-1,1])for(let i=0;i<4;i++)floweringHedge(root,side*(13.5+i*.64),-5.4+i*2.2,.86+i*.08);
}
function sourceMosaic(root){
  const tex=new THREE.TextureLoader().load('/references/town-castle-mosaic.png');tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
  const material=mat(0xffffff).clone();material.map=tex;material.transparent=true;material.alphaTest=.1;material.depthWrite=false;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(6.22,6.22),material);floor.rotation.x=-Math.PI/2;floor.position.set(0,.084,5.49);floor.receiveShadow=true;floor.name='Original castle emblem mosaic';root.add(floor);
  // Physical slim rim retains the stone mosaic's edge from low viewing angles.
  hoop(root,0,.059,5.49,3.02,.035,0xd3b892,true);
}

export function createCastleScene() {
  const root=makeBase({paved:true,seed:12});root.name='摩尔城堡';gardenEdges(root,'castle');townBackdrop(root,'castle');
  const stoneKit=createCastleSurfaceKit();
  const plaza=root.children.find(o=>o.geometry?.type==='PlaneGeometry'&&o.geometry.parameters.width===36);if(plaza){plaza.material.dispose();plaza.material=createCastlePavingMaterial({width:36,depth:23});}
  const castleStart=root.children.length;
  // Circular low castle, an open terrace, twin small crenellated entrance towers.
  cyl(root,0,1.93,-4.55,5.47,5.66,3.78,0xb8c3bd,64);
  castleStoneCourses(root,stoneKit,{z:-4.55,height:3.6,rows:8,bottom:5.70,top:5.52});
  for(let i=0;i<34;i++){const a=i*Math.PI*2/34;const arcade=group(root,Math.sin(a)*5.62,2.89,-4.55+Math.cos(a)*5.62);arcade.rotation.y=a;arch(arcade,0,0,0,.76,.68,.09,0xe4b53b);arch(arcade,0,-.055,.11,.43,.60,.04,0xf2efe2);}
  for(const a of [1.30,1.8,2.4,3.0,3.6,4.2,4.8,5.2]){const window=group(root,Math.sin(a)*5.65,.60,-4.55+Math.cos(a)*5.65);window.rotation.y=a;archWindow(window,0,0,0,.45,1.2,0xf2efe3,0x506666);}
  cyl(root,0,.19,-4.55,5.70,5.76,.25,0xb9b7ab,48);
  cyl(root,0,3.84,-4.55,5.51,5.51,.18,0xeff0df,48);
  for(let i=0;i<9;i++)for(let j=0;j<6;j++){
    const x=(i-4)*1.13,z=-4.55+(j-2.5)*1.61;
    if(x*x+(z+4.55)**2<25)box(root,x,3.956,z,1.065,.034,1.535,[0xdce1ce,0xf0ead0,0xc6d5d4,0xe2e1d5][(i+j)%4]);
  }
  crenels(root,0,4.21,-4.55,5.4,31,0xeee8d6);
  // Thin curved courses and small slit windows retain the hand-drawn masonry rhythm.
  for(const y of [1.02,2.22,3.23])hoop(root,0,y,-4.55,5.49,.025,0xd0c8b7,true);
  for(const a of [-.80,-.59,-.39,.39,.59,.8]) {
    const win=group(root,Math.sin(a)*5.73,.70,-4.55+Math.cos(a)*5.73);win.rotation.y=a;
    archWindow(win,0,0,0,.36,.99,0xf5f0df,0x596a67);
    arch(win,0,1.56,.01,.48,.48,.04,0xe5bc54);
  }
  for(const x of [-4.13,4.13])refineCastleTower(referenceCastleTower(root,x,-.91,4.93,1.02),stoneKit);
  // Entry: blue stone arch, two timber leaves, elephant bollards and gold MOLE crest.
  arch(root,0,.22,1.08,3.80,3.24,.14,0xa4cad1);
  door(root,0,.22,1.18,2.38,2.84,0x9dc1c7,0xae7938);
  for(let i=0;i<11;i++){
    const a=i*Math.PI/10,block=box(root,Math.cos(a)*1.77,1.74+Math.sin(a)*1.48,1.255,.41,.32,.15,[0x9fc5cf,0xb1d0d0,0x86b5c5][i%3]);block.rotation.z=a-Math.PI/2;
  }
  for(const side of [-1,1]){box(root,side*.59,1.18,1.44,.85,.20,.08,0x6f8e9a);for(const k of [-1,1])ellipsoid(root,side*.59+k*.30,1.18,1.492,.035,.035,.022,0xc8d3cf);}
  // Recessed oak plank grooves, paired iron hinges and small brass door studs.
  for(const side of [-1,1])for(const yy of [.67,1.84]){
    box(root,side*.59,yy,1.433,.99,.09,.061,0x506477);
    for(const k of [-1,1])ellipsoid(root,side*.59+k*.38,yy,1.474,.037,.037,.020,0xb99b53);
  }
  for(let plank=-4;plank<=4;plank++)for(let streak=0;streak<2;streak++){
    const xx=plank*.23+(streak-.5)*.074,yy=.39+((plank+5)*.27+streak*.72)%1.23;
    box(root,xx,yy+.26,1.418,.014,.46,.013,0x75451f);
  }

  for(let i=0;i<3;i++)box(root,0,.095+i*.085,1.85-i*.28,3.05-i*.12,.19+i*.17,.46,0xcbb48b);
  for(const side of [-1,1]){
    box(root,side*1.58,1.26,1.40,.33,2.38,.34,0xb5c3bd);
    box(root,side*1.64,2.58,1.40,.51,.22,.43,0xdfe3ce);
    referenceElephant(root,side*1.99,1.80).scale.setScalar(1.13);
  }
  shield(root,0,3.53,1.19,2.96,1.85,0xba963f,0xf2c953);
  referenceSign(root,'/references/town-mole.png',0,3.54,1.44,3.28,2.21,{depth:.17,border:0xe6bd4d});
  // A curving outside stair climbs up the left wall to the terrace.
  for(let i=0;i<22;i++){
    const a=-.60-i*.070,r=7.06,x=Math.sin(a)*r,z=-4.55+Math.cos(a)*r,y=.16+i*.177;
    const step=box(root,x,y-.035,z,1.65,.22,.55,i%2?0xe3d9bf:0xd4cbb5);step.rotation.y=a-Math.PI/2;
    const rail=box(root,Math.sin(a)*(r+.88),y+.25,-4.55+Math.cos(a)*(r+.88),.16,.68,.56,P.stone);rail.rotation.y=a-Math.PI/2;
  }
  const lowCastle=turnBlock(root,castleStart,0,-4.55,0);lowCastle.scale.set(1.23,.90,1.0);deepenCastleMaterials(lowCastle,stoneKit);
  // Rear Book tower and the golden bridge wall visible above the circular court.
  cyl(root,3.10,5.69,-7.52,1.90,1.72,3.64,stoneKit.stone(0xae9574),48);
  // The flared upper gallery is built as a pierced, curved shell below.
  cyl(root,3.10,8.85,-7.52,2.52,2.50,.23,stoneKit.stone(0xdfb45a),48);
  crenels(root,3.10,9.19,-7.52,2.38,18,0xe0b65b);
  for(const a of [-.62,.55]){
    const win=group(root,3.10+Math.sin(a)*1.87,4.70,-7.52+Math.cos(a)*1.87);win.rotation.y=a;arch(win,0,0,0,.42,1.1,.03,0x584f43);
  }
  door(root,2.43,3.97,-5.70,1.04,1.82,0xc5c6b1,0xab8741);
  referenceSign(root,'/references/town-book.png',2.16,6.38,-5.43,2.45,1.73,{border:0xd4ab4e,tilt:-.05});
  for(const a of [1.6,2.4,3.2,4,4.8]){const window=group(root,3.1+Math.sin(a)*1.86,4.70,-7.52+Math.cos(a)*1.86);window.rotation.y=a;archWindow(window,0,0,0,.45,1.15,0xd8cbae,0x564e40);}
  // These bridge arches are open physical arch rings; the sky is visible through them.
  for(const cx of [-9.40,-6.75,-4.10]){
    const outer=1.26,inner=.87,leg=1.35,shape=new THREE.Shape();
    shape.moveTo(-outer,0);shape.lineTo(-outer,leg);shape.absarc(0,leg,outer,Math.PI,0,true);shape.lineTo(outer,0);shape.lineTo(inner,0);shape.lineTo(inner,leg);shape.absarc(0,leg,inner,0,Math.PI,false);shape.lineTo(-inner,0);shape.closePath();
    const bridge=rawMesh(root,new THREE.ExtrudeGeometry(shape,{depth:1.02,bevelEnabled:true,bevelSize:.04,bevelThickness:.05,bevelSegments:2}),0xcaa14f,cx,4.2,-9.20);bridge.material=stoneKit.stone(0xcaa14f);
  }
  box(root,-6.70,7.12,-8.69,8.57,.62,1.07,stoneKit.stone(0xd2ab56));
  for(const x of [-10.47,-8.20,-7.90,-5.56,-5.25,-3.01])box(root,x,3.85,-8.69,.39,.70,1.03,stoneKit.stone(0xbb9241));
  for(let i=0;i<11;i++)box(root,-10.58+i*.78,7.45,-8.84,.42,.48,.7,stoneKit.stone(0xddb75f));
  const bridgeTurret=referenceCastleTower(root,-10.60,-8.8,4.0,1.04,{gold:true});bridgeTurret.position.y=3.80;deepenCastleMaterials(bridgeTurret,stoneKit);
  castleStoneCourses(bridgeTurret,stoneKit,{height:3.42,rows:6,bottom:1.15,top:1.04,blockWidth:.72,palette:[0xc19b4b,0xd0a852,0xc4a059,0xb68f40]});
  addCastleRearDetails(root,stoneKit);
  ellipsoid(root,-10.7,1.42,-9.4,2.72,2.40,2.80,0x91bf60);
  // The food shop really is a giant carton of fries.
  const food=group(root,7.15,.02,-.40);food.rotation.y=-.15;
  box(food,0,1.45,0,2.20,2.9,1.86,0xa87a35);door(food,0,.07,.94,1.38,2.45,0xe8d7a9,0x8e692f);
  for(let i=0;i<3;i++)box(food,0,.075+i*.09,1.55-i*.23,2.0-i*.09,.15+i*.16,.43,0xd4c8aa);
  const carton=box(food,0,3.10,0,2.32,1.30,1.90,0xca4937);carton.rotation.z=-.025;
  for(let i=0;i<17;i++){
    const xx=(i%5-2)*.41,zz=(Math.floor(i/5)-1)*.40,h=1.31+(i*7%5)*.20;
    const fry=box(food,xx,3.66+h/2,zz,.30,h,.32,i%3?0xffce38:0xf4b72e);fry.rotation.z=(i%3-1)*.11;
  }
  referenceSign(food,'/references/town-food.png',0,3.24,1.09,2.95,2.63,{border:0x7cab39,depth:.20});
  fullFacades(food,0,0,2.2,1.86,2.85,{color:0xbd9751,glass:0x877348});
  const ice=group(root,10.55,.02,.52);ice.rotation.y=-.25;
  arch(ice,0,0,0,2.50,3.40,1.75,0x9d75a4);arch(ice,0,.09,1.77,1.79,2.51,.04,0x594673);
  box(ice,0,.25,1.86,1.9,.35,.28,0x6caccb);
  for(let i=0;i<5;i++){
    const x=-.76+i*.38;tube(ice,[[x-.19,.45,1.94],[x,.28,1.97],[x+.19,.45,1.94]],.05,0x438cc0);
    if(i>0&&i<4){cyl(ice,x,.64,1.79,.07,.04,.19,0xd7b384,10);ellipsoid(ice,x,.77,1.79,.10,.10,.10,[0xf7f0df,0xdfcee5,0xe9c7c0][i-1]);}
  }
  for(const side of [-1,1])for(let i=0;i<7;i++)ellipsoid(ice,side*1.13,.38+i*.43,1.92,.10,.115,.10,0xffe761);
  referenceSign(ice,'/references/town-ice.png',-.24,3.65,1.96,2.60,2.17,{depth:.15,border:0x966c9f});
  fullFacades(ice,0,.85,2.37,1.65,2.65,{color:0xae88aa,glass:0x6f527c});
  const swirl=group(ice,.94,3.60,.46);swirl.rotation.z=-.21;
  const wafer=cone(swirl,0,.24,0,.45,1.22,0xf1bf60,12);wafer.rotation.z=Math.PI;
  for(let i=0;i<6;i++){const r=.65-i*.086;const ring=hoop(swirl,0,.97+i*.19,0,r,.13,i%2?0xe4d4ee:0xfff9e9,true);ring.scale.z=.84;}
  ellipsoid(swirl,.05,2.10,0,.14,.22,.14,0xfff6ed);
  // The exact multicolour stone emblem is rectified from the supplied picture.
  sourceMosaic(root);
  for(const [x,z,s] of [[-8.70,3.28,1.05],[7.86,6.53,1.09],[-8.83,-2.1,.82],[12.46,.61,.86]])lamp(root,x,z,s);
  stoneGardenIsland(root,5.70,2.64,1.80,1.32,{flowerCount:11,seed:44});
  const npc=mole(root,5.53,2.59,0xa5cb6f);npc.scale.setScalar(.73);npc.position.y=.34;const npcRam=ram(root,6.44,2.75,0xf3c841);npcRam.scale.setScalar(.65);npcRam.position.y=.33;
  const grassCurve=new THREE.CatmullRomCurve3([[16,0,6.7],[12,0,7.1],[9,0,7.1],[6.6,0,8.4],[5.9,0,11.8],[6.4,0,17]].map(p=>new THREE.Vector3(...p))).getPoints(52).map(p=>[p.x,p.z]);
  curvedTownGrass(root,grassCurve,{backPoints:[[22,20],[24,5.8]],height:.036});referenceBench(root,9.2,8.64,-.20);flowers(root,{x:10.2,z:10.7,w:6.4,d:4.4},30,73);
  disk(root,-11.50,.01,3.20,5.6,0x85be52,.025);floweringHedge(root,-12.12,-3.15,2.0);
  flowers(root,{x:-10.8,z:2.0,w:2.3,d:6.0},20,17);
  const mailbox=group(root,-11.04,.05,.88);
  cyl(mailbox,0,.65,0,.14,.2,1.3,0xc54c50,12);cyl(mailbox,0,1.88,0,.48,.43,1.4,0xc84e50,20);
  ellipsoid(mailbox,0,2.59,0,.49,.36,.49,0xd85c62);ellipsoid(mailbox,0,2.98,0,.12,.12,.12,0xd75b65);
  box(mailbox,0,2.01,.444,.62,.105,.035,0x6d333d);box(mailbox,0,1.63,.448,.52,.12,.025,0xf3d19b);
  for(const x of [-13,12.8])bush(root,x,-6.2,1.5);
  const flag=paperFlag(root,-11.2,8.0,-11.8,0xf2f5e8);
  return standard(root,[{x:0,z:-4.4,rx:7.25,rz:5.25},{x:7.1,z:.25,rx:1.62,rz:1.5},
    {x:10.4,z:.9,rx:1.56,rz:1.6},{x:5.7,z:2.64,rx:1.80,rz:1.32,kind:'ellipse'},{x:9.2,z:8.64,rx:1.64,rz:.80}],
  {dynamic:[flag],updates:[t=>{flag.rotation.y=Math.sin(t*1.3)*.13;}],spawn:[0,.05,9.0],camera:{target:[0,2,0],position:[0,22,30],perspectivePosition:[-1,11.0,19.4],perspectiveTarget:[.4,2.1,.9],fov:25,span:22}});
}

export function createChurchScene() {
  const root=group();root.name='爱心教堂';createChurchLandscape(root);
  const plaza=new THREE.Mesh(new THREE.PlaneGeometry(36,29),createChurchPavingMaterial({width:36,depth:29}));
  plaza.rotation.x=-Math.PI/2;plaza.position.set(0,.02,4);plaza.receiveShadow=true;root.add(plaza);
  flat(root,[[-15,-7],[-3.6,-7],[-4.2,-.1],[-6.3,.5],[-9.6,.2],[-11.2,1.0],[-14.2,.4]],0x75b34b,.782);
  for(let i=0;i<12;i++)floweringHedge(root,-15+i*2.6,-8.1+(i%3)*.5,.88);
  for(const side of [-1,1])for(let i=0;i<4;i++)floweringHedge(root,side*(13.5+i*.64),-5.4+i*2.2,.86+i*.08);
  villageHouse(root,15.1,-7.2,2.0,2.6,0xb7a1bf,-.19);
  const terrain=createChurchTerrain(root);
  flat(root,[[-11.7,.63],[-11.0,-.2],[-9.3,-.75],[-7.4,-.55],[-5.5,-1.1],[-2.8,-1.2],[-1.2,-.35],[-5.0,.95],[-8.2,1.3]],createChurchPavingMaterial(),.793);
  const police=createChurchPolice(root);
  let blockStart=root.children.length;
  // BANK is a treasure chest: long broad front, curved end cap, deep red lid and brass bands.
  box(root,.18,2.77,-4.42,4.26,2.29,3.65,0xb95441);
  box(root,.18,1.04,-3.54,3.68,1.94,3.90,0xe3d4b3);
  treasureLid(root,.18,3.88,-4.41,4.60,1.76,3.94);
  fullFacades(root,.18,-3.54,3.68,3.90,1.90,{color:0xd2cdbb,glass:0x7dbfcb});
  for(const side of [-1,1]){box(root,.18+side*2.13,2.78,-4.41,.18,2.31,3.68,0xd0a15c);box(root,.18+side*2.24,2.77,-4.41,.08,.18,3.68,0xe1bb6c);}
  box(root,.18,2.97,-2.46,.46,1.22,.16,0xe1b45b);ellipsoid(root,.18,3.03,-2.34,.09,.13,.03,0x765c39);
  for(const xx of [-1.64,2.0])for(const yy of [2.05,3.51])ellipsoid(root,xx,yy,-2.36,.085,.085,.045,0xf0ce7b);
  for(const x of [-1.91,2.27])box(root,x,2.94,-2.525,.22,2.23,.20,0xe1b356);
  for(const y of [1.81,3.82])box(root,.18,y,-2.51,4.49,.19,.24,0xdca94c);
  arch(root,.18,.04,-1.59,2.64,2.89,.12,0xcfcbbb);
  arch(root,.18,.11,-1.447,2.21,2.63,.07,0x78c6cf);
  box(root,.18,1.35,-1.33,.09,2.45,.05,0xe7e9d3);
  beam(root,[-.86,.44,-1.326],[.19,2.28,-1.326],.039,0xbfe4df);
  beam(root,[-.21,.23,-1.322],[1.14,2.60,-1.322],.039,0xbfe4df);
  cyl(root,.18,.14,-1.21,1.51,1.64,.22,0xcfcbb9,32);
  ellipsoid(root,.18,3.71,-2.32,.98,.99,.14,0xd1d4c3);ellipsoid(root,.18,3.71,-2.15,.80,.80,.07,0xb54b3d);
  clearLabel(root,'★',.18,3.77,-2.06,1.58,1.45,'#f4d999',114);
  ellipsoid(root,.35,3.62,-1.97,.39,.52,.10,0xf5c445).rotation.z=-.27;
  referenceSign(root,'/references/town-bank.png',.22,2.91,-1.20,4.30,1.62,{depth:.13,border:0xb1873d});
  for(let i=0;i<3;i++)clearLabel(root,'★',-1.99,3.71-i*.49,-2.04,.49,.49,'#f07b76',93);
  bush(root,-2.28,-.12,.80);bush(root,2.82,-.90,.92);
  const bank=turnBlock(root,blockStart,.18,-3.6,-.30);bank.position.y=.72;blockStart=root.children.length;
  const rescue=createChurchRescue(root);
  const fountains=createChurchFountains(root);
  const seatsStart=root.children.length;
  ringPlanter(root,7.11,7.26,2.46,2.05,{height:.39,flowersCount:10});
  for(let i=0;i<8;i++){
    const a=.15+i*Math.PI*2/8,x=7.11+Math.cos(a)*3.10,z=7.26+Math.sin(a)*2.70;
    for(const d of [-.17,.17])cyl(root,x+d,.22,z,.055,.07,.44,0x9b7444,8);
    const seat=cyl(root,x,.47,z,.42,.43,.14,0xc79755,18);seat.scale.z=.73;
    for(const d of [-.11,.11]){const r=hoop(root,x+d,.552,z,.10,.017,0x997039,true);r.scale.z=.72;}
  }
  const sculpture=group(root,7.11,.48,7.15);
  ellipsoid(sculpture,0,.40,0,.60,.45,.54,0xf4b339);ellipsoid(sculpture,.12,.61,.38,.50,.36,.18,0xf6c943);
  hoop(sculpture,.12,.63,.53,.36,.11,0xeaa42f);ellipsoid(sculpture,-.23,.84,-.21,.35,.21,.37,0xf1c048);
  const seats=turnBlock(root,seatsStart,7.11,7.26,0);seats.position.z+=1.8;seats.scale.set(.94,1,.94);
  for(let i=0;i<32;i++){
    const x=-1.7+(i*37%113)/10,z=3.0+(i*19%40)/10;
    if((x-7.1)**2/10+(z-7.3)**2/7>1){const confetti=box(root,x,.055,z,.17,.018,.11,[0xf07976,0x5cb6bf,0xedc34d,0x91bc57][i%4]);confetti.rotation.y=i*.63;}
  }
  createChurchForegroundTree(root);
  const terraceFlowers=flowers(root,{x:-12.5,z:-.4,w:1.8,d:2.0},14,67);terraceFlowers.position.y=.72;
  flowers(root,{x:2.5,z:-.4,w:1.2,d:1.2},12,70);
  return standard(root,[...police.colliders,{x:-11.4,z:6.2,rx:1.03,rz:.8,kind:'ellipse',height:11},
    {x:.18,z:-3.5,rx:2.60,rz:2.80,baseY:.72},...rescue.colliders,
    {x:7.11,z:9.06,rx:2.40,rz:2.01,kind:'ellipse',cameraBlock:false}],
  {dynamic:fountains.dynamic,updates:[fountains.update],spawn:[0,.05,6.20],
    background:0x8ed4e2,heightAt:(x,z)=>Math.max(terrain.heightAt(x,z),police.heightAt?.(x,z)??.05),walkable:(x,z)=>terrain.walkable(x,z)&&(!police.walkable||police.walkable(x,z)),
    camera:{target:[0,2,0],position:[0,22,30],perspectivePosition:[2.36,10.40,19.52],perspectiveTarget:[.65,2.43,1.8],fov:20,span:22}});
}

export function createStreetScene() {
  const root=makeBase({paved:true,seed:39});root.name='淘淘乐街';gardenEdges(root,'street');townBackdrop(root,'street');
  const plaza=root.children.find(o=>o.geometry?.type==='PlaneGeometry'&&o.geometry.parameters.width===36);if(plaza)plaza.material=createStreetPavingMaterial({width:52,depth:33.2});
  const foreground=createStreetForeground(root);foreground.position.z+=3.05;
  let blockStart=root.children.length;
  // GIFTS: two curved pink roofs, a deep balcony wing and an outside staircase.
  box(root,-8.26,2.31,-4.65,5.62,4.59,4.21,0xe8d9b2);
  for(const y of [.45,2.52,4.46])box(root,-8.26,y,-2.489,5.72,.14,.20,0xa3a58e);
  for(const x of [-10.91,-8.27,-5.59])box(root,x,2.40,-2.425,.20,4.52,.21,0xaaab91);
  const giftRoof=roof(root,-8.26,4.58,-4.62,6.19,2.40,4.76,0xe1a0a6,0xb6b9b0);
  giftRoof.traverse(o=>{if(o.isLineSegments){o.material=o.material.clone();o.material.color.setHex(0x995366);o.material.opacity=.95;}});
  archWindow(root,-8.24,4.25,-2.151,1.16,1.42,0xcbbd91,0x85bdd0);
  box(root,-8.26,4.55,-2.13,2.15,.14,.24,0xadaf9b);
  for(const side of [-1,1])beam(root,[-8.26+side*3.05,4.57,-2.14],[-8.26,7.04,-2.14],.115,0xc2c4af);
  door(root,-8.24,.10,-2.39,1.35,2.62,0xc3bc9b,0x6babbc);
  const wingStart=root.children.length;
  box(root,-10.20,1.38,-.16,3.96,2.68,3.42,0xe7d3aa);
  const lowGiftRoof=roof(root,-10.20,2.68,-.21,4.46,1.94,3.93,0xe7a5aa,0xb9c0b6);
  lowGiftRoof.traverse(o=>{if(o.isLineSegments){o.material=o.material.clone();o.material.color.setHex(0xa3596b);o.material.opacity=.95;}});
  archWindow(root,-9.97,.38,1.535,1.04,1.66,0xc4b991,0x66b6be);
  // The two separate stair flights wrap around the projecting lower shop.
  stairs(root,-12.45,4.06,1.84,10,.248,.37,0xa6b5c0,false);
  for(let i=0;i<10;i++){box(root,-12.45,(i+1)*.248+.014,4.06-i*.37,1.81,.031,.33,0xece7b9);box(root,-12.45,(i+1)*.248-.10,4.06-i*.37+.185,1.77,.15,.023,0x9c92aa);}
  box(root,-12.45,2.43,.33,1.94,.14,1.05,0xcbd1c4);
  const upperSteps=group(root,0,2.48,0);stairs(upperSteps,-12.33,-.17,1.57,6,.245,.37,0xa9bec8,false);
  for(let i=0;i<6;i++)box(upperSteps,-12.33,(i+1)*.245+.014,-.17-i*.37,1.54,.032,.33,0xe1dcb6);
  turnBlock(upperSteps,0,-12.33,-.17,-.60);
  box(root,-10.83,3.94,-2.09,1.70,.14,.72,0xd1d7c9);
  arch(root,-10.39,2.56,-2.30,.92,1.78,.14,0xb0c3c9);arch(root,-10.39,2.63,-2.13,.71,1.59,.07,0x79aabd);
  for(const yy of [2.97,3.50])box(root,-10.39,yy,-2.031,.73,.064,.05,0xb6b4a2);
  referenceSign(root,'/references/town-gifts.png',-11.13,5.19,-1.40,2.73,2.03,{border:0x78a6aa,tilt:-.06});
  const wingObjects=root.children.slice(wingStart);
  const toolSign=giftToolSign(root,-8.84,3.45,.10);toolSign.scale.setScalar(1.12);toolSign.rotation.y=-.68;
  const wingSignsStart=root.children.length;
  ellipsoid(root,-9.27,1.47,1.763,.77,.55,.055,0x2b947d);
  // Ensure the NEW lettering sits in front of its green oval board.
  referenceSign(root,'/references/town-new.png',-9.27,1.54,1.85,1.28,1.34,{border:0x299570,depth:.12,tilt:.11});
  wingObjects.push(...root.children.slice(wingSignsStart));
  shield(root,-5.94,5.63,-2.37,1.34,2.64,0xe1ab42,0xc69536);
  giftStar(root,-5.94,6.11,-2.12,.43);giftStar(root,-5.94,5.14,-2.12,.35);
  const flag=paperFlag(root,-7.42,7.12,-3.16,0xc84a5e);

  fullFacades(root,-8.26,-4.65,5.62,4.21,4.59,{color:0xb5bba6,glass:0x8dbcc6,stone:true});
  const wingFacadesStart=root.children.length;
  fullFacades(root,-10.20,-.16,3.96,3.42,2.68,{color:0xb4bba8,glass:0x8dbbc3});
  wingObjects.push(...root.children.slice(wingFacadesStart));
  wingObjects.push(giftMasonry(root));
  const lowerWing=group(root);for(const o of wingObjects){o.position.x-=.58;o.position.z-=2.78;lowerWing.attach(o);}lowerWing.scale.y=1.02/1.10;
  const gifts=turnBlock(root,blockStart,-8.3,-3.2,.80);gifts.position.x-=.4;gifts.position.z+=4.20;gifts.scale.set(.88,1.10,1.0);
  streetBell(root,-5.06,-.30);blockStart=root.children.length;
  // DRESS: turquoise shingles and gathered fabric curtains; the hanger follows
  // the roof pitch, with only its metal hook extending above the ridge.
  box(root,.05,2.09,-4.40,5.77,4.11,3.75,0xf0e2c0);
  roof(root,.05,4.12,-4.40,6.47,2.03,4.16,0x74a895,0x758d89);
  box(root,.05,.33,-2.449,5.94,.19,.22,0xcac6ad);
  box(root,.05,3.52,-2.39,5.82,.13,.17,0x8b966c);
  arch(root,.05,.11,-2.28,2.83,3.40,.13,0x939e84);
  arch(root,.05,.19,-2.119,2.32,3.12,.075,0xc89743);
  dressDoubleDoors(root);
  for(let row=0;row<7;row++)for(const side of [-1,1])box(root,.05+side*2.64,.57+row*.48,-2.388,.39,.10,.045,0xc9a16c);
  for(const side of [-1,1]){
    const x=.05+side*1.89;
    gatheredCurtain(root,x,-1.98,side);
  }
  stairs(root,.05,-.92,3.15,3,.12,.38,0xc9cab7,false);
  const sign=group(root,.05,4.09,-1.88);
  referenceSign(sign,'/references/town-dress.png',0,.09,.31,5.02,2.50,{depth:.17,border:0x599fab});
  clownShopBadge(root,2.04,3.37,-1.37);
  arch(root,.06,4.40,-2.26,1.45,1.72,.14,0x748e8d);
  arch(root,.06,4.46,-2.095,1.14,1.48,.05,0xb0aea3);
  archWindow(root,.06,5.02,-2.015,.77,.94,0xa6b79f,0x85c0c6);
  // Actual 3-D wire hanger: shoulders, bottom rail, neck and curved hook.
  beam(root,[-2.97,4.20,-4.08],[.02,6.22,-4.08],.081,0x9bafa6);
  beam(root,[.02,6.22,-4.08],[3.00,4.20,-4.08],.081,0x9bafa6);
  tube(root,[[.02,6.22,-4.08],[.03,6.54,-4.08],[.48,6.81,-4.08],[.53,7.29,-4.08],[.08,7.56,-4.08],[-.37,7.23,-4.08],[-.37,7.00,-4.08]],.115,0xd9dfce);
  // Green Mole Bean annex and the pink clothes/calendar board.
  const bean=createStreetBeanCourt(root);
  const fashionBoardStart=root.children.length;
  box(root,4.05,1.72,-.89,1.55,3.37,.21,0xc8a06a).rotation.z=-.045;
  box(root,4.05,1.93,-.756,1.33,2.59,.045,0xe7b36e);
  for(let i=0;i<5;i++)box(root,3.47+i*.287,1.62,-.717,.018,1.95,.025,0xffe6ad);
  for(let i=0;i<7;i++)box(root,4.05,.69+i*.29,-.702,1.17,.018,.029,0xffe6ad);
  referenceSign(root,'/references/town-fashion.png',4.08,4.10,-.76,1.14,1.94,{border:0xb961a2,depth:.19});
  ellipsoid(root,4.08,2.90,-.68,.41,.30,.045,0xd783b4);
  clearLabel(root,'M',4.08,2.91,-.61,.65,.43,'#fff4e8',95);
  for(const side of [-1,1]){beam(root,[4.05+side*.43,2.30,-.694],[4.05+side*.30,2.62,-.694],.018,0xffe8c3);beam(root,[4.05+side*.30,2.62,-.694],[4.05+side*.12,2.53,-.694],.018,0xffe8c3);}
  const fashionBoard=turnBlock(root,fashionBoardStart,4.05,-.89,0);fashionBoard.scale.set(.93,.84,.93);
  fullFacades(root,.05,-4.40,5.77,3.75,4.11,{color:0xc9c3a4,glass:0x92bec4});
  const dress=turnBlock(root,blockStart,.05,-4.4,.08);dress.scale.y=1.10;
  const pets=createStreetPets(root);
  // Central oval green, flower border, two benches and the familiar social square.
  const planterY=stoneGardenIsland(root,2.48,4.48,3.84,2.52,{height:.31,flowerCount:18,seed:76});
  const gardener=mole(root,2.58,4.47,0xed913d);gardener.position.y=planterY;gardener.scale.setScalar(.82);
  const littleRam=ram(root,3.67,4.71,0x73b53e);littleRam.position.y=planterY;littleRam.scale.setScalar(.66);
  curveStreetBench(referenceBench(root,-.56,6.71,-.48));curveStreetBench(referenceBench(root,5.39,6.64,.48));
  const visitors=[[-4.64,4.85,0xdb9abc],[4.46,6.13,0x7fb1c5],[-1.30,8.65,0x67a674]];
  visitors.forEach(([x,z,c],i)=>{const m=mole(root,x,z,c);m.scale.setScalar(.74+i*.04);});
  ram(root,-5.42,5.22,0xe78dc4).scale.setScalar(.61);
  lamp(root,-7.232,13.865,.84);
  for(const [x,z,s] of [[-13.3,-6.2,1.08],[13.4,-5.3,1.17],[13.3,4.6,.67]])tree(root,x,z,s);
  bush(root,-10.065,10.804,.66);bush(root,12.55,7.82,.8);
  const transformCollider=(c,pivot,cx,cz)=>{const center=new THREE.Vector3(c.x-cx,0,c.z-cz);pivot.updateMatrix();center.applyMatrix4(pivot.matrix);const ca=Math.abs(Math.cos(pivot.rotation.y)),sa=Math.abs(Math.sin(pivot.rotation.y));return {...c,x:center.x,z:center.z,rx:c.rx*pivot.scale.x*ca+c.rz*pivot.scale.z*sa,rz:c.rz*pivot.scale.z*ca+c.rx*pivot.scale.x*sa};};
  const giftColliders=[{x:-8.26,z:-4.65,rx:2.81,rz:2.11},{x:-10.78,z:-2.94,rx:1.98,rz:1.71}].map(c=>transformCollider(c,gifts,-8.3,-3.2));
  const beanColliders=bean.colliders.map(c=>transformCollider(c,dress,.05,-4.4));
  return standard(root,[...giftColliders,{x:0,z:-3.8,rx:3.5,rz:2.4},...beanColliders,{x:4.05,z:-.8,rx:.95,rz:.45},...pets.colliders,{x:2.48,z:4.48,rx:3.84,rz:2.52,kind:'ellipse'}],
  {portalLocations:{petshop:pets.entrance},dynamic:[flag],updates:[t=>{flag.rotation.y=Math.sin(t*1.2)*.15;}],spawn:[.0,.05,8.55],camera:{perspectivePosition:[1.1,10.25,22.2],perspectiveTarget:[.1,.65,.55],fov:28,span:22}});
}
