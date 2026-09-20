import * as THREE from 'three';

// Every material/geometry belongs to this room so visiting another destination
// can release it. The only paintings are small surface details, never scenery.
export function createRamClassroomScene() {
  const root=new THREE.Group();root.name='拉姆树洞教室';
  const materials=new Map(),geometries=new Map();
  const P={wood:0xb88830,woodLight:0xd3a447,woodPale:0xe2bc65,woodDark:0x6d4b20,
    bark:0x8b6626,barkDark:0x533c19,edge:0x644719,gold:0xd3a234,goldLight:0xf1ce61,
    leaf:0x71972c,leafLight:0x9ab740,cream:0xf5e7b4,blue:0x70afd3,black:0x253436};
  function material(c,e={}){const k=String(c)+Object.keys(e).sort().map(k=>k+':'+(e[k]?.isTexture?e[k].uuid:e[k])).join('|');if(!materials.has(k))materials.set(k,new THREE.MeshStandardMaterial({color:c,roughness:.84,...e}));return materials.get(k);}
  function geometry(k,f){if(!geometries.has(k))geometries.set(k,f());return geometries.get(k);}
  function group(p=root,x=0,y=0,z=0,name=''){const g=new THREE.Group();g.position.set(x,y,z);g.name=name;p.add(g);return g;}
  function mesh(p,g,c,x=0,y=0,z=0){const m=new THREE.Mesh(g,c?.isMaterial?c:material(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
  function box(p,x,y,z,w,h,d,c){const m=mesh(p,geometry('box',()=>new THREE.BoxGeometry(1,1,1)),c,x,y,z);m.scale.set(w,h,d);return m;}
  function ball(p,x,y,z,rx,ry,rz,c){const m=mesh(p,geometry('ball',()=>new THREE.SphereGeometry(1,14,9)),c,x,y,z);m.scale.set(rx,ry,rz);return m;}
  function cylinder(p,x,y,z,rt,rb,h,c,n=20,open=false){return mesh(p,geometry(['c',rt,rb,h,n,open].join(','),()=>new THREE.CylinderGeometry(rt,rb,h,n,1,open)),c,x,y,z);}
  function torus(p,x,y,z,r,t,c){return mesh(p,geometry(['t',r,t].join(','),()=>new THREE.TorusGeometry(r,t,5,36)),c,x,y,z);}
  function beam(p,a,b,r,c){const aa=new THREE.Vector3(...a),bb=new THREE.Vector3(...b),d=bb.clone().sub(aa);const m=mesh(p,geometry('beam',()=>new THREE.CylinderGeometry(1,1,1,8)),c);m.position.copy(aa.add(bb).multiplyScalar(.5));m.scale.set(r,d.length(),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
  function curve(p,points,r,c,n=20){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),n,r,5,false),c);}
  function tex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=2;return t;}
  function panel(p,x,y,z,w,h,t){return mesh(p,geometry('plane:'+w+':'+h,()=>new THREE.PlaneGeometry(w,h)),material(0xffffff,{map:t}),x,y,z);}
  const gold=material(P.gold,{metalness:.30,roughness:.40}),silver=material(0xa8bdc0,{metalness:.37,roughness:.36});
  const glass=material(0xc9eef5,{transparent:true,opacity:.26,roughness:.15,metalness:.05,depthWrite:false,side:THREE.DoubleSide});
  let seed=942;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);

  const barkTexture=tex(1024,512,(c,w,h)=>{
    c.fillStyle='#896428';c.fillRect(0,0,w,h);
    for(let i=-1;i<31;i++){const x=i*37;for(let band=0;band<2;band++){c.beginPath();for(let j=0;j<=30;j++){const y=j*h/30,xx=x+Math.sin(y*.010+i*.8)*18+Math.sin(y*.028+i)*5;if(j)c.lineTo(xx,y);else c.moveTo(xx,y);}for(let j=30;j>=0;j--){const y=j*h/30;c.lineTo(x+(band?5:16)+Math.sin(y*.010+i*.8+.4)*18+Math.sin(y*.028+i+.1)*5,y);}c.closePath();c.fillStyle=band?'#ad8739':['#694a20','#b58b36','#9a7428','#5f451f'][((i%4)+4)%4];c.fill();}}
    for(const [x,y,rx,ry] of [[109,320,22,107],[326,138,17,98],[681,291,24,126],[854,104,18,83]]){c.save();c.translate(x,y);c.rotate(.13);for(let i=3;i>=0;i--){c.fillStyle=['#4b381a','#785520','#c5a451','#6a4c20'][i];c.beginPath();c.ellipse(0,0,rx*(.28+i*.25),ry*(.26+i*.24),0,0,Math.PI*2);c.fill();}c.restore();}
  });
  barkTexture.wrapS=THREE.RepeatWrapping;
  const bark=material(0xffffff,{map:barkTexture,bumpMap:barkTexture,bumpScale:.055,roughness:.97});
  const grainTexture=tex(512,128,(c,w,h)=>{c.fillStyle='#d2a34a';c.fillRect(0,0,w,h);for(let i=0;i<23;i++){const y=i*6;c.beginPath();for(let j=0;j<=32;j++){const x=j*w/32,yy=y+Math.sin(x*.025+i)*1.1+Math.sin(x*.011+i*2)*2.2;if(j)c.lineTo(x,yy);else c.moveTo(x,yy);}c.lineWidth=i%4===0?1.2:.55;c.strokeStyle=i%4===0?'#af7f30':'#c3963d';c.stroke();}c.strokeStyle='#ad7e32';c.lineWidth=1.2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(147,57,15+i*12,2+i*2.1,.03,0,Math.PI*2);c.stroke();}});
  grainTexture.wrapS=grainTexture.wrapT=THREE.RepeatWrapping;
  const wood=material(0xffffff,{map:grainTexture,roughness:.91,bumpMap:grainTexture,bumpScale:.015});

  // Thick curved tree shell, including an exterior surface, top and exposed ends.
  // A real left-front doorway and high circular window perforate the shell.
  const minA=-2.02,maxA=1.83,wallH=10.15,doorA=-1.82,windowA=.35,windowY=7.62;
  function wallPoint(a,y,outer=false){const ripple=.08*Math.sin(a*12+y*.36)+.10*Math.sin(a*5-y*.25),extra=outer?.42:0;return [Math.sin(a)*(9.95+ripple+extra),y,-Math.cos(a)*(7.9+ripple+extra)];}
  function cutout(a,y){const dx=(a-doorA)*9.8,r=1.06;const doorTop=Math.abs(dx)<r?2.10+Math.sqrt(Math.max(0,r*r-dx*dx)):0;return y<doorTop||(((a-windowA)*9.8)**2+(y-windowY)**2<2.07**2);}
  for(const outer of [false,true]){const ps=[],uv=[],ix=[],nx=132,ny=48;for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const a=minA+i/nx*(maxA-minA),y=j/ny*wallH;ps.push(...wallPoint(a,y,outer));uv.push(i/nx*1.5,j/ny);if(i<nx&&j<ny&&!cutout(a+(maxA-minA)/nx*.5,y+wallH/ny*.5)){const k=j*(nx+1)+i;if(outer)ix.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);else ix.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();mesh(root,g,bark).name=outer?'粗树皮外壁':'弧形树洞内壁';}
  for(const a of [minA,maxA]){const points=[wallPoint(a,0),wallPoint(a,wallH),wallPoint(a,wallH,true),wallPoint(a,0,true)],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();mesh(root,g,material(P.woodLight,{side:THREE.DoubleSide}));}
  const topPoints=[];for(let i=0;i<=100;i++){const a=minA+(maxA-minA)*i/100;topPoints.push(wallPoint(a,wallH));}curve(root,topPoints,.16,P.woodPale,100);
  for(const [a,y,s] of [[-1.65,7.6,.65],[-1.21,5.3,.45],[-.74,8.3,.55],[.87,6.8,.47],[1.37,3.8,.66]]){const p=wallPoint(a,y);const g=group(root,...p);g.rotation.y=-a;ball(g,0,0,.03,s*.30,s*1.25,.11,P.barkDark);for(const [scale,c] of [[1,P.woodDark],[.76,P.woodLight]]){const r=torus(g,0,0,.07,1,.078,c);r.scale.set(s*.54*scale,s*1.72*scale,.8);}curve(g,[[-s*.45,-s*2.5,0],[-s*.67,-s*.20,.05],[-s*.35,s*1.8,0],[0,s*3.4,-.04]],.045,P.woodPale,20);}
  for(const a of [-1.55,-1.20,-.65,.0,.63,1.17,1.60]){const [x,,z]=wallPoint(a,0),g=group(root,x,0,z);g.rotation.y=-a;for(const side of [-1,1]){const m=ball(g,side*.38,.42,.67,.42,.56,1.60,P.bark);m.rotation.y=side*.44;curve(g,[[side*.14,1.22,0],[side*.40,.54,.6],[side*.68,.15,1.90]],.055,P.woodLight,18);}const ext=ball(g,0,.55,-.56,.70,.70,1.20,bark);ext.rotation.x=-.20;}

  // True separate diagonal planks, clipped against the room's elliptical floor.
  const floorBase=cylinder(root,0,-.11,.10,1,1,.25,P.edge,96);floorBase.scale.set(10.02,1,8.30);
  function clip(poly){for(let i=0;i<80&&poly.length;i++){const a=i/80*Math.PI*2,b=(i+1)/80*Math.PI*2,A=[Math.cos(a)*9.96,.10+Math.sin(a)*8.25],B=[Math.cos(b)*9.96,.10+Math.sin(b)*8.25],res=[];const cross=p=>(B[0]-A[0])*(p[1]-A[1])-(B[1]-A[1])*(p[0]-A[0]);for(let k=0;k<poly.length;k++){const p=poly[k],q=poly[(k+1)%poly.length],cp=cross(p),cq=cross(q);if(cp>=0)res.push(p);if((cp>=0)!==(cq>=0)){const t=cp/(cp-cq);res.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}}poly=res;}return poly;}
  const ca=Math.cos(.31),sa=Math.sin(.31),turn=(u,v)=>[u*ca-v*sa,u*sa+v*ca];
  for(let col=-12;col<13;col++)for(let row=-4;row<4;row++){const u=col*.98,v=row*3.60+(col%2)*1.80,poly=clip([[u+.025,v+.025],[u+.955,v+.025],[u+.955,v+3.575],[u+.025,v+3.575]].map(p=>turn(...p)));if(poly.length<3)continue;const pos=[],uv=[],ix=[];for(const [x,z]of poly){pos.push(x,.025,z);uv.push((x*ca+z*sa)*.33,(-x*sa+z*ca)*.15);}for(let j=1;j<poly.length-1;j++)ix.push(0,j+1,j);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();mesh(root,g,material([0xf4edda,0xfbf0d5,0xe4d6b8,0xe6d8be,0xf1e4c6][(col*7+row+200)%5],{map:grainTexture}));for(const vv of [v+.16,v+3.44]){const [x,z]=turn(u+.26,vv);if((x/9.75)**2+((z-.1)/8.04)**2<1){ball(root,x,.040,z,.041,.008,.041,0x6b501f);const [xx,zz]=turn(u+.70,vv);ball(root,xx,.040,zz,.041,.008,.041,0x6b501f);}}}

  // High left-hand laboratory deck: a broad rectangular gallery with real posts.
  const deck=group(root,-5.74,0,-2.54,'左侧二层实验木平台');
  box(deck,0,3.12,0,6.65,.37,5.72,P.woodDark);box(deck,0,3.34,0,6.75,.13,5.82,P.woodPale);
  for(let i=0;i<11;i++)box(deck,-3.03+i*.604,3.43,0,.575,.095,5.70,wood);
  for(const x of [-3.06,2.99])for(const z of [-2.57,2.55]){box(deck,x,1.56,z,.43,3.12,.47,P.woodDark);box(deck,x,1.60,z+.255,.15,2.83,.035,P.woodLight);box(deck,x,.18,z,.65,.32,.67,P.edge);}
  box(deck,-.05,2.94,2.85,6.8,.33,.20,P.wood);box(deck,-3.37,2.94,0,.20,.33,5.9,P.wood);
  function railPost(p,x,y,z){cylinder(p,x,y+.56,z,.063,.090,1.13,P.woodLight,10);cylinder(p,x,y+.07,z,.145,.145,.095,P.woodDark,12);cylinder(p,x,y+.135,z,.114,.14,.075,P.woodPale,12);ball(p,x,y+1.19,z,.145,.145,.145,P.woodPale);}
  function rail(p,a,b){beam(p,[a[0],a[1]+1.15,a[2]],[b[0],b[1]+1.15,b[2]],.10,P.woodDark);beam(p,[a[0],a[1]+1.21,a[2]],[b[0],b[1]+1.21,b[2]],.072,P.woodPale);}
  for(const z of [-2.77,2.77]){const end=z>0?1.71:3.18;for(let x=-3.18;x<=end+.01;x+=.81)railPost(deck,x,3.46,z);rail(deck,[-3.20,3.46,z],[end,3.46,z]);}
  for(const x of [-3.20,3.18]){for(let z=-2.72;z<2.76;z+=.78)railPost(deck,x,3.46,z);rail(deck,[x,3.46,-2.80],[x,3.46,2.80]);}
  // Ten short risers descend towards the open foreground, with two sloping rails.
  const stairX=-3.31,stairTopZ=.33,stairBottomZ=4.28,stepDepth=.395;
  for(let i=0;i<10;i++){const top=(10-i)*.345,z=stairTopZ+(i+.5)*stepDepth;box(root,stairX,top-.15,z,1.28,.30,stepDepth+.012,P.wood);box(root,stairX,top+.018,z,1.36,.058,stepDepth-.025,wood);box(root,stairX,top-.01,z+.17,1.37,.075,.065,P.woodPale);}
  for(const side of [-1,1]){const x=stairX+side*.73;beam(root,[x,.05,4.29],[x,3.26,.39],.105,P.woodDark);for(let i=0;i<=5;i++){const t=i/5,z=4.34-t*3.98,y=t*3.45;railPost(root,x,y,z);}rail(root,[x,0,4.34],[x,3.45,.36]);}

  // Table, little stools, blue/amber tea vessels and a rack of glass test tubes.
  function stool(p,x,y,z,rot=0){const g=group(p,x,y,z,'方形小木凳');g.rotation.y=rot;box(g,0,.49,0,.70,.16,.63,P.woodLight);for(const sx of [-1,1])for(const sz of [-1,1]){const leg=box(g,sx*.23,.24,sz*.20,.12,.49,.12,P.wood);leg.rotation.z=sx*-.10;}box(g,0,.16,0,.53,.07,.09,P.woodDark);for(const x of [-.23,.23])ball(g,x,.578,.18,.027,.007,.027,P.edge);}
  const lab=group(deck,-.20,3.49,-.52,'实验长桌');
  box(lab,0,1.12,0,4.65,.28,1.55,P.woodDark);box(lab,0,1.30,0,4.82,.11,1.67,P.woodPale);
  for(let j=0;j<3;j++)box(lab,0,1.372,-.55+j*.55,4.70,.035,.52,wood);
  for(const x of [-2.0,2.0])for(const z of [-.59,.59]){box(lab,x,.58,z,.24,1.16,.24,P.wood);box(lab,x,.15,z,.32,.13,.31,P.woodDark);}box(lab,0,.49,0,4.1,.15,.16,P.woodDark);
  for(const [x,z,r]of [[-2.31,-2.06,.03],[.07,-2.13,0],[2.14,-1.83,.18],[-2.23,1.04,-.13],[-.16,1.28,.07],[1.82,.98,-.13]])stool(deck,x,3.49,z,r);
  const rack=group(lab,-1.27,1.39,.14);box(rack,0,.045,0,.83,.08,.56,P.woodDark);for(const x of [-.39,.39])box(rack,x,.35,0,.07,.65,.34,P.woodLight);box(rack,0,.61,0,.89,.07,.37,P.wood);
  for(let i=0;i<3;i++){const x=(i-1)*.235;cylinder(rack,x,.40,0,.057,.057,.48,glass,12,true);ball(rack,x,.16,0,.057,.060,.057,glass);cylinder(rack,x,.26,0,.047,.047,.14,material([0xd99249,0x75c4db,0xa1bf49][i],{transparent:true,opacity:.76}),12);const rim=torus(rack,x,.66,0,.058,.012,0xe0f1d7);rim.rotation.x=-Math.PI/2;}
  function teapot(p,x,y,z,color,s=.42){const g=group(p,x,y,z);g.scale.setScalar(s);ball(g,0,.44,0,.50,.46,.42,color);cylinder(g,0,.86,0,.34,.37,.09,color,20);ball(g,0,.98,0,.12,.10,.12,P.goldLight);curve(g,[[.32,.33,0],[.73,.31,0],[.77,.73,0]],.115,color);const handle=torus(g,-.48,.47,0,.29,.08,color);handle.scale.x=.75;ball(g,-.13,.59,.36,.075,.15,.025,0xeaf1c4);}
  teapot(lab,.24,1.40,-.06,gold,.57);teapot(lab,1.34,1.40,-.06,0x6f9ebe,.69);
  for(const [x,z,c]of [[-.05,.48,P.goldLight],[.49,.46,P.gold],[1.39,.49,0x97bfd0],[1.94,.13,0x75a1bd]]){cylinder(lab,x,1.415,z,.22,.22,.045,c,20);cylinder(lab,x,1.53,z,.115,.105,.20,c,16,true);const h=torus(lab,x+.12,1.54,z,.075,.020,c);}

  // A blue cylindrical bubbling tank with wide antique gold collars.
  const tank=group(root,-1.05,.30,-5.30,'蓝色拉姆观察水槽');
  cylinder(tank,0,.13,0,1.02,1.11,.26,P.woodDark,36);cylinder(tank,0,.39,0,.97,1.08,.22,gold,36);
  for(const y of [.62,.81,1.05])cylinder(tank,0,y,0,1.07,1.07,.14,y===.81?P.woodDark:gold,36);
  cylinder(tank,0,3.27,0,.99,.96,4.40,material(0x5899c4,{transparent:true,opacity:.42,roughness:.18,depthWrite:false,side:THREE.DoubleSide}),40,true);
  const inner=cylinder(tank,0,3.25,0,.79,.79,4.32,material(0x72acd3,{transparent:true,opacity:.31,roughness:.28,depthWrite:false}),32);inner.castShadow=false;
  cylinder(tank,0,5.58,0,1.09,1.02,.27,P.woodDark,36);cylinder(tank,0,5.79,0,1.16,1.16,.18,gold,36);cylinder(tank,0,6.00,0,.95,1.06,.24,P.woodDark,36);cylinder(tank,0,6.18,0,1.07,1.03,.17,P.woodLight,36);cylinder(tank,0,6.30,0,.90,.96,.10,0x9b9880,36);
  const topRing=torus(tank,0,6.36,0,.91,.07,gold);topRing.rotation.x=-Math.PI/2;
  cylinder(tank,0,1.15,0,.68,.72,.19,0x829582,28);
  for(let i=0;i<15;i++){const a=i*2.399,r=.13+((i*7)%9)*.057;ball(tank,Math.cos(a)*r,1.19+(i%3)*.055,Math.sin(a)*r,.065,.033,.062,0xdddcc5);}
  for(let i=0;i<22;i++){const y=1.3+i*.185,x=Math.sin(i*1.3)*.24,z=.2+Math.cos(i*1.7)*.19,r=.032+(i%4)*.012;ball(tank,x,y,z,r,r*1.1,r,material(0xeffaf0,{transparent:true,opacity:.8,roughness:.10}));}
  curve(tank,[[-.48,1.40,.76],[-.57,2.49,.77],[-.51,3.69,.79],[-.58,4.93,.80]],.027,0xb0d2df,18);

  // Trophy/specimen cupboard beside the stairs, with actual shelves and glazing.
  const cupboard=group(root,-1.05,0,-.20,'奖杯与图纸标本木柜');cupboard.rotation.y=-.08;
  box(cupboard,0,1.44,0,1.98,2.89,.90,P.woodDark);box(cupboard,0,1.45,.04,1.73,2.62,.89,0xc6a65b);
  for(const x of [-.99,.99])box(cupboard,x,1.52,.01,.17,2.95,1.05,P.woodLight);
  box(cupboard,0,3.02,0,2.25,.21,1.18,P.woodLight);box(cupboard,0,3.15,0,2.14,.075,1.09,wood);
  box(cupboard,0,.16,.10,2.13,.20,1.01,P.wood);for(const y of [.32,1.42,2.77])box(cupboard,0,y,.07,1.90,.11,.96,P.woodPale);
  for(const x of [-.87,0,.87])box(cupboard,x,1.56,.555,.060,2.40,.060,P.woodPale);
  for(const y of [.37,1.46,2.75])box(cupboard,0,y,.56,1.85,.055,.055,P.woodDark);
  box(cupboard,0,1.57,.525,1.77,2.33,.035,material(0xd8e2bc,{transparent:true,opacity:.20,roughness:.28,depthWrite:false}));
  const specimen=tex(384,256,(c,w,h)=>{c.fillStyle='#ede6cb';c.fillRect(0,0,w,h);c.fillStyle='#89ad87';c.fillRect(11,12,97,26);c.fillStyle='#9c8a60';for(let i=0;i<5;i++)c.fillRect(19,65+i*22,101-(i%3)*16,3);c.strokeStyle='#838267';c.lineWidth=3;c.strokeRect(162,36,182,186);c.strokeStyle='#749c73';c.beginPath();c.moveTo(248,198);c.bezierCurveTo(222,123,271,95,247,60);c.stroke();for(let i=0;i<4;i++){c.save();c.translate(249,91+i*25);c.rotate(i%2?.4:-.4);c.fillStyle=i%2?'#abbe84':'#8bac79';c.beginPath();c.ellipse((i%2?1:-1)*19,0,24,9,i%2?-.55:.55,0,Math.PI*2);c.fill();c.restore();}});
  for(const [x,y,r]of [[-.41,.87,.08],[.39,2.03,-.045]]){const a=panel(cupboard,x,y,.574,.80,.75,specimen);a.rotation.z=r;}
  const butterfly=group(cupboard,.42,.80,.51);for(const side of [-1,1]){const wing=ball(butterfly,side*.16,.05,0,.20,.24,.015,0xc0b399);wing.rotation.z=side*.42;ball(butterfly,side*.13,-.17,0,.14,.11,.02,0xc8baa6);}box(butterfly,0,0,.025,.033,.35,.015,P.woodDark);
  function trophy(p,x,y,z,c,s){const g=group(p,x,y,z,'奖杯');g.scale.setScalar(s);box(g,0,.09,0,.55,.17,.49,P.woodDark);cylinder(g,0,.26,0,.24,.29,.19,c,18);cylinder(g,0,.55,0,.070,.090,.46,c,14);ball(g,0,.93,0,.36,.40,.29,c);cylinder(g,0,1.20,0,.36,.30,.12,c,22,true);const lip=torus(g,0,1.26,0,.36,.040,c);lip.rotation.x=-Math.PI/2;for(const side of [-1,1])curve(g,[[side*.30,1.12,0],[side*.61,1.12,0],[side*.60,.82,0],[side*.30,.76,0]],.060,c,14);}
  trophy(cupboard,-.52,3.21,.0,gold,.87);trophy(cupboard,.56,3.21,.04,silver,.72);

  // Bowed teacher's dais and an unusually broad charcoal blackboard.
  const dais=group(root,3.30,0,-4.82,'黑板前弧边讲台');
  const stageShape=new THREE.Shape();stageShape.moveTo(-4.0,-1.60);stageShape.lineTo(3.94,-1.60);stageShape.lineTo(3.94,.67);stageShape.quadraticCurveTo(3.89,1.60,2.9,1.67);stageShape.lineTo(-3.34,1.67);stageShape.quadraticCurveTo(-4.0,1.61,-4.0,1.00);stageShape.closePath();
  const stageGeo=new THREE.ExtrudeGeometry(stageShape,{depth:.34,bevelEnabled:false,curveSegments:14});const stage=mesh(dais,stageGeo,P.woodDark,0,0,0);stage.rotation.x=-Math.PI/2;
  const stageTop=mesh(dais,new THREE.ShapeGeometry(stageShape,14),P.woodLight,0,.35,0);stageTop.rotation.x=-Math.PI/2;
  // World z is the negated shape y. Fine seams follow the stage's long boards.
  for(let i=0;i<28;i++){const x=-3.81+i*.274;box(dais,x,.366,-.04,.019,.018,2.65,P.woodDark);for(const z of [-1.24,1.18])ball(dais,x+.09,.38,z,.024,.007,.024,P.woodDark);}
  const blackboard=group(root,3.24,0,-6.33,'LAHM 黑板');blackboard.rotation.y=-.23;
  box(blackboard,0,3.87,0,6.13,3.04,.25,P.woodDark);box(blackboard,0,3.89,.16,5.83,2.76,.10,0x222f30);
  for(const x of [-3.03,3.03])box(blackboard,x,3.89,.19,.13,3.10,.18,P.goldLight);for(const y of [2.36,5.43])box(blackboard,0,y,.20,6.17,.13,.20,P.woodPale);
  box(blackboard,0,2.33,.34,6.2,.11,.38,P.woodDark);box(blackboard,.79,2.45,.41,.39,.13,.17,0x467452);box(blackboard,.46,2.43,.48,.23,.045,.043,0xebebd6);
  const chalk=tex(768,384,(c,w,h)=>{c.fillStyle='#263435';c.fillRect(0,0,w,h);c.strokeStyle='rgba(223,229,213,.028)';for(let i=0;i<30;i++){c.beginPath();c.moveTo(rand()*w,rand()*h);c.lineTo(rand()*w,rand()*h);c.stroke();}c.save();c.translate(521,92);c.rotate(-.035);c.font='bold 77px "Comic Sans MS",cursive';c.textAlign='center';c.fillStyle='#d5e5df';c.fillText('LAHM',0,0);c.restore();c.strokeStyle='#d8e5df';c.lineWidth=3.7;c.beginPath();c.ellipse(479,229,35,34,.15,0,Math.PI*2);c.stroke();for(const [x,y]of [[465,228],[489,226]]){c.beginPath();c.ellipse(x,y,7,13,-.15,0,Math.PI*2);c.stroke();}c.beginPath();c.moveTo(481,195);c.bezierCurveTo(468,164,432,167,434,184);c.bezierCurveTo(438,203,472,191,481,195);c.bezierCurveTo(487,163,529,156,530,177);c.bezierCurveTo(530,196,497,186,481,195);c.stroke();});
  panel(blackboard,0,3.88,.222,5.79,2.72,chalk);
  const poster=tex(256,320,(c,w,h)=>{c.fillStyle='#e9eddd';c.fillRect(0,0,w,h);c.strokeStyle='#b7b29f';c.lineWidth=5;c.strokeRect(3,3,w-6,h-6);c.fillStyle='#d5794d';c.font='bold 23px sans-serif';c.textAlign='center';c.fillText('拉姆自然课堂',w/2,48);c.fillText('植物观察笔记',w/2,79);c.fillStyle='#9bbc5e';c.fillRect(17,202,222,94);for(const [x,y]of [[60,173],[126,196],[191,181]]){c.strokeStyle='#5f8b44';c.lineWidth=6;c.beginPath();c.moveTo(x,267);c.lineTo(x,y);c.stroke();for(let j=0;j<6;j++){const a=j*Math.PI/3;c.fillStyle='#faf5c4';c.beginPath();c.ellipse(x+Math.cos(a)*22,y+Math.sin(a)*22,15,10,a,0,Math.PI*2);c.fill();}c.fillStyle='#e2b941';c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.fill();}});
  const notice=panel(blackboard,-1.93,3.93,.245,1.58,2.19,poster);notice.rotation.z=-.04;
  const alphabet=tex(256,320,(c,w,h)=>{c.fillStyle='#89c3dc';c.fillRect(0,0,w,h);c.strokeStyle='#f3e8b6';c.lineWidth=16;c.strokeRect(8,8,w-16,h-16);for(const [letter,x,y,rotation,color,size]of [['A',100,80,-.12,'#d35086',80],['B',53,154,.11,'#db9e27',68],['C',158,197,-.12,'#f0c12f',115],['D',70,266,-.1,'#53984c',61]]){c.save();c.translate(x,y);c.rotate(rotation);c.font='900 '+size+'px sans-serif';c.strokeStyle='#805c32';c.lineWidth=3;c.fillStyle=color;c.strokeText(letter,0,0);c.fillText(letter,0,0);c.restore();}});
  const abc=group(root,7.20,4.03,-4.83);abc.rotation.y=-.65;box(abc,0,0,-.045,1.39,2.46,.15,P.woodDark);panel(abc,0,0,.041,1.27,2.31,alphabet);abc.rotation.z=-.075;

  // Huge recessed round window: carved rings, actual crossed timbers and glazing.
  const wp=wallPoint(windowA,windowY),window=group(root,...wp,'大圆木框十字窗');window.rotation.y=-windowA;
  const view=tex(256,256,(c,w,h)=>{c.fillStyle='#b7e8e9';c.fillRect(0,0,w,h);c.fillStyle='#eef0bd';c.beginPath();c.moveTo(0,141);c.bezierCurveTo(75,100,162,174,256,119);c.lineTo(256,256);c.lineTo(0,256);c.fill();c.fillStyle='#a1c959';c.beginPath();c.moveTo(0,171);c.bezierCurveTo(80,131,117,184,256,152);c.lineTo(256,256);c.lineTo(0,256);c.fill();c.fillStyle='#d0e68b';c.beginPath();c.moveTo(0,192);c.bezierCurveTo(80,157,186,226,256,176);c.lineTo(256,256);c.lineTo(0,256);c.fill();});
  const sky=mesh(window,geometry('windowCircle',()=>new THREE.CircleGeometry(2.075,56)),material(0xffffff,{map:view,roughness:.60,side:THREE.DoubleSide}),0,0,-.03);sky.castShadow=false;
  for(const [r,t,c,z]of [[2.23,.21,P.woodDark,0],[2.19,.12,P.woodPale,.17],[2.04,.078,P.woodDark,.19],[2.37,.10,P.woodLight,-.09]])torus(window,0,0,z,r,t,c);
  for(let i=0;i<64;i++){const a=i/64*Math.PI*2;beam(window,[Math.sin(a)*2.23,Math.cos(a)*2.23,.16],[Math.sin(a)*2.39,Math.cos(a)*2.39,.07],.015,P.woodDark);}
  box(window,0,0,.16,.23,4.05,.23,P.woodDark);box(window,0,0,.292,.10,4.04,.045,P.woodPale);box(window,0,0,.17,4.04,.21,.24,P.woodDark);box(window,0,.07,.298,4.04,.068,.042,P.woodLight);

  // Organic right-hand shelves and stump furniture grow out of the tree wall.
  const library=group(root,8.03,0,-.56,'树根书架与阅读角');library.rotation.y=-.92;
  for(const x of [-1.47,1.49]){const m=ball(library,x,2.52,-.19,.45,2.72,.47,bark);m.rotation.z=x>0?.10:-.12;curve(library,[[x*1.35,.10,.65],[x*1.17,.57,.25],[x,2.74,.23],[x*.88,4.93,.20]],.067,P.woodPale,26);}
  box(library,0,4.50,.11,3.66,.25,1.29,wood);box(library,0,1.19,.11,3.38,.21,1.03,P.woodLight);box(library,0,.26,.09,3.29,.25,1.10,P.woodDark);
  const rootBow=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI;rootBow.push([Math.cos(a)*1.61,1.22+Math.sin(a)*1.34,-.13]);}curve(library,rootBow,.19,P.wood,24);
  for(let i=0;i<11;i++){const g=group(library,-1.14+i*.206,1.33,.15);g.rotation.z=(i===9?-.16:i===2?.08:0);const h=.70+(i%4)*.105,c=[0x4f9368,0x88ae5a,0xd0b369,0x75909f][i%4];box(g,0,h/2,0,.18,h,.58,c);box(g,0,h/2,.303,.10,h-.12,.017,0xe1d8b3);for(const y of [.15,h-.13])box(g,0,y,.32,.16,.035,.025,P.woodPale);}
  function openBook(p,x,y,z,scale=1,rotation=0){const g=group(p,x,y,z);g.rotation.y=rotation;g.scale.setScalar(scale);for(const side of [-1,1]){const pg=group(g,side*.26,.07,0);pg.rotation.z=-side*.15;box(pg,0,0,0,.54,.055,.68,0xa67436);box(pg,0,.049,0,.49,.07,.63,P.cream);for(let i=0;i<5;i++)box(pg,-side*.025,.088,-.21+i*.08,.32-(i%3)*.03,.008,.012,0xab986c);}box(g,0,.052,0,.046,.05,.63,P.woodDark);return g;}
  openBook(library,.38,4.70,.13,1.09,-.08);cylinder(library,-.99,4.89,.17,.18,.15,.48,0xb5b17c,16);for(let i=0;i<4;i++)beam(library,[-1.04+i*.035,5.0,.16],[-1.1+i*.078,5.51,.16],.020,[P.woodDark,0xcb5c44,0x669358,P.woodPale][i]);
  // A distinct gray slatted ventilation plate in the high right wall.
  const vent=group(root,8.22,4.88,-3.35,'木壁通风窗');vent.rotation.y=-.90;vent.rotation.z=-.09;box(vent,0,0,0,1.67,1.84,.17,0x4d6b70);box(vent,0,0,.105,1.50,1.67,.07,0x9dbec5);const ring=torus(vent,0,.08,.16,.58,.065,0x49676e);ring.scale.y=1.12;ball(vent,0,.08,.13,.55,.63,.05,0x6c8b92);for(let i=-2;i<=2;i++)box(vent,0,.08+i*.215,.22,1.04-Math.abs(i)*.10,.09,.045,0xb9d3d1);
  function sproutStool(x,z,rotation=0,book=false){const g=group(root,x,0,z,'树芽小凳');g.rotation.y=rotation;const m=cylinder(g,0,.49,0,.40,.48,.93,P.wood,18);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;curve(g,[[Math.sin(a)*.43,.05,Math.cos(a)*.43],[Math.sin(a+.07)*.37,.47,Math.cos(a+.07)*.37],[Math.sin(a)*.38,.88,Math.cos(a)*.38]],.026,P.woodDark,10);}cylinder(g,0,1.01,0,.59,.55,.18,P.woodDark,24);cylinder(g,0,1.12,0,.51,.54,.07,P.woodLight,24);for(const side of [-1,1]){const leaf=ball(g,side*.17,1.54,-.28,.145,.36,.080,P.woodLight);leaf.rotation.z=-side*.41;}if(book)openBook(g,0,1.16,.17,.62,.12);}
  sproutStool(6.73,-1.17,.35);sproutStool(7.11,2.31,-.1);sproutStool(6.65,4.49,-.30,true);
  const songCover=tex(256,352,(c,w,h)=>{c.fillStyle='#f1edcf';c.fillRect(0,0,w,h);c.strokeStyle='#538f45';c.lineWidth=9;c.strokeRect(9,9,w-18,h-18);c.strokeStyle='#83ae62';c.lineWidth=3;c.strokeRect(23,22,w-46,h-44);c.fillStyle='#337d36';c.font='bold 90px KaiTi,serif';c.textAlign='center';c.fillText('校',128,175);c.fillText('歌',128,280);c.strokeStyle='#568f42';c.lineWidth=5;c.beginPath();c.moveTo(72,63);c.quadraticCurveTo(128,96,183,61);c.stroke();for(const [x,y,a]of [[87,51,-.55],[116,63,-.4],[150,58,.4],[174,42,.6]]){c.save();c.translate(x,y);c.rotate(a);c.beginPath();c.ellipse(0,0,11,22,0,0,Math.PI*2);c.fill();c.restore();}});
  const song=group(root,7.64,1.63,3.34,'绿色校歌册');song.rotation.y=-.53;box(song,0,0,0,1.05,1.51,.15,0x46824b);box(song,0,0,.09,.96,1.41,.052,0xe8e2b9);panel(song,0,0,.126,.93,1.36,songCover);box(song,-.53,0,.035,.10,1.56,.22,0x91b56e);beam(song,[0,-.72,-.02],[0,-1.45,-.13],.055,P.woodDark);
  const lectern=group(root,5.89,.36,-4.20,'翻开的讲义');cylinder(lectern,0,.50,0,.29,.38,.91,P.woodDark,18);const top=box(lectern,0,1.06,0,1.04,.17,.83,P.wood);top.rotation.x=.13;openBook(lectern,0,1.19,0,.83,-.05);
  // Small blue teacher sits below the chalkboard without obscuring its writing.
  const teacher=group(root,2.98,.36,-3.84,'蓝色拉姆老师');
  ball(teacher,0,.56,0,.32,.40,.27,0x3179a4);ball(teacher,0,1.02,.015,.34,.31,.29,0x70b4d3);
  for(const side of [-1,1]){ball(teacher,side*.12,1.075,.277,.094,.119,.035,0xf5f1dd);ball(teacher,side*.12,1.083,.305,.033,.063,.020,0x31444d);ball(teacher,side*.26,.18,.05,.16,.12,.19,0x234d77);}ball(teacher,0,.946,.303,.13,.11,.067,0xd66f30);
  const collar1=box(teacher,-.16,.77,.24,.26,.27,.028,P.cream);collar1.rotation.z=.53;const collar2=box(teacher,.16,.77,.24,.26,.27,.028,P.cream);collar2.rotation.z=-.53;box(teacher,0,.54,.28,.12,.24,.029,0x324c65);
  for(const side of [-1,1]){const leaf=ball(teacher,side*.10,1.47,-.02,.10,.25,.045,0x5d9942);leaf.rotation.z=-side*.36;}beam(teacher,[.34,.75,.04],[.74,1.59,-.10],.020,P.woodPale);

  // Thick oval yellow rug with the large white-eyed sprout woven into its surface.
  const rug=group(root,1.17,.02,2.42,'黄色椭圆拉姆地毯');rug.rotation.y=-.16;
  const rugBase=cylinder(rug,0,.095,0,1,1,.16,0x9c7935,64);rugBase.scale.set(4.11,1,2.90);
  const rugTexture=tex(768,768,(c,w,h)=>{
    c.fillStyle='#c7a459';c.fillRect(0,0,w,h);for(const [r,color]of [[377,'#f2e2a1'],[358,'#f9efd0'],[343,'#d5af43'],[328,'#e7bf3d']]){c.beginPath();c.arc(384,384,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
    c.save();c.translate(395,418);c.rotate(-.12);c.fillStyle='#ce8b12';c.beginPath();for(let i=0;i<90;i++){const a=i/90*Math.PI*2,r=(i%2?1:.955);const x=Math.cos(a)*285*r,y=Math.sin(a)*216*r;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.closePath();c.fill();c.fillStyle='#ebbd33';c.beginPath();for(let i=0;i<80;i++){const a=i/80*Math.PI*2,r=(i%2?1:.966);const x=Math.cos(a)*251*r,y=Math.sin(a)*185*r;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.closePath();c.fill();
    c.fillStyle='#fff5d2';c.beginPath();c.ellipse(13,31,83,130,-.50,0,Math.PI*2);c.ellipse(132,-24,83,121,-.75,0,Math.PI*2);c.fill();c.fillStyle='#d8931f';c.beginPath();c.ellipse(28,40,36,54,-.55,0,Math.PI*2);c.ellipse(137,-12,39,52,-.80,0,Math.PI*2);c.fill();c.restore();
    c.lineJoin='round';c.lineWidth=15;c.strokeStyle='#ba8b22';c.fillStyle='#8eaf2f';c.beginPath();c.moveTo(376,293);c.bezierCurveTo(304,206,112,190,85,345);c.bezierCurveTo(79,426,137,454,188,402);c.bezierCurveTo(267,325,320,318,376,293);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(374,297);c.bezierCurveTo(303,246,298,132,413,99);c.bezierCurveTo(529,77,613,132,564,177);c.bezierCurveTo(525,207,442,199,374,297);c.closePath();c.fill();c.stroke();c.strokeStyle='#719121';c.lineWidth=11;c.beginPath();c.moveTo(378,298);c.bezierCurveTo(290,244,169,249,123,353);c.moveTo(378,295);c.bezierCurveTo(353,215,392,154,476,129);c.stroke();c.strokeStyle='#d79d24';c.lineWidth=21;c.beginPath();c.moveTo(388,312);c.bezierCurveTo(451,263,497,263,564,295);c.stroke();
    for(let i=0;i<800;i++){const x=rand()*w,y=rand()*h;c.fillStyle=i%2?'rgba(255,247,207,.05)':'rgba(138,93,17,.035)';c.fillRect(x,y,1,3);}
  });
  const rugTop=mesh(rug,geometry('rugDisc',()=>new THREE.CircleGeometry(1,72)),material(0xffffff,{map:rugTexture,roughness:1,bumpMap:rugTexture,bumpScale:.010}),0,.181,0);rugTop.rotation.x=-Math.PI/2;rugTop.scale.set(4.05,2.84,1);rugTop.castShadow=false;

  // Left-front tree opening and a physical red floor arrow towards the academy.
  const dp=wallPoint(doorA,0),door=group(root,...dp,'回拉姆学院的树洞门');door.rotation.y=-doorA;
  const archPts=[[-1.09,.08,.03],[-1.11,1.32,.05],[-1.02,2.22,.02],[-.67,2.94,.01],[0,3.19,0],[.72,2.92,0],[1.08,2.20,0],[1.10,.07,0]];curve(door,archPts,.21,P.woodDark,32);curve(door,archPts.map(([x,y,z])=>[x,y,z+.16]),.11,P.woodLight,32);
  const tunnel=box(door,0,1.22,-.55,1.88,2.43,1.07,0x759737);tunnel.material.side=THREE.BackSide;
  box(door,0,.025,-.67,1.94,.055,1.48,0xcad15e);for(const side of [-1,1])ball(door,side*1.11,.14,.34,.25,.24,.66,P.bark);
  const arrowShape=new THREE.Shape();arrowShape.moveTo(-.64,0);arrowShape.lineTo(-.05,.53);arrowShape.lineTo(-.05,.26);arrowShape.lineTo(.63,.26);arrowShape.lineTo(.63,-.23);arrowShape.lineTo(-.05,-.23);arrowShape.lineTo(-.05,-.50);arrowShape.closePath();const arrow=mesh(root,new THREE.ExtrudeGeometry(arrowShape,{depth:.045,bevelEnabled:false}),0xd85738,-7.88,.12,3.50);arrow.rotation.x=-Math.PI/2;arrow.rotation.z=-.10;
  const arrowOutline=mesh(root,new THREE.ExtrudeGeometry(arrowShape,{depth:.028,bevelEnabled:false}),P.woodDark,-7.88,.081,3.50);arrowOutline.rotation.copy(arrow.rotation);arrowOutline.scale.set(1.14,1.14,1);

  // Small warm sconce and exterior foliage remain real geometry on reverse views.
  const lamp=group(root,7.22,7.02,-4.55);beam(lamp,[0,0,-.1],[0,0,.46],.075,P.woodDark);ball(lamp,0,-.20,.52,.26,.42,.23,material(0xffedb1,{emissive:0xd6a04c,emissiveIntensity:.28,roughness:.55}));cylinder(lamp,0,.24,.52,.30,.37,.18,P.woodDark,12);cylinder(lamp,0,-.61,.52,.23,.16,.16,P.woodDark,12);
  for(const a of [-1.91,-1.25,-.64,.03,.87,1.66]){const [x,y,z]=wallPoint(a,wallH,true);const leaves=group(root,x,y-.28,z);for(let i=0;i<8;i++){const aa=i*Math.PI/4;const m=ball(leaves,Math.cos(aa)*.49,Math.sin(aa)*.35,Math.sin(aa*2)*.41,.63,.32,.52,[0x547729,0x789530,0x91a935][i%3]);m.rotation.z=aa*.37;}}

  const insideDeck=(x,z)=>x>-9.04&&x<-2.40&&z>-5.39&&z<.36;
  const onStairs=(x,z)=>Math.abs(x-stairX)<.63&&z>=.30&&z<=stairBottomZ;
  return {
    root,indoor:true,background:0x75603a,spawn:[.75,.23,3.98],
    bounds:{minX:-9.3,maxX:9.1,minZ:-6.65,maxZ:7.0},
    walkLevels:[.05,.23,.40,3.49,...Array.from({length:10},(_,i)=>(i+1)*.345+.05)],
    heightAt:(x,z)=>insideDeck(x,z)?3.49:onStairs(x,z)?Math.ceil((stairBottomZ-z)/stepDepth)*.345+.05:((x-1.17)/4.02)**2+((z-2.42)/2.82)**2<1?.23:x>-.7&&x<7.2&&z>-6.3&&z<-3.22?.40:.05,
    walkable:(x,z)=>(x/9.65)**2+((z-.10)/8.00)**2<1,
    colliders:[
      {x:-5.94,z:-3.06,rx:2.33,rz:.79},
      {x:-1.05,z:-5.30,rx:1.09,rz:1.07,kind:'ellipse'},
      {x:-1.05,z:-.20,rx:1.05,rz:.59},
      {x:8.03,z:-.56,rx:1.1,rz:1.73,kind:'ellipse'},
      {x:6.73,z:-1.17,rx:.58,rz:.54,kind:'ellipse'},
      {x:7.11,z:2.31,rx:.57,rz:.54,kind:'ellipse'},
      {x:6.65,z:4.49,rx:.57,rz:.54,kind:'ellipse'},
      {x:5.89,z:-4.20,rx:.54,rz:.44,kind:'ellipse'},
      {x:2.98,z:-3.84,rx:.34,rz:.31,kind:'ellipse'},
    ],
    portalLocations:{ram:[-8.13,.05,2.55]},dynamic:[],updates:[],
    camera:{perspectivePosition:[-1.15,16.4,19.2],perspectiveTarget:[-.12,2.93,-.62],fov:38,wideZoom:.83,wideLift:.52,span:21.4,position:[0,22,26],target:[-.12,2.93,-.62]},
  };
}
