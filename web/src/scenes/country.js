import * as THREE from 'three';
import {addFarmhouseDetails} from './farmhouse-details.js';
import {createFarmDistance} from './farm-distance.js';
import {
  group, box, ellipsoid, cyl, cone, torus, beam, arch, label, roof, flat,
  disk, tree, bush, flowers, fence, ram, makeBase, mat, stroke,
} from '../scene-kit.js';

// The three countryside sets share the warm ink, crooked timber and broad
// colour shapes of the supplied Flash-era reference screens.
const C = {
  grass: 0x96d65a, grassLight: 0xafe071, grassDark: 0x82bd50,
  wood: 0xa36932, woodLight: 0xd4a457, woodDark: 0x70502f,
  cream: 0xf6edb7, gold: 0xeeb23b, red: 0xbb5140,
  stone: 0x8c9593, stoneLight: 0xcbd1b7, ink: 0x66503b,
  blue: 0x338ed0, blueDark: 0x296d99, white: 0xfff8dd,
};
const FARMHOUSE = { x: 7.4, z: -9.5, yaw: -.43, sx: 1.36, sy: 1.06, sz: 1.59 };
const FARM_GARDEN = { x: 1.9, z: -.95 };
const WINDMILL = { x: 5.3, z: -6.7, yaw: -.31 };

const textureLoader = new THREE.TextureLoader();
const decalMaterials = new Map();
function decal(p, url, x, y, z, w, h) {
  if (!decalMaterials.has(url)) {
    const map = textureLoader.load(url);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    decalMaterials.set(url, new THREE.MeshStandardMaterial({ map, transparent: true, alphaTest: 0.08, roughness: 0.92, side: THREE.DoubleSide }));
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), decalMaterials.get(url));
  m.position.set(x, y, z); p.add(m);
  return m;
}

function localXZ(x, z, tx, tz, yaw, zScale = 1) {
  const dx = x - tx, dz = z - tz;
  return [Math.cos(yaw) * dx - Math.sin(yaw) * dz, (Math.sin(yaw) * dx + Math.cos(yaw) * dz) / zScale];
}

const RAM_TREE_X=-12.2;
const RAM_TERRACE = [[-8.0, -24], [28, -24], [28, .15], [23.4, -.08], [18.3, -.33], [15.7,.16], [13.0, 0.35], [11.2, -0.12], [10.9, -1.12], [10.9, -2.12], [4.85, -2.12], [4.85, -0.65], [3.0, -0.85], [2.15, -1.05], [2.15, -2.6], [-3.7, -2.6], [-5.4, -3.3], [-5.4, -11.7]];
function insidePolygon(x, z, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

function ramElevation(x, z) {
  const dx = x - RAM_TREE_X, dz = z + 5.5, r = Math.hypot(dx, dz), a = Math.atan2(dz, dx);
  if (r > 3.14 && r < 4.45 && a > -1.64 && a < 0.88) {
    return Math.max(0.05, Math.min(6.86, 0.31 + Math.floor((0.8 - a) / (2.36 / 23)) * 0.283));
  }
  if (r > 1.58 && r <= 3.23) return 6.85;
  if (x > 0.24 && x < 2.06 && z > -2.9 && z < 0.3) return Math.max(0.05, Math.min(1.9, Math.ceil((0.29 - z) / 0.38) * 0.23 + 0.05));
  return insidePolygon(x, z, RAM_TERRACE) ? 1.9 : 0.05;
}

function schoolTerrace(root) {
  const s = new THREE.Shape(); RAM_TERRACE.forEach(([x, z], i) => i ? s.lineTo(x, -z) : s.moveTo(x, -z)); s.closePath();
  const slab = geometry(root, new THREE.ExtrudeGeometry(s, { depth: 1.85, bevelEnabled: false }), 0xb68a4b); slab.rotation.x = -Math.PI / 2;
  flat(root, RAM_TERRACE, 0x94cc50, 1.855);
  const r = rng(709);
  for (let i = 2; i < RAM_TERRACE.length; i++) {
    const a = RAM_TERRACE[i], b = RAM_TERRACE[(i + 1) % RAM_TERRACE.length];
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.65);
    for (let j = 0; j < n; j++) {
      const t = (j + 0.5) / n, xx = a[0] + (b[0] - a[0]) * t, zz = a[1] + (b[1] - a[1]) * t;
      const rock = fieldStone(root, xx, 0.83, zz, 0.84, 1.77 + r() * 0.16, 0.13, [0xc19953, 0xd3ac67, 0xa67d43][j % 3],i*42+j);
      rock.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
      const fringe=new THREE.Shape();
      [[-.43,0],[-.43,.19],[-.28,.13],[-.2,.31],[-.09,.19],[.08,.36],[.14,.17],[.29,.28],[.42,.13],[.43,0]].forEach(([x,y],k)=>k?fringe.lineTo(x,y):fringe.moveTo(x,y));fringe.closePath();
      const tuft=geometry(root,new THREE.ExtrudeGeometry(fringe,{depth:.13,bevelEnabled:false}),j%2?0x88c247:0x9dd258,xx,1.66,zz);
      tuft.rotation.y=rock.rotation.y;
    }
  }
  for (let i = 0; i < 8; i++) {
    box(root, 1.15, (i + 0.5) * 0.23, 0.1 - i * 0.38, 1.78, 0.23, 0.42, i % 2 ? 0xb79c62 : 0xcdb274);
    box(root, 1.15, (i + 1) * 0.23 + 0.015, 0.1 - i * 0.38, 1.75, 0.03, 0.29, 0x95bd59);
  }
  flowers(root, { x: 12.9, z: -4.2, w: 4, d: 7 }, 40, 44).position.y = 1.855;
  flowers(root, { x: 0.6, z: -5.9, w: 4.8, d: 4.7 }, 30, 82).position.y = 1.855;
}

function bentPlank(p, x, y, z, w, h, d, color, lean = 0) {
  const geo = new THREE.BoxGeometry(w, h, d, 1, 5, 1);
  const a = geo.attributes.position;
  for (let i = 0; i < a.count; i++) {
    const yy = a.getY(i), t = yy / h + 0.5;
    a.setX(i, a.getX(i) + Math.sin(t * Math.PI) * lean);
  }
  geo.computeVertexNormals();
  return geometry(p, geo, color, x, y, z);
}

function sideWindow(p, x, y, z, yaw, radius = 0.6) {
  const w = group(p, x, y, z); w.rotation.y = yaw;
  windowRound(w, 0, 0, 0.08, radius);
  for (const s of [-1, 1]) {
    const shutter = group(w, s * radius * 1.55, 0, 0.14); shutter.rotation.y = s * 0.32;
    box(shutter, 0, 0, 0, radius * 0.69, radius * 1.98, 0.15, C.woodLight);
    for (let j = 0; j < 4; j++) box(shutter, 0, -radius * 0.72 + j * radius * 0.48, 0.095, radius * 0.65, 0.075, 0.045, C.woodDark);
  }
  box(w, 0, -radius * 1.1, 0.16, radius * 2.7, 0.14, 0.56, C.wood);
  return w;
}

function clothRoof(p, y, w, h, d) {
  const zSegments = 5;
  for (const sign of [-1, 1]) for (let i = 0; i < zSegments; i++) {
    const zz = -d / 2 + i * d / zSegments, hh = h + Math.sin(i * 1.5) * 0.07;
    const s = new THREE.Shape();
    s.moveTo(0, hh); s.quadraticCurveTo(sign * w * 0.15, hh * 0.57, sign * w * 0.5, 0.08);
    s.lineTo(sign * (w * 0.5 + 0.02), -0.1); s.quadraticCurveTo(sign * w * 0.15, hh * 0.57 - 0.18, 0, hh - 0.16); s.closePath();
    geometry(p, new THREE.ExtrudeGeometry(s, { depth: d / zSegments + 0.03, bevelEnabled: true, bevelThickness: 0.055, bevelSize: 0.035, bevelSegments: 2, curveSegments: 20 }),
      [0xfff4c8, 0xf2e9b9, 0xfff2c3, 0xf7edbc, 0xfbf0c2][i], 0, y, zz);
  }
  for (let i = 0; i <= zSegments; i++) for (const sign of [-1, 1]) {
    const zz = -d / 2 + i * d / zSegments;
    curve(p, [[0, y + h + 0.13, zz], [sign * w * 0.18, y + h * 0.57 + 0.12, zz], [sign * w * 0.34, y + h * 0.24 + 0.13, zz], [sign * (w * 0.51), y + 0.07, zz]], 0.13, C.wood);
    for (let j = 1; j <= 2; j++) {
      const u = j / 3;
      const yy = h * (1 - u) * (1 - u * 0.33);
      const tie = box(p, sign * w * 0.5 * u, y + yy + 0.1, zz, 0.62, 0.12, 0.42, 0xffffd5); tie.rotation.z = -sign * 0.64;
    }
  }
  for (const sign of [-1, 1]) curve(p, [[sign * w * 0.51, y + 0.03, -d / 2 - 0.12], [sign * w * 0.52, y - 0.08, 0], [sign * w * 0.5, y + 0.05, d / 2 + 0.13]], 0.16, C.woodDark);
}

function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function geometry(parent, geo, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  stroke(m);
  return m;
}

// Unequal cut stones, shaped dirt edges and split leaves remain volumetric when
// the camera leaves the reference view. These are not image-facing cutouts.
function fieldStone(parent, x, y, z, w, h, depth, color, seed = 1) {
  const random = rng(seed), shape = new THREE.Shape();
  const points = [[-0.44,-0.36],[-0.51,0.06],[-0.28,0.45],[0.23,0.48],[0.5,0.19],[0.42,-0.4],[0,-0.49]];
  points.forEach(([u,v],i) => {
    const xx = (u + (random() - 0.5) * 0.1) * w, yy = (v + (random() - 0.5) * 0.09) * h;
    i ? shape.lineTo(xx,yy) : shape.moveTo(xx,yy);
  });
  shape.closePath();
  return geometry(parent, new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.014, bevelSegments: 1 }), color, x, y, z);
}

function groundContour(parent, points, color, y = 0.033, smooth = true) {
  if (!smooth) return flat(parent, points, color, y);
  const spline = new THREE.CatmullRomCurve3(points.map(([x,z]) => new THREE.Vector3(x,0,z)), true, 'centripetal');
  return flat(parent, spline.getPoints(points.length * 8).map(p=>[p.x,p.z]), color, y);
}

function rusticFence(parent, points, height = 1.02, seed = 1, arched = false) {
  const random = rng(seed), g = group(parent);
  for (let i = 1; i < points.length; i++) {
    const a = points[i-1], b = points[i], count = Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]) / (arched ? 1.65 : 0.67));
    for (let j = 0; j <= count; j++) {
      if (i > 1 && j === 0) continue;
      const t = j/count, x = a[0]+(b[0]-a[0])*t, z = a[1]+(b[1]-a[1])*t;
      const post = bentPlank(g,x,height*.54,z,arched?.2:.15,height*(.92+random()*.22),.19,0xae8647,(random()-.5)*.14);
      post.rotation.z=(random()-.5)*.14;
      box(g,x-.025,height*1.08,z+.1,.05,.11,.025,0xe4c180);
      if (!j) continue;
      const u=(j-1)/count, px=a[0]+(b[0]-a[0])*u, pz=a[1]+(b[1]-a[1])*u;
      for (const hh of [height*.32,height*.76]) {
        const mid=[(px+x)/2, hh+(arched?.15:random()*.055), (pz+z)/2];
        curve(g,[[px,hh,pz],mid,[x,hh,z]],arched?.085:.06,0xcfaa68);
        curve(g,[[px,hh-.035,pz+.045],[mid[0],mid[1]-.035,mid[2]+.045],[x,hh-.035,z+.045]],.022,0x896337);
      }
    }
  }
  return g;
}

