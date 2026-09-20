import * as THREE from 'three';
import {group,box,ellipsoid,cyl,cone,torus,beam,flat,flowers,bush,mat,stroke,rng} from '../scene-kit.js';

// All coast, masonry, windows, banners and scenery below are modelled in world space.
// The reference is used for proportions and layout, never as a backdrop or facade.
const SEA=-.68, SAND=.84, PIER=1.12, GRASS=2.01;
const stair={x:6.4,z:1.5,inner:.95,outer:4.1,stretch:3.2/4.1,count:3};
const pierSections=[
 {x0:-14.2,x1:15.5,z0:7.05,z1:9.05,cols:15,rows:2},
 {x0:-10.05,x1:-4.45,z0:-4.55,z1:7.05,cols:3,rows:7},
 {x0:-10.05,x1:1.55,z0:-6.9,z1:-4.55,cols:7,rows:2},
];
const sandOutline=[[-2.8,-18],[28,-18],[28,16],[18,16],[12,12],[5,9.3],[-1.8,5],[-3.6,.6],[-2.8,-8]];
const grassOutline=[[12,-18],[28,-18],[28,16],[20,14],[15,10],[11,7],[7,5.2],[stair.x,stair.z+3.2]];
for(let i=1;i<=28;i++){const a=Math.PI/2-i/28*Math.PI;grassOutline.push([stair.x+stair.outer*Math.cos(a),stair.z+3.2*Math.sin(a)]);}
grassOutline.push([8.2,-3.8],[10.5,-5.8],[10.7,-10]);

