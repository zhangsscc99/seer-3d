import * as THREE from 'three';
import {group,ellipsoid,flat,mat} from './scene-kit.js';

// The painted locations end in a low landscape silhouette. A huge grass plane
// behind them projects green into the whole upper frame from the reference view.
export function referenceLandscape(root,{ground=0x91c954,seed=1,snowX=3,church=false}={}){
 const street=seed===39;
 const boundary=[];
 for(let i=0;i<=48;i++){const x=-96+i*4;boundary.push([x,(church?-12.8:-18.5)+Math.sin(x*.075+seed)*1.2]);}
 flat(root,[...boundary,[96,100],[-96,100]],ground,-.071);
 const vertices=[],colors=[],indices=[],N=96;
 const palette=street?[0x61946b,0x7cac77,0x9dc28a]:church?[0x7aab78,0x8bbb78,0xa6cb7d]:[0x81b773,0x9ac877,0xb4d78b];
 // Three joined slopes, rather than overlapping spherical hill blobs.
 for(let row=0;row<4;row++)for(let i=0;i<=N;i++){
  const x=-96+i*2,crest=street?.35+.22*Math.sin(x*.11):(church?1.6:2.6)+(church?.7:1.3)*Math.sin(x*.12+.9)+(church?.8:1.6)*Math.cos(x*.061+seed);
  const z=(church?[-11.8,-14.5,-18,-20.5]:[-17.5,-22,-28,-33])[row]+Math.sin(x*.077+seed)*1.4;
  const y=row===0?-.07:row===1?Math.max(.4,crest*.62):row===2?Math.max(.8,crest):-.3;
  vertices.push(x,y,z);const c=new THREE.Color(palette[Math.min(row,2)]);colors.push(c.r,c.g,c.b);
  if(row&&i){const a=(row-1)*(N+1)+i-1,b=row*(N+1)+i-1;indices.push(a,b,a+1,a+1,b,b+1);}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const hills=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));hills.name='低矮起伏远山';root.add(hills);
 // A broken snow ridge has its own silhouette; the sky remains visible around it.
 const mountain=group(root,snowX,0,church?-22:-38);mountain.name='远方雪山';mountain.scale.setScalar(church?.29:.62);
 const p=[[-7,0,0],[-3.8,5,-1],[-1.2,8,-2],[.2,12,-1],[1.8,8.1,-.3],[4.8,4.4,1],[8,0,2],[.5,0,4]];
 const faces=[[0,1,7],[1,2,7],[2,3,7],[3,4,7],[4,5,7],[5,6,7]];
 const positions=[],vc=[];faces.forEach((f,i)=>{for(const n of f){positions.push(...p[n]);const c=new THREE.Color([0x9dbbbd,0xb9d0cd,0xd9e8df,0xb0cccc,0x96b8b8,0xa9c3bb][i]);vc.push(c.r,c.g,c.b);}});
 const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));mg.setAttribute('color',new THREE.Float32BufferAttribute(vc,3));mg.computeVertexNormals();mountain.add(new THREE.Mesh(mg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide})));
 const snow=new THREE.BufferGeometry();snow.setAttribute('position',new THREE.Float32BufferAttribute([.2,12,-1,-1.9,7,-.9,-.35,7.9,.2, .2,12,-1,-.35,7.9,.2,1.2,6.9,1.2, .2,12,-1,1.2,6.9,1.2,1.8,8.1,-.3],3));snow.computeVertexNormals();mountain.add(new THREE.Mesh(snow,new THREE.MeshBasicMaterial({color:0xeaf6ec,side:THREE.DoubleSide})));
 if(street){
  mountain.removeFromParent();
  facetedPeak(root,-24,-26,8,3.9,[0x518a6b,0x669c77,0x75a67b]);
  facetedPeak(root,-10,-31,10,3.5,[0x78899f,0x8d96ad,0x83939c]);
  facetedPeak(root,2,-31,9,3.8,[0x3d7e59,0x5b9367,0x73a078]);
  facetedPeak(root,12,-28,7,4.4,[0xa8a894,0xd0cbb3,0x969c90],true);
  facetedPeak(root,28,-28,8,3.2,[0x659978,0x79aa84,0x518766]);
 }
 addClouds(root,{church,street});
 return root;
}
export function addClouds(root,{church=false,street=false}={}){
 const material=new THREE.MeshBasicMaterial({color:0xfafff5,fog:false});
 const layouts=street?[[-23.1,1.05,-36,.9],[22.64,.54,-36,.65]]:church?[[-25,1.2,-21,.85],[-7,1.8,-23,.65],[16,1.0,-21,.85],[29,1.4,-24,1.0]]:[[-34,2.4,-35,1.15],[-14,3,-39,.9],[17,2.6,-36,1.1],[42,2,-39,1.2]];
 for(const [x,y,z,s] of layouts){
  const cloud=group(root,x,y,z);cloud.name='白云';cloud.scale.set(s,street?s*.42:s,s);
  for(let n=0;n<8;n++){
   const h=[.72,1.05,1.7,2.1,1.4,1.5,1.03,.65][n];
   const m=ellipsoid(cloud,(n-3.5)*1.1,h*.36,0,1.25,h,.65,material);m.castShadow=m.receiveShadow=false;
  }
 }
}

function facetedPeak(root,x,z,r,h,palette,volcano=false){
 const positions=[],colors=[];
 const N=9,rings=volcano?[[1,0],[.73,.32],[.22,.91],[.18,1]]:[[1,0],[.64,.42],[.08,1]];
 for(let row=0;row<rings.length-1;row++)for(let n=0;n<N;n++){
  const point=(rr,ii)=>{const k=ii%N,a=k/N*Math.PI*2,rad=r*rings[rr][0]*(1+.16*Math.sin(k*2.71+rr));return [x+Math.cos(a)*rad,h*rings[rr][1]+(rr?Math.sin(k*2.8)*h*.06:0),z+Math.sin(a)*rad*.48];};
  const v=[point(row,n),point(row,n+1),point(row+1,n+1),point(row+1,n)];
  for(const i of [0,1,2,0,2,3]){positions.push(...v[i]);const c=new THREE.Color(volcano&&row===rings.length-2?[0xb58f79,0xc69879,0xa88370][n%3]:palette[n%3]);colors.push(c.r,c.g,c.b);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
 const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));m.name=volcano?'远景浅色火山':'远景多面山脉';root.add(m);
}