function squashLeaf(parent, x, y, z, size = 1, yaw = 0) {
  const g=group(parent,x,y,z);g.rotation.y=yaw;g.rotation.x=-Math.PI*.38;
  const shape=new THREE.Shape();
  const points=[[0,-.23],[-.36,-.28],[-.31,-.05],[-.68,.12],[-.52,.24],[-.64,.62],[-.31,.5],[-.24,.83],[0,.58],[.29,.86],[.35,.51],[.7,.56],[.54,.21],[.72,.04],[.32,-.04],[.31,-.26]];
  points.forEach(([xx,yy],i)=>i?shape.lineTo(xx*size,yy*size):shape.moveTo(xx*size,yy*size));shape.closePath();
  geometry(g,new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:false}),0x397b32);
  curve(g,[[0,-.2*size,.05],[0,.13*size,.055],[.01,.61*size,.05]],.02,0x89b745);
  for(const s of [-1,1]) for(let j=0;j<2;j++) beam(g,[0,(.04+j*.23)*size,.05],[s*(.43-j*.13)*size,(.27+j*.26)*size,.05],.014,0x6fa13c);
  return g;
}

function curve(parent, points, radius, color) {
  const spline = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return geometry(parent, new THREE.TubeGeometry(spline, Math.max(12, points.length * 4), radius, 6, false), color);
}

function leaf(parent, x, y, z, scale = 1, color = 0x49a142, angle = 0) {
  const g = group(parent, x, y, z);
  g.rotation.z = angle;
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.quadraticCurveTo(-0.57 * scale, 0.68 * scale, 0, 1.44 * scale);
  s.quadraticCurveTo(0.57 * scale, 0.68 * scale, 0, 0);
  geometry(g, new THREE.ExtrudeGeometry(s, { depth: 0.09 * scale, bevelEnabled: false, curveSegments: 8 }), color);
  beam(g, [0, 0.09, 0.105 * scale], [0, 1.19 * scale, 0.105 * scale], 0.018 * scale, 0x357e33);
  return g;
}

function windowRound(p, x, y, z, radius = 0.6, glass = 0x80c2cd) {
  ellipsoid(p, x, y, z, radius, radius, 0.08, glass);
  torus(p, x, y, z + 0.07, radius, 0.09, C.woodLight);
  box(p, x, y, z + 0.14, radius * 1.85, 0.075, 0.1, C.woodDark);
  box(p, x, y, z + 0.14, 0.075, radius * 1.85, 0.1, C.woodDark);
}

function plankDoor(p, x, y, z, w, h, color = C.woodLight) {
  arch(p, x, y - 0.06, z, w + 0.33, h + 0.23, 0.2, C.woodDark);
  arch(p, x, y, z + 0.13, w, h, 0.11, color);
  for (let i = -2; i <= 2; i++) {
    const dx = i * w / 6;
    const radius = w / 2;
    const ph = h - radius + Math.sqrt(Math.max(0, radius * radius - dx * dx));
    beam(p, [x + dx, y + 0.04, z + 0.27], [x + dx, y + ph - 0.09, z + 0.27], 0.017, C.wood);
  }
  ellipsoid(p, x + w * 0.27, y + h * 0.38, z + 0.35, 0.13, 0.13, 0.11, C.gold);
}

function farmBadge(p, x, y, z, size = 1) {
  const b = group(p, x, y, z);
  ellipsoid(b, 0, 0, 0, size * 0.78, size * 0.55, 0.08, C.woodDark);
  ellipsoid(b, 0, 0, 0.08, size * 0.7, size * 0.48, 0.09, 0xf3cc73);
  ellipsoid(b, 0, -size * 0.09, 0.19, size * 0.36, size * 0.31, 0.11, 0xffe1ad);
  ellipsoid(b, -size * 0.16, 0, 0.3, size * 0.04, size * 0.07, 0.03, C.ink);
  ellipsoid(b, size * 0.16, 0, 0.3, size * 0.04, size * 0.07, 0.03, C.ink);
  ellipsoid(b, 0, -size * 0.08, 0.33, size * 0.12, size * 0.14, 0.13, 0xd63d30);
  ellipsoid(b, 0, size * 0.22, 0.17, size * 0.45, size * 0.07, size * 0.1, 0xe3a832);
  ellipsoid(b, -size * 0.03, size * 0.32, 0.15, size * 0.3, size * 0.17, size * 0.08, 0xf7ce65);
  return b;
}

function groundPatches(root, seed = 8) {
  const rand = rng(seed);
  for (let i = 0; i < 16; i++) {
    const x = (rand() - 0.5) * 29, z = (rand() - 0.5) * 21;
    const rx = 0.8 + rand() * 1.8, rz = 0.4 + rand();
    const points = Array.from({ length: 12 }, (_, n) => {
      const a = n / 12 * Math.PI * 2, r = 0.72 + rand() * 0.3;
      return [x + Math.cos(a) * rx * r, z + Math.sin(a) * rz * r];
    });
    groundContour(root, points, i % 3 ? 0xa6d567 : 0x86bc50, 0.026);
  }
}

function countryFlowers(parent,area,count,seed) {
  const g=flowers(parent,area,count,seed);
  g.children.forEach(f=>f.scale.setScalar(.7));
  return g;
}

// The original countryside has a continuous, planted horizon. Small detached
// trees on a bare plane change that composition even when the building matches.
function countryBase(options) {
  // makeBase now owns the finite reference landscape. The previous blanket
  // removal of distant groups also removed its named snow-mountain group.
  return makeBase(options);
}

function instanceShapes(root, geo, items) {
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
  const m = new THREE.InstancedMesh(geo, material, items.length), dummy = new THREE.Object3D();
  items.forEach((a, i) => {
    dummy.position.set(a.x, a.y, a.z); dummy.scale.set(a.rx, a.ry, a.rz);
    dummy.rotation.set(0, a.yaw || 0, a.lean || 0); dummy.updateMatrix();
    m.setMatrixAt(i, dummy.matrix); m.setColorAt(i, new THREE.Color(a.color));
  });
  m.instanceMatrix.needsUpdate = true; m.castShadow = m.receiveShadow = true; root.add(m);
  return m;
}

function leafyHedge(root, x1, x2, z, height = 1.8, seed = 11, y = 0) {
  const random = rng(seed), balls = [];
  for (let x = x1; x <= x2; x += 0.48) {
    const crown = height * (0.81 + random() * 0.22), rz = 0.66 + random() * 0.21;
    balls.push({ x, y: y + crown * 0.42, z, rx: 0.66, ry: crown * 0.49, rz, color: 0x438c43 });
    for (let j = 0; j < 4; j++) balls.push({ x: x + (random() - 0.5) * 0.76, y: y + crown * (0.5 + random() * 0.42), z: z + (random() - 0.5) * 0.83,
      rx: 0.25 + random() * 0.2, ry: 0.21 + random() * 0.16, rz: 0.28 + random() * 0.16,
      color: [0x76b547, 0x8bc549, 0x9acb53, 0x5da342][j] });
  }
  instanceShapes(root, new THREE.SphereGeometry(1, 10, 7), balls);
}

function pastoralHorizon(root, seed = 31, school = false, castleSpires = true) {
  const random = rng(seed);
  // The two farms have a shallow strip of fields. The school has a white
  // fence and a visible snow ridge, not a second agricultural background.
  const geo = new THREE.PlaneGeometry(108, 18, 36, 10); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, colors = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), fade = Math.max(0, (z + 9) / 18);
    const rolling = .35 + Math.sin(x * 0.079 + 0.2) * .4 + Math.cos(x * 0.16 + z * 0.055) * .3;
    pos.setY(i, Math.max(.04,rolling*(1-fade)+.18));
    const band = Math.floor((z + x * 0.04 + Math.sin(x * 0.1) * 2 + 26) / 4.2);
    const c = new THREE.Color(school ? [0x79b255, 0x86bd59, 0x9cc660][Math.abs(band) % 3] : [0xbdcd69, 0xdad777, 0xacc563, 0xe6d887, 0x91b653][Math.abs(band) % 5]);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geo.computeVertexNormals();
  const field = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  field.position.set(0, 0, -24); field.receiveShadow = false;
  if(!school) root.add(field);
  else {
    field.geometry.dispose();field.material.dispose();
    const snow=root.children.find(child=>child.name==='远方雪山');
    if(snow){snow.position.set(11.3,0,-25);snow.scale.setScalar(1.05);}
  }
  leafyHedge(root, -38, 38, -17.5, school ? 1.85 : 1.25, seed + 1);
  if (!school) {
    const crop = [];
    for (let i = 0; i < 730; i++) {
      const x = -37 + random() * 74, z = -20 - random() * 3.7, h = 0.48 + random() * 0.48;
      crop.push({ x, y: h + 0.15, z, rx: 0.1, ry: h * 0.58, rz: 0.095, lean: 0.12 + random() * 0.22, color: i % 3 ? 0xf0d783 : 0xd7c46d });
    }
    instanceShapes(root, new THREE.SphereGeometry(1, 6, 5), crop);
    root.updateMatrixWorld(true);
    const surfaceMeshes=root.children.filter(child=>child.isMesh&&!child.isInstancedMesh);
    const ray=new THREE.Raycaster();
    for (const [x, z, scale, tint] of [[-18, -26, 0.46, 0xcb6564], [-10, -29, 0.38, 0x9aada0], [19, -28, 0.42, 0xbd7555], [27, -31, 0.45, 0x789ba6]]) {
      ray.set(new THREE.Vector3(x,40,z),new THREE.Vector3(0,-1,0));
      const groundY=ray.intersectObjects(surfaceMeshes,false)[0]?.point.y??.15;
      const h = group(root,x,groundY+.035,z); h.scale.setScalar(scale);h.name='地形上的远处农舍';
      box(h, 0, 2.0, 0, 2.9, 4, 2.7, 0xeddea1);
      plainRoof(h, 0, 3.95, 0, 3.8, 2.6, 3.4, tint);
      arch(h, 0, 0.1, 1.4, 0.93, 1.93, 0.04, 0xa78750);
      windowRound(h, 0, 3.1, 1.4, 0.4, 0xb8d4bf);
    }
    // Slender distant castle spires appear over the wheat in both farm images.
    if (castleSpires) {
      const skyline = group(root, -1.5, 0.4, -40.5); skyline.scale.setScalar(0.64);
      for (let i = 0; i < 3; i++) { const x = (i - 1) * 1.23, h = i === 1 ? 6.7 : 4.8;
        cyl(skyline, x, h / 2, 0, 0.35, 0.48, h, 0xe8d9a5, 8);
        cone(skyline, x, h + 1.2, 0, 0.62, 2.4, 0xf7e6b2, 8);
      }
    }
  }
}

function woodGrain(p, x, y, z, w, h, seed = 2) {
  const random = rng(seed);
  for (let i = 0; i < 11; i++) {
    const xx = x + (random() - 0.5) * w * 0.88, yy = y + random() * h * 0.68, len = 0.28 + random() * h * 0.35;
    curve(p, [[xx, yy, z], [xx + 0.06, yy + len * 0.48, z + 0.005], [xx - 0.025, yy + len, z]], 0.012, i % 2 ? 0xb27f36 : 0xe0b263);
  }
}

function plainRoof(p, x, y, z, w, h, d, color) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(0, h); s.lineTo(w / 2, 0); s.closePath();
  return geometry(p, new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }), color, x, y, z - d / 2);
}

function stonesAlong(root, points, width = 2, seed = 2, soft = false) {
  const rand = rng(seed);
  for (let k = 0; k < points.length - 1; k++) {
    const a = points[k], b = points[k + 1];
    const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const count = Math.ceil(dist * 1.7);
    for (let j = 0; j < count; j++) {
      const t = j / count;
      const x = a[0] + (b[0] - a[0]) * t + (rand() - 0.5) * width;
      const z = a[1] + (b[1] - a[1]) * t + (rand() - 0.5) * width * 0.7;
      const rx = 0.32 + rand() * 0.23, rz = 0.25 + rand() * 0.14, poly = [];
      for (let n = 0; n < 6; n++) {
        const angle = (n / 6 + 0.05) * Math.PI * 2, r = 0.82 + rand() * 0.23;
        poly.push([x + Math.cos(angle) * rx * r, z + Math.sin(angle) * rz * r]);
      }
      flat(root, poly, soft ? 0xc0a570 : 0x6e8077, 0.078);
      const stone=fieldStone(root,x,.085,z,rx*1.92,rz*1.92,soft?.035:.07,
        soft ? [0xeddfb8,0xe6d2a0,0xf3e4bd,0xe6d6ae][j%4] : [0xb7beac, 0xcccdb5, 0xa5b0a3, 0xe1d8b5][j % 4],seed+j+k*97);
      stone.rotation.x=-Math.PI/2;stone.rotation.z=(rand()-.5)*.25;
    }
  }
}

