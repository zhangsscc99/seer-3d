import * as THREE from 'three';
import { group, box, ellipsoid, cyl, cone, torus, beam, arch, roof, disk, mat, rng } from '../scene-kit.js';

// A miniature, volumetric reading of 地图.jpeg. North is -Z; the sea and
// river are separate surfaces and all landmarks can be viewed from behind.
const P = {
  sea: 0x268bb7, seaDeep: 0x2475a8, shallows: 0x64cddd,
  sand: 0xffe39a, sandSide: 0xb88340, grass: 0xb4df55,
  grassLight: 0xc5ed61, grassDark: 0x76bd3f, forest: 0x298d49,
  river: 0x46c9de, riverEdge: 0x98e8df, path: 0xffe79d,
  wood: 0xa57132, woodDark: 0x765335, cream: 0xffefb5,
  gold: 0xf5c245, red: 0xd7664a, blue: 0x449ad0,
};
const TAU = Math.PI * 2;

function geometry(parent, geo, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, color?.isMaterial ? color : mat(color));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}
function closedShape(points, smooth = true) {
  const p = points.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const q = smooth ? new THREE.CatmullRomCurve3(p, true, 'catmullrom', .35).getPoints(points.length * 7) : p;
  const s = new THREE.Shape();
  q.forEach((v, i) => i ? s.lineTo(v.x, -v.z) : s.moveTo(v.x, -v.z));
  s.closePath(); return s;
}
function land(parent, points, bottom, height, top, side, smooth = true) {
  const geo = new THREE.ExtrudeGeometry(closedShape(points, smooth), {
    depth: height, bevelEnabled: false, curveSegments: 12,
  });
  const m = new THREE.Mesh(geo, [mat(top), mat(side)]);
  m.rotation.x = -Math.PI / 2; m.position.y = bottom;
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function ellipseLand(parent, x, z, rx, rz, y, h, top, side) {
  return land(parent, Array.from({ length: 32 }, (_, i) => {
    const a = i / 32 * TAU; return [x + Math.cos(a) * rx, z + Math.sin(a) * rz];
  }), y, h, top, side, false);
}
function ribbon(parent, pts, width, color, y, segments = 130) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], y, p[1])), false, 'catmullrom', .25);
  const pos = [], uv = [], index = [];
  for (let i = 0; i <= segments; i++) {
    const u = i / segments, point = curve.getPoint(u), tangent = curve.getTangent(u);
    const w = typeof width === 'function' ? width(u) : width;
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(w / 2);
    for (const s of [-1, 1]) { pos.push(point.x + side.x * s, y, point.z + side.z * s); uv.push(u * 16, (s + 1) / 2); }
    if (i < segments) { const j = i * 2; index.push(j, j + 1, j + 2, j + 1, j + 3, j + 2); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(index); geo.computeVertexNormals();
  const m = geometry(parent, geo, color); m.castShadow = false; return { mesh: m, curve };
}
function curveTube(parent, points, radius, color, segments = 36) {
  return geometry(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), segments, radius, 5, false), color);
}
const crownGeo = new THREE.IcosahedronGeometry(1, 1);
function miniTree(parent, x, z, s = 1, y = .43, color = P.forest) {
  const g = group(parent, x, y, z);
  cyl(g, 0, .60 * s, 0, .13 * s, .20 * s, 1.2 * s, P.woodDark, 7);
  for (const [xx, yy, zz, r] of [[0, 1.5, 0, .78], [-.42, 1.26, .13, .55], [.43, 1.33, .05, .54], [0, 2, -.07, .52]]) {
    const m = geometry(g, crownGeo, yy > 1.9 ? 0x4cab51 : color, xx * s, yy * s, zz * s);
    m.scale.set(r * s, r * s * .9, r * s * .88);
  }
  return g;
}
function pine(parent, x, z, s = 1, y = .5, snow = true) {
  const g = group(parent, x, y, z);
  cyl(g, 0, .65 * s, 0, .12 * s, .16 * s, 1.3 * s, 0x7f7047, 6);
  for (let i = 0; i < 3; i++) {
    cone(g, 0, (1.1 + i * .52) * s, 0, (1.05 - i * .22) * s, 1.8 * s, [0x3989a0, 0x4298ae, 0x58a8bc][i], 7);
    if (snow) cone(g, 0, (1.42 + i * .52) * s, 0, (.79 - i * .15) * s, 1.2 * s, 0xe7f9f3, 7);
  }
  return g;
}
function miniFlowers(parent, x, z, count, spread, seed = 42, y = .51) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const xx = x + (r() - .5) * spread, zz = z + (r() - .5) * spread;
    disk(parent, xx, zz, .09 + r() * .025, .09, [0xfff9cf, 0xfff3cb, 0xf5b6d8][i % 3], y);
  }
}
function miniFence(parent, x, z, w, d, y = .45, color = 0xffe99e) {
  const g = group(parent, x, y, z);
  for (const zz of [-d / 2, d / 2]) {
    beam(g, [-w / 2, .43, zz], [w / 2, .43, zz], .045, color);
    beam(g, [-w / 2, .23, zz], [w / 2, .23, zz], .035, color);
    for (let xx = -w / 2; xx <= w / 2 + .01; xx += .6) box(g, xx, .35, zz, .11, .7, .11, color);
  }
  for (const xx of [-w / 2, w / 2]) {
    beam(g, [xx, .43, -d / 2], [xx, .43, d / 2], .045, color);
    for (let zz = -d / 2; zz <= d / 2; zz += .6) box(g, xx, .35, zz, .11, .7, .11, color);
  }
  return g;
}
function littleWindow(parent, x, y, z, w = .42, h = .77) {
  arch(parent, x, y, z, w + .11, h + .08, .09, 0xffe5a0);
  arch(parent, x, y + .045, z + .095, w, h, .04, 0x3b90a9);
  box(parent, x, y + h * .43, z + .15, w, .065, .055, 0xe3b46a);
  box(parent, x, y + h * .50, z + .16, .055, h * .8, .06, 0xe3b46a);
}
function littleHouse(parent, x, z, { y = .46, w = 2.4, h = 2.2, d = 2.1, roofColor = P.blue, wall = P.cream, yaw = 0 } = {}) {
  const g = group(parent, x, y, z); g.rotation.y = yaw;
  box(g, 0, h / 2, 0, w, h, d, wall);
  roof(g, 0, h, 0, w + .45, h * .60, d + .35, roofColor);
  for (const xx of [-w / 2 + .08, w / 2 - .08]) box(g, xx, h / 2, d / 2 + .04, .12, h, .1, P.wood);
  box(g, 0, h * .62, d / 2 + .05, w, .10, .1, P.wood);
  arch(g, -.2, 0, d / 2 + .06, .6, h * .55, .11, P.wood);
  littleWindow(g, w * .28, h * .52, d / 2 + .1, .34, .6);
  littleWindow(g, 0, h * 1.04, d / 2 + .09, .36, .53);
  return g;
}
function turrets(parent, x, y, z, r, h, roofColor, wallColor = P.cream) {
  const g = group(parent, x, y, z);
  cyl(g, 0, h / 2, 0, r * .94, r, h, wallColor, 12);
  cyl(g, 0, h * .79, 0, r * 1.08, r * 1.08, .18, 0xe5be6c, 12);
  littleWindow(g, 0, h * .4, r * .99, r * .57, h * .29);
  cone(g, 0, h + r * .92, 0, r * 1.28, r * 1.9, roofColor, 12);
  cyl(g, 0, h + r * 2.15, 0, .045, .045, r * .65, P.gold, 6);
  ellipsoid(g, 0, h + r * 2.48, 0, .095, .12, .095, P.gold);
  return g;
}
function mountain(parent, x, z, rx, rz, h, colors, snow = false, seed = 1, y = .5) {
  const r = rng(seed), n = 13, radial = Array.from({ length: n }, () => .91 + r() * .16);
  const verts = [], cols = [], offsets = Array.from({ length: n }, (_, i) => .53 + Math.sin(i * 2.3 + seed) * .10);
  const levels = [0, .18, .36, .56, .78, .93, 1];
  const point = (i, layer) => {
    const index = i % n, a = index / n * TAU;
    const t = layer === 3 ? offsets[index] : levels[layer];
    const profile = Math.pow(Math.max(0, Math.cos(t * Math.PI / 2)), 1.04);
    const shoulder = layer === 1 || layer === 2 ? 1 + Math.sin(a * 3 + seed) * .025 : 1;
    return [Math.cos(a) * rx * radial[index] * profile * shoulder + rx * .09 * t,
      t * h, Math.sin(a) * rz * radial[index] * profile - rz * .03 * t];
  };
  const push = (p, c) => { verts.push(...p); const col = new THREE.Color(c); cols.push(col.r, col.g, col.b); };
  for (let layer = 0; layer < levels.length - 1; layer++) for (let i = 0; i < n; i++) {
    const p0 = point(i, layer), p1 = point(i + 1, layer), p2 = point(i, layer + 1), p3 = point(i + 1, layer + 1);
    const body = colors[i % colors.length];
    const color = snow && layer >= 3 ? [0xe6f7ee, 0xf7ffef, 0xecfbef, 0xd7f0ed][i % 4] : body;
    for (const p of [p0, p2, p1, p1, p2, p3]) push(p, color);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
  const body = geometry(parent, geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true, side: THREE.DoubleSide }), x, y, z);
  return body;
}
function rainbow(parent, x, y, z) {
  const g = group(parent, x, y, z); g.rotation.y = -.18;
  const colors = [0xef7883, 0xffb273, 0xfbe66f, 0x8bd665, 0x54cad7, 0x6c9bd6, 0xa585d1];
  colors.forEach((c, i) => {
    const curve = new THREE.EllipseCurve(0, 0, 5.2 - i * .29, 8.1 - i * .29, .03, Math.PI - .03, false, 0);
    const points = curve.getPoints(70).map(p => new THREE.Vector3(p.x, p.y, 0));
    const line = new THREE.CatmullRomCurve3(points);
    geometry(g, new THREE.TubeGeometry(line, 70, .18, 6, false), c);
  }); return g;
}
function lamp(parent, x, z, y = .5, s = 1) {
  const g = group(parent, x, y, z); g.scale.setScalar(s);
  cyl(g, 0, .65, 0, .045, .08, 1.3, P.wood, 6);
  ellipsoid(g, 0, 1.43, 0, .24, .31, .24, 0xffec75);
  cone(g, 0, 1.8, 0, .26, .27, P.gold, 8);
  return g;
}
function bridge(parent, x, z, width = 3.1, length = 2.2, yaw = 0) {
  const g = group(parent, x, .49, z); g.rotation.y = yaw;
  for (let i = 0; i < 11; i++) {
    const xx = -width / 2 + i / 10 * width, yy = Math.sin(i / 10 * Math.PI) * .3;
    box(g, xx, yy + .12, 0, width / 10 + .02, .22, length, 0xd5ac61);
  }
  for (const zz of [-length / 2, length / 2]) {
    for (let i = 0; i < 5; i++) {
      const xx = -width / 2 + i / 4 * width, yy = Math.sin(i / 4 * Math.PI) * .3;
      box(g, xx, yy + .46, zz, .10, .83, .10, P.wood);
    }
    curveTube(g, [[-width / 2, .7, zz], [0, 1, zz], [width / 2, .7, zz]], .055, P.wood);
  }
  return g;
}

