import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Front-half furnishings for the reference home. Geometry/paint caches are
// visit-local; finished meshes are merged by paint, with source buffers retired.
export function addHomeFurniture(root) {
  const furniture=new THREE.Group();furniture.name='家园中前排家具与玩偶';root.add(furniture);
  const materials=new Map(),geometries=new Map(),colliders=[],items=[];
  const P={ink:0x302f37,black:0x20232a,brown:0x785232,wood:0xda953f,woodLight:0xf3bd66,
    woodDark:0xac622d,cream:0xffe9bd,white:0xfff9e0,peach:0xf6b28e,pink:0xe88e93,
    rose:0xd35375,red:0xdd473c,yellow:0xffd34c,orange:0xffa226,orangeDark:0xe16e13,
    mint:0x7fdbb5,mintLight:0xb5efd2,leaf:0x61a639,leafLight:0x95ca58,leafDark:0x34773a,
    blue:0x69c3df,blueDark:0x30869d,bluePale:0xb3e5e6,purple:0x9861b9,purpleDark:0x693d91,
    stone:0x928e7e,stoneLight:0xb8b5a0,water:0x73d9e4};
  function material(c,extra={}){const key=String(c)+Object.keys(extra).sort().map(k=>k+':'+(extra[k]&&extra[k].isTexture?extra[k].uuid:extra[k])).join('|');if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.80,...extra}));return materials.get(key);}
  function geometry(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
  function group(p=furniture,x=0,y=0,z=0,name=''){const g=new THREE.Group();g.position.set(x,y,z);g.name=name;p.add(g);return g;}
  function item(name,x,z,rx=0,rz=0,turn=0){const g=group(furniture,x,.05,z,name);g.rotation.y=turn;items.push({name,x,z,rx,rz});if(rx&&rz)colliders.push({x,z,rx,rz,kind:'ellipse'});return g;}
  function mesh(p,g,c,x=0,y=0,z=0){const m=new THREE.Mesh(g,c&&c.isMaterial?c:material(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
  function box(p,x,y,z,w,h,d,c){const m=mesh(p,geometry('box',()=>new THREE.BoxGeometry(1,1,1)),c,x,y,z);m.scale.set(w,h,d);return m;}
  function ball(p,x,y,z,rx,ry,rz,c){const m=mesh(p,geometry('ball',()=>new THREE.SphereGeometry(1,14,9)),c,x,y,z);m.scale.set(rx,ry,rz);return m;}
  function cyl(p,x,y,z,rt,rb,h,c,n=20){return mesh(p,geometry(['c',rt,rb,h,n].join(':'),()=>new THREE.CylinderGeometry(rt,rb,h,n)),c,x,y,z);}
  function torus(p,x,y,z,r,t,c,arc=Math.PI*2){return mesh(p,geometry(['torus',r,t,arc].join(':'),()=>new THREE.TorusGeometry(r,t,5,32,arc)),c,x,y,z);}
  function beam(p,a,b,r,c){const v=new THREE.Vector3(...a),w=new THREE.Vector3(...b),delta=w.clone().sub(v),m=mesh(p,geometry('beam',()=>new THREE.CylinderGeometry(1,1,1,8)),c);m.position.copy(v.add(w).multiplyScalar(.5));m.scale.set(r,delta.length(),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
  function curve(p,points,r,c,n=20,sides=5){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),n,r,sides,false),c);}
  function shape(points){const s=new THREE.Shape();for(let i=0;i<points.length;i++){if(i)s.lineTo(...points[i]);else s.moveTo(...points[i]);}s.closePath();return s;}
  function extrude(p,s,depth,c,x=0,y=0,z=0,bevel=.035){return mesh(p,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,curveSegments:10}),c,x,y,z-depth/2);}
  function roundedShape(w,h,r){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
  function rounded(p,x,y,z,w,h,d,r,c){return extrude(p,roundedShape(w,h,r),d,c,x,y,z,.018);}
  function flatShape(p,s,y,c,depth=.035){const m=extrude(p,s,depth,c,0,y,0,.008);m.rotation.x=-Math.PI/2;return m;}
  function leaf(p,x,y,z,length,width,c=P.leaf,tilt=-Math.PI/2,turn=0){
    const g=group(p,x,y,z);g.rotation.x=tilt;g.rotation.z=turn;
    const s=new THREE.Shape();s.moveTo(0,length*.58);s.bezierCurveTo(width*.63,length*.20,width*.52,-length*.31,0,-length*.50);s.bezierCurveTo(-width*.52,-length*.31,-width*.63,length*.20,0,length*.58);s.closePath();
    extrude(g,s,.065,c,0,0,0,.025);curve(g,[[0,-length*.45,.074],[.025,0,.12],[0,length*.48,.071]],.016,P.leafLight,12,4);
    for(const side of [-1,1])for(let i=0;i<3;i++){const yy=-length*.22+i*length*.19;curve(g,[[0,yy-.04,.11],[side*width*.19,yy+.08,.105],[side*width*(.30-i*.045),yy+.17,.073]],.010,P.leafLight,8,4);}
    return g;
  }
  function flower(p,x,y,z,r=.23){const g=group(p,x,y,z);for(let i=0;i<9;i++){const a=i*Math.PI*2/9,m=ball(g,Math.sin(a)*r*.67,Math.cos(a)*r*.67,0,r*.28,r*.56,r*.105,P.white);m.rotation.z=-a;}ball(g,0,0,.035,r*.32,r*.32,r*.16,P.yellow);return g;}
  function cloudShape(w,h){const s=new THREE.Shape();s.moveTo(-w*.5,0);s.bezierCurveTo(-w*.58,h*.29,-w*.54,h*.63,-w*.35,h*.68);s.bezierCurveTo(-w*.44,h*.99,-w*.16,h*1.06,-w*.10,h*.90);s.bezierCurveTo(w*.03,h*1.16,w*.34,h*1.03,w*.34,h*.80);s.bezierCurveTo(w*.57,h*.84,w*.63,h*.46,w*.50,.02);s.quadraticCurveTo(0,-h*.11,-w*.5,0);s.closePath();return s;}
  function outlinedCloud(p,x,y,z,w,h){
    const g=group(p,x,y,z),s=cloudShape(w,h);extrude(g,s,.16,P.peach);
    const points=s.getPoints(44).map(v=>[v.x,v.y,.12]);curve(g,points,.045,P.cream,70,5);return g;
  }
  function plush(p,x,y,z,c,s=.45){const g=group(p,x,y,z);g.scale.setScalar(s);ball(g,0,.28,0,.48,.32,.37,c);ball(g,0,.76,.03,.48,.40,.36,c);for(const side of [-1,1]){ball(g,side*.42,.25,.07,.19,.14,.21,c);ball(g,side*.17,.80,.365,.12,.155,.03,P.white);ball(g,side*.16,.80,.399,.046,.077,.015,P.ink);}ball(g,0,.63,.40,.066,.043,.025,P.peach);curve(g,[[0,1.05,0],[.02,1.31,0],[.18,1.45,0]],.045,P.leafDark,10,5);leaf(g,.29,1.37,0,.40,.30,P.leaf,0,-.9);return g;}

  // Left toy stack: the dark wolf, white-faced red-nosed doll, and blue doll
  // are separate volumes. The bouquet is tied in front of the wolf's feet.
  const wolf=item('尖耳黑狼、独立蓝玩偶与白雏菊',-8.02,.65,1.15,1.08,.25);
  ball(wolf,0,1.05,0,.57,.88,.51,P.ink);ball(wolf,0,2.13,0,.74,.79,.62,P.ink);
  for(const side of [-1,1]){
    const ear=extrude(wolf,shape([[side*.10,2.52],[side*.77,2.61],[side*.65,3.45],[side*.40,3.05]]),.25,P.black,0,0,-.02,.055);ear.rotation.z=-side*.08;
    extrude(wolf,shape([[side*.29,2.77],[side*.60,2.80],[side*.57,3.17]]),.07,0x514143,0,0,.15,.018);
    ball(wolf,side*.25,2.24,.553,.23,.25,.11,P.white);ball(wolf,side*.18,2.22,.654,.077,.135,.028,P.black);
    ball(wolf,side*.43,.19,.20,.30,.23,.44,P.black);ball(wolf,side*.57,1.12,.08,.24,.48,.28,P.ink);
  }
  extrude(wolf,shape([[-.54,2.84],[-.24,3.17],[-.13,2.84],[.10,3.08],[.20,2.78],[.42,2.96],[.38,2.63],[-.18,2.70]]),.11,P.brown,0,0,.44,.025);
  ball(wolf,.16,1.98,.62,.43,.28,.36,0xb7b3a3);ball(wolf,.23,2.10,.90,.22,.16,.19,P.black);
  curve(wolf,[[-.55,.55,-.19],[-.96,.82,-.38],[-1.08,1.28,-.30],[-1.26,1.43,-.14]],.14,P.ink,19,7);
  curve(wolf,[[0,.41,-.42],[0,1.05,-.52],[0,1.47,-.40],[0,1.97,-.62],[0,2.56,-.46]],.016,0x44414b,27,5);
  for(const side of [-1,1])for(let i=0;i<3;i++){const tuft=ball(wolf,side*(.17+i*.10),1.76+i*.20,-.59+(i%2)*.015,.15,.30,.067,0x3b3841);tuft.rotation.z=side*.30;}
  const collar=torus(wolf,0,1.48,0,.46,.105,P.red);collar.rotation.x=Math.PI/2;collar.scale.set(1,.83,1);ball(wolf,0,1.30,.52,.115,.15,.04,P.yellow);
  const whiteDoll=group(wolf,.24,.03,.84);ball(whiteDoll,0,.44,0,.34,.46,.28,P.brown);ball(whiteDoll,0,.84,.02,.40,.39,.30,P.cream);ball(whiteDoll,-.11,.89,.31,.040,.067,.02,P.black);ball(whiteDoll,.11,.89,.31,.040,.067,.02,P.black);ball(whiteDoll,0,.74,.33,.12,.13,.095,P.red);
  const blueDoll=plush(wolf,.16,.02,1.34,P.blueDark,.60);blueDoll.rotation.y=-.16;
  const bunch=group(wolf,.90,.10,.86);ball(bunch,0,.06,0,.43,.075,.34,P.cream);
  for(let i=0;i<9;i++){const a=i*2.4,r=.12+(i%3)*.13,x=Math.sin(a)*r,z=Math.cos(a)*r,y=.52+(i%4)*.22;curve(bunch,[[0,.05,0],[x*.6,y*.54,z*.6],[x,y,z]],.020,P.leafDark,9,4);const bloom=flower(bunch,x,y,z,.20+(i%2)*.03);bloom.rotation.x=-.15;}
  for(let i=0;i<5;i++)leaf(bunch,Math.sin(i*1.7)*.19,.35,Math.cos(i*1.7)*.16,.64,.27,P.leaf,-.50,i-.9);

  // Reclining striped canvas hangs between a pair of crossed pale timber legs.
  const deck=item('蓝白条纹浅黄木躺椅',-5.57,.44,.81,1.00,-.26);
  for(const side of [-1,1]){
    beam(deck,[side*.65,.12,.91],[side*.65,1.58,-.78],.056,P.cream);beam(deck,[side*.65,.12,-.63],[side*.65,.92,.61],.056,P.woodLight);
    beam(deck,[side*.69,.84,-.40],[side*.69,.80,.49],.055,P.woodLight);ball(deck,side*.66,.72,.13,.087,.087,.087,P.woodDark);
  }
  beam(deck,[-.68,1.56,-.75],[.68,1.56,-.75],.051,P.woodLight);beam(deck,[-.69,.55,.64],[.69,.55,.64],.060,P.woodLight);
  const sling=new THREE.CatmullRomCurve3([[0,1.52,-.76],[0,.99,-.39],[0,.55,.13],[0,.50,.62]].map(v=>new THREE.Vector3(...v)));
  for(let stripe=0;stripe<9;stripe++){
    const positions=[],ix=[],left=-.59+stripe*1.18/9,right=left+1.18/9;
    for(let i=0;i<=15;i++){const p=sling.getPoint(i/15);positions.push(left,p.y,p.z,right,p.y,p.z);if(i<15){const k=i*2;ix.push(k,k+2,k+1,k+1,k+2,k+3);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(ix);g.computeVertexNormals();mesh(deck,g,material(stripe%3===0?P.woodLight:stripe%2?P.white:P.blue,{side:THREE.DoubleSide}));
  }

  // Orange flesh wedges, a light rind, and a green leaf dish on the little table.
  const table=item('橙子果瓣桌与绿叶盘',-3.93,.67,.93,.80,.10);
  cyl(table,0,.14,0,.44,.50,.15,P.peach,26);cyl(table,0,.24,0,.34,.39,.11,P.cream,24);cyl(table,0,.74,0,.11,.15,.98,P.pink,20);
  cyl(table,0,1.24,0,.96,.86,.16,P.orangeDark,36);cyl(table,0,1.345,0,.91,.94,.065,P.yellow,36);cyl(table,0,1.385,0,.865,.865,.035,P.orange,36);
  for(let i=0;i<10;i++){const a=i*Math.PI/5+.024,b=(i+1)*Math.PI/5-.024,s=new THREE.Shape();s.moveTo(Math.cos(a)*.11,Math.sin(a)*.11);s.lineTo(Math.cos(a)*.82,Math.sin(a)*.82);s.absarc(0,0,.82,a,b,false);s.lineTo(Math.cos(b)*.11,Math.sin(b)*.11);s.closePath();flatShape(table,s,1.42,i%2?P.orange:0xffb325,.045);}
  for(let i=0;i<6;i++){const a=i*1.047,m=ball(table,Math.sin(a)*.42,1.481,Math.cos(a)*.42,.024,.012,.076,P.cream);m.rotation.y=a;}
  leaf(table,1.0,1.22,.02,1.25,.94,P.leaf,-Math.PI/2,-.37);

  // A scalloped pink chair with an open seat and curled cream-edged arms.
  const chair=item('桃粉曲线扶手椅',-2.15,1.0,.72,.85,.24);
  outlinedCloud(chair,0,.82,-.54,1.13,1.25);
  ball(chair,0,.62,.04,.66,.15,.66,P.cream);ball(chair,0,.755,.09,.56,.09,.57,P.mintLight);
  for(const side of [-1,1]){
    curve(chair,[[side*.54,.65,.58],[side*.66,.89,.56],[side*.62,1.22,.11],[side*.50,1.29,-.35]],.105,P.peach,22,7);
    curve(chair,[[side*.54,.69,.60],[side*.64,.96,.51],[side*.59,1.26,.05],[side*.50,1.33,-.35]],.037,P.cream,22,5);
    for(const z of [-.40,.42]){const leg=cyl(chair,side*.46,.26,z,.063,.092,.52,P.peach,12);leg.rotation.z=side*.12;ball(chair,side*.48,.055,z,.095,.055,.095,P.cream);}
  }

  // Layered soft rugs have real scalloped outlines; low rugs are walkable.
  const rug=item('粉红浅蓝叠层花边地毯',-3.00,2.29);
  function scalloped(rx,rz){const points=[];for(let i=0;i<120;i++){const a=i/120*Math.PI*2,r=1+.028*Math.sin(a*18);points.push([Math.cos(a)*rx*r,Math.sin(a)*rz*r]);}return shape(points);}
  for(const [rx,rz,y,c] of [[2.65,1.63,.007,P.rose],[2.57,1.55,.035,P.peach],[2.37,1.41,.062,P.cream],[2.23,1.28,.08,P.bluePale],[1.93,1.11,.10,P.peach]])flatShape(rug,scalloped(rx,rz),y,c,.024);
  const basket=item('编织食物篮与水果点心',-3.20,2.65,.74,.48,-.16);
  rounded(basket,0,.30,0,1.31,.49,.90,.14,P.woodLight);rounded(basket,0,.44,0,1.35,.19,.94,.10,P.rose);
  const rim=torus(basket,0,.53,0,1,.056,P.cream);rim.rotation.x=-Math.PI/2;rim.scale.set(.69,.47,1);
  for(let i=0;i<11;i++)curve(basket,[[-.59+i*.118,.12,.456],[-.58+i*.116,.29,.477],[-.57+i*.114,.39,.463]],.013,P.woodDark,5,4);
  for(let row=0;row<3;row++)curve(basket,[[-.61,.16+row*.095,.453],[0,.15+row*.095,.479],[.61,.16+row*.095,.453]],.012,P.woodDark,9,4);
  curve(basket,[[-.58,.48,-.05],[-.48,.98,-.05],[0,1.17,-.05],[.48,.98,-.05],[.58,.48,-.05]],.045,P.woodDark,28,6);
  for(const [x,z,c] of [[-.32,.04,P.red],[.21,-.11,P.orange],[.38,.20,P.red]]){ball(basket,x,.65,z,.21,.19,.20,c);beam(basket,[x,.80,z],[x+.025,.89,z],.020,P.brown);}
  const bread=ball(basket,-.26,.66,.28,.37,.16,.17,P.cream);bread.rotation.y=-.4;for(let i=0;i<3;i++)curve(basket,[[-.43+i*.16,.76,.23],[-.42+i*.16,.80,.28],[-.39+i*.16,.76,.34]],.016,P.woodLight,6,4);
  for(let i=0;i<2;i++)curve(basket,[[.04+i*.1,.56,.12],[.05+i*.1,.75,.21],[.24+i*.1,.76,.31]],.075,P.yellow,15,6);

  // The central furnishing is one long narrow bed, with a cloud headboard and
  // footboard, leaf-green pillow and white flower spots on its mint bedspread.
  const bed=item('桃粉花边窄床与薄荷绿花被',1.90,1.03,1.06,1.74,-.025);
  rounded(bed,0,.48,0,1.68,.25,3.13,.14,P.pink);rounded(bed,0,.69,0,1.60,.23,2.91,.13,P.cream);
  outlinedCloud(bed,0,.44,-1.45,1.75,.91);outlinedCloud(bed,0,.21,1.52,1.78,.61);
  ball(bed,0,.865,.10,.77,.15,1.26,P.mint);ball(bed,0,1.02,-.96,.63,.15,.31,P.leafLight);
  for(let i=0;i<13;i++){const x=Math.sin(i*2.7)*.52,z=-.52+(i%5)*.35,g=group(bed,x,.990+Math.cos(z*.9)*.015,z);g.rotation.x=-Math.PI/2;flower(g,0,0,0,.074+(i%3)*.014);}
  for(const side of [-1,1]){
    curve(bed,[[side*.78,.72,-1.26],[side*.80,.75,-.40],[side*.80,.75,.54],[side*.77,.67,1.30]],.053,P.cream,25,5);
    for(let i=0;i<9;i++)ball(bed,side*.80,.71,-1.18+i*.30,.044,.050,.046,P.peach);
    for(const z of [-1.22,1.26]){cyl(bed,side*.67,.24,z,.062,.095,.47,P.peach,12);ball(bed,side*.67,.065,z,.095,.056,.095,P.cream);}
  }
  plush(bed,-.38,1.12,-1.00,P.leaf,.27);plush(bed,.34,1.09,-1.04,P.purple,.23);
  const bedRug=item('床边粉色星形地毯',1.85,2.25);const starPoints=[];for(let i=0;i<12;i++){const a=i*Math.PI/6,r=i%2?1.29:1.65;starPoints.push([Math.sin(a)*r,Math.cos(a)*r*.83]);}flatShape(bedRug,shape(starPoints),.023,P.pink,.025);const starInner=shape(starPoints.map(([x,z])=>[x*.88,z*.88]));flatShape(bedRug,starInner,.051,P.peach,.024);

  // Wider scalloped settee at the right rear, with one uninterrupted mint seat.
  const sofa=item('贝壳粉框薄荷绿小沙发',4.60,-.92,1.22,.74,.30);
  outlinedCloud(sofa,0,.61,-.47,2.22,1.21);ball(sofa,0,.61,.06,1.16,.18,.66,P.peach);ball(sofa,0,.81,.10,1.00,.11,.53,P.mint);
  curve(sofa,[[-.98,.85,.47],[0,.86,.55],[.98,.85,.47]],.048,P.mintLight,24,6);
  for(const side of [-1,1]){
    curve(sofa,[[side*.94,.62,.54],[side*1.11,.85,.51],[side*1.08,1.14,.08],[side*.99,1.12,-.36]],.12,P.peach,24,7);
    curve(sofa,[[side*.94,.69,.57],[side*1.09,.94,.46],[side*1.055,1.20,.04],[side*.99,1.18,-.35]],.043,P.cream,24,5);
    for(const z of [-.33,.40])cyl(sofa,side*.85,.25,z,.064,.09,.49,P.woodLight,12);
  }
  const cake=item('小蛋糕凳与吐司玩偶',.15,-.05,.61,.57,-.14);
  cyl(cake,0,.34,0,.48,.44,.57,P.woodLight,28);cyl(cake,0,.65,0,.56,.55,.16,P.rose,30);cyl(cake,0,.76,0,.51,.54,.075,P.yellow,30);
  for(let i=0;i<13;i++){const a=i/13*Math.PI*2;ball(cake,Math.sin(a)*.51,.66,Math.cos(a)*.51,.085,.115,.085,P.cream);}
  const toast=group(cake,0,.89,0);toast.rotation.z=-.13;rounded(toast,0,.34,0,.59,.68,.22,.18,P.woodLight);rounded(toast,0,.34,.13,.49,.58,.02,.16,P.cream);for(const side of [-1,1]){ball(toast,side*.10,.41,.16,.049,.073,.024,P.leafDark);ball(toast,side*.19,.29,.16,.063,.036,.022,P.peach);}curve(toast,[[-.07,.26,.17],[0,.22,.18],[.07,.26,.17]],.012,P.brown,9,4);

  // Green leaf chair and its distinct dangling purple grape ornament.
  const leafChair=item('绿叶靠背椅与紫葡萄饰物',7.10,2.12,1.07,.91,-.37);
  leaf(leafChair,0,.86,.08,1.35,1.41,P.leaf,-Math.PI/2,.12);leaf(leafChair,-.19,1.49,-.43,1.52,.97,P.leaf,.09,-.63);leaf(leafChair,.49,1.53,-.30,1.44,1.00,P.leaf,.12,.63);
  for(const side of [-1,1])for(const z of [-.33,.47]){const leg=cyl(leafChair,side*.51,.42,z,.047,.062,.81,P.woodDark,10);leg.rotation.z=-side*.13;}
  curve(leafChair,[[-.73,.85,.04],[-.99,1.32,.15],[-1.10,1.58,.27]],.040,P.leafDark,16,5);
  for(let row=0;row<3;row++)for(let col=0;col<3-row;col++)ball(leafChair,-1.10+(col-(2-row)/2)*.20,1.44-row*.20,.30,.15,.16,.14,(row+col)%2?P.purple:P.purpleDark);
  leaf(leafChair,-1.10,1.68,.31,.41,.41,P.leaf,0,.7);

  // Double-arched yellow toy bookcase. Deep shelf recesses and small individual
  // book spines remain visible from the side; there are no flat facade images.
  const bookcase=item('黄色双拱顶卡通书架与彩球玩具',4.91,4.23,1.10,.75,-.07);
  const caseW=1.70,caseD=.68;
  box(bookcase,0,1.15,-.19,caseW,2.20,.19,P.woodDark);box(bookcase,0,.11,.0,1.85,.21,.92,P.yellow);
  for(const side of [-1,1]){box(bookcase,side*.87,1.12,.02,.13,2.15,.89,P.yellow);box(bookcase,side*.91,.21,.0,.22,.35,1.04,P.woodLight);}
  for(let row=0;row<4;row++)box(bookcase,0,.31+row*.49,.02,1.66,.085,.90,P.orange);
  for(let row=0;row<4;row++){
    const count=row===0?5:7;
    for(let col=0;col<count;col++){
      const x=-.70+col*1.38/(count-1),h=.27+(col*3+row)%4*.035,c=[P.blueDark,P.rose,P.leafDark,P.purple,P.blue,P.woodLight,P.red][(col+row*2)%7],g=group(bookcase,x,.36+row*.49+h/2,.22);
      g.rotation.z=(col===1||col===count-1)?(.10*(row%2?1:-1)):0;box(g,0,0,0,.13,h,.40,c);box(g,0,0,.207,.108,h-.028,.016,c);box(g,0,h*.25,.221,.085,.014,.009,P.cream);box(g,0,-h*.29,.221,.082,.012,.009,P.cream);
    }
  }
  for(const side of [-1,1]){
    const arch=new THREE.Shape();arch.moveTo(.43,0);arch.lineTo(-.43,0);arch.absarc(0,.46,.43,Math.PI,0,true);arch.lineTo(.43,0);arch.closePath();
    extrude(bookcase,arch,.83,P.yellow,side*.42,2.04,-.03,.025);
    const inner=new THREE.Shape();inner.moveTo(.33,.03);inner.lineTo(-.33,.03);inner.absarc(0,.40,.33,Math.PI,0,true);inner.lineTo(.33,.03);inner.closePath();extrude(bookcase,inner,.035,P.cream,side*.42,2.07,.423,.015);
    ball(bookcase,side*.42,2.45,.476,.083,.19,.035,P.woodDark);
    curve(bookcase,[[side*.77,2.14,-.39],[side*.77,2.48,-.39],[side*.56,2.83,-.39],[side*.36,2.90,-.39]],.032,P.orangeDark,19,5);
  }
  // The colored balls sit on an independent curled stand beside the bookcase.
  const balls=group(bookcase,1.34,.0,-.26,'独立彩环吊球玩具');cyl(balls,0,.07,0,.24,.28,.11,P.yellow,20);beam(balls,[0,.13,0],[0,1.59,0],.034,P.orange);
  const hoop=torus(balls,0,1.44,.03,.41,.030,P.blueDark);hoop.rotation.y=.17;torus(balls,0,1.44,.08,.32,.026,P.yellow);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;ball(balls,Math.sin(a)*.30,1.44+Math.cos(a)*.30,.08,.10,.11,.10,[P.pink,P.blue,P.leafLight,P.orange,P.purple,P.yellow][i]);}
  ball(balls,0,1.44,.09,.14,.14,.14,P.mint);

  // Low toy treadmill with a blue-gray moving belt, striped front roller,
  // cream U-shaped rails and the small upright face/control head at the rear.
  const treadmill=item('前左卡通小跑步机',-5.22,5.08,1.32,.77,-.62);
  rounded(treadmill,0,.22,.0,1.02,.36,1.84,.12,P.wood);rounded(treadmill,0,.39,.02,.81,.055,1.61,.05,P.blueDark);
  for(const side of [-1,1]){
    box(treadmill,side*.46,.40,.0,.067,.055,1.75,P.cream);
    curve(treadmill,[[side*.53,.42,.53],[side*.53,.80,.47],[side*.53,.87,-.42],[side*.53,1.22,-.68]],.041,P.cream,25,6);
  }
  const roller=cyl(treadmill,0,.21,.90,.19,.19,1.02,P.brown,22);roller.rotation.z=Math.PI/2;
  for(let i=0;i<6;i++){const band=cyl(treadmill,-.43+i*.172,.21,.906,.194,.194,.078,P.cream,22);band.rotation.z=Math.PI/2;}
  rounded(treadmill,0,1.06,-.72,.87,.81,.27,.22,P.woodDark);rounded(treadmill,0,1.09,-.558,.72,.57,.03,.21,P.cream);
  for(const side of [-1,1]){ball(treadmill,side*.17,1.17,-.525,.115,.15,.042,P.white);ball(treadmill,side*.145,1.17,-.482,.044,.075,.020,P.black);}
  rounded(treadmill,0,1.56,-.78,.91,.30,.41,.09,P.yellow);box(treadmill,-.15,1.568,-.552,.31,.16,.019,P.blueDark);
  for(let i=0;i<3;i++)ball(treadmill,.17+i*.11,1.57,-.54,.037,.041,.018,[P.red,P.leaf,P.blue][i]);
  beam(treadmill,[-.37,1.68,-.84],[-.52,1.96,-.86],.048,P.woodLight);ball(treadmill,-.52,1.99,-.86,.094,.085,.081,P.blue);

  // Shallow oval pebble pool, with pale water and individually rounded stones.
  const pool=item('浅蓝卵石小水池',-1.83,6.00,1.19,.83,.06);
  const basin=ball(pool,0,.07,0,1.22,.10,.90,P.stone);basin.castShadow=false;
  const water=mesh(pool,geometry('pool-disc',()=>new THREE.CircleGeometry(1,48)),material(P.water,{roughness:.22,metalness:.04}),0,.235,0);water.rotation.x=-Math.PI/2;water.scale.set(1.05,.70,1);water.castShadow=false;
  for(let i=0;i<17;i++){const a=i/17*Math.PI*2,m=ball(pool,Math.cos(a)*1.13,.25+(i%3)*.025,Math.sin(a)*.77,.22+(i%2)*.035,.17,.19,[P.stone,P.stoneLight,0x9f9b88,0x887e68][i%4]);m.rotation.y=-a+.3;}
  for(const [r,c] of [[.90,P.bluePale],[.63,0x98e6e9]]){const ring=torus(pool,0,.249,0,r,.024,c);ring.rotation.x=-Math.PI/2;ring.scale.y=.66;ring.castShadow=false;}
  for(let i=0;i<4;i++){const x=-.75+i*.11;curve(pool,[[x,.21,-.64],[x-.05,.50+i*.05,-.69],[x-.11,.77+(i%2)*.18,-.71]],.019,P.leafDark,12,4);}

  // Side-profile rocking horse: thick silhouette, four sloping legs, curved
  // parallel wooden runners, orange saddle edging and a green draped saddle.
  const horse=item('蜜色木摇马与双弯底轨',1.52,5.54,1.26,.68,-.09);
  // The quadratic runners rise at both ends; lower their actual center onto
  // the home floor (y=.025), rather than treating a Bezier control as its base.
  horse.position.y-=.244;
  const outline=new THREE.Shape();outline.moveTo(.57,1.12);outline.bezierCurveTo(.90,1.31,.68,1.73,.20,1.77);outline.lineTo(-.34,1.71);outline.lineTo(-.64,2.38);outline.lineTo(-.79,2.63);outline.lineTo(-.97,2.61);outline.lineTo(-1.02,2.38);outline.lineTo(-1.25,2.27);outline.quadraticCurveTo(-1.39,2.03,-1.16,1.96);outline.lineTo(-.91,1.99);outline.lineTo(-.62,1.17);outline.bezierCurveTo(-.30,.99,.16,1.01,.57,1.12);outline.closePath();
  extrude(horse,outline,.49,P.wood,0,0,0,.045);
  for(const side of [-1,1]){
    const outlinePoints=outline.getPoints(48).map(v=>[v.x,v.y,side*.29]);curve(horse,outlinePoints,.020,P.woodDark,62,4);
    for(const x of [-.47,.43]){beam(horse,[x,1.18,side*.18],[x+(x<0?-.14:.17),.43,side*.40],.077,P.woodLight);ball(horse,x+(x<0?-.14:.17),.40,side*.40,.12,.095,.13,P.woodDark);}
    const railShape=new THREE.Shape();railShape.moveTo(-1.33,.51);railShape.quadraticCurveTo(0,-.02,1.33,.51);railShape.lineTo(1.29,.68);railShape.quadraticCurveTo(0,.16,-1.29,.68);railShape.closePath();extrude(horse,railShape,.145,P.wood,0,0,side*.46,.026);
    curve(horse,[[-1.28,.56,side*.55],[-.66,.32,side*.55],[0,.25,side*.55],[.66,.32,side*.55],[1.28,.56,side*.55]],.018,P.woodLight,30,4);
    curve(horse,[[-1.26,.56,side*.55],[-.65,.34,side*.55],[0,.27,side*.55],[.65,.34,side*.55],[1.26,.56,side*.55]],.013,P.woodDark,30,4);
    ball(horse,-1.035,2.31,side*.291,.052,.066,.020,P.black);ball(horse,-1.255,2.09,side*.292,.023,.040,.016,P.woodDark);
    curve(horse,[[-1.20,2.29,side*.30],[-1.14,2.03,side*.32],[-.82,1.96,side*.30],[-.50,2.17,side*.31]],.025,P.woodDark,20,5);
  }
  for(const x of [-.65,.65])beam(horse,[x,.34,-.49],[x,.34,.49],.065,P.woodDark);
  const mane=shape([[-.80,2.56],[-.53,2.32],[-.55,2.15],[-.41,2.12],[-.43,1.93],[-.27,1.88],[-.34,1.72],[-.64,1.96],[-.85,2.43]]);extrude(horse,mane,.54,P.orangeDark,0,0,0,.018);
  const tail=shape([[.54,1.57],[.83,1.76],[.94,2.01],[1.07,1.95],[1.05,1.68],[.81,1.36]]);extrude(horse,tail,.17,P.woodLight,0,0,-.04,.035);
  for(const [scale,c,y] of [[1.12,P.orange,1.64],[1,P.leaf,1.70]]){
    const saddle=group(horse,.04,y,0);const positions=[],ix=[];
    for(let j=0;j<=12;j++){const t=j/12,a=-1.27+t*2.54;for(const x of [-.39*scale,.39*scale])positions.push(x,Math.cos(a)*.17*scale,Math.sin(a)*.40*scale);if(j<12){const k=j*2;ix.push(k,k+2,k+1,k+1,k+2,k+3);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(ix);g.computeVertexNormals();mesh(saddle,g,material(c,{side:THREE.DoubleSide}));
  }
  curve(horse,[[.10,1.77,.43],[.15,1.32,.33],[.15,1.10,.18]],.033,P.cream,13,5);

  // Consolidate static pieces without leaving unreferenced source buffers alive.
  // All attributes are positions/normals here: paint/stripes are real geometry.
  furniture.updateMatrixWorld(true);
  const inverse=new THREE.Matrix4().copy(furniture.matrixWorld).invert(),buckets=new Map(),originals=new Set(),temporaries=[];
  furniture.traverse(o=>{if(!o.isMesh)return;originals.add(o.geometry);const key=o.material.uuid+':'+o.castShadow+':'+o.receiveShadow;if(!buckets.has(key))buckets.set(key,{material:o.material,cast:o.castShadow,receive:o.receiveShadow,geometries:[]});const g=o.geometry.clone();if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));for(const name of Object.keys(g.attributes))if(name!=='position'&&name!=='normal')g.deleteAttribute(name);buckets.get(key).geometries.push(g);temporaries.push(g);});
  furniture.clear();
  let triangles=0;
  for(const bucket of buckets.values()){
    const geometry=mergeGeometries(bucket.geometries,false);if(!geometry)throw new Error('Home furniture geometry could not merge');
    const m=new THREE.Mesh(geometry,bucket.material);m.name='家具合批 '+bucket.material.color.getHexString();m.castShadow=bucket.cast;m.receiveShadow=bucket.receive;furniture.add(m);triangles+=geometry.index.count/3;
  }
  for(const g of originals)g.dispose();for(const g of temporaries)g.dispose();
  furniture.userData={items,triangles,meshes:furniture.children.length,scope:'front-half furniture; rugs are walkable'};
  return {colliders,dynamic:[],updates:[]};
}
