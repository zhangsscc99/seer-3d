import * as THREE from 'three';

// Only the outside of the open-front room. All resources belong to this visit.
export function addGameHutExterior({root,vertices,uvs,indices,nx,ny,barkMap,floorMap,material}) {
  const exterior=new THREE.Group();exterior.name='树洞外壳与交织树根';root.add(exterior);
  const outsideBark=material(0xffffff,{map:barkMap,bumpMap:barkMap,bumpScale:.10,roughness:.98});
  const rootBark=material(0xe1c99c,{map:barkMap,bumpMap:barkMap,bumpScale:.12,roughness:1});
  const edgeWood=material(0xb38c51,{roughness:1});
  const dirt=material(0xd3be92,{map:floorMap,roughness:1});
  const moss=material(0x63723c,{roughness:1});
  const surface=(a,y,offset=0)=>{
    const wobble=.18*Math.sin(a*7+y*.38)+.095*Math.sin(y*1.1+a*12);
    return new THREE.Vector3(Math.sin(a)*(9.45+wobble+offset),y,-Math.cos(a)*(7.35+wobble+offset));
  };
  const thickness=(a,y)=>.68+.09*Math.sin(a*11+y*.17)+.05*Math.sin(a*23-y*.21)
    +.13*Math.pow(.5+.5*Math.sin(a*18+Math.sin(y*.28)*.8),3);
  function bucket(){return {positions:[],uvs:[],indices:[]};}
  function finish(data,paint,name){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(data.uvs,2));
    geometry.setIndex(data.indices);geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,paint);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;exterior.add(mesh);return mesh;
  }
  // Use the inner wall's exact topology: its arch becomes a through-hole, and
  // only boundary edges are joined. Nothing spans the open room as a roof.
  const shell=bucket();shell.uvs.push(...uvs);
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const a=-1.83+i/nx*3.66,y=j/ny*9.5,p=surface(a,y,thickness(a,y));shell.positions.push(p.x,p.y,p.z);
  }
  const edges=new Map();
  for(let i=0;i<indices.length;i+=3){
    const a=indices[i],b=indices[i+1],c=indices[i+2];shell.indices.push(a,c,b);
    for(const [from,to] of [[a,b],[b,c],[c,a]]){
      const key=Math.min(from,to)+':'+Math.max(from,to);
      if(edges.has(key))edges.delete(key);else edges.set(key,[from,to]);
    }
  }
  finish(shell,outsideBark,'起伏树皮外壳');
  const cutEdges=bucket();
  for(const [a,b] of edges.values()){
    const k=cutEdges.positions.length/3;
    for(const [array,index] of [[vertices,a],[vertices,b],[shell.positions,b],[shell.positions,a]])cutEdges.positions.push(array[index*3],array[index*3+1],array[index*3+2]);
    cutEdges.uvs.push(0,0,1,0,1,1,0,1);
    cutEdges.indices.push(k,k+2,k+1,k,k+3,k+2);
  }
  finish(cutEdges,edgeWood,'有厚度的切口、顶缘与门洞侧壁');

  // A tube with changing radius and a slightly lobed cross-section produces
  // buttress roots and fine forks in one shared geometry, instead of pipes.
  function rootTube(data,controls,radii,segments=28,sides=9,seed=0){
    const curve=new THREE.CatmullRomCurve3(controls.map(p=>p.isVector3?p:new THREE.Vector3(...p)));
    const frames=curve.computeFrenetFrames(segments,false),start=data.positions.length/3;
    for(let i=0;i<=segments;i++){
      const t=i/segments,p=curve.getPointAt(t),q=t*(radii.length-1),k=Math.min(radii.length-2,Math.floor(q)),mix=q-k;
      const r=radii[k]+(radii[k+1]-radii[k])*mix;
      for(let j=0;j<=sides;j++){
        const a=j/sides*Math.PI*2,rr=r*(1+.095*Math.sin(a*3+t*8+seed)+.045*Math.sin(a*5-t*7));
        const v=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*rr).addScaledVector(frames.binormals[i],Math.sin(a)*rr);
        data.positions.push(v.x,v.y,v.z);data.uvs.push(.20+(Math.abs(seed)%5)*.013+j/sides*.09,1-t);
        if(i<segments&&j<sides){const v=start+i*(sides+1)+j;data.indices.push(v,v+1,v+sides+1,v+1,v+sides+2,v+sides+1);}
      }
    }
    // Tiny capped tips keep the geometry closed when a fork is seen from below.
    for(const [ring,reverse] of [[0,true],[segments,false]]){
      const center=data.positions.length/3,p=curve.getPointAt(ring/segments);data.positions.push(p.x,p.y,p.z);data.uvs.push(.5,ring/segments);
      for(let j=0;j<sides;j++){const v=start+ring*(sides+1)+j;if(reverse)data.indices.push(center,v+1,v);else data.indices.push(center,v,v+1);}
    }
  }
  const roots=bucket(),barkRidges=bucket(),mossPatches=bucket();
  // The wide .60–1.06 radian sector beside the exit remains free below y=3.25.
  const rootAngles=[-1.64,-1.33,-1.01,-.68,-.34,.05,.39,1.25,1.59];
  rootAngles.forEach((a,i)=>{
    const sign=i%2?1:-1,size=.95+(i%3)*.12,height=6.5+(i%4)*.68;
    const controls=[surface(a+sign*.065,height,.72),surface(a-sign*.035,height*.68,.82),
      surface(a+sign*.025,2.30,1.07),surface(a,.66,1.65),surface(a+sign*.052,.26,2.53),surface(a+sign*.095,.075,3.48)];
    rootTube(roots,controls,[.035,.20*size,.49*size,.72*size,.48*size,.015],36,9,i);
    // Two unequal forks join the swelling root and spread along the soil.
    for(const side of [-1,1]){
      const forkAngle=a+sign*.046,spread=side*(i===0&&side<0?.065:.10+(i%2)*.025);
      const fork=[surface(forkAngle,.45,2.03),surface(forkAngle+spread*.42,.28,2.61),
        surface(forkAngle+spread,.16,3.31),surface(forkAngle+spread*1.36,.055,3.88+(i%2)*.22)];
      rootTube(roots,fork,[.27*size,.25*size,.13,.009],22,7,i+side);
      const twig=[fork[2],surface(forkAngle+spread*1.30,.105,3.34),surface(forkAngle+spread*1.69,.052,3.82)];
      rootTube(roots,twig,[.082,.045,.005],13,6,i);
    }
  });
  // Broad oblique roots cross at different depths, then melt into the ground.
  const windingRoots=[
    [[-1.42,7.50,.74],[-1.26,5.80,.92],[-.94,4.80,1.12],[-.84,2.60,1.40],[-.56,.90,1.70],[-.45,.065,3.55]],
    [[.38,7.30,.74],[.29,5.40,.95],[-.06,3.75,1.34],[-.24,2.65,1.45],[-.09,.36,2.12],[.12,.055,3.58]],
    [[-1.32,.065,3.56],[-1.01,.84,1.78],[-.80,2.70,1.42],[-.51,4.21,1.23],[-.62,5.90,.83],[-.46,8.10,.74]],
    [[1.74,5.82,.76],[1.51,4.0,1.07],[1.28,2.05,1.24],[1.35,.45,2.15],[1.50,.075,3.57]],
  ];
  windingRoots.forEach((points,i)=>rootTube(roots,points.map(p=>surface(...p)),i===2?[.015,.34,.44,.39,.22,.02]:[.02,.35,.53,.42,.21,.012],42,9,12+i));
  finish(roots,rootBark,'盘绕交织、粗细渐变的大树根与贴地分叉');

  // Narrow raised ribs continue the same flowing vertical wood grain; their
  // lower endpoints stop above the door or merge into the exterior buttresses.
  for(let i=0;i<25;i++){
    const a=-1.73+i/24*3.46,bottom=a>.57&&a<1.09?3.58:.60;
    const points=[];for(let j=0;j<6;j++){
      const y=bottom+j/5*(9.47-bottom),angle=a+.025*Math.sin(y*.72+i*.90);
      points.push(surface(angle,y,thickness(angle,y)+.025));
    }
    rootTube(barkRidges,points,[.020,.075+(i%3)*.026,.105+(i%2)*.06,.077,.040,.012],22,6,i);
  }
  // Thin growth lines read as end grain on the exposed annular top, not a lid.
  for(const fraction of [.23,.55,.82]){
    const points=[];for(let i=0;i<=70;i++){const a=-1.83+i/70*3.66;points.push(surface(a,9.514,thickness(a,9.5)*fraction));}
    rootTube(barkRidges,points,[.012,.015,.014,.012],80,5,fraction);
  }
  // A few oval bark knots are real protrusions on the outside of the shell.
  for(const [a,y,r] of [[-1.44,5.10,.30],[-.83,6.88,.28],[-.14,4.60,.35],[.27,7.55,.24],[1.36,5.8,.29]]){
    const points=[];for(let i=0;i<=32;i++){
      const t=i/32*Math.PI*2,angle=a+Math.sin(t)*r/10,yy=y+Math.cos(t)*r*2.1;
      points.push(surface(angle,yy,thickness(angle,yy)+.07));
    }
    rootTube(barkRidges,points,[.05,.075,.067,.05],32,7,y);
  }
  finish(barkRidges,outsideBark,'纵向立体树皮脊与外侧树瘤');

  // Low earth extends only around the exterior arc and supports every root tip.
  const soil=bucket(),soilSteps=90;
  for(let i=0;i<=soilSteps;i++){
    const a=-1.83+i/soilSteps*3.66,reach=4.68+.16*Math.sin(a*9)+.13*Math.sin(a*17);
    for(const [offset,y] of [[.22,-.035],[reach,-.09]]){
      const p=surface(a,y,offset);soil.positions.push(p.x,p.y,p.z);soil.uvs.push(p.x/22+.5,p.z/19+.5);
    }
    if(i<soilSteps){const k=i*2;soil.indices.push(k,k+2,k+1,k+1,k+2,k+3);}
  }
  finish(soil,dirt,'仅树屋外侧的起伏泥地').castShadow=false;
  // Sparse short moss strips follow the shaded roots, leaving warm wood dominant.
  for(const [a,reach] of [[-1.52,1.55],[-1.1,1.76],[-.55,1.62],[-.19,2.10],[.19,1.66],[1.36,1.69]]){
    for(let k=0;k<3;k++){
      const points=[surface(a-.021+k*.024,.13,reach+.18*k),surface(a+.028+k*.02,.18,reach+.21+.18*k),surface(a+.065+k*.02,.10,reach+.38+.18*k)];
      rootTube(mossPatches,points,[.010,.070-k*.012,.006],12,6,k);
    }
  }
  finish(mossPatches,moss,'树根阴面少量苔藓');
  exterior.userData={outerWall:true,openFront:true,exitClearSector:[.60,1.06],maximumHeight:9.53};
  return exterior;
}