function inside(points,x,z){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [a,b]=points[i],[c,d]=points[j];if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)yes=!yes;}return yes;}
function onPier(x,z){return pierSections.some(r=>x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1);}
function stairLevel(x,z){
 const r=Math.hypot(x-stair.x,(z-stair.z)/stair.stretch);
 if(x<stair.x-.001||r<stair.inner||r>stair.outer+.001)return null;
 return Math.min(stair.count-1,Math.floor((r-stair.inner)/(stair.outer-stair.inner)*stair.count));
}
function waterStep(x,z){
 if(z<1.4||z>3.2||x>-10.04||x<-14.54)return null;
 return Math.min(4,Math.max(0,Math.floor((-10.04-x)/.9)));
}
function heightAt(x,z){
 const level=stairLevel(x,z);if(level!==null)return SAND+(level+1)*(GRASS-SAND)/stair.count;
 if(inside(grassOutline,x,z))return GRASS;
 if(onPier(x,z))return PIER;
 const step=waterStep(x,z);if(step!==null)return PIER-(step+1)*.25;
 return SAND;
}
function mesh(parent,geometry,color,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,color?.isMaterial?color:mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function prism(parent,points,bottom,top,color,outlined=false){
 const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 const m=mesh(parent,new THREE.ExtrudeGeometry(shape,{depth:top-bottom,bevelEnabled:false,curveSegments:2}),color,0,bottom,0);m.rotation.x=-Math.PI/2;
 return outlined?stroke(m,0x697b81):m;
}
function tube(parent,points,r,color,closed=false){return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed),Math.max(20,points.length*4),r,6,closed),color);}
function squareRing(parent,y,outer,inner,h,color){
 box(parent,0,y,outer-(outer-inner)/2,outer*2,h,outer-inner,color);
 box(parent,0,y,-outer+(outer-inner)/2,outer*2,h,outer-inner,color);
 box(parent,outer-(outer-inner)/2,y,0,outer-inner,h,inner*2,color);
 box(parent,-outer+(outer-inner)/2,y,0,outer-inner,h,inner*2,color);
}
function pointedShape(w,h){
 const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h*.64);
 s.quadraticCurveTo(w*.39,h*.87,0,h);s.quadraticCurveTo(-w*.39,h*.87,-w/2,h*.64);s.closePath();return s;
}
function pointedFrame(parent,w,h,depth,color){
 const shape=pointedShape(w,h),hole=new THREE.Path();const hw=w/2-.18,base=.16,peak=h-.24,shoulder=h*.64;
 hole.moveTo(-hw,base);hole.lineTo(-hw,shoulder);hole.quadraticCurveTo(-hw*.78,h*.84,0,peak);hole.quadraticCurveTo(hw*.78,h*.84,hw,shoulder);hole.lineTo(hw,base);hole.closePath();shape.holes.push(hole);
 return stroke(mesh(parent,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:10}),color),0x746f5a);
}
function slabPath(parent,rect,random){
 prism(parent,[[rect.x0,rect.z0],[rect.x1,rect.z0],[rect.x1,rect.z1],[rect.x0,rect.z1]],-1.18,PIER-.18,0x7894a0);
 const dx=(rect.x1-rect.x0)/rect.cols,dz=(rect.z1-rect.z0)/rect.rows,nodes=[];
 for(let j=0;j<=rect.rows;j++){nodes[j]=[];for(let i=0;i<=rect.cols;i++)nodes[j][i]=[rect.x0+i*dx+(i&&i<rect.cols?(random()-.5)*.30:0),rect.z0+j*dz+(j&&j<rect.rows?(random()-.5)*.18:0)];}
 for(let j=0;j<rect.rows;j++)for(let i=0;i<rect.cols;i++){
  const corners=[nodes[j][i],nodes[j][i+1],nodes[j+1][i+1],nodes[j+1][i]],cx=corners.reduce((n,p)=>n+p[0],0)/4,cz=corners.reduce((n,p)=>n+p[1],0)/4;
  const inset=corners.map(([x,z])=>[cx+(x-cx)*.972,cz+(z-cz)*.962]);
  prism(parent,inset,PIER-.22,PIER,[0xefe7d2,0xf2e9d7,0xe8e1cd][(i+j)%3],true);
  // Slate faces taper into wide ivory seams instead of checkerboard centres.
  const patch=[];for(let k=0;k<4;k++){const [x,z]=inset[k],next=inset[(k+1)%4];const t=.12+random()*.12;patch.push([cx+(x-cx)*(.73+random()*.12),cz+(z-cz)*(.72+random()*.13)]);patch.push([x+(next[0]-x)*(.56+t),z+(next[1]-z)*(.56+t)]);}
  flat(parent,patch,[0xaeb6c3,0xc1bec8,0xadb5c2,0xc4bec5][(i+j)%4],PIER+.004);
 }
 // Staggered rough masonry is visible on every exposed side, including from the sea.
 for(const side of ['front','back','left','right']){
  const horizontal=side==='front'||side==='back',start=horizontal?rect.x0:rect.z0,end=horizontal?rect.x1:rect.z1;
  for(let row=0;row<3;row++)for(let p=start-(row%2)*.65;p<end;p+=1.3){
   const a=Math.max(start,p),b=Math.min(end,p+1.27);if(b-a<.12)continue;
   const y=-.89+row*.58,color=[0x8199a2,0x94a5ab,0x738d98,0x9dabb0][(row+Math.round(p*2)+120)%4];
   if(horizontal)box(parent,(a+b)/2,y,side==='front'?rect.z1+.005:rect.z0-.005,b-a,.54,.11,color);
   else box(parent,side==='left'?rect.x0-.005:rect.x1+.005,y,(a+b)/2,.11,.54,b-a,color);
  }
 }
}
function makeCrate(parent,x,y,z,turn,random){
 const g=group(parent,x,y,z);g.rotation.y=turn;const w=1.18,h=1.08,d=1.06;
 box(g,0,h/2,0,w,h,d,0x966433);
 for(const side of [-1,1]){
  for(let i=0;i<5;i++)box(g,-.47+i*.235,.54,side*.541,.216,.94,.055,[0xc89548,0xd6a150,0xbe873e][i%3]);
  for(const yy of [.12,.96])box(g,0,yy,side*.593,1.3,.145,.12,0xe5b264);
  for(const xx of [-.55,.55])box(g,xx,.54,side*.6,.135,1.1,.13,0xdca758);
  for(let i=0;i<4;i++)box(g,side*.61,.54,-.40+i*.265,.045,.91,.244,[0xc48c43,0xd9a354,0xba7f39][i%3]);
  for(const yy of [.12,.96])box(g,side*.65,yy,0,.13,.145,1.08,0xddaa59);
  for(const zz of [-.45,.45])box(g,side*.65,.54,zz,.13,1.1,.12,0xe6b565);
  for(const xx of [-.55,.55])for(const yy of [.18,.9])cyl(g,xx,yy,side*.673,.027,.027,.025,0x6f6149,6).rotation.x=Math.PI/2;
 }
 for(let i=0;i<5;i++)box(g,-.47+i*.235,1.096,0,.215,.065,1.09,[0xe3b260,0xd5a357,0xdbae67][i%3]);
 if(random()>.45){const support=beam(g,[-.43,.2,.68],[.43,.9,.68],.037,0xb7803e);support.scale.z=.6;}
 return g;
}
function makeGuard(parent,x,z){
 const g=group(parent,x,PIER,z);g.name='silver-guard';
 cyl(g,0,.12,0,.87,.98,.24,0xb6b6a3,20);cyl(g,0,.29,0,.82,.86,.13,0xece6ce,20);
 for(const s of [-1,1]){
  ellipsoid(g,s*.29,.56,.18,.31,.22,.43,0x91a7b4);ellipsoid(g,s*.25,.94,.015,.24,.46,.26,0x8a9fac);
  ellipsoid(g,s*.62,1.72,.03,.35,.36,.36,0xbfd0d3);ellipsoid(g,s*.76,1.29,.12,.24,.39,.25,0x879fae);ellipsoid(g,s*.77,1.01,.22,.25,.25,.23,0xc0cfd0);
 }
 ellipsoid(g,0,1.52,0,.67,.77,.47,0x90a7b5);ellipsoid(g,0,1.63,.28,.55,.61,.28,0xc1d2d5);
 const waist=torus(g,0,1.03,0,.49,.075,0x6d8594);waist.rotation.x=Math.PI/2;waist.scale.y=.75;
 cyl(g,0,2.2,0,.26,.31,.28,0x708d9d,12);
 ellipsoid(g,0,2.69,0,.65,.65,.56,0xb9cbd1);ellipsoid(g,0,2.58,.44,.46,.39,.25,0x91aab7);
 box(g,0,2.74,.623,.72,.115,.045,0x486474);box(g,0,2.42,.649,.095,.39,.047,0xb7c9cb);
 for(const x of [-.2,0,.2])box(g,x,2.37,.664,.035,.12,.035,0x647f8f);
 for(const s of [-1,1]){const ear=cyl(g,s*.63,2.61,0,.20,.20,.10,0xd3dddb,12);ear.rotation.z=Math.PI/2;}
 tube(g,[[.02,3.18,0],[-.24,3.58,-.04],[.10,3.93,-.03],[.58,3.81,.02],[.59,3.40,.06],[.23,3.30,.08],[.12,3.55,.10]],.205,0x7775b5);
 tube(g,[[-.1,3.45,.06],[-.58,3.76,.08],[-.73,3.48,.11],[-.51,3.29,.13]],.12,0x9490cc);
 const a=new THREE.Vector3(-.94,.48,.19),b=new THREE.Vector3(-1.17,3.8,.09);beam(g,a.toArray(),b.toArray(),.061,0xcbb879);
 const spear=cone(g,-1.215,4.41,.07,.23,1.48,0xe9dbac,7);spear.rotation.z=-.07;
 const stripe=[];for(let i=0;i<=46;i++){const t=i/46,r=.224*(1-t);stripe.push([-1.165-.10*t+Math.sin(t*Math.PI*7)*r,3.68+t*1.47,.08+Math.cos(t*Math.PI*7)*r]);}tube(g,stripe,.035,0x8097a3);
 return g;
}
function flagTexture(){
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;const c=canvas.getContext('2d');
 c.fillStyle='#c63f36';c.fillRect(0,0,128,256);c.fillStyle='#fff4d4';c.fillRect(12,8,104,235);
 c.fillStyle='#d1463d';c.fillRect(15,12,48,107);c.fillRect(63,119,50,118);c.fillStyle='#f5db98';c.fillRect(0,0,128,8);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function buildLighthouse(parent,dynamic,flags){
 const tower=group(parent,-6.8,PIER,-1.15);tower.name='lighthouse';
 prism(tower,[[-2.8,-2.8],[2.8,-2.8],[2.8,2.8],[-2.8,2.8]],-.08,.16,0x77939d,true);
 prism(tower,[[-2.62,-2.58],[2.62,-2.58],[2.62,2.6],[-2.62,2.6]],.16,.37,0xd4d8cf,true);
 cyl(tower,0,3.45,0,1.67,1.94,6.2,0xddd7b8,8);
 cyl(tower,0,.55,0,1.99,2.09,.42,0xcac4a6,8);
 for(let side=0;side<8;side++){
  const a=side*Math.PI/4,face=group(tower,Math.sin(a)*1.79,0,Math.cos(a)*1.79);face.rotation.y=a;
  for(let row=0;row<7;row++){
   box(face,.67-(row%2)*.07,.87+row*.70,0,row%2?.35:.49,.60,.09,[0xb6b49e,0xcec9ad,0xc6c2a6][(row+side)%3]);
  }
 }
 // Door and lintel are volumes, and every side of the tower has masonry.
 const door=group(tower,0,.38,1.81);pointedFrame(door,1.12,2.27,.19,0xa19a7f);
 mesh(door,new THREE.ShapeGeometry(pointedShape(.76,1.94)),0x596666,0,.14,.06);
 for(const x of [-.24,0,.24])box(door,x,1.02,.115,.035,1.70,.035,0x2f4852);
 // A red flared square balcony with carved scallops, an open interior and thick gold coping.
 const colors=[0xc14f43,0xa84039,0xbf4b40,0xcd5a43];
 for(let face=0;face<4;face++){
  const panel=group(tower);panel.rotation.y=face*Math.PI/2;
  const s=new THREE.Shape();s.moveTo(-3.26,7.24);s.lineTo(3.26,7.24);s.lineTo(2.46,5.7);
  s.lineTo(2.14,5.68);s.bezierCurveTo(1.92,5.78,1.98,6.68,1.35,6.68);s.bezierCurveTo(.84,6.68,.82,5.69,.62,5.63);
  s.lineTo(-.28,5.63);s.bezierCurveTo(-.43,5.75,-.41,6.69,-1.02,6.69);s.bezierCurveTo(-1.64,6.69,-1.57,5.76,-1.85,5.7);s.lineTo(-2.46,5.7);s.closePath();
  const geometry=new THREE.ExtrudeGeometry(s,{depth:.22,bevelEnabled:false,curveSegments:13});
  const p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)+2.38+(p.getY(i)-5.7)/1.54*.74);geometry.computeVertexNormals();
  stroke(mesh(panel,geometry,colors[face]),0x7e4940);
  beam(panel,[-3.26,7.28,3.12],[3.26,7.28,3.12],.13,0xf0c977);
  beam(panel,[-3.26,7.28,3.12],[-2.46,5.73,2.4],.075,0xdca25d);
  beam(panel,[3.26,7.28,3.12],[2.46,5.73,2.4],.075,0xdca25d);
  for(const x of [-2.64,2.64]){
   const z=3.09;beam(panel,[x-.20,6.95,z],[x+.20,6.95,z],.022,0xeeb87b);beam(panel,[x,6.70,z-.1],[x,7.10,z],.022,0xeeb87b);
  }
 }
 squareRing(tower,6.99,3.02,1.40,.2,0xa8483d);
 cyl(tower,0,7.47,0,1.30,1.45,1.74,0xe0dabc,8);
 cyl(tower,0,8.14,0,2.00,1.47,.39,0xd4cdb0,12);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;const corbel=cone(tower,Math.sin(a)*1.61,7.92,Math.cos(a)*1.61,.23,.54,0xbab69b,4);corbel.rotation.z=Math.PI;}
 cyl(tower,0,8.36,0,1.91,2.00,.27,0xeee6c7,12);
 const glass=new THREE.MeshStandardMaterial({color:0x89cbd6,transparent:true,opacity:.48,roughness:.14,metalness:.08,side:THREE.DoubleSide,depthWrite:false});
 const inner=new THREE.MeshStandardMaterial({color:0x4f686b,roughness:1});
 cyl(tower,0,8.53,0,1.58,1.60,.12,inner,12);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,face=group(tower,Math.sin(a)*1.77,8.45,Math.cos(a)*1.77);face.rotation.y=a;
  pointedFrame(face,1.39,3.43,.26,0xe9e0c1);
  mesh(face,new THREE.ShapeGeometry(pointedShape(1.04,3.08)),glass,0,.16,.03);
  box(face,0,.52,.29,1.24,.12,.16,0xc4bea4);
  if(i%2===0)beam(face,[.0,.66,.21],[.0,2.62,.21],.046,0xb2ad92);
 }
 // The lantern can also be seen through the back windows during a full orbit.
 cyl(tower,0,9.78,0,.43,.55,1.90,0x8a7b52,10);ellipsoid(tower,0,10.27,0,.39,.69,.39,new THREE.MeshBasicMaterial({color:0xffebad}));
 for(let i=0;i<6;i++){const a=i*Math.PI/3;beam(tower,[Math.sin(a)*.58,9.42,Math.cos(a)*.58],[Math.sin(a)*.58,11.02,Math.cos(a)*.58],.035,0xb5a369);}
 cyl(tower,0,11.94,0,2.03,1.89,.25,0xc5bd9e,12);
 cyl(tower,0,12.16,0,2.37,2.18,.35,0xa3423b,12);cyl(tower,0,12.34,0,2.47,2.47,.12,0xe1a45b,12);
 cone(tower,0,13.16,0,2.57,1.70,0xc54e41,12);cone(tower,0,14.10,0,.27,.34,0xf0c265,8);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(tower,[Math.sin(a)*2.52,12.36,Math.cos(a)*2.52],[0,14.0,0],.037,i%2?0xb4433d:0xe19757);}
 const bannerMaterial=new THREE.MeshStandardMaterial({map:flagTexture(),side:THREE.DoubleSide,roughness:1});
 for(const sign of [-1,1]){
  beam(tower,[sign*1.8,11.76,0],[sign*3.25,11.76,0],.061,0xc49b4d);ellipsoid(tower,sign*3.29,11.76,0,.11,.11,.11,0xe5bf70);
  const geo=new THREE.PlaneGeometry(1.03,2.1,10,16),pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);if(y<-.6)pos.setY(i,y+.37*(1-Math.abs(x)/.515)*(-y-.6)/.45);}
  const flag=mesh(tower,geo,bannerMaterial,sign*2.64,10.62,.045);flag.name='checker-banner';
  flags.push({mesh:flag,base:pos.array.slice(),sign});dynamic.push(flag);
 }
 // Chunky parapet around the base, kept low at the open entrance.
 for(const side of [-1,1])for(let i=0;i<5;i++){
  const z=-2.12+i*1.02,top=i<2?1.47:i<4?1.0:.56;
  box(tower,side*2.62,top/2+.25,z,.56,top,1.02,0xa8b7bf);
  box(tower,side*2.62,top+.29,z,.67,.14,1.07,0xe7e5ce);
 }
 for(let i=0;i<5;i++){box(tower,-2.10+i*1.05,.92,-2.59,1.02,1.35,.58,0xa5b5be);box(tower,-2.10+i*1.05,1.64,-2.59,1.07,.16,.7,0xe5e3ce);}
 return tower;
}
function leafFin(parent,side){
 const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(side*.65,.68,side*1.5,.92,side*2.22,1.72);shape.bezierCurveTo(side*2.32,.38,side*1.58,-.66,0,-.54);shape.closePath();
 const m=mesh(parent,new THREE.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:true,bevelSize:.09,bevelThickness:.07,bevelSegments:2,steps:1,curveSegments:15}),0x337f9d,side*1.3,.09,-.3);m.rotation.x=Math.PI/2;m.rotation.y=side*.13;return m;
}
function makeSubmarine(parent,dynamic){
 const sub=group(parent,-13.58,SEA+.37,-1.8);sub.name='mole-leaf-submarine';sub.rotation.y=.42;
 const hullGeo=new THREE.SphereGeometry(1,32,22),p=hullGeo.attributes.position;
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const taper=1-.23*Math.max(0,z);p.setXYZ(i,x*2.00*taper,y*1.34,z*2.58+(z>0?z*z*.34:0));}hullGeo.computeVertexNormals();mesh(sub,hullGeo,0x38ae99,0,.54,0);
 ellipsoid(sub,0,.88,-1.07,1.57,1.03,1.37,0x53c5a6);leafFin(sub,-1);leafFin(sub,1);
 const ribs=[[-1.5,.86,-1.25],[-1.86,.45,-.25],[-1.43,.33,1.30],[-.62,.14,2.53],[0,.06,2.88]];
 tube(sub,ribs,.075,0x1b7c7c);tube(sub,ribs.map(([x,y,z])=>[-x,y,z]),.075,0x1b7c7c);
 // Four cream cheek lobes and the unmistakable red mole nose form the prow.
 for(const side of [-1,1]){
  const upper=ellipsoid(sub,side*.39,.87,2.81,.42,.70,.16,0xbcf1ce);upper.rotation.z=-side*.47;
  const lower=ellipsoid(sub,side*.31,.29,2.91,.32,.58,.13,0xb5edc8);lower.rotation.z=side*.43;
 }
 ellipsoid(sub,0,.98,3.02,.23,.23,.17,0xdc6350);ellipsoid(sub,-.065,1.065,3.158,.07,.035,.025,0xffc9a4);
 const window=group(sub,0,1.80,1.22);window.rotation.x=-.55;
 ellipsoid(window,0,0,.01,1.02,1.09,.31,0x2d5368);torus(window,0,0,.15,1.02,.16,0xdbcea0);torus(window,0,0,.22,.88,.051,0x749389);
 for(let i=0;i<10;i++){const a=i*Math.PI/5;ellipsoid(window,Math.sin(a)*1.03,Math.cos(a)*1.03,.30,.047,.047,.047,0xf3e2b5);}
 tube(window,[[-.60,-.60,.23],[-.39,-.14,.35],[-.42,.35,.29],[-.66,.65,.17]],.087,0x365b81);
 tube(window,[[.17,-.79,.17],[.34,-.22,.34],[.24,.32,.31],[.02,.80,.17]],.084,0x2e3b65);
 tube(window,[[-.68,.68,.27],[-.40,.88,.30],[-.08,.92,.25]],.067,0xa6dedb);
 const tail=group(sub,0,.19,-2.64);cyl(tail,0,0,-.18,.16,.16,.55,0x557b8d,10).rotation.x=Math.PI/2;
 const prop=group(tail,0,0,-.50);for(let i=0;i<3;i++){const fin=ellipsoid(prop,0,.44,0,.18,.62,.09,0x668eaa);fin.rotation.z=i*Math.PI*2/3;fin.position.set(Math.sin(-fin.rotation.z)*.42,Math.cos(fin.rotation.z)*.42,0);}
 dynamic.push(sub);return {sub,prop};
}

