import * as THREE from 'three';
import {group,box,cyl,beam,arch,ellipsoid,torus,mat} from '../scene-kit.js';

function mesh(p,geometry,material){const o=new THREE.Mesh(geometry,Array.isArray(material)||material?.isMaterial?material:mat(material));o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function tube(p,points,r,color){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),Math.max(32,points.length*3),r,8,false),color);}

// Closed curved roof with individually scalloped ceramic courses. The rounded
// lower edges are geometry, so the pink/teal/blue tile silhouette survives orbit.
const tileSeamMaterial=new THREE.LineBasicMaterial({color:0x705e55,transparent:true,opacity:.68});
export function bowedRoof(p,x,y,z,w,h,d,color,trim=0xd4c6a0){
 const g=group(p,x,y,z), profile=u=>h*Math.pow(Math.max(0,1-Math.abs(u)*2/w),1.18);
 const shape=new THREE.Shape();shape.moveTo(-w/2,-.13);
 for(let i=0;i<=48;i++){const xx=-w/2+i*w/48;shape.lineTo(xx,profile(xx));}
 shape.lineTo(w/2,-.13);shape.closePath();
 const body=mesh(g,new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,curveSegments:24}),[mat(0xe5debf),mat(color)]);body.position.z=-d/2;
 const vertices=[],colors=[],seams=[],base=new THREE.Color(color);
 function triangle(a,b,c,shade){for(const point of [a,b,c]){vertices.push(...point);colors.push(base.r*shade,base.g*shade,base.b*shade);}}
 const rows=Math.max(4,Math.round(Math.hypot(w/2,h)/.62)),cols=Math.max(4,Math.round(d/.74)),course=w/2/rows;
 // Build from eaves toward ridge; every upper course covers the course below it.
 for(const side of [-1,1])for(let row=rows-1;row>=0;row--)for(let col=-1;col<cols;col++){
  const inner=row*course,outer=Math.min(w/2,(row+1.19)*course);
  const za=Math.max(-d/2,-d/2+(col+(row%2)*.5)*d/cols),zb=Math.min(d/2,-d/2+(col+1+(row%2)*.5)*d/cols);
  if(zb-za<.025)continue;
  const lift=.035+(rows-row)*.006,point=(u,zz)=>[side*u,profile(u)+lift,zz];
  const outline=[point(inner,za),point(inner,zb),point(Math.max(inner,outer-course*.24),zb)];
  for(let i=1;i<=10;i++){const t=i/10;outline.push(point(Math.min(w/2,outer-course*.24+Math.sin(t*Math.PI)*course*.24),zb-(zb-za)*t));}
  const center=point((inner+outer)*.5,(za+zb)*.5),shade=[1.05,.93,1.0,.97,1.10][(row*7+col+31)%5];
  for(let i=0;i<outline.length;i++)triangle(center,outline[i],outline[(i+1)%outline.length],shade);
  // The source's brown-blue outlines are drawn only at exposed tile edges.
  for(let i=1;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];seams.push(a[0],a[1]+.008,a[2],b[0],b[1]+.008,b[2]);}
 }
 const tileGeo=new THREE.BufferGeometry();tileGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));tileGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));tileGeo.computeVertexNormals();
 const tileMaterial=mat(0xffffff).clone();tileMaterial.vertexColors=true;tileMaterial.side=THREE.DoubleSide;mesh(g,tileGeo,tileMaterial);
 const seamGeo=new THREE.BufferGeometry();seamGeo.setAttribute('position',new THREE.Float32BufferAttribute(seams,3));const seamMesh=new THREE.LineSegments(seamGeo,tileSeamMaterial);seamMesh.userData.outline=true;g.add(seamMesh);
 for(const zz of [-d/2-.035,d/2+.035]){const pts=[];for(let i=0;i<=32;i++){const xx=-w/2+i*w/32;pts.push([xx,profile(xx)+.075,zz]);}tube(g,pts,.105,trim);}
 beam(g,[0,h+.09,-d/2-.09],[0,h+.09,d/2+.09],.125,trim);
 for(const side of [-1,1])beam(g,[side*w/2,.012,-d/2-.10],[side*w/2,.012,d/2+.10],.095,trim);
 return g;
}