function crate(parent, x, y, z, w = 1.45, h = 1.12, d = 1.2) {
  box(parent, x, y + h / 2, z, w, h, d, 0xb67833);
  for (let i = 0; i < 5; i++) {
    box(parent, x - w * 0.4 + i * w * 0.2, y + h / 2, z + d / 2 + 0.025, w * 0.17, h * 0.91, 0.06, 0xd89b49);
    box(parent, x - w * 0.4 + i * w * 0.2, y + h + 0.025, z, w * 0.17, 0.06, d * 0.94, 0xe0ac53);
  }
  for (const yy of [y + h * 0.12, y + h * 0.88]) box(parent, x, yy, z + d / 2 + 0.07, w + 0.08, 0.1, 0.08, 0xe8b567);
  for (const xx of [x - w * 0.4, x + w * 0.4]) box(parent, xx, y + h / 2, z + d / 2 + 0.1, 0.1, h, 0.08, 0x8d592b);
}

function pumpkin(parent, x, z, s = 1, yaw = 0) {
  const p = group(parent, x, 0, z);
  p.rotation.y = yaw;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    ellipsoid(p, Math.cos(a) * s * 0.35, s * 0.55, Math.sin(a) * s * 0.35,
      s * 0.37, s * 0.58, s * 0.36, i % 2 ? 0xef941c : 0xffb524);
  }
  curve(p, [[0, s, 0], [s * 0.02, s * 1.38, 0], [s * 0.3, s * 1.49, s * 0.07]], s * 0.09, 0x527b29);
  leaf(p, 0, s, 0, s * 0.48, 0x528b2b, -1.1);
  return p;
}

function wheat(root) {
  flat(root, [[-25, -14.7], [25, -14.7], [25, -9.6], [-25, -9.6]], 0xe4ce77, 0.045);
  const rand = rng(191);
  const ears = [], stalks = [];
  for (let i = 0; i < 840; i++) {
    const x = -25 + rand() * 50, z = -9.7 - rand() * 4.85;
    const h = .93 + rand() * 0.48;
    stalks.push({ x, y: h * 0.46, z, rx: 0.027, ry: h * 0.48, rz: 0.027, lean: -0.08, color: 0xbca458 });
    ears.push({ x: x + 0.08, y: h, z, rx: 0.105, ry: 0.42, rz: 0.09, lean: -0.18, color: [0xf3dfa0, 0xe6cf7e, 0xd4bd66, 0xf0d989][i % 4] });
  }
  instanceShapes(root, new THREE.CylinderGeometry(1, 1, 2, 5), stalks);
  instanceShapes(root, new THREE.SphereGeometry(1, 6, 6), ears);
}

function farmHouse(parent) {
  const h = group(parent,FARMHOUSE.x,0,FARMHOUSE.z);
  h.name = 'timber-stone-farmhouse';
  h.rotation.y = FARMHOUSE.yaw;
  h.scale.set(FARMHOUSE.sx,FARMHOUSE.sy,FARMHOUSE.sz);
  const w = 7.1, d = 5.1;
  bentPlank(h, 0, 2.95, 0, w, 5.9, d, 0x838e89, 0.12);
  // Unequal fieldstones on the front and the visible west wall.
  const rand = rng(53);
  for (let row = 0; row < 7; row++) for (let col = 0; col < 7; col++) {
    const x = -3.04 + col * 0.94 + (row % 2) * 0.24;
    if (Math.abs(x) < 1.5 && row < 4) continue;
    const m = fieldStone(h, x, 0.5 + row * 0.77, d / 2 + 0.016,
      0.66 + rand() * 0.25, 0.41 + rand() * 0.21, 0.1,
      [0xd3d4b9, 0xe0ddc6, 0x909b98, 0xbcc7b7][(row + col) % 4],row*19+col);
    m.rotation.z = (rand() - 0.5) * 0.28;
  }
  for (let row = 0; row < 6; row++) for (let col = 0; col < 4; col++) {
    for (const s of [-1, 1]) {
      const stone = box(h, s * (w / 2 + 0.055), 0.45 + row * 0.84, -1.93 + col * 1.14,
        0.14, 0.44 + rand() * 0.18, 0.63 + rand() * 0.12, (row + col) % 2 ? 0xd8dcca : 0x859896);
      stone.rotation.x = (rand() - 0.5) * 0.22;
    }
  }
  for (const x of [-3.48, 3.48]) for (const z of [-2.6, 2.69]) {
    curve(h, [[x + Math.sign(x) * 0.11, 0, z], [x - Math.sign(x) * 0.06, 3.1, z], [x, 6.2, z]], 0.2, C.wood);
  }
  for (let row = 0; row < 6; row++) for (let col = 0; col < 7; col++) {
    const stone = box(h, -3.04 + col * 0.94 + (row % 2) * 0.1, 0.49 + row * 0.87, -2.62, 0.65, 0.49, 0.14, (row + col) % 2 ? 0xc8d0bf : 0x91a09a);
    stone.rotation.z = (rand() - 0.5) * 0.24;
  }
  for (const s of [-1, 1]) {
    sideWindow(h, s * 3.66, 3.77, -0.53, s * Math.PI / 2, 0.72);
    beam(h, [s * 3.7, 5.25, -2.54], [s * 3.7, 5.25, 2.51], 0.12, C.woodDark);
    beam(h, [s * 3.7, 0.3, -2.54], [s * 3.7, 0.3, 2.51], 0.16, C.wood);
  }
  sideWindow(h, 0, 3.3, -2.7, Math.PI, 0.83);
  const landingDoor = group(h, 3.67, 3.64, -1.74); landingDoor.rotation.y = Math.PI / 2;
  plankDoor(landingDoor, 0, 0, 0, 1.4, 2.05, 0xbb8d45);
  box(h, 0, 5.77, 2.69, 7.2, 0.32, 0.35, C.woodDark);
  box(h, 0, 0.24, 2.69, 7.2, 0.32, 0.35, C.wood);
  clothRoof(h, 5.75, 8.85, 3.92, 6.62);
  // The farmhouse gable is stone, bounded by thick, slightly wonky red timber.
  const triangle = new THREE.Shape();
  triangle.moveTo(-3.32, 0); triangle.quadraticCurveTo(-1.54, 0.6, 0, 3.42); triangle.quadraticCurveTo(1.6, 0.64, 3.32, 0); triangle.closePath();
  geometry(h, new THREE.ExtrudeGeometry(triangle, { depth: 0.08, bevelEnabled: false }), 0x9a9d91, 0, 5.82, 3.13);
  for (let row = 0; row < 4; row++) for (let col = -3 + row; col <= 3 - row; col++) {
    if (Math.abs(col) < 1 && row < 3) continue;
    const st = box(h, col * 0.72, 6.1 + row * 0.64, 3.26, 0.55, 0.38, 0.08, col % 2 ? 0xd9d8bf : 0xc3c8b5);
    st.rotation.z = col * 0.05;
  }
  for (const s of [-1, 1]) for (const z of [-3.4, 3.43]) {
    curve(h, [[s * 4.56, 5.71, z], [s * 3.16, 6.2, z], [s * 1.64, 7.34, z], [0, 9.79, z]], 0.21, C.woodDark);
    curve(h, [[s * 4.54, 5.77, z + 0.045], [s * 3.1, 6.24, z + 0.045], [s * 1.64, 7.38, z + 0.045], [0, 9.8, z + 0.045]], 0.085, C.red);
  }
  curve(h, [[0, 9.82, -3.55], [0.08, 9.67, 0], [0, 9.83, 3.61]], 0.23, C.wood);
  geometry(h, new THREE.ExtrudeGeometry(triangle, { depth: 0.1, bevelEnabled: false }), 0xadb3a3, 0, 5.82, -3.25);
  sideWindow(h, 0, 7.1, -3.31, Math.PI, 0.55);
  plankDoor(h, 0, 0.3, 2.72, 2.45, 3.38, 0xc28f48);
  plankDoor(h, 0, 5.82, 3.28, 1.75, 2.32, 0xc58a48);
  woodGrain(h, 0, 0.4, 3.01, 2.12, 2.41, 281);
  woodGrain(h, 0, 5.9, 3.56, 1.42, 1.6, 213);
  for (const s of [-1, 1]) {
    curve(h, [[s * 1.14, 6.65, 3.62], [s * 1.34, 7.69, 3.6], [s * 0.79, 8.31, 3.59], [0, 8.9, 3.53]], 0.18, 0xb44f39);
    for (let i = 0; i < 4; i++) beam(h, [s * (0.16 + i * 0.29), 8.69 - i * 0.39, 3.65], [s * (0.47 + i * 0.29), 8.54 - i * 0.39, 3.73], 0.075, 0xe0b46b);
  }
  // Top landing and white balustrade seen in the original farm building.
  box(h, 0, 5.54, 3.81, 4.65, 0.28, 1.45, C.woodDark);
  for (let i = 0; i < 8; i++) box(h, -2.05 + i * 0.59, 5.74, 3.83, 0.52, 0.16, 1.38, 0xd5b074);
  for (let i = 0; i < 8; i++) cyl(h, -2.13 + i * 0.61, 6.15, 4.39, 0.063, 0.075, 0.82, C.white, 8);
  beam(h, [-2.35, 6.61, 4.4], [2.35, 6.61, 4.4], 0.12, C.white);
  beam(h, [-2.26, 5.82, 4.4], [2.26, 5.82, 4.4], 0.1, C.woodLight);
  // The reference's patchwork canvas falls down the right side of the doorway.
  const patchColors = [0x97b775, 0x78b3bf, 0xd8c872, 0xb4c397];
  for (let i = 0; i < 4; i++) {
    const aw = box(h, 1.83 + i * 0.78, 4.72 - i * 0.84, 4.03, 1.19, 0.13, 2.21, patchColors[i]);
    aw.rotation.z = -0.82;
    for(const edge of [-1,1]) for(let j=0;j<5;j++) {
      const xx=1.51+i*.78+j*.16, yy=5.07-i*.84-j*.172;
      beam(h,[xx,yy,4.03+edge*1.11],[xx+.085,yy-.09,4.03+edge*1.11],.015,0x797d54);
    }
  }
  for (const z of [2.85, 5.19]) beam(h, [1.4, 5.15, z], [4.64, 1.67, z], 0.1, C.wood);
  for (const x of [-2.76, 2.15]) cyl(h, x, 2.72, 4.34, 0.11, 0.16, 5.4, C.wood, 8);
  for (const z of [2.91, 5.16]) cyl(h, 4.64, 0.89, z, 0.11, 0.16, 1.78, C.wood, 8);
  // Clothes pegged under the balcony: individual 3D cloth silhouettes.
  beam(h, [-1.92, 4.89, 3.46], [1.92, 4.89, 3.46], 0.025, C.woodDark);
  const clothes = [0x98c34b, 0xfff1d5, 0xc85853, 0xe4c667];
  for (let i = 0; i < 4; i++) {
    const x = -1.54 + i * 1.02;
    box(h, x, 4.39, 3.47, 0.72, 0.91, 0.06, clothes[i]);
    box(h, x - 0.22, 4.88, 3.56, 0.075, 0.16, 0.07, C.woodLight);
    box(h, x + 0.22, 4.88, 3.56, 0.075, 0.16, 0.07, C.woodLight);
    if (i === 0) for (let j = 0; j < 3; j++) box(h, x, 4.14 + j * 0.24, 3.52, 0.68, 0.03, 0.01, 0xcfe887);
    if (i === 1) leaf(h, x, 4.22, 3.54, 0.18, 0x73ab3a, 0);
  }
  // Right exterior steps, not just a sloping box.
  for (let i = 0; i < 11; i++) {
    const yy = i * 0.32 + 0.17, zz = 3.9 - i * 0.54;
    box(h, 4.49, yy, zz, 1.78, 0.23, 0.59, i % 2 ? C.wood : C.woodLight);
    for (const xx of [3.66, 5.3]) if (i % 2 === 0) cyl(h, xx, yy + 0.54, zz, 0.063, 0.08, 1.0, C.wood, 7);
  }
  for (const xx of [3.65, 5.32]) beam(h, [xx, 0.95, 4.2], [xx, 4.27, -1.55], 0.1, C.woodLight);
  box(h, 4.45, 3.55, -1.81, 2, 0.18, 1.5, C.wood);
  windowRound(h, -2.43, 3.86, 2.71, 0.6);
  crate(h, -4.71, 2.2, 1.42, 2.25, 1.48, 2.1);
  farmBadge(h, -4.71, 2.71, 2.52, 0.75);
  farmBadge(h, 4.45, 1.15, 5.34, 0.87);
  const horn=group(h,4.88,1.0,5.61);
  const bell=cone(horn,0,0,0,.36,.94,0xb2c53e,20);bell.rotation.z=Math.PI/2;
  const rim=torus(horn,.47,0,0,.36,.035,0xffeec1);rim.rotation.y=Math.PI/2;
  cyl(horn,.45,0,0,.27,.27,.018,0x7c8829,20).rotation.z=Math.PI/2;
  beam(horn,[-.21,-.12,0],[-.14,-.38,0],.048,0x9e8032);
  for (let i = 0; i < 3; i++) {
    const slab=fieldStone(h,0,.06+i*.14,5.05-i*.6,3.1-i*.1,.84,.15,[0xa3aeac,0xb6c0ba,0x8e9d9b][i],88+i);
    slab.rotation.x=-Math.PI/2;
    const left=fieldStone(h,-1.8,.065,4.9-i*.6,.72,.81,.08,0xaab7ac,19+i);left.rotation.x=-Math.PI/2;
  }
  for(const [x,z,rx,ry,rz] of [[3.8,4.7,.94,.66,.82],[4.9,3.8,.81,.59,.96],[-3.12,3.14,.69,.47,.64]]) {
    const b=geometry(h,new THREE.DodecahedronGeometry(1,0),0xb7b486,x,ry*.65,z);b.scale.set(rx,ry,rz);b.rotation.y=x;
  }
  addFarmhouseDetails(h);
  return h;
}

