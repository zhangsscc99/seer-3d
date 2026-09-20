import * as THREE from 'three';
import {group,box,cyl,cone,torus,arch,beam,rng} from '../scene-kit.js';

// Kept inside the castle's lifetime: no texture/material cache survives a visit.
// Small procedural maps provide grain; the courses and voussoirs are real geometry.
export function createCastleSurfaceKit(){
  const size=128,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(size,size),random=rng(5426);
  for(let i=0;i<pixels.data.length;i+=4){
    const v=226+Math.floor(random()*28);pixels.data[i]=v;pixels.data[i+1]=v;pixels.data[i+2]=v;pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  for(let i=0;i<140;i++){ctx.fillStyle=i%3?'rgba(95,88,75,.10)':'rgba(255,249,226,.26)';ctx.fillRect(random()*size,random()*size,1+random()*2,1+random()*2);}
  const grain=new THREE.CanvasTexture(canvas);grain.colorSpace=THREE.SRGBColorSpace;
  grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.anisotropy=2;
  const materials=new Map();
  const stone=color=>{
    if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,map:grain,bumpMap:grain,bumpScale:.025,roughness:.96}));
    return materials.get(color);
  };
  const courses=new THREE.MeshStandardMaterial({vertexColors:true,map:grain,bumpMap:grain,bumpScale:.025,roughness:.98});
  return {stone,courses};
}

function mesh(parent,geometry,material,x=0,y=0,z=0){
  const object=new THREE.Mesh(geometry,material);object.position.set(x,y,z);object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;
}