function buildCastle(root) {
  const x = -3.3, z = -4.3, y = 3.48, g = group(root, x, y, z);
  // The map's round raised castle lawn, encircled by a dark, leafy cliff.
  ellipseLand(root, x, z, 8, 5.6, .42, 2.75, 0xa2d849, 0x398a43);
  ellipseLand(root, x, z, 7.95, 5.55, 3.17, .30, 0xb7e255, 0xe5d083);
  const r = rng(122);
  for (let i = 0; i < 38; i++) {
    const a = i / 38 * TAU, xx = x + Math.cos(a) * 7.9, zz = z + Math.sin(a) * 5.5;
    const ivy = geometry(root, crownGeo, i % 3 === 0 ? 0x77b941 : 0x248b4f, xx, 1.2 + r() * .7, zz);
    ivy.scale.set(.31, .65 + r() * .45, .26);
  }
  disk(g, 0, .3, 4.2, 3.4, 0xf6d58a, .02);
  cyl(g, 0, .3, .2, 3.45, 3.6, .58, 0xe5b361, 36);
  cyl(g, 0, .68, .2, 3.45, 3.45, .23, 0xffe4a0, 36);
  for (let i = 0; i < 23; i++) {
    const a = i / 23 * TAU;
    box(g, Math.sin(a) * 3.25, 1.05, .2 + Math.cos(a) * 3.25, .47, .55, .42, 0xffe5a1).rotation.y = a;
  }
  box(g, 0, 1.55, -.5, 2.7, 1.65, 2.2, 0xffdda0);
  for (const xx of [-1.13, 1.13]) turrets(g, xx, .8, -.95, .58, 2.8, 0xd5654c, 0xffe2a0);
  turrets(g, 0, .8, -1.2, .75, 4.5, 0xd96946, 0xffe49b);
  turrets(g, -2.05, .68, .45, .42, 2.4, 0xc46759);
  turrets(g, 2.05, .68, .45, .42, 2.4, 0xc46759);
  arch(g, 0, .8, .65, 1.28, 1.7, .20, 0xe6b763);
  arch(g, 0, .8, .88, .86, 1.35, .09, 0x825936);
  for (let i = 0; i < 4; i++) box(g, 0, .10 + i * .14, 4.2 - i * .42, 2.1 - i * .05, .20, .50, 0xffe4a4);
  // A winding stair links the raised plaza to the southern route.
  for (let i = 0; i < 15; i++) {
    const yy = .45 + i * .2, xx = x + 5.7 + Math.sin(i / 14 * Math.PI) * 1.4, zz = z + 7.6 - i * .28;
    box(root, xx, yy, zz, 1.7, .24, .39, i % 2 ? 0xeed798 : 0xfbe5a9);
  }
  for (const [xx, zz] of [[-4, 1.8], [3.95, 1.8], [-3.8, -2.2], [3.8, -2.2]]) lamp(g, xx, zz, .05, .85);
  miniFlowers(g, -4.8, .6, 27, 3.2, 88, .055);
  miniFlowers(g, 4.9, .6, 24, 2.9, 89, .055);
  return [x, y + 7.2, z];
}
function buildChurch(root) {
  const g = group(root, -13.6, .53, 2.7);
  ellipseLand(g, 0, 0, 3.05, 2.7, -.07, .19, 0xfee29c, 0xdcbf73);
  box(g, 0, 1.4, 0, 2.8, 2.8, 1.9, 0xfff6db);
  roof(g, 0, 2.75, 0, 3.1, 1.45, 2.13, 0xb46eb6);
  for (const s of [-1, 1]) {
    turrets(g, s * 1.42, .02, .06, .56, 3.4, 0x8761be, 0xffffdb);
    box(g, s * 1.42, 5.07, .07, .13, .68, .11, 0xe7b34b);
    box(g, s * 1.42, 5.16, .07, .48, .12, .11, 0xe7b34b);
  }
  arch(g, 0, .05, 1.02, 1.02, 1.76, .14, 0xd3a364);
  torus(g, 0, 2.25, 1.07, .37, .11, P.gold);
  disk(g, 0, 0, 2.65, 2.35, 0xffffc9, -.015);
  miniFlowers(g, -2.3, 1.1, 13, 1.3, 93, .24);
  miniFlowers(g, 2.3, .9, 13, 1.3, 94, .24);
  return [-13.6, 6.2, 2.7];
}
function buildStreet(root) {
  const g = group(root, 10.1, .50, -.05);
  ellipseLand(g, 0, 0, 4.1, 3, -.07, .20, 0xffe8a6, 0xd2b173);
  littleHouse(g, -2.15, -.20, { y: .12, w: 1.9, h: 1.9, d: 1.75, roofColor: 0xc66b99, yaw: .12 });
  littleHouse(g, .05, -.75, { y: .12, w: 2.2, h: 2.4, d: 2.1, roofColor: 0x49a89b });
  // Giant golden Mickey-like sign silhouette on the teal shop.
  ellipsoid(g, 0, 3.4, .6, .78, .46, .14, 0xffd440);
  for (const s of [-1, 1]) ellipsoid(g, s * .5, 3.9, .6, .43, .56, .15, 0xffd440);
  const pet = group(g, 2.52, .1, -.08);
  box(pet, 0, .95, 0, 1.7, 1.9, 1.7, 0xf1eaaa);
  for (let i = -1; i <= 1; i++) box(pet, i * .5, 1.06, .89, .07, 1.85, .06, 0x449ba5);
  for (let i = 0; i < 3; i++) box(pet, 0, .4 + i * .6, .90, 1.65, .065, .05, 0x449ba5);
  const dome = ellipsoid(pet, 0, 1.85, 0, 1, .62, 1, 0x72be6b);
  ellipsoid(pet, 0, 2.32, .83, .54, .52, .14, 0xe988b8);
  ellipsoid(pet, 0, 2.32, .96, .26, .28, .035, 0xfff5e2);
  ellipseLand(g, .2, 1.92, 1.12, .70, .11, .15, 0x9dd756, 0xcccc9a);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; disk(g, .2 + Math.cos(a) * .75, 1.92 + Math.sin(a) * .43, .10, .08, 0xffeddf, .29); }
  for (const s of [-1, 1]) lamp(g, s * 3.6, 1.7, .15, .7);
  return [10.1, 5.7, -.05];
}
function buildPlayground(root) {
  // Beside the existing western carousel; the church, coast, and paths stay clear.
  const x = -27, z = 5.4, g = group(root, x, .53, z);
  g.name = '西部游乐场 · 微缩地标';
  ellipseLand(g, 0, 0, 3.65, 2.5, -.07, .19, 0xf6dda0, 0xd3b46c);
  for (const [xx, zz, rx, rz] of [[-2.4,1.45,.57,.37],[-.9,1.75,.55,.33],[.45,1.9,.53,.30],[2.35,1.6,.5,.34],[-2,-1.65,.4,.3]]) {
    disk(g, xx, zz, rx, rz, 0xe9cc8b, .13);
    disk(g, xx, zz, rx * .84, rz * .80, 0xffe9b0, .135);
  }

  // An amber trunk has a real recessed arch, golden bark ribs, and leafy crown.
  const tree = group(g, -2.35, .12, -.55); tree.name = '树洞与彩虹';
  const trunk = new THREE.Shape();
  trunk.moveTo(-.91,0);trunk.lineTo(-.77,2.45);trunk.bezierCurveTo(-.95,3.20,.68,3.38,.76,2.65);
  trunk.lineTo(.95,0);trunk.closePath();
  const hollow = new THREE.Path();
  hollow.moveTo(-.52,.09);hollow.lineTo(.52,.09);hollow.lineTo(.52,1.26);
  hollow.absarc(0,1.26,.52,0,Math.PI,false);hollow.lineTo(-.52,.09);hollow.closePath();
  trunk.holes.push(hollow);
  geometry(tree, new THREE.ExtrudeGeometry(trunk, {depth:1.02,bevelEnabled:false,curveSegments:12}), 0xb68331, 0,0,-.51);
  arch(tree, 0,.09,-.55,1.04,1.70,.035,0x705239);
  for (const side of [-1,1]) {
    curveTube(tree, [[side*.84,.03,.49],[side*.69,.75,.53],[side*.66,1.70,.52],[side*.61,2.65,.42]], .055,0xe2ac44,18);
    beam(tree,[side*.53,.19,.05],[side*1.0,.02,.73],.15,0xac732c);
  }
  for (const [xx,yy,zz,r,c] of [[0,3.22,-.13,1.03,0x459e40],[-.65,2.94,-.05,.64,0x63b844],[.60,3.06,-.08,.68,0x7bc14e],[0,3.73,-.18,.69,0x70b34a]]) {
    const leaf=geometry(tree,crownGeo,c,xx,yy,zz);leaf.scale.set(r,r*.70,r*.78);
  }
  [0xe45b5c,0xf3a54d,0xf5d951,0x68b95a,0x5eaacc].forEach((color,i)=>{
    const arc=new THREE.EllipseCurve(0,0,.82-i*.068,.90-i*.068,0,Math.PI,false,0);
    const points=arc.getPoints(26).map(p=>new THREE.Vector3(p.x,1.25+p.y,.60));
    geometry(tree,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),26,.04,5,false),color);
  });

  // Raised blue board, coloured square route, and the three large game buttons.
  const board=group(g,.25,.12,-.30);board.name='蓝色棋盘';
  land(board,[[-1.65,-1.25],[1.60,-1.25],[1.95,-.8],[1.95,.82],[1.55,1.25],[-1.50,1.25],[-1.88,.82],[-1.88,-.72]],0,.23,0x329bd1,0x4858b6);
  box(board,0,.255,-.16,3.32,.09,1.88,0x667485);
  for(let row=0;row<4;row++)for(let col=0;col<6;col++){
    const colors=[0x64cce4,0x438ad1,0x4974af,0x7779b6,0x55b687,0xf4f4cd];
    box(board,-1.38+col*.55,.32,-.89+row*.45,.47,.045,.35,colors[(row*2+col)%colors.length]);
  }
  [0x41ccef,0xf2534c,0xf3cc48].forEach((color,i)=>{
    const xx=-.87+i*.88;
    cyl(board,xx,.34,1.0,.37,.39,.17,0x355387,18);
    cyl(board,xx,.44,1.0,.33,.35,.09,color,18);
    disk(board,xx,1.0,.22,.22,0xfff5cd,.49);
    for(let n=0;n<i+1;n++)disk(board,xx+(n-i/2)*.11,1.0,.043,.044,0x334d64,.495);
  });

  // Yellow-framed red/green jester machine, toothy smile, gloves, and bell tips.
  const clown=group(g,2.40,.12,-.20);clown.name='小丑游戏机';clown.rotation.y=-.10;
  cyl(clown,0,.17,0,1.0,1.08,.29,0x4173c5,20);
  cyl(clown,0,.35,0,.89,.96,.16,0xf6d74c,20);
  box(clown,0,1.25,0,1.22,1.60,1.06,0xf6cc31);
  box(clown,-.27,1.3,.56,.49,1.28,.045,0x43b877);
  box(clown,.27,1.3,.56,.49,1.28,.045,0xe8524c);
  box(clown,0,1.10,.60,.94,.43,.045,0xfffbd9);
  for(const xx of [-.3,0,.3])box(clown,xx,1.10,.627,.033,.40,.025,0x359967);
  box(clown,0,1.1,.63,.92,.035,.025,0x359967);
  for(const side of [-1,1]){
    box(clown,side*.29,1.67,.60,.19,.21,.035,0x704345);
    curveTube(clown,[[side*.6,1.53,.0],[side*.93,1.37,.07],[side*.92,1.08,.40]],.12,0xa5b6c2,14);
    ellipsoid(clown,side*.94,1.02,.48,.23,.27,.17,0xffffeb);
    for(const dx of [-.055,.055])box(clown,side*.94+dx,1.06,.64,.023,.18,.016,0x6b748b);
  }
  ellipsoid(clown,0,1.43,.66,.12,.12,.08,0xe44642);
  cyl(clown,0,2.12,0,.68,.72,.16,0xf2cf35,16);
  box(clown,0,2.32,0,.62,.42,.60,0x45b877);
  for(const side of [-1,1]){
    curveTube(clown,[[side*.20,2.42,0],[side*.45,2.89,0],[side*.82,3.02,0]],.19,side<0?0xe7554d:0x37ac70,18);
    curveTube(clown,[[side*.60,2.98,0],[side*.82,3.02,0],[side*1.02,2.91,0]],.19,side<0?0x44b96f:0xe65250,12);
    ellipsoid(clown,side*1.02,2.91,0,.20,.21,.20,0xffdf3e);
  }
  for(let i=0;i<3;i++)box(clown,-.62,.07+i*.10,1.08-i*.22,.57,.13,.30,i%2?0xf2d546:0x39a8d7);
  miniFlowers(g,-.8,1.80,10,1.1,481,.145);
  return [x,5.7,z];
}
function buildBeach(root) {
  const g = group(root, -27.8, .1, 13.8);
  box(g, 0, -.15, 0, 3.9, .68, 3.1, 0xa9afb0);
  box(g, 0, .22, 0, 4.12, .20, 3.25, 0xe7e8d1);
  for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) box(g, i * .76, .35, j * .95, .73, .06, .90, (i + j) % 2 ? 0xc8d4d0 : 0xe8edda);
  cyl(g, 0, 1.8, -.25, .62, .78, 2.9, 0xe8dda6, 8);
  cyl(g, 0, 2.98, -.25, .96, .84, .42, 0xb75450, 8);
  cyl(g, 0, 3.94, -.25, .64, .65, 1.45, 0xf8e5ab, 8);
  for (const s of [-1, 1]) littleWindow(g, s * .25, 3.35, .34, .24, .90);
  cone(g, 0, 5.08, -.25, 1.05, 1.10, 0xc55143, 8);
  cone(g, 0, 5.63, -.25, .13, .43, 0xfbd577, 6);
  for (const s of [-1, 1]) {
    beam(g, [s * .62, 4.34, -.25], [s * 1.15, 4.34, -.25], .038, P.gold);
    box(g, s * 1.02, 3.98, -.25, .40, .75, .025, 0xfaf1d0);
    box(g, s * 1.02, 4.14, -.22, .17, .36, .027, 0xd75949);
    box(g, s * 1.02 + .12, 3.8, -.22, .15, .29, .027, 0xd75949);
  }
  for (let i = 0; i < 5; i++) box(root, -25.35 + i * .5, .25, 13.8, .47, .30, 1.12, 0xd4d8bc);
  for (const [xx, zz] of [[2.1, -.9], [2.7, -.5], [2.1, -.25]]) {
    box(g, xx, .59, zz, .55, .5, .51, 0xbc8744);
    box(g, xx, .84, zz, .58, .06, .54, 0xe5b461);
    for (const s of [-1, 1]) box(g, xx + s * .21, .61, zz + .27, .055, .45, .05, 0xebbb6d);
  }
  // Anchored green pod-shaped boat off the stone quay.
  const boat = group(root, -31.9, -.68, 13.1); boat.rotation.y = .22;
  ellipsoid(boat, 0, .12, 0, 1.3, .44, 2.1, 0x2eb69c);
  ellipsoid(boat, 0, .7, -.2, .95, .90, 1.40, 0x4cbba3);
  ellipsoid(boat, 0, .93, .9, .53, .51, .30, 0x194c72);
  torus(boat, 0, .93, 1.13, .51, .07, 0xaedfd2);
  return [-27.8, 6.6, 13.8];
}
function buildFarm(root) {
  const g = group(root, -7.7, .5, 13.2);
  ellipseLand(g, 0, 0, 7.7, 4.85, -.07, .14, 0x92c744, 0xc6b564);
  // Parallel rectangular plots, warm yellow crops and lighter straw borders.
  for (let ix = 0; ix < 3; ix++) for (let iz = 0; iz < 3; iz++) {
    const xx = -4.2 + ix * 3.08, zz = -2.0 + iz * 1.45;
    box(g, xx, .16, zz, 2.79, .16, 1.12, 0xca9748);
    for (let row = 0; row < 4; row++) box(g, xx, .28, zz - .40 + row * .25, 2.62, .10, .075, (ix + iz) % 2 ? 0xf3d77c : 0xeabd51);
    for (const s of [-1, 1]) box(g, xx + s * 1.39, .3, zz, .08, .12, 1.16, 0xffe39a);
  }
  littleHouse(g, -2.5, 2.8, { y: .13, w: 3.05, h: 2.05, d: 2.35, roofColor: 0x50a4bf, wall: 0xf0ce70, yaw: -.12 });
  littleHouse(g, 2.18, 2.72, { y: .13, w: 1.6, h: 1.4, d: 1.35, roofColor: 0xd89258, wall: 0xf7e5a3 });
  cyl(g, -4.40, .85, 2.9, .62, .62, 1.40, 0xe7bc5b, 12);
  cone(g, -4.40, 1.79, 2.9, .8, .57, 0x56a3c5, 12);
  disk(g, .4, 3.3, .94, .67, 0x69cbd3, .19);
  miniFence(g, -.60, -.05, 11.5, 5.5, .22);
  for (const [xx, zz] of [[-6.3, 2.4], [4.8, 2.9], [3.8, 3.65]]) miniTree(g, xx, zz, .66, .18, 0x3b9c76);
  return [-7.7, 5.2, 13.2];
}
function buildRanch(root, dynamic, updates) {
  const g = group(root, 14.2, .49, 14.1);
  ellipseLand(g, 0, 0, 7.0, 4.7, -.04, .13, 0xa5d04d, 0xc4b265);
  const mill = group(g, -1.5, .13, -.8);
  cyl(mill, 0, 1.65, 0, 1.18, 1.45, 3.3, 0xebc878, 12);
  roof(mill, 0, 2.90, 0, 2.85, 1.66, 2.8, 0xb6614b);
  arch(mill, 0, .02, 1.39, .85, 1.68, .09, 0xb38343);
  littleWindow(mill, .64, 1.78, 1.16, .36, .56);
  const blades = group(mill, 0, 3.45, 1.60);
  for (let i = 0; i < 4; i++) {
    const b = group(blades); b.rotation.z = i * Math.PI / 2 + .66;
    box(b, 0, 1.67, 0, .23, 3.34, .15, 0xb98043);
    box(b, .30, 2.0, .015, .65, 1.94, .1, 0xffebaf);
    for (const xx of [-.065, .635]) box(b, xx, 2, .08, .08, 2.06, .10, 0xa26c3b);
    for (let j = 0; j < 5; j++) box(b, .30, 1.10 + j * .45, .09, .68, .065, .12, 0xa26c3b);
  }
  ellipsoid(blades, 0, 0, .2, .48, .48, .19, 0xffdc4e);
  dynamic.push(blades); updates.push(t => { blades.rotation.z = -t * .13; });
  miniFence(g, 2.1, 1.6, 5.4, 3.35, .17);
  disk(g, 3.0, 1.1, 1.55, 1.13, 0x72dce0, .20);
  for (let i = 0; i < 5; i++) {
    const xx = .4 + (i % 3) * .85, zz = 2.6 + Math.floor(i / 3) * .65;
    ellipsoid(g, xx, .55, zz, .43, .30, .34, 0xffece0);
    ellipsoid(g, xx + .30, .55, zz + .05, .19, .21, .18, 0xdec8a4);
    for (const s of [-1, 1]) cyl(g, xx + s * .2, .30, zz, .045, .045, .31, 0xa77a45, 6);
  }
  for (const [xx, zz] of [[-4.8, 1.4], [-5.5, .3]]) {
    cyl(g, xx, .40, zz, .75, .80, .38, 0xe5be55, 14);
    cyl(g, xx, .68, zz, .65, .7, .19, 0xf8d469, 14);
  }
  miniFlowers(g, -4.2, 2.6, 23, 2.6, 164, .21);
  return [12.7, 7, 13.3];
}
function buildRam(root) {
  const g = group(root, 27.0, .5, 8.0);
  ellipseLand(g, 0, 0, 3.75, 3.15, -.07, .21, 0x9acd45, 0xc5b66c);
  // Large tree, circular balcony and the characteristic blue timber canopy.
  cyl(g, 0, 2.25, -.35, .51, .88, 4.5, 0x9b642f, 10);
  for (const s of [-1, 1]) beam(g, [0, 2.1, -.3], [s * 1.25, 3.7, -.65], .30, 0xa06a31);
  cyl(g, 0, 2.20, -.25, 1.70, 1.70, .22, 0xcc9949, 18);
  const rim = torus(g, 0, 2.72, -.25, 1.67, .045, 0xe6b34f); rim.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * TAU;
    box(g, Math.cos(a) * 1.63, 2.45, -.25 + Math.sin(a) * 1.63, .065, .59, .065, 0xe6b34f);
  }
  box(g, 0, 1.0, .7, 1.4, 1.8, 1.35, 0xcb9645);
  roof(g, 0, 1.83, .65, 1.85, .65, 1.7, 0x3096be);
  arch(g, 0, .20, 1.4, .66, 1.21, .08, 0x876036);
  for (let i = 0; i < 10; i++) {
    const a = -.05 + i * .14, yy = .20 + i * .20;
    box(g, Math.cos(a) * 2.10, yy, .1 + Math.sin(a) * 2.0, .65, .20, .34, 0xd3a356).rotation.y = -a;
  }
  for (const [xx, yy, zz, r] of [[0, 4.8, -.4, 2.3], [-1.7, 4.3, -.35, 1.45], [1.65, 4.5, -.5, 1.6], [-.3, 5.8, -.7, 1.55]]) {
    const c = geometry(g, crownGeo, yy > 5.5 ? 0x4aa453 : 0x298d52, xx, yy, zz); c.scale.set(r, r * .57, r * .88);
  }
  for (let i = 0; i < 3; i++) {
    const xx = -1.65 + i * 1.07;
    ellipsoid(g, xx, .41, 2.25, .35, .29, .29, [0xffc348, 0xea779a, 0x57bede][i]);
    for (const s of [-1, 1]) { ellipsoid(g, xx + s * .09, .48, 2.49, .076, .096, .045, 0xfff6e2); ellipsoid(g, xx + s * .09, .47, 2.53, .03, .045, .02, 0x303b40); }
    const leaf = ellipsoid(g, xx, .82, 2.24, .09, .24, .05, 0x69b33f); leaf.rotation.z = .25;
  }
  return [27, 7.4, 8];
}
function buildNorthernWorld(root, dynamic, updates) {
  const icePoints = [[-34, -11], [-31, -21], [-23, -26], [-13, -27], [-6, -23], [-8, -16], [-14, -11], [-23, -9]];
  land(root, icePoints, .20, .60, 0xbce5d3, 0x579e9e);
  for (const [x, z, rx, rz, h, seed] of [[-24,-21,6,5,16,20],[-16,-23,5,5,14,21],[-9,-23,4,4,10,22],[-30,-17,4,4,10,23],[-19,-17,4,3.8,10,25]]) {
    mountain(root, x, z, rx, rz, h, [0x79c1ce,0x98d7dc,0x61b6c9,0xaddde0], true, seed, .8);
  }
  // Layered icy shelves and the rainbow crossing the snowy slope.
  ellipseLand(root, -25, -12.5, 7.3, 3.4, .7, .58, 0xdef6e4, 0x79bac1);
  ellipseLand(root, -25.8, -13.7, 5.2, 2.9, 1.27, .42, 0xebffe9, 0x83c5ca);
  for (let i = 0; i < 39; i++) {
    const r = rng(9090 + i * 83), xx = -32 + r() * 11.4, zz = -16.7 + r() * 7.0;
    if (Math.hypot((xx + 23.4) / 1.6, (zz + 11.6) / 1.2) < 1.4) continue;
    pine(root, xx, zz, .55 + r() * .46, 1.30, true);
  }
  const snowHouse = group(root, -23.4, 1.7, -11.6);
  cone(snowHouse, 0, 1.18, 0, 1.35, 2.4, 0xffe596, 18);
  arch(snowHouse, 0, -.02, 1.14, .6, 1.24, .1, 0xa56b43);
  cone(snowHouse, 0, 2.58, 0, .36, .7, 0xb5c952, 9);
  rainbow(root, -18.9, 1.3, -14.0);
  // Small snowy observatory high above the valley.
  const observatory = group(root, -8.8, 10.2, -22.7);
  cyl(observatory, 0, .53, 0, .72, .91, 1, 0xedf4cd, 8);
  cyl(observatory, 0, 1.42, 0, .37, .53, 1.25, 0x95c4d9, 8);
  cone(observatory, 0, 2.38, 0, .54, .80, 0x5688bd, 8);
  ellipsoid(observatory, 0, 2.91, 0, .12, .21, .12, 0xf1c458);
  littleWindow(observatory, 0, 1.26, .42, .29, .53);
  // Lavender cloud kingdom, on the northeastern golden mesa.
  ellipseLand(root, 10.5, -18.8, 8.8, 6.6, .4, 4.1, 0xc9ce6f, 0xbb9b58);
  const cliffRandom = rng(871);
  for (let i = 0; i < 48; i++) {
    const a = i / 48 * TAU, xx = 10.5 + Math.cos(a) * 8.65, zz = -18.8 + Math.sin(a) * 6.5;
    const ivy = geometry(root, crownGeo, [0x427f54, 0x628b58, 0x839a54][i % 3], xx, 1.4 + cliffRandom() * 1.2, zz);
    ivy.scale.set(.40, 1.0 + cliffRandom() * .76, .34);
    const lip = geometry(root, crownGeo, i % 3 ? 0x7faf4b : 0x56994f, xx, 4.47, zz);
    lip.scale.set(.63, .29, .59);
  }
  mountain(root, 7.0, -24.2, 4.3, 3.6, 11.5, [0x9a76c4,0xb990db,0xc29ce1,0x9e77c9], false, 66, 3.8);
  mountain(root, 13.3, -24.2, 4.0, 4.1, 10.2, [0xa682ce,0xc09dde,0xd2b4e7], false, 67, 3.8);
  const clouds = group(root, 9.5, 4.75, -17.7);
  for (let i = 0; i < 15; i++) {
    const a = i / 15 * TAU;
    ellipsoid(clouds, Math.cos(a) * 5.8, .3 + (i % 3) * .26, Math.sin(a) * 3.6, 1.35, 1.4, 1.42, [0x7854a6,0x8565b1,0x9775c3,0x5c719f][i%4]);
  }
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * TAU;
    const curl = torus(clouds, Math.cos(a) * 5.9, .8, Math.sin(a) * 3.7 + .75, .62, .055, 0xae88d4);
    curl.rotation.y = a * .3;
  }
  for (const [xx, zz, h] of [[-2.3,.6,2.1],[-.8,0,3],[.7,.5,2.7],[2.1,-.2,3.1]]) {
    cyl(clouds, xx, 1.1 + h / 2, zz, .46, .56, h, 0xb1a4d6, 10);
    ellipsoid(clouds, xx, 1.1 + h, zz, .46, .6, .46, 0xc3a5df);
  }
  dynamic.push(clouds); updates.push(t => { clouds.position.y = 4.75 + Math.sin(t * .36) * .12; });
  // Thin waterfall on the west face of the cloud mesa.
  ribbon(root, [[5.2,-14.0],[4.7,-11.3],[5.0,-8.9]], .72, 0xb9f6ed, .54, 28);
  curveTube(root, [[5.1,5.4,-15],[5.2,4,-14.5],[5.0,.63,-13.3]], .26, 0xd7fff1);
}
function buildVolcanoes(root) {
  const points = [[18,-22],[26,-23],[34,-17],[36,-8],[32,-2],[23,-4],[17,-9]];
  land(root, points, .1, 1.18, 0xb58142, 0x73523b);
  for (const [x,z,rt,rb,h] of [[26,-16,1.05,5.4,11.5],[21,-10,.74,4.25,7.8]]) {
    const g = group(root, x, 1.22, z);
    const volcano = geometry(g, new THREE.CylinderGeometry(rt, rb, h, 9, 1, true), new THREE.MeshStandardMaterial({color:0xc57745,roughness:1,flatShading:true}), 0,h/2,0);
    // Broad facets, orange crater rim and genuine recessed opening.
    cyl(g,0,h-.28,0,rt*.77,rt*.77,.55,0xa33d2d,12);
    cyl(g,0,h-.06,0,rt*.83,rt*.83,.07,0xffd455,12);
    const rim=torus(g,0,h,0,rt,.19,0xf5b14b);rim.rotation.x=-Math.PI/2;
    const lavaPaths=[[[.1,h,.9],[.2,h-1.4,1.46],[.85,h-2.1,1.86],[.56,h-3.7,2.77],[1.50,h-4.5,3.12]], [[-.58,h,.45],[-1.1,h-1.9,.85],[-1.5,h-2.8,1.2],[-2.0,h-4.8,1.8]]];
    lavaPaths.forEach((pts,i)=>curveTube(g,pts,i?.10:.17,0xffca4f));
    // Short branching lava rivulets reach the rocky plain.
    curveTube(g, [[rb*.1,.07,rb*.55],[rb*.35,.07,rb*.82],[rb*.10,.07,rb*1.10],[rb*.55,.07,rb*1.27]], .08, 0xf7c451);
  }
  for (let i = 0; i < 14; i++) {
    const a = i * 1.87, rr = 1.8 + (i % 4) * .53;
    const m = geometry(root, crownGeo, [0x954d33,0xac6436,0xc6793d][i%3],31+Math.cos(a)*rr,1.5+(i%3)*.14,-7+Math.sin(a)*rr);
    m.scale.set(.95,.60,.78);
  }
  // A tiny summit flag and stone path retain the map's playful scale.
  for (let i = 0; i < 10; i++) box(root,29.2-i*.25,1.34,-4.2-i*.48,.53,.1,.31,0xffdb79).rotation.y=.31;
}
function buildMapCurios(root) {
  // The original overview has a row of chess-like monuments below the ice range.
  const monuments = [[-13.3, -12.9, 0xd89c49], [-7.8, -13.2, 0xce6b44], [.2, -15.0, 0xb6a365]];
  monuments.forEach(([x, z, c], index) => {
    const g = group(root, x, .61, z);
    cyl(g, 0, .14, 0, 1.15, 1.26, .22, 0xffe2a0, 24);
    cyl(g, 0, .33, 0, .92, 1.0, .19, 0xd7ba68, 20);
    if (index === 0) {
      cyl(g, 0, .75, 0, .58, .75, .64, 0xeac475, 12);
      cyl(g, 0, 1.32, 0, .35, .58, .51, 0xeec87f, 12);
      ellipsoid(g, 0, 1.94, 0, .44, .62, .44, 0xddab67);
      ellipsoid(g, 0, 2.57, 0, .16, .23, .16, 0xc89056);
    } else if (index === 1) {
      cyl(g, 0, .81, 0, .61, .65, .76, 0xd58c57, 12);
      const head = box(g, 0, 1.65, 0, 1.36, 1.13, 1.0, c); head.rotation.z = .08;
      for (const xx of [-.35, .35]) { torus(g, xx, 1.78, .55, .22, .055, 0xffbc82); ellipsoid(g, xx, 1.78, .56, .10, .10, .025, 0xa75c45); }
      box(g, 0, 1.36, .56, .61, .10, .08, 0x984e38);
    } else {
      cyl(g, 0, 1.30, 0, .62, .85, 1.82, c, 9);
      cyl(g, 0, 2.18, 0, .84, .84, .40, 0xc0b177, 9);
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; box(g, Math.cos(a) * .71, 2.52, Math.sin(a) * .71, .33, .41, .31, 0xdac993).rotation.y = -a; }
      box(g, .22, 1.34, .78, .23, .58, .05, 0x807548);
    }
  });
  // The curved red-and-cream roof of the lodge beside the eastern woodland.
  const lodge = group(root, 14.5, .52, -8.4); lodge.rotation.y = -.18;
  ellipseLand(lodge, 0, 0, 3.1, 2.55, -.02, .13, 0xe4c67c, 0xb99b53);
  box(lodge, 0, 1.04, 0, 3.40, 1.98, 2.32, 0xf5dea9);
  const roofShape = new THREE.Shape(); roofShape.moveTo(-1.97, 0);
  roofShape.bezierCurveTo(-1.9, 2.08, 1.9, 2.08, 1.97, 0); roofShape.closePath();
  geometry(lodge, new THREE.ExtrudeGeometry(roofShape, { depth: 2.67, bevelEnabled: false, curveSegments: 24 }), 0xb9664c, 0, 1.99, -1.34);
  for (let i = 0; i < 5; i++) {
    const zz = -1.34 + i * .66;
    curveTube(lodge, [[-2, 2.03, zz], [-1.45, 3.21, zz], [0, 3.62, zz], [1.45, 3.21, zz], [2, 2.03, zz]], .14, 0xf4ce84);
  }
  arch(lodge, -.12, .04, 1.38, 1.1, 1.86, .13, 0x855a38);
  arch(lodge, -.12, .09, 1.54, .78, 1.61, .055, 0x4c9dbe);
  for (const xx of [-1.18, 1.17]) littleWindow(lodge, xx, .70, 1.28, .50, .92);
  for (let i = 0; i < 3; i++) box(lodge, -.12, .03 + i * .13, 2.13 - i * .28, 1.75, .15, .36, 0xf5d991);
  // Small coral and gold pavilion on the eastern path.
  const pavilion = group(root, 23.4, .52, -.15);
  cyl(pavilion, 0, .18, 0, 1.75, 1.86, .30, 0xd9c371, 24);
  cyl(pavilion, 0, .39, 0, 1.51, 1.60, .20, 0xf0d78c, 24);
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; cyl(pavilion, Math.cos(a) * 1.24, 1.14, Math.sin(a) * 1.24, .105, .13, 1.43, i % 2 ? 0xeaa548 : 0xdd7865, 8); }
  cone(pavilion, 0, 2.06, 0, 1.67, .91, 0xdf7b75, 16);
  cone(pavilion, 0, 2.51, 0, .71, .71, 0xe7b04f, 12);
  ellipsoid(pavilion, 0, 2.94, 0, .18, .23, .18, 0xffd76a);
  // Sunflowers mark the old map's junctions and ridgelines.
  for (const [x,z] of [[-28,-4.4],[-26,-3.8],[-23,1],[-19,3],[-17,4.3],[-14,7],[.8,-13],[2.5,-13.1],[6,-11.5],[8,-11],[11,-10.8],[17,-5.0],[25,3.1],[26,4.0],[21,19],[-18,19]]) {
    const g = group(root, x, .5, z);
    cyl(g, 0, .64, 0, .038, .045, 1.25, 0x6b9739, 5);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; const petal = ellipsoid(g, Math.cos(a) * .24, 1.35 + Math.sin(a) * .24, .03, .12, .17, .055, 0xffd63e); petal.rotation.z = a - Math.PI / 2; }
    ellipsoid(g, 0, 1.35, .065, .19, .19, .09, 0xf3a12e);
    const leaf = ellipsoid(g, .16, .54, 0, .25, .09, .09, 0x72ac3e); leaf.rotation.z = .41;
  }
}
function buildHome(root) {
  const g=group(root,3.4,.50,14.0);
  // Fit the garden between the farm and ranch, beside the river.
  g.scale.setScalar(.78);
  ellipseLand(g,0,0,4.2,2.9,-.04,.17,0xb6d85b,0xc4b377);
  ellipseLand(g,0,.58,3.7,1.94,.14,.055,0xe1decb,0xaaa99a);
  littleHouse(g,1.60,-1.18,{y:.15,w:2.18,h:1.83,d:1.8,roofColor:0x9755d9,wall:0xecc36d,yaw:-.17});
  const dormer=group(g,2.3,2.58,-.55);dormer.rotation.y=-.17;
  littleWindow(dormer,0,0,0,.42,.61);
  miniFence(g,0,-1.42,7.4,1.86,.17,0xfff3ce);
  for(let i=0;i<6;i++){
    const x=i<2?1.56+i*1.05:-.54+(i-2)*1.05,z=i<2?.70:1.79;
    box(g,x,.245,z,.94,.15,.87,0xb28a4f);
    for(let row=0;row<3;row++)box(g,x,.34,z-.28+row*.28,.85,.06,.12,0xd5b475);
  }
  const swing=group(g,-.83,.2,-.64);
  for(const x of [-.66,.66]){
    curveTube(swing,[[x,0,.32],[x,1.46,0],[x,1.71,-.18]],.045,0xe8b623,18);
    beam(swing,[x,1.53,0],[x,.52,.10],.018,0xf1bd2c);
  }
  beam(swing,[-.68,1.52,0],[.68,1.52,0],.045,0xe2b332);
  box(swing,0,.46,.14,1.23,.14,.54,0xffecc9);
  box(swing,0,.78,-.09,1.21,.59,.12,0xffd5cf);
  for(const x of [-.36,0,.36])box(swing,x,.80,-.015,.055,.56,.015,0xfff5dd);
  const pool=group(g,-2.65,.25,-.47);
  cyl(pool,0,.06,0,.57,.65,.14,0xe9e8df,20);disk(pool,0,0,.48,.48,0x53c6e8,.15);
  cyl(pool,0,.40,0,.15,.24,.65,0xf4ecdf,12);ellipsoid(pool,0,.97,0,.24,.33,.16,0xf4ede4);
  for(const x of [-2.47,-1.03]){
    cyl(g,x,.27,1.56,.60,.66,.19,0xefc861,22);disk(g,x,1.56,.56,.56,0x69bc42,.39);
    miniFlowers(g,x,1.56,16,.88,Math.round(133+x*11),.405);
  }
  return [3.4,3.7,14.0];
}
function buildSouth(root) {
  // Palm-lined southern coast, sandy paths and the half-buried oval home.
  const dome = group(root, -5, .52, 24.15);
  ellipseLand(dome, 0, 0, 3.5, 2.2, -.03, .15, 0x82b346, 0xbac36b);
  const shell=ellipsoid(dome,0,.69,0,2.75,1.78,1.59,0xe8da83);
  ellipsoid(dome,0,.59,.89,2.21,1.24,.82,0xf6eab3);
  for(const xx of [-1.35,0,1.35]){torus(dome,xx,1.14,1.54,.39,.095,0xb3a657);ellipsoid(dome,xx,1.14,1.54,.26,.31,.025,0x81b6b1);}
  arch(dome,0,0,1.61,.68,.81,.10,0xb1854d);
  for(let i=0;i<12;i++){const a=i/12*TAU;box(dome,Math.cos(a)*3.15,.27,Math.sin(a)*1.82,.14,.62,.13,0xe7d186);}
  function palm(x,z,s){const g=group(root,x,.44,z);g.scale.setScalar(s);beam(g,[0,0,0],[.12,1.7,.03],.16,0x9a7741);beam(g,[.12,1.7,.03],[.36,2.55,.02],.12,0xb2914e);for(let i=0;i<7;i++){const a=i/7*TAU;const l=ellipsoid(g,.36+Math.cos(a)*.57,2.58,.02+Math.sin(a)*.57,.80,.12,.28,0x2eae69);l.rotation.y=-a;l.rotation.z=Math.cos(a)*-.22;}return g;}
  for(const [x,z,s] of [[6.3,25.8,1.15],[9.5,25.2,1.25],[12.3,24.4,1.0],[15.5,23.2,1.2],[18.4,22.1,.95],[21.3,20.5,1.05]])palm(x,z,s);
  // Tiny gold-edged circular carousel west of the town centre.
  const fair=group(root,-20.1,.53,5.7);
  cyl(fair,0,.18,0,2.32,2.45,.28,0x8fc945,24);cyl(fair,0,.4,0,1.54,1.67,.3,0xfbdc67,20);
  for(let i=0;i<6;i++){const a=i/6*TAU;cyl(fair,Math.cos(a)*1.14,1.15,Math.sin(a)*1.14,.06,.06,1.5,0xf6d171,6);}
  cone(fair,0,2.24,0,1.93,1.65,0x91d2b9,12);
  for(let i=0;i<6;i++){const a=i/6*TAU;cone(fair,Math.cos(a)*.85,1.85,Math.sin(a)*.85,.50,.77,[0xf0ba61,0x69b7d1,0xc582c7][i%3],6);}
  ellipsoid(fair,0,3.18,0,.18,.21,.18,0xf0b748);
  // Purple balloon with golden goggles, like the map's central activity icon.
  const balloon=group(root,8.1,.5,6.7);
  ellipsoid(balloon,0,2.9,0,1.62,1.59,1.32,0xa963c2);
  for(const xx of [-.61,.61]){torus(balloon,xx,2.69,1.13,.53,.12,0xebc852);ellipsoid(balloon,xx,2.69,1.10,.43,.36,.12,0x705590);}
  for(const xx of [-.7,.7])beam(balloon,[xx,1.80,0],[xx*.55,.68,0],.07,0xb19355);
  cyl(balloon,0,.48,0,.68,.52,.56,0xcf9850,12);
  const lip=torus(balloon,0,.81,0,.67,.085,0xf0c969);lip.rotation.x=-Math.PI/2;
}