// Chest lid runs across the long axis, leaving curved end caps visible in 360°.
export function treasureLid(p,x,y,z,w,h,d){
 const g=group(p,x,y,z),shape=new THREE.Shape();shape.moveTo(-d/2,0);
 for(let i=0;i<=40;i++){const a=Math.PI-i*Math.PI/40;shape.lineTo(Math.cos(a)*d/2,Math.sin(a)*h);}shape.closePath();
 const lid=mesh(g,new THREE.ExtrudeGeometry(shape,{depth:w,bevelEnabled:false}),0xb65842);lid.rotation.y=Math.PI/2;lid.position.x=-w/2;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#b95844';ctx.fillRect(0,0,512,512);
 for(let row=-1;row<9;row++)for(let col=-1;col<9;col++){const xx=col*64+(row%2)*32,yy=row*60;ctx.fillStyle=(row+col)%3?'#bd6049':'#cd6c52';ctx.strokeStyle='#8e4036';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+64,yy);ctx.bezierCurveTo(xx+67,yy+69,xx-4,yy+69,xx,yy);ctx.fill();ctx.stroke();}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1.45,1.2);
 const positions=[],uv=[],indices=[],nx=16,na=40;for(let i=0;i<=nx;i++)for(let j=0;j<=na;j++){const a=j*Math.PI/na;positions.push(-w/2+i*w/nx,Math.sin(a)*h+.018,Math.cos(a)*(d/2+.018));uv.push(i/nx,j/na);if(i<nx&&j<na){const k=i*(na+1)+j;indices.push(k,k+1,k+na+2,k,k+na+2,k+na+1);}}
 const tiles=new THREE.BufferGeometry();tiles.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));tiles.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));tiles.setIndex(indices);tiles.computeVertexNormals();mesh(g,tiles,Object.assign(mat(0xffffff).clone(),{map:texture,side:THREE.DoubleSide}));
 // Large golden rim and bands, with inset red wood and brass studs.
 for(const xx of [-w/2-.025,-w*.16,w*.20,w/2+.025]){
  const pts=[];for(let i=0;i<=32;i++){const a=Math.PI-i*Math.PI/32;pts.push([xx,Math.sin(a)*h+.04,Math.cos(a)*d/2]);}tube(g,pts,.14,0xd4a356);
  for(const zz of [-d/2,d/2])ellipsoid(g,xx,.10,zz,.18,.16,.12,0xe2be6a);
 }
 for(const zz of [-d/2-.03,d/2+.03])beam(g,[-w/2,.02,zz],[w/2,.02,zz],.14,0xd8ae61);
 // End-cap battens and small iron hinges survive rear and side inspection.
 for(const side of [-1,1]){for(const dz of [-.8,0,.8])beam(g,[side*(w/2+.035),.04,dz],[side*(w/2+.035),h*Math.sqrt(1-(dz/(d/2))**2)-.14,dz],.065,0x915331);}
 for(const xx of [-w*.30,w*.30])box(g,xx,-.08,-d/2-.08,.40,.42,.17,0xa77a38);
 return g;
}