export function createFarmScene() {
  const root = countryBase({ ground: C.grass, seed: 23 });
  pastoralHorizon(root, 423, false, false);
  createFarmDistance(root);
  groundPatches(root, 45);
  wheat(root);
  leafyHedge(root, -16.3, 3.3, -9.08, 1.38, 533);
  fence(root, -15, -7.9, -6.1, -7.9, { height: 1.23, color: 0xf3efd5 });
  fence(root, -.4, -7.9, 3.5, -7.9, { height: 1.23, color: 0xf3efd5 });
  for (let i = 0; i < 7; i++) bush(root, -14.5 + i * 2.6, -8.7, 0.9);
  // Only the worn entrances expose soil. The diagonal fieldstone walk breaks
  // into the lawn, rather than forming an invented continuous yellow road.
  groundContour(root,[[-19,13],[-18,7.7],[-14.7,5.5],[-12.7,5.9],[-11.2,8.2],[-13.1,10],[-12.2,13]],0xe5ca91);
  const houseApproach=group(root,FARMHOUSE.x-9.8,0,FARMHOUSE.z+10.4);
  groundContour(houseApproach,[[4.5,-2.9],[6.2,-5.2],[11.4,-5.5],[14.8,-3.9],[17.6,-.9],[18.2,1.9],[15.1,3.8],[12.8,2.1],[10,.8],[6.9,1.2],[4.3,-.5]],0xe2c895);
  groundContour(root,[[-8.5,5.8],[-8.8,4.7],[-7.5,3.3],[-6.3,3.4],[-6.6,4.4]],0xcbb077);
  stonesAlong(root,[[-16,9],[-13.8,7.4],[-12.7,6.1]],1.4,196);
  stonesAlong(root,[[-8.6,6.5],[-6.4,4.6],[-3.4,3.2],[.1,1.3],[2.4,.1],[4.2,-1.4]],2.05,197);
  stonesAlong(houseApproach,[[6.1,-1.9],[9,-.1],[13.5,1.4],[16.6,.5]],2.65,198);
  farmHouse(root);
  // Six seedling beds occupy the fenced plot on the left of the farmhouse.
  const garden=group(root,FARM_GARDEN.x,0,FARM_GARDEN.z);garden.name='Central seedling garden';
  flat(garden, [[-11.6, -5.8], [-4.6, -5.8], [-4.2, -0.3], [-11.9, -0.3]], 0xb89453, 0.05);
  for (let r = 0; r < 2; r++) for (let col = 0; col < 3; col++) {
    const x = -10.1 + col * 2.15, z = -4.54 + r * 2.32;
    box(garden, x, 0.095, z, 1.63, 0.07, 1.46, 0xc5ad73);
    for (let line = 0; line < 4; line++) box(garden, x, 0.135, z - 0.47 + line * 0.31, 1.4, 0.02, 0.025, 0xa08c59);
    beam(garden, [x, 0.11, z], [x, 0.48, z], 0.03, 0x498a32);
    leaf(garden, x, 0.32, z, 0.3, 0x62b345, -1.06);
    leaf(garden, x, 0.31, z + 0.05, 0.26, 0x8cd558, 1.08);
  }
  for (const seg of [[-11.8, -5.85, -4.4, -5.85], [-11.8, -5.85, -11.8, -0.1], [-11.8, -0.1, -5.4, -0.1], [-4.4, -5.85, -4.4, -1.4]]) {
    rusticFence(garden,[[seg[0],seg[1]],[seg[2],seg[3]]],.95,Math.round(seg[0]*11+90));
  }
  const sign = group(garden, -8.3, 0, -6.45);
  cyl(sign, 0, 1.45, 0, 0.12, 0.16, 2.9, C.wood, 8);
  bentPlank(sign, 0, 2.59, 0.0, 2.1, 1.57, 0.22, 0xbd9146, 0.07);
  decal(sign, '/references/country-farm-sign.png', 0, 2.94, 0.15, 2.73, 2.69);
  const gateway = group(root, -3.25, 0, -10.45); gateway.rotation.y = -0.14;gateway.scale.setScalar(1.1);
  for (const x of [-2.25, 2.25]) cyl(gateway, x, 1.6, 0, 0.11, 0.17, 3.2, C.wood, 9);
  curve(gateway, [[-2.46, 2.84, 0], [-2.39, 3.85, 0], [-1.5, 4.53, 0], [0, 4.87, 0], [1.46, 4.54, 0], [2.45, 3.97, 0], [2.4, 2.9, 0]], 0.19, 0xf1c05b);
  const gateShape = new THREE.Shape();
  [[20,131],[3,99],[1,64],[15,37],[47,18],[62,0],[140,14],[185,30],[213,46],[220,63],[211,115],[202,135],[157,107],[87,92],[48,105]].forEach(([u,v],i)=> i ? gateShape.lineTo((u/222-0.5)*5.15,(0.5-v/136)*3.08) : gateShape.moveTo((u/222-0.5)*5.15,(0.5-v/136)*3.08)); gateShape.closePath();
  geometry(gateway, new THREE.ExtrudeGeometry(gateShape, { depth: 0.19, bevelEnabled: false }), C.woodLight, 0, 3.76, -0.02);
  decal(gateway, '/references/country-farm-gate.png', 0, 3.76, 0.2, 5.15, 3.08);
  const vane = group(garden, -12.4, 0, -4.1);
  cyl(vane, 0, 1.85, 0, 0.052, 0.07, 3.7, 0x989c9b, 8);
  beam(vane, [-0.8, 3.17, 0], [0.8, 3.17, 0], 0.045, 0x657b81);
  ellipsoid(vane, 0, 3.77, 0, 0.14, 0.14, 0.14, 0xcbd5d1);
  label(vane, '←', -0.66, 2.68, 0.07, 0.7, 0.58, { color: '#c23e35', bg: '#f4d86e', border: '#b3813c' });
  label(vane, '→', 0.62, 3.15, 0.05, 0.7, 0.58, { color: '#368eb4', bg: '#f4d86e', border: '#b3813c' });
  groundContour(root,[[8.8,6.1],[11.6,4.6],[15.4,4.7],[19,7.6],[19,15],[7.9,15],[7.5,10]],0x9a713d,.05);
  for (let i = 0; i < 8; i++) {
    const x = 9.1 + (i % 3) * 1.65, z = 6.1 + Math.floor(i / 3) * 1.55;
    pumpkin(root, x, z, 1.14 + (i % 3) * 0.27, i * 0.6);
    curve(root, [[x, 0.16, z], [x - 1.1, 0.18, z + 0.34], [x - 1.7, 0.1, z - 0.3]], 0.065, 0x416d28);
    for(let j=0;j<3;j++) squashLeaf(root,x+Math.sin(i+j*2)*.97,.24,z+Math.cos(i+j*2)*1.1,1.15+(j%2)*.3,i+j*1.8);
  }
  rusticFence(root,[[15.5,4.45],[12.5,4.35],[10.2,4.85],[8.5,6.2],[7.8,8.5],[7.8,12.6]],1.2,337,true);
  countryFlowers(root, { x: -5.0, z: 6.9, w: 16, d: 5.5 }, 45, 41);
  countryFlowers(root, { x: -2.5, z: -4.2, w: 2.4, d: 5 }, 18, 17);
  leafyHedge(root, -19, -15.2, -4.8, 2.0, 395);
  leafyHedge(root, 13.7, 19, -7.1, 2.6, 396);
  return {
    root, spawn: [0, 0.05, 7.4],
    bounds: { minX: -14, maxX: 19, minZ: -16, maxZ: 11 },
    colliders: [{ x: -8.1+FARM_GARDEN.x, z: -2.975+FARM_GARDEN.z, rx: 3.85, rz: 2.98 }, { x: 11.5, z: 8, rx: 3.4, rz: 2.4 }],
    walkable: (x, z) => {
      const local = localXZ(x,z,FARMHOUSE.x,FARMHOUSE.z,FARMHOUSE.yaw,FARMHOUSE.sz),a=local[0]/FARMHOUSE.sx,b=local[1];
      if (Math.abs(a) < 3.72 && b > -2.8 && b < 3.03) return false;
      if (a > 3.5 && a < 5.65 && b > -2.7 && b < 4.43) {
        if (a < 3.84 || a > 5.13 || b < -2.45) return false;
      }
      return true;
    },
    heightAt: (x, z) => {
      const local = localXZ(x,z,FARMHOUSE.x,FARMHOUSE.z,FARMHOUSE.yaw,FARMHOUSE.sz),a=local[0]/FARMHOUSE.sx,b=local[1];
      if (a >= 3.84 && a <= 5.13 && b >= -2.5 && b <= 4.43) return Math.max(0.05, Math.min(3.69, 0.335 + Math.floor((4.18 - b) / 0.54) * 0.32)*FARMHOUSE.sy);
      if (Math.abs(a) < 1.5 && b > 3.35 && b < 5.46) return (.21+Math.max(0,Math.min(2,Math.floor((5.45-b)/.6)))*.14)*FARMHOUSE.sy;
      return 0.05;
    },
    updates: [], dynamic: [],
    camera: { target: [.8, 2.2, -.5], position: [3, 17, 28], perspectivePosition: [3.2, 11.3, 19.1], perspectiveTarget: [.8, 2.2, -.5], span: 19.5 },
  };
}

function blueTiledRoof(p, x, y, z, w, h, d) {
  plainRoof(p, x, y, z, w, h, d, 0xd2ad66);
  const slope = Math.atan2(h, w / 2);
  for (const side of [-1, 1]) for (let row = 0; row < 5; row++) for (let col = 0; col < 6; col++) {
    const tw = d / 6 * 1.035, tl = Math.hypot(w / 2, h) / 5 * 1.12;
    const xx = row / 5 * w / 2;
    const yy = y + h * (1 - xx / (w / 2));
    const s = new THREE.Shape();
    s.moveTo(-tw / 2, 0); s.lineTo(tw / 2, 0); s.lineTo(tw / 2, tl * 0.67);
    s.quadraticCurveTo(tw * 0.47, tl * 1.08, 0, tl); s.quadraticCurveTo(-tw * 0.47, tl * 1.08, -tw / 2, tl * 0.67); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.075, bevelEnabled: true, bevelSize: 0.028, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 9 });
    const basis = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, side), new THREE.Vector3(side * Math.cos(slope), -Math.sin(slope), 0), new THREE.Vector3(side * Math.sin(slope), Math.cos(slope), 0));
    geo.applyMatrix4(basis);
    const tile=geometry(p, geo, [0x268acb, 0x45a6dc, 0x3499d5, 0x3b9fd7][(row + col) % 4], x + side * xx, yy + 0.08 + (5 - row) * 0.009, z - d / 2 + (col + 0.5) * d / 6);
    const outline=s.getPoints(16).slice(2).map(a=>new THREE.Vector3(a.x,a.y,.1).applyMatrix4(basis)).map(v=>v.toArray());
    curve(tile,outline,.016,0x256b9d);
  }
  beam(p, [x, y + h + 0.13, z - d / 2 - 0.05], [x, y + h + 0.13, z + d / 2 + 0.05], 0.15, 0x91be4c);
}

