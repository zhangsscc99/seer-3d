import * as THREE from 'three';
import {group, box, ellipsoid, cyl, mat} from '../scene-kit.js';

// The only photograph on this model is the small MOLE BEAN sign itself.
// The vending-machine shell, openings, gold fitting, grass and fence are geometry.
const SIGN_IMAGE = 'data:image/png;base64,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';
const SIGN_OUTLINE = [[324,162],[338,155],[353,151],[368,148],[369,145],[371,143],[374,144],[378,147],[383,154],[387,148],[390,144],[395,140],[398,141],[400,145],[400,151],[407,151],[412,153],[414,156],[412,161],[408,166],[404,172],[398,196],[337,200]];
const ORIGIN = {x: -3.76, z: -2.35};
const P = {
  shell: 0x91b450, wing: 0x78a345, darkGreen: 0x486b30,
  greenEdge: 0x628b38, greenLight: 0xb2c966, panel: 0xd2bf60,
  grass: 0x9acb56, stone: 0xc0c4af, stoneTop: 0xe0dfcc,
  fence: 0xe5e6d6, fenceShade: 0xc8ceba, dark: 0x282720,
  gold: 0xecc72b, goldShade: 0x98741e,
};
let signTexture;

function mesh(parent, geometry, color, name) {
  // main.batch merges meshes by shared material. Box / extruded meshes carry
  // UVs, so our curved boards must expose the same vertex attribute set even
  // when their material has no texture.
  if (!geometry.getAttribute('uv')) {
    geometry.computeBoundingBox();
    const positions=geometry.getAttribute('position'),bounds=geometry.boundingBox;
    const width=Math.max(.001,bounds.max.x-bounds.min.x),height=Math.max(.001,bounds.max.y-bounds.min.y);
    const uv=new Float32Array(positions.count*2);
    for(let i=0;i<positions.count;i++) {
      uv[i*2]=(positions.getX(i)-bounds.min.x)/width;
      uv[i*2+1]=(positions.getY(i)-bounds.min.y)/height;
    }
    geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  }
  const object = new THREE.Mesh(geometry, color?.isMaterial ? color : mat(color));
  object.castShadow = true;
  object.receiveShadow = true;
  if (name) object.name = name;
  parent.add(object);
  return object;
}
function polygon(points) {
  const shape = new THREE.Shape();
  points.forEach(([x,y], i) => i ? shape.lineTo(x,y) : shape.moveTo(x,y));
  shape.closePath();
  return shape;
}
function roundedRect(x,y,width,height,r=.04) {
  const s = new THREE.Shape();
  s.moveTo(x+r,y); s.lineTo(x+width-r,y);
  s.quadraticCurveTo(x+width,y,x+width,y+r);
  s.lineTo(x+width,y+height-r);
  s.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
  s.lineTo(x+r,y+height); s.quadraticCurveTo(x,y+height,x,y+height-r);
  s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y);
  return s;
}
function extrude(parent, shape, depth, color, name, bevel=.012) {
  return mesh(parent, new THREE.ExtrudeGeometry(shape, {
    depth, curveSegments: 24, bevelEnabled: bevel > 0,
    bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2,
  }), color, name);
}
function line(parent, points, radius, color, name) {
  return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), Math.max(32, points.length*6), radius, 8, false), color, name);
}
function groundPrism(parent, points, y, height, color, name) {
  const object = extrude(parent, polygon(points.map(([x,z]) => [x,-z])), height, color, name, 0);
  object.rotation.x = -Math.PI/2;
  object.position.y = y;
  return object;
}

// Rectangular cross sections follow the same continuous curve as the curb.
// This avoids the straight rail segments and round handrails of the old model.
function curvedBoard(parent, points, bottom, height, depth, color, name) {
  const vertices = [], indices = [];
  for (let i=0;i<points.length;i++) {
    const p=points[i], a=points[Math.max(0,i-1)], b=points[Math.min(points.length-1,i+1)];
    const length=Math.hypot(b.x-a.x,b.z-a.z), nx=-(b.z-a.z)/length*depth/2, nz=(b.x-a.x)/length*depth/2;
    vertices.push(p.x-nx,bottom,p.z-nz, p.x+nx,bottom,p.z+nz,
      p.x+nx,bottom+height,p.z+nz, p.x-nx,bottom+height,p.z-nz);
    if (i) {
      const k=i*4, j=k-4;
      for(let edge=0;edge<4;edge++) {
        const next=(edge+1)%4;
        indices.push(j+edge,k+edge,k+next,j+edge,k+next,j+next);
      }
    }
  }
  indices.push(0,2,1,0,3,2);
  const n=(points.length-1)*4;indices.push(n,n+1,n+2,n,n+2,n+3);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return mesh(parent,geometry,color,name);
}