export function fullFacades(p,cx,cz,w,d,h,{color=0xbfc1ac,glass=0x8fbec6,stone=false}={}){
 // Wrap foundations, cornices, timber beams, windows and sills around all sides.
 for(const yy of [.22,h-.18]){
  box(p,cx,yy,cz,w+.10,.20,d+.10,color);
 }
 for(const [px,pz,yaw,span] of [[cx,cz-d/2-.025,Math.PI,w],[cx-w/2-.025,cz,-Math.PI/2,d],[cx+w/2+.025,cz,Math.PI/2,d]]){
  const f=group(p,px,0,pz);f.rotation.y=yaw;
  for(const k of [-1,1]){
   const xx=k*span*.26;arch(f,xx,h*.27,0,.84,h*.43,.09,color);arch(f,xx,h*.27+.08,.10,.63,h*.43-.17,.045,glass);
   box(f,xx,h*.48,.167,.045,h*.33,.045,0x756844);box(f,xx,h*.48,.17,.62,.05,.045,0x756844);
   box(f,xx,h*.27-.015,.16,.98,.13,.27,color);
   if(stone){for(let i=0;i<4;i++)box(f,xx-.53,h*.29+i*.32,.015,.20,.23,.14,i%2?0xd7d7c8:0xc0c4ba);}
  }
  for(const xx of [-span*.48,span*.48])box(f,xx,h/2,.03,.16,h,.16,color);
 }
}

export function turnBlock(root,start,cx,cz,yaw){
 const objects=root.children.slice(start),pivot=group(root,cx,0,cz);pivot.updateMatrixWorld();
 for(const o of objects)pivot.attach(o);pivot.rotation.y=yaw;return pivot;
}

export function stoneCourses(p,cx,cz,r,h,rows=5,baseRadius=r,topRadius=r){
 const count=Math.max(8,Math.round(r*3.6)),palette=[0xe5e8dd,0xd9dfd7,0xeeeade,0xe0e5dc,0xd5dcd5];
 for(let row=0;row<rows;row++)for(let i=0;i<count;i++){
  const span=Math.PI*2/count,a=i*span+(row%2)*span/2;
  const rb=baseRadius+(topRadius-baseRadius)*row/rows,rt=baseRadius+(topRadius-baseRadius)*(row+1)/rows;
  const geo=new THREE.CylinderGeometry(rt,rb,h/rows-.045,4,1,true,a+.010,span-.020);
  const block=mesh(p,geo,palette[(i+row*3)%palette.length]);block.position.set(cx,(row+.5)*h/rows,cz);
 }
}

const signTextures=new Map();
const signOutlines={
 rescue:[[.02,.60],[.09,.40],[.23,.20],[.39,.04],[.53,.04],[.69,.20],[.83,.39],[.96,.60],[.99,.83],[.91,.98],[.75,.82],[.59,.72],[.41,.69],[.27,.72],[.05,.94],[.01,.79]],
 mole:[[.01,.27],[.49,.01],[.69,.12],[.99,.23],[.94,.60],[.84,.85],[.57,.98],[.28,.88],[.12,.67]],
 book:[[.06,.04],[.30,.10],[.56,.24],[.70,.22],[.92,.41],[.99,.73],[.84,.98],[.61,.98],[.45,.84],[.10,.83],[.01,.70],[.01,.29]],
 food:[[.04,.12],[.16,.01],[.27,.12],[.49,.16],[.66,.22],[.85,.24],[.98,.39],[.95,.83],[.84,.90],[.74,.99],[.57,.91],[.44,.99],[.29,.88],[.15,.89],[.01,.79]],
 ice:[[.15,.15],[.33,.03],[.56,.07],[.67,.01],[.88,.12],[.97,.31],[.91,.55],[.99,.66],[.96,.84],[.80,.98],[.65,.91],[.44,.99],[.29,.85],[.10,.85],[.01,.66],[.06,.42]],
 bank:[[.02,.23],[.11,.02],[.22,.11],[.31,.23],[.39,.23],[.47,.18],[.55,.27],[.63,.27],[.75,.29],[.82,.23],[.87,.34],[.99,.82],[.96,.99],[.82,.88],[.74,.82],[.66,.94],[.57,.87],[.50,.82],[.44,.89],[.32,.83],[.27,.78],[.19,.82],[.06,.64],[.01,.52]],
 gifts:[[.12,.01],[.54,.20],[.99,.19],[.86,.50],[.94,.76],[.59,.81],[.22,.99],[.01,.76],[.07,.50],[.07,.27]],
 dress:[[.14,.04],[.29,.01],[.46,.18],[.63,.12],[.74,.15],[.84,.14],[.95,.28],[.99,.52],[.92,.69],[.96,.81],[.86,.89],[.79,.85],[.70,.93],[.58,.91],[.50,.91],[.38,.99],[.22,.99],[.09,.91],[.01,.78],[.02,.54],[.07,.44],[.05,.23]],
 pets:[[.01,.27],[.25,.14],[.54,.04],[.76,.01],[.95,.19],[.99,.48],[.85,.65],[.63,.71],[.51,.94],[.28,.99],[.15,.76]],
 new:[[.06,.18],[.41,.02],[.78,.20],[.96,.48],[.84,.78],[.45,.99],[.15,.77],[.01,.43]]};