let pigCoat;
function pigMaterial() {
  if (!pigCoat) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#efa0aa'; ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#fbe4d9'; ctx.beginPath(); ctx.moveTo(0, 80);
    for (let x = 0; x <= 256; x += 8) ctx.lineTo(x, 80 + Math.sin(x / 256 * Math.PI * 4) * 7);
    for (let x = 256; x >= 0; x -= 8) ctx.lineTo(x, 108 + Math.sin(x / 256 * Math.PI * 4 + 0.2) * 6);
    ctx.closePath(); ctx.fill();
    const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
    pigCoat = new THREE.MeshStandardMaterial({ map, roughness: 0.8 });
  }
  return pigCoat;
}

function pig(parent, x, z, scale = 1, yaw = 0) {
  const p = group(parent, x, 0, z);
  p.scale.setScalar(scale);
  p.rotation.y = yaw;
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), pigMaterial());
  body.position.set(0, 0.83, 0); body.scale.set(0.85, 0.65, 1.1); body.castShadow = body.receiveShadow = true; p.add(body);
  ellipsoid(p, -0.25, 1.435, -0.16, 0.29, 0.023, 0.4, 0xffe9e2);
  ellipsoid(p, 0, 0.57, 0.87, 0.63, 0.47, 0.57, 0xffb4bb);
  ellipsoid(p, 0, 0.44, 1.35, 0.4, 0.24, 0.13, 0xe98596);
  for (const s of [-1, 1]) {
    ellipsoid(p, s * 0.15, 0.44, 1.46, 0.037, 0.075, 0.022, 0xb85e74);
    ellipsoid(p, s * 0.35, 0.68, 1.26, 0.057, 0.073, 0.03, 0x584845);
    const ear = cone(p, s * 0.56, 1.06, 0.71, 0.24, 0.51, 0xe6849b, 5);
    ear.rotation.z = -s * 0.58;
    for (const zz of [-0.64, 0.64]) cyl(p, s * 0.5, 0.2, zz, 0.13, 0.115, 0.4, 0xd78899, 7);
  }
  const tail = torus(p, 0.11, 0.91, -1.06, 0.16, 0.052, 0xd98698);
  tail.rotation.y = 0.5;
  return p;
}

function windmill(parent) {
  const h = group(parent,WINDMILL.x,0,WINDMILL.z);
  h.name = 'blue-roof-windmill'; h.rotation.y = WINDMILL.yaw;
  box(h, 0, 2.3, 0, 5.8, 4.6, 4.8, 0xe8ce84);
  for (let i = 0; i < 9; i++) box(h, 0, 0.4 + i * 0.49, 2.46, 5.83, 0.055, 0.06, 0xac8850);
  for (const x of [-2.88, 2.88]) for (const z of [-2.48, 2.5]) bentPlank(h, x, 2.34, z, 0.23, 4.72, 0.22, C.wood, 0.07);
  for (let i = 0; i < 9; i++) {
    box(h, 0, 0.4 + i * 0.49, -2.46, 5.83, 0.045, 0.06, 0xac8850);
    for (const s of [-1, 1]) box(h, s * 2.94, 0.4 + i * 0.49, 0, 0.07, 0.045, 4.83, 0xac8850);
  }
  sideWindow(h, -2.99, 2.7, 0.03, -Math.PI / 2, 0.72);
  sideWindow(h, 0, 2.7, -2.53, Math.PI, 0.73);
  blueTiledRoof(h, 0, 4.53, 0, 7.4, 3.2, 5.92);
  for (let i = 0; i < 6; i++) box(h, 0, 4.77 + i * 0.44, 3.025, 5.83 - i * 0.98, 0.045, 0.07, 0xb48b4e);
  for(const [xx,zz,size] of [[.13,-2.4,.64],[.24,-1.4,.6],[.12,-.35,.72],[.34,.58,.68],[.45,1.6,.58],[1.95,-1.2,.56],[2.28,-.35,.72],[2.11,.7,.5],[3.05,1.9,.49]]) {
    const foliage=squashLeaf(h,xx,7.89-xx*3.2/3.7,zz,size,.5);foliage.rotation.z=-.67;
  }
  for (const z of [-3.05, 3.12]) {
    beam(h, [-3.8, 4.51, z], [0, 7.92, z], 0.19, C.woodDark);
    beam(h, [3.8, 4.51, z], [0, 7.92, z], 0.19, C.woodDark);
  }
  plankDoor(h, 0, 0.04, 2.55, 2.66, 3.37, 0xb77b3b);
  arch(h, 0, 0.02, 2.9, 2.05, 2.95, 0.04, 0x9c723c);
  const rand = rng(10);
  for (let i = 0; i < 22; i++) {
    const x = (rand() - 0.5) * 1.74, yy = 0.3 + rand() * 2.3;
    beam(h, [x - 0.2, yy - 0.15, 2.98], [x + 0.36, yy + 0.44, 2.99], 0.043, i % 2 ? 0xe5c068 : 0xd5a64d);
  }
  windowRound(h, -1.82, 3.18, 2.6, 0.46);
  const rotor = group(h, -0.2, 6.78, 3.58); rotor.name = 'windmill-rotor';
  rotor.rotation.z = 0.64;
  for (let i = 0; i < 4; i++) {
    const blade = group(rotor);
    blade.rotation.z = i * Math.PI / 2;
    beam(blade, [0, 0.25, 0], [0, 5.66, 0], 0.12, 0xad5433);
    box(blade, 0.42, 4.15, 0.035, 1.22, 3.05, 0.14, 0xfff5cc);
    for (const xx of [-0.21, 1.05]) beam(blade, [xx, 1.37, 0], [xx, 5.71, 0], 0.086, 0xb45437);
    for (let j = 0; j < 5; j++) box(blade, 0.42, 1.5 + j * 0.27, 0, 1.32, 0.079, 0.14, 0xb05235);
    beam(blade, [0.4, 1.37, 0], [0.4, 2.7, 0], 0.048, C.wood);
    box(blade, 0.42, 5.65, 0.02, 1.37, 0.13, 0.18, 0x93442f);
  }
  ellipsoid(rotor, 0, 0, 0.23, 0.66, 0.66, 0.25, 0xf2c329);
  for (const xx of [-0.22, 0.22]) curve(rotor, [[xx - 0.12, 0.05, 0.49], [xx, -0.025, 0.51], [xx + 0.12, 0.05, 0.49]], 0.017, 0xa96528);
  curve(rotor, [[-0.14, -0.2, 0.5], [0, -0.25, 0.51], [0.14, -0.2, 0.5]], 0.018, 0xa96528);
  decal(rotor, '/references/country-windmill-sun.png', 0, 0, 0.51, 1.26, 1.29);
  // Cream silo with overlapping wooden eaves attached on the right.
  cyl(h, 4.03, 1.45, 0.5, 1.57, 1.37, 2.7, 0xffefbd, 24);
  for (const a of [-Math.PI / 2, Math.PI / 2, Math.PI]) {
    const window = group(h, 4.03 + Math.sin(a) * 1.56, 1.78, 0.5 + Math.cos(a) * 1.56); window.rotation.y = a;
    windowRound(window, 0, 0, 0, 0.39);
  }
  cone(h, 4.03, 3.4, 0.5, 2.05, 1.72, C.woodLight, 18);
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2;
    beam(h, [4.03 + Math.cos(a) * 1.96, 2.56, 0.5 + Math.sin(a) * 1.96], [4.03, 4.24, 0.5], 0.042, C.wood);
  }
  label(h, '阳光牧场', 4.08, 4.42, 2.04, 2.6, 0.9, { color: '#fff5bb', bg: '#af8239', border: '#e0bd71', fontSize: 44 });
  return { house: h, rotor };
}

function hayShelter(root) {
  const g = group(root, -10.2, 0, -6.75);
  for (const x of [-2.12, 2.12]) for (const z of [-1.3, 1.3]) cyl(g, x, 1.7, z, 0.13, 0.19, 3.4, C.wood, 8);
  plainRoof(g, 0, 3.05, 0, 5.45, 1.07, 3.64, 0xebce78);
  const rand = rng(812);
  for (let i = 0; i < 32; i++) {
    const x = (rand() - 0.5) * 5.28, z = (rand() - 0.5) * 3.55;
    const yy = 3.06 + 1.03 * (1 - Math.abs(x) / 2.72);
    ellipsoid(g, x, yy + 0.04, z, 0.3 + rand() * 0.2, 0.09, 0.36, i % 3 ? 0xeccb66 : 0xf1dc84);
  }
  const thatch = [];
  for (let i = 0; i < 76; i++) {
    const xx = (rand() - 0.5) * 5.5, zz = i % 2 ? -1.71 : 1.71;
    thatch.push({ x: xx, y: 3.02 + 1.02 * (1 - Math.abs(xx) / 2.72), z: zz + (rand() - 0.5) * 0.34,
      rx: 0.085, ry: 0.32 + rand() * 0.22, rz: 0.085, lean: (rand() - 0.5) * 0.7, color: [0xf2d981, 0xe1bc63, 0xf5e2a0][i % 3] });
  }
  instanceShapes(g, new THREE.ConeGeometry(1, 1, 4), thatch);
  box(g, 0, 0.43, 0.49, 4.4, 0.7, 1.6, 0xac7035);
  box(g, 0, 0.8, 0.49, 4.15, 0.12, 1.4, 0xedd181);
  for (let i = 0; i < 12; i++) ellipsoid(g, -1.9 + i * 0.34, 0.91, 0.58, 0.36, 0.19, 0.47, i % 2 ? 0xf3de86 : 0xdcbc61);
  for (const zz of [-0.38, 1.37]) box(g, 0, 0.71, zz, 4.65, 0.2, 0.15, C.woodLight);
  return g;
}

function hangingFish(root) {
  const g = group(root, 7.16, 0, 0.95);
  for (const z of [-0.3, 1.18]) {
    beam(g, [0.47, 0.0, z], [0.54, 4.17, z], 0.038, 0xa27b3b);
    beam(g, [-0.57, 4.26, z], [0.7, 4.26, z], 0.045, 0xcb9d4b);
  }
  const colors = [0xf5b742, 0xe59c3d, 0xf4c257, 0xd99236, 0xefaa3c, 0xffc860];
  for (let i = 0; i < 6; i++) {
    const x = -0.36 + (i % 2) * 0.69, y = 2.76 - Math.floor(i / 2) * 0.66, z = 0.63 + (i % 2) * 0.08;
    beam(g, [x, y + 0.3, z], [0.03, 4.28, 0.22], 0.012, 0xb79557);
    ellipsoid(g, x, y, z, 0.42, 0.43, 0.32, colors[i]);
    ellipsoid(g, x, y - 0.07, z + 0.25, 0.36, 0.32, 0.15, 0xfff2cb);
    for (const s of [-1, 1]) {
      ellipsoid(g, x + s * 0.14, y + 0.11, z + 0.35, 0.16, 0.19, 0.065, 0xfff9e3);
      ellipsoid(g, x + s * 0.11, y + 0.08, z + 0.415, 0.07, 0.105, 0.035, 0x79572d);
    }
    ellipsoid(g, x + 0.37, y - 0.04, z - 0.05, 0.22, 0.14, 0.1, 0xe88f24).rotation.z = -0.35;
    const tail = cone(g, x, y + 0.51, z - 0.14, 0.23, 0.39, 0xf0aa35, 4); tail.rotation.z = Math.PI;
  }
  for (let i = 0; i < 4; i++) {
    const yy = 1.4 + i * 0.58;
    curve(g, [[-0.87, yy, 0.71], [0, yy - 0.2, 1.05], [0.94, yy, 0.71]], 0.016, 0xd7b26c);
  }
  // The little blue-white cloud cap above the suspended feeding basket.
  for (let i = 0; i < 4; i++) ellipsoid(g, -0.48 + i * 0.3, 4.43 + Math.sin(i * 1.4) * 0.14, 0.35, 0.29, 0.28, 0.23, i % 2 ? 0xe8f5e7 : 0x87cee2);
}

