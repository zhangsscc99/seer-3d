import * as THREE from 'three';

// The study is an open-front room. Every resource belongs to this scene instance.
export function createCastleStudyScene() {
  const root = new THREE.Group(); root.name = '城堡书房';
  const materials = new Map(), geometries = new Map(), colliders = [], dynamic = [], updates = [];
  const P = {wood:0xa86032, lightWood:0xd08a48, darkWood:0x774229, recess:0x684331,
    edge:0x854b31, gold:0xdba535, brightGold:0xf4ce57, cream:0xf8e8c8,
    blue:0x3e71a5, blueLight:0x638dc0, blueDark:0x2b5889, curtain:0xbc455f,
    curtainDark:0x922d49, pink:0xe7788b, wall:0xe6cdbb, mauve:0xb6948c};
  function material(color, extra = {}) {
    const key = String(color) + JSON.stringify(extra);
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color,roughness:.84,...extra}));
    return materials.get(key);
  }
  function geometry(key, make) { if (!geometries.has(key)) geometries.set(key,make()); return geometries.get(key); }
  function group(parent=root,x=0,y=0,z=0,name='') { const g=new THREE.Group();g.position.set(x,y,z);g.name=name;parent.add(g);return g; }
  function mesh(parent,geo,color,x=0,y=0,z=0) {
    const m=new THREE.Mesh(geo,color && color.isMaterial ? color:material(color));m.position.set(x,y,z);
    m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function box(p,x,y,z,w,h,d,color) { const m=mesh(p,geometry('box',()=>new THREE.BoxGeometry(1,1,1)),color,x,y,z);m.scale.set(w,h,d);return m; }
  function ball(p,x,y,z,rx,ry,rz,color) {const m=mesh(p,geometry('sphere',()=>new THREE.SphereGeometry(1,14,10)),color,x,y,z);m.scale.set(rx,ry,rz);return m;}
  function cylinder(p,x,y,z,top,bottom,h,color,n=20) {
    return mesh(p,geometry(['c',top,bottom,h,n].join(':'),()=>new THREE.CylinderGeometry(top,bottom,h,n)),color,x,y,z);
  }
  function torus(p,x,y,z,r,t,color,arc=Math.PI*2) {
    return mesh(p,geometry(['t',r,t,arc].join(':'),()=>new THREE.TorusGeometry(r,t,5,32,arc)),color,x,y,z);
  }
  function beam(p,a,b,r,color) {
    const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),v=to.clone().sub(from);
    const m=cylinder(p,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,r,v.length(),color,8);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;
  }
  function curve(p,points,r,color,segments=18) {
    return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),segments,r,5,false),color);
  }
  function canvasTexture(width,height,draw) {
    const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=2;return t;
  }
  const grain=canvasTexture(256,512,(ctx,w,h)=>{
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.lineWidth=2;
    for(let i=0;i<38;i++){ctx.strokeStyle=i%3?'rgba(96,56,30,.13)':'rgba(255,224,151,.2)';ctx.beginPath();
      const x=i*7;ctx.moveTo(x,0);ctx.bezierCurveTo(x+9,170,x-12,335,x+3,h);ctx.stroke();}
  });
  const wood=new THREE.MeshStandardMaterial({color:P.wood,map:grain,roughness:.87});
  const lightWood=new THREE.MeshStandardMaterial({color:P.lightWood,map:grain,roughness:.8});
  const gold=material(P.gold,{metalness:.22,roughness:.49});
  const upholstery=material(P.blue,{roughness:.96});
  function roundedSlab(p,x,y,z,w,d,h,r,color) {
    const s=new THREE.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);
    s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);
    s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
    const m=mesh(p,new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:5}),color,x,y,z);m.rotation.x=-Math.PI/2;return m;
  }
  function archShape(w,h) {
    const r=w/2,s=new THREE.Shape();s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);
    s.absarc(0,h-r,r,0,Math.PI,false);s.lineTo(-r,0);return s;
  }
  function arch(p,x,y,z,w,h,depth,color) {return mesh(p,new THREE.ExtrudeGeometry(archShape(w,h),{depth,bevelEnabled:false,curveSegments:16}),color,x,y,z);}
  function panel(p,x,y,z,w,h,color=wood) {
    box(p,x,y,z,w,h,.13,color);box(p,x,y,z+.08,w-.16,h-.17,.04,P.darkWood);
    box(p,x,y,z+.105,w-.23,h-.25,.035,color);
  }
  function scroll(p,x,y,z,size=.4,color=P.gold) {
    const pts=[];for(let i=0;i<=20;i++){const a=i/20*Math.PI*1.6,r=size*(1-i/26);pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r,z]);}
    curve(p,pts,.025,color,24);
  }

  // A large continuous pale gray and dusty-mauve floor ornament, not a repeated tile.
  const floorMap=canvasTexture(1536,1536,(ctx,w,h)=>{
    ctx.fillStyle='#dfe1df';ctx.fillRect(0,0,w,h);
    const cx=w*.49,cy=h*.54,r=w*.325;ctx.fillStyle='#b79690';ctx.strokeStyle='#a9867f';ctx.lineWidth=4;
    for(let i=0;i<8;i++){
      ctx.save();ctx.translate(cx,cy);ctx.rotate(i*Math.PI/4);
      ctx.beginPath();ctx.moveTo(-r*.14,-r*.90);ctx.bezierCurveTo(-r*.31,-r*1.35,-r*.68,-r*1.17,-r*.48,-r*1.46);
      ctx.bezierCurveTo(-r*.28,-r*1.25,-r*.10,-r*1.34,0,-r*1.70);
      ctx.bezierCurveTo(r*.18,-r*1.32,r*.39,-r*1.36,r*.53,-r*1.47);
      ctx.bezierCurveTo(r*.57,-r*1.18,r*.22,-r*1.18,r*.15,-r*.90);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#e5e6e3';ctx.beginPath();ctx.arc(cx,cy,r*.88,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#b3918a';ctx.beginPath();ctx.arc(cx,cy,r*.65,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#e5e5e1';ctx.beginPath();ctx.arc(cx,cy,r*.60,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#b89891';ctx.beginPath();ctx.arc(cx,cy,r*.35,0,Math.PI*2);ctx.fill();ctx.stroke();
  });
  const floorMaterial=new THREE.MeshStandardMaterial({map:floorMap,roughness:.93});
  const floor=mesh(root,new THREE.PlaneGeometry(18.8,17.2),floorMaterial,0,.016,.1);floor.rotation.x=-Math.PI/2;floor.castShadow=false;floor.name='浅灰与灰紫卷花圆纹地板';
  box(root,0,-.15,.1,18.8,.3,17.2,0xb1998b);
  const walls=group(root,0,0,0,'木线脚与奶油色书房墙面');
  mesh(walls,new THREE.PlaneGeometry(18.8,8.7),P.wall,0,4.35,-8.2);
  const leftWall=mesh(walls,new THREE.PlaneGeometry(16.8,8.7),P.wall,-9.3,4.35,.1);leftWall.rotation.y=Math.PI/2;
  const rightWall=mesh(walls,new THREE.PlaneGeometry(16.8,8.7),P.wall,9.3,4.35,.1);rightWall.rotation.y=-Math.PI/2;
  for(const y of [.15,.45,8.25,8.62]){
    box(walls,0,y,-7.99,18.6,.15,.25,P.lightWood);
    box(walls,-9.09,y,.05,.22,.15,16.1,P.lightWood);box(walls,9.09,y,.05,.22,.15,16.1,P.lightWood);
  }
  // Cabinet sections have deep shelves, individual slightly leaning spines and gold bands.
  const bookColors=[0xf0cb68,0x79a59c,0x80a9cc,0xc6a0bd,0xac764d,0xdbb45c,0x78a574,0xd49a9d,0x7189b2];
  let bookSeed=317;
  function random(){bookSeed=(Math.imul(bookSeed,1664525)+1013904223)>>>0;return bookSeed/4294967296;}
  function books(p,left,right,y,z,maxHeight,seed=0) {
    let x=left+.07,index=seed;
    while(x<right-.15){const width=.13+random()*.09,height=maxHeight*(.70+random()*.27);if(x+width>right)break;
      const b=group(p,x+width/2,y,z,'彩色书脊');b.rotation.z=(random()-.5)*.14;
      box(b,0,height/2,0,width,height,.32,bookColors[index%bookColors.length]);
      box(b,0,height*.10,.168,width+.015,.035,.025,P.cream);box(b,0,height*.86,.168,width+.015,.032,.025,P.gold);
      if(index%4===0)box(b,0,height*.53,.17,width*.62,.10,.027,0xeed99f);
      x+=width+.026;index++;
    }
  }
  function shelfFrame(p,w,h,depth=.72) {
    box(p,0,h/2,-depth*.27,w,h,.2,P.recess);
    for(const side of [-1,1]){box(p,side*(w/2-.12),h/2,0,.24,h,depth,wood);box(p,side*(w/2-.12),h/2,depth/2+.03,.065,h-.12,.075,P.lightWood);}
    for(const y of [.19,h-.18]){box(p,0,y,0,w+.15,.32,depth+.1,lightWood);box(p,0,y+.06,depth/2+.12,w+.19,.075,.06,P.gold);}
  }
  const leftShelf=group(root,-8.72,0,.2,'左侧整面书架');leftShelf.rotation.y=Math.PI/2;
  shelfFrame(leftShelf,14.9,8.6,.86);
  const divisions=[-7.45,-4.47,-1.49,1.49,4.47,7.45];
  for(const x of divisions.slice(1,-1))box(leftShelf,x,4.3,0,.17,8.35,.86,wood);
  for(const y of [1.8,3.22,4.65,6.10,7.43])box(leftShelf,0,y,.03,14.65,.14,.82,lightWood);
  for(let col=0;col<5;col++){
    const cx=(divisions[col]+divisions[col+1])/2;
    for(const side of [-1,1]){panel(leftShelf,cx+side*.67,.96,.49,1.24,1.43);ball(leftShelf,cx+side*.13,.99,.67,.09,.09,.08,P.gold);}
    for(const [y,h] of [[1.9,1.19],[3.31,1.20],[4.74,1.22],[6.19,1.11],[7.52,.84]])books(leftShelf,divisions[col]+.14,divisions[col+1]-.14,y,.27,h,col);
  }
  colliders.push({x:-8.7,z:.1,w:1.3,d:15.7});
  const rearShelf=group(root,.5,0,-7.54,'后墙藏书与六座奖杯');shelfFrame(rearShelf,9.4,8.55,1.0);
  box(rearShelf,0,2.4,-.15,9.06,3.45,.15,0x6c514d);
  for(const x of [-4.57,0,4.57])box(rearShelf,x,2.60,.04,.16,4.40,.93,wood);
  for(const y of [.65,2.0,3.47,4.79]){box(rearShelf,0,y,.05,9.19,.15,1.03,lightWood);box(rearShelf,0,y,.62,9.27,.055,.055,P.gold);}
  for(const [left,right] of [[-4.43,-.14],[.15,4.43]]){books(rearShelf,left,right,.76,.34,1.13);books(rearShelf,left,right,2.1,.34,1.20);}
  box(rearShelf,0,4.07,-.31,9.04,1.18,.13,0x806174);
  box(rearShelf,0,6.62,.04,9.08,3.42,.94,wood);
  for(let i=0;i<4;i++){const x=-3.42+i*2.28;panel(rearShelf,x,6.61,.56,2.1,3.12);ball(rearShelf,x+(i%2?-.72:.72),6.1,.72,.12,.15,.07,P.brightGold);}
  for(const y of [5.02,8.38])box(rearShelf,0,y,.64,9.28,.14,.14,lightWood);
  // Small shield medallion on the cabinet plinth.
  const shield=new THREE.Shape();shield.moveTo(-.35,.38);shield.lineTo(.35,.38);shield.lineTo(.3,-.12);shield.quadraticCurveTo(0,-.48,-.3,-.12);shield.closePath();
  mesh(rearShelf,new THREE.ExtrudeGeometry(shield,{depth:.07,bevelEnabled:false}),P.gold,-2.2,.36,.62);
  for(const x of [-.16,0,.16])beam(rearShelf,[-2.2+x,.24,.72],[-2.2+x,.63,.72],.027,P.darkWood);
  colliders.push({x:.5,z:-7.2,w:9.65,d:1.5});
  function trophy(parent,x,index) {
    const g=group(parent,x,3.59,.29,'第'+(index+1)+'座金色奖杯');
    box(g,0,.06,0,.73,.13,.46,[0x506881,0xb65763,0xae5767,0x925861,0x8461a9,0xc79b6a][index]);
    cylinder(g,0,.18,0,.22,.31,.17,gold,16);cylinder(g,0,.32,0,.075,.12,.19,gold,12);
    if(index===0||index===2){
      const pts=[[0,0],[.09,0],[.12,.07],[.24,.12],[.30,.29],[.34,.35],[.30,.39],[.25,.34],[.23,.21],[.13,.11],[0,.07]].map(p=>new THREE.Vector2(...p));
      mesh(g,new THREE.LatheGeometry(pts,18),gold,0,.39,0);
      for(const side of [-1,1]){const h=torus(g,side*.31,.64,0,.16,.038,gold);h.scale.set(.8,1,1);}
      if(index===2){ball(g,0,.90,0,.075,.11,.075,P.brightGold);}
    }else if(index===1){
      const star=new THREE.Shape();for(let n=0;n<10;n++){const a=Math.PI/2+n*Math.PI/5,r=n%2?.16:.33;const xx=Math.cos(a)*r,yy=Math.sin(a)*r;n?star.lineTo(xx,yy):star.moveTo(xx,yy);}star.closePath();
      mesh(g,new THREE.ExtrudeGeometry(star,{depth:.1,bevelEnabled:false}),gold,0,.66,-.04);
    }else if(index===3){
      cylinder(g,0,.50,0,.29,.17,.22,gold,8);
      for(let n=0;n<5;n++){const a=n/5*Math.PI*2;beam(g,[Math.sin(a)*.19,.55,Math.cos(a)*.19],[Math.sin(a)*.28,.90,Math.cos(a)*.28],.062,gold);ball(g,Math.sin(a)*.28,.91,Math.cos(a)*.28,.066,.067,.066,P.brightGold);}
    }else if(index===4){
      ball(g,0,.65,0,.28,.28,.28,gold);const band=torus(g,0,.65,0,.35,.027,P.brightGold);band.rotation.z=-.5;band.rotation.y=.3;
      beam(g,[-.30,.49,0],[.29,.86,0],.025,P.brightGold);
    }else{
      const horn=cylinder(g,.06,.64,0,.22,.075,.47,gold,12);horn.rotation.z=-.55;
      torus(g,-.19,.54,0,.15,.035,gold);box(g,.18,.93,0,.3,.065,.27,P.brightGold);
    }
  }
  for(let i=0;i<6;i++)trophy(rearShelf,-3.86+i*1.55,i);

  function curtain(parent,x,z,width,height,name) {
    const g=group(parent,x,0,z,name),vertices=[],colors=[],indices=[];
    const cols=16,rows=18;
    for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
      const t=row/rows,u=col/cols,y=height*t;
      const spread=1-.15*Math.sin(t*Math.PI),xx=(u-.5)*width*spread;
      const wave=Math.sin(u*Math.PI*8),zz=.16+wave*.13 + Math.sin(t*Math.PI)*.10;
      vertices.push(xx,y+(1-t)*(.065+Math.cos(u*Math.PI*8)*.04),zz);
      const c=new THREE.Color(wave>.4?P.pink:wave<-.45?P.curtainDark:P.curtain);colors.push(c.r,c.g,c.b);
      if(row<rows&&col<cols){const a=row*(cols+1)+col,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
    mesh(g,geo,material(0xffffff,{vertexColors:true,side:THREE.DoubleSide,roughness:1}));
    return g;
  }
  // Rear double-panel wooden door framed by the long red-pink drapes.
  const doorway=group(root,-6.6,0,-7.66,'回大厅的木门');
  box(doorway,0,2.95,0,2.17,5.9,.30,P.darkWood);box(doorway,0,2.93,.18,1.88,5.66,.20,wood);
  for(const side of [-1,1]){
    panel(doorway,side*.46,1.28,.33,.78,1.87);panel(doorway,side*.46,4.5,.33,.78,1.87);
    ball(doorway,side*.16,2.57,.57,.085,.1,.06,P.gold);
    box(doorway,side*1.16,3,.28,.18,6.0,.18,lightWood);
  }
  const doorRing=torus(doorway,0,2.92,.50,.62,.065,P.lightWood);doorRing.scale.x=.73;
  box(doorway,0,6.03,.26,2.63,.24,.42,lightWood);box(doorway,0,2.95,.46,.04,5.45,.04,P.edge);
  const matTex=canvasTexture(384,256,(ctx,w,h)=>{
    ctx.fillStyle='#f4e1c3';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#ce8d55';ctx.lineWidth=11;ctx.strokeRect(12,12,w-24,h-24);ctx.lineWidth=4;ctx.strokeRect(27,27,w-54,h-54);
    for(let x=35;x<w;x+=32){ctx.beginPath();ctx.arc(x,15,12,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(x,h-15,12,0,Math.PI*2);ctx.stroke();}
    ctx.lineWidth=15;ctx.beginPath();ctx.ellipse(w*.48,h*.52,55,64,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(w*.25,h*.68);ctx.quadraticCurveTo(w*.30,h*.26,w*.40,h*.42);ctx.stroke();
  });
  const doormat=mesh(root,new THREE.PlaneGeometry(2.35,1.38),new THREE.MeshStandardMaterial({map:matTex,roughness:.96}),-6.6,.028,-6.34);doormat.rotation.x=-Math.PI/2;doormat.castShadow=false;
  curtain(root,-8.16,-7.24,1.02,8.5,'门左帘');curtain(root,-4.95,-7.17,1.38,8.5,'门右帘');

  // Recessed arched windows fill the right wall with cyan daylight.
  function windowBay(z) {
    const g=group(root,9.03,0,z,'高拱窗与酒红色窗帘');g.rotation.y=-Math.PI/2;
    arch(g,0,.73,-.08,2.60,7.14,.11,0xa57343);
    arch(g,0,.88,.045,2.22,6.82,.04,material(0x9ee0e8,{emissive:0x50818b,emissiveIntensity:.28,roughness:.6}));
    arch(g,0,.97,.085,1.94,6.52,.025,material(0xb3edf2,{emissive:0x6cabb7,emissiveIntensity:.22,roughness:.6}));
    const topY=.97+6.52-.97;
    beam(g,[0,1.01,.14],[0,7.53,.14],.065,P.lightWood);
    for(const y of [2.60,4.28,5.84])box(g,0,y,.15,2.02,.12,.10,P.lightWood);
    beam(g,[-.76,6.52,.14],[0,5.84,.14],.064,P.lightWood);beam(g,[.76,6.52,.14],[0,5.84,.14],.064,P.lightWood);
    const top=torus(g,0,topY,.13,.97,.067,P.cream,Math.PI);top.rotation.z=0;
    box(g,0,.69,.16,2.88,.20,.43,P.lightWood);box(g,0,.82,.21,2.82,.13,.47,P.cream);
    for(const side of [-1,1]){
      curtain(g,side*1.71,.02,1.07,8.38,'窗侧长帘');
      box(g,side*1.29,4.09,.06,.15,6.75,.16,P.cream);
    }
    const header=curve(g,[[-2.16,8.45,.31],[-1.30,7.98,.5],[0,7.69,.45],[1.30,7.98,.5],[2.16,8.45,.31]],.16,0xc1976a,26);
    header.name='窗顶弧形金棕布幔';
    for(const side of [-1,1])for(let i=0;i<6;i++)box(g,side*1.49,1.17+i*.83,-.01,.22,.42,.11,i%2?0xd6bca1:0xf1d6b7);
  }
  windowBay(-4.4);windowBay(1.25);windowBay(6.6);

  // Roman dial and a moving brass pendulum are separate geometry, behind a warm glass panel.
  const clock=group(root,6.82,0,-6.87,'罗马字盘落地钟');clock.rotation.y=-.08;
  box(clock,0,3.09,0,1.94,6.18,.84,wood);box(clock,0,.19,.06,2.19,.38,1.02,lightWood);
  for(const side of [-1,1])box(clock,side*.86,3.19,.48,.14,5.56,.12,gold);
  const cap=curve(clock,[[-1.14,6.15,.06],[-.61,6.52,.05],[0,6.64,.05],[.61,6.52,.05],[1.14,6.15,.06]],.17,lightWood,22);
  cap.name='弧顶钟冠';
  const dialMap=canvasTexture(384,384,(ctx,w,h)=>{
    ctx.fillStyle='#f4e1b8';ctx.fillRect(0,0,w,h);ctx.translate(w/2,h/2);
    ctx.strokeStyle='#60432f';ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,181,0,Math.PI*2);ctx.stroke();
    const romans=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
    ctx.font='bold 36px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';
    for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.save();ctx.translate(Math.sin(a)*145,-Math.cos(a)*145);ctx.rotate(a);ctx.fillStyle='#514538';ctx.fillText(romans[i],0,0);ctx.restore();}
    ctx.fillStyle='#916b3e';for(let i=0;i<60;i++){const a=i*Math.PI/30;ctx.beginPath();ctx.arc(Math.sin(a)*169,-Math.cos(a)*169,i%5?1.5:2.4,0,Math.PI*2);ctx.fill();}
  });
  const face=mesh(clock,new THREE.CircleGeometry(.83,48),new THREE.MeshBasicMaterial({map:dialMap}),0,5.27,.448);face.castShadow=false;
  torus(clock,0,5.27,.47,.855,.05,P.darkWood);torus(clock,0,5.27,.49,.91,.042,P.gold);
  beam(clock,[0,5.27,.51],[.12,5.83,.51],.029,P.darkWood);beam(clock,[0,5.27,.53],[-.25,5.59,.53],.037,P.darkWood);ball(clock,0,5.27,.55,.08,.08,.04,P.darkWood);
  arch(clock,0,.90,.437,1.51,3.40,.042,P.gold);arch(clock,0,1.02,.49,1.26,3.14,.021,0x9a7150);
  const pendulum=group(clock,0,3.88,.56,'可摆动金色钟摆');beam(pendulum,[0,0,0],[0,-1.39,0],.027,P.brightGold);
  ball(pendulum,0,-1.55,.012,.30,.30,.07,gold);torus(pendulum,0,-1.55,.091,.21,.023,P.brightGold);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;beam(pendulum,[0,-1.55,.1],[Math.cos(a)*.22,-1.55+Math.sin(a)*.22,.1],.012,P.brightGold);}
  const glass=arch(clock,0,1.05,.68,1.19,3.05,.01,material(0xfce9cf,{transparent:true,opacity:.19,depthWrite:false,roughness:.2}));glass.castShadow=false;
  for(const side of [-1,1])scroll(clock,side*.48,.59,.56,.30,P.edge);
  dynamic.push(pendulum);updates.push(t=>{pendulum.rotation.z=Math.sin(t*1.7)*.075;});
  colliders.push({x:6.82,z:-6.80,w:2.18,d:1.35});

  const pageMap=canvasTexture(384,256,(ctx,w,h)=>{
    ctx.fillStyle='#fffdf0';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#cead70';ctx.lineWidth=10;ctx.strokeRect(8,8,w-16,h-16);
    ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=16;
    for(let i=0;i<3;i++){const x=45+i*104;ctx.beginPath();ctx.moveTo(x,218);ctx.bezierCurveTo(x+12,169,x+4,77,x+30,42);ctx.bezierCurveTo(x+54,87,x+58,158,x+76,219);ctx.stroke();}
  });
  const pages=new THREE.MeshStandardMaterial({map:pageMap,roughness:.94});
  function chair(parent,x,z,yaw=0) {
    const g=group(parent,x,0,z,'金边蓝绒扶手椅');g.rotation.y=yaw;
    ball(g,0,.91,0,.66,.13,.58,gold);ball(g,0,1.045,.02,.57,.13,.51,upholstery);
    for(const xx of [-.19,.19])for(const zz of [-.13,.18])ball(g,xx,1.174,zz,.027,.013,.035,P.blueDark);
    ball(g,0,1.95,-.39,.57,1.01,.15,gold);ball(g,0,1.96,-.23,.49,.88,.11,upholstery);
    ball(g,0,1.96,-.53,.49,.88,.045,upholstery);
    ball(g,-.08,2.16,-.115,.33,.56,.018,material(P.blueLight));
    for(let i=0;i<11;i++){const a=i*Math.PI/5;ball(g,Math.sin(a)*.505,1.94+Math.cos(a)*.91,-.29,.033,.039,.047,P.brightGold);}
    for(const [x,y] of [[-.17,1.28],[.18,1.28],[0,1.52]])ball(g,x,y,-.108,.034,.05,.028,P.blueDark);
    for(const side of [-1,1]){
      curve(g,[[side*.54,.63,.40],[side*.62,1.21,.38],[side*.56,1.41,.12]],.053,wood,10);
      ball(g,side*.60,1.38,.16,.22,.095,.30,gold);ball(g,side*.60,1.415,.13,.16,.044,.22,P.brightGold);
      for(const depth of [-.34,.36]){beam(g,[side*.39,.79,depth],[side*.53,.14,depth+.06],.062,wood);ball(g,side*.53,.12,depth+.06,.125,.105,.11,gold);}
    }
    return g;
  }
  function writingSet(parent,x,z) {
    const g=group(parent,x,.095,z,'白色M纹纸与绿色桌上架');
    const board=box(g,0,1.382,.10,1.36,.057,1.01,0xbf8549);board.rotation.y=-.045;
    const paper=mesh(g,new THREE.PlaneGeometry(1.25,.89),pages,0,1.414,.10);paper.rotation.x=-Math.PI/2;paper.rotation.z=-.045;paper.castShadow=false;
    box(g,0,1.52,-.66,.52,.27,.16,0x518e82);box(g,0,1.665,-.66,.55,.06,.19,0x397369);
    for(const side of [-1,1]){const ring=torus(g,side*.14,1.525,-.565,.066,.016,0xc4e5c4);ring.scale.y=1.13;}
    for(const side of [-1,1]){const well=box(g,side*.88,1.46,.04,.23,.18,.26,0x9ca6a2);well.rotation.z=side*.27;box(g,side*.88,1.56,.04,.14,.023,.17,0xe3e5df);}
  }
  function readingTable(x,z,index) {
    const g=group(root,x,0,z,'阅览桌 '+index);
    cylinder(g,0,1.24,0,1.18,1.07,.18,P.wood,40);cylinder(g,0,1.36,0,1.20,1.20,.10,P.cream,40);
    cylinder(g,0,1.424,0,1.10,1.10,.03,lightWood,40);
    cylinder(g,0,.76,0,.17,.26,.85,wood,16);cylinder(g,0,.96,0,.28,.23,.13,lightWood,16);ball(g,0,.42,0,.27,.23,.27,P.edge);
    for(let i=0;i<4;i++){const a=i*Math.PI/2+.4;curve(g,[[0,.39,0],[Math.cos(a)*.38,.25,Math.sin(a)*.38],[Math.cos(a)*.68,.15,Math.sin(a)*.68]],.085,0x934b43,10);ball(g,Math.cos(a)*.69,.13,Math.sin(a)*.69,.135,.13,.135,P.gold);}
    writingSet(g,0,0);chair(g,-1.79,.02,Math.PI/3);chair(g,1.79,.02,-Math.PI/3);
    colliders.push({x,z,w:5.15,d:1.85});
    return g;
  }
  readingTable(-3.41,-1.83,1);readingTable(2.30,-2.23,2);
  readingTable(-3.33,3.59,3);readingTable(2.38,3.26,4);

  // The librarian's stone-topped counter and its small real open book.
  const stoneMap=canvasTexture(256,512,(ctx,w,h)=>{
    ctx.fillStyle='#ebeee6';ctx.fillRect(0,0,w,h);ctx.lineWidth=1.8;
    for(let i=0;i<24;i++){ctx.strokeStyle=i%3?'rgba(117,151,147,.25)':'rgba(172,185,171,.35)';ctx.beginPath();ctx.moveTo((i*43)%w,0);ctx.bezierCurveTo(i*11,150,w-i*7,310,(i*81)%w,h);ctx.stroke();}
  });
  const marble=new THREE.MeshStandardMaterial({map:stoneMap,roughness:.63});
  const desk=group(root,6.66,0,.80,'馆员石面书桌');desk.rotation.y=.06;
  box(desk,0,.69,0,1.53,1.25,2.97,wood);
  for(const x of [-.72,.72])for(const z of [-1.39,1.39])beam(desk,[x,.12,z],[x,.68,z],.055,P.edge);
  roundedSlab(desk,0,1.31,0,1.79,3.20,.16,.21,marble);
  for(const z of [-1.11,1.11]){panel(desk,0,.73,z,.98,.86);scroll(desk,-.31,.58,z+(z>0?.12:-.12),.24,P.gold);}
  for(const side of [-1,1])box(desk,side*.79,.63,0,.042,.88,2.70,P.gold);
  const openBook=group(desk,0,1.50,.04,'打开的书与羽毛笔');
  box(openBook,0,.014,0,1.30,.065,.86,0xb48b46);
  const left=box(openBook,-.31,.075,0,.62,.045,.78,P.cream);left.rotation.z=.19;
  const right=box(openBook,.31,.075,0,.62,.045,.78,0xfff7da);right.rotation.z=-.19;
  beam(openBook,[0,.15,-.40],[0,.15,.40],.019,0x936534);
  for(const side of [-1,1])for(let i=0;i<5;i++){const l=box(openBook,side*.32,.143,-.24+i*.11,.43,.007,.013,0xd1b783);l.rotation.z=-side*.19;}
  cylinder(desk,.37,1.64,-.98,.15,.17,.31,0x3156a0,14);torus(desk,.37,1.805,-.98,.145,.021,P.brightGold).rotation.x=Math.PI/2;
  beam(desk,[.37,1.80,-.98],[.48,2.29,-.90],.012,P.edge);
  const feather=new THREE.Shape();feather.moveTo(0,0);feather.bezierCurveTo(-.18,.09,-.12,.42,.03,.53);feather.bezierCurveTo(.11,.32,.13,.17,0,0);
  const plume=mesh(desk,new THREE.ShapeGeometry(feather),material(0xfff9df,{side:THREE.DoubleSide}),.44,1.98,-.905);plume.rotation.z=-.17;
  for(const side of [-1,1]){beam(desk,[-.42+side*.1,1.51,-1.03],[-.42+side*.1,1.93,-1.03],.022,0x4a9a60);ball(desk,-.42+side*.1,1.96,-1.03,.10,.11,.1,0x4bb34f);}
  chair(desk,1.47,0,-Math.PI/2);colliders.push({x:6.94,z:.80,w:3.17,d:3.40});
  const sideCabinet=group(root,8.18,0,4.51,'右侧窄木柜');sideCabinet.rotation.y=-Math.PI/2;
  box(sideCabinet,0,1.50,0,1.23,2.85,.70,wood);box(sideCabinet,0,3.01,.03,1.45,.19,.93,lightWood);
  for(const y of [.59,1.74]){panel(sideCabinet,0,y,.40,1.05,.97);ball(sideCabinet,.28,y,.53,.068,.08,.057,gold);}
  for(const side of [-1,1]){box(sideCabinet,side*.60,1.5,.41,.057,2.73,.066,P.gold);ball(sideCabinet,side*.57,.10,.30,.09,.11,.09,P.edge);}
  colliders.push({x:8.18,z:4.51,w:1.05,d:1.68});

  // The left rolling library ladder is a stair, with treads, rail posts and feet.
  const ladder=group(root,-6.96,0,4.01,'左侧金棕色登高书梯');
  const count=11;
  for(let i=0;i<count;i++){const t=i/(count-1),y=.18+t*3.46,z=1.75-t*3.56;box(ladder,0,y,z,1.62,.16,.41,lightWood);box(ladder,0,y+.075,z+.20,1.67,.07,.07,P.brightGold);}
  for(const side of [-1,1]){
    beam(ladder,[side*.79,.09,2],[side*.79,3.83,-1.95],.12,wood);
    beam(ladder,[side*.85,1.1,1.78],[side*.85,4.61,-1.93],.072,P.lightWood);
    for(let i=0;i<6;i++){const t=i/5;beam(ladder,[side*.85,.38+t*3.40,1.48-t*3.18],[side*.85,1.37+t*3.40,1.48-t*3.18],.043,P.gold);}
    const wheel=cylinder(ladder,side*.86,.15,1.90,.18,.18,.13,P.gold,14);wheel.rotation.z=Math.PI/2;
    ball(ladder,side*.94,.15,1.90,.058,.058,.058,P.edge);
  }
  box(ladder,0,3.80,-2.02,1.66,.13,.77,lightWood);
  for(const side of [-1,1])beam(ladder,[side*.84,3.85,-2.35],[side*.84,4.68,-2.35],.065,P.gold);
  beam(ladder,[-.86,4.70,-2.35],[.86,4.70,-2.35],.069,P.lightWood);
  colliders.push({x:-6.96,z:4.05,w:1.95,d:4.52});

  return {
    root,indoor:true,background:0xe4dfd6,spawn:[-.20,.05,6.92],bounds:{minX:-8.42,maxX:8.44,minZ:-7.03,maxZ:7.80},
    colliders:colliders.map(c=>({x:c.x,z:c.z,rx:c.w/2,rz:c.d/2})),dynamic,updates,portalLocations:{hall:[-6.55,.05,-5.42]},
    camera:{target:[0,1.8,.7],position:[3.0,15.0,21.0],perspectivePosition:[3.0,12.5,16.5],perspectiveTarget:[0,1.8,.7],fov:35,span:18.5}
  };
}