export function referenceSign(p,url,x,y,z,w,h,{depth=.12,border=0xcda250,tilt=0}={}){
 const g=group(p,x,y,z);g.rotation.z=tilt;
 // A physical backing stops a sign becoming a one-sided floating decal.
 const shape=new THREE.Shape(),key=url.split('town-')[1]?.split('.')[0],points=signOutlines[key]||[[0,0],[1,0],[1,1],[0,1]];points.forEach(([u,v],i)=>i?shape.lineTo((u-.5)*w,(.5-v)*h):shape.moveTo((u-.5)*w,(.5-v)*h));shape.closePath();
 const backing=mesh(g,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.03,bevelThickness:.025,bevelSegments:2}),border);backing.position.z=-depth;
 if(!signTextures.has(url)){const texture=new THREE.TextureLoader().load(url);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;signTextures.set(url,texture);}
 const front=mesh(g,new THREE.PlaneGeometry(w,h),Object.assign(mat(0xffffff).clone(),{map:signTextures.get(url),transparent:true,alphaTest:.05,side:THREE.FrontSide}));front.position.z=.035;
 return g;
}

export function landmarkLamp(p,x,z,s=1){
 const g=group(p,x,0,z);g.scale.setScalar(s);
 cyl(g,0,.15,0,.23,.32,.28,0xd2a641,18);cyl(g,0,.40,0,.13,.17,.32,0xe7b84d,18);
 tube(g,[[0,.48,0],[.08,1.32,0],[.02,2.17,0],[-.12,3.19,0]],.087,0xa9b7b4);
 for(const sy of [.62,2.84]){const o=torus(g,sy===.62?.01:-.11,sy,0,.17,.044,0xe2b944);o.rotation.x=Math.PI/2;}
 const head=group(g,-.12,3.22,0);ellipsoid(head,0,.22,0,.40,.57,.40,0x75c1d0);
 for(let i=0;i<6;i++){const a=i*Math.PI/3;tube(head,[[Math.cos(a)*.21,-.28,Math.sin(a)*.21],[Math.cos(a)*.47,.27,Math.sin(a)*.47],[Math.cos(a)*.32,.76,Math.sin(a)*.32]],.045,0xd6ab40);}
 const skirt=mesh(head,new THREE.CylinderGeometry(.28,.60,.35,24),0xe4bf43);skirt.position.y=.78;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;tube(head,[[Math.cos(a)*.57,.62,Math.sin(a)*.57],[Math.cos(a)*.28,1.01,Math.sin(a)*.28],[0,1.38,0]],.036,0xffdc65);}
 const cap=mesh(head,new THREE.ConeGeometry(.39,.70,24),0xd6ab36);cap.position.y=1.08;
 ellipsoid(head,0,1.49,0,.17,.19,.17,0xd85e64);
 for(const k of [-1,1]){const ornament=torus(head,k*.18,-.34,0,.11,.035,0xd6a338);ornament.scale.y=.7;}
 return g;
}

// The mobile scene owns these reusable resources only until it is left.
export function clearTownCaches(release){
 signTextures.forEach(release);signTextures.clear();
}