export function castleStoneCourses(parent,kit,{x=0,z=0,y=0,height=3.6,rows=8,bottom=5.7,top=5.52,blockWidth=.82,palette=[0xb7af9d,0xcac0ad,0xbdb6a3,0xaeb1a2,0xc5b9a3]}={}){
  const positions=[],colors=[],uvs=[],random=rng(681+Math.round(x*71)),count=Math.max(8,Math.round(Math.PI*(bottom+top)/blockWidth));
  const triangle=(a,b,c,color,uv)=>{for(let i=0;i<3;i++){positions.push(...[a,b,c][i]);colors.push(color.r,color.g,color.b);uvs.push(...uv[i]);}};
  const quad=(a,b,c,d,color)=>{triangle(a,b,c,color,[[0,0],[1,0],[1,1]]);triangle(a,c,d,color,[[0,0],[1,1],[0,1]]);};
  const point=(angle,yy,relief)=>{const r=bottom+(top-bottom)*yy/height+relief;return [x+Math.sin(angle)*r,y+yy,z+Math.cos(angle)*r];};
  for(let row=0;row<rows;row++)for(let i=0;i<count;i++){
    const span=Math.PI*2/count,a=(i+(row%2)*.5)*span+.007,b=a+span-.014;
    const low=row*height/rows+.018,high=(row+1)*height/rows-.018,relief=.024+random()*.018;
    const levels=[[low,0],[low+.035,relief],[high-.035,relief],[high,0]],color=new THREE.Color(palette[(i+row*3)%palette.length]);
    for(let level=0;level<3;level++)for(let segment=0;segment<3;segment++){
      const aa=a+(b-a)*segment/3,bb=a+(b-a)*(segment+1)/3;
      quad(point(aa,...levels[level]),point(bb,...levels[level]),point(bb,...levels[level+1]),point(aa,...levels[level+1]),color);
    }
    // Exposed end faces make staggered joints visible while orbiting the tower.
    for(const aa of [a,b])quad(point(aa,low,-.028),point(aa,low+.035,relief),point(aa,high-.035,relief),point(aa,high,-.028),color);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeVertexNormals();
  const object=mesh(parent,geometry,kit.courses);object.name='Castle bevelled staggered stone courses';return object;
}

const deeperCastlePalette=new Map([
  [0xb8c3bd,0x989f94],[0xe5e8dd,0xc1b9a5],[0xd9dfd7,0xacae9d],[0xeeeade,0xc8bda6],[0xe0e5dc,0xbdb8a6],[0xd5dcd5,0xa6aa9a],
  [0xd5d9d1,0xb1ae9d],[0xc5c5b7,0x9d9c8c],[0xe7e5d7,0xc9c4b1],[0xedeade,0xd4cdb9],[0xeee8d6,0xd6cbb2],[0xeff0df,0xc7c3ac],
  [0xb9b7ab,0x999484],[0xe4b53b,0xd29a26],[0xe8ca79,0xdca73d],[0xbca2b9,0xa46b70],[0xeed899,0xdfb956],
  [0xf2efe2,0xc8c5b3],[0xf2efe3,0xc9c5b4],[0xf5f0df,0xd1c7b1],[0xeeeae0,0xcbbfa7],[0x627573,0x3e4c49],[0x596a67,0x34453f],
  [0xe4dbb8,0xbaaf92],[0xb8c4bb,0x9ca496],[0xc4cbc3,0xaaa999],[0xd0c8b7,0x999681],
  [0xa4cad1,0x548da3],[0x9dc1c7,0x598ea0],[0x9fc5cf,0x609aac],[0xb1d0d0,0x78a7af],[0x86b5c5,0x437e9a],
  [0xae7938,0x965d2e],[0xb5c3bd,0x9ea596],[0xdfe3ce,0xc4c2a9],[0xf2c953,0xe8ae36],[0xba963f,0xa97928],
  [0xe3d9bf,0xc4b79b],[0xd4cbb5,0xb5ab94],[0xe1e4da,0xc2c0ae],[0xcbb48b,0xbc9b66],
  [0xdce1ce,0xc2c4ac],[0xf0ead0,0xdac9a5],[0xc6d5d4,0xa9b6b1],[0xe2e1d5,0xc7bfad],
  [0xe8cf82,0xcba64f],[0xe7cb7f,0xc59e4c],[0xe3c779,0xc8a249],[0xf1d98c,0xdcb862],[0xf4dc91,0xe1bb61],[0xc5aa67,0x9b7d3d]
]);

export function deepenCastleMaterials(root,kit){
  root.traverse(object=>{
    if(!object.isMesh||Array.isArray(object.material))return;
    const material=object.material;if(!material.color||material.map||material.vertexColors)return;
    const color=deeperCastlePalette.get(material.color.getHex());if(color===undefined)return;
    const replacement=kit.stone(color);object.material=material.side===THREE.DoubleSide?Object.assign(replacement.clone(),{side:THREE.DoubleSide}):replacement;
  });
}

export function refineCastleTower(tower,kit,h=4.93,r=1.02){
  const strips=tower.children.filter(o=>o.geometry&&o.geometry.type==='CylinderGeometry'&&o.geometry.parameters.openEnded&&o.geometry.parameters.thetaLength<6.28);
  for(const object of strips){tower.remove(object);object.geometry.dispose();}
  castleStoneCourses(tower,kit,{height:h-.64,rows:9,bottom:r*1.10+.009,top:r+.009,blockWidth:.68});
  for(const yy of [.51,2.20]){
    const band=torus(tower,0,yy,0,r*1.085,.018,0x827f70);band.rotation.x=Math.PI/2;
  }
}

export function createCastlePavingMaterial({width=36,depth=23}={}){
  const size=512,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const bumpCanvas=document.createElement('canvas');bumpCanvas.width=bumpCanvas.height=size;
  const ctx=canvas.getContext('2d'),bump=bumpCanvas.getContext('2d'),random=rng(5426),step=size/7,sites=[];
  ctx.fillStyle='#d8b174';ctx.fillRect(0,0,size,size);bump.fillStyle='#454545';bump.fillRect(0,0,size,size);
  for(let row=0;row<7;row++)for(let col=0;col<7;col++){
    const x=(col+.5+(random()-.5)*.56)*step,y=(row+.5+(random()-.5)*.56)*step;sites.push([x,y]);
    if((row*7+col)%11===3)for(let k=0;k<5;k++){const a=k*Math.PI*2/5;sites.push([x+Math.cos(a)*step*.35,y+Math.sin(a)*step*.35]);}
  }
  const copies=[];for(const p of sites)for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)copies.push([p[0]+xx*size,p[1]+yy*size]);
  function clip(poly,nx,ny,c){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=a[0]*nx+a[1]*ny-c,db=b[0]*nx+b[1]*ny-c;if(da<=0)out.push(a);if((da<0)!==(db<0)){const t=da/(da-db);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;}
  const palette=['#c5b49a','#b7b6a0','#d2bc9b','#c6aa91','#b4b69a','#d3c0a0','#bdaf94','#c3b5a1'];
  sites.forEach(([x,y],index)=>{
    let polygon=[[x-step*2,y-step*2],[x+step*2,y-step*2],[x+step*2,y+step*2],[x-step*2,y+step*2]];
    for(const [px,py] of copies){if(Math.hypot(px-x,py-y)<.01||Math.hypot(px-x,py-y)>step*3)continue;polygon=clip(polygon,px-x,py-y,(px*px+py*py-x*x-y*y)/2);if(!polygon.length)break;}
    polygon=polygon.map(([px,py])=>[x+(px-x)*.84,y+(py-y)*.84]);
    for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)for(const target of [ctx,bump]){
      target.save();target.translate(xx*size,yy*size);target.beginPath();
      for(let i=0;i<polygon.length;i++){
        const p=polygon[i],prev=polygon[(i+polygon.length-1)%polygon.length],next=polygon[(i+1)%polygon.length];
        const ax=p[0]+(prev[0]-p[0])*.27,ay=p[1]+(prev[1]-p[1])*.27,bx=p[0]+(next[0]-p[0])*.27,by=p[1]+(next[1]-p[1])*.27;
        if(!i)target.moveTo(ax,ay);else target.lineTo(ax,ay);target.quadraticCurveTo(p[0],p[1],bx,by);
      }
      target.closePath();target.fillStyle=target===ctx?palette[index%palette.length]:'#d4d4d4';target.fill();
      target.lineWidth=4;target.strokeStyle=target===ctx?'rgba(231,201,150,.74)':'#909090';target.stroke();
      if(target===ctx){target.clip();for(let k=0;k<24;k++){target.fillStyle=k%3?'rgba(91,82,65,.075)':'rgba(255,239,208,.17)';target.fillRect(x+(random()-.5)*step*2,y+(random()-.5)*step*2,1+random()*2,1+random()*2);}}
      target.restore();
    }
  });
  const map=new THREE.CanvasTexture(canvas),heightMap=new THREE.CanvasTexture(bumpCanvas);map.colorSpace=THREE.SRGBColorSpace;
  for(const texture of [map,heightMap]){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(width/10,depth/10);texture.anisotropy=4;}
  return new THREE.MeshStandardMaterial({map,bumpMap:heightMap,bumpScale:.055,roughness:.98});
}