export function createBeachScene(){
 const root=group(),dynamic=[],flags=[],foam=[];root.name='阳光海滩';const random=rng(204);
 // Water is a broad, subdivided volume surface that remains water in every direction.
 const seaGeometry=new THREE.PlaneGeometry(240,120,96,64),seaPositions=seaGeometry.attributes.position,seaColors=[];
 for(let i=0;i<seaPositions.count;i++){
  const x=seaPositions.getX(i),v=(seaPositions.getY(i)+60)/120;
  const z=THREE.MathUtils.lerp(65,-61-x*.35,v);seaPositions.setY(i,-z);
  const t=THREE.MathUtils.smoothstep(z,-24,18),c=new THREE.Color(0x4776aa).lerp(new THREE.Color(0x3299b5),t);
  const patch=Math.sin(x*.21+z*.16)*Math.cos(z*.31-x*.12)*.035;c.offsetHSL(0,0,patch);
  seaColors.push(c.r,c.g,c.b);
 }
 seaGeometry.setAttribute('color',new THREE.Float32BufferAttribute(seaColors,3));
 const seaBase=seaPositions.array.slice();
 const seaMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:0});
 const sea=mesh(root,seaGeometry,seaMaterial,0,SEA,0);sea.rotation.x=-Math.PI/2;sea.receiveShadow=true;sea.castShadow=false;sea.name='moving-sea';dynamic.push(sea);
 prism(root,sandOutline,-1.5,SAND-.12,0xb49770);prism(root,sandOutline,SAND-.12,SAND,0xe5d4b8);
 for(let i=0;i<360;i++){
  const x=-2+random()*28,z=-12+random()*26;if(!inside(sandOutline,x,z)||inside(grassOutline,x,z)||onPier(x,z))continue;
  const r=.12+random()*.55,points=[];for(let j=0;j<5;j++){const a=j/5*Math.PI*2;points.push([x+Math.cos(a)*r*(.5+random()*.5),z+Math.sin(a)*r*.60]);}
  flat(root,points,[0xf5e7c4,0xf0dfba,0xcebb9a,0xf2e4c2][i%4],SAND+.006);
 }
 // A high earthen grass platform, including a real curved stair recess in the cliff.
 prism(root,grassOutline,SAND-.15,GRASS-.13,0xb99160);prism(root,grassOutline,GRASS-.13,GRASS,0xbce667);
 const ringWidth=(stair.outer-stair.inner)/stair.count;
 for(let i=0;i<stair.count;i++){
  const inner=stair.inner+i*ringWidth,outer=inner+ringWidth,points=[];
  for(let j=0;j<=32;j++){const a=-Math.PI/2+j/32*Math.PI;points.push([stair.x+outer*Math.cos(a),stair.z+outer*stair.stretch*Math.sin(a)]);}
  for(let j=32;j>=0;j--){const a=-Math.PI/2+j/32*Math.PI;points.push([stair.x+inner*Math.cos(a),stair.z+inner*stair.stretch*Math.sin(a)]);}
  const h=SAND+(i+1)*(GRASS-SAND)/stair.count;prism(root,points,SAND-.03,h,0xc89d6f);prism(root,points,h-.035,h,0xf0d3a0);
  const rim=[];for(let j=0;j<=32;j++){const a=-Math.PI/2+j/32*Math.PI;rim.push([stair.x+inner*Math.cos(a),h+.012,stair.z+inner*stair.stretch*Math.sin(a)]);}tube(root,rim,.024,0xae7a50);
 }
 for(let i=0;i<grassOutline.length;i++){
  const a=grassOutline[i],b=grassOutline[(i+1)%grassOutline.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len>28)continue;
  for(let d=0;d<len;d+=.58){const t=d/len,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
   ellipsoid(root,x,GRASS-.015,z,.39,.14,.32,(Math.floor(d*5)+i)%3?0x8fc64d:0xa6d858);
   if(i<8&&i>3){const zz=z+.06;box(root,x,SAND+.71,zz,.15,1.30,.11,0x9a774c);}
  }
 }
 for(let i=0;i<16;i++){
  const x=14+random()*8,z=-14+random()*3;ellipsoid(root,x,GRASS-.15,z,2.5+random()*2,.7+random()*1.3,2.2+random()*1.2,[0x73b362,0x8fc567,0xb1d974][i%3]);
 }
 const upperFlowers=flowers(root,{x:16,z:6.8,w:9,d:10},50,642);upperFlowers.position.y=GRASS;
 for(const flower of [...upperFlowers.children])if(!inside(grassOutline,flower.position.x,flower.position.z))upperFlowers.remove(flower);
 for(let i=0;i<7;i++){const b=bush(root,12+i*2.15,-8.4-i%2,1.0);b.position.y=GRASS;}
 for(let i=0;i<34;i++){
  const x=11.1+i*.35,z=-.7-Math.sin(i*.23)*.9;const points=[[x-.32,z-.37],[x+.32,z-.33],[x+.37,z+.22],[x-.23,z+.34]];
  prism(root,points,GRASS+.005,GRASS+.055,[0xc6bd98,0xd9caa5,0xbcb79b][i%3]);
 }
 const pier=group(root);pier.name='solid-stone-pier';for(const section of pierSections)slabPath(pier,section,random);
 // A low snow-capped coast, visible beyond the left harbour in the source.
 const distant=group(root,-79,0,-35);distant.rotation.y=.2;
 for(let i=0;i<7;i++){
  const x=i*5.3,h=3.7+(i%3)*1.7,z=-Math.sin(i)*3;
  ellipsoid(distant,x,-.3,z,9,1.2,4.2,0x80ab7d);
  const geometry=new THREE.ConeGeometry(5.4,h,5,1);geometry.translate(x,h/2,z);const mountain=new THREE.Mesh(geometry,mat([0x8facb6,0x799fac,0xa8c4c8][i%3]));distant.add(mountain);
  cone(distant,x,h*.83,z,2.4,h*.39,0xe9f0e9,5);
 }
 const cloudMaterial=new THREE.MeshBasicMaterial({color:0xf6fbef});
 for(const [x,y,z,scale] of [[-46,4,-48,.95],[-14,3,-57,.8],[28,4,-56,1.05]]){
  const cloud=group(root,x,y,z);cloud.scale.setScalar(scale);
  for(let i=0;i<5;i++){const puff=ellipsoid(cloud,(i-2)*1.3,(i%2)*.6,0,1.8,1.0+(i%2)*.6,1.0,cloudMaterial);puff.castShadow=false;}
 }
 // Broad steps descend from the masonry to the moored submarine, with matching collision heights.
 for(let i=0;i<5;i++){
  const x1=-10.04-i*.9,x0=x1-.9,top=PIER-(i+1)*.25;
  prism(root,[[x0,1.4],[x1,1.4],[x1,3.2],[x0,3.2]],-1.12,top,0x8aa5b0,true);
  prism(root,[[x0+.015,1.43],[x1-.015,1.43],[x1-.015,3.17],[x0+.015,3.17]],top-.10,top,0xe1e2cb,true);
 }
 buildLighthouse(root,dynamic,flags);
 makeGuard(root,-.25,-5.72);makeGuard(root,-4.69,-5.93);
 const crates=group(root);crates.name='stacked-wood-crates';
 for(let i=0;i<4;i++){const x=2.85+i*1.35;makeCrate(crates,x,SAND,-5.56+(i%2)*.09,(i%2?1:-1)*.065,random);if(i<3)makeCrate(crates,x+.06,SAND+1.13,-5.50,(i-1)*.07,random);}
 for(const [x,z,turn] of [[2.1,-4.19,-.12],[3.83,-4.12,.09],[5.2,-4.17,-.04],[6.65,-4.14,.15],[8.1,-5.05,-.06]])makeCrate(crates,x,SAND,z,turn,random);
 // Fishing mats and rods run along the near stone edge, as in the old quay.
 for(let i=0;i<7;i++){
  const x=-1.72+i*1.63,z=8.00;
  const matBase=cyl(root,x,PIER+.035,z,.50,.50,.07,0x5e7840,28);cyl(root,x,PIER+.085,z,.44,.44,.035,0xa5df5e,28);cyl(root,x,PIER+.109,z,.28,.28,.018,0x74ca42,24);
  ellipsoid(root,x,PIER+.22,z,.13,.13,.13,0xe95d47);const leaf=ellipsoid(root,x+.06,PIER+.37,z,.08,.04,.035,0x3d9942);leaf.rotation.z=.5;
  beam(root,[x-.62,PIER+.13,z-.57],[x+.65,PIER+.15,z+.50],.031,0x9f693d);
  tube(root,[[x+.63,PIER+.15,z+.48],[x+.86,PIER+.01,z+.87],[x+.94,SEA+.12,z+1.3]],.011,0x657766);
 }
 const {sub,prop}=makeSubmarine(root,dynamic);
 for(let i=0;i<11;i++){
  const t=i/10,x=-10.07-2.2*t,z=1.4-1.85*t,y=1.20-.35*t-Math.sin(t*Math.PI);
  const link=torus(root,x,y,z,.115,.035,0x7494ac);link.rotation.set(i%2?Math.PI/2:.1,.7,1.3);
 }
 const foamMaterial=new THREE.MeshBasicMaterial({color:0xaad9e3,transparent:true,opacity:.50,side:THREE.DoubleSide,depthWrite:false});
 for(let i=0;i<34;i++){
  let x=-37+random()*73,z=-27+random()*58;if(inside(sandOutline,x,z)||onPier(x,z)){x=-18-random()*20;}
  const length=1.1+random()*4.5,points=[];for(let j=0;j<11;j++)points.push([(j/10-.5)*length,0,Math.sin(j/10*Math.PI*2)*.16]);
  const wave=tube(root,points,.024+random()*.018,foamMaterial);wave.position.set(x,SEA+.07,z);wave.rotation.y=(random()-.5)*.65;wave.castShadow=false;foam.push({mesh:wave,baseY:SEA+.07,phase:random()*6});dynamic.push(wave);
 }
 // The original near water contains branching lime-green floating seaweed.
 const kelp=group(root,-6,0,-1.5);kelp.name='近岸漂浮海藻';
 for(let n=0;n<17;n++){
  const x=-1+n*.54,z=12+(n%4)*1.14,pts=[];
  for(let k=0;k<7;k++){const t=k/6;pts.push([x+Math.sin(t*5+n)*.3,z+t*(2.6+(n%3)*.7)]);}
  const ribbon=[];
  for(let k=0;k<pts.length;k++){const [xx,zz]=pts[k];ribbon.push([xx+.08+Math.sin(k*1.7)*.10,zz]);}
  for(let k=pts.length-1;k>=0;k--){const [xx,zz]=pts[k];ribbon.push([xx-.09,zz]);}
  flat(kelp,ribbon,n%3?0xa9d744:0x8dca45,SEA+.11);
  for(let k=1;k<6;k++){const [xx,zz]=pts[k],side=k%2?1:-1;flat(kelp,[[xx,zz],[xx+side*.7,zz-.24],[xx+side*.5,zz+.19],[xx+side*.20,zz+.3]],0x9ed43b,SEA+.115);}
 }
 const ripples=[];for(let i=0;i<3;i++){const ring=torus(root,-13.58,SEA+.04+i*.012,-1.8,2.7+i*.35,.025,foamMaterial);ring.rotation.x=-Math.PI/2;ring.scale.y=.85;ripples.push(ring);dynamic.push(ring);}
 const updates=[t=>{
  for(let i=0;i<seaPositions.count;i++){const x=seaBase[i*3],y=seaBase[i*3+1];seaPositions.setZ(i,Math.sin(x*.30+t*.85)*.033+Math.cos(y*.38+t*.67+x*.11)*.028);}seaPositions.needsUpdate=true;
  sub.position.y=SEA+.37+Math.sin(t*1.15)*.075;sub.rotation.z=Math.sin(t*.83)*.017;prop.rotation.z=t*.6;
  flags.forEach(({mesh,base,sign})=>{const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const y=base[i*3+1],hang=(1.05-y)/2.1;p.setZ(i,base[i*3+2]+Math.sin(base[i*3]*4+y*2-t*2.2+sign)*.11*hang);}p.needsUpdate=true;mesh.geometry.computeVertexNormals();});
  foam.forEach(({mesh,baseY,phase},i)=>{mesh.position.y=baseY+Math.sin(t*.85+phase)*.02;mesh.scale.x=1+Math.sin(t*.48+phase)*.055;});
  ripples.forEach((r,i)=>{r.scale.x=1+Math.sin(t*.75+i)*.04;r.scale.y=.85+Math.sin(t*.75+i)*.035;});
 }];
 return {
  root,spawn:[3,SAND+.05,3],bounds:{minX:-14.5,maxX:14.7,minZ:-7,maxZ:9.0},
  colliders:[{x:-6.8,z:-1.15,rx:3.13,rz:3.13},{x:5.03,z:-4.9,rx:3.9,rz:1.40},{x:-.25,z:-5.72,rx:.93,rz:.93},{x:-4.69,z:-5.93,rx:.93,rz:.93}],
  walkable:(x,z)=>inside(sandOutline,x,z)||onPier(x,z)||waterStep(x,z)!==null,
  heightAt,updates,dynamic,
  camera:{target:[0,4.1,0],position:[7,22,34],span:26,perspectivePosition:[8,15,23],perspectiveTarget:[0,4.5,.8]},
 };
}
