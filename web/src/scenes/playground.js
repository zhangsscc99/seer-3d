import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// The park is entirely modelled. One small sign atlas, a cobble tile and a bark
// tile are created per visit; no module-level cache retains a disposed scene.
export function createPlaygroundScene(){
  const root=new THREE.Group();root.name='西部游乐场';
  const materials=new Map(),geometries=new Map();
  let seed=781;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  const material=(color,extra={})=>{const key=color+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.87,...extra}));return materials.get(key);};
  const geometry=(key,make)=>{if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);};
  const group=(p,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
  const put=(p,geo,color,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,color&&color.isMaterial?color:material(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m;};
  const box=(p,x,y,z,w,h,d,color,rounded=false)=>{const g=geometry(rounded?'rounded':'box',()=>rounded?new RoundedBoxGeometry(1,1,1,1,.065):new THREE.BoxGeometry(1,1,1));const m=put(p,g,color,x,y,z);m.scale.set(w,h,d);return m;};
  const ball=(p,x,y,z,rx,ry,rz,color)=>{const m=put(p,geometry('sphere',()=>new THREE.SphereGeometry(1,14,10)),color,x,y,z);m.scale.set(rx,ry,rz);return m;};
  const cyl=(p,x,y,z,top,bottom,h,color,n=24)=>put(p,geometry(`c${top},${bottom},${h},${n}`,()=>new THREE.CylinderGeometry(top,bottom,h,n)),color,x,y,z);
  const ring=(p,x,y,z,r,t,color,ground=false)=>{const m=put(p,geometry(`t${r},${t}`,()=>new THREE.TorusGeometry(r,t,6,36)),color,x,y,z);if(ground)m.rotation.x=-Math.PI/2;return m;};
  const beam=(p,a,b,r,color)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const m=put(p,geometry('beam',()=>new THREE.CylinderGeometry(1,1,1,8)),color);m.position.copy(av.add(bv).multiplyScalar(.5));m.scale.set(r,delta.length(),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;};
  const tube=(p,points,r,color,segments=24)=>put(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(point=>new THREE.Vector3(...point))),segments,r,5,false),color);
  const shape=points=>{const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return s;};
  const extrude=(p,s,depth,color,x=0,y=0,z=0,bevel=0)=>put(p,new THREE.ExtrudeGeometry(s,{depth,curveSegments:20,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1}),color,x,y,z);
  function roundedShape(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
  function slab(p,x,y,z,w,d,h,r,color){const m=extrude(p,roundedShape(w,d,r),h,color,x,y,z);m.rotation.x=-Math.PI/2;return m;}
  function flat(p,points,y,color){const m=put(p,new THREE.ShapeGeometry(shape(points.map(([x,z])=>[x,-z]))),color,0,y,0);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;}
  function archShape(w,h){const s=new THREE.Shape(),r=w/2;s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI,false);s.closePath();return s;}
  function archRing(p,x,y,z,w,h,thick,depth,color){const r=w/2,spring=h-r,inner=r-thick,s=new THREE.Shape();s.moveTo(-r,0);s.lineTo(-r,spring);s.absarc(0,spring,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(inner,0);s.lineTo(inner,spring);s.absarc(0,spring,inner,0,Math.PI,false);s.lineTo(-inner,0);s.closePath();return extrude(p,s,depth,color,x,y,z,.025);}

  // Shared labels are packed into a single 1024x512 atlas, including the
  // multicolour, outlined title. None of these planes depicts scenery.
  const signDefinitions=[
    ['GAME','#ec6ec7','#624d95'],['GARY','#fff5ce','#5b4c4e'],['单人版','#ffb12b','#b95b10'],['摩尔大富翁','rainbow','#603597'],
    ['游戏说明','#f8ffde','#245baa'],['摩','#ffe648','#4384cf'],['起点','#effbdd','#4b91ac'],['终点','#fff0d3','#4a759e'],
    ['奖励','#fff6dc','#d08c32'],['庄园','#e6ffff','#4a7baf'],['财宝','#fff6d4','#a07536'],['小屋','#f1e8ff','#6956ac'],
    ['西部游乐场','#fff4c2','#9d6b32'],['?','#fff037','#e44b9d'],['PLAY','#ffe057','#318c62'],['GAME','#ffd144','#298d7b']
  ];
  const atlas=document.createElement('canvas');atlas.width=1024;atlas.height=512;const ac=atlas.getContext('2d');
  signDefinitions.forEach(([text,color,outline],index)=>{
    const x=index%4*256,y=Math.floor(index/4)*128;ac.save();ac.translate(x,y);ac.font=`900 ${text.length>4?44:text.length>2?53:66}px "Arial Rounded MT Bold","PingFang SC",sans-serif`;ac.textAlign='center';ac.textBaseline='middle';ac.lineJoin='round';
    if(color==='rainbow'){
      const colors=['#69e293','#a4fce8','#f08ecc','#ffc950','#8ce33b'],step=45;
      [...text].forEach((letter,i)=>{const xx=128+(i-(text.length-1)/2)*step;ac.strokeStyle='#432475';ac.lineWidth=12;ac.strokeText(letter,xx,65);ac.strokeStyle='#c8e9f5';ac.lineWidth=5;ac.strokeText(letter,xx,65);ac.fillStyle=colors[i%colors.length];ac.fillText(letter,xx,65);});
    }else{ac.strokeStyle=outline;ac.lineWidth=11;ac.strokeText(text,128,64,235);ac.strokeStyle='#fff0c7';ac.lineWidth=3;ac.strokeText(text,128,64,235);ac.fillStyle=color;ac.fillText(text,128,64,235);}
    ac.restore();
  });
  const signTexture=new THREE.CanvasTexture(atlas);signTexture.colorSpace=THREE.SRGBColorSpace;signTexture.anisotropy=2;
  const signMaterial=new THREE.MeshBasicMaterial({map:signTexture,transparent:true,alphaTest:.03,side:THREE.DoubleSide});
  function label(p,index,x,y,z,w,h){const geo=new THREE.PlaneGeometry(w,h),uv=geo.getAttribute('uv'),left=(index%4*256)/1024,top=Math.floor(index/4)*128/512;for(let i=0;i<uv.count;i++)uv.setXY(i,left+uv.getX(i)/4,1-top-(1-uv.getY(i))/4);const m=put(p,geo,signMaterial,x,y,z);m.castShadow=false;return m;}

  // Irregular rounded stones, with a separate low-amplitude relief map.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#ebd49e';ctx.fillRect(0,0,512,512);
  const sites=[],step=512/7;for(let row=0;row<7;row++)for(let col=0;col<7;col++)sites.push([(col+.5+(random()-.5)*.7)*step,(row+.5+(random()-.5)*.7)*step]);
  const copies=[];for(const point of sites)for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)copies.push([point[0]+xx*512,point[1]+yy*512]);
  const clip=(polygon,nx,ny,c)=>{const out=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=a[0]*nx+a[1]*ny-c,db=b[0]*nx+b[1]*ny-c;if(da<=0)out.push(a);if((da<0)!==(db<0)){const t=da/(da-db);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;};
  sites.forEach(([x,y],index)=>{
    let polygon=[[x-step*2,y-step*2],[x+step*2,y-step*2],[x+step*2,y+step*2],[x-step*2,y+step*2]];
    for(const [px,py] of copies){if(Math.hypot(px-x,py-y)<.01||Math.hypot(px-x,py-y)>step*3)continue;polygon=clip(polygon,px-x,py-y,(px*px+py*py-x*x-y*y)/2);if(!polygon.length)break;}
    polygon=polygon.map(([px,py])=>[x+(px-x)*.82,y+(py-y)*.82]);
    for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){
      ctx.save();ctx.translate(xx*512,yy*512);ctx.beginPath();polygon.forEach((p,i)=>{const prev=polygon[(i+polygon.length-1)%polygon.length],next=polygon[(i+1)%polygon.length],a=[p[0]+(prev[0]-p[0])*.37,p[1]+(prev[1]-p[1])*.37],b=[p[0]+(next[0]-p[0])*.37,p[1]+(next[1]-p[1])*.37];if(i)ctx.lineTo(...a);else ctx.moveTo(...a);ctx.quadraticCurveTo(...p,...b);});ctx.closePath();ctx.fillStyle=['#e3d0b1','#d8d7b6','#e6d5b7','#dcc6a3','#e3d5b6','#e8cdaa','#ddd2b5'][index%7];ctx.fill();ctx.strokeStyle='#f5e1af';ctx.lineWidth=2.3;ctx.stroke();ctx.restore();
    }
  });
  const paving=new THREE.CanvasTexture(canvas);paving.colorSpace=THREE.SRGBColorSpace;paving.wrapS=paving.wrapT=THREE.RepeatWrapping;paving.repeat.set(3.2,2.5);paving.anisotropy=4;
  const floorMat=new THREE.MeshStandardMaterial({map:paving,bumpMap:paving,bumpScale:.017,roughness:.98});
  // The land stops behind the carnival. A finite horizon and low distant hills
  // leave the actual blue sky visible instead of a giant green plane.
  const earth=put(root,geometry('ground',()=>new THREE.PlaneGeometry(64,40)),0x8cc24e,0,-.055,8);earth.rotation.x=-Math.PI/2;earth.castShadow=false;
  for(const [x,z,rx,ry,rz,c] of [[-19,-19,10,4.0,6,0x80ad8a],[-7,-22,11,4.8,6,0x72a5b1],[9,-23,12,4.9,6,0x77aab7],[23,-18,11,4.0,6,0x8fb181],[-19,-14,10,2.4,4.8,0x94bf6a],[-5,-15,9,2.1,4.8,0x8eb865],[9,-15,10,2.1,4.8,0x91bd6a],[23,-14,10,2.4,4.8,0x8ab65f]])ball(root,x,-.5,z,rx,ry,rz,c);
  const floor=put(root,new THREE.PlaneGeometry(32,25),floorMat,0,.007,0);floor.rotation.x=-Math.PI/2;floor.castShadow=false;floor.name='Warm irregular cobbled playground plaza';
  const medallion=group(root,1.35,.025,1.71);cyl(medallion,0,.012,0,1.80,1.80,.018,0xe9d7ac,48);ring(medallion,0,.025,0,1.80,.045,0xdac18d,true);ring(medallion,0,.03,0,1.27,.030,0xe2c994,true);
  for(let i=0;i<20;i++){const a=i*Math.PI*2/20,pebble=ball(medallion,Math.cos(a)*1.56,.028,Math.sin(a)*1.56,.16,.025,.11,i%3?0xd5cdb1:0xe3c9a9);pebble.rotation.y=-a;}
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5,petal=ball(medallion,Math.cos(a)*.45,.027,Math.sin(a)*.45,.45,.025,.21,0xe2cb9f);petal.rotation.y=-a;}cyl(medallion,0,.036,0,.30,.30,.01,0xeac9a0,24);
  function lawn(points,back){flat(root,[...points,...back],.03,0x8bc64d);for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),curb=box(root,(a[0]+b[0])/2,.15,(a[1]+b[1])/2,len*.97,.26,.27,i%3?0xd4d4ba:0xb8c0a7);curb.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);}}
  const front=[];for(let i=0;i<=32;i++){const x=-7.5+i*15/32;front.push([x,9.3-2.0*Math.cos(x/7.5*Math.PI/2)]);}lawn(front,[[13,18],[-13,18]]);
  const left=[];for(let i=0;i<=31;i++){const z=-8+i*18/31;left.push([-12.2+.7*Math.sin(z*.52),z]);}lawn(left,[[-25,16],[-25,-14]]);
  const right=[];for(let i=0;i<=24;i++){const z=-7+i*18/24;right.push([12.5+.7*Math.sin(z*.53),z]);}lawn(right,[[23,17],[23,-14]]);
  function flower(p,x,z,color=0xfff5d9){const s=new THREE.Shape();for(let i=0;i<50;i++){const a=i*Math.PI*2/50,r=.08+.045*Math.cos(a*5);if(i)s.lineTo(Math.cos(a)*r,Math.sin(a)*r);else s.moveTo(Math.cos(a)*r,Math.sin(a)*r);}s.closePath();const m=put(p,geometry('flower',()=>new THREE.ShapeGeometry(s)),color,x,.07,z);m.rotation.x=-Math.PI/2;m.castShadow=false;cyl(p,x,.077,z,.025,.025,.012,0xf2cc46,8);}
  for(let i=0;i<34;i++){const x=-5.2+random()*9.2,z=8.7+random()*1.4;flower(root,x,z,i%4?0xfff9dc:0xf0c5e2);}
  const bush=(p,x,z,s=1)=>{const g=group(p,x,.2,z);for(const [xx,yy,zz,r,c] of [[0,.7,0,1.2,0x4c943e],[-.8,.5,.05,.75,0x76b944],[.82,.5,.1,.77,0x62aa42],[0,1.3,-.02,.72,0x77bc49]])ball(g,xx*s,yy*s,zz*s,r*s,r*.74*s,r*.63*s,c);return g;};
  for(let i=0;i<12;i++)bush(root,-14+i*2.5,-10.4+(i%3)*.35,1.0+(i%3)*.18);

  // Huge wood-grained tree, arcade-style GAME threshold and the separate rainbow.
  const barkCanvas=document.createElement('canvas');barkCanvas.width=128;barkCanvas.height=256;const bc=barkCanvas.getContext('2d');bc.fillStyle='#bd8837';bc.fillRect(0,0,128,256);
  for(let i=0;i<25;i++){bc.beginPath();const x=i*6+(random()-.5)*5;bc.moveTo(x,0);bc.bezierCurveTo(x+12,76,x-15,168,x+3,256);bc.strokeStyle=i%3?'#916023':'#d2a04a';bc.lineWidth=i%3?1.5:3.0;bc.stroke();}
  const bark=new THREE.CanvasTexture(barkCanvas);bark.colorSpace=THREE.SRGBColorSpace;bark.wrapS=bark.wrapT=THREE.RepeatWrapping;bark.repeat.set(2.2,1.7);
  const barkMat=new THREE.MeshStandardMaterial({map:bark,bumpMap:bark,bumpScale:.055,roughness:1});
  const tree=group(root,-11.35,0,-4.55);tree.name='Giant timber tree and GAME entrance';
  const trunkGeo=new THREE.CylinderGeometry(1.03,1.96,15.0,32,24),trunkPos=trunkGeo.getAttribute('position');
  for(let i=0;i<trunkPos.count;i++){
    const y=trunkPos.getY(i)+7.5,t=y/15,x=trunkPos.getX(i),z=trunkPos.getZ(i),a=Math.atan2(z,x),bulge=1+.18*Math.exp(-Math.pow((y-2.4)/2.0,2));
    let lobe=0;for(const direction of [-2.31,-.98,2.83,2.33,-1.74,-.52]){const d=Math.atan2(Math.sin(a-direction),Math.cos(a-direction));lobe=Math.max(lobe,Math.exp(-Math.pow(d/.31,2)));}
    const flare=.84*Math.exp(-Math.pow(y/1.85,2))*lobe;
    trunkPos.setX(i,x*bulge+Math.cos(a)*flare-.71*Math.sin(t*Math.PI)+4.05*t*t);trunkPos.setZ(i,z*(1+.09*Math.sin(y*.41))+Math.sin(a)*flare+.16*Math.sin(y*.63));
  }trunkGeo.computeVertexNormals();put(tree,trunkGeo,barkMat,0,7.44,0);
  // Tapered buttress roots wrap the back and the outside grass bank. The front
  // right sector is deliberately open around the GAME doorway and its path.
  function timberRoot(points,radius,name){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps=26,sides=12,frames=curve.computeFrenetFrames(steps,false),positions=[],uvs=[],indices=[];
    for(let i=0;i<=steps;i++){
      const t=i/steps,center=curve.getPoint(t),r=radius*(.94*Math.pow(1-t,.86)+.055);
      for(let j=0;j<=sides;j++){
        const a=j*Math.PI*2/sides,rib=1+.13*Math.cos(a*5+t*5.4),point=center.clone().addScaledVector(frames.normals[i],Math.cos(a)*r*rib).addScaledVector(frames.binormals[i],Math.sin(a)*r*rib);
        point.y=Math.max(.035,point.y*.85);positions.push(point.x,point.y,point.z);uvs.push(j/sides*.48,t*.82);
        if(i<steps&&j<sides){const n=i*(sides+1)+j;indices.push(n,n+1,n+sides+2,n,n+sides+2,n+sides+1);}
      }
    }
    for(const [ringIndex,t] of [[0,0],[steps,1]]){
      const center=curve.getPoint(t),index=positions.length/3;positions.push(center.x,Math.max(.035,center.y*.85),center.z);uvs.push(.24,t*.82);
      for(let j=0;j<sides;j++){const a=ringIndex*(sides+1)+j;if(t===0)indices.push(index,a+1,a);else indices.push(index,a,a+1);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();const m=put(tree,geo,barkMat);m.name=name;return curve;
  }
  const rootPaths=[
    [[[-.65,1.7,-.65],[-1.5,.74,-1.65],[-2.6,.35,-2.0],[-3.8,.15,-2.65],[-5.0,.04,-3.6]],.94],
    [[[.45,1.55,-1.15],[1.28,.79,-1.9],[1.67,.39,-2.8],[2.12,.12,-3.7],[3.1,.035,-4.35]],.86],
    [[[-1.25,1.43,.20],[-2.0,.77,.65],[-2.68,.39,1.55],[-3.46,.13,2.28],[-4.8,.035,2.68]],.88],
    [[[-.95,1.28,1.02],[-1.69,.62,1.78],[-2.23,.31,2.5],[-2.9,.10,3.4],[-3.5,.035,4.25]],.72],
    [[[-.2,1.32,-1.28],[-.4,.62,-2.4],[-1.0,.35,-3.15],[-.7,.12,-4.10],[-1.30,.035,-4.9]],.77],
    [[[1.18,1.21,-.58],[1.82,.66,-1.05],[2.42,.28,-1.52],[3.38,.12,-2.05],[4.0,.035,-2.8]],.62],
  ];
  rootPaths.forEach(([points,r],i)=>{points[0][0]*=.42;points[0][2]*=.42;timberRoot(points,r,'Gnarled bark buttress root '+(i+1));});
  for(const [points,r] of [
    [[[-2.25,.39,-1.99],[-2.68,.21,-3.03],[-3.43,.055,-4.19]],.35],
    [[[-2.46,.30,1.43],[-3.68,.17,.86],[-4.74,.035,1.10]],.27],
    [[[1.66,.34,-2.8],[2.63,.19,-2.94],[3.64,.035,-3.67]],.31],
    [[[-2.20,.31,2.55],[-3.24,.12,2.70],[-4.05,.035,3.47]],.28],
  ])timberRoot(points,r,'Forking surface root');
  for(const [x,y,z,rx,ry] of [[-1.82,1.08,-.70,.25,.49],[.88,1.08,-1.63,.21,.34],[-2.22,.35,1.18,.17,.25]]){
    const knot=ring(tree,x,y,z,.30,.040,barkMat);knot.scale.set(rx/.30,ry/.30,1);knot.rotation.y=x<0?-1.0:2.65;
  }
  // The reference crops the crown: the foreground is the bent, bulging trunk.
  // Branches and a high irregular crown still exist when the panorama tilts up.
  for(const [x,y,z] of [[-2.0,13.4,-.7],[6.2,15.9,-.8],[2.8,17.0,-1.1]]){beam(tree,[1.8,11.0,0],[x,y,z],.44,barkMat);const crownGeo=new THREE.SphereGeometry(1,14,10),cp=crownGeo.getAttribute('position');for(let i=0;i<cp.count;i++){const x0=cp.getX(i),y0=cp.getY(i),z0=cp.getZ(i),r=1+.15*Math.sin(x0*9+y0*4)*Math.cos(z0*7);cp.setXYZ(i,x0*r,y0*r,z0*r);}crownGeo.computeVertexNormals();const crown=put(tree,crownGeo,0x509d44,x,y+.4,z);crown.scale.set(3.0,1.8,2.5);}
  const arcade=group(root,-9.35,0,-3.02);arcade.rotation.y=.13;
  extrude(arcade,archShape(2.44,3.40),.08,0x485054,0,.06,-.68);archRing(arcade,0,0,-.65,3.28,4.10,.38,1.08,0xd8d5c2);
  archRing(arcade,0,.08,.45,2.65,3.57,.13,.09,0x848b86);box(arcade,0,.07,.27,2.70,.12,1.08,0xe1dcc5);
  for(const side of [-1,1]){box(arcade,side*1.51,1.83,.49,.32,3.08,.18,0xb5bab0);for(let i=0;i<4;i++){const slot=box(arcade,side*1.53,.79+i*.27,.597,.27,.075,.025,0x747b72);slot.rotation.z=-.13;}}
  const gameSign=group(arcade,-.15,3.74,.39);gameSign.rotation.z=.11;box(gameSign,0,0,0,3.39,1.18,.20,0x6b7081,true);box(gameSign,0,.03,.14,3.20,.99,.08,0xc5ddd6,true);label(gameSign,0,0,.06,.21,3.16,1.02);
  const controller=group(arcade,.62,4.60,.30);controller.rotation.z=-.12;ball(controller,0,0,0,.92,.51,.22,0xe15d57);ball(controller,0,0,.08,.81,.39,.19,0xf0bb84);box(controller,-.38,0,.265,.30,.10,.06,0xa24346);box(controller,-.38,0,.267,.10,.30,.06,0xa24346);for(const [x,y,c] of [[.34,.10,0xd05245],[.52,-.03,0x8fbb4e],[.17,-.08,0x668fb5]])ball(controller,x,y,.265,.064,.064,.035,c);
  const rainbow=group(root,-5.86,.03,-5.57);rainbow.rotation.y=-.04;rainbow.name='Striped rainbow archway';
  const rainbowColors=[0xe46159,0xf4b648,0xf4dc69,0x8bc663,0x4eaeb8,0x907ab6];for(let i=0;i<rainbowColors.length;i++)archRing(rainbow,0,0,i*.012,4.50-i*.34,4.26-i*.17,.175,.55,rainbowColors[i]);
  label(rainbow,15,0,4.38,.42,4.0,1.16);label(rainbow,1,0,3.77,.60,2.14,.64);
  ring(rainbow,-1.12,1.54,.80,.54,.13,0x506564).rotation.y=-.29;
  for(const x of [-1.47,1.52]){cyl(rainbow,x,.18,.51,.31,.25,.36,0xae7951,14);cyl(rainbow,x,.36,.51,.34,.34,.11,0x915d41,14);for(let i=0;i<5;i++){const a=i*Math.PI*2/5,petal=ball(rainbow,x+Math.cos(a)*.21,.82+Math.sin(a)*.16,.52,.19,.27,.055,0xe5594f);petal.rotation.z=-a;}ball(rainbow,x,.83,.58,.115,.12,.06,0xf2c441);}

  // The raised blue board is compact and rounded, with a serpentine route and
  // three physical counters across its near edge.
  const board=group(root,.62,0,-4.34);board.name='Mole Monopoly board with physical coloured route tiles';
  slab(board,0,.035,0,10.02,6.14,.55,1.08,0x3154b3);slab(board,0,.56,0,9.77,5.98,.13,1.06,0x59d4ed);slab(board,0,.697,-.23,9.16,5.23,.034,.81,0x79717a);
  for(let row=0;row<5;row++)for(let col=0;col<10;col++){
    if(row%2===1&&col>0&&col<9)continue;
    const x=-3.99+col*.86,z=-2.00+row*.73,index=(row*9+col)%6;
    box(board,x,.754,z,.79,.045,.62,[0x479bb9,0x526bae,0x9c68b6,0x6cb177,0xd4a147,0x538cc1][index],true);
    box(board,x-.23,.785,z-.03,.25,.012,.37,0xd3ece8);
    for(const shift of [-.055,.055])box(board,x-.23+shift,.793,z-.03,.022,.008,.25,0x70adb2);
    if(col%3===0){const caption=label(board,[9,11,8,10][(row+col)%4],x+.17,.80,z,.40,.23);caption.rotation.x=-Math.PI/2;}
    else for(let line=0;line<2;line++)box(board,x+.15,.798,z-.08+line*.14,.29,.008,.023,0xd5e8e2);
  }
  for(const [i,color,pips] of [[0,0x4dbcec,2],[1,0xdf393c,1],[2,0xf1c536,3]]){
    const x=-2.60+i*2.58;cyl(board,x,.83,2.07,.96,.96,.18,0x234f78,32);cyl(board,x,.95,2.07,.88,.91,.13,color,32);cyl(board,x,1.025,2.07,.67,.68,.025,0xf0f3d8,32);
    for(let p=0;p<pips;p++){const a=p*Math.PI*2/pips+.55,r=pips===1?0:.26;cyl(board,x+Math.cos(a)*r,1.045,2.07+Math.sin(a)*r,.12,.12,.018,0x315779,16);}
  }
  for(const side of [-1,1]){box(board,side*4.23,.98,-2.16,.73,.48,.31,0x435161,true);for(let i=0;i<3;i++)box(board,side*4.23+(i-1)*.16,1.10,-1.99,.13,.17,.024,0xa8dfe4);}
  for(const [x,z] of [[3.60,.42],[2.67,1.0],[-3.52,-1.47]]){for(let i=0;i<4;i++)cyl(board,x+(i%2)*.18,.83+Math.floor(i/2)*.09,z+(i%2)*.12,.22,.22,.08,0xd3a02b,16);box(board,x,1.0,z-.10,.58,.33,.44,0xb2812c,true);box(board,x,1.04,z+.135,.58,.05,.018,0xefc647);}
  const boardTitle=group(board,0,3.54,-2.78);beam(board,[-3.25,.6,-2.75],[-3.25,3.78,-2.75],.11,0x79776a);beam(board,[3.25,.6,-2.75],[3.25,3.78,-2.75],.11,0x79776a);
  const titleShape=new THREE.Shape();for(let i=0;i<=24;i++){const t=i/24,x=-4.25+t*8.5,y=.85+.16*Math.sin(t*Math.PI*10);if(i)titleShape.lineTo(x,y);else titleShape.moveTo(x,y);}for(let i=24;i>=0;i--){const t=i/24;titleShape.lineTo(-4.25+t*8.5,-.71-.14*Math.sin(t*Math.PI*9));}titleShape.closePath();extrude(boardTitle,titleShape,.20,0x693bab,0,0,0,.04);label(boardTitle,3,0,.11,.25,8.45,2.66);
  const dice=group(board,-5.09,1.70,.31);dice.rotation.set(.12,.42,-.22);box(dice,0,0,0,1.43,1.43,1.43,0xf2be27,true);
  function pip(p,x,y,z,face){const outer=cyl(p,x,y,z,.145,.145,.025,0xa86a1e,20),inner=cyl(p,x,y,z,.105,.105,.029,0x473c24,20);if(face==='front'){outer.rotation.x=inner.rotation.x=Math.PI/2;}if(face==='right'){outer.rotation.z=inner.rotation.z=Math.PI/2;}}
  for(const [x,y] of [[-.34,.32],[0,0],[.34,-.32]])pip(dice,x,y,.725,'front');for(const [y,z] of [[-.32,-.32],[-.32,.32],[.32,-.32],[.32,.32],[0,0]])pip(dice,.725,y,z,'right');pip(dice,0,.728,0,'top');
  const single=label(board,2,-4.34,2.83,.06,3.16,.86);single.rotation.z=.10;
  const instructions=group(root,5.44,0,-.87);beam(instructions,[0,.02,0],[0,1.52,0],.095,0x665098);extrude(instructions,shape([[-1.05,-.39],[-1.15,.33],[-.60,.55],[-.15,.42],[.27,.55],[.85,.30],[1.01,-.31],[.22,-.41]]),.14,0x6645a4,0,1.05,0,.025);label(instructions,4,-.03,1.12,.20,2.09,.78);

  // The jester is a cabinet with full side/back panels, enamel frames, a sewn
  // fabric cap, and actual helical arm springs. All materials are scene-local
  // and reused so the main static batching pass can keep draw calls bounded.
  const machine=group(root,9.82,0,-3.12);machine.name='Detailed jester machine on carnival plinth';machine.rotation.y=-.12;
  const jGold=material(0xf6c72b,{roughness:.48,metalness:.12}),jGoldShade=material(0xb98a21,{roughness:.57,metalness:.10}),jGoldLight=material(0xffe77c,{roughness:.43});
  const jRed=material(0xdb493e,{roughness:.57}),jGreen=material(0x59b75b,{roughness:.59}),jDark=material(0x315c5c,{roughness:.68}),jCream=material(0xfffbe5,{roughness:.43});
  const jSteel=material(0xc3d0d7,{roughness:.29,metalness:.46}),jSteelShade=material(0x536676,{roughness:.40,metalness:.48}),jStitch=material(0x416e53,{roughness:1});
  const jBlue=material(0x328dca,{roughness:.58}),jBlueShade=material(0x315897,{roughness:.65}),jLilac=material(0xcaa3d7,{roughness:.70});
  const fabric=material(0xffffff,{vertexColors:true,roughness:.98});
  function bolt(p,x,y,z,r=.055){const b=ball(p,x,y,z,r,r,r*.42,jGoldLight);b.name='Inset brass frame rivet';return b;}
  function coloredGeometry(p,positions,colors,uvs,indices,name){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));if(indices)geo.setIndex(indices);geo.computeVertexNormals();const mesh=put(p,geo,fabric);mesh.name=name;return mesh;}

  // Raised purple deck with a continuous yellow/red pennant drum, a bevelled
  // blue rim, and small gold inlays around the feet of the cabinet.
  cyl(machine,0,.345,0,2.27,2.31,.66,jBlue,64);cyl(machine,0,.075,0,2.33,2.34,.14,jBlueShade,64);
  cyl(machine,0,.709,0,2.27,2.30,.10,jBlueShade,64);cyl(machine,0,.778,0,2.20,2.27,.11,jLilac,64);
  ring(machine,0,.818,0,2.23,.038,jBlue,true);ring(machine,0,.155,0,2.32,.026,jGold,true);
  const bandPos=[],bandCol=[],bandUv=[];
  function bandTriangle(a,b,c,color){const col=new THREE.Color(color);for(const [theta,y] of [a,b,c]){bandPos.push(Math.sin(theta)*2.321,y,Math.cos(theta)*2.321);bandCol.push(col.r,col.g,col.b);bandUv.push(theta/Math.PI/2,y);}}
  for(let i=0;i<16;i++){const a=i*Math.PI/8,b=(i+1)*Math.PI/8,m=(a+b)/2;bandTriangle([a+.011,.18],[b-.011,.18],[m,.66],0xffd247);bandTriangle([a+.072,.195],[b-.072,.195],[m,.535],i%2?0xe55d45:0x3279b8);}
  coloredGeometry(machine,bandPos,bandCol,bandUv,null,'Continuous yellow and red triangle skirt');
  for(let i=0;i<6;i++){const a=i*Math.PI/3+.18;ring(machine,Math.sin(a)*1.87,.842,Math.cos(a)*1.87,.135,.026,jGoldLight,true);}
  for(const x of [-1.14,1.14])for(const z of [-.89,.89]){box(machine,x,.91,z,.32,.23,.38,jGold,true);box(machine,x,.827,z,.39,.035,.45,jGoldShade,true);}

  // Thick red surrounds sit inside yellow mouldings on all four elevations.
  box(machine,0,2.43,0,2.50,2.77,2.04,jGreen,true);
  for(const y of [1.055,3.82]){
    box(machine,0,y,0,2.88,.17,2.41,jGold,true);
    box(machine,0,y+(y>2?.10:-.10),0,2.73,.075,2.28,jGoldLight,true);
    box(machine,0,y+(y>2?-.11:.11),0,2.65,.065,2.18,jGoldShade,true);
  }
  for(const x of [-1.28,1.28])for(const z of [-1.04,1.04])box(machine,x,2.43,z,.20,2.69,.20,jGold,true);
  for(const z of [-1.105,1.105]){
    box(machine,0,2.43,z,2.35,2.53,.14,jRed,true);
    box(machine,0,2.43,z*1.08,1.98,2.22,.10,jGreen,true);
  }
  for(const side of [-1,1]){
    box(machine,side*1.265,2.43,0,.11,2.48,1.83,jRed,true);
    box(machine,side*1.334,2.43,0,.085,2.13,1.48,jGreen,true);
    for(const z of [-.82,.82])box(machine,side*1.393,2.43,z,.026,2.21,.065,jGoldLight,true);
    for(const y of [1.37,3.47])box(machine,side*1.393,y,0,.026,.07,1.68,jGoldLight,true);
    // A recessed side lozenge remains visible behind the arm hinge.
    const sidePlate=box(machine,side*1.408,1.76,0,.025,.46,.46,jGoldShade,true);sidePlate.rotation.x=Math.PI/4;
    const sideInset=box(machine,side*1.426,1.76,0,.027,.32,.32,jGold,true);sideInset.rotation.x=Math.PI/4;
  }
  for(const z of [-1.224,1.224])for(const x of [-1.25,1.25])for(const y of [1.13,3.78]){const rivet=bolt(machine,x,y,z);if(z<0)rivet.rotation.y=Math.PI;}
  for(const x of [-1.398,1.398])for(const y of [1.18,3.72])for(const z of [-.92,.92]){const rivet=bolt(machine,x,y,z,.045);rivet.rotation.y=Math.PI/2;}

  // Broad white grin, raised eyelids and a small square nose keep the playful
  // painted expression readable from the default camera, without flat decals.
  for(const side of [-1,1]){
    const eye=group(machine,side*.69,3.17,1.294);eye.rotation.z=-side*.085;
    box(eye,0,0,0,.67,.49,.14,jRed,true);box(eye,side*.035,-.025,.095,.29,.15,.025,jDark,true);
    box(eye,0,.25,.052,.73,.085,.13,jRed,true);box(eye,-side*.22,.045,.097,.07,.19,.020,jGoldLight,true);
  }
  box(machine,0,2.87,1.342,.28,.38,.21,jDark,true);box(machine,-.025,2.89,1.446,.23,.31,.065,jGreen,true);
  const smile=new THREE.Shape();smile.moveTo(-1.00,.51);smile.lineTo(1.00,.51);smile.lineTo(.95,-.20);smile.quadraticCurveTo(.89,-.71,0,-.72);smile.quadraticCurveTo(-.89,-.71,-.95,-.20);smile.closePath();
  extrude(machine,smile,.09,jDark,0,2.07,1.25,.024);
  for(let row=0;row<2;row++)for(let col=0;col<4;col++){
    const x=(col-1.5)*.444,y=row===0?2.335:1.827+.060*Math.abs(col-1.5),tooth=box(machine,x,y,1.378,.402,row===0?.408:.414,.11,jCream,true);
    if(row===1)tooth.rotation.z=(col-1.5)*.055;
  }
  tube(machine,[[-.98,2.56,1.38],[-.94,1.90,1.38],[-.70,1.44,1.38],[0,1.34,1.38],[.70,1.44,1.38],[.94,1.90,1.38],[.98,2.56,1.38]],.033,jGreen,36);

  // Back of the cabinet: a recessed service door, hinges, ventilation slots
  // and an inset gold handle, enclosed by the same red/green frame treatment.
  box(machine,0,2.41,-1.258,1.50,1.76,.067,jDark,true);box(machine,0,2.41,-1.300,1.38,1.65,.059,jGreen,true);
  for(const y of [1.89,2.96])box(machine,-.68,y,-1.351,.13,.25,.074,jGold,true);
  for(let i=0;i<5;i++)box(machine,0,2.78-i*.14,-1.343,.82,.048,.019,jDark,true);
  ring(machine,.43,2.05,-1.39,.095,.026,jGold);box(machine,.43,2.05,-1.355,.05,.14,.075,jGoldShade,true);
  for(const x of [-.60,.60])for(const y of [1.67,3.15]){const screw=bolt(machine,x,y,-1.341,.040);screw.rotation.y=Math.PI;}

  // The shoulders have actual helical silver springs around dark axles, and
  // the white mittens have separate curled fingers, cuffs and knuckle seams.
  for(const side of [-1,1]){
    const shoulder=cyl(machine,side*1.48,2.65,.05,.38,.38,.22,jGoldShade,24);shoulder.rotation.z=Math.PI/2;
    const socket=cyl(machine,side*1.61,2.65,.05,.30,.33,.18,jSteelShade,24);socket.rotation.z=Math.PI/2;
    for(let i=0;i<4;i++){const a=i*Math.PI/2;const boltHead=ball(machine,side*1.745,2.65+Math.sin(a)*.23,.05+Math.cos(a)*.23,.042,.042,.042,jSteel);boltHead.name='Spring socket bolt';}
    beam(machine,[side*1.66,2.65,.05],[side*2.22,2.56,.16],.155,jSteelShade);
    const coil=[];for(let i=0;i<=144;i++){const t=i/144,a=t*Math.PI*2*4.4;coil.push([side*(1.68+t*.61),2.65-.09*t+Math.sin(a)*.247,.05+.11*t+Math.cos(a)*.247]);}tube(machine,coil,.049,jSteel,144);
    for(const x of [1.73,2.28]){const collar=ring(machine,side*x,2.65-(x-1.68)*.148,.05+(x-1.68)*.18,.268,.040,jSteel);collar.rotation.y=Math.PI/2;}
    const hand=group(machine,side*2.46,2.47,.18);hand.rotation.z=-side*.15;hand.name=side<0?'Left four-finger white glove':'Right four-finger white glove';
    const cuff=cyl(hand,-side*.15,.12,0,.30,.27,.22,jCream,24);cuff.rotation.z=Math.PI/2;
    const cuffEdge=ring(hand,-side*.27,.12,0,.267,.030,jSteelShade);cuffEdge.rotation.y=Math.PI/2;
    ball(hand,.02,-.02,.01,.31,.35,.19,jCream);
    for(let i=0;i<3;i++){
      const x=side*(-.10+i*.18),endY=-.53+(i===2?.08:0);tube(hand,[[x,-.12,.055],[x+side*.055,-.34,.11],[x+side*.015,endY,.125]],.102,jCream,14);ball(hand,x+side*.015,endY,.125,.101,.108,.102,jCream);
      tube(hand,[[x-.037,-.17,.208],[x-.016,-.29,.217],[x+.01,-.35,.218]],.011,jSteelShade,10);
    }
    tube(hand,[[-side*.16,.10,.03],[-side*.32,-.025,.13],[-side*.29,-.22,.17]],.118,jCream,14);ball(hand,-side*.29,-.22,.17,.118,.12,.12,jCream);
    tube(hand,[[side*.015,.11,.198],[side*.072,.05,.215],[side*.11,-.025,.213]],.012,jSteelShade,10);
  }

  // Soft three-point cap: separately coloured cloth panels have crisp band
  // boundaries, curved piping, transverse seams and gold bells with slots.
  const hat=group(machine,0,3.98,0);hat.name='Sewn red and green floppy jester cap';
  cyl(hat,0,.025,0,1.19,1.25,.15,jRed,40);ring(hat,0,-.026,0,1.22,.040,jGold,true);
  const capGeo=new THREE.SphereGeometry(1,32,12,0,Math.PI*2,0,Math.PI/2),capNon=capGeo.toNonIndexed(),capPos=capNon.getAttribute('position'),capColors=[];
  for(let i=0;i<capPos.count;i+=3){const theta=Math.atan2(capPos.getZ(i)+capPos.getZ(i+1)+capPos.getZ(i+2),capPos.getX(i)+capPos.getX(i+1)+capPos.getX(i+2));const c=new THREE.Color(Math.floor((theta+Math.PI)/Math.PI*4)%2?0xde5a51:0x6bc27a);for(let j=0;j<3;j++)capColors.push(c.r,c.g,c.b);}
  capNon.setAttribute('color',new THREE.Float32BufferAttribute(capColors,3));const cap=put(hat,capNon,fabric,0,.06,0);cap.scale.set(1.18,.76,1.04);
  function bell(p,point){const [x,y,z]=point;ball(p,x,y,z,.285,.30,.285,jGold);ring(p,x,y-.027,z,.285,.013,jGoldShade,true);ball(p,x-.075,y+.105,z+.226,.077,.086,.025,jGoldLight);tube(p,[[x-.117,y-.178,z+.172],[x,y-.225,z+.19],[x+.114,y-.175,z+.172]],.014,jGoldShade,12);ball(p,x,y-.219,z+.18,.029,.033,.021,jGoldShade);}
  function horn(parent,points,radius){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps=36,sides=14,frames=curve.computeFrenetFrames(steps,false),pos=[],cols=[],uv=[],indices=[];
    const at=(t,a)=>{const i=Math.min(steps,Math.round(t*steps)),center=curve.getPoint(t),r=radius*(1-.93*t)*(1+.105*Math.sin(t*Math.PI));return center.addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);};
    // Each band owns its boundary vertices; colours never blend into stripes.
    for(let band=0;band<6;band++){
      const color=new THREE.Color(band%2?0xdf5b53:0x68bd76),start=pos.length/3;
      for(let row=0;row<=6;row++){const t=(band*6+row)/steps;for(let j=0;j<=sides;j++){const point=at(t,j*Math.PI*2/sides);pos.push(point.x,point.y,point.z);cols.push(color.r,color.g,color.b);uv.push(j/sides,t);if(row<6&&j<sides){const n=start+row*(sides+1)+j;indices.push(n,n+1,n+sides+2,n,n+sides+2,n+sides+1);}}}
    }
    coloredGeometry(parent,pos,cols,uv,indices,'Curved sewn fabric cap point');
    for(const angle of [.17,Math.PI+.17]){const seam=[];for(let i=1;i<35;i++){const p=at(i/36,angle);seam.push([p.x,p.y,p.z]);}tube(parent,seam,.010,jStitch,36);}
    for(let band=1;band<6;band++){
      const t=band/6,seam=[];for(let j=0;j<=24;j++){const p=at(t,j*Math.PI*2/24);seam.push([p.x,p.y,p.z]);}tube(parent,seam,.009,jStitch,28);
      for(const a of [.42,1.22,2.02,3.55,4.35,5.15]){const aa=at(t-.016,a),bb=at(t+.016,a+.035);beam(parent,aa.toArray(),bb.toArray(),.007,jGoldLight);}
    }
    bell(parent,points[points.length-1]);
  }
  horn(hat,[[-.34,.27,.12],[-.82,.98,.05],[-1.67,1.45,.04],[-2.10,1.09,.09]],.59);
  horn(hat,[[.38,.24,.06],[1.08,.99,.02],[1.87,1.62,.01],[2.30,1.32,.04]],.61);
  horn(hat,[[.02,.29,-.24],[.12,1.17,-.29],[-.21,1.81,-.40],[-.64,1.93,-.44]],.48);
  const badge=cyl(hat,0,.46,1.046,.49,.49,.12,jGold,36);badge.rotation.x=Math.PI/2;const badgeFace=cyl(hat,0,.46,1.123,.398,.398,.04,jBlue,32);badgeFace.rotation.x=Math.PI/2;ring(hat,0,.46,1.152,.399,.018,jGoldLight);label(hat,5,0,.465,1.169,1.62,.85);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;bolt(hat,Math.sin(a)*.448,.46+Math.cos(a)*.448,1.121,.020);}

  const stairs=group(root,8.32,0,-.74);stairs.rotation.y=-.20;stairs.name='Blue panel steps with yellow moulded edges';
  for(let i=0;i<4;i++){
    const h=(i+1)*.185,z=-i*.39;box(stairs,0,h/2,z,1.18,h,.43,jBlueShade,true);
    box(stairs,0,h-.075,z+.225,1.06,.115,.035,jBlue,true);box(stairs,0,h+.016,z,1.18,.042,.41,jGold,true);
    box(stairs,0,h+.041,z-.035,1.00,.012,.27,jBlue,true);box(stairs,0,h+.044,z+.13,1.13,.018,.077,jGoldLight,true);
    for(const side of [-1,1])box(stairs,side*.603,h/2,z,.066,h,.43,jGold,true);
  }
  function bunnyBalloon(x,z,y,scale=1){const g=group(root,x,y,z);g.scale.setScalar(scale);g.name='Pink bunny balloon on a curved tether';ball(g,0,0,0,.48,.60,.25,0xf780c4);for(const side of [-1,1]){const ear=ball(g,side*.24,.78,0,.18,.62,.14,0xf893cd);ear.rotation.z=-side*.23;const inner=ball(g,side*.24,.83,.13,.087,.43,.021,0xffdeb9);inner.rotation.z=-side*.23;}ball(g,-.18,.15,.22,.115,.23,.03,0xffb7df);tube(root,[[x,y-.55*scale,z],[x+.17,y-1.50,z+.08],[x-.15,1.5,z+.2],[x+.05,.88,z+.2]],.016,0xf6edd1,30);return g;}
  bunnyBalloon(6.58,-4.18,4.65,.95);bunnyBalloon(12.06,-2.53,4.49,.87);
  for(const [x,z,y,c] of [[6.32,-4.91,3.43,0x68e0dd],[12.37,-3.46,3.5,0x88d753],[6.95,-5.04,3.93,0xffe575]]){ball(root,x,y,z,.36,.47,.26,c);beam(root,[x,y-.4,z],[x,.85,z+.2],.012,0xf9efd4);}

  // Six red/yellow mushroom stools follow the shallow crescent of the
  // rainbow keyboard. Its coloured keys have real thickness and bevels.
  const keyboard=group(root,-1.69,0,4.18);keyboard.name='Rainbow keyboard and six mushroom stools';
  slab(keyboard,0,.02,0,8.18,2.13,.20,.41,0x7e795e);box(keyboard,0,.57,0,6.30,.72,1.54,0x947946,true);
  const keyColors=[0x28c995,0x82c956,0xdca65b,0xe66973,0xa965bc,0x6289c4];for(let row=0;row<2;row++)for(let col=0;col<6;col++){box(keyboard,(col-2.5)*.88,1.035+row*.08,(row-.5)*.62,.86,.20,.58,keyColors[col],true);box(keyboard,(col-2.5)*.88,1.149+row*.08,(row-.5)*.62,.67,.026,.39,[0x62e0b6,0xa5dc79,0xeabd7b,0xee8f96,0xc28bd6,0x95b6df][col],true);}
  for(let col=0;col<12;col++)box(keyboard,(col-5.5)*.46,.73,.805,.041,.36,.036,0x514f63);
  function star(p,x,y,z,r,color){const points=[];for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,rr=i%2?r*.44:r;points.push([Math.cos(a)*rr,Math.sin(a)*rr]);}return extrude(p,shape(points),.11,color,x,y,z,.018);}
  for(const side of [-1,1]){
    const sidePanel=shape([[-.58,0],[.58,0],[.46,1.17],[.20,2.00],[-.17,2.03],[-.54,1.1]]);extrude(keyboard,sidePanel,.90,0xe4b936,side*3.40,.21,-.43,.075);
    const inner=extrude(keyboard,sidePanel,.055,0xc9554c,side*3.40,.35,.511,.02);inner.scale.set(.78,.70,1);
    star(keyboard,side*3.39,2.22,.10,.42,0xae4a45);star(keyboard,side*3.39,2.23,.235,.30,0xef7660);
    for(let petal=0;petal<5;petal++){const a=petal*Math.PI*2/5;ball(keyboard,side*3.40+Math.cos(a)*.14,.73+Math.sin(a)*.14,.59,.07,.11,.018,0xf5d24e);}ball(keyboard,side*3.40,.73,.615,.07,.07,.02,0xeab036);
  }
  const stoolPositions=[];
  for(let i=0;i<6;i++){
    const x=(i-2.5)*1.22,z=1.79+.23*Math.abs(i-2.5),stool=group(keyboard,x,.025,z);stool.name='Red and yellow mushroom stool '+(i+1);stoolPositions.push({x:x-1.69,z:z+4.18,rx:.53,rz:.45,kind:'ellipse'});
    cyl(stool,0,.10,0,.27,.29,.12,0xaf4e52,20);cyl(stool,0,.33,0,.12,.18,.46,0xd66a75,16);ball(stool,0,.69,0,.50,.21,.43,0xc84f55);
    const cap=put(stool,geometry('mushroom-cap',()=>new THREE.ConeGeometry(.58,.49,32)),0xf0c15a,0,.94,0);cap.scale.z=.80;ring(stool,0,.705,0,.53,.043,0xa94c4d,true).scale.y=.80;
    for(const angle of [0,Math.PI]){const p=shape([[0,.23],[-.25,-.235],[.25,-.235]]),stripe=extrude(stool,p,.018,0xcd5756,0,.945,0);stripe.rotation.y=angle;stripe.position.z=Math.cos(angle)*.305;}
  }

  // Yellow duck-shaped bin with a genuine dark mouth slot and little flowers.
  const duck=group(root,-9.98,0,3.11);duck.rotation.y=.18;duck.name='Yellow duck litter bin';
  cyl(duck,0,.16,0,.71,.76,.24,0xafa26a,28);cyl(duck,0,1.01,0,.78,.63,1.70,0xf0ca49,32);ring(duck,0,.30,0,.68,.041,0xc5a044,true);
  ball(duck,0,2.03,0,.79,.87,.59,0xf3d461);ball(duck,-.20,2.50,-.02,.19,.34,.16,0xf3d461);ball(duck,.02,2.59,-.06,.12,.22,.12,0xf3d461);
  ball(duck,0,1.93,.54,.72,.225,.57,0xdbaa2f);ball(duck,0,1.95,.82,.64,.064,.30,0x76561d);ball(duck,0,1.985,.80,.67,.060,.31,0xe4b631);
  for(const side of [-1,1]){ball(duck,side*.26,2.30,.53,.051,.107,.028,0x746040);ball(duck,side*.50,2.03,.51,.12,.065,.025,0xe8ab4e);}
  for(const [x,y,z] of [[-.44,.79,.60],[.30,1.24,.68]]){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(duck,x+Math.cos(a)*.11,y+Math.sin(a)*.11,z,.078,.078,.026,0xfaf0ac);}ball(duck,x,y,z+.02,.04,.04,.025,0xe4a842);}
  for(const side of [-1,1])tube(duck,[[side*.73,.5,.15],[side*.65,.97,.32],[side*.63,1.38,.15]],.025,0xc19e39,16);

  // Far silhouettes belong to the carnival: a spoked wheel, tiny cabins and
  // striped tents, partially screened by the trees in the reference view.
  const wheel=group(root,4.15,4.24,-12.00);wheel.rotation.y=-.08;wheel.name='Distant ferris wheel';
  ring(wheel,0,0,0,3.35,.048,0x8fa4aa);ring(wheel,0,0,.08,3.12,.026,0xb4c9c3);
  for(let i=0;i<12;i++){const a=i*Math.PI*2/12,x=Math.cos(a)*3.35,y=Math.sin(a)*3.35;beam(wheel,[0,0,0],[x,y,0],.023,0x91a8aa);cyl(wheel,x,y-.25,.07,.26,.26,.29,[0xcba773,0x78b7b9,0xc391a5][i%3],12);ball(wheel,x,y-.02,.06,.28,.19,.28,0xbbcebf);}
  beam(wheel,[0,0,.21],[-1.83,-4.18,.50],.095,0x8da6a4);beam(wheel,[0,0,.21],[1.83,-4.18,.50],.095,0x8da6a4);cyl(wheel,0,0,.14,.26,.26,.20,0xc4d8cd,20).rotation.x=Math.PI/2;
  function tent(x,z,r,h){const g=group(root,x,0,z);cyl(g,0,.93,0,r*.85,r*.90,1.86,0xebd7b0,20);const geo=new THREE.ConeGeometry(r,h,16,1,false),non=geo.toNonIndexed(),pos=non.getAttribute('position'),colors=[];for(let i=0;i<pos.count;i++){const a=Math.atan2(pos.getZ(i),pos.getX(i)),color=new THREE.Color([0xe4888b,0xf0d181,0x9ccfbf,0xccadd6][Math.floor((a+Math.PI)/Math.PI*8)%4]);colors.push(color.r,color.g,color.b);}non.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));put(g,non,material(0xffffff,{vertexColors:true}),0,1.86+h/2,0);beam(g,[0,1.8+h,0],[0,2.7+h,0],.033,0xb4965e);extrude(g,shape([[0,.46],[.86,.24],[0,.06]]),.025,0xdf7276,0,2.25+h,0);return g;}
  tent(10.76,-10.13,2.85,3.40);tent(7.73,-11.72,1.78,2.70);
  for(const [x,z,s] of [[-5.24,-10.62,1.2],[-2.93,-10.54,1.34],[7.07,-9.22,1.08],[13.40,-8.78,.95]]){
    const g=group(root,x,0,z);cyl(g,0,1.27*s,0,.15*s,.21*s,2.54*s,0x8e754d,10);for(let level=0;level<3;level++){const c=put(g,geometry('pine',()=>new THREE.ConeGeometry(1,1,12)),[0x3c8b55,0x54a76a,0x72b779][level],0,(2.0+level*.88)*s,0);c.scale.set((1.30-level*.17)*s,2.3*s,(1.08-level*.15)*s);}}

  const question=group(root,7.42,.035,3.39);cyl(question,0,.16,0,.50,.58,.27,0xeebc39,28);ball(question,0,.41,0,.58,.18,.50,0xffe04e);const q=label(question,13,0,.615,.03,.76,.57);q.rotation.x=-Math.PI/2;
  const paths=[[-12.12,.05,7.36],[12.17,.05,.57]];for(const [x,y,z] of paths){beam(root,[x,y,z],[x,y+1.21,z],.076,0xa1874d);const sign=extrude(root,shape([[-.66,-.24],[.22,-.24],[.22,-.40],[.73,0],[.22,.40],[.22,.24],[-.66,.24]]),.12,0xd2b963,x,y+1.10,z);sign.rotation.y=x<0?.25:-.22;}

  return {
    root,spawn:[-1.75,.05,1.75],bounds:{minX:-11.90,maxX:12.14,minZ:-8.0,maxZ:8.40},
    colliders:[
      {x:.62,z:-4.34,rx:5.02,rz:3.09},{x:9.82,z:-3.12,rx:2.46,rz:2.33,kind:'ellipse'},
      {x:-1.69,z:4.18,rx:4.15,rz:1.22},{x:-9.98,z:3.11,rx:.82,rz:.80,kind:'ellipse'},
      {x:-11.35,z:-4.55,rx:1.88,rz:1.85,kind:'ellipse'},
      {x:-10.88,z:-2.82,rx:.37,rz:.81},{x:-7.85,z:-3.08,rx:.34,rz:.81},{x:-9.35,z:-3.83,rx:1.05,rz:.22},
      {x:-4.47,z:-4.03,rx:.82,rz:.82},{x:8.32,z:-1.35,rx:.82,rz:.82},
      {x:5.44,z:-.87,rx:.42,rz:.24},{x:7.42,z:3.39,rx:.61,rz:.56,kind:'ellipse'},
      ...stoolPositions,
    ],
    portalLocations:{gamehut:[-9.29,.05,-1.78],street:[10.83,.05,6.44]},
    camera:{perspectivePosition:[.19,13.45,19.50],perspectiveTarget:[0,2.00,-.24],fov:36,span:26,wideZoom:.84,target:[0,2.00,-.24],position:[0,25,30]},
    updates:[],dynamic:[],
  };
}
