import * as THREE from 'three';
import {group,box,ellipsoid,cyl,torus,beam,arch,label,mat,stroke} from '../scene-kit.js';
import {fullFacades} from './town-geometry.js';

// The blue hall is a swept building: its walls, roof, cornice and balcony share
// one plan curve. Small façade pieces follow that curve's local tangent.
const TOP=.72, HALF=3.85, DEPTH=1.92;
const C={wall:0xe4d5b0,blue:0x5795ba,blueEdge:0x377492,timber:0xc3944f,
  gold:0xe0ab47,cream:0xead9b8,stone:0xb1b2a3,glass:0x89becb,dark:0x795933};
// A 63 degree annular sector, not a bent rectangular box. Every structural
// surface is concentric, including the inner wall and the roof's rear eaves.
const ARC={x:-7.50,z:-11.15,radius:7,turn:-.20};
const angle=u=>u/ARC.radius+ARC.turn;
const center=u=>[ARC.x+ARC.radius*Math.sin(angle(u)),ARC.z+ARC.radius*Math.cos(angle(u))];
const slope=u=>-Math.tan(angle(u));
function point(u,v,y=0){const a=angle(u),r=ARC.radius+v;return [ARC.x+r*Math.sin(a),y,ARC.z+r*Math.cos(a)];}
let grainTexture;
const woodMaterials=new Map();
function wood(color){
  if(woodMaterials.has(color))return woodMaterials.get(color);
  if(!grainTexture){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#fffef8';ctx.fillRect(0,0,512,128);
    for(let i=0;i<46;i++){const yy=i*2.83;ctx.strokeStyle=i%4?'rgba(108,63,23,.14)':'rgba(90,49,18,.26)';ctx.lineWidth=i%3?.8:1.5;ctx.beginPath();for(let x=0;x<=512;x+=8){const y=yy+Math.sin(x*.023+i*1.7)*1.8+Math.sin(x*.008+i)*2.2;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
    for(const [x,y] of [[115,44],[371,95]])for(let r=0;r<5;r++){ctx.strokeStyle='rgba(91,49,20,.20)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,8+r*5,1.5+r*1.45,.015,0,Math.PI*2);ctx.stroke();}
    grainTexture=new THREE.CanvasTexture(canvas);grainTexture.colorSpace=THREE.SRGBColorSpace;grainTexture.wrapS=grainTexture.wrapT=THREE.RepeatWrapping;grainTexture.anisotropy=8;
  }
  const material=new THREE.MeshStandardMaterial({color,map:grainTexture,roughness:.86,bumpMap:grainTexture,bumpScale:.016});woodMaterials.set(color,material);return material;
}
function mesh(p,g,c){const m=new THREE.Mesh(g,Array.isArray(c)||(c?.isMaterial||Array.isArray(c))?c:mat(c));m.castShadow=m.receiveShadow=true;p.add(m);return m;}
function tube(p,pts,r,c){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(a=>new THREE.Vector3(...a))),Math.max(32,pts.length*3),r,8,false),c);}
function ribbon(p,u0,u1,v,y,r,c){const pts=[];for(let i=0;i<=40;i++)pts.push(point(u0+(u1-u0)*i/40,v,y));return tube(p,pts,r,c);}
function sweep(p,u0,u1,section,color){
  const positions=[],indices=[],uvs=[],n=64,k=section.length;
  for(let i=0;i<=n;i++){const u=u0+(u1-u0)*i/n;for(const [v,y] of section){positions.push(...point(u,v,y));uvs.push(i/n*3.3,y/.50);}}
  for(let i=0;i<n;i++)for(let j=0;j<k;j++){const a=i*k+j,b=i*k+(j+1)%k,c=b+k,d=a+k;indices.push(a,b,d,b,c,d);}
  for(let j=1;j<k-1;j++){indices.push(0,j+1,j);const a=n*k;indices.push(a,a+j,a+j+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.computeVertexNormals();
  const material=(color?.isMaterial?color:mat(color)).clone();material.side=THREE.DoubleSide;return mesh(p,geo,material);
}
function sweptBox(p,u0,u1,v0,v1,y0,y1,c){return sweep(p,u0,u1,[[v0,y0],[v1,y0],[v1,y1],[v0,y1]],c);}
function facade(p,u,v=DEPTH){const a=point(u,v),g=group(p,...a);g.rotation.y=-Math.atan(slope(u));return g;}
function roundWindow(p,x,y,z,r=.44){ellipsoid(p,x,y,z,r,r,.065,C.glass);torus(p,x,y,z+.055,r,.070,C.timber);box(p,x,y,z+.11,r*1.80,.068,.065,C.dark);box(p,x,y,z+.11,.068,r*1.80,.065,C.dark);}
function archedDoor(p,x,y,z,w,h){arch(p,x,y,z,w+.33,h+.18,.12,C.stone);arch(p,x,y+.06,z+.13,w,h,.07,0xb38a49);for(let i=-2;i<=2;i++)box(p,x+i*w*.16,y+h*.42,z+.215,.025,h*.73,.025,0x886438);for(const side of [-1,1])ellipsoid(p,x+side*.18,y+h*.40,z+.255,.059,.075,.033,C.gold);}
function shield(p,x,y,z,w,h){const s=new THREE.Shape();s.moveTo(-w*.50,h*.29);s.lineTo(-w*.30,h*.42);s.lineTo(0,h*.23);s.lineTo(w*.32,h*.43);s.lineTo(w*.5,h*.30);s.lineTo(w*.40,-h*.26);s.quadraticCurveTo(0,-h*.57,-w*.40,-h*.26);s.closePath();const m=mesh(p,new THREE.ExtrudeGeometry(s,{depth:.12,bevelEnabled:true,bevelSize:.04,bevelThickness:.025,bevelSegments:1}),0xc8c4a6);m.position.set(x,y,z);const inner=mesh(p,new THREE.ShapeGeometry(s),0x656a78);inner.position.set(x,y,z+.16);inner.scale.set(.85,.80,1);}
function roofHall(p){
  const hw=2.30,roofy=v=>4.23+1.11*Math.pow(Math.max(0,1-Math.abs(v)/hw),.76);
  const section=[[-hw,4.10]];for(let j=0;j<=48;j++){const v=-hw+j*2*hw/48;section.push([v,roofy(v)]);}section.push([hw,4.10]);
  sweep(p,-HALF-.25,HALF+.23,section,C.blue);
  // Scalloped blue ceramic strips are actual curved mesh tiles, including their
  // bowed course edges; no rectangular extrusion bridges the plan curve.
  const pos=[],colors=[],edges=[],base=new THREE.Color(C.blue),rows=5,cols=15;
  function tri(a,b,c,shade){for(const q of [a,b,c]){pos.push(...q);colors.push(base.r*shade,base.g*shade,base.b*shade);}}
  for(const side of [-1,1])for(let row=rows-1;row>=0;row--)for(let col=-1;col<cols;col++){
    const a=Math.max(-HALF-.25,-HALF-.25+(col+(row%2)*.5)*(2*HALF+.48)/cols),b=Math.min(HALF+.23,-HALF-.25+(col+1+(row%2)*.5)*(2*HALF+.48)/cols);if(b-a<.015)continue;
    const inner=row*hw/rows,outer=Math.min(hw,(row+1.1)*hw/rows),outline=[];
    const pt=(u,v)=>point(u,side*v,roofy(v)+.027+(rows-row)*.007);
    outline.push(pt(a,inner),pt(b,inner),pt(b,outer-.06));
    for(let j=1;j<=8;j++){const t=j/8;outline.push(pt(b-(b-a)*t,Math.min(hw,outer-.06+.06*Math.sin(t*Math.PI))));}
    const mid=pt((a+b)/2,(inner+outer)/2),shade=[.98,1.08,.94,1.02,1.12][(col+row*3+21)%5];
    for(let j=0;j<outline.length;j++)tri(mid,outline[j],outline[(j+1)%outline.length],shade);
    for(let j=1;j<outline.length;j++){const v=outline[j],w=outline[(j+1)%outline.length];edges.push(v[0],v[1]+.008,v[2],w[0],w[1]+.008,w[2]);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const material=mat(0xffffff).clone();material.vertexColors=true;material.side=THREE.DoubleSide;mesh(p,geo,material);
  const seamGeo=new THREE.BufferGeometry();seamGeo.setAttribute('position',new THREE.Float32BufferAttribute(edges,3));const seams=new THREE.LineSegments(seamGeo,new THREE.LineBasicMaterial({color:0x2b668b,transparent:true,opacity:.64}));seams.userData.outline=true;p.add(seams);
  for(const v of [-hw,0,hw])ribbon(p,-HALF-.25,HALF+.23,v,roofy(v)+.09,.075,v?0x437ea0:0x74a4bf);
  for(const u of [-HALF-.25,HALF+.23]){const pts=[];for(let j=0;j<=32;j++){const v=-hw+j*hw/16;pts.push(point(u,v,roofy(v)+.025));}tube(p,pts,.10,0x749bae);}
}
function contains(poly,x,z){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function edgeDistance(poly,x,z){let best=Infinity;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));best=Math.min(best,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}return best;}
function perimeter(u0,u1,depth){const a=[],b=[];for(let i=0;i<=32;i++){const u=u0+(u1-u0)*i/32,p=point(u,depth),q=point(u,-depth);a.push([p[0],p[2]]);b.unshift([q[0],q[2]]);}return [...a,...b];}

export function createChurchPolice(root){
  const hall=group(root,0,TOP,0);hall.name='弧形蓝顶警署';
  sweptBox(hall,-HALF,HALF,-DEPTH,DEPTH,.04,4.24,0xb99660);
  // Real horizontal boards on both circular elevations: narrow recessed seams,
  // readable grain and knots, instead of an untextured cream masonry wall.
  const plankColors=[0xe0c391,0xd7b781,0xe2c99d,0xd2b17b,0xdec18e,0xd7bb8b,0xe3cba0,0xd9ba85];
  for(let row=0;row<8;row++)for(const side of [-1,1]){
    const y0=.10+row*.50,y1=y0+.463,v0=side*DEPTH,v1=side*(DEPTH+.075);
    sweptBox(hall,-HALF+.035,HALF-.035,Math.min(v0,v1),Math.max(v0,v1),y0,y1,wood(plankColors[row]));
  }
  // The balcony is a framed wooden deck with radial deck boards and joists.
  for(let i=0;i<20;i++){const u=-3.30+i*.305;sweptBox(hall,u,u+.286,1.93,2.34,2.47,2.56,wood(i%3?0xcda363:0xdcb273));}
  for(const u of [-3.10,-1.7,-.25,1.2,2.5]){const f=facade(hall,u,DEPTH+.10);box(f,0,2.18,.18,.18,.53,.52,wood(0xae7c3e));beam(f,[0,1.79,.03],[0,2.37,.47],.07,wood(0xb98541));}

  for(const [v0,v1,y0,y1,c] of [[-1.97,1.97,.13,.35,0xc0b8a2],[-1.98,1.98,2.38,2.54,0xb79661],[-1.97,1.97,4.04,4.23,0xb89c6d]])sweptBox(hall,-HALF-.04,HALF+.04,v0,v1,y0,y1,c);
  roofHall(hall);
  // Curve the balcony floor and two gold rails with the front wall.
  sweptBox(hall,-3.30,2.66,1.88,2.23,2.35,2.52,0xc49e64);
  for(const y of [2.80,3.32])ribbon(hall,-3.30,2.72,2.25,y,.061,C.gold);
  for(let i=0;i<=8;i++){
    const u=-3.24+i*.72,g=facade(hall,u,2.29);
    const profile=[[.14,0],[.15,.06],[.09,.10],[.075,.24],[.13,.34],[.15,.42],[.115,.50],[.075,.56],[.09,.69],[.14,.72],[.14,.78]].map(p=>new THREE.Vector2(...p));
    const baluster=mesh(g,new THREE.LatheGeometry(profile,18),0xe0ad4e);baluster.position.y=2.55;
    ellipsoid(g,0,3.43,0,.15,.20,.15,0xf0c26b);cyl(g,0,2.57,0,.17,.17,.13,0xbd8f41,16);
    for(const y of [2.67,3.22]){const ring=torus(g,0,y,0,.105,.025,0xf4cc6b);ring.rotation.x=Math.PI/2;}
  }
  for(const u of [-3.72,-1.50,.62,3.70]){const f=facade(hall,u);box(f,0,2.22,.10,.20,3.97,.24,wood(0xbb8d49));for(const y of [.27,2.52,4.10])ellipsoid(f,0,y,.24,.040,.040,.020,0x78582c);}
  for(const u of [-2.65,-.20,2.60]){const f=facade(hall,u);roundWindow(f,0,3.50,.05,.40);}
  // Left MOLE entrance and the curved bulletin-board bay.
  const entrance=facade(hall,-2.90,2.04);archedDoor(entrance,0,.06,0,1.25,1.92);shield(entrance,0,2.13,.16,1.22,.82);
  label(entrance,'MOLE',0,2.02,.36,1.07,.34,{color:'#e4e3dc',bg:'transparent',border:'transparent',fontSize:83});
  for(const side of [-1,1])for(let row=0;row<6;row++)box(entrance,side*.76,.32+row*.31,.10,.29,.25,.28,[0xc6c9b8,0xb0b6ad,0xd4d5c3][row%3]);
  const foot=cyl(entrance,0,.075,.13,.90,.98,.15,0xc8c5b0,40);foot.scale.z=.51;
  const board=facade(hall,.05,2.055);box(board,0,1.24,.04,2.96,.94,.16,0x458e42);box(board,0,1.24,.15,2.69,.70,.07,0x4b6560);
  label(board,'MOLY REPORT',-.39,1.37,.21,1.77,.35,{color:'#cdd0bb',bg:'transparent',border:'transparent',fontSize:70});
  for(const [x,y,w,h] of [[.73,1.20,.35,.51],[1.15,1.19,.20,.53],[-.30,1.05,.48,.22]]){box(board,x,y,.216,w,h,.025,0xd9dccd);for(let j=0;j<3;j++)box(board,x,y+(j-1)*.085,.233,w*.70,.015,.012,0x959f99);}
  for(const [x,y,c] of [[-1.14,1.04,0x7dc2d4],[-.96,.95,0xe6b743],[-1.14,1.30,0xecd989]])ellipsoid(board,x,y,.25,.12,.15,.045,c);
  // Roof dormer. Its blue arch and wooden round window belong to the wall's tangent.
  const dormer=facade(hall,.30,2.06);arch(dormer,0,3.37,0,1.70,1.72,.43,0xbe9557);
  roundWindow(dormer,0,4.08,.50,.38);
  const archPoints=[];for(let i=0;i<=24;i++){const a=Math.PI-i*Math.PI/24;archPoints.push([Math.cos(a)*1.05,4.47+Math.sin(a)*.61,.26]);}tube(dormer,archPoints,.22,0x437da3);
  const topPoints=[];for(let i=0;i<=24;i++){const a=Math.PI-i*Math.PI/24;topPoints.push([Math.cos(a)*1.12,4.49+Math.sin(a)*.69,.20]);}tube(dormer,topPoints,.073,0x73a6be);
  label(dormer,'MOLY',0,4.64,.56,1.37,.48,{color:'#f8d47c',bg:'#b88747',border:'#dcaf59',fontSize:97});
  // Rear and end elevations stay physical and readable while orbiting.
  for(const u of [-2.60,0,2.60]){const f=facade(hall,u,-DEPTH-.025);f.rotation.y+=Math.PI;for(const y of [1.12,2.87])roundWindow(f,0,y,.03,.37);}
  for(const u of [-HALF,HALF]){const p=point(u,0),f=group(hall,...p);f.rotation.y=(u<0?-Math.PI/2:Math.PI/2)-Math.atan(slope(u));for(const v of [-.98,.98]){arch(f,v,1.05,.02,.75,1.46,.11,0xc4ae7e);arch(f,v,1.13,.14,.56,1.23,.04,0x79aab6);box(f,v,1.72,.20,.045,1.11,.03,0x8c784f);}}
  // The steep orange entry is a second, turned bay, as in the source.
  const lobby=group(root,-3.94,TOP,-3.60);lobby.rotation.y=.04;lobby.name='转向广场的高入口';
  box(lobby,0,2.16,0,2.31,4.28,2.85,0x93aeb7);fullFacades(lobby,0,0,2.31,2.85,4.28,{color:0x9daead,glass:0x9bc4cc});
  // The source has a shallow, tall front peak, not a deep mustard gable.
  // A blue-gray closed rear cap finishes the real roof, while the gold arch is
  // a narrow sculpted fascia around the visible blue-gray / cream infill.
  const peak=new THREE.Shape();peak.moveTo(-1.30,4.19);peak.bezierCurveTo(-.57,4.40,-.32,5.15,-.12,6.17);peak.lineTo(.12,6.17);peak.bezierCurveTo(.32,5.15,.57,4.40,1.30,4.19);peak.closePath();
  const peakMesh=mesh(lobby,new THREE.ExtrudeGeometry(peak,{depth:.62,bevelEnabled:false,curveSegments:28}),[mat(0x93aeb7),mat(0xa8884e)]);peakMesh.position.z=.96;
  const roofRear=new THREE.BufferGeometry();roofRear.setAttribute('position',new THREE.Float32BufferAttribute([
    -1.18,4.22,-1.46, 1.18,4.22,-1.46, 0,4.88,-1.46,
    -1.18,4.22,-1.46, 0,4.88,-1.46, 0,5.22,.96, -1.18,4.22,-1.46, 0,5.22,.96, -1.30,4.22,.96,
    1.18,4.22,-1.46, 1.30,4.22,.96, 0,5.22,.96, 1.18,4.22,-1.46, 0,5.22,.96, 0,4.88,-1.46,
    -1.30,4.22,.96, 0,5.22,.96, 1.30,4.22,.96
  ],3));roofRear.computeVertexNormals();const rearMaterial=mat(0x91a7af).clone();rearMaterial.side=THREE.DoubleSide;mesh(lobby,roofRear,rearMaterial);
  // The upper window must be in front of the roof end-cap, otherwise the
  // previous cream roof triangle hides every gray panel and inner mullion.
  const win=new THREE.Shape();win.moveTo(-.81,3.28);win.lineTo(.81,3.28);win.lineTo(.81,4.27);win.quadraticCurveTo(.31,4.71,0,5.86);win.quadraticCurveTo(-.31,4.71,-.81,4.27);win.closePath();
  const wg=mesh(lobby,new THREE.ExtrudeGeometry(win,{depth:.055,bevelEnabled:false}),0xb2cbd1);wg.position.z=1.605;
  for(const side of [-1,1]){
    tube(lobby,[[side*1.28,4.22,1.66],[side*.71,4.62,1.66],[side*.34,5.36,1.66],[side*.12,6.17,1.66]],.135,0xdcaa4c);
    tube(lobby,[[side*1.20,4.25,1.75],[side*.64,4.64,1.75],[side*.28,5.37,1.75],[side*.075,6.13,1.75]],.052,0xf3ca69);
  }
  box(lobby,0,6.16,1.32,.29,.12,.80,0xd3a24a);
  beam(lobby,[0,4.20,1.69],[0,5.90,1.69],.065,0xf0ead1);beam(lobby,[0,3.30,1.69],[0,4.20,1.69],.048,0x82663f);beam(lobby,[-.81,4.18,1.69],[.81,4.18,1.69],.060,0xe7dfc6);
  for(const side of [-1,1])beam(lobby,[side*.78,3.35,1.69],[0,4.18,1.69],.050,0x82663f);
  box(lobby,0,1.71,1.47,1.60,2.59,.18,0xb78c43);box(lobby,0,1.72,1.586,1.36,2.35,.042,0xb9dcdc);
  for(const x of [-.67,-.23,.23,.67])box(lobby,x,1.72,1.627,.065,2.43,.068,0x865f32);
  for(const y of [.61,1.19,1.78,2.35,2.90])box(lobby,0,y,1.632,1.48,.075,.076,0x865f32);
  box(lobby,0,3.10,1.57,1.91,.23,.39,0xd7d9be);
  ellipsoid(lobby,0,4.04,1.82,.66,.43,.095,0xffd446);ellipsoid(lobby,-.23,4.13,1.91,.31,.21,.035,0x7ccacb);ellipsoid(lobby,.26,4.16,1.91,.31,.16,.035,0x7fc745);ellipsoid(lobby,0,3.74,1.91,.20,.12,.055,0xd59732);
  // Three shallow, rounded doorstep treads (separate from the plaza terrace).
  for(let i=0;i<3;i++){const r=1.20-i*.15,step=cyl(lobby,0,.075+i*.14,1.51,r,r+.035,.15,0xcfc7ae,48);step.scale.z=.67;}
  // Stair at the right end of the bowed balcony, with curled gold handrails.
  const stair=facade(hall,2.74,2.20);stair.name='阳台外楼梯';
  for(let i=0;i<9;i++){const h=(i+1)*.262;box(stair,0,h/2,3.06-i*.36,1.37,h,.38,i%2?0xe7d1ad:0xf0dab5);box(stair,0,h+.025,3.08-i*.36,1.48,.075,.42,0xb89163);}
  for(const side of [-1,1]){
    const points=[[side*.80,.45,3.30],[side*.79,.84,3.17],[side*.77,1.18,2.65],[side*.78,2.53,.48],[side*.77,3.38,-.06]];
    tube(stair,points,.105,0xc9933d);for(const [y,z] of [[.84,3.14],[1.56,2.19],[2.59,.54]]){cyl(stair,side*.79,y-.18,z,.077,.10,.66,0xd49d3f,10);ellipsoid(stair,side*.79,y+.19,z,.16,.16,.16,0xedbd61);}
  }
  // Accurate footprint veto complements the scene's circle/rectangle colliders.
  const hallFootprint=perimeter(-HALF-.08,HALF+.08,DEPTH+.12);
  lobby.updateMatrix();stair.updateMatrixWorld(true);
  const lobbyInv=new THREE.Matrix4().copy(lobby.matrix).invert(),stairInv=new THREE.Matrix4().copy(stair.matrixWorld).invert();
  const v=new THREE.Vector3();
  const cameraColliders=[-2.90,-.97,.97,2.90].map(u=>{const [x,z]=center(u);return {x,z,rx:1.15,rz:2.18,baseY:TOP,height:5.48,walkBlock:false};});
  cameraColliders.push({x:-3.94,z:-3.60,rx:1.33,rz:1.61,baseY:TOP,height:6.36,walkBlock:false});
  return {root:hall,lobby,footprint:hallFootprint,colliders:cameraColliders,heightAt(x,z){
    v.set(x,TOP,z).applyMatrix4(lobbyInv);
    for(let i=2;i>=0;i--){const r=1.20-i*.15;if((v.x/r)**2+((v.z-1.51)/(r*.67))**2<=1)return TOP+.15+i*.14;}
    return .05;
  },walkable(x,z){
    if(contains(hallFootprint,x,z)||edgeDistance(hallFootprint,x,z)<.28)return false;
    v.set(x,TOP,z).applyMatrix4(lobbyInv);if(Math.abs(v.x)<1.28&&v.z> -1.53&&v.z<1.59)return false;
    // The balcony stairs lead to a decorative upper doorway; block the stair
    // body so the avatar cannot clip through it from below or either side.
    v.set(x,TOP,z).applyMatrix4(stairInv);return !(Math.abs(v.x)<.88&&v.z>-.20&&v.z<3.35);
  }};
}

// The mobile scene owns these reusable resources only until it is left.
export function clearPoliceCaches(release){
 woodMaterials.forEach(release);woodMaterials.clear();
 if(grainTexture)release(grainTexture);grainTexture=undefined;
}
