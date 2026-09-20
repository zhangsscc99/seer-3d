import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Every texture, material and geometry belongs to this visit. Nothing is kept
// in a module cache when the garden is evicted by the mobile scene manager.
export function createHomeGardenScene(){
  const root=new THREE.Group();root.name='摩尔家园花园';
  const mats=new Map(),geos=new Map();let seed=5426;
  const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  const mat=(color,options={})=>{const key=String(color)+'|'+Object.entries(options).map(([k,v])=>k+':'+(v&&v.uuid?v.uuid:String(v))).join('|');if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:.86,...options}));return mats.get(key);};
  const geo=(key,make)=>{if(!geos.has(key))geos.set(key,make());return geos.get(key);};
  const group=(p,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
  const put=(p,g,c,x=0,y=0,z=0)=>{const m=new THREE.Mesh(g,c&&c.isMaterial?c:mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m;};
  const box=(p,x,y,z,w,h,d,c,round=false)=>{const m=put(p,geo(round?'roundbox':'box',()=>round?new RoundedBoxGeometry(1,1,1,1,.055):new THREE.BoxGeometry(1,1,1)),c,x,y,z);m.scale.set(w,h,d);return m;};
  const ball=(p,x,y,z,rx,ry,rz,c)=>{const m=put(p,geo('sphere',()=>new THREE.SphereGeometry(1,12,8)),c,x,y,z);m.scale.set(rx,ry,rz);return m;};
  const cyl=(p,x,y,z,rt,rb,h,c,n=24)=>put(p,geo(`cyl${rt},${rb},${h},${n}`,()=>new THREE.CylinderGeometry(rt,rb,h,n)),c,x,y,z);
  const beam=(p,a,b,r,c)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av),m=put(p,geo('beam',()=>new THREE.CylinderGeometry(1,1,1,8)),c);m.position.copy(av.add(bv).multiplyScalar(.5));m.scale.set(r,d.length(),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;};
  const tube=(p,points,r,c,n=28)=>put(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),n,r,5,false),c);
  const ring=(p,x,y,z,r,t,c,ground=false)=>{const m=put(p,geo(`ring${r},${t}`,()=>new THREE.TorusGeometry(r,t,6,40)),c,x,y,z);if(ground)m.rotation.x=-Math.PI/2;return m;};
  const shape=points=>{const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return s;};
  const extrude=(p,s,depth,c,x=0,y=0,z=0,bevel=0)=>put(p,new THREE.ExtrudeGeometry(s,{depth,curveSegments:14,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1}),c,x,y,z);
  function rounded(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
  function slab(p,x,y,z,w,d,h,r,c){const m=extrude(p,rounded(w,d,r),h,c,x,y,z);m.rotation.x=-Math.PI/2;return m;}
  function heartShape(s=1){const h=new THREE.Shape();h.moveTo(0,-.52*s);h.bezierCurveTo(-1.05*s,.04*s,-.63*s,.98*s,0,.46*s);h.bezierCurveTo(.63*s,.98*s,1.05*s,.04*s,0,-.52*s);h.closePath();return h;}
  function heart(p,x,y,z,s,depth,c){return extrude(p,heartShape(s),depth,c,x,y,z,.012);}
  function heartLoop(p,x,y,z,s,c,r=.03){const ps=heartShape(s).getPoints(28).map(v=>[x+v.x,y+v.y,z]);ps.push(ps[0]);return tube(p,ps,r,c,36);}
  function archShape(w,h){const r=w/2,s=new THREE.Shape();s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI,false);s.closePath();return s;}
  function archRing(p,x,y,z,w,h,thick,d,c){const r=w/2,inner=r-thick,spring=h-r,s=new THREE.Shape();s.moveTo(-r,0);s.lineTo(-r,spring);s.absarc(0,spring,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(inner,0);s.lineTo(inner,spring);s.absarc(0,spring,inner,0,Math.PI,false);s.lineTo(-inner,0);s.closePath();return extrude(p,s,d,c,x,y,z,.035);}
  function scroll(p,cx,cy,cz,r,c,turns=1.3,flip=1){const points=[];for(let i=0;i<=42;i++){const t=i/42,a=t*Math.PI*2*turns,rr=r*(1-.91*t);points.push([cx+Math.cos(a)*rr*flip,cy+Math.sin(a)*rr,cz]);}return tube(p,points,.035,c,42);}
  const ivory=mat(0xece7d4),stoneShade=mat(0xbdb9aa),stoneLine=mat(0x99988b),cream=mat(0xf5dda0),gold=mat(0xefb928,{roughness:.50,metalness:.14}),goldLight=mat(0xffdf62,{roughness:.52}),goldShade=mat(0xbb8222),orange=mat(0xd48631),orangeShade=mat(0xa15b27),redOrange=mat(0xd56832),purpleDark=mat(0x672887),pink=mat(0xf0b5be),green=mat(0x71b740),leaf=mat(0x40a24b),darkLeaf=mat(0x267b48),soil=mat(0xb68a50),soilDark=mat(0x8f6339),soilLight=mat(0xcfaa69);

  // Rounded grey-beige cobbles match the cool irregular garden paving.
  const pavingCanvas=document.createElement('canvas');pavingCanvas.width=pavingCanvas.height=512;const pc=pavingCanvas.getContext('2d');pc.fillStyle='#babbb0';pc.fillRect(0,0,512,512);
  const sites=[],spacing=512/6;for(let row=0;row<6;row++)for(let col=0;col<6;col++)sites.push([(col+.5+(rand()-.5)*.58)*spacing,(row+.5+(rand()-.5)*.62)*spacing]);
  const copies=[];for(const s of sites)for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)copies.push([s[0]+x*512,s[1]+y*512]);
  function clip(poly,nx,ny,c){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=a[0]*nx+a[1]*ny-c,db=b[0]*nx+b[1]*ny-c;if(da<=0)out.push(a);if((da<0)!==(db<0)){const t=da/(da-db);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;}
  sites.forEach(([x,y],index)=>{let poly=[[x-180,y-180],[x+180,y-180],[x+180,y+180],[x-180,y+180]];for(const [px,py]of copies){if(Math.hypot(px-x,py-y)<.01||Math.hypot(px-x,py-y)>250)continue;poly=clip(poly,px-x,py-y,(px*px+py*py-x*x-y*y)/2);}poly=poly.map(([px,py])=>[x+(px-x)*.95,y+(py-y)*.95]);for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){pc.save();pc.translate(xx*512,yy*512);pc.beginPath();poly.forEach((p,i)=>{const prev=poly[(i+poly.length-1)%poly.length],next=poly[(i+1)%poly.length],a=[p[0]+(prev[0]-p[0])*.31,p[1]+(prev[1]-p[1])*.31],b=[p[0]+(next[0]-p[0])*.31,p[1]+(next[1]-p[1])*.31];if(i)pc.lineTo(...a);else pc.moveTo(...a);pc.quadraticCurveTo(...p,...b);});pc.closePath();pc.fillStyle=['#e1dfd1','#d4d4c8','#cecec8','#e5dfca','#d8d6c8','#c7c9c3'][index%6];pc.fill();pc.strokeStyle='#efecdb';pc.lineWidth=1.3;pc.stroke();pc.restore();}});
  const paving=new THREE.CanvasTexture(pavingCanvas);paving.colorSpace=THREE.SRGBColorSpace;paving.wrapS=paving.wrapT=THREE.RepeatWrapping;paving.repeat.set(3.25,2.25);paving.anisotropy=4;
  const ground=put(root,new THREE.PlaneGeometry(35,25),mat(0xffffff,{map:paving,bumpMap:paving,bumpScale:.018}),0,.006,1.2);ground.rotation.x=-Math.PI/2;ground.castShadow=false;ground.name='Grey beige rounded garden cobblestones';
  const lawn=put(root,new THREE.PlaneGeometry(46,16),green,0,-.01,-11.8);lawn.rotation.x=-Math.PI/2;lawn.castShadow=false;
  for(const side of [-1,1]){const m=put(root,new THREE.PlaneGeometry(12,38),green,side*19,-.01,0);m.rotation.x=-Math.PI/2;m.castShadow=false;}
  const rear=[];for(let i=0;i<=40;i++){const x=-15+i*.75,z=-4.85+.15*Math.sin(x*.38)+2.30*Math.exp(-Math.pow((x-8.0)/3.75,2));rear.push([x,z]);const c=box(root,x,.13,z,.70,.23,.34,i%4===0?stoneShade:ivory);c.rotation.y=.08*Math.cos(x*.4);}
  // A shallow back lawn covers only the flower/house strip, leaving sky visible.
  const lawnFront=shape([...rear.map(([x,z])=>[x,-z]),[15,13],[-15,13]]),frontGrass=put(root,new THREE.ShapeGeometry(lawnFront),green,0,.015,0);frontGrass.rotation.x=-Math.PI/2;frontGrass.castShadow=false;
  function bush(p,x,y,z,s=1){for(const [dx,dy,dz,r,c]of [[0,0,0,.83,darkLeaf],[-.53,.02,.03,.54,leaf],[.48,.07,.03,.57,green],[0,.45,.01,.60,leaf]])ball(p,x+dx*s,y+dy*s,z+dz*s,r*s,r*.79*s,r*.76*s,c);}
  for(let i=0;i<17;i++){const x=-19+i*2.4,z=-12.0-(i%3)*.45;ball(root,x,.72,z,1.48,.67,.81,darkLeaf);bush(root,x,1.14+.13*Math.sin(i*2.4),z,1.12+(i%3)*.11);}
  for(const [x,z,rx,ry,rz,c]of [[-25,-19,10,2.1,6,0x91ad98],[-12,-19,7,2.4,5,0x91ad98],[0,-22,9,2.8,5,0x86a49d],[13,-19,8,2.3,5,0x93b093],[25,-19,10,2.2,6,0x93b093]])ball(root,x,-.3,z,rx,ry,rz,c);
  for(const [x,y,z,s]of [[-8.4,4.90,-13.6,1.0],[-1.8,5.48,-15.4,.83],[3.1,5.07,-15.1,.58],[13.5,4.80,-13.8,.80]])for(const [xx,yy,rr]of [[-1.15,0,.75],[0,.30,1.12],[1.13,.10,.80],[-.4,.65,.83]]){const c=ball(root,x+xx*s,y+yy*s,z,rr*s,rr*.55*s,rr*.55*s,0xffffff);c.castShadow=false;}
  for(const [x,z,s]of [[-3.7,-13.3,.58],[.2,-13.4,.50],[3.9,-14.0,.63]]){cyl(root,x,1.1*s,z,.58*s,.65*s,2.2*s,ivory,16);const roof=put(root,new THREE.ConeGeometry(.89*s,1.65*s,6),pink,x,2.92*s,z);beam(root,[x,3.75*s,z],[x,4.50*s,z],.027,gold);}

  // White heart railings run across the back and return along the right edge.
  const fence=group(root,0,.02,-9.65);fence.name='White heart garden fence';
  function fenceRun(p,length){beam(p,[-length/2,.54,0],[length/2,.54,0],.052,ivory);beam(p,[-length/2,1.09,0],[length/2,1.09,0],.052,ivory);for(let x=-length/2;x<=length/2+.01;x+=2.4){cyl(p,x,.69,0,.075,.11,1.36,ivory,12);cyl(p,x,1.39,0,.135,.135,.10,ivory,12);const finial=put(p,new THREE.ConeGeometry(.135,.36,12),ivory,x,1.62,0);}for(let x=-length/2+.42;x<length/2-.2;x+=.63)heartLoop(p,x,.81,0,.35,ivory,.025);}
  fenceRun(fence,29);const returnFence=group(root,14.1,.02,-6.8);returnFence.rotation.y=Math.PI/2;fenceRun(returnFence,5.7);
  // Sparse blossoms remain actual small petal volumes, shared by both beds.
  const petalGeo=geo('flowerPetal',()=>new THREE.SphereGeometry(1,6,4)),petalColors=[mat(0xf4e67f),mat(0xf098ba),mat(0xe36aa7),mat(0xeaf1e6),mat(0x97b6e4),mat(0xe1b4e8)];
  function flower(p,x,y,z,s=1,color=0){beam(p,[x,y-.17*s,z],[x,y,z],.017*s,leaf);for(let i=0;i<5;i++){const a=i*Math.PI*2/5,m=put(p,petalGeo,petalColors[color%6],x+Math.cos(a)*.09*s,y,z+Math.sin(a)*.09*s);m.scale.set(.091*s,.036*s,.069*s);m.rotation.y=-a;}ball(p,x,y+.024*s,z,.042*s,.030*s,.042*s,goldLight);}
  for(let i=0;i<32;i++){const x=-13+rand()*26,z=-6.1-rand()*2.1;if(x>3.6&&x<11.2)continue;flower(root,x,.10,z,.64,i%6);}

  // Golden timber texture, with board seams and lightly wandering grain.
  const woodCanvas=document.createElement('canvas');woodCanvas.width=256;woodCanvas.height=512;const wc=woodCanvas.getContext('2d');wc.fillStyle='#d69a43';wc.fillRect(0,0,256,512);
  for(let i=0;i<48;i++){const x=i*5.7+(rand()-.5)*5;wc.beginPath();wc.moveTo(x,0);wc.bezierCurveTo(x+8,158,x-10,347,x+5,512);wc.strokeStyle=i%5?'#c18938':'#eab05a';wc.lineWidth=i%5?1:2.5;wc.stroke();}for(let x=0;x<=256;x+=64){wc.fillStyle='#a76f2e';wc.fillRect(x,0,2,512);wc.fillStyle='#edb865';wc.fillRect(x+2,0,2,512);}
  const woodTex=new THREE.CanvasTexture(woodCanvas);woodTex.colorSpace=THREE.SRGBColorSpace;woodTex.wrapS=woodTex.wrapT=THREE.RepeatWrapping;const timber=mat(0xffffff,{map:woodTex,bumpMap:woodTex,bumpScale:.024,roughness:.90});
  const house=group(root,7.1,.04,-5.65);house.rotation.y=-.68;house.name='Golden home with curved purple tiled roof';
  slab(house,0,.025,0,5.78,4.91,.17,.46,stoneShade);slab(house,0,.19,0,5.49,4.64,.08,.32,cream);
  box(house,0,2.16,0,5.20,3.94,4.40,timber,true);
  // Cream inset plaster panels have uneven hand-built borders between timbers.
  for(const side of [-1,1]){const panel=shape([[-2.39,.28],[-1.94,.26],[-1.97,.84],[-1.54,.85],[-1.55,.46],[-.93,.45],[-.93,1.3],[.95,1.3],[.95,.34],[1.34,.38],[1.32,.77],[1.87,.77],[1.87,.30],[2.38,.34],[2.34,3.56],[1.73,3.65],[1.70,3.43],[.92,3.41],[.9,3.64],[-.88,3.64],[-.89,3.42],[-1.75,3.44],[-1.77,3.66],[-2.36,3.60]]);const m=extrude(house,panel,.055,cream,0,.25,side*2.231,.03);if(side<0)m.rotation.y=Math.PI;}
  for(const x of [-2.49,2.49])box(house,x,2.1,0,.19,3.97,4.45,orangeShade,true);
  for(const z of [-2.37,2.37])for(const y of [.55,1.55,3.70])box(house,0,y,z,5.10,.12,.12,orange,true);
  for(const z of [-2.40,2.40])for(const side of [-1,1])tube(house,[[side*.91,2.56,z],[side*1.46,2.61,z],[side*2.02,2.49,z],[side*2.39,2.53,z]],.043,orangeShade,18);
  // Front door stands out through two stacked blue heart glass panes.
  const door=group(house,0,.24,2.263);extrude(door,archShape(1.64,2.92),.16,orangeShade,0,0,0,.035);extrude(door,archShape(1.39,2.78),.055,orange,0,.06,.17,.02);
  for(let i=0;i<5;i++)box(door,(i-2)*.255,1.22,.237,.018,2.17,.015,goldShade);for(const [y,s]of [[2.25,.54],[1.50,.48]]){heart(door,0,y,.255,s,.08,0xde8b87);heart(door,0,y+.015,.346,s*.78,.029,0x5d9fc4);tube(door,[[-s*.24,y+.23,.383],[-s*.08,y+.32,.387],[s*.17,y+.24,.381]],.023,0xb8e3e7,12);}
  ball(door,.47,.99,.31,.085,.09,.06,gold);for(const y of [.52,1.84])box(door,-.61,y,.257,.20,.08,.045,goldShade,true);
  const step=cyl(house,0,.22,2.63,.83,.97,.18,ivory,32);step.scale.z=.52;const doorstep=cyl(house,0,.11,2.98,.83,.96,.13,cream,32);doorstep.scale.z=.38;
  // Curving gables and roof surface. Tiles follow the surface tangent in
  // staggered courses; each tile has thickness, bevels and a shadow gap.
  const profile=[[-2.99,3.73],[-2.55,4.75],[-1.75,5.90],[-.75,6.91],[0,7.32],[.75,6.91],[1.75,5.90],[2.55,4.75],[2.99,3.73]],roofCurve=new THREE.CatmullRomCurve3(profile.map(([x,y])=>new THREE.Vector3(x,y,0)));
  const roofPts=roofCurve.getPoints(52),rp=[],ru=[],ri=[];for(let i=0;i<roofPts.length;i++){const q=roofPts[i];for(const z of [-2.61,2.61]){rp.push(q.x,q.y,z);ru.push(i/(roofPts.length-1),(z+2.61)/5.22);}if(i<roofPts.length-1){const n=i*2;ri.push(n,n+2,n+1,n+1,n+2,n+3);}}
  const roofGeo=new THREE.BufferGeometry();roofGeo.setAttribute('position',new THREE.Float32BufferAttribute(rp,3));roofGeo.setAttribute('uv',new THREE.Float32BufferAttribute(ru,2));roofGeo.setIndex(ri);roofGeo.computeVertexNormals();put(house,roofGeo,mat(0x672887,{side:THREE.DoubleSide}));
  const tileColors=[0x9136bd,0x9f42cd,0xa344cd,0x8232ac,0xad50d3,0x8c36b9].map(c=>mat(c,{roughness:.76}));
  for(let course=0;course<20;course++){const t=(course+.5)/20,center=roofCurve.getPoint(t),tangent=roofCurve.getTangent(t),len=roofCurve.getPoint(Math.min(1,t+.025)).distanceTo(roofCurve.getPoint(Math.max(0,t-.025)));for(let row=0;row<8;row++){const z=-2.30+row*.66+(course%2?.15:0);const tile=box(house,center.x,center.y+.047,z,len*.93,.095,.616,tileColors[(course*3+row)%6],true);tile.rotation.z=Math.atan2(tangent.y,tangent.x);tile.name='Individual curved purple roof tile';}}
  function gable(z,back=false){const g=group(house,0,0,z);if(back)g.rotation.y=Math.PI;const panel=shape([[-2.62,3.65],...roofPts.map(q=>[q.x*.90,q.y-.12]),[2.62,3.65]]);extrude(g,panel,.18,timber,0,0,-.08,.025);const border=roofPts.map(q=>[q.x,q.y+.05,.17]);tube(g,border,.185,cream,64);tube(g,roofPts.map(q=>[q.x*.955,q.y-.08,.26]),.041,goldShade,60);box(g,0,3.82,.16,5.49,.23,.28,orange,true);for(const x of [-2.57,2.57])box(g,x,3.82,.11,.27,.85,.34,orange,true);const o=cyl(g,0,5.68,.20,.60,.60,.20,redOrange,36);o.rotation.x=Math.PI/2;const pane=cyl(g,0,5.68,.322,.44,.44,.044,orangeShade,32);pane.rotation.x=Math.PI/2;ring(g,0,5.68,.352,.445,.040,gold);box(g,0,5.68,.374,.10,.84,.054,orange);box(g,0,5.68,.375,.84,.10,.054,orange);}
  gable(2.58);gable(-2.58,true);
  for(const x of [-2.97,2.97]){box(house,x,3.67,0,.20,.23,5.38,cream,true);for(const z of [-1.70,0,1.70]){const brace=box(house,x*.9,3.57,z,.19,.59,.18,orange,true);brace.rotation.z=x<0?-.4:.4;}}
  // Roof dormer has a rounded orange shell, recessed pane and dimensional ribs.
  const dormer=group(house,2.28,5.10,-.36);dormer.rotation.y=Math.PI/2;extrude(dormer,archShape(1.40,1.81),.57,orangeShade,0,0,-.47,.075);archRing(dormer,0,0,.08,1.44,1.84,.21,.18,redOrange);extrude(dormer,archShape(.98,1.44),.02,orangeShade,0,.13,.145);box(dormer,0,.81,.194,.09,1.28,.06,orange);box(dormer,0,.85,.195,.90,.10,.06,orange);tube(dormer,[[-.5,.21,.21],[-.5,1.11,.21],[-.31,1.46,.21],[0,1.61,.21],[.31,1.46,.21]],.045,gold,24);box(dormer,0,.05,.10,1.46,.17,.53,redOrange,true);
  // Left and rear wall windows, shutters, sills and trim are modelled as well.
  const leftWindow=group(house,-2.66,1.48,-.30);leftWindow.rotation.y=-Math.PI/2;archRing(leftWindow,0,0,0,1.68,1.88,.17,.14,orangeShade);extrude(leftWindow,archShape(1.34,1.53),.025,0x77b7cd,0,.10,.15);box(leftWindow,0,.75,.194,.08,1.28,.055,cream);box(leftWindow,0,.93,.194,1.22,.08,.055,cream);box(leftWindow,0,-.02,.21,1.88,.17,.44,cream,true);for(const side of [-1,1]){const shutter=box(leftWindow,side*1.13,.88,.05,.49,1.66,.13,timber,true);shutter.rotation.y=side*.18;for(const y of [.37,1.33])box(leftWindow,side*1.13,y,.14,.46,.07,.06,orangeShade);}
  const rearWindow=group(house,0,1.34,-2.32);rearWindow.rotation.y=Math.PI;archRing(rearWindow,0,0,0,1.80,1.91,.17,.14,orangeShade);extrude(rearWindow,archShape(1.46,1.61),.02,0x77b7cd,0,.10,.17);box(rearWindow,0,.83,.21,.085,1.43,.04,cream);box(rearWindow,0,.96,.21,1.41,.085,.04,cream);box(rearWindow,0,-.04,.20,2.0,.20,.47,cream,true);
  // Cream curved alcove and a real projecting seat with spindle railings.
  const alcove=group(house,2.68,.74,.68);alcove.rotation.y=Math.PI/2;archRing(alcove,0,.36,0,1.86,2.57,.18,.15,cream);extrude(alcove,archShape(1.51,2.13),.036,goldShade,0,.50,.17);extrude(alcove,archShape(1.39,2.05),.025,cream,0,.54,.211);for(let i=0;i<7;i++){const slat=box(alcove,0,.70+i*.235,.25,1.25,.052,.025,gold);slat.rotation.z=-.34;}
  const seat=cyl(alcove,0,.51,.58,.99,1.02,.16,cream,40);seat.scale.z=.68;const under=cyl(alcove,0,.29,.57,.68,.46,.36,timber,32);under.scale.z=.58;
  const railing=[];for(let i=0;i<=28;i++){const a=-Math.PI*.02+i/28*Math.PI*1.04;railing.push([Math.cos(a)*1.01,.99,.56+Math.sin(a)*.63]);}tube(alcove,railing,.051,cream,36);for(let i=0;i<=8;i++){const a=i/8*Math.PI;beam(alcove,[Math.cos(a)*1.01,.53,.56+Math.sin(a)*.63],[Math.cos(a)*1.01,.99,.56+Math.sin(a)*.63],.038,cream);}for(const x of [-.61,.61])beam(alcove,[x,.20,.20],[x,.48,.99],.082,orange);
  bush(root,11.47,.94,-3.43,1.15);cyl(root,11.47,.57,-3.43,.19,.27,1.13,timber,12);

  // Ornate gold wrought-iron swing, with scrollwork on both side frames and
  // rounded cushions whose pink stripes wrap the sides and rear as well.
  const swing=group(root,-.55,0,-3.0);swing.name='Golden scrollwork garden swing';
  const iron=gold,seatCream=mat(0xfff4d8),seatPink=mat(0xe89da7);
  for(const side of [-1,1]){
    const sideFrame=group(swing,side*1.72,0,0);sideFrame.rotation.y=Math.PI/2;
    tube(sideFrame,[[-.90,.04,0],[-.94,.73,0],[-.72,2.34,0],[-.20,3.35,0],[.38,3.09,0],[.70,1.30,0],[.79,.04,0]],.058,iron,44);
    scroll(sideFrame,-.83,.38,0,.28,gold,1.45);scroll(sideFrame,.75,.34,0,.26,gold,1.40,-1);scroll(sideFrame,-.20,3.18,0,.33,gold,1.35);
    for(const [x,y,r,f]of [[-.57,1.16,.33,1],[.20,1.58,.39,-1],[-.35,2.22,.31,1],[.37,.76,.26,-1]])scroll(sideFrame,x,y,0,r,iron,1.3,f);
    tube(sideFrame,[[-.80,.61,0],[-.42,1.03,0],[.08,1.34,0],[.39,1.95,0],[.08,2.56,0],[-.30,2.85,0]],.034,iron,38);
    for(const z of [-.67,.62])ball(swing,side*1.72,.105,z,.13,.085,.17,goldShade);
  }
  tube(swing,[[-1.70,2.99,-.21],[-.88,3.21,-.24],[0,3.27,-.25],[.88,3.21,-.24],[1.70,2.99,-.21]],.063,iron,36);
  beam(swing,[-1.65,2.87,-.25],[1.65,2.87,-.25],.058,iron);
  for(const side of [-1,1])for(const z of [-.37,.34]){beam(swing,[side*1.32,2.90,-.20],[side*1.32,1.00,z],.032,iron);ball(swing,side*1.32,2.87,-.20,.075,.10,.075,goldLight);}
  box(swing,0,.83,.13,2.81,.16,1.31,iron,true);box(swing,0,1.05,.20,2.74,.34,1.22,seatCream,true);const back=group(swing,0,1.63,-.33);back.rotation.x=-.14;box(back,0,0,0,2.76,.99,.33,seatCream,true);
  for(let i=0;i<6;i++){const x=(i-2.5)*.46;box(swing,x,1.228,.18,.08,.018,1.16,seatPink,true);box(swing,x,1.061,.819,.08,.32,.023,seatPink,true);box(back,x,0,.178,.08,.96,.021,seatPink,true);box(back,x,0,-.178,.08,.96,.021,seatPink,true);}
  for(const y of [1.24,1.95]){const bolster=cyl(swing,0,y,y>1.5?-.27:.27,.155,.155,2.71,seatCream,24);bolster.rotation.z=Math.PI/2;for(let i=0;i<6;i++){const t=ring(swing,(i-2.5)*.46,y,y>1.5?-.27:.27,.159,.018,seatPink);t.rotation.y=Math.PI/2;}}
  for(const side of [-1,1])tube(swing,[[side*1.46,.92,.58],[side*1.46,1.42,.53],[side*1.46,1.49,-.08],[side*1.46,1.09,-.48]],.041,iron,22);

  // Brick-orange charcoal tray: recessed coals, raised lip, slender metal legs
  // and two small wheels. The tray is open rather than a solid painted box.
  const barbecue=group(root,3.05,0,-2.55);barbecue.name='Orange charcoal barbecue on fine metal legs';
  const metal=mat(0x648681,{roughness:.43,metalness:.36});box(barbecue,0,1.08,0,1.92,.22,1.42,orangeShade,true);for(const x of [-.94,.94])box(barbecue,x,1.37,0,.18,.46,1.62,redOrange,true);for(const z of [-.72,.72])box(barbecue,0,1.37,z,1.98,.46,.18,redOrange,true);for(const x of [-.98,.98])box(barbecue,x,1.63,0,.20,.10,1.80,orange,true);for(const z of [-.81,.81])box(barbecue,0,1.63,z,2.15,.10,.19,orange,true);box(barbecue,0,1.24,0,1.72,.09,1.25,soilDark);
  for(let i=0;i<11;i++){const coal=ball(barbecue,-.63+(i%4)*.41,1.40+rand()*.055,-.37+Math.floor(i/4)*.34,.21,.15,.19,i%3?soilDark:soil);coal.rotation.y=rand()*3;}
  for(const x of [-.72,.72])for(const z of [-.50,.50]){beam(barbecue,[x,1.10,z],[x*1.33,.13,z*1.40],.041,metal);ball(barbecue,x*1.33,.09,z*1.40,.07,.065,.07,ivory);}beam(barbecue,[-.91,.35,-.67],[.91,.35,-.67],.030,metal);for(const x of [-.92,.92]){const wheel=cyl(barbecue,x,.16,.65,.13,.13,.055,stoneShade,16);wheel.rotation.x=Math.PI/2;const hub=cyl(barbecue,x,.16,.687,.079,.079,.019,ivory,16);hub.rotation.x=Math.PI/2;}

  // Pale stone arch, fluted columns and volute capitals at the left entrance.
  const arch=group(root,-10.5,0,-6.0);arch.rotation.y=.025;arch.name='White stone garden entrance arch';archRing(arch,0,.06,-.37,6.05,7.40,.46,.73,ivory);archRing(arch,0,.10,.40,5.40,7.04,.095,.065,stoneShade);
  for(const x of [-2.78,2.78]){cyl(arch,x,.16,0,.47,.55,.30,ivory,24);cyl(arch,x,.39,0,.38,.47,.18,stoneShade,24);cyl(arch,x,2.79,0,.31,.37,4.72,ivory,24);for(const a of [-1.15,0,1.15]){tube(arch,[[x+Math.sin(a)*.30,.56,Math.cos(a)*.29],[x+Math.sin(a)*.27,2.90,Math.cos(a)*.29],[x+Math.sin(a)*.25,4.96,Math.cos(a)*.26]],.024,stoneShade,16);}cyl(arch,x,5.20,0,.45,.32,.18,ivory,24);for(const side of [-1,1])scroll(arch,x+side*.17,5.18,.39,.27,stoneShade,1.36,side);}
  const sign=group(root,-10.3,0,-3.75);sign.name='Gold scrollwork home sign without a user name';tube(sign,[[0,.03,0],[-.11,1.20,-.03],[.04,2.30,0],[0,3.05,0]],.25,timber,20);for(const side of [-1,1])beam(sign,[0,.43,0],[side*.50,.04,.13],.12,timber);
  box(sign,0,2.72,.09,3.35,2.11,.31,orangeShade,true);box(sign,0,2.71,.275,2.94,1.71,.16,gold,true);box(sign,0,2.67,.374,2.61,1.27,.029,cream,true);
  for(const side of [-1,1]){scroll(sign,side*1.63,3.55,.36,.34,gold,1.40,side);scroll(sign,side*1.63,2.31,.37,.31,gold,1.3,-side);tube(sign,[[side*1.63,3.56,.34],[side*1.76,3.12,.35],[side*1.60,2.73,.35],[side*1.69,2.27,.35]],.12,gold,24);}
  const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=128;const lc=labelCanvas.getContext('2d');lc.font='700 65px "PingFang SC",sans-serif';lc.textAlign='center';lc.textBaseline='middle';lc.fillStyle='#684620';lc.fillText('摩尔家园',256,67);const labelTex=new THREE.CanvasTexture(labelCanvas);labelTex.colorSpace=THREE.SRGBColorSpace;const labelMat=mat(0xffffff,{map:labelTex,transparent:true,alphaTest:.05});const label=put(sign,new THREE.PlaneGeometry(2.76,.69),labelMat,0,3.36,.443);label.castShadow=false;
  for(const [x,z]of [[-.74,0],[.65,.07]]){box(sign,x,2.48,.43,.56,.51,.021,goldShade);const roof=extrude(sign,shape([[-.38,0],[0,.29],[.38,0]]),.015,orange,x,2.78,.43);box(sign,x,2.43,.45,.14,.29,.02,cream);}const medallion=cyl(sign,0,1.85,.36,.37,.37,.13,redOrange,28);medallion.rotation.x=Math.PI/2;const star=[];for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.15:.30;star.push([Math.cos(a)*r,Math.sin(a)*r]);}extrude(sign,shape(star),.05,gold,0,1.85,.45,.01);
  // The small silver mascot rests its paws on the sign, with curled ears,
  // yellow-gold ear ornaments and a rounded muzzle visible from every side.
  const signMascot=group(sign,0,3.83,.08);signMascot.name='Silver grey animal above garden sign';
  const silver=mat(0xc8cbc8,{roughness:.62}),silverLight=mat(0xe4e4dc,{roughness:.64}),silverShade=mat(0x929c9a,{roughness:.70});
  ball(signMascot,0,.21,-.12,.36,.29,.29,silver);ball(signMascot,0,.51,.09,.43,.37,.32,silverLight);
  for(const side of [-1,1]){
    const ear=ball(signMascot,side*.46,.65,.015,.28,.15,.15,silver);ear.rotation.z=side*.50;
    const earInset=ball(signMascot,side*.48,.665,.142,.18,.073,.029,silverShade);earInset.rotation.z=side*.50;
    tube(signMascot,[[side*.25,.73,-.04],[side*.41,.85,-.04],[side*.42,1.02,.02],[side*.30,1.10,.07]],.048,silverLight,18);
    ball(signMascot,side*.31,.46,.366,.061,.078,.035,silverShade);ball(signMascot,side*.32,.485,.395,.022,.026,.012,ivory);
    const ornament=ball(signMascot,side*.31,.68,.32,.15,.069,.033,goldLight);ornament.rotation.z=side*.37;
    const paw=ball(signMascot,side*.24,.05,.27,.13,.12,.19,silverLight);paw.rotation.y=side*.14;
    tube(signMascot,[[side*.23,-.012,.405],[side*.24,.042,.441],[side*.25,.092,.408]],.013,silverShade,8);
  }
  ball(signMascot,0,.33,.341,.30,.23,.105,silver);ball(signMascot,0,.43,.437,.105,.066,.039,gold);
  tube(signMascot,[[0,.37,.456],[0,.29,.454],[-.071,.25,.432]],.018,silverShade,10);tube(signMascot,[[0,.29,.454],[.071,.25,.432]],.018,silverShade,8);
  tube(signMascot,[[.19,.20,-.35],[.47,.22,-.38],[.56,.38,-.30],[.43,.44,-.25]],.079,silver,18);

  function heartPost(x,z){const g=group(root,x,0,z);cyl(g,0,.12,0,.40,.47,.23,ivory,24);cyl(g,0,.70,0,.28,.35,1.13,ivory,20);heart(g,0,.74,.285,.37,.08,stoneShade);heart(g,0,.77,.386,.29,.018,ivory);cyl(g,0,1.28,0,.38,.34,.17,ivory,24);ball(g,0,1.63,0,.34,.32,.31,ivory);scroll(g,.02,1.74,.26,.30,stoneShade,1.10);return g;}
  heartPost(-9.50,-.35);heartPost(-11.25,2.15);
  // Winged stone Ram sculpture with sculpted curls above a scalloped basin.
  const fountain=group(root,-6.4,0,-2.5);fountain.name='White sculptural fountain';cyl(fountain,0,.14,0,1.02,1.15,.26,stoneShade,40);cyl(fountain,0,.31,0,.91,1.01,.15,ivory,40);ring(fountain,0,.42,0,.87,.080,ivory,true);const water=cyl(fountain,0,.385,0,.80,.80,.045,mat(0x3bbbdc,{roughness:.28,transparent:true,opacity:.89}),40);cyl(fountain,0,.67,0,.41,.63,.55,0x66cfe7,32);ring(fountain,0,.94,0,.40,.036,ivory,true);
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const pts=[];for(let j=0;j<=12;j++){const t=j/12,r=.26+.47*t;pts.push([Math.sin(a)*r,.39+Math.sin(t*Math.PI)*.62,Math.cos(a)*r]);}tube(fountain,pts,.027,0xb7eff4,20);}
  const statue=group(fountain,0,.82,0);cyl(statue,0,.15,0,.36,.49,.25,ivory,28);ball(statue,0,.76,0,.34,.62,.29,ivory);ball(statue,.02,1.52,-.03,.46,.51,.37,ivory);ball(statue,.04,1.57,.303,.22,.27,.09,cream);scroll(statue,-.16,1.75,.33,.26,stoneShade,1.25);scroll(statue,.24,1.53,.305,.21,stoneShade,1.15,-1);tube(statue,[[-.19,1.09,.19],[-.48,.83,.34],[-.20,.59,.43],[.21,.85,.29],[.36,1.03,.12]],.14,ivory,28);for(const side of [-1,1]){const wing=extrude(statue,shape([[0,0],[side*.71,.45],[side*.88,.92],[side*.66,1.21],[side*.25,.73]]),.16,ivory,side*.23,.85,-.18,.08);for(let i=0;i<3;i++)tube(statue,[[side*.32,.99+i*.11,.02],[side*.54,1.22+i*.11,.03],[side*(.73-i*.08),1.58+i*.04,.025]],.025,stoneShade,14);}ball(statue,0,2.01,-.10,.32,.22,.29,ivory);scroll(statue,.03,2.10,.18,.23,stoneShade,1.22);

  // Two flower beds: layered round bed at front left, and the gold outline of
  // a Ram's round head with two separate leaf-shaped pools behind it.
  const flowers=group(root,-7.4,0,4.7);flowers.name='Layered circular flower bed';cyl(flowers,0,.17,0,1.66,1.76,.32,stoneShade,48);cyl(flowers,0,.39,0,1.60,1.66,.24,green,48);cyl(flowers,0,.69,0,1.08,1.20,.43,ivory,40);cyl(flowers,0,.923,0,1.03,1.08,.05,leaf,40);for(let i=0;i<32;i++){const a=i*Math.PI/16,m=box(flowers,Math.sin(a)*1.71,.17,Math.cos(a)*1.71,.14,.28,.15,ivory,true);m.rotation.y=a;}for(let i=0;i<70;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand())*.96;flower(flowers,Math.sin(a)*r,1.00+rand()*.20,Math.cos(a)*r,.70+rand()*.24,i%6);}for(let i=0;i<35;i++){const a=i*Math.PI*2/35,r=1.28+rand()*.22;flower(flowers,Math.sin(a)*r,.49+rand()*.07,Math.cos(a)*r,.72,i%4);}
  const ramBed=group(root,-3.35,0,4.6);ramBed.name='Gold edged two leaf Ram flower pool';const b0=cyl(ramBed,0,.18,.13,1.70,1.76,.32,gold,48);b0.scale.z=.73;const b1=cyl(ramBed,0,.37,.13,1.59,1.62,.12,goldLight,48);b1.scale.z=.73;const b2=cyl(ramBed,0,.415,.13,1.49,1.53,.075,leaf,48);b2.scale.z=.73;const rim=ring(ramBed,0,.43,.13,1.57,.075,gold,true);rim.scale.y=.73;
  for(const side of [-1,1]){const leafShape=new THREE.Shape();leafShape.moveTo(0,0);leafShape.bezierCurveTo(side*.59,.73,side*1.50,.78,side*1.68,.26);leafShape.bezierCurveTo(side*1.68,-.31,side*.63,-.23,0,0);const base=extrude(ramBed,leafShape,.26,gold,0,.22,-.99,.035);base.rotation.x=-Math.PI/2;const inner=extrude(ramBed,leafShape,.018,darkLeaf,side*.15,.506,-1.01);inner.rotation.x=-Math.PI/2;inner.scale.set(.77,.71,1);}
  for(let i=0;i<36;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand())*1.26;flower(ramBed,Math.sin(a)*r,.49+rand()*.02,.13+Math.cos(a)*r*.70,.62,i%5===0?1:3);}

  // Exactly six raised soil plots form the reference's L: two behind and
  // four in front. Real wavy ridges and irregular mounds have side relief.
  const vegetable=group(root,0,0,0);vegetable.name='L shaped six plot vegetable patch';
  const plotCenters=[[6.3,2.0],[9.2,2.0],[.5,5.1],[3.4,5.1],[6.3,5.1],[9.2,5.1]];
  for(const [index,[x,z]]of plotCenters.entries()){
    slab(vegetable,x,.018,z,2.64,2.75,.19,.23,soilDark);slab(vegetable,x,.22,z,2.54,2.65,.045,.20,soil);
    for(let ridge=0;ridge<7;ridge++){
      const zz=z-1.05+ridge*.34,positions=[],uv=[],indices=[];
      for(let i=0;i<=18;i++){const t=i/18,xx=x-1.14+t*2.28,wave=.048*Math.sin(t*Math.PI*9+ridge*.81);for(let j=0;j<=4;j++){const v=j/4;positions.push(xx,.242+Math.sin(v*Math.PI)*(.083+.018*Math.sin(t*14+ridge)),zz+(v-.5)*.29+wave);uv.push(t,v);if(i<18&&j<4){const n=i*5+j;indices.push(n,n+1,n+5,n+1,n+6,n+5);}}}
      const rgeo=new THREE.BufferGeometry();rgeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));rgeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));rgeo.setIndex(indices);rgeo.computeVertexNormals();put(vegetable,rgeo,soilLight);
    }
    const mound=ball(vegetable,x+[-.11,.19,.07,-.07,.13,.22][index],.42,z+.10,.28,.21,.20,index===0?0x98684f:index===5?0x9b6843:soil);mound.rotation.z=.17;
    if(index===1||index===4){for(let i=0;i<5;i++)tube(vegetable,[[x-.21+i*.10,.31,z+.17],[x-.15+i*.07,.65,z+.02],[x+.01,.69,z-.02]],.036,soilDark,14);}
  }
  const outline=[[-1.12,3.52],[4.72,3.52],[4.72,.43],[10.84,.43],[10.84,6.70],[-1.12,6.70]];
  for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(len/.49);for(let j=0;j<n;j++){const t=(j+.5)/n,m=box(vegetable,a[0]+(b[0]-a[0])*t,.28,a[1]+(b[1]-a[1])*t,len/n*.94,.28,.35,j%5===0?stoneShade:ivory,true);m.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);}}
  for(const [x,z]of outline){cyl(vegetable,x,.48,z,.19,.22,.78,stoneShade,20);cyl(vegetable,x,.88,z,.28,.27,.13,ivory,24);ball(vegetable,x,1.0,z,.265,.15,.265,ivory);}
  // Low planting at the left boundary encloses the plaza without a flat wall.
  for(const [x,z,s]of [[-13.6,5.8,1.7],[-14.0,2.5,1.55],[-14.4,-.9,1.2],[13.7,7.4,1.2]])bush(root,x,.74,z,s);

  const yaw=-.68,doorLocalZ=3.15,doorPoint=[7.1+Math.sin(yaw)*doorLocalZ,.05,-5.65+Math.cos(yaw)*doorLocalZ];
  return {
    root,spawn:[-1,.05,.15],bounds:{minX:-12.2,maxX:12.45,minZ:-8.65,maxZ:8.3},
    colliders:[
      {x:-.55,z:-3.0,rx:1.92,rz:1.05},{x:3.05,z:-2.55,rx:1.17,rz:.97},
      {x:-6.4,z:-2.5,rx:1.18,rz:1.18,kind:'ellipse'},{x:-10.3,z:-3.75,rx:1.89,rz:.55},
      {x:-9.50,z:-.35,rx:.44,rz:.44,kind:'ellipse'},{x:-11.25,z:2.15,rx:.44,rz:.44,kind:'ellipse'},
      {x:-7.4,z:4.7,rx:1.79,rz:1.79,kind:'ellipse'},{x:-3.35,z:4.6,rx:1.85,rz:1.43,kind:'ellipse'},
      {x:4.86,z:5.10,rx:5.99,rz:1.72},{x:7.80,z:1.97,rx:3.05,rz:1.58},
      {x:11.47,z:-3.43,rx:1.05,rz:.92,kind:'ellipse'},
      {x:-13.28,z:-6.0,rx:.60,rz:.56,kind:'ellipse'},{x:-7.72,z:-6.0,rx:.59,rz:.56,kind:'ellipse'},
    ],
    walkable:(x,z)=>{const dx=x-7.1,dz=z+5.65,lx=dx*Math.cos(yaw)-dz*Math.sin(yaw),lz=dx*Math.sin(yaw)+dz*Math.cos(yaw);return !(Math.abs(lx)<2.94&&Math.abs(lz)<2.70)&&!(lx>2.5&&lx<4.25&&Math.abs(lz-.68)<1.3);},
    portalLocations:{homeinside:doorPoint,farm:[-11.15,.05,4.4]},
    portalLabelOffsets:{homeinside:[0,.08,2.3]},
    camera:{perspectivePosition:[.32,13.0,19.0],perspectiveTarget:[0,1.85,-1.0],fov:36,span:27,wideZoom:.86,target:[0,1.85,-1.0],position:[0,26,33]},
    updates:[],dynamic:[],
  };
}