export function createIslandScene() {
  const root = group(); root.name = '摩尔庄园 · 全岛鸟瞰';
  const dynamic = [], updates = [];
  const water = geometry(root, new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: P.sea, roughness: .78, metalness: .02 }), 0, -1.52, 0);
  water.rotation.x = -Math.PI / 2; water.castShadow = false;
  const outline = [[-34,9],[-31,-4],[-34,-16],[-28,-25],[-17,-29],[-4,-28],[11,-28],[25,-25],[34,-18],[37,-7],[35,4],[31,14],[22,23],[8,29],[-7,29],[-20,24],[-29,19]];
  const scaled = (sx, sz) => outline.map(([x,z]) => [x*sx,z*sz]);
  land(root,scaled(1.035,1.035),-1.44,.20,P.shallows,0x3698b1);
  land(root,outline,-1.33,1.30,P.sand,0xa47843);
  land(root,scaled(.981,.981),-.04,.24,0xffe8a2,0xdbb66d);
  land(root,scaled(.948,.944),.19,.26,P.grass,0xaac449);
  // Shallow coastal band and hand-drawn-looking, low-relief grass patches.
  for(const [x,z,rx,rz,c] of [[-17,15,9,6,0xc4e86a],[18,10,8,8,0xc1e95b],[0,20,8,4,0xc3e767],[-20,-1,8,5,0x94cb44],[18,-1,7,4,0x97ca3e],[-4,-18,10,5,0x95ca4f]])disk(root,x,z,rx,rz,c,.455);
  const roadPaths = [
    [[-26,13],[-22,11],[-19,7],[-16,6],[-11,7],[-8,8],[-2,8],[2,9],[9,9],[14,8],[21,7],[28,8]],
    [[-18,8],[-19,14],[-14,20],[-6,22],[-3,24]],
    [[8,9],[8,16],[14,20],[21,18],[26,13],[29,8]],
    [[11,1],[16,1],[20,-4],[22,-7]],
    [[-17,6],[-18,0],[-21,-5],[-22,-8]],
    [[9,9],[12,5],[14,1],[12,-5],[8,-9]],
    [[1,11],[-3,15],[-6,19],[-6,23]],
  ];
  roadPaths.forEach(p => {ribbon(root,p,1.28,0xe0bf6a,.465);ribbon(root,p,1.03,P.path,.475);});
  const mainRiver = [[-4,-27],[-8,-22],[-9,-17],[-4,-13],[2,-12],[5,-8],[5,-3],[3,1],[5,4],[3,7],[1,10],[-.6,12],[-.8,16],[.5,19],[1.5,22],[1,29.8]];
  ribbon(root,mainRiver,u=>1.1+u*1.0,0xd9eeb0,.48);
  ribbon(root,mainRiver,u=>.75+u*1.08,P.river,.491);
  const westRiver=[[-10,-16],[-15,-13],[-19,-11],[-22,-7],[-26,-4],[-31,-3],[-33,0]];
  ribbon(root,westRiver,1.23,0xd6edb0,.48);ribbon(root,westRiver,.85,P.river,.491);
  // Water catches the light in fine interrupted bands, with gentle movement.
  const ripples=group(root);const random=rng(824);
  for(let i=0;i<62;i++){
    const x=(random()-.5)*100,z=(random()-.5)*84;
    if(Math.abs(x)<34&&z>-29&&z<29)continue;
    const m=box(ripples,x,-1.495,z,.4+random()*1.7,.012,.035,0x72bacc);m.castShadow=false;
  }
  dynamic.push(ripples);updates.push(t=>{ripples.position.x=Math.sin(t*.19)*.25;});
  buildNorthernWorld(root,dynamic,updates);
  buildVolcanoes(root);
  // Dense forests follow the centre valley and the northern land boundaries.
  const groves=[[-6,-17,10,6,45],[1,-18,7,5,27],[3,-11,7,3.6,20],[-13,-5,5,4,18],[-23,1,6,3,16],[15,-7,7,4,22],[19,4,5,4,14],[-20.5,21.8,2.8,2.2,9]];
  for(let k=0;k<groves.length;k++){
    const [cx,cz,w,d,n]=groves[k],r=rng(140+k);
    for(let i=0;i<n;i++)miniTree(root,cx+(r()-.5)*w,cz+(r()-.5)*d,.55+r()*.35,.47,i%5===0?0x369b74:0x298d4f);
  }
  const locations=[];
  const add=(id,p)=>locations.push({id,x:p[0],y:p[1],z:p[2]});
  add('castle',buildCastle(root));add('church',buildChurch(root));add('street',buildStreet(root));
  add('playground',buildPlayground(root));
  add('beach',buildBeach(root));add('farm',buildFarm(root));add('ranch',buildRanch(root,dynamic,updates));add('ram',buildRam(root));
  add('home',buildHome(root));
  buildSouth(root);
  buildMapCurios(root);
  bridge(root,1.45,9.0,3.1,1.47,.04);
  bridge(root,4.25,-.6,2.7,1.3,.25);
  bridge(root,-22.1,-6.0,2.3,1.20,-.2);
  // Map-like route beacons dot the paths; they are decorative, not flat labels.
  for(const [x,z]of[[-24,9],[-20,11],[-15,7],[-10,7.4],[-2,8],[6,9],[10,10],[18,8],[23,8],[26,12],[-17,19],[5,23],[-25,-5],[15,-3],[-2,-14]])lamp(root,x,z,.52,.6);
  for(const [x,z,n,s]of[[-23,12,30,4],[-19,19,33,4],[-11,21,27,3.5],[6,19,30,3.5],[21,17,28,3.5],[24,2,28,3.7],[-15,8,23,2.5]])miniFlowers(root,x,z,n,s,Math.round(x*17+z*41),.50);
  // Low poly rock islets and a small icy sea shrine at the eastern edge.
  for(const[x,z,rx,rz]of[[-39,21,3.0,1.7],[-31,29,2.3,1.4],[35,27,1.3,.8],[41,12,2.2,1.4]]){
    ellipseLand(root,x,z,rx,rz,-1.45,.42,0x4e9cab,0x247396);
    for(let i=0;i<4;i++){const m=geometry(root,crownGeo,0x63a48e,x+(i%2-.5)*rx,-.6+(i%3)*.25,z+(Math.floor(i/2)-.5)*rz);m.scale.set(rx*.45,1.1,rz*.52);}
  }
  const ice=group(root,37,-.70,19);
  for(let i=0;i<4;i++)cyl(ice,0,i*.30,0,1.8-i*.36,2.1-i*.36,.28,i%2?0xd5f4ed:0x8ed7db,12);
  cyl(ice,0,1.24,0,.42,.68,.8,0xe9f6e6,10);ellipsoid(ice,0,2.0,0,.53,.54,.46,0xb1e4dc);cone(ice,0,2.58,0,.26,.62,0xdda85b,8);
  for(const[x,y,z,s]of[[-36,17,-25,1],[2,18,-29,.8],[30,17,-24,.9],[-31,16,0,.7]]){
    const cloud=group(root,x,y,z);
    for(let i=0;i<5;i++){const m=ellipsoid(cloud,(i-2)*1.3*s,Math.sin(i*1.9)*.35*s,0,1.60*s,.65*s,.80*s,new THREE.MeshBasicMaterial({color:0xfff8f0}));m.castShadow=false;}
  }
  return {
    root,updates,dynamic,locations,spawn:[0,.52,20],
    bounds:{minX:-36,maxX:37,minZ:-29,maxZ:30},colliders:[],
    heightAt:()=>.52,
    camera:{perspectivePosition:[0,51,70],perspectiveTarget:[0,3,-1],target:[0,3,-1],zoom:1.2},
  };
}
