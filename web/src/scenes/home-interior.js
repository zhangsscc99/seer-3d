import * as THREE from 'three';
import {addHomeFurniture} from './home-furniture.js';

// A furnished open-front tree house. Texture and mesh caches have scene lifetime.
export function createHomeInteriorScene() {
 const root=new THREE.Group();root.name='摩尔温馨小屋';
 const mats=new Map(),geos=new Map();
 const P={green:0xb3d96c,paleGreen:0xd5e992,leaf:0x49863c,leafLight:0x74b653,
  wood:0xbd793b,woodLight:0xe4ae6a,woodDark:0x754422,peach:0xe6a16e,
  cream:0xffe9b8,white:0xfff9e7,gold:0xeeba3d,goldDark:0xbd7524,
  purple:0x754b97,blue:0x69c5e8,orange:0xf5a92f,red:0xdd4b46};
 function mat(c,e={}){const k=String(c)+Object.keys(e).sort().map(k=>k+':'+(e[k]?.isTexture?e[k].uuid:e[k])).join('|');if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color:c,roughness:.84,...e}));return mats.get(k);}
 function geo(k,f){if(!geos.has(k))geos.set(k,f());return geos.get(k);}
 function group(p=root,x=0,y=0,z=0,name=''){const g=new THREE.Group();g.position.set(x,y,z);g.name=name;p.add(g);return g;}
 function mesh(p,g,c,x=0,y=0,z=0){const m=new THREE.Mesh(g,c?.isMaterial?c:mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
 function box(p,x,y,z,w,h,d,c){const m=mesh(p,geo('box',()=>new THREE.BoxGeometry(1,1,1)),c,x,y,z);m.scale.set(w,h,d);return m;}
 function ball(p,x,y,z,a,b,c,color){const m=mesh(p,geo('ball',()=>new THREE.SphereGeometry(1,14,9)),color,x,y,z);m.scale.set(a,b,c);return m;}
 function cyl(p,x,y,z,t,b,h,c,n=20,open=false){return mesh(p,geo(['c',t,b,h,n,open].join(':'),()=>new THREE.CylinderGeometry(t,b,h,n,1,open)),c,x,y,z);}
 function torus(p,x,y,z,r,t,c){return mesh(p,geo('t:'+r+':'+t,()=>new THREE.TorusGeometry(r,t,6,40)),c,x,y,z);}
 function beam(p,a,b,r,c){const aa=new THREE.Vector3(...a),bb=new THREE.Vector3(...b),v=bb.clone().sub(aa);const m=mesh(p,geo('beam',()=>new THREE.CylinderGeometry(1,1,1,8)),c);m.position.copy(aa.add(bb).multiplyScalar(.5));m.scale.set(r,v.length(),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
 function curve(p,points,r,c,n=24){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),n,r,5,false),c);}
 function texture(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=2;return t;}
 function panel(p,x,y,z,w,h,t){return mesh(p,geo('plane:'+w+':'+h,()=>new THREE.PlaneGeometry(w,h)),mat(0xffffff,{map:t}),x,y,z);}
 function shapeMesh(p,shape,depth,c,x=0,y=0,z=0){return mesh(p,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:14}),c,x,y,z);}
 function star(p,x,y,z,r,c){const s=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.44:r;const xx=Math.cos(a)*rr,yy=Math.sin(a)*rr;if(i)s.lineTo(xx,yy);else s.moveTo(xx,yy);}s.closePath();return shapeMesh(p,s,.045,c,x,y,z);}
 function leaf(p,x,y,z,s,c,angle=0){const m=ball(p,x,y,z,s*.35,s,s*.14,c);m.rotation.z=angle;return m;}
 function arch(w,h){const r=w/2,s=new THREE.Shape();s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI,false);s.closePath();return s;}
 function archFrame(p,x,y,z,w,h,t,depth,c){const r=w/2,rr=r-t,s=new THREE.Shape();s.moveTo(-r,0);s.lineTo(-r,h-r);s.absarc(0,h-r,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(rr,0);s.lineTo(rr,h-r);s.absarc(0,h-r,rr,0,Math.PI,false);s.lineTo(-rr,0);s.closePath();return shapeMesh(p,s,depth,c,x,y,z);}
 const gold=mat(P.gold,{metalness:.28,roughness:.35});

 // Soft chartreuse wallpaper, with the sparse pale four-leaf print in the photo.
 const paperTex=texture(256,256,(c,w,h)=>{c.fillStyle='#c0e96f';c.fillRect(0,0,w,h);for(const [x,y,rot]of [[62,58,.08],[188,184,-.04]]){c.save();c.translate(x,y);c.rotate(rot);c.fillStyle='#def2a0';for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(5,-17,18,-30,23,-30);c.bezierCurveTo(28,-16,14,-5,0,0);c.fill();}c.restore();}});paperTex.wrapS=paperTex.wrapT=THREE.RepeatWrapping;
 const paper=mat(0xffffff,{map:paperTex,roughness:.98});
 const barkTex=texture(512,256,(c,w,h)=>{c.fillStyle='#97733f';c.fillRect(0,0,w,h);for(let i=-1;i<27;i++){c.strokeStyle=['#69512d','#b49559','#a88546'][((i%3)+3)%3];c.lineWidth=i%2?9:4;c.beginPath();for(let j=0;j<=25;j++){const y=j*h/25,x=i*22+Math.sin(y*.026+i)*12;if(j)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();}});barkTex.wrapS=barkTex.wrapT=THREE.RepeatWrapping;
 const bark=mat(0xffffff,{map:barkTex,bumpMap:barkTex,bumpScale:.045});
 const wallPath=[];for(let i=0;i<=20;i++)wallPath.push([-10.40,5.85-i/20*9.55]);for(let i=1;i<=24;i++){const a=Math.PI+i/24*Math.PI/2;wallPath.push([-6.95+Math.cos(a)*3.45,-3.70+Math.sin(a)*3.45]);}for(let i=1;i<=60;i++)wallPath.push([-6.95+i/60*13.90,-7.15]);for(let i=1;i<=24;i++){const a=-Math.PI/2+i/24*Math.PI/2;wallPath.push([6.95+Math.cos(a)*3.45,-3.70+Math.sin(a)*3.45]);}for(let i=1;i<=20;i++)wallPath.push([10.40,-3.70+i/20*9.55]);
 const wallH=10.05,windowY=5.03;
 function opening(x,y,z){return z<-6.7&&(x/3.73)**2+((y-windowY)/3.02)**2<1||x<-10.1&&Math.abs(z-4.4)<1.06&&y<2.07+Math.sqrt(Math.max(0,1.06**2-(z-4.4)**2));}
 for(const outside of [false,true]){const ps=[],uv=[],ix=[],ny=36,nx=wallPath.length-1;let u=0;for(let j=0;j<=ny;j++){u=0;for(let i=0;i<=nx;i++){const [x,z]=wallPath[i];if(i)u+=Math.hypot(x-wallPath[i-1][0],z-wallPath[i-1][1]);const off=outside?.34:0;ps.push(x+(outside?Math.sign(x)*off:0),j/ny*wallH,z+(outside?Math.min(-.05,z/7)*off:0));uv.push(u*.28,j/ny*wallH*.28);if(i<nx&&j<ny){const xx=(x+wallPath[i+1][0])*.5,zz=(z+wallPath[i+1][1])*.5,y=(j+.5)/ny*wallH;if(opening(xx,y,zz))continue;const k=j*(nx+1)+i;if(outside)ix.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);else ix.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();mesh(root,g,outside?bark:paper).name=outside?'有藤蔓的真实树屋外壳':'嫩绿色四叶墙纸';}
 for(const side of [-1,1]){box(root,side*10.43,5.02,5.83,.51,10.06,.20,P.woodLight);box(root,side*10.23,5.02,5.73,.095,10.06,.15,P.cream);}
 curve(root,wallPath.map(([x,z])=>[x,.13,z]),.15,0xd3b870,120);
 curve(root,wallPath.map(([x,z])=>[x,10.05,z]),.17,0x6c983c,120);

 // Broad salmon-colored horizontal floorboards and rounded, thick floor edge.
 function roundedFloor(){const s=new THREE.Shape();s.moveTo(-7.05,-7.34);s.lineTo(7.05,-7.34);s.quadraticCurveTo(10.62,-7.34,10.62,-3.74);s.lineTo(10.62,4.46);s.quadraticCurveTo(10.62,8.04,7.04,8.04);s.lineTo(-7.04,8.04);s.quadraticCurveTo(-10.62,8.04,-10.62,4.46);s.lineTo(-10.62,-3.74);s.quadraticCurveTo(-10.62,-7.34,-7.05,-7.34);s.closePath();return s;}
 const fshape=roundedFloor(),floor=shapeMesh(root,fshape,.28,0xba7d45,0,-.018,0);floor.rotation.x=Math.PI/2;
 const floorTex=texture(512,512,(c,w,h)=>{c.fillStyle='#e5a16f';c.fillRect(0,0,w,h);for(let row=0;row<8;row++){c.fillStyle=['#e8aa79','#e4a271','#e1a06e','#edb080'][row%4];c.fillRect(0,row*64,w,62);c.fillStyle='#c88759';c.fillRect(0,row*64+62,w,2);const seam=(row%3)*161+39;c.fillRect(seam,row*64,2,63);c.strokeStyle='rgba(188,120,68,.16)';c.lineWidth=1;for(let line=0;line<4;line++){c.beginPath();c.moveTo(0,row*64+12+line*11);c.bezierCurveTo(160,row*64+9+line*11,270,row*64+17+line*11,512,row*64+11+line*11);c.stroke();}}});floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(.095,.095);
 const floorTop=mesh(root,new THREE.ShapeGeometry(fshape,24),mat(0xffffff,{map:floorTex,roughness:.97,bumpMap:floorTex,bumpScale:.006}),0,.025,0);floorTop.rotation.x=Math.PI/2;floorTop.material.side=THREE.DoubleSide;floorTop.castShadow=false;

 // Cream oval garden window and the long double-scroll pediment above it.
 const win=group(root,0,windowY,-7.055,'奶油金边圆弧大窗');
 for(const [r,t,c,z]of [[1,.082,0xc48a40,0],[1,.060,P.cream,.14],[.94,.020,0xf3c982,.18],[1.065,.025,0xfbedbe,.055]]){const m=torus(win,0,0,z,r,t,c);m.scale.set(3.80,3.13,1);}
 const reveal=mesh(win,new THREE.CylinderGeometry(1,1,.42,64,1,true),P.cream,0,0,-.08);reveal.rotation.x=Math.PI/2;reveal.scale.set(3.72,.95,2.99);
 const cap=new THREE.Shape();cap.moveTo(-4.32,2.68);cap.bezierCurveTo(-4.66,3.04,-4.41,3.90,-3.69,3.98);cap.bezierCurveTo(-2.65,4.15,-1.64,3.72,0,3.47);cap.bezierCurveTo(1.64,3.72,2.65,4.15,3.69,3.98);cap.bezierCurveTo(4.41,3.90,4.66,3.04,4.32,2.68);cap.bezierCurveTo(3.84,2.25,3.36,2.54,3.58,2.94);cap.bezierCurveTo(3.70,3.20,4.04,3.06,3.94,2.87);cap.bezierCurveTo(3.44,2.97,1.75,3.15,0,3.00);cap.bezierCurveTo(-1.75,3.15,-3.44,2.97,-3.94,2.87);cap.bezierCurveTo(-4.04,3.06,-3.70,3.20,-3.58,2.94);cap.bezierCurveTo(-3.36,2.54,-3.84,2.25,-4.32,2.68);cap.closePath();shapeMesh(win,cap,.30,0xf5cf91,0,-.50,.13);
 for(const side of [-1,1]){curve(win,[[0,2.54,.47],[side*1.5,3.08,.47],[side*3.24,3.31,.47],[side*4.02,3.00,.47],[side*4.03,2.46,.47],[side*3.65,2.36,.47]],.038,P.cream,34);const points=[];for(let i=0;i<=27;i++){const t=i/27,a=t*Math.PI*2.3,r=.30*(1-t*.78);points.push([side*(3.67+Math.cos(a)*r),2.50+Math.sin(a)*r,.48]);}curve(win,points,.024,0xc99566,27);}
 // Outdoors really continues behind the window; the wall opening crops the view.
 const sky=mesh(root,new THREE.CircleGeometry(1,64),mat(0x89dff2,{roughness:1,side:THREE.DoubleSide}),0,4.75,-10.10);sky.scale.set(4.30,3.65,1);sky.castShadow=sky.receiveShadow=false;
 // The garden sits inside a projecting timber bay, so a rear orbit sees bark,
 // never the reverse of its little sky. Its open front remains behind the wall.
 const bayShape=new THREE.Shape();bayShape.moveTo(-3.30,1.00);bayShape.lineTo(3.30,1.00);bayShape.quadraticCurveTo(4.85,1.00,4.85,2.55);bayShape.lineTo(4.85,6.35);bayShape.bezierCurveTo(4.85,8.00,2.73,8.76,0,8.76);bayShape.bezierCurveTo(-2.73,8.76,-4.85,8.00,-4.85,6.35);bayShape.lineTo(-4.85,2.55);bayShape.quadraticCurveTo(-4.85,1.00,-3.30,1.00);bayShape.closePath();
 const bayPoints=bayShape.getPoints(20),bayPos=[],bayUv=[],bayIndex=[];let bayDistance=0;
 for(let i=0;i<bayPoints.length;i++){const p=bayPoints[i];if(i)bayDistance+=p.distanceTo(bayPoints[i-1]);for(const z of [-7.50,-10.39]){bayPos.push(p.x,p.y,z);bayUv.push(bayDistance*.21,(z+10.39)*.32);}if(i<bayPoints.length-1){const k=i*2;bayIndex.push(k,k+1,k+2,k+2,k+1,k+3);}}
 const bayGeo=new THREE.BufferGeometry();bayGeo.setAttribute('position',new THREE.Float32BufferAttribute(bayPos,3));bayGeo.setAttribute('uv',new THREE.Float32BufferAttribute(bayUv,2));bayGeo.setIndex(bayIndex);bayGeo.computeVertexNormals();mesh(root,bayGeo,mat(0xffffff,{map:barkTex,bumpMap:barkTex,bumpScale:.045,side:THREE.DoubleSide})).name='窗外花园的封闭木质凸窗侧壁';
 const bayBack=mesh(root,new THREE.ShapeGeometry(bayShape,20),bark,0,0,-10.41);bayBack.rotation.y=Math.PI;bayBack.name='凸窗树皮外壳';
 curve(root,bayPoints.map(p=>[p.x,p.y,-10.46]),.105,0x715329,100);
 for(const [x,y,s]of [[-2.86,5.42,.62],[2.66,3.12,.45],[.82,7.00,.30]]){const knot=torus(root,x,y,-10.49,s,.045,0x6f4f27);knot.scale.set(.57,1.22,1);const inner=torus(root,x,y,-10.51,s*.60,.027,0xc29a59);inner.scale.set(.58,1.25,1);}
 for(const side of [-1,1]){curve(root,[[side*3.68,1.03,-10.49],[side*4.04,2.90,-10.52],[side*3.76,4.85,-10.52],[side*4.08,6.25,-10.51],[side*2.71,8.15,-10.50]],.070,0x557c38,36);for(let i=0;i<6;i++)leaf(root,side*(3.87+Math.sin(i)*.24),2.00+i*.97,-10.58,.45,i%2?0x7aa44f:0x669347,side*(i%2?.8:-.6));}
 const garden=group(root,0,3.18,-8.83,'窗外小花园');box(garden,0,-.76,-.05,8.4,1.70,2.20,0x90bf46);const grass=ball(garden,0,.08,0,4.25,.54,1.64,0x92c847);grass.castShadow=false;
 for(const [x,y,z,s]of [[-3.1,3.7,-.6,.58],[-1.85,4.12,-.65,.50],[1.52,3.86,-.75,.62],[3.03,3.27,-.49,.47]]){for(let i=0;i<3;i++)ball(garden,x+(i-1)*s*.65,y+Math.sin(i)*.14,z,s*.62,s*.31,.14,0xeef8e6);}
 for(let i=0;i<12;i++){const x=-3.57+i*.65;beam(garden,[x,.43,.70],[x,1.04,.65],.070,0xc3bc47);}curve(garden,[[-3.81,1.12,.68],[-2.10,1.04,1.00],[0,.94,1.11],[2.10,1.04,1.00],[3.81,1.12,.68]],.095,0xd0c552,40);
 for(let i=0;i<20;i++){const x=-3.65+(i%10)*.79,z=-.35+Math.floor(i/10)*.64,y=.38+Math.sin(i*.8)*.10;beam(garden,[x,y,z],[x,y+.19,z],.018,P.leaf);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;ball(garden,x+Math.sin(a)*.086,y+.23+Math.cos(a)*.055,z+.01,.076,.066,.036,i%3===0?0xffbdd2:i%3===1?0xffed99:0xfbf8d6);}ball(garden,x,y+.23,z+.045,.040,.037,.026,0xf2b937);}

 // Three white-purple teru-teru dolls suspended on fine strings across the window.
 curve(win,[[-3.05,2.83,.57],[-1.46,2.56,.69],[0,2.47,.73],[1.56,2.57,.69],[3.03,2.84,.56]],.021,P.purple,30);
 for(const x of [-3.05,3.03])ball(win,x,2.84,.57,.085,.085,.064,0xdb8bb9);
 for(const [x,y,s]of [[-2.05,1.91,.93],[0,1.70,1.09],[1.99,1.99,.95]]){const g=group(win,x,y,.71,'晴天娃娃');g.scale.setScalar(s);beam(g,[0,.37,0],[0,.92,0],.017,0xaa80a6);ball(g,0,.24,0,.31,.33,.28,P.purple);ball(g,0,.29,.061,.282,.276,.245,P.white);for(const side of [-1,1])ball(g,side*.10,.33,.288,.055,.070,.022,P.purple);curve(g,[[-.09,.20,.292],[0,.155,.301],[.10,.20,.292]],.025,P.purple,12);const positions=[],uv=[],ind=[],n=36;for(let row=0;row<=8;row++)for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,t=row/8,r=.105+t*.35;positions.push(Math.cos(a)*r,-.12-t*.67+Math.sin(a*3)*.075*t,Math.sin(a)*r*.67);uv.push(i/n,t);if(row<8&&i<n){const k=row*(n+1)+i;ind.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);}}const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));dg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));dg.setIndex(ind);dg.computeVertexNormals();mesh(g,dg,mat(P.white,{side:THREE.DoubleSide}));for(const side of [-1,1]){const skirt=leaf(g,side*.21,-.65,.10,.24,0xd0b8de,side*.36);skirt.scale.x*=1.35;}ball(g,0,-.11,.02,.15,.086,.11,0xb8a0cc);}
 star(win,-2.60,.30,.78,.31,0xffd945);beam(win,[-2.60,.62,.72],[-2.60,1.52,.72],.015,0xd6b146);
 const bow=group(win,3.34,.79,.55,'蓝色蝴蝶结');for(const side of [-1,1]){const b=ball(bow,side*.36,.02,0,.41,.23,.085,0x65d7f1);b.rotation.z=side*.31;const tail=leaf(bow,side*.15,-.47,-.025,.48,0x8fe4f3,side*.21);tail.scale.x*=.70;}ball(bow,0,0,.065,.17,.16,.10,0xa4eff8);

 // Yellow birdhouse clock and two orange flower sconces.
 const clock=group(root,0,8.78,-6.57,'小鸟屋挂钟');shapeMesh(clock,arch(.90,1.37),.25,0xf7c435,-.0,-.70,0);archFrame(clock,0,-.71,.27,.96,1.43,.11,.07,0xc88c27);ball(clock,0,.38,.0,.55,.31,.23,0xf6cf3c);ball(clock,0,-.27,.29,.31,.36,.058,0xe36e4b);const face=cyl(clock,0,-.26,.357,.16,.16,.030,P.white,28);face.rotation.x=Math.PI/2;beam(clock,[0,-.26,.39],[0,-.16,.39],.014,0x906951);beam(clock,[0,-.26,.39],[.075,-.28,.39],.012,0x906951);curve(clock,[[0,-.83,.06],[.04,-1.02,.08],[-.04,-1.11,.08]],.025,P.leaf,12);leaf(clock,-.10,-1.01,.08,.16,P.leafLight,-.9);
 function flowerLamp(x){const g=group(root,x,7.60,-6.37,'橙花吊灯');const glow=mat(0xfac23e,{emissive:0xf9ae35,emissiveIntensity:.10});ball(g,0,.13,0,.62,.52,.41,0xd88c27);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const p=ball(g,Math.sin(a)*.37,-.05,Math.cos(a)*.25,.23,.54,.21,i%2?P.orange:glow);p.rotation.z=-Math.sin(a)*.24;}ball(g,0,.65,0,.28,.13,.22,P.purple);cyl(g,0,.78,0,.095,.14,.20,0x9176b3,14);curve(g,[[0,-.49,0],[.12,-.84,0],[.16,-1.16,0],[-.05,-1.44,0]],.10,0x3c8b62,24);for(const side of [-1,1])leaf(g,side*.15,-1.30,.08,.26,0x69aa59,-side*.9);}
 flowerLamp(-5.91);flowerLamp(5.91);

 // Side trunks, trailing vines and a high scalloped tree canopy.
 for(const side of [-1,1]){const trunk=group(root,side<0?-8.45:6.75,0,-5.65);const body=box(trunk,0,5.05,0,.46,10.1,.51,0xc28344);body.rotation.z=side*.015;box(trunk,-side*.17,5.05,.30,.115,9.83,.07,0xe8ae60);curve(trunk,[[0,7.53,0],[side*.36,8.80,.04],[side*1.25,9.18,.11],[side*1.53,10.0,.07]],.22,P.wood,28);
  const end=group(root,side*10.42,0,4.85);curve(end,[[0,0,.0],[-side*.48,1.5,.09],[side*.13,3.7,.12],[-side*.34,6.1,.10],[side*.08,8.3,.03],[0,10.06,.0]],.060,0x477a37,52);for(let i=0;i<7;i++){const y=.65+i*1.34,x=(i%2?-1:1)*.26;const l=leaf(end,x,y,.12,.58,[0x6a9944,0x79a54c,0x90b35d][i%3],(i%2?-1:1)*.66);l.scale.x*=1.34;curve(end,[[0,y-.28,.12],[x*.6,y,.16],[x,y+.35,.19]],.019,0x416f31,12);}
  // Additional exterior vines stay visible after the user orbits behind the house.
  curve(root,[[side*10.77,.3,-1],[side*10.92,2.2,-2.1],[side*10.63,4.8,-.8],[side*10.90,7.8,-2.6],[side*10.62,10,-3.6]],.11,0x507e39,40);for(let i=0;i<8;i++)leaf(root,side*10.88,1.1+i*1.05,-1.5+Math.sin(i)*.7,.65,0x7ca84d,side*(i%2?.7:-.6));}
 for(let i=0;i<15;i++){const x=-10.08+i*1.44;ball(root,x,10.13,-6.44,.97,.47,.90,i%3===0?0x438741:i%3===1?0x62a845:0x78b550);ball(root,x+.35,9.82,-6.24,.53,.32,.41,0x72ad52);}

 // Left wall picture, winter wreath and the little string-hung note plaque.
 const picture=texture(256,352,(c,w,h)=>{c.fillStyle='#a9dff2';c.fillRect(0,0,w,h);c.fillStyle='#d4f4f6';for(let i=0;i<4;i++){c.beginPath();c.ellipse(32+i*57,37+(i%2)*15,40,19,0,0,Math.PI*2);c.fill();}c.fillStyle='#617eb3';c.beginPath();c.moveTo(2,322);c.lineTo(184,51);c.lineTo(249,350);c.fill();c.fillStyle='#d9f0f6';c.beginPath();c.moveTo(89,177);c.lineTo(186,45);c.lineTo(217,165);c.lineTo(178,122);c.lineTo(143,179);c.fill();c.save();c.translate(116,151);c.rotate(-.2);c.fillStyle='#fdf8dd';c.beginPath();c.ellipse(0,0,45,63,.1,0,Math.PI*2);c.fill();c.fillStyle='#df453d';c.beginPath();c.ellipse(-6,6,34,44,.1,0,Math.PI*2);c.fill();c.fillStyle='#f6bd36';c.beginPath();c.moveTo(29,-1);c.lineTo(62,6);c.lineTo(27,17);c.fill();c.fillStyle='#304945';c.beginPath();c.arc(9,-23,5,0,Math.PI*2);c.fill();c.restore();c.strokeStyle='#e7f7f7';c.lineWidth=7;c.strokeRect(6,6,w-12,h-12);});
 const pic=group(root,-9.00,6.17,-4.90);pic.rotation.y=.65;box(pic,0,0,0,1.90,2.72,.15,0x7eaca5);panel(pic,0,0,.086,1.73,2.52,picture);pic.rotation.z=.055;
 const note=group(root,-5.87,4.45,-6.69);beam(note,[-.88,.42,0],[0,1.47,0],.022,0x98744c);beam(note,[0,1.47,0],[.87,.42,0],.022,0x98744c);ball(note,0,1.49,0,.085,.08,.05,0xc3864d);box(note,0,0,.015,1.76,1.13,.13,0xc99d60);box(note,0,0,.097,1.51,.83,.08,P.cream);for(let i=0;i<3;i++)curve(note,[[-.55,.20-i*.20,.15],[-.28,.24-i*.20,.15],[0,.15-i*.20,.15],[.26,.21-i*.20,.15],[.51,.18-i*.20,.15]],.013,0xb88763,16);
 function wreath(p,x,y,z,r=.61){const g=group(p,x,y,z);torus(g,0,0,0,r,.15,0x34733d);for(let i=0;i<14;i++){const a=i*Math.PI*2/14;leaf(g,Math.sin(a)*r,Math.cos(a)*r,.09,.23,i%2?0x4b944f:0x78ad53,-a+.6);if(i%2===0)ball(g,Math.sin(a)*r,Math.cos(a)*r,.18,.075,.070,.05,P.red);}for(const side of [-1,1]){const bow=ball(g,side*.15,r*.79,.18,.19,.13,.08,0xd94b3f);bow.rotation.z=side*.5;const ribbon=box(g,side*.12,r*.25,.16,.13,.53,.035,P.red);ribbon.rotation.z=-side*.14;}ball(g,0,r*.76,.23,.09,.10,.065,0xef7762);return g;}
 const leftWreath=wreath(root,-8.18,4.11,-5.43,.69);leftWreath.rotation.y=.35;

 // Three tall orange arched windows, a festive wreath and a round target plaque.
 const trio=group(root,8.62,0,-5.37,'右后三联橙框拱窗');trio.rotation.y=-.61;
 for(const x of [-1.02,0,1.02]){shapeMesh(trio,arch(.83,4.21),.09,0x80cedd,x,2.54,0);archFrame(trio,x,2.50,.10,.99,4.39,.13,.13,0xe89054);archFrame(trio,x,2.59,.245,.80,4.18,.044,.05,0xffcc81);box(trio,x,4.32,.30,.065,3.35,.07,0xe7b16b);box(trio,x,4.45,.31,.72,.11,.07,0xffd48c);box(trio,x,3.36,.31,.72,.09,.065,0xffd48c);ball(trio,x,7.05,.16,.24,.13,.12,0xf4b779);ball(trio,x,6.91,.12,.33,.16,.14,0xf0a363);}
 wreath(trio,0,3.74,.37,.54);
 const target=group(trio,1.10,3.12,.45);target.rotation.z=.12;for(const [r,c,depth]of [[.62,0xf1c773,0],[.48,0x387994,.07],[.32,0x6ab2c6,.09],[.20,0xd65f42,.12]]){const a=cyl(target,0,0,depth,r,r,.085,c,32);a.rotation.x=Math.PI/2;}beam(target,[-.24,.92,.28],[.13,-.21,.26],.034,0x496976);star(target,-.24,.87,.30,.17,0x8fd2d7);
 const banner=group(trio,-1.54,6.25,.40);ball(banner,0,.37,0,.39,.36,.18,0x398b3d);for(const side of [-1,1]){ball(banner,side*.12,.38,.18,.090,.13,.035,P.white);ball(banner,side*.12,.38,.211,.026,.06,.02,0x394f32);}ball(banner,0,.61,.04,.17,.13,.13,0xe04749);for(const side of [-1,1])leaf(banner,side*.11,.83,.01,.17,P.cream,-side*.55);cyl(banner,0,-.19,0,.41,.40,.13,gold,24);for(const x of [-.27,0,.27]){const ribbon=box(banner,x,-1.18,0,.19,1.73,.045,x===0?0xdb72a0:0xef97b6);ribbon.rotation.z=x*.32;box(banner,x,-1.10,.027,.050,1.52,.015,0xf5bf73);}

 // The original rear row: gold fish, silver cup, little cat, round gold medal.
 const awards=group(root,0,0,0,'后排收藏奖杯');
 const fish=group(awards,-7.48,.05,-5.15);cyl(fish,0,.12,0,.43,.50,.23,gold,22);ball(fish,0,.93,0,.42,.72,.27,0xf0b329);ball(fish,.04,1.64,.03,.25,.25,.23,gold);for(const side of [-1,1]){ball(fish,side*.24,1.26,.09,.12,.17,.06,0xffd756);ball(fish,side*.28,1.41,.18,.065,.075,.029,0x9d6b22);}for(let row=0;row<4;row++)for(let col=0;col<3;col++){const r=torus(fish,(col-1)*.18,.62+row*.23,.26,.105,.016,0xc9861b);r.scale.y=.75;}curve(fish,[[-.17,1.83,.03],[-.28,2.01,.03],[-.05,2.09,.03],[.20,2.00,.03]],.065,0xf4bc37,16);
 const cup=group(awards,-6.20,.05,-5.26);cyl(cup,0,.14,0,.52,.61,.27,0x647d8e,22);cyl(cup,0,.40,0,.29,.37,.28,0x899ba1,20);cyl(cup,0,.88,0,.16,.25,.85,0x899da7,18);cyl(cup,0,1.65,0,.77,.23,1.00,0x8096a6,28,true);const cupRim=torus(cup,0,2.15,0,.77,.060,0xc8d6d2);cupRim.rotation.x=-Math.PI/2;ball(cup,0,1.94,0,.63,.13,.62,0x56697c);box(cup,0,.40,.51,.91,.20,.044,0x5b65a0);
 const cat=group(awards,-5.24,.06,-5.36);cyl(cat,0,.10,0,.36,.44,.18,gold,20);ball(cat,0,.62,0,.33,.45,.27,0xc98924);ball(cat,0,1.15,.035,.36,.31,.27,0xd89d30);for(const side of [-1,1]){const ear=mesh(cat,new THREE.ConeGeometry(.17,.31,3),0xc18328,side*.25,1.45,0);ear.rotation.y=side*.25;ball(cat,side*.13,1.17,.277,.044,.065,.027,0x765123);ball(cat,side*.28,.60,.08,.13,.26,.13,gold);}ball(cat,0,1.07,.303,.081,.055,.049,0x976229);curve(cat,[[.24,.32,0],[.53,.39,-.1],[.57,.82,-.07],[.38,.95,-.04]],.068,0xd9972a,20);
 const medal=group(awards,-4.41,.05,-5.22);cyl(medal,0,.10,0,.41,.48,.20,gold,22);cyl(medal,0,.38,0,.09,.14,.53,gold,16);const disc=cyl(medal,0,1.04,0,.58,.58,.15,gold,32);disc.rotation.x=Math.PI/2;torus(medal,0,1.04,.115,.50,.043,0xffda62);torus(medal,0,1.04,.125,.42,.021,0xc38c28);ball(medal,0,1.01,.149,.25,.26,.045,0xe0a32a);for(const side of [-1,1]){ball(medal,side*.095,1.01,.20,.059,.105,.023,0xffd867);leaf(medal,side*.1,1.37,.165,.18,0xffd460,-side*.61);}

 // A little decorated Christmas tree stands in front of the garden window.
 const tree=group(root,-2.91,.05,-4.76,'圣诞树');cyl(tree,0,.20,0,.47,.40,.40,0xe6d9b6,24);cyl(tree,0,.30,0,.49,.49,.16,0x527e84,24);cyl(tree,0,.77,0,.12,.18,1.10,P.woodDark,12);
 for(const [y,r,h]of [[1.02,.92,1.24],[1.65,.76,1.22],[2.22,.56,1.19]]){cyl(tree,0,y,0,.05,r,h,0x348347,18);const pts=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI*2;pts.push([Math.sin(a)*r,y-h/2+.10+Math.cos(a*7)*.035,Math.cos(a)*r]);}curve(tree,pts,.045,0x87b971,48);}
 const lights=[];for(let i=0;i<=110;i++){const t=i/110,a=t*Math.PI*7,r=.84*(1-t)+.12;lights.push([Math.sin(a)*r,.48+t*2.27,Math.cos(a)*r]);}curve(tree,lights,.023,0xf6e7aa,90);
 for(let i=0;i<25;i++){const t=(i+.3)/26,a=t*Math.PI*7,r=.85*(1-t)+.15;ball(tree,Math.sin(a)*r,.54+t*2.29,Math.cos(a)*r,.070,.077,.068,[0xe95462,0xfde8c8,0xfac34b,0xd78fcd][i%4]);}star(tree,0,3.04,0,.34,0xffd842);

 // Central aquarium: thick sculpted tree roots, oval blue basin and white fish.
 const tank=group(root,.02,.05,-4.31,'树根大鱼缸');cyl(tank,0,.74,0,1.30,1.55,1.45,0x9e652d,24);
 for(let i=0;i<10;i++){const a=i*Math.PI*2/10;curve(tank,[[Math.sin(a)*1.03,1.53,Math.cos(a)*.72],[Math.sin(a)*1.26,.81,Math.cos(a)*.91],[Math.sin(a)*1.83,.10,Math.cos(a)*1.18]],.20,i%2?0xb77c32:0x956029,22);curve(tank,[[Math.sin(a)*1.10,1.39,Math.cos(a)*.78],[Math.sin(a)*1.31,.65,Math.cos(a)*.95],[Math.sin(a)*1.67,.21,Math.cos(a)*1.10]],.034,0x754521,20);}
 const bowlShape=[new THREE.Vector2(.54,1.40),new THREE.Vector2(.67,1.46),new THREE.Vector2(.91,1.81),new THREE.Vector2(1,2.13)];const bowl=mesh(tank,new THREE.LatheGeometry(bowlShape,48),mat(0x62bde5,{roughness:.29,side:THREE.DoubleSide}));bowl.scale.set(1.98,1,1.14);
 for(const [y,rx,rz,t,c]of [[2.16,2.01,1.15,.10,P.cream],[2.04,1.95,1.11,.050,0xd8874e],[1.47,1.34,.80,.038,0xe4ad64]]){const rim=torus(tank,0,y,0,1,t,c);rim.rotation.x=-Math.PI/2;rim.scale.set(rx,rz,1);}
 const water=mesh(tank,new THREE.CircleGeometry(1,64),mat(0x78c4e5,{roughness:.20,metalness:.04}),0,2.17,0);water.rotation.x=-Math.PI/2;water.scale.set(1.88,1.025,1);
 function flatFish(x,z,s,rotation){const g=group(tank,x,2.189,z);g.rotation.y=rotation;g.scale.setScalar(s);ball(g,.14,.02,0,.64,.025,.24,P.white);const shape=new THREE.Shape();shape.moveTo(-.39,0);shape.lineTo(-.82,.28);shape.quadraticCurveTo(-.62,0,-.82,-.28);shape.closePath();const tail=shapeMesh(g,shape,.016,P.white,-.0,0,0);tail.rotation.x=-Math.PI/2;ball(g,.53,.054,-.049,.035,.012,.037,0x99aebe);curve(g,[[-.02,.047,-.17],[.10,.058,-.26],[.30,.047,-.18]],.018,0xc3d9dc,14);}
 flatFish(-.34,-.38,1.03,.26);flatFish(.32,.41,.86,Math.PI+.23);
 for(const [x,z,r]of [[-1.04,.43,.14],[1.11,-.36,.18],[.67,-.67,.10]]){const rip=torus(tank,x,2.20,z,r,.017,0xccecf2);rip.rotation.x=-Math.PI/2;rip.scale.y=.54;}
 const frontFish=group(tank,-.64,1.77,.96);frontFish.rotation.x=-.31;ball(frontFish,0,0,0,.32,.42,.06,P.cream);for(const x of [-.16,0,.16])curve(frontFish,[[x,-.24,.07],[x-.01,.05,.075],[x+.02,.22,.065]],.031,0xe89453,15);
 const blueFace=group(tank,1.05,1.33,.85);blueFace.rotation.y=.29;ball(blueFace,0,0,0,.39,.30,.085,0x37619b);for(const side of [-1,1]){const eye=ball(blueFace,side*.15,.015,.075,.15,.098,.042,P.white);eye.rotation.z=-side*.34;}ball(blueFace,0,-.14,.097,.079,.041,.030,P.purple);

 // Three expressive faces of the carved rear-right totem.
 const tiki=group(root,4.14,.05,-4.89,'多脸木雕图腾');
 for(const [y,h,c,r]of [[.47,.86,0x508ca7,.50],[1.62,1.20,0x68a744,.59],[3.05,1.52,0xb9772d,.66]])cyl(tiki,0,y,0,r,r*.88,h,c,12);
 cyl(tiki,0,3.88,0,.75,.71,.18,0x8f612c,20);ball(tiki,0,4.02,-.02,.73,.17,.44,0xb68b45);
 for(const [y,w,white,c]of [[.50,.22,0xe7f3cb,0x224859],[1.73,.29,0xeef5d1,0x344e27],[3.19,.27,0xffe9b0,0x573a23]]){for(const side of [-1,1]){const eye=ball(tiki,side*.23,y+.09,.52,w,.15,.055,white);eye.rotation.z=-side*.37;ball(tiki,side*.23,y+.075,.57,.048,.09,.026,c);beam(tiki,[side*.02,y+.31,.55],[side*.47,y+.47,.41],.055,0x684322);}ball(tiki,0,y-.09,.57,.14,.15,.095,c);box(tiki,0,y-.32,.49,.62,.20,.10,0x543f25);for(const x of [-.20,0,.20])box(tiki,x,y-.30,.56,.12,.13,.030,0xf4e3a8);}
 for(const side of [-1,1]){const wing=box(tiki,side*.99,3.30,.04,.99,.56,.15,0xc78638);wing.rotation.z=-side*.08;for(let i=0;i<3;i++)box(tiki,side*.99,3.11+i*.16,.13,.85,.035,.025,0x895426);}

 // Potted stems and the bright watermelon flower at the right of the collection.
 function pot(x,z,s=1){const g=group(root,x,.05,z);g.scale.setScalar(s);cyl(g,0,.37,0,.39,.26,.63,0x977047,22);cyl(g,0,.72,0,.44,.44,.14,0xc5a77b,22);cyl(g,0,.78,0,.36,.36,.04,0x70583c,20);return g;}
 for(const [x,z,s]of [[6.35,-3.14,.88],[7.51,-3.15,1.04],[8.64,-2.89,.83]]){const p=pot(x,z,s);curve(p,[[0,.77,0],[-.12,1.21,0],[.10,1.65,0],[.01,2.22,0]],.052,0x538c36,22);for(const [xx,y,a]of [[-.22,1.23,-.65],[.22,1.65,.69]])leaf(p,xx,y,.02,.26,0x7fab44,a);}
 const melon=pot(8.36,-3.50,.82);curve(melon,[[0,.75,0],[.12,1.47,0],[.40,1.73,0],[.12,2.11,0]],.115,0xe4aa37,24);ball(melon,.06,2.49,.07,.73,.62,.16,0x389c43);ball(melon,.06,2.56,.212,.63,.51,.058,0xf16b92);for(let i=0;i<13;i++){const a=i*2.3,r=.14+(i%4)*.12;ball(melon,.06+Math.sin(a)*r,2.60+Math.cos(a)*r*.67,.278,.023,.046,.015,0xb34369);}for(let i=0;i<6;i++){const x=-.50+i*.22;leaf(melon,x,2.20,.27,.27,0x81cb51,(i-2.5)*.12);}

 // Real left-front doorway leads back outside, with clearance into the room.
 const door=group(root,-10.23,0,4.40,'通往家园花园的门');door.rotation.y=Math.PI/2;archFrame(door,0,.03,0,2.22,3.29,.17,.34,P.woodDark);archFrame(door,0,.03,.35,2.20,3.27,.075,.07,0xf1ce87);box(door,0,.035,-.68,1.93,.09,1.58,0xb1ca60);for(const side of [-1,1])box(door,side*1.10,1.45,-.48,.20,2.91,1.13,bark);
 const outdoor=mesh(door,new THREE.PlaneGeometry(1.91,2.83),mat(0xc8e493,{side:THREE.DoubleSide}),0,1.44,-1.09);outdoor.castShadow=false;
 const furniture=addHomeFurniture(root)||{};
 const backColliders=[{x:-6.10,z:-5.24,rx:2.01,rz:.68},{x:-2.91,z:-4.76,rx:.91,rz:.90,kind:'ellipse'},
  {x:.02,z:-4.31,rx:1.98,rz:1.28,kind:'ellipse'},{x:4.14,z:-4.89,rx:.83,rz:.68,kind:'ellipse'},
  {x:6.35,z:-3.14,rx:.42,rz:.40,kind:'ellipse'},{x:7.51,z:-3.15,rx:.45,rz:.44,kind:'ellipse'},{x:8.64,z:-2.89,rx:.40,rz:.38,kind:'ellipse'}];
 return {root,indoor:true,background:0xa8d5be,spawn:[0,.05,4.8],bounds:{minX:-10.0,maxX:10.0,minZ:-6.75,maxZ:7.40},
  heightAt:()=>.05,walkable:(x,z)=>{const dx=Math.max(Math.abs(x)-7.02,0),dz=Math.max(Math.abs(z-.35)-4.16,0);return dx*dx+dz*dz<3.20**2;},
  colliders:[...backColliders,...(furniture.colliders||[])],portalLocations:{home:[-8.5,.05,5.8]},dynamic:furniture.dynamic||[],updates:furniture.updates||[],
  camera:{perspectivePosition:[.13,16.60,22.0],perspectiveTarget:[0,3.20,-.10],fov:37,wideZoom:.92,wideLift:.55,span:23.2,position:[0,24,29],target:[0,3.20,-.10]}};
}