// The ranch reference shows one rocky bank; the turquoise water continues
// beyond the right and bottom of the screen. It is not an isolated oval pond.
const RANCH_SHORE = [[25,-2.15],[19,-1.73],[14.5,-1.35],[11.5,-1.18],[8.7,-.75],[6.82,.25],[5.88,1.7],[5.5,3.55],[5.72,5.5],[5.24,7.6],[5.3,10],[6.7,14.4],[7.7,19]];
function ranchWater(root) {
  const bank=new THREE.CatmullRomCurve3(RANCH_SHORE.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
  const path=bank.getPoints(125).map(p=>[p.x,p.z]);
  const water=[...path,[31,23],[35,-6]];
  flat(root,water,0x70d3d6,.09);
  const random=rng(376);
  const bankLength=bank.getLength(), count=Math.ceil(bankLength/.82);
  for(let i=0;i<=count;i++){
    const p=bank.getPointAt(i/count), stone=geometry(root,new THREE.DodecahedronGeometry(1,0),[0x859696,0xa1adaa,0x6f8386,0xb3bcb5][i%4],p.x,.17,p.z);
    stone.scale.set(.4+random()*.16,.19+random()*.11,.31+random()*.13);stone.rotation.set(random()*.22,i*.71,random()*.16);
  }
  for(const [x,z,rx] of [[8,2.3,.6],[11,1.1,.44],[12.5,4.2,.63],[7.1,6.4,.48],[15.3,7,.7],[11.3,10.6,.62]]) {
    disk(root,x,z,rx,.1,0xa2e4e0,.098);
    disk(root,x+.9,z+.38,rx*.43,.045,0x88dcda,.099);
  }
  return water;
}

function petalTrough(root,x,z) {
  const shape=new THREE.Shape(),hole=new THREE.Path(),outline=[];
  for(let i=0;i<=96;i++) {
    const a=i/96*Math.PI*2, r=1.34+.25*Math.cos(a*4), xx=Math.cos(a)*r, zz=Math.sin(a)*r;
    outline.push([xx,zz]);i?shape.lineTo(xx,-zz):shape.moveTo(xx,-zz);
  }
  for(let i=96;i>=0;i--){const [xx,zz]=outline[i];i<96?hole.lineTo(xx*.81,-zz*.81):hole.moveTo(xx*.81,-zz*.81);}
  shape.holes.push(hole);
  const trough=geometry(root,new THREE.ExtrudeGeometry(shape,{depth:.43,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:1}),0xb7935d,x,.04,z);trough.rotation.x=-Math.PI/2;
  flat(root,outline.map(([xx,zz])=>[x+xx*.81,z+zz*.81]),0x61bce3,.41);
  curve(root,outline.map(([xx,zz])=>[x+xx,.485,z+zz]),.055,0xd4b07b);
  for(let i=0;i<16;i++){const [xx,zz]=outline[i*6];beam(root,[x+xx,.06,z+zz],[x+xx,.45,z+zz],.014,0x846d47);}
  for(const [dx,dz,w] of [[-.16,-.32,.58],[.36,.27,.32]]) disk(root,x+dx,z+dz,w,.09,0x9edbed,.415);
}

function wickerBasket(root,x,z) {
  const g=group(root,x,.03,z);
  cyl(g,0,.49,0,.49,.29,.91,0xb68632,18);
  for(let i=0;i<14;i++) {
    const a=i/14*Math.PI*2;
    beam(g,[Math.cos(a)*.29,.07,Math.sin(a)*.29],[Math.cos(a)*.48,.91,Math.sin(a)*.48],.028,i%2?0xe1ae47:0x815e2c);
  }
  for(const yy of [.16,.4,.67,.91]) {const t=torus(g,0,yy,0,.28+yy*.235,.025,0xd3a24b);t.rotation.x=Math.PI/2;}
  const loop=[];for(let i=0;i<=16;i++){const a=i/16*Math.PI;loop.push([Math.cos(a)*.39,.92+Math.sin(a)*1.01,0]);}
  curve(g,loop,.066,0xd0a148);curve(g,loop.map(([xx,yy,zz])=>[xx,yy,zz+.066]),.018,0x795c2c);
  return g;
}

export function createRanchScene() {
  const root = countryBase({ ground: 0x91cf55, seed: 77 });
  pastoralHorizon(root, 633);
  groundPatches(root, 9);
  wheat(root);
  leafyHedge(root, -17.5, 17.5, -9.22, 1.5, 729);
  fence(root, -15, -7.8, 15, -7.8, { height: 1.68, color: C.wood });
  for (let i = 0; i < 10; i++) bush(root, -14 + i * 3.0, -8.8, 0.88);
  hayShelter(root);
  const { rotor } = windmill(root);
  hangingFish(root);
  groundContour(root,[[-12.9,-6.15],[-7.4,-7.25],[-6.8,-5.25],[-7.5,-3.1],[-10.8,-2.3],[-13.7,-3.35]],0xe4cf8f,.045);
  groundContour(root,[[.7,-4.1],[8.5,-4.3],[9.3,-1.7],[6.8,.9],[4.2,1.2],[1.8,.4],[.3,.95],[-.6,-.8]],0xebd696,.047);
  for (let i = 0; i < 5; i++) {
    ellipsoid(root, -2.4 + (i % 2) * 0.8, 0.15, -1.5 - Math.floor(i / 2) * 0.8, 0.83, 0.18, 0.57, i % 2 ? 0xeacc69 : 0xefdb82);
  }
  const waterBoundary=ranchWater(root);
  for (let i = 0; i < 4; i++) {
    const x = 4.6 + Math.sin(i*1.8)*.15, z = 2.4 + i * 1.5;
    cyl(root, x, 0.18, z, 0.55, 0.67, 0.31, 0xc44940, 20);
    const rim = torus(root, x, 0.345, z, 0.52, 0.06, 0xe47c5c); rim.rotation.x = Math.PI / 2;
    cyl(root, x, 0.315, z, 0.43, 0.43, 0.035, 0xc44840, 20);
    for (let j = 0; j < 4; j++) beam(root,[x,.353,z],[x+Math.sin(j*Math.PI/2)*.48,.353,z+Math.cos(j*Math.PI/2)*.48],.018,0xe8a257);
    beam(root,[x+.62,.47,z],[x+1.93,.58,z],.024,0xb89037);
    beam(root,[x+1.84,.54,z],[x+1.88,.1,z+.23],.012,0xd5c291);
  }
  petalTrough(root,-7.3,7.7);
  wickerBasket(root,-4.58,7.25);
  const pigs = [
    pig(root, -6.8, 0.48, 0.96, -0.15), pig(root, -4.55, 0.8, 1.01, 0.15),
    pig(root, -7.53, 2.68, 0.95, 0.08), pig(root, -5.05, 3.08, 1.05, -0.13),
    pig(root, -2.35, 2.65, 0.95, 0.26), pig(root, -5.4, 5.3, 0.97, -0.05),
    pig(root, -2.86, 5.06, 0.89, 0.36),
  ];
  pigs.forEach(p=>{p.position.x+=.8;p.position.z-=1.05;});
  const animated = [pigs[1], pigs[4], pigs[6]];
  let animationStart;
  const origins = animated.map(p => ({ x: p.position.x, z: p.position.z, yaw: p.rotation.y }));
  const sign = group(root, -12.75, 0, -0.5);
  cyl(sign, 0, 1.55, 0, 0.13, 0.17, 3.1, C.wood, 8);
  label(sign, '阳光牧场', 0, 2.48, 0.08, 3.45, 1.13, { color: '#786023', bg: '#eccc68', border: '#987132', fontSize: 52 });
  ram(sign, 0, 0, 0xf4d743).position.y = 2.98;
  countryFlowers(root, { x: -8, z: 8.8, w: 12, d: 2 }, 22, 10);
  countryFlowers(root, { x: 0.7, z: 6.5, w: 3.8, d: 6 }, 19, 44);
  flowers(root, { x: -4, z: -5.9, w: 5, d: 1.8 }, 27, 56);
  leafyHedge(root, -19, -16.1, -5.3, 1.8, 431);
  leafyHedge(root, 14.2, 19, -8.6, 2.0, 432);
  return {
    root, spawn: [0.4, 0.05, 7.6],
    bounds: { minX: -14, maxX: 14, minZ: -11, maxZ: 11 },
    colliders: [{ x: -10.2, z: -6.75, rx: 2.8, rz: 2.0 }, { x: -7.3, z: 7.7, rx: 1.55, rz: 1.5 }, {x:-4.58,z:7.25,rx:.57,rz:.57,height:2}],
    walkable: (x, z) => {
      const [a,b]=localXZ(x,z,WINDMILL.x,WINDMILL.z,WINDMILL.yaw);
      return !insidePolygon(x,z,waterBoundary) && !(Math.abs(a) < 3.18 && Math.abs(b) < 2.85) && !((a - 4.03) ** 2 + (b - 0.5) ** 2 < 1.97 ** 2);
    },
    heightAt: () => 0.05,
    dynamic: [rotor, ...animated],
    updates: [(t) => {
      animationStart ??= t;
      rotor.rotation.z = 0.72 - (t-animationStart) * 0.032;
      animated.forEach((p, i) => {
        p.position.x = origins[i].x + Math.sin(t * 0.43 + i * 2) * 0.16;
        p.position.y = Math.sin(t * 1.45 + i) * 0.025;
        p.rotation.y = origins[i].yaw + Math.sin(t * 0.3 + i) * 0.1;
      });
    }],
    camera: { target: [.3, 2.1, -.9], position: [1.4, 16.5, 28], perspectivePosition: [2, 11.2, 20.9], perspectiveTarget: [.3, 2.1, -.9], span: 20 },
  };
}

function whiteSchoolFence(root) {
  root = group(root, 0, 1.85, 0);
  for (const range of [[-10.2, -2.7], [2.7, 18.5]]) {
    for (let x = range[0]; x <= range[1]; x += 0.61) {
      cyl(root, x, 1.18, -8.08, 0.042, 0.06, 2.3, 0xfffce3, 8);
      ellipsoid(root, x, 2.41, -8.08, 0.095, 0.12, 0.095, 0xffffec);
      const arc = geometry(root, new THREE.TorusGeometry(0.295, 0.034, 5, 16, Math.PI), 0xfffce5, x + 0.3, 1.72, -8.08);
      arc.rotation.z = 0;
    }
    beam(root, [range[0], 0.45, -8.08], [range[1], 0.45, -8.08], 0.045, C.white);
    beam(root, [range[0], 1.03, -8.08], [range[1], 1.03, -8.08], 0.045, C.white);
  }
}

function moleGuardian(parent, x, side) {
  const g = group(parent, x, 0, -0.17); g.rotation.y = side * -0.19;
  box(g, 0, 0.16, 0, 1.66, 0.32, 1.43, 0x949f99);
  box(g, 0, 0.38, 0, 1.4, 0.18, 1.22, 0xbec4b9);
  for (const s of [-1, 1]) ellipsoid(g, s * 0.35, 0.62, 0.24, 0.35, 0.23, 0.56, 0xa6b0a8);
  ellipsoid(g, 0, 1.42, 0, 0.75, 0.83, 0.62, 0xaeb8af);
  ellipsoid(g, 0, 2.53, -0.05, 0.91, 0.86, 0.79, 0xc3cbc1);
  ellipsoid(g, 0, 2.47, 0.56, 0.64, 0.53, 0.3, 0xd3d7ca);
  ellipsoid(g, 0, 2.3, 0.88, 0.29, 0.29, 0.27, 0x99a59f);
  for (const s of [-1, 1]) {
    ellipsoid(g, s * 0.24, 2.67, 0.78, 0.1, 0.18, 0.045, 0x6f817c);
    curve(g, [[s * 0.72, 2.27, 0.49], [s * 0.87, 2.81, 0.32], [s * 0.61, 3.21, 0.1]], 0.14, 0xa2aea5);
  }
  curve(g, [[-0.56, 1.66, 0], [-0.93, 2.03, 0.13], [-0.72, 2.91, 0.42]], 0.2, 0xafb9af);
  ellipsoid(g, -0.69, 2.98, 0.45, 0.27, 0.28, 0.25, 0xc5cec2);
  curve(g, [[0.53, 1.75, 0.15], [0.8, 1.31, 0.54], [0.41, 1.13, 0.81]], 0.22, 0xa9b4aa);
  const book = group(g, 0.05, 1.18, 0.82); book.rotation.z = side * -0.29;
  box(book, 0, 0, 0, 1.38, 1.24, 0.24, 0x999f8d);
  box(book, 0, 0, 0.15, 1.18, 1.05, 0.08, 0xd7d5bc);
  label(book, 'M', 0, 0.015, 0.21, 0.84, 0.85, { color: '#969d87', bg: '#d7d5bc', border: '#d7d5bc', fontSize: 340 });
  // The back is sculpted too: a short cloak and a hood seam surround the head.
  ellipsoid(g, 0, 1.48, -0.43, 0.76, 0.87, 0.28, 0x9ca9a0);
  curve(g, [[0, 3.36, -0.05], [0, 3.09, -0.76], [0, 2.3, -0.84]], 0.04, 0x8e9e95);
  return g;
}

function schoolGate(root) {
  const g = group(root, 0, 1.85, -8.25);
  for (const x of [-2.48, 2.48]) {
    box(g, x, 2.64, 0, 0.4, 5.28, 0.64, 0xdcaa3c);
    box(g, x, 2.75, 0.36, 0.19, 5.12, 0.09, 0xffe48a);
    cyl(g, x, 0.2, 0, 0.58, 0.68, 0.4, 0xc99037, 12);
    ellipsoid(g, x, 5.4, 0, 0.32, 0.42, 0.32, 0xf2ce64);
    moleGuardian(g, x * 1.55, Math.sign(x)).scale.setScalar(1.58);
  }
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
    const x = side * (0.24 + i * 0.43);
    cyl(g, x, 1.56, 0.05, 0.043, 0.047, 3.08, 0xfff9db, 8);
    ellipsoid(g, x, 3.17, 0.05, 0.07, 0.09, 0.07, C.white);
  }
  beam(g, [-2.22, 0.45, 0.08], [2.22, 0.45, 0.08], 0.045, C.white);
  ellipsoid(g, 0, 4.25, 0.18, 2.29, 0.67, 0.18, 0xf5d267);
  decal(g, '/references/country-school-wordmark.png', 0, 4.28, 0.43, 4.73, 2.08);
  const crest = new THREE.Shape();
  [[-1.13,1.02],[-0.65,1.34],[0.65,1.34],[1.13,1.02],[0.96,-0.85],[0,-1.28],[-0.96,-0.85]].forEach(([x,y],i)=>i?crest.lineTo(x,y):crest.moveTo(x,y)); crest.closePath();
  geometry(g, new THREE.ExtrudeGeometry(crest, { depth: 0.27, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 1 }), 0xb88932, 0, 6.08, 0);
  const inset = geometry(g, new THREE.ExtrudeGeometry(crest, { depth: 0.06, bevelEnabled: false }), 0xf7d462, 0, 6.08, 0.31); inset.scale.set(0.87,0.87,1);
  const letter = new THREE.Shape();
  [[-0.68,-0.67],[-0.68,0.8],[-0.29,0.8],[0,0.13],[0.29,0.8],[0.68,0.8],[0.68,-0.67],[0.32,-0.67],[0.32,0.21],[0,-0.43],[-0.32,0.21],[-0.32,-0.67]].forEach(([x,y],i)=>i?letter.lineTo(x,y):letter.moveTo(x,y));letter.closePath();
  geometry(g, new THREE.ExtrudeGeometry(letter, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.025, bevelSegments: 1 }), 0xc7952d, 0, 6.08, 0.38);
  for (const s of [-1, 1]) {
    leaf(g, s * 0.61, 5.46, 0.05, 0.45, 0xe5b43b, s * 0.85);
    const scroll = torus(g, s * 2.45, 0.48, 0.44, 0.29, 0.09, 0xf1cc5c);
    scroll.scale.y = 1.25;
    curve(g, [[s * 2.38, 0.27, 0.48], [s * 2.16, 1.04, 0.47], [s * 2.09, 3.01, 0.46], [s * 2.34, 4.55, 0.44], [s * 2.13, 5.04, 0.43]], 0.065, 0xffdf79);
  }
}

