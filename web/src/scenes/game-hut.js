import * as THREE from 'three';
import { addGameHutExterior } from './game-hut-exterior.js';

// Open-front tree room. Geometry, paint and texture caches belong to one visit.
export function createGameHutScene() {
  const root = new THREE.Group(); root.name = '树洞游戏小屋';
  const materials = new Map(), geometries = new Map();
  const P = {bark:0x896436, barkGold:0xbc9452, barkDark:0x50392e, knot:0x3d2e38,
    red:0xbe3837, redLight:0xdc5548, redDark:0x772e32, cream:0xe7dec0,
    yellow:0xf3c446, gold:0xd69630, blue:0x2a52c6, darkBlue:0x25284f,
    purple:0x725884, lilac:0xab96b5, steel:0x8394a1, darkSteel:0x454953,
    leaf:0x417944, lightLeaf:0x78ad62};
  function material(color, extra = {}) {
    const key=String(color)+Object.keys(extra).sort().map(k=>k+':'+(extra[k]&&extra[k].isTexture?extra[k].uuid:extra[k])).join('|');
    if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.82,...extra}));
    return materials.get(key);
  }
  function geometry(key, make) {if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
  function group(p=root,x=0,y=0,z=0,name='') {const g=new THREE.Group();g.position.set(x,y,z);g.name=name;p.add(g);return g;}
  function mesh(p,geo,color,x=0,y=0,z=0) {const m=new THREE.Mesh(geo,color&&color.isMaterial?color:material(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
  function box(p,x,y,z,w,h,d,c) {const m=mesh(p,geometry('box',()=>new THREE.BoxGeometry(1,1,1)),c,x,y,z);m.scale.set(w,h,d);return m;}
  function ball(p,x,y,z,rx,ry,rz,c) {const m=mesh(p,geometry('sphere',()=>new THREE.SphereGeometry(1,16,10)),c,x,y,z);m.scale.set(rx,ry,rz);return m;}
  function cylinder(p,x,y,z,rt,rb,h,c,n=18) {return mesh(p,geometry(['c',rt,rb,h,n].join(':'),()=>new THREE.CylinderGeometry(rt,rb,h,n)),c,x,y,z);}
  function torus(p,x,y,z,r,t,c,arc=Math.PI*2) {return mesh(p,geometry(['t',r,t,arc].join(':'),()=>new THREE.TorusGeometry(r,t,5,28,arc)),c,x,y,z);}
  function beam(p,a,b,r,c) {const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av);const m=mesh(p,geometry('beam',()=>new THREE.CylinderGeometry(1,1,1,8)),c);m.position.copy(av.add(bv).multiplyScalar(.5));m.scale.set(r,v.length(),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
  function curve(p,points,r,c,n=24) {return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),n,r,5,false),c);}
  function texture(w,h,draw) {const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=2;return t;}
  function roundedXY(w,h,r) {const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
  function roundedPanel(p,x,y,z,w,h,r,depth,c) {return mesh(p,geometry(['round',w,h,r,depth].join(':'),()=>new THREE.ExtrudeGeometry(roundedXY(w,h,r),{depth,bevelEnabled:false,curveSegments:6})),c,x,y,z);}
  function star(p,x,y,z,r,c,flat=false) {const s=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.44:r;const xx=Math.cos(a)*rr,yy=Math.sin(a)*rr;if(i)s.lineTo(xx,yy);else s.moveTo(xx,yy);}s.closePath();const m=mesh(p,geometry('star:'+r,()=>new THREE.ExtrudeGeometry(s,{depth:.055,bevelEnabled:false})),c,x,y,z);if(flat)m.rotation.x=-Math.PI/2;return m;}
  const gold=material(P.gold,{metalness:.14,roughness:.46});
  const steel=material(P.steel,{metalness:.20,roughness:.52});

  // Flowing broad wood ribbons and oval knots are painted on a bowed 3D wall.
  const barkMap=texture(1024,512,(ctx,w,h)=>{
    ctx.fillStyle='#82613a';ctx.fillRect(0,0,w,h);
    for(let i=-2;i<28;i++){
      const x=i*41+Math.sin(i*.87)*14,shade=['#5e4533','#9b733d','#bb914b','#6c4a35','#ae8347'][((i%5)+5)%5];
      ctx.fillStyle=shade;ctx.beginPath();
      for(let j=0;j<=40;j++){const y=j*h/40,xx=x+Math.sin(y*.011+i)*15+Math.sin(y*.024+i*1.7)*8;if(j)ctx.lineTo(xx,y);else ctx.moveTo(xx,y);}
      for(let j=40;j>=0;j--){const y=j*h/40,xx=x+17+Math.sin(y*.011+i+.3)*14+Math.sin(y*.024+i*1.7+.4)*9;ctx.lineTo(xx,y);}ctx.closePath();ctx.fill();
    }
    for(const [x,y,rx,ry] of [[110,270,17,110],[320,130,12,94],[581,281,16,111],[810,356,18,127]]){
      ctx.save();ctx.translate(x,y);ctx.rotate((x%3-1)*.18);
      for(let i=4;i>=0;i--){const w=rx*(.25+i*.24),hh=ry*(.22+i*.20);ctx.beginPath();ctx.moveTo(-w*.17,-hh);ctx.bezierCurveTo(w*.58,-hh*.78,w*1.33,-hh*.34,w*.91,hh*.32);ctx.bezierCurveTo(w*.66,hh*.68,w*.08,hh*.93,w*.04,hh);ctx.bezierCurveTo(-w*.88,hh*.67,-w*1.15,hh*.09,-w*.87,-hh*.44);ctx.bezierCurveTo(-w*.72,-hh*.69,-w*.3,-hh*.91,-w*.17,-hh);ctx.closePath();ctx.fillStyle=['#342b35','#5c3e33','#b59150','#745436','#a17b45'][i];ctx.fill();}ctx.restore();
    }
    ctx.lineWidth=1.2;ctx.strokeStyle='rgba(49,31,26,.30)';for(let i=0;i<58;i++){ctx.beginPath();for(let j=0;j<=28;j++){const y=j*h/28,x=i*18+Math.sin(y*.019+i*.7)*9;if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();}
  });
  const bark=material(0xffffff,{map:barkMap,bumpMap:barkMap,bumpScale:.065,roughness:.98});
  const floorMap=texture(256,256,(ctx,w,h)=>{
    ctx.fillStyle='#ab8f59';ctx.fillRect(0,0,w,h);let seed=71;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
    for(let i=0;i<76;i++){const x=rand()*w,y=rand()*h;ctx.fillStyle=['#c9b47f','#d4c496','#bba873','#d7bd7f'][i%4];ctx.beginPath();ctx.ellipse(x,y,3+rand()*9,2+rand()*5,rand()*3,0,Math.PI*2);ctx.fill();}
  });floorMap.wrapS=floorMap.wrapT=THREE.RepeatWrapping;floorMap.repeat.set(5,4);
  const dirt=material(0xffffff,{map:floorMap,roughness:1});
  const floor=mesh(root,new THREE.CircleGeometry(1,64),dirt,0,-.02,-.05);floor.rotation.x=-Math.PI/2;floor.scale.set(9.6,8.25,1);floor.castShadow=false;
  const vertices=[],uvs=[],indices=[],nx=100,ny=30;
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const a=-1.83+i/nx*3.66,y=j/ny*9.5,wobble=.18*Math.sin(a*7+y*.38)+.095*Math.sin(y*1.1+a*12);
    vertices.push(Math.sin(a)*(9.45+wobble),y,-Math.cos(a)*(7.35+wobble));uvs.push(i/nx,1-j/ny);
    if(i<nx&&j<ny){const aa=-1.83+(i+.5)/nx*3.66,xx=(aa-.83)*9.45;const doorHeight=Math.abs(xx)<1.25?1.80+Math.sqrt(Math.max(0,1.25*1.25-xx*xx)):0;
      if((j+.5)/ny*9.5<doorHeight)continue;const k=j*(nx+1)+i;indices.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}
  }
  const wallGeometry=new THREE.BufferGeometry();wallGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));wallGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));wallGeometry.setIndex(indices);wallGeometry.computeVertexNormals();
  const treeWall=mesh(root,wallGeometry,bark);treeWall.material.side=THREE.DoubleSide;treeWall.name='流动树纹弧形树洞内壁';
  addGameHutExterior({root,vertices,uvs,indices,nx,ny,barkMap,floorMap,material});
  for(const [a,y,r] of [[-1.30,2.2,.48],[-1.04,5.8,.36],[-.66,3.5,.52],[-.28,6.5,.38],[.31,5.8,.44],[1.22,5.6,.42]]){
    const knot=group(root,Math.sin(a)*9.26,y,-Math.cos(a)*7.18,'立体树瘤');knot.rotation.y=-a;
    knot.rotation.z=Math.sin(a*5)*.10;
    ball(knot,0,0,-.025,r*.30,r*1.72,.09,P.knot);
    for(const [scale,color] of [[1.0,P.barkDark],[.76,0xa8844c]]){const ring=torus(knot,0,0,.01,1,.085,color);ring.scale.set(r*.55*scale,r*2.18*scale,.50);}
    curve(knot,[[-r*.37,-r*2.6,.04],[-r*.64,-r*.25,.02],[-r*.36,r*2.1,.01],[-r*.03,r*4.5,-.10]],.045,0xc0a25f,24);
  }
  // Roots at floor level soften the seams between vertical trunks and the ground.
  for(const a of [-1.60,-1.31,-1.0,-.65,-.31,.13,.47,1.16,1.55]){
    const x=Math.sin(a)*8.85,z=-Math.cos(a)*6.87;const g=group(root,x,.12,z);g.rotation.y=-a;
    for(const side of [-1,1]){const r=ball(g,side*.38,.24,.58,.31,.39,1.3,P.barkGold);r.rotation.y=side*.4;}
  }

  // The broad red frame encloses eight by six alternating gray / cream tiles.
  box(root,0,.065,1.36,10.10,.18,8.64,P.redDark);
  box(root,0,.165,1.36,9.93,.14,8.47,P.red);
  box(root,0,.244,1.36,9.47,.035,8.02,0x554a43);
  const tileColors=[0x92939f,0xc7c7b2,0xa8a4af,0xb9baa5];
  for(let row=0;row<6;row++)for(let col=0;col<8;col++){
    const x=(col-3.5)*1.155,z=1.36+(row-2.5)*1.308;
    box(root,x,.268,z,1.125,.025,1.278,tileColors[(col+row)%2+(row%3===1?2:0)]);
    if((row+col)%3===0)box(root,x-.44,.283,z,.030,.006,1.25,0xd9d7c5);
  }
  for(const side of [-1,1]){box(root,side*4.81,.288,1.36,.07,.035,8.30,P.redLight);box(root,0,.288,1.36+side*4.13,9.64,.035,.07,P.redLight);}
  // Diagonal pale stripes across the narrow rear sill, clipped into its footprint.
  box(root,-2.1,.11,-3.26,13.65,.13,.43,P.redDark);
  for(let i=0;i<25;i++){const stripe=box(root,-8.55+i*.54,.19,-3.26,.26,.018,.48,i%2?0xe8e0d6:0x94b4cb);stripe.rotation.y=-.56;}

  // Left red star-patterned platform and the deep-blue spherical game machine.
  const machine=group(root,-6.66,0,-.85,'蓝色球形配对游戏机');
  box(root,-6.63,.08,.88,3.45,.20,8.83,P.redDark);box(root,-6.63,.195,.88,3.33,.035,8.71,P.red);
  for(const x of [-8.22,-5.04])box(root,x,.23,.88,.075,.028,8.65,P.cream);
  for(let i=0;i<34;i++){const z=-3.31+i*.254;ball(root,-5.14,.27,z,.025,.025,.025,0xffe8d0);}
  for(const [x,z,r] of [[-6.47,4.21,.88],[-7.44,2.70,.57],[-5.89,-2.71,.45]]){star(root,x,.25,z,r,P.gold,true);star(root,x,.315,z,r*.84,0xffe49b,true);}
  const orbBase=box(machine,0,.42,.18,2.74,.82,2.1,P.steel);orbBase.rotation.x=-.04;
  box(machine,0,.77,1.07,2.5,.12,.13,0x9ec4cf);box(machine,0,.34,1.20,1.88,.39,.16,P.darkBlue);
  const glassBlue=material(P.blue,{roughness:.19,metalness:.12});
  ball(machine,0,2.36,0,1.56,1.91,1.23,P.darkBlue);
  ball(machine,.12,2.51,.105,1.44,1.78,1.19,glassBlue);
  const shadow=ball(machine,-.59,2.04,1.06,.68,1.06,.075,0x393356);shadow.rotation.z=.23;
  const highlight=ball(machine,-.32,3.76,.777,.68,.22,.042,0xbef8ff);highlight.rotation.z=.04;
  ball(machine,.66,3.51,1.019,.18,.18,.042,0xc9fcff);ball(machine,.92,3.16,1.10,.10,.13,.028,0x88d9ff);
  curve(machine,[[-1.60,.93,.38],[-1.69,2.00,.17],[-1.48,3.3,-.19],[-.74,4.24,-.52],[.51,4.35,-.53],[1.49,3.49,-.14]],.115,0x85c3d2,42);
  for(const r of [2.33,2.57]){const pts=[];for(let i=0;i<=36;i++){const a=-1.17+i/36*2.25;pts.push([Math.sin(a)*r,2.21+Math.cos(a)*r,-.57]);}curve(machine,pts,.13,0x33671f,36);}
  const glyphs={P:[[[0,0],[0,1],[.49,1],[.63,.83],[.50,.58],[0,.58]]],A:[[[0,0],[.28,1],[.55,0]],[[.12,.42],[.43,.42]]],I:[[[.05,0],[.50,0]],[[.275,0],[.275,1]],[[.05,1],[.50,1]]],R:[[[0,0],[0,1],[.48,1],[.62,.82],[.47,.58],[0,.58]],[[.31,.58],[.65,0]]],U:[[[0,1],[0,.20],[.12,0],[.43,0],[.56,.20],[.56,1]]]};
  'PAIRUP'.split('').forEach((char,i)=>{const a=-1.08+i*.365,g=group(machine,Math.sin(a)*2.46,2.13+Math.cos(a)*2.46,-.36);g.rotation.z=-a;g.scale.setScalar(.78);for(const line of glyphs[char]){const pts=line.map(([x,y])=>[x-.27,y,0]);curve(g,pts,.135,0x315c1e,16);curve(g,pts.map(p=>[p[0],p[1],.10]),.076,0x85b916,16);}});
  for(const [x,z] of [[-7.60,3.52],[-6.17,2.72],[-5.08,1.36],[-4.94,-.02],[-5.08,-1.40]]){
    const stool=group(root,x,.24,z,'金色弹簧凳');cylinder(stool,0,.08,0,.38,.42,.16,steel,20);
    const spring=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI*6;spring.push([Math.cos(a)*.19,.18+i/48*.62,Math.sin(a)*.19]);}curve(stool,spring,.055,P.darkSteel,48);
    cylinder(stool,0,.85,0,.44,.40,.18,P.gold,24);cylinder(stool,0,.96,0,.41,.41,.065,0xf5bc5e,24);
    ball(stool,-.06,1.005,.04,.31,.035,.26,0xffd37a);
    beam(stool,[.37,.38,-.27],[.39,1.24,-.30],.055,P.gold);ball(stool,.39,1.30,-.30,.13,.14,.13,0xef9735);
  }

  // Small leafy patches are low furniture, leaving the room's board traversable.
  for(const [x,z,s] of [[-4.08,-4.00,1],[-2.76,-4.20,.77],[-1.54,-4.14,.57]]){
    ball(root,x,.58,z,.91*s,.64*s,.62*s,P.leaf);for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(root,x+Math.sin(a)*.6*s,.52+Math.cos(a*2)*.15,z+Math.cos(a)*.37*s,.31*s,.31*s,.30*s,i%2?P.lightLeaf:0x558f50);}
  }
  for(let row=0;row<4;row++)for(let i=0;i<6-row;i++){
    const leaf=star(root,-8.15+i*.60+row*.24,5.0+row*.77,-3.9-row*.37,.72, row%2?0x214a31:0x2a6137);leaf.scale.set(1.1,.72,.6);leaf.rotation.y=.75;
  }

  // Purple claw machine: solid trim, transparent glass, and individual 3D toys.
  const claw=group(root,1.64,.02,-4.73,'透明紫色抓娃娃机');claw.rotation.y=.04;
  box(claw,0,.70,0,3.0,1.38,2.33,P.purple);box(claw,0,.13,.08,2.69,.23,2.21,0x4c3f63);
  box(claw,0,1.45,0,3.23,.16,2.54,P.lilac);box(claw,0,.86,1.194,2.65,.92,.06,0x513f6e);
  const controls=roundedPanel(claw,0,1.20,1.266,2.85,.47,.07,.08,0xd3c5ca);controls.rotation.x=-.12;
  box(claw,-1.08,1.19,1.40,.15,.23,.05,0x3b3944);box(claw,-1.08,1.22,1.435,.045,.13,.025,0xbec6bc);
  cylinder(claw,-.61,1.40,1.42,.11,.11,.08,0xf3bc3c,16);ball(claw,-.44,1.29,1.435,.14,.14,.10,0xe6453c);ball(claw,-.40,1.35,1.50,.047,.047,.028,0xffb080);
  const pushMap=texture(256,104,(ctx,w,h)=>{ctx.fillStyle='#403c64';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#d8d2e1';ctx.lineWidth=9;ctx.strokeRect(5,5,w-10,h-10);ctx.save();ctx.transform(1,0,-.16,1,10,0);ctx.font='italic 900 70px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fcfff3';ctx.fillText('PUSH',w/2,h/2+3);ctx.restore();});
  const push=mesh(claw,new THREE.PlaneGeometry(1.18,.57),material(0xffffff,{map:pushMap}),.61,.72,1.235);push.rotation.z=.04;
  box(claw,-.71,.55,1.241,.96,.38,.06,0x7f6697);box(claw,-.71,.50,1.28,.81,.075,.032,0x473955);
  const glass=material(0xb8c5e0,{transparent:true,opacity:.18,roughness:.20,metalness:.02,side:THREE.DoubleSide,depthWrite:false});
  const pane=(points)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();const m=mesh(claw,geo,glass);m.castShadow=false;return m;};
  pane([[-1.50,1.55,1.17],[1.50,1.55,1.17],[1.70,5.10,1.32],[-1.70,5.10,1.32]]);
  pane([[-1.50,1.55,-1.14],[-1.50,1.55,1.17],[-1.70,5.10,1.32],[-1.70,5.49,-1.34]]);
  pane([[1.50,1.55,1.17],[1.50,1.55,-1.14],[1.70,5.49,-1.34],[1.70,5.10,1.32]]);
  pane([[1.50,1.55,-1.14],[-1.50,1.55,-1.14],[-1.70,5.49,-1.34],[1.70,5.49,-1.34]]);
  for(const sx of [-1,1])for(const sz of [-1,1])beam(claw,[sx*1.50,1.55,sz*1.17],[sx*1.70,sz>0?5.10:5.49,sz*1.32],.050,P.steel);
  const rim=[[-1.70,5.10,1.32],[1.70,5.10,1.32],[1.70,5.49,-1.32],[-1.70,5.49,-1.32],[-1.70,5.10,1.32]];curve(claw,rim,.063,0x9aaac5,32);
  beam(claw,[-1.52,4.98,-.30],[1.52,4.98,-.30],.046,steel);box(claw,.10,4.96,-.30,.45,.16,.35,P.darkSteel);
  beam(claw,[.10,4.93,-.30],[.10,3.60,-.30],.020,P.darkSteel);ball(claw,.10,3.52,-.30,.17,.13,.17,steel);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;curve(claw,[[.10,3.52,-.30],[.10+Math.sin(a)*.30,3.24,-.30+Math.cos(a)*.30],[.10+Math.sin(a)*.20,3.08,-.30+Math.cos(a)*.20]],.035,steel,12);}
  const toyColors=[0xc4557c,0x70b487,0x7eb5d0,0xe9d879,0xb1a7d2,0x88b9af,0xe8acb7];
  for(let i=0;i<16;i++){
    const row=Math.floor(i/4),x=(i%4-1.5)*.61+(row%2)*.13,z=(row-1.5)*.50,y=3.34-row*.52+(i%3)*.065,color=toyColors[i%toyColors.length];
    const toy=group(claw,x,y,z);toy.rotation.y=(i%3-1)*.23;const size=.80+(i%3)*.09;toy.scale.setScalar(size);
    ball(toy,0,.19,0,.35,.33,.26,color);ball(toy,0,.59,.025,.36,.32,.27,color);
    for(const side of [-1,1]){ball(toy,side*.28,.79,.005,.14,i%3===0?.27:.14,.105,color);ball(toy,side*.125,.62,.256,.10,.125,.04,0xf5f3de);ball(toy,side*.125,.615,.296,.039,.06,.02,0x343747);ball(toy,side*.30,.22,.12,.14,.10,.13,color);}
    ball(toy,0,.49,.30,.085,.065,.045,i%2?0xeaaa39:0xdbc791);
    if(i%4===1){const leaf=ball(toy,.10,1.02,0,.085,.25,.035,0x468946);leaf.rotation.z=-.3;}
  }
  // A little pink capsule machine next to the claw cabinet.
  const capsule=group(root,-.96,0,-3.92);cylinder(capsule,0,.40,0,.34,.40,.77,P.gold,12);cylinder(capsule,0,.88,0,.58,.50,.18,0xdd6485,24);ball(capsule,0,1.28,0,.48,.39,.38,0xd96086);torus(capsule,0,1.30,.32,.29,.07,0xf1c45b);ball(capsule,0,1.3,.38,.20,.20,.04,0xf3e2b3);

  // Warm, irregular arched exit through the rear-right tree wall.
  const exitAngle=.83,exit=group(root,Math.sin(exitAngle)*9.25,0,-Math.cos(exitAngle)*7.20,'通往游乐场的暖色树洞');exit.rotation.y=-exitAngle;
  const outer=1.40,inner=.98,leg=1.50,opening=new THREE.Shape();opening.moveTo(-outer,0);opening.lineTo(-outer,leg);opening.absarc(0,leg,outer,Math.PI,0,true);opening.lineTo(outer,0);opening.lineTo(inner,0);opening.lineTo(inner,leg);opening.absarc(0,leg,inner,0,Math.PI,false);opening.lineTo(-inner,0);opening.closePath();
  mesh(exit,new THREE.ExtrudeGeometry(opening,{depth:.64,bevelEnabled:true,bevelSize:.10,bevelThickness:.10,bevelSegments:1,curveSegments:18}),P.barkDark,0,.02,-.25);
  for(let i=0;i<10;i++){const a=i/9*Math.PI,rootlet=ball(exit,Math.cos(a)*1.18,1.48+Math.sin(a)*1.18,.26,.15,.39,.14,i%2?P.barkGold:0xd2b163);rootlet.rotation.z=a-Math.PI/2;}
  const doorShape=new THREE.Shape();doorShape.moveTo(-1.02,0);doorShape.lineTo(1.02,0);doorShape.lineTo(1.02,1.5);doorShape.absarc(0,1.5,1.02,0,Math.PI,false);doorShape.closePath();
  const glow=mesh(exit,new THREE.ShapeGeometry(doorShape),material(0xe9cf73,{emissive:0xa57e20,emissiveIntensity:.16,side:THREE.DoubleSide}),0,.02,-.08);glow.castShadow=false;
  for(let i=0;i<6;i++){const strip=box(exit,-.83+i*.33,1.25,-.04,.095,2.36,.035,i%2?0xd5b05b:0xf4df91);strip.rotation.z=(i%2?1:-1)*.05;}
  ball(exit,0,.07,.87,1.37,.10,1.0,0xd9bc76);

  // Right front console follows a crescent: red casing, blue keys and yellow pads.
  const consoleUnit=group(root,6.27,.05,2.52,'四屏弧形游戏控制台');consoleUnit.rotation.y=-.19;
  function crescent(rx,rz,ix,iz) {const s=new THREE.Shape();for(let i=0;i<=40;i++){const a=-1.40+i/40*2.80,x=Math.sin(a)*rx,z=Math.cos(a)*rz;if(i)s.lineTo(x,-z);else s.moveTo(x,-z);}for(let i=40;i>=0;i--){const a=-1.40+i/40*2.8;s.lineTo(Math.sin(a)*ix,-Math.cos(a)*iz);}s.closePath();return s;}
  function arcBody(rx,rz,ix,iz,y,h,c) {const m=mesh(consoleUnit,new THREE.ExtrudeGeometry(crescent(rx,rz,ix,iz),{depth:h,bevelEnabled:false}),c,0,y,0);m.rotation.x=-Math.PI/2;return m;}
  arcBody(2.15,1.86,1.13,.67,.14,.71,P.redDark);arcBody(2.11,1.82,1.16,.70,.88,.18,P.red);arcBody(1.68,1.18,1.33,.89,1.16,.65,P.redLight);
  for(let i=0;i<8;i++){
    const a=-1.28+i/7*2.56,x=Math.sin(a)*1.86,z=Math.cos(a)*1.58;
    cylinder(consoleUnit,x,1.10,z,.31,.34,.11,P.gold,20);cylinder(consoleUnit,x,1.177,z,.265,.265,.07,P.yellow,24);ball(consoleUnit,x-.05,1.217,z+.03,.18,.022,.15,0xffdc65);
    const rib=box(consoleUnit,Math.sin(a)*2.12,.52,Math.cos(a)*1.83,.055,.64,.11,P.redLight);rib.rotation.y=a;
  }
  for(let i=0;i<13;i++){
    const a=-1.35+i/12*2.70,key=group(consoleUnit,Math.sin(a)*1.58,1.87,Math.cos(a)*1.11);key.rotation.y=a;key.rotation.x=-.30;
    box(key,0,0,0,.27,.075,.24,P.darkBlue);box(key,0,.049,0,.18,.02,.16,i%2?0x5ab0ca:0x6098d2);
  }
  for(const side of [-1,1]){
    const handle=group(consoleUnit,side*2.13,0,.75);curve(handle,[[0,.24,-.40],[0,1.48,-.40],[0,1.59,.73],[0,.27,.88]],.073,steel,20);box(handle,0,1.58,.17,.20,.095,.62,0xc8c5b2);
    const fin=box(consoleUnit,side*1.85,.72,-.58,.22,1.13,1.35,0xcbd4c7);fin.rotation.z=-side*.18;
  }
  box(consoleUnit,0,1.26,-.65,1.71,1.96,1.16,P.darkSteel);box(consoleUnit,0,2.08,-.57,1.75,.14,1.35,steel);
  function monitor(x,y,z,tilt,turn) {
    const screen=group(consoleUnit,x,y,z,'黄色 CRT 蓝色屏幕');screen.rotation.z=tilt;screen.rotation.y=turn;screen.rotation.x=-.095;
    roundedPanel(screen,0,0,-.54,1.44,1.28,.15,.88,0xb18130);
    roundedPanel(screen,0,0,.33,1.58,1.41,.19,.12,P.yellow);
    roundedPanel(screen,0,.02,.467,1.30,1.12,.17,.035,0x415a60);
    roundedPanel(screen,0,.025,.507,1.13,.96,.14,.018,0x217eaf);
    const screenGlass=ball(screen,0,.023,.53,.544,.455,.033,0x2797bf);screenGlass.castShadow=false;
    const reflection=ball(screen,-.21,.29,.557,.23,.077,.011,0x63c4dc);reflection.rotation.z=.08;
    box(screen,.10,.721,-.03,.48,.014,.055,0x755828);const handle=box(screen,.31,.747,-.03,.06,.065,.055,0x755828);handle.rotation.z=-.38;
    for(let i=0;i<4;i++)box(screen,.734,-.30+i*.15,-.10,.023,.077,.32,0x72562b);
    return screen;
  }
  const monitors=[[-.71,2.55,-.28,-.20,-.30],[.76,2.47,-.17,.10,.31],[-.64,4.03,-.49,-.04,-.35],[.85,3.91,-.47,.22,.20]];
  monitors.forEach(args=>monitor(...args));
  for(let i=0;i<4;i++){
    const [x,y,z]=monitors[i],points=[[x,y,z-.65],[x+(i%2?1:-1)*.52,y+.21,z-1.02],[x+(i%2?1:-1)*.79,y-.42,z-1.08],[x*.77,1.63,-1.04]];
    const hoseCurve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));mesh(consoleUnit,new THREE.TubeGeometry(hoseCurve,32,.115,8,false),0x393b40);
    for(let j=0;j<16;j++){const t=j/15,at=hoseCurve.getPoint(t),ring=torus(consoleUnit,at.x,at.y,at.z,.13,.023,0x85847d);ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),hoseCurve.getTangent(t).normalize());}
  }

  // Two swagging strings of golden stars, with no opaque ceiling over the room.
  for(let row=0;row<2;row++){
    const points=[];for(let i=0;i<=40;i++){const t=i/40;points.push([-2.55+t*9.1,7.64-row*.74-Math.sin(t*Math.PI)*.44,-5.2-row*.20]);}curve(root,points,.026,P.gold,40);
    for(let i=0;i<11;i++){const t=(i+.3)/11,x=-2.55+t*9.1,y=7.64-row*.74-Math.sin(t*Math.PI)*.44,z=-5.18-row*.20,r=.13+(i%4)*.066;beam(root,[x,y,z],[x,y-.16,z],.014,P.gold);star(root,x,y-.22,z,r+ .035,0xffe39a);star(root,x,y-.22,z+.06,r,0xcaa034);}
  }
  const spot=group(root,7.78,7.00,-3.05,'树梢黑色舞台灯');spot.rotation.x=-.32;spot.rotation.y=-.38;
  const body=cylinder(spot,0,0,0,.37,.45,1.39,0x232729,20);body.rotation.x=Math.PI/2;
  cylinder(spot,0,0,.71,.38,.38,.05,0x080d11,20).rotation.x=Math.PI/2;
  for(const [x,y,w,h,angle] of [[-.59,0,.48,.78,-.38],[.59,0,.48,.78,.38],[0,.55,.82,.42,0],[0,-.55,.82,.42,0]]){const flap=box(spot,x,y,.70,w,h,.045,0x343838);flap.rotation.y=angle;}
  curve(root,[[8.20,7.75,-3.70],[7.9,7.47,-3.2],[7.78,7.20,-3.05]],.063,P.darkSteel,14);

  // Poster props use small local paint canvases, never the supplied room image.
  function notice(x,y,z,angle,green=false) {
    const g=group(root,x,y,z);g.rotation.y=angle;g.rotation.z=-.10;
    box(g,0,0,0,.92,1.41,.07,0xbd9870);box(g,0,0,.044,.81,1.28,.02,0xe4c5a0);
    ball(g,-.22,.45,.08,.08,.08,.025,green?0x739753:0xbe7655);star(g,.22,.43,.08,.10,P.yellow);
    for(let i=0;i<6;i++)box(g,-.02,.22-i*.145,.070,.57-(i%3)*.07,.026,.015,0xb98c71);
  }
  notice(-.53,6.21,-6.84,.04,true);notice(4.64,5.87,-6.15,-.49);

  return {
    root,indoor:true,background:0x5b4734,spawn:[0,.30,2.0],
    bounds:{minX:-8.55,maxX:8.55,minZ:-6.25,maxZ:6.35},
    heightAt:(x,z)=>Math.abs(x)<5.05&&z>-2.97&&z<5.68?.30:.05,
    walkable:(x,z)=>(x/9.35)**2+((z+.05)/8.10)**2<1,
    colliders:[
      {x:-6.63,z:.88,rx:1.95,rz:4.44},
      {x:1.64,z:-4.73,rx:1.78,rz:1.46},
      {x:-.96,z:-3.92,rx:.56,rz:.55,kind:'ellipse'},
      {x:6.27,z:2.52,rx:2.36,rz:2.28,kind:'ellipse'},
      {x:-3.95,z:-4.15,rx:1.3,rz:.62,kind:'ellipse'},
    ],
    portalLocations:{playground:[6.13,.05,-3.63]},dynamic:[],updates:[],
    camera:{perspectivePosition:[.40,12.2,16.45],perspectiveTarget:[-.10,2.25,-.50],fov:37,wideZoom:.82,wideLift:.50,span:18.8,position:[0,19,24],target:[-.10,2.25,-.50]},
  };
}