function createMachine(parent) {
  const body=group(parent,.10,.14,-.04);body.rotation.z=.075;
  body.name='MOLE BEAN tilted three-dimensional vending machine';
  const shell=new THREE.Shape();
  shell.moveTo(-.55,.10);shell.quadraticCurveTo(-.73,.08,-.75,.35);
  shell.lineTo(-.78,2.86);shell.bezierCurveTo(-.73,3.22,-.04,3.36,.60,3.11);
  shell.quadraticCurveTo(.87,3.02,.84,2.70);shell.lineTo(.72,.24);
  shell.quadraticCurveTo(.66,.07,.43,.07);shell.closePath();
  shell.holes.push(roundedRect(-.49,1.04,1.12,1.72,.09));
  shell.holes.push(roundedRect(-.45,.32,.99,.53,.035));
  const main=extrude(body,shell,.36,P.shell,'Green front shell with two real recessed openings',.028);main.position.z=-.17;
  // The pale yellow display sits behind the shell, rather than being printed on it.
  const display=extrude(body,roundedRect(-.515,1.015,1.17,1.77,.07),.035,P.panel,'Recessed ochre front panel');display.position.z=-.165;
  line(body,[[-.55,2.71,.207],[-.53,2.0,.207],[-.48,1.02,.207],[.52,1.02,.207],[.66,2.67,.207]],.035,P.darkGreen,'Dark lip of the recessed panel');
  box(body,.01,.58,-.23,1.01,.56,.09,P.dark).name='Deep black pickup compartment';
  box(body,.012,.315,.17,1.16,.075,.42,0x485342).name='Projecting pickup tray';
  box(body,.012,.368,.337,1.17,.057,.047,0xa4afa0);
  box(body,.48,.60,.072,.055,.48,.20,0x65725c);
  line(body,[[-.67,.27,.224],[-.71,1.21,.224],[-.75,2.54,.224]],.026,P.darkGreen);

  // Left leaf is curved through depth, with nine punched-out narrow windows.
  const wing=new THREE.Shape();
  wing.moveTo(-1.25,.35);wing.bezierCurveTo(-1.43,1.01,-1.46,2.10,-1.39,2.67);
  wing.bezierCurveTo(-1.37,2.98,-.89,3.16,-.59,3.10);
  wing.lineTo(-.55,.11);wing.quadraticCurveTo(-1.03,.11,-1.25,.35);wing.closePath();
  const panes=[];
  for(let row=0;row<3;row++) for(let col=0;col<3;col++) {
    const x=-1.29+col*.226,y=1.06+row*.615,w=.139,h=row===2?.53:.48;
    wing.holes.push(roundedRect(x,y,w,h,.015));panes.push({x,y,w,h,row,col});
  }
  const wingGeometry=new THREE.ExtrudeGeometry(wing,{depth:.12,bevelEnabled:false,curveSegments:24});
  const wingDepth=x=>-.53+(x+1.43)*.66+.10*Math.sin((x+1.43)/.90*Math.PI);
  const positions=wingGeometry.attributes.position;
  for(let i=0;i<positions.count;i++)positions.setZ(i,positions.getZ(i)+wingDepth(positions.getX(i)));
  wingGeometry.computeVertexNormals();
  mesh(body,wingGeometry,P.wing,'Bowed left leaf with nine open window frames');
  for(const {x,y,w,h,row,col} of panes) {
    const pane=box(body,x+w/2,y+h/2,wingDepth(x+w/2)+.011,w+.027,h+.028,.021,row===2?(col===1?0xb5d2cd:0x88b8b6):0xd5c668);
    pane.rotation.y=-.54;
  }
  const outline=[[-1.25,.35],[-1.36,1.15],[-1.41,2.40],[-1.34,2.81],[-1.05,3.00],[-.59,3.10]];
  line(body,outline.map(([x,y])=>[x,y,wingDepth(x)+.138]),.031,P.darkGreen,'Curving green side rim');
  line(body,[[-.58,.16,wingDepth(-.58)+.13],[-.60,1.45,wingDepth(-.60)+.13],[-.59,3.05,wingDepth(-.59)+.13]],.030,P.darkGreen);
  const keyhole=cyl(body,-.97,.57,wingDepth(-.97)+.15,.071,.071,.018,0xa8b68a,20);keyhole.rotation.x=Math.PI/2;
  ellipsoid(body,-.97,.585,wingDepth(-.97)+.166,.025,.038,.012,0x374839);
  box(body,-.97,.544,wingDepth(-.97)+.172,.023,.045,.012,0x374839);

  // Sculpted gold bean/boot fitting on the right side of the recessed panel.
  const fitting=group(body,.58,1.28,.25);fitting.rotation.z=-.12;
  const shoe=new THREE.Shape();
  shoe.moveTo(-.18,-.25);shoe.bezierCurveTo(-.34,-.25,-.45,-.14,-.37,-.02);
  shoe.bezierCurveTo(-.34,.04,-.24,.07,-.18,.10);shoe.lineTo(-.14,.31);
  shoe.bezierCurveTo(-.10,.49,.22,.46,.29,.31);shoe.bezierCurveTo(.32,.18,.25,.10,.12,.035);
  shoe.bezierCurveTo(.20,-.075,.13,-.23,-.02,-.27);shoe.closePath();
  const edge=extrude(fitting,shoe,.17,P.goldShade,'Gold fitting dark carved border',.033);edge.position.z=.02;
  const gold=extrude(fitting,shoe,.14,P.gold,'Sculpted gold bean fitting',.035);gold.scale.set(.93,.93,1);gold.position.set(-.006,.006,.081);
  line(fitting,[[-.23,-.07,.269],[-.09,.015,.272],[.10,.03,.263]],.022,0xb08c20,'Gold fitting fold');
  ellipsoid(fitting,-.08,.27,.263,.065,.112,.018,0xffec80).rotation.z=-.2;
  ellipsoid(fitting,-.17,-.10,.275,.11,.045,.014,0xffe669);
  const arrow=group(body,-.53,.96,.265);arrow.rotation.z=.52;
  const arrowShape=polygon([[-.067,.15],[.067,.15],[.067,-.025],[.155,-.025],[0,-.18],[-.155,-.025],[-.067,-.025]]);
  extrude(arrow,arrowShape,.031,0xeeeeda,'Raised white pickup arrow border',.014);
  const red=extrude(arrow,arrowShape,.020,0xc44c3d,'Red downward pickup arrow',0);red.scale.set(.66,.75,1);red.position.z=.049;
  return body;
}

