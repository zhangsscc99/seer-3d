import * as THREE from 'three';
import {group,box,cyl,ellipsoid,beam,arch,flat,mat,flowers} from '../scene-kit.js';
import {stoneCourses} from './town-geometry.js';

function mesh(p,geo,color){const m=new THREE.Mesh(geo,color?.isMaterial?color:mat(color));m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
function tube(p,points,r,color){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),Math.max(32,points.length*6),r,8,false),color);}

export function referenceCastleTower(parent,x,z,h=4.93,r=1.02,{gold=false}={}){
  const g=group(parent,x,0,z);g.name=gold?'Gold bridge turret':'Hollow crenellated entrance turret';
  cyl(g,0,h*.47,0,r,r*1.10,h*.94,gold?0xe8cf82:0xd5d9d1,48);
  if(!gold)stoneCourses(g,0,0,r*1.03,h-.64,5,r*1.10,r);
  cyl(g,0,.18,0,r*1.13,r*1.16,.31,gold?0xe7cb7f:0xc5c5b7,40);
  cyl(g,0,h-.60,0,r*1.08,r,.52,gold?0xe3c779:0xe8ca79,48);
  if(!gold){
    for(let i=0;i<13;i++){
      const a=i*Math.PI*2/13,p=group(g,Math.sin(a)*r*1.079,h-.88,Math.cos(a)*r*1.079);p.rotation.y=a;
      arch(p,0,0,0,.26,.37,.025,0xbca2b9);arch(p,0,-.055,.031,.13,.28,.022,0xeed899);
    }
    // White stone frames and dark, narrow two-storey lancet windows.
    for(const a of [0,.94,-.94,Math.PI])for(const yy of [1.02,2.45]){
      const p=group(g,Math.sin(a)*r*1.076,yy,Math.cos(a)*r*1.076);p.rotation.y=a;
      arch(p,0,0,0,.47,1.10,.10,0xeeeae0);arch(p,0,.10,.115,.27,.86,.035,0x627573);
      box(p,0,.44,.158,.045,.80,.025,0xe4dbb8);box(p,0,.26,.16,.29,.047,.025,0xb8c4bb);
      box(p,0,-.015,.08,.54,.13,.23,0xc4cbc3);
    }
  }
  // An open well and a thick ring replace the old capped cylinder.
  const profile=[[r*.99,h-.40],[r*1.25,h-.40],[r*1.28,h-.17],[r*1.27,h+.08],[r*.96,h+.08],[r*.96,h-.34]];
  const crown=mesh(g,new THREE.LatheGeometry(profile.map(([a,b])=>new THREE.Vector2(a,b)),48),gold?0xf1d98c:0xe7e5d7);crown.material=mat(gold?0xf1d98c:0xe7e5d7).clone();crown.material.side=THREE.DoubleSide;
  cyl(g,0,h-.37,0,r*.99,r*.99,.04,gold?0xc5aa67:0xa8ada3,48);
  for(let i=0;i<9;i++){
    const a=i*Math.PI*2/9;const block=box(g,Math.sin(a)*r*1.13,h+.23,Math.cos(a)*r*1.13,.52,.43,.34,gold?0xf4dc91:0xedeade);block.rotation.y=a;
  }
  return g;
}

export function referenceElephant(parent,x,z){
  const g=group(parent,x,.06,z);g.name='Carved elephant entrance bollard';
  cyl(g,0,.09,0,.40,.45,.18,0xa3aaa0,20);
  ellipsoid(g,0,.49,0,.40,.43,.36,0xa3aca4);
  for(const side of [-1,1]){
    ellipsoid(g,side*.30,.36,.13,.14,.30,.21,0xb3b9ae);
    ellipsoid(g,side*.34,1.02,.03,.27,.38,.13,0x919e99);
    ellipsoid(g,side*.34,1.04,.128,.17,.27,.055,0xb9beb1);
  }
  ellipsoid(g,0,1.05,.03,.33,.36,.31,0xbec2b5);
  tube(g,[[0,1.15,.30],[0,.94,.43],[0,.59,.48],[.15,.47,.41],[.20,.60,.36]],.112,0xaab3a7);
  for(const s of [-1,1]){
    ellipsoid(g,s*.135,1.17,.302,.031,.045,.018,0x596a67);
    tube(g,[[s*.22,.85,.22],[s*.25,.76,.41],[s*.19,.83,.46]],.047,0xddd9c2);
  }
  return g;
}

