import * as THREE from 'three';
import {group,box,ellipsoid,cyl,cone,torus,beam,arch,flat,mat,bush} from '../scene-kit.js';

const P={ivory:0xf1eedb,cream:0xfff2cc,blue:0x73adbf,glass:0xa9d5d9,wood:0xb68a49,
  gold:0xe8b643,red:0xd45243,darkRed:0x9b4038,leaf:0x58a345};
function mesh(p,g,c){const m=new THREE.Mesh(g,Array.isArray(c)||c?.isMaterial?c:mat(c));m.castShadow=m.receiveShadow=true;p.add(m);return m;}
function tube(p,pts,r,c,closed=false){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(a=>new THREE.Vector3(...a)),closed),Math.max(24,pts.length*3),r,8,closed),c);}
function extrude(p,shape,x,y,z,color,depth=.10){const m=mesh(p,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.018,bevelSize:.018,bevelSegments:2,curveSegments:24}),color);m.position.set(x,y,z);return m;}
function shapeFrom(points){const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return s;}
function cross(p,x,y,z,s=1,red=true){const points=[[-.19,.59],[.19,.59],[.19,.19],[.56,.19],[.56,-.19],[.19,-.19],[.19,-.59],[-.19,-.59],[-.19,-.19],[-.56,-.19],[-.56,.19],[-.19,.19]],g=group(p,x,y,z);g.scale.setScalar(s);extrude(g,shapeFrom(points),0,0,0,0xf6efd8,.16);if(red){const a=extrude(g,shapeFrom(points.map(q=>q.map(v=>v*.76))),0,0,.19,0xb94737,.055);for(const side of [-1,1])beam(g,[side*.12,.48,.26],[side*.12,.20,.26],.012,0xd97456);}return g;}
const woodMats=new Map();
function wood(color){if(woodMats.has(color))return woodMats.get(color);const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#fffef4';ctx.fillRect(0,0,256,512);for(let i=0;i<62;i++){ctx.strokeStyle=i%3?'rgba(108,57,16,.16)':'rgba(109,65,22,.25)';ctx.lineWidth=i%4?.6:1.2;ctx.beginPath();for(let y=0;y<=512;y+=12){const x=i*4.3+Math.sin(y*.04+i)*1.5+Math.sin(y*.014+i)*2.5;y?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=8;const material=new THREE.MeshStandardMaterial({color,map:tex,roughness:.78,bumpMap:tex,bumpScale:.017});woodMats.set(color,material);return material;}
function archedWindow(p,x,y,z,w,h){
  arch(p,x,y,z,w+.24,h+.18,.095,0xfbf4d9);arch(p,x,y+.08,z+.105,w,h-.04,.042,P.glass);
  const radius=w/2,archStart=h-radius;
  for(const dx of [-w*.23,0,w*.23]){const ht=archStart+Math.sqrt(Math.max(0,radius*radius-dx*dx))-.05;box(p,x+dx,y+.08+ht/2,z+.168,.035,ht,.046,0x997043);}
  for(let dy=.34;dy<h-.06;dy+=.58){const half=dy<=archStart?radius:Math.sqrt(Math.max(0,radius*radius-(dy-archStart)**2));box(p,x,y+.08+dy,z+.177,Math.max(.045,half*2),.056,.049,0x95633c);}
  box(p,x,y+.02,z+.20,w+.26,.12,.25,0xd8d9c8);box(p,x-w*.24,y+h*.55,z+.201,.027,h*.66,.018,0xdaf3eb);
}
function leafShape(w,h){const s=new THREE.Shape();s.moveTo(0,h*.5);s.lineTo(-w*.20,h*.23);s.lineTo(-w*.44,h*.19);s.lineTo(-w*.32,-h*.02);s.lineTo(-w*.5,-h*.12);s.quadraticCurveTo(-w*.30,-h*.34,0,-h*.5);s.quadraticCurveTo(w*.30,-h*.34,w*.5,-h*.12);s.lineTo(w*.32,-h*.02);s.lineTo(w*.44,h*.19);s.lineTo(w*.20,h*.23);s.closePath();return s;}
function ivy(p,x,z,height=5.6){const stem=[];for(let i=0;i<=15;i++)stem.push([x+Math.sin(i*.91)*.042,.50+i*height/15,z]);tube(p,stem,.020,0x528548);for(let i=0;i<20;i++){const y=.54+i*height/20,side=i%2?1:-1,g=group(p,x+side*.046,y,z+.018);g.rotation.z=side*.42;extrude(g,leafShape(.26,.35),0,0,0,[0x4e994e,0x69aa54,0x579e4d][i%3],.025);beam(g,[0,-.14,.042],[0,.13,.042],.009,0x9bc16b);}}
function leafyRoof(p,x,y,z){
  const g=group(p,x,y,z),R=1.13,H=1.44;
  const core=mesh(g,new THREE.ConeGeometry(R,H,48),0x4c9944);core.position.y=H/2;
  const point=(a,t,lift=0)=>{const r=R*Math.pow(Math.max(.015,1-t),.90)+lift;return [Math.sin(a)*r,t*H,Math.cos(a)*r];};
  const positions=[],colors=[],edges=[],palette=[0x60a849,0x69b04d,0x559e43,0x5daa49,0x74b54e].map(v=>new THREE.Color(v));
  for(let row=0;row<6;row++){const lower=row/6-.025,upper=Math.min(1,(row+1.25)/6),count=Math.max(7,18-row*2),span=Math.PI*2/count;
    for(let n=0;n<count;n++){const a=n*span+(row%2)*span/2,pts=[point(a-span*.52,upper,.024),point(a+span*.52,upper,.024)];
      for(let j=0;j<=12;j++){const f=j/12,theta=a+span*(.52-f*1.04),t=lower+.038*Math.cos(f*Math.PI*2)+.022*Math.cos(f*Math.PI*6);pts.push(point(theta,t,.030));}
      const middle=point(a,(lower+upper)*.50,.035),col=palette[(n+row*2)%palette.length];for(let j=0;j<pts.length;j++)for(const v of [middle,pts[j],pts[(j+1)%pts.length]]){positions.push(...v);colors.push(col.r,col.g,col.b);}
      for(let j=2;j<pts.length-1;j++)edges.push(...pts[j],...pts[j+1]);
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const material=mat(0xffffff).clone();material.vertexColors=true;material.side=THREE.DoubleSide;mesh(g,geo,material);
  const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.Float32BufferAttribute(edges,3));const seams=new THREE.LineSegments(eg,new THREE.LineBasicMaterial({color:0x3e863b,transparent:true,opacity:.54}));seams.userData.outline=true;g.add(seams);
  for(let n=0;n<10;n++){const a=n*Math.PI/5;const fruit=ellipsoid(g,Math.sin(a)*.80,-.095,Math.cos(a)*.80,.075,.12,.075,0xe4b43f);fruit.castShadow=false;}
  return g;
}
function tower(p,x){
  const z=-.56,w=1.33,d=1.71;box(p,x,3.53,z,w,5.98,d,P.ivory);
  for(const y of [.57,1.00,6.28])box(p,x,y,z,w+.20,.18,d+.20,0xdfe5cf);
  for(const dx of [-.60,.60])for(const dz of [-.79,.79]){
    cyl(p,x+dx,3.63,z+dz,.105,.13,5.39,0xfcf6dc,12);cyl(p,x+dx,1.01,z+dz,.165,.165,.21,0xdfbd66,16);cyl(p,x+dx,6.26,z+dz,.17,.15,.26,0xf1eed7,16);
    for(const offset of [-.035,.035])beam(p,[x+dx+offset,1.17,z+dz+.10],[x+dx+offset,6.02,z+dz+.10],.012,0xcbd7bd);
  }
  archedWindow(p,x,1.64,z+d/2+.027,.72,4.13);
  const rear=group(p,x,0,z-d/2-.028);rear.rotation.y=Math.PI;archedWindow(rear,0,3.93,0,.66,1.78);
  for(const side of [-1,1]){const f=group(p,x+side*w/2,0,z);f.rotation.y=side*Math.PI/2;archedWindow(f,0,1.70,.02,.66,3.97);}
  ivy(p,x-.65,z+d/2+.075,5.59);ivy(p,x+.65,z+d/2+.075,5.59);
  leafyRoof(p,x,6.39,z);cross(p,x,8.21,z+.28,.92,true);
}
function signLetter(p,text,x,y,z,tilt=0){const c=document.createElement('canvas');c.width=192;c.height=256;const ctx=c.getContext('2d');ctx.font='900 218px "Arial Rounded MT Bold", Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.strokeStyle='#456d8a';ctx.lineWidth=12;ctx.strokeText(text,96,139,170);ctx.fillStyle='#fff2e2';ctx.fillText(text,96,139,170);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=mesh(p,new THREE.PlaneGeometry(.42,.46),new THREE.MeshStandardMaterial({map:tex,transparent:true,alphaTest:.03,roughness:.8}));m.position.set(x,y,z);m.rotation.z=tilt;m.castShadow=false;return m;}
function rescueSign(p){
  const ring=(expand=0)=>{const s=new THREE.Shape();s.moveTo(-1.68-expand,3.29);s.bezierCurveTo(-1.08,4.36,-.57,4.68+expand,0,4.70+expand);s.bezierCurveTo(.57,4.68+expand,1.08,4.36,1.68+expand,3.29);s.lineTo(1.40+expand*.35,2.96-expand);s.bezierCurveTo(.93,3.72,.47,4.02-expand,0,4.08-expand);s.bezierCurveTo(-.47,4.02-expand,-.93,3.72,-1.40-expand*.35,2.96-expand);s.closePath();return s;};
  extrude(p,ring(.095),0,0,2.06,0xb6443e,.14);extrude(p,ring(0),0,0,2.235,0x6498ba,.055);
  const outline=[];for(const side of [-1,1])for(let i=0;i<=18;i++){const t=side<0?i/18:1-i/18,a=1-t,x=side*(1.68*a*a*a+3*1.08*a*a*t+3*.57*a*t*t),y=3.29*a*a*a+3*4.36*a*a*t+3*4.68*a*t*t+4.70*t*t*t;outline.push([x,y,2.325]);}tube(p,outline,.025,0xf0d099);
  for(const [letter,x,y,rot] of [['R',-1.05,3.89,.72],['E',-.64,4.19,.40],['S',-.215,4.355,.13],['C',.215,4.355,-.13],['U',.64,4.19,-.40],['E',1.05,3.89,-.72]])signLetter(p,letter,x,y,2.337,rot);
}
function bow(p,x,y,z){
  const g=group(p,x,y,z);g.scale.x=.86;const gold=0xf0bb5d,red=0xda6251;
  for(const side of [-1,1]){
    const s=new THREE.Shape();s.moveTo(0,.04);s.bezierCurveTo(side*.18,.40,side*.60,.52,side*.67,.32);s.bezierCurveTo(side*.72,.05,side*.40,-.19,side*.02,-.10);s.closePath();
    const hole=new THREE.Path();hole.moveTo(side*.11,.07);hole.bezierCurveTo(side*.27,.31,side*.51,.33,side*.53,.23);hole.bezierCurveTo(side*.54,.11,side*.32,-.04,side*.11,.07);hole.closePath();s.holes.push(hole);
    extrude(g,s,0,0,0,red,.10);const edge=[];for(let i=0;i<=18;i++){const t=i/18;edge.push([side*(.10+.53*t),.12+.21*Math.sin(t*Math.PI),.14]);}tube(g,edge,.026,gold);
    const tail=shapeFrom([[side*.03,-.03],[side*.29,-.13],[side*.42,-1.04],[side*.18,-.87],[side*.02,-1.18],[-side*.055,-.23]]);extrude(g,tail,0,0,.01,red,.065);
    tube(g,[[side*.27,-.13,.11],[side*.31,-.58,.11],[side*.41,-1.01,.11],[side*.18,-.85,.11],[side*.025,-1.15,.11]],.023,gold);
  }
  ellipsoid(g,0,.04,.13,.18,.22,.14,0xde5f49);tube(g,[[-.11,.19,.23],[0,.17,.28],[.11,.10,.23]],.023,gold);return g;
}
function bellAndMount(p){
  const gold=new THREE.MeshStandardMaterial({color:0xffd23f,roughness:.39,metalness:.09});
  const profile=[[.57,0],[.61,.065],[.60,.14],[.48,.22],[.40,.41],[.39,.80],[.32,1.00],[.18,1.13],[0,1.16]].map(a=>new THREE.Vector2(...a));
  const bell=mesh(p,new THREE.LatheGeometry(profile,40),gold);bell.position.set(0,4.43,1.29);const lip=torus(p,0,4.50,1.29,.56,.055,0xedb132);lip.rotation.x=Math.PI/2;
  ellipsoid(p,0,4.39,1.29,.13,.18,.13,0xc88b26);ellipsoid(p,-.15,5.13,1.66,.105,.28,.035,0xffeb88);torus(p,0,5.68,1.30,.13,.042,0xdca832);
  // Bracket, bolt plate, pipe collar and capped mast behind the bell.
  cyl(p,0,6.06,.91,.072,.072,1.76,0xa8babe,16);ellipsoid(p,0,7.02,.91,.145,.15,.145,0xdce4d6);
  for(const y of [5.58,6.38,6.76]){cyl(p,0,y,.91,.11,.11,.11,0xdfb448,16);}
  beam(p,[-.78,6.10,.89],[.79,6.10,.89],.085,0xabbcc0);box(p,.58,5.83,.90,.25,.57,.24,0xa1b6b8);cyl(p,.57,5.50,.90,.12,.12,.16,0xdbe0ca,16);
  box(p,0,6.13,1.02,.34,.86,.15,0xe5e5cc);for(const y of [5.87,6.12,6.37]){ellipsoid(p,0,y,1.126,.057,.063,.025,0xb19d60);ellipsoid(p,-.11,y+.075,1.129,.018,.025,.018,0xf5f0d8);}
}
function heart(p,x,y,z,w,h,color,depth=.06){const s=new THREE.Shape();s.moveTo(0,-h*.47);s.bezierCurveTo(-w*.69,-h*.04,-w*.50,h*.56,-w*.15,h*.35);s.quadraticCurveTo(0,h*.27,0,h*.15);s.quadraticCurveTo(0,h*.27,w*.15,h*.35);s.bezierCurveTo(w*.50,h*.56,w*.69,-h*.04,0,-h*.47);return extrude(p,s,x,y,z,color,depth);}
function aidBooth(p){
  const g=group(p,-3.12,.02,2.10);g.name='爱心救护小屋与白心怀表徽章';
  box(g,0,1.32,0,1.67,2.54,1.36,0xe3e7db);box(g,0,.19,0,1.82,.29,1.49,0x6091ad);
  for(const x of [-.78,.78])box(g,x,1.37,.64,.15,2.47,.12,0x8fbcca);
  // Stepped red cornice and actual pale-blue scalloped awning ends.
  box(g,0,2.75,-.01,1.80,.79,1.50,0xbc5545);box(g,0,3.16,.10,1.23,.20,1.26,0xd67e63);box(g,0,3.32,.12,.84,.20,1.03,0xefcfb1);
  for(const side of [-1,1])box(g,side*.83,2.68,.81,.17,.81,.17,0xf2d5b5);
  for(let i=0;i<6;i++){const x=-.74+i*.296;box(g,x,2.32,.89,.29,.42,.25,i%2?0xe4e5d6:0x6b9dbb);const scallop=cyl(g,x,2.13,.99,.145,.145,.12,i%2?0xe4e5d6:0x6b9dbb,24);scallop.rotation.x=Math.PI/2;}
  arch(g,0,.12,.76,1.32,2.02,.11,0x397e44);arch(g,0,.13,.90,1.07,1.86,.07,0x7bb446);arch(g,0,.13,1.00,.78,1.62,.048,wood(0xa7a052));
  for(const x of [-.24,-.08,.09,.25])box(g,x,.82,1.065,.017,1.38,.016,0x827140);ellipsoid(g,.20,.77,1.09,.041,.061,.036,0xedc54f);
  // Red emblem backing has gold molding and a true white heart / chef crest.
  box(g,0,2.81,1.055,1.34,1.20,.15,0x943e33);box(g,0,2.81,1.149,1.15,1.06,.052,0xc2684c);
  heart(g,0,3.25,1.24,1.17,.70,0x3d8945,.065);heart(g,0,3.27,1.323,.97,.54,0xffffe7,.035);
  for(const side of [-1,1]){const leaf=extrude(g,leafShape(.42,.28),side*.19,2.91,1.31,0x75b850,.035);leaf.rotation.z=side*1.03;}
  const watch=cyl(g,0,2.51,1.30,.37,.37,.10,0xf2d892,40);watch.rotation.x=Math.PI/2;torus(g,0,2.51,1.374,.37,.047,0x7b5e31);torus(g,0,2.51,1.407,.285,.027,0xf5e8b9);
  const face=cyl(g,0,2.51,1.408,.253,.253,.028,0xffffdc,36);face.rotation.x=Math.PI/2;torus(g,0,2.92,1.37,.089,.029,0xdeb03f);
  tube(g,[[.03,2.68,1.445],[-.06,2.69,1.445],[-.13,2.60,1.445],[-.05,2.48,1.445],[.06,2.49,1.445],[.07,2.59,1.445]],.027,0x805d2e);beam(g,[0,2.50,1.455],[.15,2.61,1.455],.023,0x805d2e);
  for(const side of [-1,1]){const f=group(g,side*.86,0,0);f.rotation.y=side*Math.PI/2;archedWindow(f,0,.73,.02,.51,1.16);}
  // Purple doorstep mat carries small cream hearts as physical inlays.
  box(g,0,.075,1.43,1.78,.11,.88,0xb584b5);box(g,0,.14,1.80,1.77,.022,.067,0xe0b5cd);
  for(const [x,z] of [[-.49,1.40],[.30,1.48],[-.04,1.77]]){const h=heart(g,x,0,0,.30,.22,0xe8dbdf,.018);h.rotation.x=-Math.PI/2;h.position.set(x,.14,z);}
  return g;
}
function annexRoof(p,x,y,z){
  const g=group(p,x,y,z),half=1.48,h=1.29,d=2.67,profile=t=>h*Math.sqrt(Math.max(0,1-t*t));
  const s=new THREE.Shape();s.moveTo(-half,0);for(let i=0;i<=40;i++){const t=-1+i/20;s.lineTo(t*half,profile(t));}s.lineTo(half,0);s.closePath();const roof=mesh(g,new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),0xad4e44);roof.position.z=-d/2;
  // The illustrated front cap is tiled too; a plain red half-disc obscures the
  // most visible part of the annex roof from the reference camera.
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#b95649';ctx.fillRect(0,0,512,256);
  for(let row=-1;row<5;row++)for(let col=-1;col<9;col++){const xx=col*64+(row%2)*32,yy=row*59;ctx.fillStyle=(row+col)%3?'#c25e4e':'#cf6b57';ctx.strokeStyle='#963f37';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+64,yy);ctx.bezierCurveTo(xx+65,yy+71,xx,yy+71,xx,yy);ctx.fill();ctx.stroke();}
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;const capGeo=new THREE.ShapeGeometry(s),uv=capGeo.attributes.uv,pos=capGeo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+half)/(half*2),pos.getY(i)/h);uv.needsUpdate=true;
  const cap=mesh(g,capGeo,new THREE.MeshStandardMaterial({map:tex,roughness:.86,bumpMap:tex,bumpScale:.018}));cap.position.z=d/2+.014;
  const positions=[],colors=[],seams=[],palette=[0xbe5b50,0xcd6958,0xb45649,0xc66152].map(v=>new THREE.Color(v));
  for(const side of [-1,1])for(let row=0;row<5;row++)for(let col=-1;col<6;col++){
    const a=Math.max(-d/2,-d/2+(col+(row%2)*.5)*d/6),b=Math.min(d/2,-d/2+(col+1+(row%2)*.5)*d/6);if(b-a<.02)continue;
    const inner=row/5,outer=Math.min(1,(row+1.1)/5),pt=(t,zz)=>[side*t*half,profile(t)+.035,zz],poly=[pt(inner,a),pt(inner,b)];for(let j=0;j<=10;j++){const f=j/10;poly.push(pt(Math.min(1,outer-.035+.035*Math.sin(f*Math.PI)),b-(b-a)*f));}
    const mid=pt((inner+outer)/2,(a+b)/2),c=palette[(col+row+8)%4];for(let j=0;j<poly.length;j++)for(const v of [mid,poly[j],poly[(j+1)%poly.length]]){positions.push(...v);colors.push(c.r,c.g,c.b);}for(let j=2;j<poly.length-1;j++)seams.push(...poly[j],...poly[j+1]);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const material=mat(0xffffff).clone();material.vertexColors=true;material.side=THREE.DoubleSide;mesh(g,geo,material);
  const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.Float32BufferAttribute(seams,3));const edges=new THREE.LineSegments(eg,new THREE.LineBasicMaterial({color:0x913f39,transparent:true,opacity:.67}));edges.userData.outline=true;g.add(edges);
  for(const zz of [-d/2-.03,d/2+.06]){const pts=[];for(let i=0;i<=30;i++){const t=-1+i/15;pts.push([t*half,profile(t)+.04,zz]);}tube(g,pts,.09,0xcda555);}return g;
}
function curvedGarden(p){
  const anchors=[[1.60,3.35],[2.53,3.60],[3.60,3.44],[4.57,2.88],[5.10,1.77],[5.20,.36],[5.05,-1.10]],curve=new THREE.CatmullRomCurve3(anchors.map(([x,z])=>new THREE.Vector3(x,0,z))),pts=curve.getPoints(84).map(q=>[q.x,q.z]);
  const polygon=[...pts,[4.87,-1.75],[1.65,-1.75]],s=new THREE.Shape();polygon.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const base=mesh(p,new THREE.ExtrudeGeometry(s,{depth:.31,bevelEnabled:false}),0xc0c4b9);base.rotation.x=-Math.PI/2;base.position.y=.02;
  flat(p,polygon,0x77b449,.341);
  for(let i=0;i<pts.length-1;i+=4){const a=pts[i],b=pts[Math.min(i+4,pts.length-1)],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),stone=box(p,(a[0]+b[0])/2,.31,(a[1]+b[1])/2,len-.019,.38,.37,[0xe1dfd2,0xc7cdc4,0xd7d9cd][i%3]);stone.rotation.y=-Math.atan2(dz,dx);}
  for(const y of [.80,1.27])tube(p,pts.map(([x,z])=>[x,y,z]),.050,0x74aebc);
  for(let i=0;i<=36;i++){const q=curve.getPoint(i/36);cyl(p,q.x,.86,q.z,.032,.034,.85,0x6fabbf,10);}
  for(let i=0;i<7;i++){const q=curve.getPoint(i/6);cyl(p,q.x,.85,q.z,.098,.125,1.12,0xe9e7d6,16);cyl(p,q.x,1.40,q.z,.14,.14,.11,0x88aeba,18);ellipsoid(p,q.x,1.59,q.z,.19,.22,.19,0xdce6df);torus(p,q.x,1.51,q.z+.16,.13,.024,0xa3bac2);}
  for(let i=0;i<5;i++){const shrub=bush(p,2.2+i*.56,2.7-(i%2)*.4,.48);shrub.position.y=.28;}
}
export function createChurchRescue(parent){
  const root=group(parent,7.30,0,-3.50);root.rotation.y=.12;root.name='细节重建的爱心救护教堂';
  // Closed central nave and rear wall, framed by two fluted ivory towers.
  box(root,0,1.87,-.17,4.31,3.70,2.92,P.ivory);box(root,0,3.73,-.17,4.46,.19,3.04,0xe4e7d2);
  for(const x of [-1.72,1.72])tower(root,x);
  const back=group(root,0,0,-1.66);back.rotation.y=Math.PI;for(const x of [-1.05,1.05])archedWindow(back,x,.78,.04,.79,2.08);
  for(const side of [-1,1]){const f=group(root,side*2.18,0,-.17);f.rotation.y=side*Math.PI/2;archedWindow(f,0,.75,.03,.80,2.15);}
  arch(root,0,.13,1.34,3.09,3.75,.17,0xd16a55);arch(root,0,.15,1.55,2.82,3.56,.15,0xfff3d4);arch(root,0,.17,1.75,2.49,3.38,.07,wood(0xc1924b));
  for(let i=-4;i<=4;i++){const x=i*.271,r=1.245,h=3.38-r+Math.sqrt(Math.max(0,r*r-x*x));box(root,x,.17+h/2,1.848,.021,h-.04,.027,0x9d7139);}
  box(root,0,1.68,1.875,.042,2.94,.037,0x916736);
  for(const side of [-1,1]){ellipsoid(root,side*.20,1.51,1.899,.13,.18,.050,0xebbc4e);torus(root,side*.20,1.52,1.98,.067,.022,0xb17c2c);for(const y of [.76,2.45])box(root,side*1.16,y,1.91,.30,.095,.075,0xc7c7b6);}
  bellAndMount(root);rescueSign(root);bow(root,-1.99,3.41,2.39);bow(root,1.99,3.41,2.39);
  flat(root,[[-1.29,1.98],[1.29,1.98],[1.59,4.43],[-1.59,4.43]],0xce5542,.060);
  for(const side of [-1,1])beam(root,[side*1.30,.078,1.98],[side*1.58,.078,4.43],.038,0xe7b33d);
  for(let i=0;i<9;i++)box(root,-1.42+i*.355,.09,4.51,.343,.17,.35,wood(i%2?0xc48f3d:0xd4a04c));
  aidBooth(root);
  // Low attached chapel with red scalloped barrel tiles, double arched windows.
  box(root,3.62,1.27,-.89,2.66,2.48,2.53,0xddc5a0);annexRoof(root,3.62,2.47,-.89);
  for(const x of [3.04,4.14])archedWindow(root,x,.55,.40,.72,1.36);
  const annexRear=group(root,3.62,0,-2.20);annexRear.rotation.y=Math.PI;archedWindow(annexRear,0,.63,.03,.82,1.38);
  const annexSide=group(root,4.99,0,-.89);annexSide.rotation.y=Math.PI/2;archedWindow(annexSide,0,.56,.02,.75,1.40);
  box(root,3.22,3.66,-.31,.40,.20,.43,0xa58f64);cross(root,3.22,4.31,-.25,.93,false);curvedGarden(root);
  root.updateMatrixWorld(true);
  const boxes=[{x:0,z:-.15,rx:2.15,rz:1.50,height:4.05},{x:-1.72,z:-.56,rx:.82,rz:1.00,height:8.90},{x:1.72,z:-.56,rx:.82,rz:1.00,height:8.90},{x:-3.12,z:2.1,rx:.90,rz:.78,height:3.80},{x:3.62,z:-.89,rx:1.49,rz:1.47,height:4.94},{x:3.53,z:1.45,rx:1.70,rz:2.12,height:1.70,kind:'ellipse',cameraBlock:false}];
  const colliders=boxes.map(c=>{const q=new THREE.Vector3(c.x,0,c.z).applyMatrix4(root.matrix);return {...c,x:q.x,z:q.z,rx:c.rx*Math.cos(.12)+c.rz*Math.sin(.12),rz:c.rz*Math.cos(.12)+c.rx*Math.sin(.12)};});
  return {root,colliders};
}