function treeHouse(root) {
  const g = group(root, RAM_TREE_X, 0, -4.7);
  g.name = 'living-tree-schoolhouse';
  cyl(g, -.25, 4.5, -0.8, 1.68, 2.58, 9, 0x93602f, 11);
  const rand = rng(389);
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * Math.PI * 2;
    beam(g, [-.25+Math.cos(a)*2.54,.16,-.8+Math.sin(a)*2.54],[-.25+Math.cos(a)*1.76,7.8,-.8+Math.sin(a)*1.76],.064,i%2?0x734a2d:0xb27936);
    curve(g, [[-.25+Math.cos(a)*2.5,.25,-.8+Math.sin(a)*2.5],[-.25+Math.cos(a+.045)*2.12,3.2,-.8+Math.sin(a+.045)*2.12],[-.25+Math.cos(a)*1.83,6.6,-.8+Math.sin(a)*1.83]],.044,0xc48b40);
  }
  for (const [a, y] of [[0.5, 4.9], [2.8, 3.9], [4.7, 5.5]]) {
    const knot = torus(g, Math.cos(a) * 1.48, y, -0.8 + Math.sin(a) * 1.48, 0.25, 0.08, 0x765031); knot.rotation.y = Math.PI / 2 - a; knot.scale.y = 1.75;
  }
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    beam(g, [0, 0.4, -0.8], [Math.cos(a) * 3.05, 0.05, -0.8 + Math.sin(a) * 2.55], 0.28, C.wood);
    beam(g, [0, 6.2, -0.8], [Math.cos(a) * 3.7, 9.5 + rand(), -0.8 + Math.sin(a) * 2.6], 0.28, C.wood);
  }
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * Math.PI * 2;
    ellipsoid(g, Math.cos(a) * 3.14, 9.88 + rand() * 1.9, -0.8 + Math.sin(a) * 2.52, 2.68, 1.27, 2.5,
      [0x4f923f, 0x659c3c, 0x398448, 0x77aa43][i % 4]);
  }
  ellipsoid(g, 0, 11.89, -1, 3.6, 1.7, 3.1, 0x6caa42);
  const leaves = [];
  for (let i = 0; i < 240; i++) {
    const a = rand() * Math.PI * 2, v = -0.15 + rand() * 1.05, rr = Math.sqrt(1 - Math.min(0.99, v * v));
    leaves.push({ x: Math.cos(a) * rr * 5.65, y: 10.6 + v * 2.5, z: -0.8 + Math.sin(a) * rr * 4.72,
      rx: 0.35 + rand() * 0.22, ry: 0.13 + rand() * 0.15, rz: 0.3 + rand() * 0.18,
      color: [0x4b8e45, 0x77ab47, 0x8abb4b, 0x609d41][i % 4] });
  }
  instanceShapes(g, new THREE.SphereGeometry(1, 8, 6), leaves);
  // Plank-built entrance shelter nestles into the trunk.
  const cabin = group(g, .64, 0.33, 2.23);cabin.rotation.y=-.09;
  box(cabin, 0, 1.91, 0, 3.71, 3.82, 2.78, 0x9c682f);
  for (let i = 0; i < 9; i++) box(cabin, -1.64 + i * 0.41, 1.93, 1.43, 0.35, 3.77, 0.12, [0xb1853f, 0xca9b49, 0xad7c37][i % 3]);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) bentPlank(cabin, side * 1.91, 1.9, -1.18 + i * 0.4, 0.12, 3.85, 0.34, [0xbe8d3f, 0xc49645, 0xa67435][i % 3], (i % 3 - 1) * 0.05);
    sideWindow(cabin, side * 2.02, 2.4, -0.05, side * Math.PI / 2, 0.44);
    beam(cabin, [side * 1.99, 0.46, -1.5], [side * 1.99, 0.46, 1.61], 0.13, C.woodDark);
    beam(cabin, [side * 1.99, 3.53, -1.5], [side * 1.99, 3.53, 1.61], 0.13, C.woodLight);
  }
  for (const x of [-1.96, 1.96]) cyl(cabin, x, 1.84, 1.52, 0.14, 0.21, 3.98, C.wood, 9);
  blueTiledRoof(cabin, 0, 3.77, 0, 4.55, 1.87, 3.52);
  beam(cabin, [-2.34, 3.75, 1.85], [0, 5.82, 1.85], 0.17, C.woodLight);
  beam(cabin, [2.34, 3.75, 1.85], [0, 5.82, 1.85], 0.17, C.woodLight);
  plankDoor(cabin, 0, 0.06, 1.61, 1.65, 2.7, 0xc19445);
  for (const x of [-1.18, 1.18]) box(cabin, x, 2.83, 1.58, 0.56, 0.5, 0.13, 0x69baca);
  const face = group(cabin, 0, 4.48, 1.94);
  ellipsoid(face, 0, -0.18, 0, 0.97, 0.57, 0.15, 0xe8639d);
  decal(face, '/references/country-ram-doorbadge.png', 0, 0.3, 0.18, 2.19, 2.56);
  // Stair treads and a curved handrail climb round the right-hand side.
  const railA = [], railB = [];
  for (let i = 0; i < 24; i++) {
    const a = 0.8 - i / 23 * 2.36;
    const x = Math.cos(a) * 3.8, z = -0.8 + Math.sin(a) * 3.8, y = 0.18 + i * 0.283;
    const step = box(g, x, y, z, 1.42, 0.16, 0.57, i % 2 ? 0xd5a453 : 0xc18b40);
    step.rotation.y = -a;
    for (const r of [3.08, 4.52]) {
      const xx = Math.cos(a) * r, zz = -0.8 + Math.sin(a) * r;
      if (i % 2 === 0) cyl(g, xx, y + 0.56, zz, 0.052, 0.074, 1.15, 0xc39649, 7);
      (r < 4 ? railA : railB).push([xx, y + 1.11, zz]);
    }
  }
  curve(g, railA, 0.094, 0xd5aa59);
  curve(g, railB, 0.094, 0xd5aa59);
  // A second tree-level balcony peeks through the foliage.
  cyl(g, 0, 6.69, -0.8, 3.17, 3.17, 0.22, C.woodLight, 32);
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2;
    beam(g, [Math.cos(a) * 1.55, 6.815, -0.8 + Math.sin(a) * 1.55], [Math.cos(a) * 3.15, 6.815, -0.8 + Math.sin(a) * 3.15], 0.018, C.woodDark);
  }
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    if (a > 4.45 && a < 5.0) continue;
    cyl(g, Math.cos(a) * 3.05, 7.35, -0.8 + Math.sin(a) * 3.05, 0.06, 0.07, 1.1, C.wood, 7);
  }
  const balconyRail = [];
  for (let i = 0; i < 32; i++) { const a = -1.27 + i / 31 * 5.67; balconyRail.push([Math.cos(a) * 3.07, 7.91, -0.8 + Math.sin(a) * 3.07]); }
  curve(g, balconyRail, 0.1, C.woodLight);
  return g;
}