export function gatheredCurtain(parent,x,z,side){
  const g=group(parent,x,0,z);g.name='Gathered ivory shop curtain';
  const rows=30,cols=24,positions=[],indices=[],colors=[];
  const widthAt=y=>y<1.1?THREE.MathUtils.lerp(.54,.24,(y-.34)/.76):THREE.MathUtils.lerp(.24,.53,Math.min(1,(y-1.1)/2.42));
  for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
    const y=.34+row/rows*3.18,u=col/cols,w=widthAt(y),xx=(u-.5)*w*2+side*.08*Math.sin(row/rows*Math.PI);
    const fold=Math.sin(u*Math.PI*10+row*.018),zz=fold*(.050+.035*Math.abs(y-1.1))+.045*Math.sin(u*Math.PI);
    positions.push(xx,y,zz);const c=new THREE.Color(0xf0ead9).multiplyScalar(.95+.055*fold);colors.push(c.r,c.g,c.b);
    if(row<rows&&col<cols){const a=row*(cols+1)+col;indices.push(a,a+1,a+cols+2,a,a+cols+2,a+cols+1);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  mesh(g,geometry,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.98}));
  const tie=cyl(g,side*.045,1.10,.01,.255,.255,.135,0xc8b88f,32);tie.scale.z=.46;
  for(const s of [-1,1])tube(g,[[s*.50,.37,0],[s*.36,.64,.03],[s*.23,1.10,.015],[s*.40,2.3,.02],[s*.53,3.52,0]],.02,0xcec7b3);
  cyl(g,0,.22,-.035,.45,.48,.23,0xd4d0bd,24);cyl(g,0,3.54,-.035,.55,.49,.14,0xded6bd,24);
  return g;
}

export function referenceBench(parent,x,z,yaw=0){
  const g=group(parent,x,.05,z);g.rotation.y=yaw;g.name='Curved slatted wooden bench';
  for(let row=0;row<5;row++){
    const zz=-.34+row*.18,pts=[];for(let i=0;i<=10;i++){const xx=-1.48+i*.296;pts.push([xx,.60+.045*(xx/1.48)**2,zz]);}tube(g,pts,.070,row%2?0xd99d41:0xe3aa4d);
  }
  for(let row=0;row<5;row++){
    const pts=[];for(let i=0;i<=12;i++){const xx=-1.46+i*2.92/12;pts.push([xx,.86+row*.155+.04*(xx/1.46)**2,-.41-row*.045+.07*(xx/1.46)**2]);}tube(g,pts,.064,row%2?0xdba343:0xe7b153);
  }
  for(const s of [-1,1]){
    tube(g,[[s*1.28,.08,.32],[s*1.35,.04,.48],[s*1.43,.17,.50],[s*1.31,.48,.31],[s*1.30,.71,-.31],[s*1.37,1.36,-.62]],.053,0x93632f);
    tube(g,[[s*1.36,.12,-.50],[s*1.48,.04,-.61],[s*1.55,.19,-.64],[s*1.44,.57,-.38]],.051,0x93632f);
    tube(g,[[s*1.46,.76,.38],[s*1.58,.88,.34],[s*1.58,1.06,.13],[s*1.44,1.09,-.19],[s*1.42,.89,-.39]],.049,0xa37335);
  }
  return g;
}

export function stoneGardenIsland(parent,x,z,rx,rz,{height=.29,flowerCount=20,seed=1}={}){
  const g=group(parent,x,0,z);g.name='Continuous stone-edged flower lawn';
  const wall=cyl(g,0,height/2,0,rx,rx+.03,height,0xbac0ad,72);wall.scale.z=rz/rx;
  const top=cyl(g,0,height-.045,0,rx,rx,.13,0xd8d9c8,72);top.scale.z=rz/rx;
  const lawn=cyl(g,0,height+.017,0,rx-.25,rx-.25,.045,0x8dca56,72);lawn.scale.z=(rz-.22)/(rx-.25);
  const shade=ellipsoid(g,-rx*.12,height+.05,-rz*.09,rx*.76,.019,rz*.74,0x87c351);
  const seams=[];
  for(let i=0;i<52;i++){
    const a=i*Math.PI*2/52,xx=Math.cos(a),zz=Math.sin(a);
    seams.push([(rx-.22)*xx,height+.025,(rz-.22)*zz],[rx*xx,height+.027,rz*zz]);
    seams.push([rx*xx,height+.018,rz*zz],[rx*xx,.025,rz*zz]);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(seams.flat(),3));g.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0x8b998d,transparent:true,opacity:.75})));
  for(let i=0;i<flowerCount;i++){
    const a=i*Math.PI*2/flowerCount+.14,r=.66+(i%3)*.085;
    const f=flowers(g,{x:Math.cos(a)*(rx-.27)*r,z:Math.sin(a)*(rz-.24)*r,w:.30,d:.27},2,seed+i);f.position.y=height+.065;
  }
  return height+.07;
}

export function curvedTownGrass(parent,points,{backPoints,color=0x8ac354,height=.025}={}){
  flat(parent,[...points,...backPoints],color,height);
  const positions=[],indices=[],seams=[];
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len*.32,nz=dx/len*.32,n=positions.length/3;
    positions.push(a[0],.26,a[1],b[0],.26,b[1],b[0]+nx,.26,b[1]+nz,a[0]+nx,.26,a[1]+nz,a[0],.02,a[1],b[0],.02,b[1]);
    indices.push(n,n+3,n+2,n,n+2,n+1,n,n+1,n+5,n,n+5,n+4);
    seams.push(a[0],.273,a[1],a[0]+nx,.273,a[1]+nz,a[0],.273,a[1],a[0],.025,a[1]);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const material=mat(0xd5d7c6).clone();material.side=THREE.DoubleSide;mesh(parent,geo,material);
  const lines=new THREE.BufferGeometry();lines.setAttribute('position',new THREE.Float32BufferAttribute(seams,3));parent.add(new THREE.LineSegments(lines,new THREE.LineBasicMaterial({color:0x919b8f,transparent:true,opacity:.7})));
}
