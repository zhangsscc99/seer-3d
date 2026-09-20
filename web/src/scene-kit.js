import * as THREE from 'three';
import {referenceLandscape} from './reference-landscape.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export const C={grass:0x91c954,leaf:0x5da345,darkLeaf:0x337247,sand:0xf0d6a3,cream:0xffedc6,wood:0xa8753e,ink:0x655439,red:0xcc5948,gold:0xf5bb40,blue:0x52a1c8};
const mats=new Map(), textures=new Map();
const ramp=new THREE.DataTexture(new Uint8Array([165,205,242]),3,1,THREE.RedFormat);
ramp.minFilter=ramp.magFilter=THREE.NearestFilter;ramp.needsUpdate=true;
export function mat(color){if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.82,metalness:0}));return mats.get(color);}
export function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent?.add(g);return g;}
function mesh(p,geo,color,x,y,z){const m=new THREE.Mesh(geo,color?.isMaterial?color:mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p?.add(m);return m;}
const ink=new THREE.LineBasicMaterial({color:0x76644e,transparent:true,opacity:.27});
export function stroke(m,color){const edge=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry,35),color?new THREE.LineBasicMaterial({color,transparent:true,opacity:.5}):ink);edge.userData.outline=true;m.add(edge);return m;}
export function box(p,x,y,z,w,h,d,color){const bevel=Math.min(w,h,d);return stroke(mesh(p,bevel>.55?new RoundedBoxGeometry(w,h,d,1,Math.min(.055,bevel*.045)):new THREE.BoxGeometry(w,h,d),color,x,y,z));}
export function ellipsoid(p,x,y,z,rx,ry,rz,color){const m=mesh(p,new THREE.SphereGeometry(1,20,14),color,x,y,z);m.scale.set(rx,ry,rz);return m;}
export function cyl(p,x,y,z,rt,rb,h,color,n=20){return mesh(p,new THREE.CylinderGeometry(rt,rb,h,n),color,x,y,z);}
export function cone(p,x,y,z,r,h,color,n=20){return mesh(p,new THREE.ConeGeometry(r,h,n),color,x,y,z);}
export function torus(p,x,y,z,r,t,color){return mesh(p,new THREE.TorusGeometry(r,t,6,32),color,x,y,z);}
export function beam(p,a,b,r,color){const d=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const m=cyl(p,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,r,d.length(),color,8);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
export function arch(p,x,y,z,w,h,depth,color){const s=new THREE.Shape(),r=w/2;s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI,false);s.lineTo(-r,0);return stroke(mesh(p,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:16}),color,x,y,z));}
export function flat(p,points,color,y=.01){const s=new THREE.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const m=mesh(p,new THREE.ShapeGeometry(s),color,0,y,0);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;}
export function disk(p,x,z,rx,rz,color,y=.02){const m=mesh(p,new THREE.CircleGeometry(1,48),color,x,y,z);m.rotation.x=-Math.PI/2;m.scale.set(rx,rz,1);m.castShadow=false;return m;}
export function rng(seed=1){let n=seed;return()=>((n=Math.imul(1664525,n)+1013904223>>>0)/4294967296);}
function texture(key,draw,w=512,h=512){if(textures.has(key))return textures.get(key);const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=2;textures.set(key,t);return t;}
function colorHex(c){return '#'+new THREE.Color(c).getHexString();}
export function label(p,text,x,y,z,w,h,opts={}){
 const {color='#fff2bf',bg='#4b8d86',border='#e9b64e',fontSize=66}=opts;
 const key='label:'+text+JSON.stringify(opts);
 const t=texture(key,(ctx,W,H)=>{ctx.clearRect(0,0,W,H);ctx.fillStyle=bg;ctx.strokeStyle=border;ctx.lineWidth=14;ctx.beginPath();ctx.roundRect(9,9,W-18,H-18,24);ctx.fill();ctx.stroke();ctx.font=`900 ${fontSize}px "Arial Rounded MT Bold", "PingFang SC", sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.strokeStyle='#705332';ctx.lineWidth=5;const lines=text.split('\n');lines.forEach((line,i)=>{const yy=H/2+(i-(lines.length-1)/2)*fontSize*1.08;ctx.strokeText(line,W/2,yy,W-38);ctx.fillStyle=color;ctx.fillText(line,W/2,yy,W-38);});},512,Math.max(160,Math.round(512*h/w)));
 const m=mesh(p,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide}),x,y,z);m.castShadow=false;return m;
}
export function roof(p,x,y,z,w,h,d,color){
 const g=group(p,x,y,z),s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(0,h);s.lineTo(w/2,0);s.closePath();
 const m=stroke(mesh(g,new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),color,0,0,-d/2));
 const tex=texture('shingles:'+color,(ctx,W,H)=>{ctx.fillStyle=colorHex(color);ctx.fillRect(0,0,W,H);ctx.lineWidth=5;ctx.strokeStyle='rgba(89,57,43,.42)';for(let row=-1;row<8;row++)for(let col=-1;col<8;col++){let xx=col*80+(row%2)*40,yy=row*77;ctx.fillStyle=(row+col)%3?'rgba(255,235,193,.12)':'rgba(86,64,57,.09)';ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+80,yy);ctx.bezierCurveTo(xx+90,yy+92,xx-10,yy+92,xx,yy);ctx.fill();ctx.stroke();}});
 const len=Math.hypot(w/2,h),material=new THREE.MeshStandardMaterial({color:0xffffff,map:tex,roughness:.8,side:THREE.DoubleSide});
 for(const sign of [-1,1]){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([sign*w/2,.018,-d/2,0,h+.018,-d/2,0,h+.018,d/2,sign*w/2,.018,d/2],3));geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));geo.setIndex([0,1,2,0,2,3]);geo.computeVertexNormals();mesh(g,geo,material,0,0,0);}
 beam(g,[-w/2,0,d/2+.04],[0,h,d/2+.04],.09,0xd5b978);beam(g,[0,h,d/2+.04],[w/2,0,d/2+.04],.09,0xd5b978);
 return g;
}
export function tree(p,x,z,scale=1){const g=group(p,x,0,z);g.scale.setScalar(scale);cyl(g,0,1.55,0,.22,.48,3.1,0x956333,9);beam(g,[0,1.7,0],[-.8,3.05,0],.2,0x956333);beam(g,[0,1.9,0],[.8,3.3,0],.19,0x956333);[[0,3.6,0,1.6],[-1,3.1,.2,1.1],[1,3.3,.2,1.15],[0,4.4,-.15,1]].forEach(([a,b,c,r],i)=>ellipsoid(g,a,b,c,r,r*.8,r*.85,[0x498c3d,0x72b34c,0x64a546,0x93c553][i]));return g;}
export function bush(p,x,z,scale=1){const g=group(p,x,0,z);g.scale.setScalar(scale);ellipsoid(g,0,.55,0,1,.7,.7,0x589b42);ellipsoid(g,-.55,.6,.14,.6,.55,.56,0x7fbd4f);ellipsoid(g,.5,.73,-.1,.65,.57,.5,0x76b349);return g;}
export function flowers(p,{x,z,w,d},count=20,seed=1){const random=rng(seed);const g=group(p);for(let i=0;i<count;i++){const xx=x+(random()-.5)*w,zz=z+(random()-.5)*d,cc=[0xfff9dd,0xfff4dc,0xf4bddd,0xe7d3ee][i%4];const fl=group(g,xx,.065,zz);for(let n=0;n<5;n++){const a=n*Math.PI*2/5;const m=ellipsoid(fl,Math.cos(a)*.095,0,Math.sin(a)*.095,.10,.028,.065,cc);m.rotation.y=-a;}ellipsoid(fl,0,.014,0,.045,.024,.045,0xf9d150);}return g;}
export function fence(p,x1,z1,x2,z2,{height=1,color=0xf8eccb}={}){const g=group(p),len=Math.hypot(x2-x1,z2-z1),n=Math.ceil(len/.8);for(let i=0;i<=n;i++){const t=i/n,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;box(g,x,height/2,z,.12,height,.13,color);cone(g,x,height+.065,z,.1,.16,color,4);}for(const y of [.35,.7])beam(g,[x1,y*height,z1],[x2,y*height,z2],.055,color);return g;}
export function paving(p,cx,cz,w,d,seed=1){
 const t=texture('paving'+seed,(ctx,W,H)=>{
  const rand=rng(seed),sites=[],step=W/6;
  for(let j=0;j<6;j++)for(let i=0;i<6;i++)sites.push([(i+.5+(rand()-.5)*.7)*step,(j+.5+(rand()-.5)*.7)*step]);
  const copies=[];for(const p of sites)for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)copies.push([p[0]+dx*W,p[1]+dz*H]);
  ctx.fillStyle='#f4dda9';ctx.fillRect(0,0,W,H);
  function clip(poly,nx,ny,c){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=a[0]*nx+a[1]*ny-c,db=b[0]*nx+b[1]*ny-c;if(da<=0)out.push(a);if((da<0)!==(db<0)){const f=da/(da-db);out.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]);}}return out;}
  sites.forEach((center,index)=>{
   const [x,y]=center;let poly=[[x-step*2,y-step*2],[x+step*2,y-step*2],[x+step*2,y+step*2],[x-step*2,y+step*2]];
   for(const [bx,by] of copies){if(Math.abs(bx-x)+Math.abs(by-y)<.01||Math.hypot(bx-x,by-y)>step*3)continue;poly=clip(poly,bx-x,by-y,(bx*bx+by*by-x*x-y*y)/2);if(!poly.length)break;}
   poly=poly.map(([px,py])=>[x+(px-x)*.85,y+(py-y)*.85]);
   for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
    ctx.save();ctx.translate(dx*W,dz*H);ctx.beginPath();
    for(let i=0;i<poly.length;i++){const prev=poly[(i+poly.length-1)%poly.length],p=poly[i],next=poly[(i+1)%poly.length];const a=[p[0]+(prev[0]-p[0])*.23,p[1]+(prev[1]-p[1])*.23],b=[p[0]+(next[0]-p[0])*.23,p[1]+(next[1]-p[1])*.23];if(!i)ctx.moveTo(...a);else ctx.lineTo(...a);ctx.quadraticCurveTo(p[0],p[1],b[0],b[1]);}
    ctx.closePath();ctx.fillStyle=['#e5d1b4','#dfc6b5','#cbd1bd','#e9d9bb','#d9d4bb','#e6cdb8'][index%6];ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#f9e7bb';ctx.stroke();ctx.restore();
   }
  });
 },1024,1024);
 const tex=t.clone();tex.needsUpdate=true;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(w/9.5,d/9.5);const material=new THREE.MeshStandardMaterial({map:tex,roughness:.95,bumpMap:tex,bumpScale:.022});const m=mesh(p,new THREE.PlaneGeometry(w,d),material,cx,.018,cz);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;
}
export function bench(p,x,z,yaw=0){const g=group(p,x,.08,z);g.rotation.y=yaw;for(const xx of [-.8,.8]){beam(g,[xx,.04,-.25],[xx,.72,-.25],.07,0x8b673d);beam(g,[xx,.04,.35],[xx,.61,.35],.07,0x8b673d);beam(g,[xx,.45,-.32],[xx,1.25,-.44],.065,0x8b673d);}for(let n=0;n<4;n++)box(g,0,.57,-.25+n*.18,2.1,.095,.15,0xd99b45);for(let n=0;n<3;n++)box(g,0,.84+n*.16,-.39,2.1,.12,.09,0xe3a34e);return g;}
export function lamp(p,x,z,scale=1){const g=group(p,x,0,z);g.scale.setScalar(scale);cyl(g,0,.14,0,.25,.36,.28,0xe1b244);cyl(g,0,1.7,0,.07,.12,3.25,0x91a7b0,12);torus(g,0,2.95,0,.19,.045,0xe5b84e);ellipsoid(g,0,3.22,0,.35,.47,.35,0x8bd6e1);for(let i=0;i<4;i++){const a=i*Math.PI/2;beam(g,[Math.sin(a)*.27,2.82,Math.cos(a)*.27],[Math.sin(a)*.34,3.52,Math.cos(a)*.34],.04,0xc19335);}cone(g,0,3.72,0,.5,.6,0xeab940);ellipsoid(g,0,4.07,0,.16,.16,.16,0xc7575a);return g;}
export function ram(p,x,z,color=0xf3b234){const g=group(p,x,0,z);ellipsoid(g,0,.39,0,.48,.4,.37,color);for(let i=0;i<2;i++){ellipsoid(g,(i-.5)*.22,.47,.327,.12,.16,.07,0xfff9e8);ellipsoid(g,(i-.5)*.22,.45,.388,.045,.075,.025,0x373331);}for(const side of [-1,1]){const l=ellipsoid(g,side*.16,.97,-.02,.14,.36,.05,0x6bb547);l.rotation.z=side*-.47;}return g;}
export function mole(p,x,z,color=0xf2bf48){const g=group(p,x,0,z);ellipsoid(g,-.19,.13,.13,.22,.14,.35,0x995f34);ellipsoid(g,.19,.13,.13,.22,.14,.35,0x995f34);ellipsoid(g,0,.57,0,.41,.48,.30,color);ellipsoid(g,0,1.11,0,.46,.43,.4,0x82bbd4);ellipsoid(g,0,1.08,.31,.42,.32,.15,0xffedcf);for(const s of [-1,1]){ellipsoid(g,s*.15,1.26,.373,.057,.09,.035,0x373237);ellipsoid(g,s*.47,.63,.035,.16,.16,.17,0xfff2df);}ellipsoid(g,0,1.04,.49,.185,.17,.19,0xe95848);const smile=torus(g,0,.975,.434,.14,.015,0x8b5d42);smile.scale.y=.48;return g;}
export function makeBase({ground=0x91d75b,paved=false,seed=1}={}){
 const root=group();root.name='scenery';
 referenceLandscape(root,{ground,seed});
 if(paved)paving(root,0,3,36,23,seed);
 return root;
}