function openArchRing(parent,kit,cx,y,z,outer,inner,leg,depth,color){
  const shape=new THREE.Shape();shape.moveTo(-outer,0);shape.lineTo(-outer,leg);shape.absarc(0,leg,outer,Math.PI,0,true);shape.lineTo(outer,0);shape.lineTo(inner,0);shape.lineTo(inner,leg);shape.absarc(0,leg,inner,0,Math.PI,false);shape.lineTo(-inner,0);shape.closePath();
  return mesh(parent,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,curveSegments:16}),kit.stone(color),cx,y,z);
}

function createBookGallery(parent,kit){
  const gallery=group(parent,3.1,7.51,-7.52);gallery.name='Book tower continuous pierced circular gallery';
  const radius=2.13,height=1.26,bayAngle=Math.PI*2/14,halfWidth=bayAngle*radius/2;
  const dark=new THREE.MeshStandardMaterial({color:0x353441,roughness:1});
  cyl(gallery,0,height/2-.02,0,2.24,1.66,height-.05,dark,48);
  const toWorld=(x,y,offset,angle)=>{const a=x/radius+angle,r=1.91+y/height*.59+offset;return [Math.sin(a)*r,y,Math.cos(a)*r];};
  for(let bay=0;bay<14;bay++){
    const angle=bay*bayAngle,shape=new THREE.Shape();shape.moveTo(-halfWidth,0);shape.lineTo(halfWidth,0);shape.lineTo(halfWidth,height);shape.lineTo(-halfWidth,height);shape.closePath();
    const hole=new THREE.Path();hole.moveTo(-.265,.035);hole.lineTo(-.265,.70);hole.absarc(0,.70,.265,Math.PI,0,true);hole.lineTo(.265,.035);hole.closePath();shape.holes.push(hole);
    const geometry=new THREE.ShapeGeometry(shape,12),pos=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);pos.setXYZ(i,...toWorld(x,y,0,angle));uv.setXY(i,x+halfWidth,y);}
    geometry.computeVertexNormals();mesh(gallery,geometry,kit.stone(bay%3?0xcaa148:0xd2aa50));
    const edges=hole.getPoints(12),vertices=[],texcoords=[];
    for(let i=0;i<edges.length-1;i++){
      const a=edges[i],b=edges[i+1],points=[toWorld(a.x,a.y,0,angle),toWorld(b.x,b.y,0,angle),toWorld(b.x,b.y,-.18,angle),toWorld(a.x,a.y,-.18,angle)];
      for(const j of [0,1,2,0,2,3]){vertices.push(...points[j]);texcoords.push(j%2,j>1?1:0);}
    }
    const reveals=new THREE.BufferGeometry();reveals.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));reveals.setAttribute('uv',new THREE.Float32BufferAttribute(texcoords,2));reveals.computeVertexNormals();
    mesh(gallery,reveals,kit.stone(0x967541));
  }
  cyl(gallery,0,.025,0,1.94,1.93,.07,kit.stone(0xa48346),48);
}

