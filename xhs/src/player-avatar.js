import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Visit-independent player resources. The caller owns this whole returned group.
export function createPlayerAvatar(parent,x=0,z=0){
 const root=new THREE.Group();root.name='粉翼礼裙小摩尔';root.position.set(x,0,z);
 const mats=new Map(),geos=new Map();
 const C={hair:0xf76585,hairBright:0xff8a9c,hairLight:0xffbec4,hairInner:0xae2859,
  hairShade:0xd43868,skin:0xf4d66c,white:0xfff5e9,ivory:0xffead9,
  pupil:0x59244d,ink:0x762647,rose:0xee6a94,roseLight:0xff93b4,
  roseDark:0xce3c70,dots:0xe24b81,red:0xed172b,rubyShade:0xb9143b,
  gold:0xffc029,goldShade:0xa85b22};
 function mat(c,roughness=.59,metalness=0){const k=[c,roughness,metalness].join(':');if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color:c,roughness,metalness}));return mats.get(k);}
 function geo(k,make){if(!geos.has(k))geos.set(k,make());return geos.get(k);}
 function group(p=root,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;}
 function mesh(p,g,c,x=0,y=0,z=0){const m=new THREE.Mesh(g,c?.isMaterial?c:mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
 function ball(p,x,y,z,rx,ry,rz,c,detail=10){const m=mesh(p,geo('ball:'+detail,()=>new THREE.SphereGeometry(1,detail,detail===16?12:detail===8?6:7)),c,x,y,z);m.scale.set(rx,ry,rz);return m;}
 function ring(p,x,y,z,r,t,c,n=28){return mesh(p,geo(['ring',r,t,n].join(':'),()=>new THREE.TorusGeometry(r,t,4,n)),c,x,y,z);}
 function tube(p,pts,r,c,n=16){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(q=>new THREE.Vector3(...q))),n,r,4,false),c);}
 // A closed, plump, pointed ribbon. Its thickness remains visible from the side.
 function lock(p,pts,w,d,c,n=12){
  n=Math.max(7,n-1);
  const curve=new THREE.CatmullRomCurve3(pts.map(q=>new THREE.Vector3(...q))),pos=[],ind=[],sides=6;
  for(let j=0;j<=n;j++){const t=j/n,at=curve.getPoint(t),dir=curve.getTangent(t),len=Math.hypot(dir.x,dir.y)||1,dx=dir.y/len,dy=-dir.x/len,bulge=.016+.984*Math.pow(Math.sin(Math.PI*t),.67);
   for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2;pos.push(at.x+Math.cos(a)*dx*w*bulge,at.y+Math.cos(a)*dy*w*bulge,at.z+Math.sin(a)*d*bulge);}
   if(j<n)for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides;ind.push(a,a+sides,b,b,a+sides,b+sides);}
  }
  const start=curve.getPoint(0),end=curve.getPoint(1),base=pos.length/3;pos.push(...start.toArray(),...end.toArray());for(let i=0;i<sides;i++){ind.push(base,i,(i+1)%sides);ind.push(base+1,n*sides+(i+1)%sides,n*sides+i);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(ind);g.computeVertexNormals();return mesh(p,g,c);
 }

 // Pink shoes: dark fine soles, a white welt and scattered raised white dots.
 for(const side of [-1,1]){
  const shoe=group(root,side*.207,0,.085);shoe.rotation.y=-side*.13;
  ball(shoe,0,.030,0,.198,.030,.252,C.ink);
  ball(shoe,0,.057,.009,.194,.036,.249,C.white);
  ball(shoe,0,.105,.006,.182,.075,.234,C.roseDark);
  ball(shoe,0,.124,.025,.169,.059,.214,C.rose);
  const cuff=ring(shoe,0,.160,-.070,.086,.016,C.ivory,24);cuff.rotation.x=-Math.PI/2;cuff.scale.y=.77;
  for(let i=0;i<9;i++){const a=i*2.4,r=.31+(i%3)*.20,px=Math.cos(a)*r*.153,pz=Math.sin(a)*r*.178+.03,ny=Math.sqrt(Math.max(.1,1-(px/.171)**2-((pz-.025)/.219)**2));ball(shoe,px,.122+.059*ny,pz,.010,.007,.011,C.white,8);}
  for(const s of [-1,1])lock(shoe,[[0,.171,-.02],[s*.043,.186,.007],[s*.062,.174,.053],[0,.168,.033]],.010,.008,C.white,8);
 }
 // Little legs never extend below the soles or above the skirt in a tall proportion.
 for(const side of [-1,1])ball(root,side*.195,.194,-.001,.086,.118,.090,C.skin);
 ball(root,0,.610,-.028,.265,.276,.220,C.rose);
 ball(root,0,.862,-.024,.174,.137,.158,C.skin);

 // The scalloped dress is a full 360-degree bell, with rounded radial pleats.
 const skirtPos=[],skirtIndices=[],skirtRows=10,skirtN=48;
 function skirtSurface(a,t){const wave=Math.cos(a*8),r=.222+.246*Math.sin(t*Math.PI/2)+wave*.027*t*t;return [Math.sin(a)*r,.653-.379*t+.025*wave*t*t*t,Math.cos(a)*r*.77-.025];}
 for(let row=0;row<=skirtRows;row++)for(let i=0;i<=skirtN;i++){skirtPos.push(...skirtSurface(i/skirtN*Math.PI*2,row/skirtRows));if(row<skirtRows&&i<skirtN){const k=row*(skirtN+1)+i;skirtIndices.push(k,k+skirtN+1,k+1,k+1,k+skirtN+1,k+skirtN+2);}}
 const skirtGeo=new THREE.BufferGeometry();skirtGeo.setAttribute('position',new THREE.Float32BufferAttribute(skirtPos,3));skirtGeo.setIndex(skirtIndices);skirtGeo.computeVertexNormals();mesh(root,skirtGeo,C.roseLight);
 // The lower rim has actual depth; petal folds continue around the back.
 const hem=[];for(let i=0;i<=64;i++)hem.push(skirtSurface(i/64*Math.PI*2,1));tube(root,hem,.014,C.roseDark,64);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,pts=[];for(let row=0;row<=5;row++){const t=.15+row*.164;const q=skirtSurface(a,t);q[0]*=1.010;q[2]=(q[2]+.025)*1.018-.025;pts.push(q);}lock(root,pts,.028,.017,i%2?C.rose:C.hairBright,10);
 }
 // Pink spots sit on the folded surface, rather than floating in front of it.
 for(let i=0;i<16;i++){const a=i*Math.PI/8+.075,t=i%2?.62:.84,q=skirtSurface(a,t),normal=new THREE.Vector3(Math.sin(a),.14,Math.cos(a)/.77).normalize();q[0]+=normal.x*.006;q[1]+=.005;q[2]+=normal.z*.006;const dot=ball(root,...q,.033,.052,.009,C.dots,8);dot.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);dot.rotateZ((i%3-1)*.13);}
 // Waist ribbon and a small bow behind make the rear view complete.
 const waistband=ring(root,0,.649,-.025,.226,.025,C.roseDark,32);waistband.rotation.x=-Math.PI/2;waistband.scale.y=.77;
 const backBow=group(root,0,.622,-.237);for(const side of [-1,1]){const loop=ball(backBow,side*.109,0,-.008,.127,.073,.038,C.rose);loop.rotation.z=-side*.28;lock(backBow,[[side*.039,-.025,0],[side*.096,-.117,-.049],[side*.090,-.223,-.056]],.047,.014,C.roseDark,9);}ball(backBow,0,0,-.040,.059,.060,.031,C.hairBright);

 // White feathered shoulder wings, pink scalloped backing and rounded sleeves.
 for(const side of [-1,1]){
  ball(root,side*.330,.768,.004,.162,.163,.150,C.roseDark);
  ball(root,side*.357,.783,.043,.160,.153,.139,C.roseLight);
  const cuff=ring(root,side*.389,.649,.066,.104,.018,C.ivory,26);cuff.rotation.set(.39,0,-side*.17);cuff.scale.y=.68;
  ball(root,side*.395,.618,.104,.083,.084,.076,C.skin);
  // Four distinctly separated curved primary feathers, plus two shorter coverts.
  const wing=group(root,side*.322,.764,-.064);
  for(let i=0;i<4;i++){
   const dx=side*(.13+i*.059),dy=.254-i*.030,pts=[[0,0,0],[side*.105,.094,.018],[dx,dy*.81,.010],[dx-side*.026,dy,-.006]];
   lock(wing,pts,.061,.030,C.roseDark,11);
   lock(wing,pts.map(([x,y,z])=>[x,y+.003,z+.020]),.051,.027,C.white,11);
   tube(wing,[[side*.037,.026,.046],[side*.114,.104,.049],[dx-side*.017,dy*.83,.039]],.006,0xe8a3b1,9);
  }
  for(let i=0;i<2;i++)lock(wing,[[side*.040,-.01,.023],[side*(.118+i*.048),.043,.060],[side*(.172+i*.048),.127,.039]],.040,.024,C.ivory,10);
 }
 // Fluted white neck collar and ruby brooch in a thick golden bezel.
 for(let i=0;i<5;i++){const a=(i-2)*.46;const petal=ball(root,Math.sin(a)*.170,.805+Math.cos(a)*.029,.189+Math.cos(a)*.029,.061,.087,.034,C.white);petal.rotation.z=-a*.65;}
 const gem=group(root,0,.687,.254,'');
 ring(gem,0,0,0,.165,.036,C.ink,32);
 ring(gem,0,0,.025,.153,.030,mat(C.gold,.36,.26),32);
 ball(gem,0,0,.038,.137,.145,.082,C.rubyShade,16);
 ball(gem,-.006,.017,.074,.127,.131,.073,mat(C.red,.22),16);
 ball(gem,-.047,.068,.138,.051,.053,.015,C.white);
 ball(gem,.065,-.031,.143,.018,.024,.008,0xffb7b4,8);
 // A narrow necklace continues behind the collar.
 tube(root,[[-.183,.839,.11],[-.201,.889,-.047],[-.119,.849,-.18],[0,.827,-.201],[.119,.849,-.18],[.201,.889,-.047],[.183,.839,.11]],.015,mat(C.gold,.40,.22),28);

 // Plump cream-yellow Mole head and cheek/chin volume behind the face.
 ball(root,0,1.265,.023,.377,.398,.312,C.skin,16);
 ball(root,0,1.183,.202,.302,.262,.158,C.skin,16);
 // Open-front thick hair cap. Front forehead edge is high; side/back edges curl low.
 function hairShell(inner){const pos=[],idx=[],nu=36,nv=12;for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const phi=i/nu*Math.PI*2,front=Math.max(0,Math.cos(phi)),theta=.016+j/nv*(2.385-1.135*front**3-.016),shrink=inner?.958:1;pos.push(Math.sin(phi)*Math.sin(theta)*.442*shrink,1.297+Math.cos(theta)*.433*shrink,Math.cos(phi)*Math.sin(theta)*.326*shrink-.041);if(j<nv&&i<nu){const k=j*(nu+1)+i;if(inner)idx.push(k,k+1,k+nu+1,k+1,k+nu+2,k+nu+1);else idx.push(k,k+nu+1,k+1,k+1,k+nu+1,k+nu+2);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
 mesh(root,hairShell(false),mat(C.hair,.46));mesh(root,hairShell(true),C.hairInner);
 const capRim=[];for(let i=0;i<=56;i++){const phi=i/56*Math.PI*2,front=Math.max(0,Math.cos(phi)),theta=2.385-1.135*front**3;capRim.push([Math.sin(phi)*Math.sin(theta)*.438,1.297+Math.cos(theta)*.429,Math.cos(phi)*Math.sin(theta)*.323-.041]);}tube(root,capRim,.010,C.hairShade,56);
 // Deep rose inner locks show between the face and the coral outer curls.
 for(const side of [-1,1]){
  lock(root,[[side*.312,1.574,.157],[side*.410,1.357,.137],[side*.354,1.116,.182],[side*.213,1.020,.264]],.092,.050,C.hairInner,16);
  lock(root,[[side*.347,1.591,.082],[side*.423,1.384,.102],[side*.396,1.163,.169],[side*.262,1.034,.259]],.071,.047,mat(C.hair,.46),16);
  lock(root,[[side*.411,1.373,.167],[side*.412,1.251,.188],[side*.319,1.156,.259]],.025,.010,C.hairBright,10);
 }

 // White almond eyes, purple pupils and upper lashes are partially tucked below bangs.
 for(const side of [-1,1]){
  const eye=ball(root,side*.117,1.320,.343,.070,.095,.035,C.white);eye.rotation.z=-side*.080;
  ball(root,side*.111,1.326,.373,.038,.061,.020,C.pupil);
  ball(root,side*.111-.009,1.353,.391,.012,.017,.006,C.white,8);
  tube(root,[[side*.061,1.376,.368],[side*.112,1.411,.355],[side*.165,1.377,.343]],.011,C.ink,12);
 }
 // A single spherical red nose, with the white dot sitting on its curved surface.
 ball(root,0,1.216,.402,.106,.102,.107,mat(C.red,.25),16);
 ball(root,-.033,1.253,.489,.027,.026,.009,C.white,8);

 // Asymmetrical swept bangs: the pointed ends overlap just the tops of the eyes.
 const frontLocks=[
  {p:[[-.188,1.680,.059],[-.344,1.569,.227],[-.371,1.409,.273],[-.286,1.322,.325]],w:.085,d:.048},
  {p:[[.043,1.711,.070],[-.138,1.620,.255],[-.249,1.493,.339],[-.252,1.347,.358]],w:.103,d:.047},
  {p:[[.217,1.676,.088],[.066,1.598,.296],[-.090,1.450,.353],[-.072,1.347,.393]],w:.100,d:.047},
  {p:[[.305,1.609,.124],[.208,1.539,.287],[.076,1.427,.371],[.034,1.350,.391]],w:.081,d:.046},
  {p:[[.356,1.547,.112],[.318,1.413,.268],[.214,1.341,.366],[.210,1.263,.371]],w:.074,d:.036},
 ];
 for(const [i,f]of frontLocks.entries()){lock(root,f.p,f.w+.006,f.d+.004,C.hairShade,14);lock(root,f.p.map(([x,y,z])=>[x,y+.007,z+.007]),f.w,f.d,mat(i%2?C.hairBright:C.hair,.45),14);}
 // Short crisp highlight tufts follow the front hair volume.
 for(const p of [
  [[-.280,1.602,.253],[-.322,1.553,.291],[-.273,1.572,.300],[-.292,1.520,.334]],
  [[-.050,1.655,.252],[-.120,1.596,.333],[-.098,1.615,.346],[-.160,1.535,.377]],
  [[.136,1.633,.274],[.078,1.579,.356],[.099,1.599,.365],[.024,1.519,.396]],
  [[.253,1.565,.295],[.212,1.518,.357],[.222,1.536,.366],[.166,1.473,.397]],
 ])lock(root,p,.018,.006,C.hairLight,10);

 // High double-curved flyaway hair and a tied upturned side ponytail.
 lock(root,[[.005,1.706,-.030],[-.080,1.815,-.015],[-.224,1.842,-.004],[-.365,1.751,.010]],.027,.025,C.hairInner,16);
 lock(root,[[.003,1.711,-.016],[-.081,1.813,.006],[-.225,1.834,.017],[-.365,1.751,.019]],.020,.018,C.hairBright,16);
 lock(root,[[-.003,1.710,-.061],[.027,1.804,-.057],[.118,1.831,-.071],[.190,1.803,-.071]],.019,.019,C.hairInner,13);
 lock(root,[[.004,1.712,-.043],[.036,1.800,-.038],[.119,1.822,-.052],[.190,1.803,-.052]],.014,.014,C.hairBright,13);
 const pony=group(root,.275,1.669,-.080);pony.rotation.z=-.16;
 lock(pony,[[-.037,-.008,0],[.026,.109,-.031],[.164,.123,-.062],[.225,.185,-.044]],.096,.070,C.hairInner,15);
 lock(pony,[[-.036,.004,.013],[.030,.113,-.003],[.165,.132,-.028],[.225,.185,-.026]],.080,.053,mat(C.hair,.44),15);
 lock(pony,[[.021,.088,.046],[.096,.137,.027],[.179,.145,.009]],.024,.009,C.hairLight,10);
 lock(pony,[[.027,.003,-.024],[.149,-.014,-.020],[.220,.039,-.042]],.046,.035,C.hairShade,12);
 const tie=ring(pony,-.005,.037,.006,.063,.015,C.pupil,24);tie.rotation.y=.38;tie.scale.set(.65,1,1);
 ball(pony,.046,.013,.048,.027,.031,.020,C.hairLight,8);
 // Back hair has real layered locks, seams and a soft pink glint.
 for(let i=0;i<5;i++){const a=-1.0+i*.50,x=Math.sin(a)*.31,z=-.041-Math.cos(a)*.296;lock(root,[[x*.56,1.623,z*.78],[x*.99,1.406,z-.004],[x*.80,1.107,z*.73]],.031,.021,i%2?C.hairShade:C.hairBright,13);}
 lock(root,[[-.156,1.568,-.311],[-.184,1.414,-.350],[-.133,1.259,-.323]],.015,.006,C.hairLight,12);

 // Merge only this avatar. Preserve indices and retire all source/clone buffers.
 root.updateMatrixWorld(true);
 const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert(),buckets=new Map(),originals=new Set(),temporaries=[],finished=[];
 let sourceMeshes=0;
 root.traverse(o=>{if(!o.isMesh)return;sourceMeshes++;originals.add(o.geometry);const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{material:o.material,geometries:[]});const clone=o.geometry.clone();if(!clone.index)clone.setIndex(Array.from({length:clone.attributes.position.count},(_,i)=>i));clone.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));for(const name of Object.keys(clone.attributes))if(name!=='position'&&name!=='normal')clone.deleteAttribute(name);buckets.get(key).geometries.push(clone);temporaries.push(clone);});
 try{
  for(const b of buckets.values()){const g=mergeGeometries(b.geometries,false);if(!g)throw new Error('Player avatar geometry could not merge');g.scale(.982,.982,.982);const m=new THREE.Mesh(g,b.material);m.name='粉翼摩尔 · '+b.material.color.getHexString();m.castShadow=m.receiveShadow=true;finished.push(m);}
 }catch(error){for(const m of finished)m.geometry.dispose();for(const m of mats.values())m.dispose();throw error;}
 finally{for(const g of originals)g.dispose();for(const g of temporaries)g.dispose();}
 root.clear();for(const m of finished)root.add(m);
 root.userData={modelId:'pink-winged-mole',triangles:finished.reduce((n,m)=>n+m.geometry.index.count/3,0),meshes:finished.length,sourceMeshes,
  parts:['厚卷发帽与后侧层次','双弯翘发与侧束发','奶黄脸红鼻紫瞳','白羽肩饰粉泡泡袖','红宝珠金圈','全周花瓣蓬裙与圆点','白边点纹粉鞋与背后系带']};
 if(parent)parent.add(root);
 return root;
}