function orangeRamHouse(root) {
  const platform = group(root, 7.7, 0, -3.82);
  const h = group(platform, 0.05, 0.06, 0.05); h.name = 'ram-house-in-the-hillside';
  arch(h, 0, 0, -1.73, 5.66, 5.75, 4.13, 0xe9a226);
  for (let i = 0; i < 9; i++) {
    const a = i / 8 * Math.PI, x = Math.cos(a) * 2.84, y = 2.92 + Math.sin(a) * 2.85;
    curve(h, [[x, y, -1.86], [x * 1.035, y + 0.06, 0.35], [x, y, 2.49]], 0.051, i % 2 ? 0xf8b838 : 0xc8841d);
  }
  for (const s of [-1, 1]) sideWindow(h, s * 2.88, 2.95, -0.41, s * Math.PI / 2, 0.48);
  sideWindow(h, 0, 3.3, -1.89, Math.PI, 0.64);
  arch(h, 0, 0.14, 2.43, 4.4, 4.64, 0.17, C.woodDark);
  arch(h, 0, 0.22, 2.6, 4.04, 4.29, 0.12, 0xe4b753);
  for (let i = -4; i <= 4; i++) {
    const x = i * 0.4, top = 4.51 - 2.02 + Math.sqrt(Math.max(0, 4.08 - x * x));
    curve(h, [[x, 0.27, 2.77], [x - 0.045, 1.5, 2.78], [x + 0.03, top - 0.07, 2.78]], 0.022, 0xb78a36);
  }
  // Thick orange bangs and scroll-shaped cheek locks are the defining silhouette.
  for (const s of [-1, 1]) {
    curve(h, [[s * 0.24, 5.5, 2.34], [s * 1.5, 5.4, 2.56], [s * 2.5, 4.67, 2.66], [s * 2.63, 3.74, 2.7]], 0.28, 0xf7ae25);
    torus(h, s * 2.63, 3.58, 2.71, 0.63, 0.22, 0xe89a17);
    curve(h, [[s * 2.78, 3.85, 2.96], [s * 2.5, 3.93, 2.97], [s * 2.35, 3.66, 2.97], [s * 2.52, 3.47, 2.97]], 0.077, 0xb37622);
    leaf(h, s * 0.22, 5.21, 1.42, 1.11, s < 0 ? 0xffc34a : 0xf4a921, s * 0.73);
  }
  leaf(h, 0, 5.12, 1.47, 1.49, 0xffc34a, -0.13);
  ellipsoid(h, 0, 4.58, 2.7, 1.21, 0.69, 0.23, 0xfff2b9);
  for (const s of [-1, 1]) {
    ellipsoid(h, s * 0.31, 4.65, 2.96, 0.17, 0.25, 0.06, 0xffffec);
    ellipsoid(h, s * 0.31, 4.68, 3.015, 0.064, 0.12, 0.034, 0x76572d);
    ellipsoid(h, s * 0.32, 4.29, 2.98, 0.45, 0.27, 0.16, 0x90512e);
  }
  for (const s of [-1, 1]) {
    ellipsoid(h, s * 0.43, 3.17, 2.89, 0.67, 0.48, 0.15, 0xac4940);
    ellipsoid(h, s * 0.43, 3.18, 3.025, 0.54, 0.35, 0.07, 0x8bd0de);
    ellipsoid(h, s * 0.48, 3.29, 3.09, 0.25, 0.09, 0.02, 0xbbe7e8);
  }
  box(h, 0, 3.14, 3.05, 0.27, 0.24, 0.14, 0x8bcdd8);
  ellipsoid(h, -1.4, 1.92, 2.96, 0.21, 0.21, 0.15, C.woodDark);
  ellipsoid(h, -1.4, 1.96, 3.11, 0.125, 0.13, 0.075, 0xf7e2a2);
  const rug=[[-1.98,2.7],[1.98,2.7],[2.34,2.98],[2.55,4.05],[2.34,4.32],[-2.35,4.32],[-2.54,4.04],[-2.31,2.98]];
  groundContour(platform,rug.map(([x,z])=>[x+.05,z]),0xdba638,.07);
  groundContour(platform,rug.map(([x,z])=>[x*.88+.05,3.52+(z-3.52)*.78]),0xb74331,.091);
  for (const s of [-1, 1]) {
    curve(platform, [[0.05, 0.12, 3.5], [s * 0.8, 0.12, 3.05], [s * 1.55, 0.12, 3.36], [s * 1.42, 0.12, 3.91], [s * 0.85, 0.12, 4.01], [0.05, 0.12, 3.5]], 0.033, 0xf0bc47);
  }
  return platform;
}

function ropeFence(root, points) {
  for (let i = 0; i < points.length; i++) {
    const [x, z] = points[i];
    cyl(root, x, 1.01, z, 0.075, 0.085, 1.85, 0xfff2d5, 10);
    const stripe=[];for(let j=0;j<=38;j++){const a=j/38*Math.PI*7;stripe.push([x+Math.cos(a)*.077,.14+j/38*1.66,z+Math.sin(a)*.077]);}
    curve(root,stripe,.029,0xc24c45);
    ellipsoid(root, x, 1.96, z, 0.14, 0.16, 0.14, 0xfffbeb);
    if (i) {
      const [px, pz] = points[i - 1], mx = (px + x) / 2, mz = (pz + z) / 2;
      for (const yy of [1.2,1.41]) curve(root, [[px, yy, pz], [mx, yy - 0.23, mz], [x, yy, z]], .065, 0x3e98c8);
      const count = Math.ceil(Math.hypot(px - x, pz - z));
      for (let n = 0; n < count; n++) {
        const t = (n + 0.5) / count;
        const stone = box(root, px + (x - px) * t, .42, pz + (z - pz) * t, .99, .76, .69, n % 3 ? 0xb8bea7 : 0xcfcfbb);
        stone.rotation.y = -Math.atan2(z - pz, x - px);
        const cap=fieldStone(root,px+(x-px)*t,.807,pz+(z-pz)*t,1.04,.8,.045,n%2?0xd7d5bc:0xc5c7b2,193+n+i*7);cap.rotation.set(-Math.PI/2,0,stone.rotation.y);
      }
    }
  }
}

function schoolBillboard(root) {
  const g = group(root, -4.5, 0, 3.35);
  g.rotation.y = 0.13;
  for (const x of [-1.05, 1.05]) cyl(g, x, 1.62, 0, 0.13, 0.22, 3.24, C.wood, 10);
  box(g, 0, 3.66, 0, 6.16, 3.05, 0.26, 0x423c30);
  decal(g, '/references/country-school-board.png', 0, 3.66, 0.25, 6.46, 3.78);
  const bulbs = [0xffe773, 0xee77b7, 0xffffdf, 0xf4aad0];
  for (let i = 0; i < 18; i++) for (const yy of [2.13, 5.19]) ellipsoid(g, -2.97 + i * 0.35, yy, 0.19, 0.15, 0.15, 0.14, bulbs[i % 4]);
  for (let i = 0; i < 8; i++) for (const xx of [-3.03, 3.03]) ellipsoid(g, xx, 2.44 + i * 0.35, 0.19, 0.15, 0.15, 0.14, bulbs[(i + 1) % 4]);
  // Oversized slingshot supports the hand-lettered school board.
  curve(g, [[0.56, 0.02, 0.65], [0.47, 1.38, 0.66], [-0.08, 1.87, 0.67], [-0.35, 3.42, 0.68]], 0.15, 0xa27332);
  curve(g, [[0.47, 1.38, 0.66], [1.05, 1.8, 0.67], [1.27, 3.42, 0.68]], 0.15, 0xa27332);
  curve(g, [[-0.35, 3.27, 0.88], [-0.52, 1.42, 0.88], [0.52, 1.1, 0.88], [1.48, 1.53, 0.88], [1.27, 3.27, 0.88]], 0.062, 0xa5422f);
  return g;
}

function pencil(root, x, z) {
  const g = group(root, x, 0.29, z);
  const barrel = cyl(g, 0, 0, 0, 0.2, 0.2, 7.42, 0x329bd4, 6); barrel.rotation.z = Math.PI / 2;
  box(g, 0, 0.17, 0.02, 7.25, 0.035, 0.1, 0x90d0e8);
  for (const s of [-1, 1]) {
    const tip = cone(g, s * 4.14, 0, 0, 0.21, 0.91, 0xf4d99a, 6); tip.rotation.z = -s * Math.PI / 2;
    const graphite = cone(g, s * 4.65, 0, 0, 0.079, 0.24, 0x5a625c, 6); graphite.rotation.z = -s * Math.PI / 2;
  }
  return g;
}

export function createRamScene() {
  const root = countryBase({ ground: 0x9bd357, seed: 62 });
  pastoralHorizon(root, 866, true);
  groundPatches(root, 23);
  for (let i = 0; i < 13; i++) bush(root, -15 + i * 2.6, -10.3, 1.05);
  schoolTerrace(root);
  // The right entrance belongs to a planted hillside, with the green crown
  // continuing behind the orange facade and the exposed ochre retaining face.
  const hill = ellipsoid(root, 14.3, -0.55, -8.6, 8.9, 3.0, 6.4, 0x80b947); hill.castShadow = false;
  leafyHedge(root, 13.1, 23, -10.9, 1.6, 747, 1.6);
  leafyHedge(root, -5.0, 18.5, -10.75, 2.05, 748, 1.8);
  whiteSchoolFence(root);
  schoolGate(root);
  treeHouse(root);
  orangeRamHouse(root);
  // Pale stepping stones lead from the village side to the two school doors.
  stonesAlong(root, [[-14, 4.8], [-10, 2.3], [-6, 0.4], [-1.2, -0.7], [1.1, -0.3]], 1.0, 489, true);
  for (let i = 0; i < 5; i++) disk(root, -0.2 + i * 0.22, -7.2 + i * 0.84, 0.5, 0.32, 0xf0deb1, 1.88);
  ropeFence(root,[[-19,9],[-16.7,8],[-14.5,6.8],[-12.4,5.5],[-10.3,3.85],[-8.9,2.9]]);
  ropeFence(root,[[-.4,.4],[2.1,.6],[4.5,1.0],[6.9,1.85],[9.35,3.0],[11.8,4.4],[14.25,6.15],[17,7.6]]);
  schoolBillboard(root);
  pencil(root, 2.4, 7.2);
  const yellow = ram(root, -6.55, 5.5, 0xf3c52d);
  const pink = ram(root, -3.71, 6.5, 0xdf649b);
  const orange = ram(root, 3.55, 7.88, 0xf2b72f);
  const red = ram(root, -0.37, 4.98, 0xba4949);
  // A blue cap and a spiky shell distinguish the small foreground Rams.
  ellipsoid(pink, 0, 0.76, 0, 0.53, 0.21, 0.48, 0x45b8e5);
  ellipsoid(pink, 0.19, 0.68, 0.27, 0.51, 0.075, 0.3, 0x298bbd);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const thorn = cone(red, Math.cos(a) * 0.46, 0.7, Math.sin(a) * 0.34, 0.11, 0.38, 0xf3e5b0, 5);
    thorn.rotation.z = -Math.cos(a) * 0.65;
  }
  const rams = [yellow, pink, orange, red];
  rams.forEach(r => r.scale.setScalar(1.16));
  countryFlowers(root, { x: 0, z: 8.2, w: 23, d: 4.4 }, 40, 193);
  countryFlowers(root, { x: -3, z: -2.0, w: 5.5, d: 4 }, 19, 316);
  bush(root, -13.5, 8.3, 1.44);
  bush(root, 14.4, 8.3, 1.22);
  return {
    root, spawn: [0.8, 0.05, 9.0],
    bounds: { minX: -17, maxX: 14, minZ: -11, maxZ: 11 },
    colliders: [{ x: -4.5, z: 3.35, rx: 3.35, rz: 0.68 }, { x: 7.75, z: -3.38, rx: 3.13, rz: 2.65 }, { x: 0, z: -8.2, rx: 2.72, rz: 0.44 }, { x: -3.84, z: -8.42, rx: 1.52, rz: 1.46 }, { x: 3.84, z: -8.42, rx: 1.52, rz: 1.46 }],
    walkable: (x, z) => {
      const dx = x - RAM_TREE_X, dz = z + 5.5, radius = Math.hypot(dx, dz);
      if (radius < 2.6) return false;
      if (Math.abs(dx-.64) < 2.09 && z > -3.91 && z < -.77 && radius > 3.23) return false;
      return true;
    },
    // Doorway of the left blue-roofed timber schoolhouse.
    portalLocations: {classroom: [-11.73, .05, -.36]},
    heightAt: ramElevation,
    dynamic: rams,
    updates: [(t) => rams.forEach((r, i) => {
      r.position.y = Math.max(0, Math.sin(t * 1.38 + i * 1.7)) * 0.075;
      r.rotation.y = Math.sin(t * 0.38 + i) * 0.12;
    })],
    camera: { target: [.6, 2.8, -1.0], position: [0, 17, 28], perspectivePosition: [1.3, 11.7, 19.7], perspectiveTarget: [.6, 2.8, -1.0], span: 19.5 },
  };
}