export function addCastleRearDetails(root,kit){
  const rear=group(root);rear.name='Reference ochre bridge masonry and blue rear fortification';
  // Radial, individually separated wedge stones wrap the genuine open arches.
  for(const cx of [-9.40,-6.75,-4.10]){
    openArchRing(rear,kit,cx,4.2,-8.12,1.275,.864,1.35,.065,0xba913e);
    for(let k=0;k<11;k++){
      const a=k*Math.PI/11+.014,b=(k+1)*Math.PI/11-.014,shape=new THREE.Shape();
      shape.moveTo(Math.cos(a)*.888,Math.sin(a)*.888);shape.absarc(0,0,.888,a,b,false);shape.lineTo(Math.cos(b)*1.265,Math.sin(b)*1.265);shape.absarc(0,0,1.265,b,a,true);shape.closePath();
      mesh(rear,new THREE.ExtrudeGeometry(shape,{depth:.07,bevelEnabled:true,bevelSize:.01,bevelThickness:.014,bevelSegments:1,curveSegments:3}),kit.stone([0xd0a34c,0xd7b15c,0xc79c48][k%3]),cx,5.55,-8.065);
    }
    for(const side of [-1,1])for(let course=0;course<4;course++)box(rear,cx+side*1.075,4.36+course*.32,-8.025,.395,.293,.12,kit.stone(course%2?0xd1a653:0xc49b49));
  }
  for(const yy of [6.90,7.29])box(rear,-6.70,yy,-8.095,8.57,.07,.11,kit.stone(0xaf8435));
  for(let i=0;i<22;i++)box(rear,-10.62+i*.39,7.11,-8.09,.35,.45,.09,kit.stone(i%3?0xcaa14c:0xd6af59));
  for(let i=0;i<10;i++){box(rear,-10.25+i*.80,6.72,-8.13,.20,.21,.21,kit.stone(0xa5813a));box(rear,-10.25+i*.80,6.78,-8.07,.26,.09,.25,kit.stone(0xd3a94c));}
  // This cool, crenellated rear block was absent from the old reconstruction.
  const keep=group(rear,-.20,3.91,-10.15);keep.name='Blue grey keep behind terrace';
  box(keep,0,1.98,0,3.03,3.96,2.20,kit.stone(0x547f96));
  for(const [xx,zz,yaw,width] of [[0,1.117,0,3.03],[0,-1.117,Math.PI,3.03],[-1.53,0,-Math.PI/2,2.20],[1.53,0,Math.PI/2,2.20]]){
    const face=group(keep,xx,0,zz);face.rotation.y=yaw;
    for(let row=0;row<7;row++)for(let col=0;col<6;col++){
      const x=-width/2+.24+col*.49+(row%2)*.20;if(x>width/2-.10)continue;
      const w=Math.min(.465,(width/2-x)*2-.04);if(w<.08)continue;
      box(face,x,.30+row*.51,0,w,.475,.052,kit.stone([0x5b8197,0x61869a,0x598095][(row+col)%3]));
    }
    for(const yy of [1.25,2.28,3.31])for(const x of [-width*.31,0,width*.31]){
      box(face,x,yy,.041,.21,.36,.037,0x243d51);box(face,x,yy-.21,.074,.28,.075,.09,kit.stone(0x7b9eae));
    }
  }
  box(keep,0,3.90,0,3.22,.22,2.36,kit.stone(0x426b82));
  for(const zz of [-1.08,1.08])for(let i=0;i<6;i++)box(keep,-1.34+i*.54,4.21,zz,.32,.52,.33,kit.stone(i%2?0x628a9e:0x7498a9));
  for(const xx of [-1.43,1.43])for(const zz of [-.55,0,.55])box(keep,xx,4.21,zz,.33,.52,.31,kit.stone(0x648a9c));
  // Book tower: warm relief courses, recessed window jambs and a stone cornice.
  createBookGallery(rear,kit);
  castleStoneCourses(rear,kit,{x:3.1,z:-7.52,y:3.90,height:3.50,rows:7,bottom:1.735,top:1.907,blockWidth:.90,palette:[0xab9271,0xb7a17c,0xbaa381,0xa99378]});
  for(const yy of [4.12,5.65,7.43]){const ring=torus(rear,3.1,yy,-7.52,1.885,.046,0x9e8157);ring.rotation.x=Math.PI/2;}
  for(let bay=0;bay<9;bay++){
    const a=(bay+.28)*Math.PI*2/9,bayRoot=group(rear,3.1+Math.sin(a)*1.9,6.04,-7.52+Math.cos(a)*1.9);bayRoot.rotation.y=a;
    // Thin curved archivolts sit above the lower tall window bays.
    const points=[];for(let k=0;k<=15;k++){const t=k*Math.PI/15;points.push(new THREE.Vector3(Math.cos(t)*.56,Math.sin(t)*.77,0));}
    mesh(bayRoot,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),18,.034,5,false),kit.stone(0xc6b08d));
    for(const side of [-1,1])box(bayRoot,side*.53,-.16,0,.055,.36,.07,kit.stone(0xc6b08d));
  }
  // Circular iron door knocker directly below the Book placard.
  const knocker=torus(rear,2.44,5.04,-5.615,.175,.037,0x465d62);knocker.rotation.z=.13;
  cyl(rear,2.44,5.255,-5.63,.070,.065,.08,0x7f948d,12).rotation.x=Math.PI/2;
  const ring=torus(rear,3.1,8.86,-7.52,2.53,.065,0xb28c3c);ring.rotation.x=Math.PI/2;
  for(let i=0;i<18;i++){const a=i*Math.PI*2/18,bracket=group(rear,3.1+Math.sin(a)*2.42,8.65,-7.52+Math.cos(a)*2.42);bracket.rotation.y=a;box(bracket,0,0,0,.22,.26,.17,kit.stone(0xb48b36));}
  // The small right tower has a tiled blue cone, not another village roof.
  const blue=group(rear,8.70,3.78,-5.30);blue.name='Blue tiled cone turret';
  cyl(blue,0,1.21,0,.87,.94,2.42,kit.stone(0xb8b8a7),32);
  castleStoneCourses(blue,kit,{height:2.40,rows:5,bottom:.945,top:.875,blockWidth:.61,palette:[0xbdbaa8,0xc9c2ae,0xb2b6a8]});
  cyl(blue,0,2.40,0,1.03,.91,.18,kit.stone(0x9aa49d),32);
  cone(blue,0,3.38,0,1.18,1.94,0x326caa,32);
  for(let course=0;course<6;course++){
    const yy=2.54+course*.27,r=1.12*(1-course*.142),rim=torus(blue,0,yy,0,r,.022,0x204e84);rim.rotation.x=Math.PI/2;
    for(let seam=0;seam<8;seam++){
      const a=(seam+(course%2)*.5)*Math.PI/4;beam(blue,[Math.sin(a)*r,yy,Math.cos(a)*r],[Math.sin(a)*(r-.158),yy+.265,Math.cos(a)*(r-.158)],.009,0x255786);
    }
  }
  arch(blue,0,.66,.921,.36,.87,.025,0x66716b);arch(blue,0,.72,.955,.23,.74,.02,0x314a51);
  return rear;
}
