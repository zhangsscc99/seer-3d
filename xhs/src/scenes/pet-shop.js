import * as THREE from 'three';
import {addPetShopPlayground} from './pet-shop-playground.js';

// A walkable greenhouse pet shop. Every cache belongs to this scene instance.
export function createPetShopScene(){
 const root=new THREE.Group();root.name='淘淘乐街 · 宠物店';
 const materials=new Map(),geometries=new Map();
 const C={frame:0x184d32,frameDark:0x153e2f,frameLight:0x467952,cream:0xfff6dc,
  floor:0xe6d294,sandEdge:0xc1a36b,green:0x80bd3d,leaf:0x498d36,leafBright:0x91c849,
  gold:0xd9af42,goldLight:0xf5d166,goldDark:0xa8812d,wood:0xb39451,woodDark:0x756039,
  bark:0x917b43,blue:0x70cee0,white:0xfffbea,pink:0xc989b6,purple:0x80556f};
 const v=a=>new THREE.Vector3(...a);
 function mat(c,opts={}){const key=String(c)+'|'+Object.keys(opts).sort().map(k=>k+':'+(opts[k]?.isTexture?opts[k].uuid:opts[k])).join('|');if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.86,...opts}));return materials.get(key);}
 function geo(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
 function group(parent=root,x=0,y=0,z=0,name=''){const g=new THREE.Group();g.position.set(x,y,z);g.name=name;parent.add(g);return g;}
 function mesh(parent,g,c,x=0,y=0,z=0){const m=new THREE.Mesh(g,c?.isMaterial?c:mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function box(p,x,y,z,w,h,d,c){const m=mesh(p,geo('box',()=>new THREE.BoxGeometry(1,1,1)),c,x,y,z);m.scale.set(w,h,d);return m;}
 function ball(p,x,y,z,rx,ry,rz,c){const m=mesh(p,geo('ball',()=>new THREE.SphereGeometry(1,14,10)),c,x,y,z);m.scale.set(rx,ry,rz);return m;}
 function cylinder(p,x,y,z,rt,rb,h,c,n=24,open=false){return mesh(p,geo(['c',rt,rb,h,n,open].join(':'),()=>new THREE.CylinderGeometry(rt,rb,h,n,1,open)),c,x,y,z);}
 function torus(p,x,y,z,r,t,c,n=48){return mesh(p,geo(['tor',r,t,n].join(':'),()=>new THREE.TorusGeometry(r,t,6,n)),c,x,y,z);}
 function beam(p,a,b,r,c,n=8){const aa=v(a),bb=v(b),dir=bb.clone().sub(aa);const m=mesh(p,geo('beam'+n,()=>new THREE.CylinderGeometry(1,1,1,n)),c);m.position.copy(aa.add(bb).multiplyScalar(.5));m.scale.set(r,dir.length(),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return m;}
 function tube(p,pts,r,c,n=24,closed=false){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v),closed),n,r,5,closed),c);}
 function shape(p,s,depth,c,x=0,y=0,z=0,bevel=0){return mesh(p,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:!!bevel,bevelSegments:2,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:24}),c,x,y,z);}
 function texture(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=2;return t;}
 function panel(p,x,y,z,w,h,t){const m=mesh(p,geo('plane:'+w+':'+h,()=>new THREE.PlaneGeometry(w,h)),mat(0xffffff,{map:t,transparent:true,depthWrite:false,side:THREE.DoubleSide}),x,y,z);m.castShadow=false;return m;}
 function leaf(p,x,y,z,size,color,rz=0){const m=ball(p,x,y,z,size*.33,size,size*.12,color);m.rotation.z=rz;return m;}
 function flatShape(p,s,depth,color,x=0,y=0,z=0){const m=shape(p,s,depth,color,x,y,z);m.rotation.x=-Math.PI/2;return m;}
 function floorOutline(){const s=new THREE.Shape();s.moveTo(-11.72,7.82);s.lineTo(11.72,7.82);s.quadraticCurveTo(12.25,7.82,12.25,7.3);s.lineTo(12.25,-5.75);s.quadraticCurveTo(12.25,-8.15,9.85,-8.15);s.lineTo(-9.85,-8.15);s.quadraticCurveTo(-12.25,-8.15,-12.25,-5.75);s.lineTo(-12.25,7.3);s.quadraticCurveTo(-12.25,7.82,-11.72,7.82);return s;}

 // Broad warm cream sand, without a grid or invented paving pattern.
 const floorTex=texture(256,256,(c,w,h)=>{c.fillStyle='#e6d294';c.fillRect(0,0,w,h);let n=47;for(let i=0;i<900;i++){n=(n*1664525+1013904223)>>>0;const x=(n&65535)/65536*w;n=(n*1664525+1013904223)>>>0;const y=(n&65535)/65536*h;c.fillStyle=i%2?'rgba(174,148,88,.033)':'rgba(255,247,204,.08)';c.fillRect(x,y,1+i%3,1);}});floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(.16,.16);
 const floor=flatShape(root,floorOutline(),.28,C.sandEdge,0,-.255,0);floor.name='米黄色细砂地面厚底';
 const floorTop=mesh(root,new THREE.ShapeGeometry(floorOutline(),24),mat(0xffffff,{map:floorTex,roughness:.99}),0,.027,0);floorTop.rotation.x=-Math.PI/2;floorTop.castShadow=false;

 // Greenhouse walls: genuine panes, paired mullions and diagonal white reflections.
 const glass=mat(0xb8ded7,{transparent:true,opacity:.34,roughness:.17,metalness:.04,depthWrite:false,side:THREE.DoubleSide});
 const reflected=mat(0xffffff,{transparent:true,opacity:.70,roughness:.32,depthWrite:false,side:THREE.DoubleSide});
 function pane(p,x,y,z,w,h,variant=0){
  const g=group(p,x,y,z);const m=mesh(g,geo('pane:'+w+':'+h,()=>new THREE.PlaneGeometry(w,h)),glass);m.castShadow=m.receiveShadow=false;
  // The diagonal polygons are kept within each individual pane.
  const sh=new THREE.Shape();const q=w*.23;sh.moveTo(-w/2,-h/2);sh.lineTo(-w/2+q,-h/2);sh.lineTo(w/2,h/2-h*.22);sh.lineTo(w/2,h/2);sh.lineTo(w/2-q,h/2);sh.lineTo(-w/2,-h/2+h*.25);sh.closePath();const ref=mesh(g,new THREE.ShapeGeometry(sh),reflected,0,0,.018);ref.castShadow=ref.receiveShadow=false;
  if(variant%2===0){const s=new THREE.Shape();s.moveTo(-w*.08,-h/2);s.lineTo(w*.08,-h/2);s.lineTo(w/2,h*.15);s.lineTo(w/2,h*.43);s.closePath();const rr=mesh(g,new THREE.ShapeGeometry(s),reflected,0,0,.020);rr.castShadow=rr.receiveShadow=false;}
  return g;
 }
 const rear=group(root,0,0,-7.68,'墨绿温室玻璃后墙');
 for(const y of [.16,5.57,10.40])box(rear,0,y,0,24.05,.19,.20,C.frameDark);
 for(const x of [-12,-9,-6,-3,3,6,9,12]){box(rear,x,5.25,0,.21,10.5,.26,C.frameDark);box(rear,x+.09,5.25,.16,.048,10.32,.040,C.frameLight);}
 for(let i=0;i<8;i++){const x=-10.5+i*3;if(Math.abs(x)>3)pane(rear,x,2.88,.035,2.78,5.13,i);pane(rear,x,7.98,.035,2.78,4.66,i+1);}
 for(const side of [-1,1]){
  const wall=group(root,side*12.03,0,0,side<0?'左侧温室玻璃与外部木框':'右侧温室玻璃与外部木框');wall.rotation.y=Math.PI/2;
  for(const z of [-7.67,-4.64,-1.61,1.42,4.45,7.36]){const h=z>4?6.7:z>1?8.2:10.42;box(wall,-z,h/2,0,.19,h,.23,C.frameDark);box(wall,-z+.07,h/2,.14,.035,h-.14,.032,C.frameLight);}
  for(let i=0;i<5;i++){const x=6.155-i*3.03,h=i===4?6.45:i===3?7.7:10.10;pane(wall,x,2.66,.025,2.84,4.9,i);if(h>5.6)pane(wall,x,(h+5.57)/2,.025,2.84,h-5.74,i+1);box(wall,x,.14,0,3.03,.22,.25,C.frameDark);box(wall,x,5.37,0,3.03,.19,.24,C.frameDark);box(wall,x,h+.10,0,3.03,.20,.26,C.frameDark);}
  // Rear diagonals and back-side frame faces also remain modeled during an orbit.
  beam(root,[side*12.19,.30,-7.5],[side*12.19,5.35,-2.5],.090,C.frameDark);
  beam(root,[side*12.19,5.35,-2.5],[side*12.19,9.98,2.75],.090,C.frameDark);
 }
 // Wide central double doors, low threshold and small curved black-green handles.
 const door=group(root,0,0,-7.36,'绿框玻璃双开门');
 for(const x of [-2.95,0,2.95]){box(door,x,2.76,.02,.17,5.47,.24,C.frame);box(door,x+.051,2.76,.17,.035,5.35,.033,0x72a546);}
 for(const y of [.16,5.45])box(door,0,y,.05,6.02,.18,.27,C.frame);
 for(const side of [-1,1]){pane(door,side*1.475,2.80,.04,2.69,5.03,side);for(const x of [side*.94,side*1.98])box(door,x,2.79,.14,.095,5.16,.10,C.frame);tube(door,[[side*.28,1.70,.29],[side*.38,1.75,.47],[side*.40,2.20,.47],[side*.26,2.27,.29]],.055,C.frameDark,20);}
 box(door,0,.038,.65,5.7,.065,1.32,0xdcca95);
 // Low green shapes outside the translucent room prevent a blank rear surface.
 for(let i=0;i<12;i++){const x=-12.8+i*2.34;ball(root,x,.45,-9.25,1.58,.53,.78,i%2?0x759269:0x90aa84);}

 const barkTex=texture(256,512,(c,w,h)=>{c.fillStyle='#928048';c.fillRect(0,0,w,h);for(let i=-1;i<18;i++){c.strokeStyle=i%3===0?'#6f623c':i%3===1?'#a69351':'#827340';c.lineWidth=i%2?7:3;c.beginPath();for(let j=0;j<=24;j++){const y=j*h/24,x=i*17+Math.sin(j*.45+i)*7+Math.sin(j*.18)*9;if(j)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();}});barkTex.wrapS=barkTex.wrapT=THREE.RepeatWrapping;
 const bark=mat(0xffffff,{map:barkTex,bumpMap:barkTex,bumpScale:.028});
 // Old right-hand tree and its exposed roots continue all around the outside.
 const tree=group(root,11.74,.05,.05,'右侧老树、树根和棚架绳索');
 const trunkPts=[[0,.05,0],[-.14,2.1,.13],[.25,4.0,-.12],[.05,6.5,-.24],[-.12,8.6,-.08],[-.68,10.5,-.55]];
 tube(tree,trunkPts,.57,bark,45);
 for(let i=0;i<9;i++){const a=i*Math.PI*2/9,r=1.04+(i%3)*.27;tube(tree,[[Math.sin(a)*.30,1.68,Math.cos(a)*.28],[Math.sin(a)*.63,.60,Math.cos(a)*.62],[Math.sin(a)*r,.10,Math.cos(a)*r]],.20,i%2?0x9f8a49:0x786b3a,20);tube(tree,[[Math.sin(a)*.49,1.59,Math.cos(a)*.46],[Math.sin(a)*.72,.50,Math.cos(a)*.68],[Math.sin(a)*r,.17,Math.cos(a)*r]],.027,0x645b33,20);}
 for(const [x,z]of [[-.35,.35],[.20,.48],[.50,.12],[-.51,-.10]])tube(tree,[[x,.80,z],[x-.05,3.25,z-.02],[x+.16,5.28,z-.1],[x-.12,7.45,z],[x-.27,9.35,z-.17]],.032,0x675c33,40);
 tube(tree,[[0,6.7,-.15],[-1.53,7.72,-1.56],[-2.36,9.40,-3.39],[-3.1,10.35,-4.3]],.32,bark,30);
 tube(tree,[[-.16,8.6,-.12],[-.70,9.07,1.6],[-1.50,10.1,3.48]],.30,bark,28);
 tube(tree,[[.12,5.76,.13],[.80,7.35,.33],[1.11,9.56,-.13]],.26,bark,24);
 const knot=torus(tree,-.02,4.60,.49,.24,.045,0x625b34,32);knot.scale.set(.70,1.25,1);const knotIn=torus(tree,-.02,4.6,.50,.12,.035,0xb19a59,26);knotIn.scale.set(.65,1.25,1);
 for(let i=0;i<14;i++){const z=-6.92+i*.92;ball(root,11.75+Math.sin(i*.7)*.22,10.38,z,1.06,.71,.92,i%3===0?0x39722f:i%3===1?0x5a9638:0x6ea343);ball(root,11.29,9.99,z+.22,.58,.45,.51,0x73a546);}
 for(let i=0;i<11;i++){const x=3.05+i*.90;ball(root,x,10.43,-7.17,.88,.62,.81,i%3===0?0x3c7731:i%3===1?0x578f35:0x70a341);ball(root,x+.19,10.05,-6.93,.52,.37,.43,0x79a945);}
 // Vines are modeled independently, with individual leaves and tendrils.
 function vine(points,size=.25){tube(root,points,.049,0x627a33,40);for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];for(let j=0;j<3;j++){const t=(j+.3)/3,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,z=a[2]+(b[2]-a[2])*t;leaf(root,x+(j%2?.14:-.14),y,z+.07,size,j%2?0x82b73e:0x5c982f,j%2?.58:-.58);}}}
 vine([[5.88,6.57,-7.16],[5.50,5.11,-6.97],[5.96,3.69,-6.80],[5.48,2.02,-6.60]],.24);
 vine([[12.24,9.74,-3.90],[12.28,7.69,-4.10],[12.27,5.70,-3.43],[12.27,3.54,-4.01]],.31);
 vine([[11.50,8.80,3.66],[11.71,7.30,3.25],[11.63,5.91,3.73]],.31);

 // The skewed SMART fabric banner has real folded edges, fan leaves and a Ram face.
 const smart=group(root,4.33,7.49,-5.68,'SMART 斜挂拉姆旗');smart.rotation.z=-.205;
 const flag=new THREE.Shape();flag.moveTo(-1.33,3.59);flag.lineTo(1.34,3.59);flag.lineTo(1.30,-3.75);flag.lineTo(.02,-3.34);flag.lineTo(-1.27,-3.83);flag.closePath();shape(smart,flag,.075,C.frameDark);
 const cloth=new THREE.Shape();cloth.moveTo(-1.19,3.40);cloth.lineTo(1.20,3.40);cloth.lineTo(1.17,-3.48);cloth.lineTo(.03,-3.13);cloth.lineTo(-1.13,-3.55);cloth.closePath();shape(smart,cloth,.015,0xd9e984,0,0,.081);
 const stripe=new THREE.Shape();stripe.moveTo(-1.19,3.39);stripe.lineTo(1.18,3.39);stripe.lineTo(.82,-.10);stripe.bezierCurveTo(.71,-.71,.19,-.64,.26,-.08);stripe.lineTo(.46,1.25);stripe.lineTo(-1.19,2.07);stripe.closePath();shape(smart,stripe,.012,0xffb6c2,0,0,.100);
 const smartTex=texture(512,192,(c,w,h)=>{c.font='italic 900 135px Georgia, serif';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=9;c.strokeStyle='#543817';c.strokeText('SMART',w/2,h/2);c.fillStyle='#fff1a8';c.fillText('SMART',w/2,h/2);});panel(smart,0,2.62,.126,2.34,.86,smartTex);
 for(const y of [-.78,-1.25])ball(smart,.18,y,.14,.17,.23,.025,0xffc2d1);
 const fan=group(smart,-.20,-.32,.24,'扇形绿叶冠');
 for(let i=0;i<9;i++){const a=-1.16+i*.287,r=1.66+(i%3)*.08;const x=Math.sin(a)*r,y=Math.cos(a)*r;const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(x-Math.cos(a)*.27,y+Math.sin(a)*.27);s.lineTo(x+Math.cos(a)*.27,y-Math.sin(a)*.27);s.closePath();shape(fan,s,.037,i%2?0x409f37:0x5cac36);tube(fan,[[0,0,.052],[x-Math.cos(a)*.27,y+Math.sin(a)*.27,.052],[x+Math.cos(a)*.27,y-Math.sin(a)*.27,.052],[0,0,.052]],.037,0x16454e,8);}
 const face=group(smart,-.20,-1.57,.27,'黄拉姆脸招牌');ball(face,0,0,0,.89,.78,.18,0xc98f12);ball(face,0,.025,.11,.79,.70,.14,0xffdc1e);
 for(const side of [-1,1]){ball(face,side*.27,.15,.237,.24,.37,.049,C.white);ball(face,side*.235,.19,.279,.075,.14,.024,0x493922);}
 tube(face,[[-.38,-.25,.255],[-.04,-.34,.28],[.28,-.24,.254]],.031,0xc58e13,16);ball(face,-.37,-.02,.271,.075,.055,.024,0xffe875);

 // Rope truss, separate suspended cages, and two tiny Ram passengers.
 for(const y of [9.3,9.62])tube(root,[[6.78,y,-6.54],[7.67,y-.31,-5.69],[8.51,y-.40,-5.36],[9.27,y+.02,-5.08],[10.52,y+.48,-5.3]],.076,C.woodDark,32);
 tube(root,[[6.90,10.24,-6.50],[6.68,8.36,-6.43],[7.07,7.28,-6.33],[7.50,7.20,-6.18],[7.81,8.83,-5.91]],.065,C.woodDark,35);
 tube(root,[[9.71,9.63,-4.88],[9.43,6.37,-4.27],[10.50,5.07,-3.00],[11.71,6.11,-1.59],[12.16,8.3,-.99]],.087,0x595a38,42);
 function smallRam(p,x,y,z,color,s=.45){const g=group(p,x,y,z);g.scale.setScalar(s);ball(g,0,.41,0,.51,.45,.43,color);ball(g,0,.12,.10,.46,.14,.38,color);for(const side of [-1,1]){ball(g,side*.17,.49,.391,.14,.20,.045,C.white);ball(g,side*.155,.51,.433,.039,.079,.021,0x294e2a);leaf(g,side*.12,.94,-.035,.25,side<0?0x60a93b:0x8eca45,-side*.70);}tube(g,[[-.10,.30,.405],[0,.265,.445],[.11,.30,.412]],.024,0x486329,14);return g;}
 function cage(x,y,z,color){const g=group(root,x,y,z,'吊挂拉姆小笼');beam(g,[0,.93,0],[0,2.08,0],.035,0x7e743d);const hook=torus(g,0,2.1,.02,.12,.028,0xa58e43,24);hook.rotation.y=.35;const base=cylinder(g,0,.07,0,.60,.54,.15,0xbbac55,28);base.scale.z=.78;const ring=torus(g,0,.16,0,.58,.032,0x406e48,32);ring.rotation.x=-Math.PI/2;ring.scale.y=.80;for(const a of [0,Math.PI/3,2*Math.PI/3]){const pts=[];for(let i=0;i<=20;i++){const t=i/20*Math.PI,xx=Math.cos(t)*.59,yy=Math.sin(t)*.80;pts.push([Math.cos(a)*xx,yy+.17,Math.sin(a)*xx*.80]);}tube(g,pts,.026,0x5c8f51,24);}smallRam(g,0,.15,0,color,.76);return g;}
 cage(8.01,6.61,-5.47,0x79ce39);cage(9.38,6.32,-5.06,0xe2cf2e);

 // The right display is a curved thick timber island with grass, never a box.
 function counterOutline(){const s=new THREE.Shape();s.moveTo(-1.50,4.60);s.bezierCurveTo(.60,5.0,2.80,3.1,2.85,1.5);s.bezierCurveTo(3.10,-1.0,2.30,-4.40,.20,-4.90);s.bezierCurveTo(-1.70,-5.30,-3.10,-3.30,-3.00,-1.20);s.bezierCurveTo(-3.10,1.00,-2.80,3.60,-1.50,4.60);s.closePath();return s;}
 const counter=group(root,8.42,.05,.65,'弧形草坪商品柜台与竖木边');
 const outline=counterOutline();const points=outline.getSpacedPoints(104).map(p=>[p.x,-p.y]);
 const lower=flatShape(counter,outline,.21,0xb28e34,0,.10,0);lower.scale.set(1.038,1.038,1);
 const bevelBase=flatShape(counter,outline,.18,0xe4bd52,0,.31,0);bevelBase.scale.set(1.027,1.027,1);
 flatShape(counter,outline,.54,0xbca04b,0,.48,0);
 for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],len=Math.hypot(b[0]-a[0],b[1]-a[1]);const slat=box(counter,mid[0],.744,mid[1],len*.87,.49,.070,[0xd3b559,0xe0c26c,0xbfa34b,0xdac177][i%4]);slat.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);}
 tube(counter,points.map(([x,z])=>[x,.49,z]),.060,C.goldDark,104,true);
 tube(counter,points.map(([x,z])=>[x,1.02,z]),.067,C.goldLight,104,true);
 const turf=flatShape(counter,outline,.065,0x8fc741,0,1.03,0);turf.scale.set(.973,.973,1);turf.name='柜台嫩绿草皮';
 for(let i=0;i<27;i++){const a=i*.91,x=Math.cos(a)*(1.3+(i%3)*.23),z=Math.sin(a)*(2.9+(i%2)*.22);for(const k of [-1,0,1]){const blade=leaf(counter,x+k*.041,1.12,z,.055,i%3?0xa3d45b:0x62a831,k*.30);blade.rotation.x=.3;}}
 // Rectangular training cushions keep their characteristic thick lemon piping.
 for(const [x,z,c,turn]of [[-1.54,-2.55,0xf4a52b,-.11],[-1.62,-.20,0xf7a41f,.12],[-.14,3.58,0xbb8ce5,-.17]]){const pad=group(counter,x,1.10,z,'黄边彩色坐垫');pad.rotation.y=turn;box(pad,0,.075,0,.94,.15,1.0,0xffe476);box(pad,0,.155,0,.80,.105,.87,c);for(const side of [-1,1])box(pad,side*.38,.16,0,.025,.026,.73,c===0xbb8ce5?0xdfbcf5:0xffc457);}
 function goldStand(x,z,ry=0){const g=group(counter,x,1.1,z,'立式金绿色铭牌');g.rotation.y=ry;const base=cylinder(g,0,.09,0,.34,.39,.18,0xaeb43b,22);base.scale.z=.69;beam(g,[0,.14,0],[0,1.36,0],.060,C.goldDark);const oval=torus(g,0,1.18,.02,.39,.066,0x736f27,32);oval.scale.set(.72,1.12,1);const inner=torus(g,0,1.18,.07,.30,.043,C.goldLight,32);inner.scale.set(.72,1.12,1);ball(g,0,1.20,.025,.206,.321,.050,0x628b2f);ball(g,0,1.23,.09,.081,.118,.020,0xffe95b);tube(g,[[0,1.15,.117],[.07,1.28,.117],[.025,1.35,.115],[-.055,1.27,.114]],.018,0x425f24,12);ball(g,0,1.79,0,.15,.105,.09,C.goldLight);return g;}
 goldStand(-.34,-1.40,-.12);goldStand(1.46,2.10,-.36);

 // A continuous white-daisy garland rises along the curved outside of the counter.
 function daisy(p,x,y,z,s=1,tilt=0){const g=group(p,x,y,z);g.scale.setScalar(s);tube(g,[[0,0,0],[.10,.65,0],[-.03,1.14,.01]],.026,0x548533,15);leaf(g,-.19,.47,.015,.25,0x7cab45,-.72);leaf(g,.18,.70,-.005,.23,0x88b94a,.77);const blossom=group(g,-.03,1.17,.03);blossom.rotation.x=-.52+tilt;blossom.rotation.z=.11;for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const petal=ball(blossom,Math.sin(a)*.258,Math.cos(a)*.258,.006,.11,.265,.035,i%2?0xfffce7:0xf0f0de);petal.rotation.z=-a;ball(blossom,Math.sin(a)*.253,Math.cos(a)*.253,.041,.035,.16,.012,0xfffff5).rotation.z=-a;}ball(blossom,0,0,.066,.115,.118,.049,0xe5b729);ball(blossom,-.022,.025,.100,.073,.069,.025,0xffd44e);}
 const flowerTrack=[];for(let i=0;i<=30;i++){const t=i/30,z=-3.82+t*8.04,x=1.07+Math.sin(t*Math.PI)*1.43;flowerTrack.push([x,1.17,z]);}
 tube(counter,flowerTrack,.09,0x567f30,42);
 for(let i=0;i<19;i++){const t=i/18,z=-3.8+t*8.05,x=1.06+Math.sin(t*Math.PI)*1.43;daisy(counter,x,1.10,z,.73+(i%3)*.095,(i%3-.9)*.16);if(i%2===0)daisy(counter,x-.34,1.12,z+.22,.63,-.11);}
 // Two actual books, including visible spines, page stacks and little leaf emblems.
 function book(x,z,c,angle){const g=group(counter,x,2.11,z,'柜边彩色小书');g.rotation.set(.11,angle,-.075);box(g,0,0,0,1.05,.070,.83,c);box(g,0,.092,.015,.95,.116,.73,0xfff9dd);box(g,0,.17,0,1.06,.070,.84,c);box(g,-.49,.09,0,.080,.18,.82,c);for(let i=0;i<3;i++)box(g,.06,.075+i*.03,.389,.83,.009,.010,0xd7ceb6);box(g,0,.214,0,.83,.010,.63,0xf9db58);box(g,0,.224,0,.72,.010,.54,c);return g;}
 const blueBook=book(2.45,1.04,0x257bbc,-.22);for(let i=0;i<5;i++)box(blueBook,0,.24,-.17+i*.08,.53,.018,.025,0x86c544);
 const redBook=book(2.51,3.60,0xa51460,-.24);const emblem=group(redBook,0,.238,0);emblem.rotation.x=-Math.PI/2;ball(emblem,0,0,0,.17,.14,.023,0xe5ca30);ball(emblem,-.06,.10,.02,.054,.07,.019,0xa51460);ball(emblem,.055,.10,.02,.051,.07,.019,0xa51460);
 for(const [x,z]of [[2.45,1.04],[2.51,3.60]]){beam(counter,[x-.13,1.18,z],[x-.13,2.04,z],.075,C.frame);beam(counter,[x-.13,1.39,z],[x+.35,1.98,z],.042,C.frameLight);}

 // Rear seed stall: stepped cream shelf, woven baskets, seeds and FREE animal board.
 const seeds=group(root,5.39,.05,-3.88,'种子篮台与 FREE 动物招牌');seeds.rotation.y=-.25;
 for(const [y,z,w,d]of [[.20,.48,2.12,1.93],[.50,.30,1.91,1.68],[.85,-.02,1.74,1.41]])box(seeds,0,y,z,w,.23,d,0xd7bc71);
 for(const [y,z,w,d]of [[.34,.48,2.12,1.93],[.64,.30,1.91,1.68],[.99,-.02,1.74,1.41]]){box(seeds,0,y,z,w,.09,d,0xf2dc95);box(seeds,0,y+.049,z,w-.18,.021,d-.17,0xe1c785);}
 function basket(p,x,y,z,s=1){const g=group(p,x,y,z,'编织种子小篮');g.scale.setScalar(s);cylinder(g,0,.24,0,.34,.26,.44,0x8e7140,20);for(let j=0;j<5;j++){const r=.276+j*.014,yy=.05+j*.08;const ring=torus(g,0,yy,0,r,.018,j%2?0xab8d51:0x695431,28);ring.rotation.x=-Math.PI/2;}for(let i=0;i<12;i++){const a=i*Math.PI*2/12;beam(g,[Math.sin(a)*.266,.045,Math.cos(a)*.266],[Math.sin(a)*.33,.45,Math.cos(a)*.33],.014,0xb49d63);}cylinder(g,0,.458,0,.317,.317,.018,0x594b30,22);const rim=torus(g,0,.475,0,.34,.03,0x735b2f,28);rim.rotation.x=-Math.PI/2;for(let i=0;i<9;i++){const a=i*2.4,r=.025+(i%3)*.067;ball(g,Math.cos(a)*r,.49+(i%2)*.012,Math.sin(a)*r,.038,.018,.026,0xad985a);}tube(g,[[-.32,.39,0],[-.36,.81,0],[0,.99,0],[.36,.81,0],[.32,.39,0]],.024,0x745a2f,28);return g;}
 basket(seeds,-.43,1.05,-.24,.88);basket(seeds,.34,1.05,-.32,.76);basket(seeds,.0,.70,.54,.87);
 beam(seeds,[.69,.89,-.57],[.69,3.43,-.57],.095,0x8e723b);
 const free=group(seeds,.65,3.05,-.45,'FREE 手绘笑脸木牌');free.rotation.z=-.08;
 const board=new THREE.Shape();board.moveTo(-.81,-.60);board.lineTo(-.91,.15);board.lineTo(-.69,.34);board.lineTo(-.86,.61);board.lineTo(-.49,.68);board.lineTo(-.49,.96);board.lineTo(-.09,.80);board.lineTo(.15,1.01);board.lineTo(.39,.78);board.lineTo(.73,.84);board.lineTo(.71,.59);board.lineTo(.96,.43);board.lineTo(.77,.18);board.lineTo(.89,-.54);board.closePath();shape(free,board,.13,0xa97e4b);
 const inner=new THREE.Shape();inner.moveTo(-.69,-.44);inner.lineTo(-.74,.32);inner.lineTo(-.45,.62);inner.lineTo(.03,.64);inner.lineTo(.55,.65);inner.lineTo(.75,.30);inner.lineTo(.68,-.41);inner.closePath();shape(free,inner,.025,0x5f9990,0,0,.142);
 for(const side of [-1,1]){ball(free,side*.21,.42,.196,.155,.18,.030,C.white);ball(free,side*.195,.445,.227,.056,.074,.020,0x345259);}
 tube(free,[[-.47,.15,.20],[-.28,-.10,.21],[.09,-.15,.215],[.47,.05,.20]],.105,0xfff8df,22);tube(free,[[-.39,.06,.277],[-.19,-.095,.289],[.10,-.10,.292],[.40,.034,.278]],.050,0xd45048,20);ball(free,-.36,.73,.20,.105,.16,.04,0xd7b383);
 const freeText=texture(256,96,(c,w,h)=>{c.font='900 74px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff4d4';c.strokeStyle='#ac8957';c.lineWidth=3;c.strokeText('FREE',w/2,h/2);c.fillText('FREE',w/2,h/2);});const ftag=box(free,0,-.63,.05,1.77,.42,.18,0xaa8555);panel(free,0,-.64,.151,1.60,.33,freeText);

 // Rounded vine planter, little seed packs and the ridged orange pumpkin beside it.
 const planter=group(root,4.34,.05,-1.77,'藤蔓花盆与南瓜');
 cylinder(planter,0,.64,0,.71,.57,1.20,0xa98054,26);cylinder(planter,0,1.24,0,.80,.73,.18,0xc4a174,28);cylinder(planter,0,1.35,0,.66,.66,.032,0x78642b,26);
 for(let i=0;i<6;i++){const a=i*Math.PI*2/6;beam(planter,[Math.sin(a)*.56,.20,Math.cos(a)*.56],[Math.sin(a)*.69,1.10,Math.cos(a)*.69],.035,0x7f683e);}
 tube(planter,[[0,1.34,0],[.06,2.05,0],[-.04,2.77,-.12],[.24,3.75,-.06],[.13,4.32,-.12]],.057,0x64833c,30);
 for(let i=0;i<8;i++){const y=1.63+i*.32;leaf(planter,(i%2?-.17:.18)+Math.sin(i)*.05,y,-.06,.22,i%2?0x9cc644:0x739c32,i%2?-.87:.80);}
 for(const [x,z,col,angle]of [[-.44,.27,0xe9ad32,.32],[-.08,.42,0xdf8433,-.04],[.22,.39,0xafd441,-.12]]){const pack=group(planter,x,1.44,z);pack.rotation.set(-.78,0,angle);box(pack,0,0,0,.36,.49,.058,col);box(pack,0,0,.040,.26,.36,.012,0xffe990);ball(pack,0,-.04,.060,.082,.07,.013,0xf5a23c);leaf(pack,.015,.065,.061,.077,0x4f9c2d,-.42);}
 const pumpkin=group(root,4.77,.05,.14,'橙色分瓣南瓜');for(let i=0;i<9;i++){const a=i*Math.PI*2/9;ball(pumpkin,Math.sin(a)*.36,.48,Math.cos(a)*.36,.33,.47,.31,i%2?0xe88f18:0xf0a220);}ball(pumpkin,0,.47,0,.48,.47,.43,0xea991b);tube(pumpkin,[[0,.87,0],[.015,1.11,.025],[.17,1.21,.038]],.082,0x627737,16);leaf(pumpkin,-.27,1.00,.09,.25,0x779936,-1.1);tube(pumpkin,[[.11,1.15,.03],[.33,1.21,.03],[.42,1.09,.03],[.34,1.02,.03]],.025,0x617e31,20);

 // Central round adoption garden: purple base, silver-blue rims and separate Rams.
 const adoption=group(root,1.10,.05,4.15,'圆形拉姆领养展台');
 cylinder(adoption,0,.19,0,2.18,2.08,.36,0x87657e,64);cylinder(adoption,0,.35,0,2.16,2.16,.17,0xc691bb,64);cylinder(adoption,0,.51,0,2.07,2.17,.21,0xededdd,64);cylinder(adoption,0,.67,0,1.93,2.07,.16,0x6ea6b6,64);cylinder(adoption,0,.76,0,1.90,1.92,.06,0x71c8d4,64);
 for(const [y,r,t,c]of [[.37,2.16,.052,0xddb2d0],[.59,2.06,.079,0xeaf4e5],[.76,1.92,.049,0xc6f4ed],[.79,1.63,.047,0x467747]]){const rim=torus(adoption,0,y,0,r,t,c,64);rim.rotation.x=-Math.PI/2;}
 cylinder(adoption,0,.75,0,1.62,1.67,.13,0x69a134,64);cylinder(adoption,0,.827,0,1.58,1.58,.021,0x98c742,56);
 for(let i=0;i<22;i++){const a=i*.93,r=.5+(i%4)*.25;const blade=leaf(adoption,Math.sin(a)*r,.867,Math.cos(a)*r,.068,i%2?0xa3cf42:0x76a831,.35);blade.rotation.x=.4;}
 for(const [x,z,color,s]of [[-.88,-.51,0xde3721,.58],[.09,-.81,0xe7d228,.55],[.85,-.44,0x65b634,.57],[-.27,.51,0x269ec4,.61],[.83,.39,0xe8659d,.58]]){const g=group(adoption,x,.847,z,'花盆里的小拉姆');cylinder(g,0,.13,0,.23,.18,.25,0x9e6740,20);cylinder(g,0,.262,0,.255,.245,.06,0xba8550,20);smallRam(g,0,.26,0,color,s);}
 // Leaf silhouette sign with the narrow twig support and hand-drawn ADOPT lettering.
 const sign=group(adoption,.83,0,-.91,'叶形 ADOPT 领养牌');sign.rotation.y=-.14;beam(sign,[0,.84,0],[.06,2.41,0],.059,0x826841);
 const signShape=new THREE.Shape();signShape.moveTo(-.65,-.62);signShape.bezierCurveTo(-1.02,-.18,-.77,.39,-.42,.62);signShape.bezierCurveTo(-.54,1.03,-1.12,1.32,-.81,1.51);signShape.bezierCurveTo(-.48,1.55,-.15,.99,-.02,.71);signShape.bezierCurveTo(.23,1.06,.47,1.04,.66,.83);signShape.bezierCurveTo(.92,.60,.54,.59,.22,.51);signShape.bezierCurveTo(.79,.11,.83,-.51,.48,-.74);signShape.bezierCurveTo(.16,-.99,-.44,-.97,-.65,-.62);signShape.closePath();const plaque=shape(sign,signShape,.090,0x947953,0,2.21,0);const innerSign=shape(sign,signShape,.016,0xf0e4bf,0,2.22,.099);innerSign.scale.set(.94,.94,1);
 const adoptTex=texture(384,256,(c,w,h)=>{c.save();c.translate(w/2,h/2);c.rotate(-.15);c.font='italic 900 81px Georgia, serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#699848';c.fillText('ADOPT',0,0);c.restore();});panel(sign,-.015,2.18,.132,1.40,.86,adoptTex);
 const card=group(adoption,-1.02,.90,.93,'领养台小图册');card.rotation.set(-.60,-.24,.05);box(card,0,0,0,.50,.65,.047,0xdca940);box(card,0,0,.03,.42,.56,.012,0xeeeac4);for(const [x,y,col]of [[-.11,.13,0xe89032],[.1,.14,0x68ba55],[-.09,-.1,0x67aec8],[.1,-.09,0xdd85a2]])ball(card,x,y,.05,.075,.079,.013,col);

 const playground=addPetShopPlayground(root)||{};
 const portalLocations={street:[0,.05,-6.4]};
 return {root,indoor:true,background:0xb5d5cf,spawn:[0,.05,0],bounds:{minX:-11.45,maxX:11.45,minZ:-7.03,maxZ:7.50},heightAt:()=>.05,
  walkable:(x,z)=>Math.abs(x)<11.45&&z>-7.03&&z<7.5,
  colliders:[{x:8.42,z:.65,rx:2.98,rz:4.92,kind:'ellipse'},{x:1.10,z:4.15,rx:2.17,rz:2.17,kind:'ellipse'},
   {x:5.39,z:-3.58,rx:1.15,rz:1.23},{x:4.34,z:-1.77,rx:.82,rz:.83,kind:'ellipse'},{x:4.77,z:.14,rx:.69,rz:.67,kind:'ellipse'},...(playground.colliders||[])],
  portalLocations,portalPositions:portalLocations,portalLabelOffsets:{street:[0,1.3,0]},dynamic:playground.dynamic||[],updates:playground.updates||[],
  camera:{perspectivePosition:[.16,17.40,24.20],perspectiveTarget:[0,3.65,-.15],fov:38,wideZoom:.84,wideLift:.10,span:26.0,position:[0,27,32],target:[0,3.65,-.15]}};
}
