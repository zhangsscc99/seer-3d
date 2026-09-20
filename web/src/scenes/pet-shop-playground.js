import * as THREE from 'three';

// Left-hand pet-shop exhibits. All resources belong to this factory visit;
// shared primitives are reused within the visit and retired with its scene.
export function addPetShopPlayground(root) {
  const exhibit = new THREE.Group();exhibit.name = '宠物店左侧游乐区';root.add(exhibit);
  const materials = new Map(), geometries = new Map(), colliders = [];
  const P = {ink:0x364b3c,wood:0xd5ad65,woodLight:0xf0d69b,woodDark:0x956b38,
    roof:0xcd733b,roofLight:0xe5944b,roofDark:0x9c4d2d,cream:0xffefb9,white:0xfffbed,
    grass:0x79cf3e,grassLight:0x98e356,grassDark:0x4eae3c,soil:0xa78549,
    green:0x81d839,greenDark:0x4c9f23,greenLight:0xb4e93d,
    blue:0x48a6d5,blueDark:0x267aab,bluePale:0xb3e1eb,water:0x67c6e3,
    pink:0xee92d7,pinkLight:0xffb6e6,pinkDark:0xbf58b1,pinkInner:0xd873c3,
    purple:0xbb7bd6,purpleLight:0xdc9eed,purpleDark:0x8d59a7,purpleInner:0x9c6a7d,
    yellow:0xffdc4d,gold:0xe4a522,orange:0xfb9925,red:0xee453b,brown:0x8b4b23};
  function material(c,extra={}) {
    const key=String(c)+'|'+Object.keys(extra).sort().map(k=>k+':'+extra[k]).join('|');
    if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.83,metalness:0,...extra}));
    return materials.get(key);
  }
  function geometry(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
  function group(p=exhibit,x=0,y=0,z=0,name=''){const g=new THREE.Group();g.position.set(x,y,z);g.name=name;p.add(g);return g;}
  function mesh(p,geo,c,x=0,y=0,z=0){const m=new THREE.Mesh(geo,c&&c.isMaterial?c:material(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
  function box(p,x,y,z,w,h,d,c){const m=mesh(p,geometry('box',()=>new THREE.BoxGeometry(1,1,1)),c,x,y,z);m.scale.set(w,h,d);return m;}
  function ball(p,x,y,z,rx,ry,rz,c){const m=mesh(p,geometry('ball',()=>new THREE.SphereGeometry(1,16,11)),c,x,y,z);m.scale.set(rx,ry,rz);return m;}
  function cyl(p,x,y,z,rt,rb,h,c,n=24){const ratio=rt/rb,m=mesh(p,geometry('cylinder:'+ratio+':'+n,()=>new THREE.CylinderGeometry(ratio,1,1,n)),c,x,y,z);m.scale.set(rb,h,rb);return m;}
  function torus(p,x,y,z,r,t,c,arc=Math.PI*2){const ratio=t/r,m=mesh(p,geometry('torus:'+ratio+':'+arc,()=>new THREE.TorusGeometry(1,ratio,6,40,arc)),c,x,y,z);m.scale.setScalar(r);return m;}
  function beam(p,a,b,r,c){const v=new THREE.Vector3(...a),w=new THREE.Vector3(...b),d=w.clone().sub(v),m=mesh(p,geometry('beam',()=>new THREE.CylinderGeometry(1,1,1,8)),c);m.position.copy(v.add(w).multiplyScalar(.5));m.scale.set(r,d.length(),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
  function curve(p,points,r,c,n=20,sides=5){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),n,r,sides,false),c);}
  function indexed(positions,indices){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));/* Untextured custom surfaces still need the same UV layout as the shared primitive batches. */g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(positions.length/3*2),2));g.setIndex(indices);g.computeVertexNormals();return g;}
  function flipWinding(indices){for(let i=0;i<indices.length;i+=3){const b=indices[i+1];indices[i+1]=indices[i+2];indices[i+2]=b;}return indices;}
  function ellipse(p,x,y,z,rx,rz,h,c){const m=cyl(p,x,y,z,1,1,h,c,56);m.scale.x*=rx;m.scale.z*=rz;return m;}
  function ringY(p,x,y,z,r,t,c,sx=1,sz=1){const m=torus(p,x,y,z,r,t,c);m.rotation.x=-Math.PI/2;m.scale.x*=sx;m.scale.y*=sz;return m;}
  function block(x,z,rx,rz){colliders.push({x,z,rx,rz,kind:'ellipse'});}

  function leafBlade(p,start,middle,end,width,c=P.green) {
    const a=new THREE.Vector3(...start),b=new THREE.Vector3(...middle),d=new THREE.Vector3(...end);
    const side=new THREE.Vector3().subVectors(d,a).cross(new THREE.Vector3(0,1,0));
    if(side.lengthSq()<.001)side.set(1,0,0);side.normalize().multiplyScalar(width*.5);
    const l=b.clone().add(side),r=b.clone().sub(side),ridge=b.clone().add(new THREE.Vector3(0,.13,0));
    const pos=[...a.toArray(),...l.toArray(),...d.toArray(),...r.toArray(),...ridge.toArray()];
    mesh(p,indexed(pos,[0,1,4,1,2,4,2,3,4,3,0,4,0,3,2,0,2,1]),c);
    beam(p,start,end,.018,P.greenDark);
  }
  function ramToy(p,x,y,z,c,scale=.55) {
    const g=group(p,x,y,z);g.scale.setScalar(scale);
    ball(g,0,.40,0,.51,.42,.42,c);
    for(const sign of [-1,1]){ball(g,sign*.17,.46,.373,.12,.16,.045,P.white);ball(g,sign*.14,.46,.416,.044,.077,.026,P.ink);ball(g,sign*.36,.34,.31,.095,.053,.024,P.pinkLight);}
    const smile=torus(g,0,.30,.411,.105,.014,P.ink,Math.PI);smile.rotation.z=Math.PI;
    curve(g,[[0,.74,-.04],[.025,1.02,-.045],[.17,1.10,-.045]],.027,P.greenDark,8,4);
    leafBlade(g,[.04,.92,0],[-.23,1.08,.04],[-.29,1.26,0],.29,P.green);
    leafBlade(g,[.07,.94,0],[.29,1.05,.03],[.43,1.21,0],.31,P.greenLight);
    return g;
  }
  // Hollow, thick, ellipsoidal shell with an unobstructed mouth on +Z.
  // The apex is a single vertex, so neither surface contains degenerate fans.
  function podShell(p,x,y,z,rx,ry,rz,opening,outer,inner) {
    const rings=15,steps=40,pos=[],ind=[],first=opening,last=Math.PI-.11;
    for(let side=0;side<2;side++)for(let j=0;j<=rings;j++){
      const t=first+(last-first)*j/rings;
      for(let i=0;i<=steps;i++){const a=i/steps*Math.PI*2,s=side?.86:1;pos.push(Math.sin(t)*Math.cos(a)*rx*s,Math.sin(t)*Math.sin(a)*ry*s,Math.cos(t)*rz*s);}
    }
    const span=(rings+1)*(steps+1);
    for(let side=0;side<2;side++)for(let j=0;j<rings;j++)for(let i=0;i<steps;i++){
      const a=side*span+j*(steps+1)+i,b=a+steps+1;
      if(side)ind.push(a,b,a+1,b,b+1,a+1);else ind.push(a,a+1,b,b,a+1,b+1);
    }
    const outerCount=rings*steps*6,innerCount=outerCount;
    for(let side=0;side<2;side++){
      const apex=pos.length/3;pos.push(0,0,-rz*(side?.86:1));
      for(let i=0;i<steps;i++){const a=side*span+rings*(steps+1)+i;if(side)ind.push(a,apex,a+1);else ind.push(a,a+1,apex);}
    }
    for(let i=0;i<steps;i++)ind.push(i,span+i,i+1,span+i,span+i+1,i+1);
    const geo=indexed(pos,flipWinding(ind));geo.clearGroups();geo.addGroup(0,outerCount,0);geo.addGroup(outerCount,innerCount,1);geo.addGroup(outerCount+innerCount,steps*3,0);geo.addGroup(outerCount+innerCount+steps*3,steps*3,1);geo.addGroup(outerCount+innerCount+steps*6,steps*6,0);
    const m=new THREE.Mesh(geo,[material(outer),material(inner)]);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);
    const lip=torus(p,x,y,z+Math.cos(opening)*rz,.97,.072,outer);lip.scale.set(Math.sin(opening)*rx,Math.sin(opening)*ry,1);return m;
  }
  function bowl(p,x,y,z,r,h,c,inner=P.cream) {
    const g=group(p,x,y,z);g.scale.set(r,h,r);
    const geo=geometry('open-bowl',()=>{
      const g=new THREE.LatheGeometry([[0,0],[.72,0],[.93,.28],[1,.88],[.99,1],[.87,1],[.78,.36],[0,.25]].map(a=>new THREE.Vector2(...a)),32);
      // LatheGeometry repeats axis vertices: drop only the zero-area pole
      // triangles while retaining the complete base and recessed inner floor.
      const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),index=[];
      for(let i=0;i<g.index.count;i+=3){const ia=g.index.getX(i),ib=g.index.getX(i+1),ic=g.index.getX(i+2);a.fromBufferAttribute(g.attributes.position,ia);b.fromBufferAttribute(g.attributes.position,ib);c.fromBufferAttribute(g.attributes.position,ic);if(b.sub(a).cross(c.sub(a)).lengthSq()>1e-18)index.push(ia,ib,ic);}
      g.setIndex(index);return g;
    });
    mesh(g,geo,c);ellipse(g,0,.26,0,.77,.77,.025,inner);ringY(g,0,.965,0,.93,.038,P.cream);return g;
  }

  // Raised grass enclosure, front/right timber posts, actual sagging ropes.
  const lawn=group(exhibit,-7.65,.05,2.05,'椭圆草地、弧形木桩绳栏');
  ellipse(lawn,0,.085,0,3.67,4.34,.17,P.soil);ellipse(lawn,0,.18,0,3.64,4.30,.09,P.grass);
  for(let i=0;i<47;i++){
    const a=i*2.39996,r=.22+((i*17)%41)/41*.72,x=Math.cos(a)*3.50*r,z=Math.sin(a)*4.08*r;
    const tuft=group(lawn,x,.235,z);tuft.rotation.y=i*.8;
    leafBlade(tuft,[-.08,0,0],[-.10,.10,0],[-.16,.15,0],.05,P.grassDark);
    leafBlade(tuft,[0,0,0],[.01,.13,0],[.06,.21,0],.05,i%2?P.grassLight:P.grassDark);
  }
  const fence=[];
  for(let i=0;i<12;i++){
    const a=-.81+i*.286,x=3.67*Math.cos(a),z=4.32*Math.sin(a),post=group(lawn,x,.21,z);
    cyl(post,0,.48,0,.072,.103,.96,P.wood,9);cyl(post,0,.965,0,.079,.085,.045,P.woodLight,9);
    beam(post,[.013,.14,.078],[.013,.81,.053],.009,P.woodDark);
    fence.push([x,1.01,z]);block(-7.65+x,2.05+z,.09,.09);
  }
  for(let i=1;i<fence.length;i++){
    const a=fence[i-1],b=fence[i],mid=[(a[0]+b[0])/2,.79,(a[2]+b[2])/2];
    curve(lawn,[a,mid,b],.043,P.woodLight,12,5);
    if(i<4)for(let j=0;j<5;j++){const t=(j+.5)/5,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,y=1.01-Math.sin(t*Math.PI)*.22;ball(lawn,x,y,z,.105,.105,.105,[P.blue,P.pinkLight,P.pink,P.blue,P.pinkLight][j]);}
  }

  // Staved wooden bathing basin on its blue saucer. The water is recessed
  // below the rim, with a small green Ram visible through the open curtains.
  const bath=group(exhibit,-7.64,.05,-4.02,'浅蓝薄纱、蝴蝶结与分段木浴盆');
  ellipse(bath,0,.15,0,1.82,1.53,.23,P.woodLight);ellipse(bath,0,.29,0,1.74,1.45,.12,P.blue);
  ringY(bath,0,.355,0,1.55,.066,P.blueDark,1.07,.88);
  const stave=geometry('basin-stave',()=>{
    const a=-Math.PI/18+.012,b=Math.PI/18-.012,pos=[];
    for(const y of [0,.76])for(const r of [1.29,1.54])for(const angle of [a,b])pos.push(Math.sin(angle)*r,y,Math.cos(angle)*r);
    return indexed(pos,flipWinding([0,1,5,0,5,4,2,6,7,2,7,3,0,4,6,0,6,2,1,3,7,1,7,5,4,5,7,4,7,6,0,2,3,0,3,1]));
  });
  for(let i=0;i<18;i++){const s=mesh(bath,stave,[P.woodLight,0xe3c58d,0xdbba83][i%3],0,.36,0);s.rotation.y=i*Math.PI/9;s.scale.z=.84;
    const a=i*Math.PI/9;beam(bath,[Math.sin(a)*1.53,.42,Math.cos(a)*1.29],[Math.sin(a)*1.53,.99,Math.cos(a)*1.29],.012,P.woodDark);
  }
  ellipse(bath,0,.91,0,1.27,1.065,.035,material(P.water,{roughness:.38}));
  ringY(bath,0,.93,0,.89,.013,P.bluePale,1.16,.65);ringY(bath,.15,.932,.08,.48,.012,P.bluePale,1.2,.64);
  ramToy(bath,.05,.81,.22,P.green,.57);
  const backrest=geometry('wood-basin-backrest',()=>{
    const s=new THREE.Shape();s.moveTo(-.30,0);s.lineTo(.30,0);s.lineTo(.37,.88);s.quadraticCurveTo(.33,1.22,0,1.33);s.quadraticCurveTo(-.34,1.17,-.37,.88);s.closePath();
    return new THREE.ExtrudeGeometry(s,{depth:.10,bevelEnabled:true,bevelSize:.028,bevelThickness:.025,bevelSegments:1,curveSegments:12});
  });
  for(const sign of [-1,1]){const rest=mesh(bath,backrest,P.woodLight,sign*1.25,.92,-.20);rest.rotation.y=sign*.9;beam(bath,[sign*1.23,1.0,-.12],[sign*1.26,1.94,-.20],.014,P.woodDark);}
  const gauze=material(P.bluePale,{transparent:true,opacity:.25,depthWrite:false,side:THREE.DoubleSide,roughness:.97});
  const clothGeo=(center,width)=>{
    const pos=[],ind=[],profile=[[.13,5.77],[.71,5.37],[1.48,4.88],[1.45,3.7],[1.34,2.5],[1.38,1.04]],cols=14;
    for(let row=0;row<profile.length;row++)for(let i=0;i<=cols;i++){
      const t=i/cols,a=center+(t-.5)*width,r=profile[row][0]+Math.sin(t*Math.PI*8)*.055;
      pos.push(Math.sin(a)*r,profile[row][1],Math.cos(a)*r*.86);
    }
    for(let j=0;j<profile.length-1;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;ind.push(a,b,a+1,a+1,b,b+1);}return indexed(pos,ind);
  };
  for(const center of [Math.PI/2,Math.PI,Math.PI*1.5]){
    const m=mesh(bath,clothGeo(center,Math.PI/2+.035),gauze);m.castShadow=false;
    for(const side of [-1,1]){const a=center+side*Math.PI/4;curve(bath,[[Math.sin(a)*.13,5.77,Math.cos(a)*.12],[Math.sin(a)*1.48,4.88,Math.cos(a)*1.27],[Math.sin(a)*1.34,2.5,Math.cos(a)*1.15],[Math.sin(a)*1.38,1.04,Math.cos(a)*1.19]],.018,P.blue,25,4);}
  }
  // The two front panels pinch outward at the tiebacks; their central opening
  // really remains clear down to the water, rather than being a painted pane.
  for(const sign of [-1,1]){
    const rows=[[.06,1.08,5.50,.24],[.33,1.44,4.89,.63],[.79,1.43,3.7,.89],[1.16,1.39,2.78,1.05],[.74,1.43,1.77,1.15],[.53,1.41,1.03,1.18]],pos=[],ind=[];
    for(const [a,b,y,z]of rows)for(let i=0;i<=9;i++){const t=i/9;pos.push(sign*(a+(b-a)*t),y,z+Math.sin(t*Math.PI*6)*.048);}
    for(let j=0;j<rows.length-1;j++)for(let i=0;i<9;i++){const a=j*10+i,b=a+10;ind.push(a,b,a+1,a+1,b,b+1);}
    const m=mesh(bath,indexed(pos,ind),gauze);m.castShadow=false;
    curve(bath,rows.map(a=>[sign*a[0],a[2],a[3]]),.023,P.blue,28,4);
    const tie=torus(bath,sign*1.27,2.77,1.05,.155,.034,P.blue);tie.scale.y*=.55;
    curve(bath,[[sign*1.22,2.79,1.07],[sign*1.45,2.89,1.08],[sign*1.62,2.68,1.08],[sign*1.29,2.75,1.08]],.025,P.blue,16,4);
  }
  for(const sign of [-1,1]){
    const bow=ball(bath,sign*.57,5.88,.22,.70,.35,.095,gauze);bow.rotation.z=sign*.39;bow.castShadow=false;
    curve(bath,[[0,5.73,.34],[sign*.69,6.31,.22],[sign*1.13,6.0,.18],[sign*.32,5.70,.33]],.025,P.blue,20,4);
  }
  ball(bath,0,5.80,.35,.18,.18,.13,P.blue);curve(bath,[[0,6.18,-.14],[0,6.84,-.18]],.031,P.woodDark,5,5);
  block(-7.64,-4.02,1.65,1.44);

  // Purple pineapple hammock: open ellipsoidal mouth, thick lining, tiled
  // outer surface and a real red Ram sitting on the olive-colored cushion.
  const pod=group(exhibit,-4.77,5.18,-4.43,'紫菠萝吊窝、绿叶冠与红拉姆');pod.rotation.y=-.10;
  podShell(pod,0,0,0,1.12,1.24,.99,.94,P.purple,P.purpleInner);
  ball(pod,0,-.68,.18,.77,.15,.64,0x9bb747);ramToy(pod,0,-.71,.63,P.red,.50);
  const diamond=geometry('purple-scale',()=>indexed([0,.16,.02,-.13,0,0,0,-.14,.01,.13,0,0,0,0,.045],[0,1,4,1,2,4,2,3,4,3,0,4]));
  for(let row=0;row<5;row++)for(let i=0;i<15;i++){
    const theta=1.08+row*.375,phi=(i+(row%2)*.5)/15*Math.PI*2;
    const x=Math.sin(theta)*Math.cos(phi)*1.13,y=Math.sin(theta)*Math.sin(phi)*1.25,z=Math.cos(theta)*1.0;
    const m=mesh(pod,diamond,(i+row)%3?P.purpleLight:P.purpleDark,x,y,z);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(x/1.12**2,y/1.24**2,z/.99**2).normalize());
  }
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9,len=1.38+(i%3)*.13;leafBlade(pod,[Math.sin(a)*.08,1.03,Math.cos(a)*.08],[Math.sin(a)*len*.53,1.72,Math.cos(a)*len*.50],[Math.sin(a)*len,1.36+(i%2)*.15,Math.cos(a)*len*.83],.44,i%2?P.greenLight:P.green);}
  for(const sign of [-1,1])curve(pod,[[sign*.79,.89,-.12],[sign*.35,2.01,-.27],[0,2.71,-.25]],.031,P.woodDark,14,5);
  const hook=torus(pod,0,2.72,-.25,.13,.028,P.woodDark,Math.PI*1.72);hook.rotation.z=.7;

  // Two pink hollow nests, timber pointed roof with separate slats, a real
  // connecting post and a six-rung ladder down to the grass enclosure.
  const nest=group(exhibit,-10.17,.05,-3.11,'粉色双层空心窝、木尖檐与爬梯');nest.rotation.y=.12;nest.scale.set(.86,.96,.88);
  bowl(nest,0,.31,0,1.04,.45,P.pink,P.pinkLight);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;ball(nest,Math.sin(a)*.97,.61,Math.cos(a)*.97,.13,.075,.13,P.pinkLight);}
  beam(nest,[0,.63,-.18],[0,5.97,-.18],.105,P.woodLight);
  podShell(nest,0,2.23,0,.97,1.13,.88,.91,P.pink,P.pinkDark);
  ball(nest,0,1.61,.29,.61,.11,.52,P.pinkLight);
  for(const sign of [-1,1]){curve(nest,[[sign*.68,1.68,.04],[sign*.91,2.15,.16],[sign*.81,2.75,.04]],.021,P.pinkDark,14,4);ball(nest,sign*.47,3.11,.06,.21,.07,.16,P.pinkLight);}
  const roofY=5.01,rise=1.38,half=1.22,roofLength=Math.hypot(half,rise),angle=Math.atan2(rise,half);
  for(const sign of [-1,1])for(let i=0;i<7;i++){
    const plank=box(nest,sign*half*.5,roofY+rise*.5,-.90+i*.30,roofLength+.12,.095,.282,[P.roof,P.roofLight,0xd78545][i%3]);plank.rotation.z=-sign*angle;
    beam(nest,[sign*.04,roofY+rise+.056,-.90+i*.30],[sign*(half+.015),roofY+.04,-.90+i*.30],.009,P.roofDark);
  }
  for(const z of [-1.045,1.045]){
    beam(nest,[-half-.09,roofY-.035,z],[0,roofY+rise+.10,z],.105,P.roofDark);
    beam(nest,[0,roofY+rise+.10,z],[half+.09,roofY-.035,z],.105,P.roofDark);
    beam(nest,[-half*.87,roofY+.11,z],[half*.87,roofY+.11,z],.065,P.woodLight);
  }
  beam(nest,[0,roofY+rise+.10,-1.13],[0,roofY+rise+.10,1.13],.080,P.woodLight);
  for(const sign of [-1,1]){
    beam(nest,[sign*.34,.83,.77],[sign*.34+1.09,.29,2.50],.062,P.gold);
    for(let j=0;j<2;j++)ball(nest,sign*.09,3.35+j*.045,.0,.13,.06,.11,P.pinkLight);
  }
  for(let i=0;i<7;i++){const t=i/6;beam(nest,[-.34+1.09*t,.83-.54*t,.77+1.73*t],[.34+1.09*t,.83-.54*t,.77+1.73*t],.060,P.woodLight);}
  block(-10.17,-3.11,.90,.96);

  // Blue/green exercise wheel. Both hoops, back spokes, wooden tread slats,
  // axle, bearings and four supporting feet remain present from behind.
  const wheel=group(exhibit,-10.12,.29,1.50,'蓝绿运动轮与木踏板');wheel.rotation.y=.37;
  for(const z of [-.39,.39]){
    torus(wheel,0,1.31,z,1.12,.071,P.blueDark);torus(wheel,0,1.31,z+.015,1.04,.053,P.blue);
    for(const sign of [-1,1])beam(wheel,[sign*.75,.02,z*1.5],[0,1.31,z],.072,P.wood);
    ball(wheel,0,1.31,z,.14,.14,.10,P.gold);
  }
  for(let i=0;i<18;i++){
    const a=i*Math.PI/9,x=Math.sin(a)*1.057,y=1.31+Math.cos(a)*1.057;
    const tread=box(wheel,x,y,0,.245,.042,.73,i%3?P.woodLight:P.wood);tread.rotation.z=-a;
  }
  for(let i=0;i<6;i++){const a=i*Math.PI/3;beam(wheel,[0,1.31,-.40],[Math.sin(a)*1.06,1.31+Math.cos(a)*1.06,-.40],.042,P.greenDark);}
  beam(wheel,[0,1.31,-.51],[0,1.31,.51],.074,P.woodDark);
  for(const sign of [-1,1])beam(wheel,[sign*.78,.04,-.65],[sign*.78,.04,.65],.072,P.woodLight);
  block(-10.12,1.50,1.03,.90);

  // Low woven feeding mat, yellow table, actual food layers and hollow bowls.
  const rug=group(exhibit,-7.07,.296,-.42,'编织食物垫与小点心');rug.rotation.y=-.12;
  box(rug,0,.014,0,1.57,.028,1.27,P.woodLight);
  for(const x of [-.74,.74])box(rug,x,.033,0,.035,.012,1.23,P.greenDark);
  for(const z of [-.59,.59])box(rug,0,.033,z,1.5,.012,.035,P.greenDark);
  for(let row=0;row<4;row++)for(let i=0;i<5;i++){
    const x=-.54+i*.27,z=-.42+row*.28;
    ball(rug,x,.061,z,.080,.029,.060,[P.brown,P.orange,P.grassDark,P.cream][(i+row)%4]);
  }
  const table=group(exhibit,-7.45,.29,2.23,'黄圆桌、汉堡盘与点心');table.rotation.y=-.10;
  ellipse(table,0,.89,0,1.24,.97,.16,P.yellow);ringY(table,0,.984,0,1,.038,P.cream,1.16,.88);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;beam(table,[Math.sin(a)*.68,.03,Math.cos(a)*.57],[Math.sin(a)*.82,.81,Math.cos(a)*.66],.087,P.woodLight);}
  function plate(p,x,y,z,r){ellipse(p,x,y,z,r,r,.035,P.cream);ringY(p,x,y+.025,z,r*.87,.019,P.gold);}
  function burger(p,x,y,z,r){
    const g=group(p,x,y,z);g.scale.setScalar(r);plate(g,0,.022,0,1.16);
    ball(g,0,.15,0,.91,.14,.89,P.gold);cyl(g,0,.27,0,.87,.87,.095,P.red,20);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(g,Math.sin(a)*.60,.32,Math.cos(a)*.60,.39,.057,.27,P.green);}
    cyl(g,0,.40,0,.83,.83,.10,P.brown,20);const cheese=box(g,0,.465,0,1.32,.045,1.32,P.yellow);cheese.rotation.y=.28;
    ball(g,0,.63,0,.91,.25,.89,P.orange);ball(g,0,.69,0,.87,.20,.85,0xf4c750);
    for(let i=0;i<9;i++){const a=i*2.4,rr=.16+(i%3)*.19,x=Math.cos(a)*rr,z=Math.sin(a)*rr;const seed=ball(g,x,.89-rr*.17,z,.027,.018,.061,P.cream);seed.rotation.y=a;}
  }
  burger(table,-.46,1.002,.18,.43);burger(table,.25,1.002,-.26,.32);
  plate(table,.65,1.01,.36,.35);
  for(let i=0;i<4;i++)ball(table,.53+(i%2)*.18,1.07,.23+Math.floor(i/2)*.17,.095,.052,.11,P.woodLight);
  const cup=bowl(table,-.53,1.005,-.45,.21,.22,P.red,P.orange);ringY(cup,0,.96,0,.91,.045,P.white);
  beam(table,[-.51,1.17,-.45],[-.45,1.53,-.49],.015,P.cream);
  block(-7.45,2.23,1.19,.94);

  function foodBucket(x,z,capColor,leafy=false){
    const g=group(exhibit,x,.28,z,'彩色食物桶');cyl(g,0,.27,0,.27,.20,.53,P.yellow,24);
    for(const y of [.12,.35])cyl(g,0,y,0,.211+y*.12,.211+y*.12,.065,P.pink,24);
    ringY(g,0,.545,0,.261,.028,P.cream);ball(g,0,.63,0,.28,.16,.27,capColor);
    if(leafy){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;leafBlade(g,[0,.72,0],[Math.sin(a)*.21,1.0,Math.cos(a)*.21],[Math.sin(a)*.33,1.11,Math.cos(a)*.33],.19,P.green);}}
    else{ball(g,-.076,.70,.194,.034,.055,.020,P.ink);ball(g,.076,.70,.194,.034,.055,.020,P.ink);}
    block(x,z,.26,.26);return g;
  }
  foodBucket(-8.55,3.63,P.red,true);foodBucket(-5.96,2.68,P.blue);ramToy(exhibit,-9.06,.30,1.15,P.yellow,.59);
  for(const [x,z,r]of [[-7.50,5.06,.43],[-6.72,5.34,.30]]){
    const g=group(exhibit,x,.29,z,'绿色食盆与颗粒饲料');bowl(g,0,0,0,r,.12,P.greenDark,P.orange);
    for(let i=0;i<7;i++){const a=i*2.4,rr=(i%3)*r*.19;ball(g,Math.sin(a)*rr,.088,Math.cos(a)*rr,r*.11,.035,r*.10,i%2?P.cream:P.orange);}
  }
  const tray=group(exhibit,-10.57,.29,4.56,'蓝色宠物地毯与骨头玩具');tray.rotation.y=.20;
  box(tray,0,.045,0,.79,.09,1.07,P.blueDark);box(tray,0,.103,0,.68,.035,.94,P.bluePale);
  for(const z of [-.35,.36]){box(tray,0,.13,z,.57,.03,.025,P.blue);ball(tray,.18,.151,z,.055,.020,.055,P.white);ball(tray,-.17,.151,z,.055,.020,.055,P.white);}
  beam(tray,[-.16,.18,-.12],[.12,.18,.11],.055,P.cream);
  for(const [x,z]of [[-.20,-.10],[-.12,-.17],[.09,.17],[.17,.09]])ball(tray,x,.18,z,.078,.05,.067,P.cream);

  function football(x,z,r){
    const g=group(exhibit,x,.29+r,z,'黑白足球');g.rotation.set(.23,.4,.11);ball(g,0,0,0,r,r,r,P.white);
    const patch=geometry('football-pentagon',()=>{
      const pos=[0,0,1.007],ind=[];for(let i=0;i<5;i++){const a=i*Math.PI*2/5;pos.push(Math.cos(a)*.35,Math.sin(a)*.35,Math.sqrt(1-.35**2)+.005);}
      for(let i=0;i<5;i++)ind.push(0,i+1,(i+1)%5+1);return indexed(pos,ind);
    });
    const t=(1+Math.sqrt(5))/2,points=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
    for(const p of points){const m=mesh(g,patch,P.ink);m.scale.setScalar(r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...p).normalize());}
  }
  football(-8.72,-.54,.25);football(-5.50,5.18,.32);

  // Main-aisle edge: tall fleshy green leaves, bamboo-colored uprights and
  // blue/pink beads. Keep every leaf and rail on the left side of x = -3.
  const plant=group(exhibit,-4.50,.26,-1.70,'通道边大绿叶与串珠栅栏');
  cyl(plant,0,.21,0,.28,.37,.42,P.woodDark,12);
  curve(plant,[[0,.35,0],[.12,1.1,-.04],[-.09,1.80,-.05],[.12,2.67,-.10]],.13,P.greenDark,17,7);
  for(const [x,y,z,tilt,s]of [[-.33,1.05,.13,-.68,.64],[.49,1.52,.03,.67,.67],[-.40,1.98,-.07,-.60,.75],[.33,2.65,-.08,.39,.69],[.10,3.17,-.11,.18,.54]]){
    const l=ball(plant,x,y,z,.36*s/.65,.71*s/.65,.19,P.green);l.rotation.z=-tilt;
    curve(plant,[[x*.55,y-.38,z+.10],[x,y,z+.19],[x+Math.sin(tilt)*.21,y+.37,z+.11]],.017,P.greenDark,10,4);
  }
  for(let i=0;i<5;i++){
    const x=-.80+i*.29,z=.26+i*.43,h=1.20+(i%2)*.40;
    cyl(plant,x,h*.5,z,.065,.075,h,P.woodLight,10);cyl(plant,x,h+.01,z,.081,.081,.053,P.woodDark,10);
    if(i<4)for(const height of [.53,1.0]){
      const nextX=x+.29,nextZ=z+.43;beam(plant,[x,height,z],[nextX,height,nextZ],.024,P.woodDark);
      for(let j=0;j<4;j++){const t=(j+.5)/4;ball(plant,x+.29*t,height,z+.43*t,.095,.095,.095,j%2?P.pinkLight:P.blue);}
    }
  }
  block(-4.5,-1.70,.70,.67);
  // Small adjacent grass pad with a golden ball and a low green/blue hoop.
  const hoop=group(exhibit,-4.30,.05,.63,'草圈与小球');ellipse(hoop,0,.12,0,.75,.83,.12,P.cream);ellipse(hoop,0,.20,0,.69,.76,.05,P.grassLight);
  const hoopRing=torus(hoop,.16,.58,-.13,.42,.044,P.blue);hoopRing.rotation.y=.40;
  ball(hoop,-.29,.38,.18,.27,.24,.25,P.gold);ringY(hoop,.28,.25,.18,.25,.025,P.blue);
  beam(hoop,[.12,.20,-.17],[.16,.96,-.13],.023,P.greenDark);

  exhibit.userData.reference = 'petshop.png / left play and feeding enclosure';
  return {colliders};
}