function createSign(parent) {
  const sign=group(parent,.17,3.13,.30);sign.name='Source-shaped MOLE BEAN sign with thick edge';
  const w=2.62,h=w*69/96;
  const outline=SIGN_OUTLINE.map(([x,y])=>[((x-322)/96-.5)*w,(.5-(y-135)/69)*h]);
  extrude(sign,polygon(outline),.145,0xa3823d,'Solid shaped sign backing',.012);
  if(!signTexture){signTexture=new THREE.TextureLoader().load(SIGN_IMAGE);signTexture.colorSpace=THREE.SRGBColorSpace;signTexture.anisotropy=4;}
  const face=mesh(sign,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:signTexture,transparent:true,alphaTest:.06,side:THREE.DoubleSide}),'Original lettering on the small sign only');
  face.position.z=.170;face.castShadow=false;
  return sign;
}

export function createStreetBeanCourt(parent) {
  const root=group(parent,ORIGIN.x,0,ORIGIN.z);root.name='MOLE BEAN vending machine and curved white forecourt';
  const court=group(root);court.name='Continuous curved grass terrace and pale stone curb';
  const controls=[[-2.17,.23],[-1.53,.91],[-.62,1.27],[.45,1.31],[1.34,.98],[1.89,.38]];
  const curve=new THREE.CatmullRomCurve3(controls.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
  const path=curve.getPoints(112);
  const grassOutline=[...path.map(p=>[p.x,p.z]),[1.89,-.88],[-1.98,-1.02],[-2.39,-.21]];
  groundPrism(court,grassOutline,.018,.115,0x879e53,'Low solid grass terrace');
  groundPrism(court,grassOutline,.135,.015,P.grass,'Grass terrace extending toward the gift-shop bell');
  curvedBoard(court,path,.03,.15,.17,P.stone,'Unbroken curved pale stone base');
  curvedBoard(court,path,.17,.046,.18,P.stoneTop,'Continuous curved stone top');
  // Masonry joints are small geometry laid onto the side of the one-piece base.
  for(let i=0;i<=29;i++){
    const t=i/29,p=curve.getPoint(t),v=curve.getTangent(t),yaw=-Math.atan2(v.z,v.x);
    const seam=box(court,p.x,.11,p.z,.013,.145,.179,0xa5af9d);seam.rotation.y=yaw;
  }
  const rails=group(court);rails.name='Two curved flat horizontal fence boards';
  curvedBoard(rails,path,.385,.061,.061,P.fenceShade,'Lower continuous curved flat rail');
  curvedBoard(rails,path,.615,.067,.068,P.fence,'Upper continuous curved flat rail');
  const postPositions=[];
  for(const t of [0,.17,.37,.58,.79,1]) {
    const p=curve.getPoint(t),v=curve.getTangent(t),post=group(court,p.x,.19,p.z);
    post.rotation.y=-Math.atan2(v.z,v.x);post.name='Thin pointed white fence picket';
    const picket=polygon([[-.068,0],[.068,0],[.068,.61],[0,.79],[-.068,.61]]);
    extrude(post,picket,.063,P.fence,'Flat spear-point picket',.004).position.z=-.0315;
    box(post,-.040,.31,.039,.012,.58,.008,0xc6ccb9);
    for(const y of [.425,.655])ellipsoid(post,0,y-.19,.041,.012,.014,.005,0xa4af9c);
    postPositions.push([ORIGIN.x+p.x,ORIGIN.z+p.z]);
  }
  const machine=createMachine(root), sign=createSign(root);
  // Collision data use the caller's pre-pivot coordinates. The scene integrator
  // transforms these together with DRESS around (.05,-4.4), yaw .08.
  const colliders=[
    {x:ORIGIN.x+.05,z:ORIGIN.z+.12,rx:.79,rz:.50,kind:'ellipse',height:3.55},
    {x:ORIGIN.x-.93,z:ORIGIN.z-.13,rx:.52,rz:.42,kind:'ellipse',height:3.45},
  ];
  const length=curve.getLength(),segments=Math.ceil(length/.22);
  for(let i=0;i<=segments;i++){
    const p=curve.getPointAt(i/segments);
    colliders.push({x:ORIGIN.x+p.x,z:ORIGIN.z+p.z,rx:.086,rz:.086,kind:'ellipse',height:.98});
  }
  root.updateMatrixWorld(true);
  const aabb=new THREE.Box3().setFromObject(root);
  const bounds={minX:aabb.min.x,maxX:aabb.max.x,minY:aabb.min.y,maxY:aabb.max.y,minZ:aabb.min.z,maxZ:aabb.max.z};
  const railPath=path.map(p=>[ORIGIN.x+p.x,ORIGIN.z+p.z]);
  root.userData.reference={file:'street.jpg',region:[291,130,424,291],type:'vending machine with bowed side leaf and curved picket forecourt'};
  return {root,machine,sign,court,colliders,bounds,railPath,postPositions,
    placement:{center:[ORIGIN.x,ORIGIN.z],dressPivot:[.05,-4.4],dressYaw:.08},
    terrain:{top:.15,curbTop:.216,outline:grassOutline.map(([x,z])=>[ORIGIN.x+x,ORIGIN.z+z])},
    geometry:{railCount:2,pointedPostCount:6,sideWindowCount:9,curveLength:length},
  };
}

// The mobile scene owns these reusable resources only until it is left.
export function clearBeanCaches(release){
 if(signTexture)release(signTexture);signTexture=undefined;
}
