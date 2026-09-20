import * as THREE from 'three';

const palette = {
  grass: 0x92bd65, grassLight: 0xa5c773, darkLeaf: 0x4f8d58, leaf: 0x70a65d,
  leafLight: 0x9cc776, bark: 0x94724c, sand: 0xedd6a0, path: 0xf1deb1,
  rock: 0xc8c5a1, wood: 0xad8157, fence: 0xf3e0b4,
};
const materials = new Map();
const mat = (color, opts = {}) => {
  const k = color + JSON.stringify(opts);
  if (!materials.has(k)) materials.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.95, ...opts }));
  return materials.get(k);
};
function mesh(geo, color, parent, x = 0, y = 0, z = 0, opts) {
  const m = new THREE.Mesh(geo, mat(color, opts));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}
function ball(parent, x, y, z, r, color, sx = 1, sy = 1, sz = 1) {
  const m = mesh(new THREE.SphereGeometry(r, 10, 7), color, parent, x, y, z);
  m.scale.set(sx, sy, sz); return m;
}
function box(parent, x, y, z, w, h, d, color) {
  return mesh(new THREE.BoxGeometry(w, h, d), color, parent, x, y, z);
}
function cylinder(parent, x, y, z, r1, r2, h, color, segments = 12) {
  return mesh(new THREE.CylinderGeometry(r1, r2, h, segments), color, parent, x, y, z);
}
function seeded(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const rand = seeded(4289);
const creekControlPoints = [[12, -7], [13, -4], [12, -1], [10.7, 3.2]];

function flatShape(parent, points, color, y) {
  const s = new THREE.Shape();
  points.forEach((p, i) => i ? s.lineTo(p[0], -p[1]) : s.moveTo(p[0], -p[1]));
  s.closePath();
  const m = mesh(new THREE.ShapeGeometry(s, 60), color, parent);
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.castShadow = false;
  return m;
}
function ellipsePoints(cx, cz, rx, rz, count = 90, organic = 0) {
  return Array.from({ length: count }, (_, i) => {
    const a = i / count * Math.PI * 2;
    const noise = 1 + organic * (Math.sin(a * 3 + 1) + Math.cos(a * 5) * .4);
    return [cx + Math.cos(a) * rx * noise, cz + Math.sin(a) * rz * noise];
  });
}
function path(parent, points, width, color = palette.path, y = .11) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, y, z)));
  const pts = curve.getPoints(70), positions = [], indices = [];
  pts.forEach((p, i) => {
    const t = curve.getTangent(i / 70), n = new THREE.Vector3(-t.z, 0, t.x).multiplyScalar(width / 2);
    positions.push(p.x + n.x, p.y, p.z + n.z, p.x - n.x, p.y, p.z - n.z);
    if (i < 70) { const k = i * 2; indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals();
  const m = mesh(g, color, parent); m.castShadow = false;
  return m;
}

function makeTree(parent, x, z, scale = 1, kind = 'round') {
  const g = new THREE.Group(); g.position.set(x, .08, z); g.scale.setScalar(scale); parent.add(g);
  cylinder(g, 0, 1.0, 0, .17, .27, 2, palette.bark, 7);
  if (kind === 'pine') {
    [1.5, 2.3, 3.0].forEach((y, i) => mesh(new THREE.ConeGeometry(1.05 - .18 * i, 1.65, 7), [0x518d6b, 0x669e73, 0x81af7e][i], g, 0, y, 0));
  } else {
    ball(g, 0, 2.55, 0, 1.2, palette.leaf, 1.0, 1.1, 1);
    ball(g, -.55, 2.45, .1, .87, palette.darkLeaf);
    ball(g, .57, 2.8, .13, .89, palette.leafLight);
    ball(g, -.08, 3.27, -.1, .77, palette.leafLight);
    if (kind === 'fruit') for (let i = 0; i < 6; i++) {
      const a = i * 2.4;
      ball(g, Math.sin(a) * .88, 2.28 + (i % 3) * .33, Math.cos(a) * .88, .15, 0xe7794e);
    }
  }
  return g;
}
function makeBush(parent, x, z, size = 1, color = palette.leaf) {
  const g = new THREE.Group(); parent.add(g); g.position.set(x, .1, z); g.scale.setScalar(size);
  ball(g, 0, .38, 0, .65, color, 1, .9, 1);
  ball(g, .45, .27, .1, .4, palette.leafLight);
  return g;
}
function flower(parent, x, z, color = 0xf8d979, scale = 1) {
  const g = new THREE.Group(); parent.add(g); g.position.set(x, .1, z); g.scale.setScalar(scale);
  cylinder(g, 0, .23, 0, .025, .03, .46, 0x65924d, 5);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    ball(g, Math.cos(a) * .12, .48, Math.sin(a) * .12, .105, color, 1, .5, 1);
  }
  ball(g, 0, .51, 0, .075, 0xe9b851, 1, .7, 1);
  return g;
}
function fence(parent, x1, z1, x2, z2) {
  const length = Math.hypot(x2 - x1, z2 - z1);
  const g = new THREE.Group(); parent.add(g); g.position.set((x1 + x2) / 2, .09, (z1 + z2) / 2);
  g.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
  const n = Math.max(2, Math.ceil(length / 1.0));
  for (let i = 0; i <= n; i++) {
    const x = (i / n - .5) * length;
    box(g, x, .49, 0, .15, .98, .15, palette.fence);
    mesh(new THREE.ConeGeometry(.13, .15, 4), palette.fence, g, x, 1.055, 0).rotation.y = Math.PI / 4;
  }
  box(g, 0, .43, 0, length + .05, .13, .1, palette.fence);
  box(g, 0, .79, 0, length + .05, .13, .1, palette.fence);
}

function makeBench(parent, x, z, rotation = 0) {
  const g = new THREE.Group(); parent.add(g); g.position.set(x, .09, z); g.rotation.y = rotation;
  for (let i = 0; i < 3; i++) box(g, 0, .55, -.26 + i * .22, 1.65, .1, .17, palette.wood);
  for (const side of [-.62, .62]) {
    box(g, side, .27, 0, .1, .55, .45, 0x53705c);
    box(g, side, .86, -.3, .08, .65, .09, 0x53705c);
  }
  for (let i = 0; i < 2; i++) box(g, 0, .85 + i * .21, -.34, 1.65, .14, .09, palette.wood);
}

function makeFarm(parent, interactives) {
  const farm = new THREE.Group(); parent.add(farm); farm.position.set(-7.8, .08, 8.5);
  box(farm, 0, .025, 0, 6.8, .07, 5.7, 0xb69663);
  for (const [x, z, w, d] of [[-3.45, 0, .16, 5.85], [3.45, 0, .16, 5.85], [0, -2.9, 7.0, .16], [0, 2.9, 7.0, .16]]) box(farm, x, .1, z, w, .17, d, palette.wood);
  const plants = [];
  for (let row = 0; row < 4; row++) {
    const z = (row - 1.5) * 1.2;
    box(farm, 0, .09, z, 6.5, .12, .75, row % 2 ? 0x916644 : 0x9c714a);
    for (let col = 0; col < 7; col++) {
      const x = (col - 3) * .87;
      const plant = new THREE.Group(); farm.add(plant); plant.position.set(x, .17, z);
      if (row < 2) {
        cylinder(plant, 0, .05, 0, .14, .03, .28, 0xea9149, 7);
        for (let j = 0; j < 4; j++) {
          const l = ball(plant, Math.sin(j * 2.4) * .1, .3, Math.cos(j * 2.4) * .1, .14, j % 2 ? 0x73a355 : 0x55894c, .52, 2, .4);
          l.rotation.z = Math.sin(j * 2.4) * .5;
        }
      } else if (row === 2) {
        ball(plant, 0, .24, 0, .32, 0x85ad67, 1, .75, 1);
        for (let j = 0; j < 4; j++) ball(plant, Math.sin(j * 1.57) * .18, .27, Math.cos(j * 1.57) * .18, .2, 0xa8c27e, .8, .8, .75);
      } else {
        ball(plant, 0, .22, 0, .32, 0xe9a449, 1.1, .75, 1);
        cylinder(plant, 0, .5, 0, .045, .07, .17, 0x63834d, 6);
      }
      plant.userData.plant = true; plants.push(plant);
    }
  }
  // Scarecrow, seed sack, and watering can make the garden feel lived in.
  const sc = new THREE.Group(); sc.position.set(-2.9, 0, -3.3); farm.add(sc);
  cylinder(sc, 0, .8, 0, .05, .07, 1.6, palette.wood, 6);
  const arms = box(sc, 0, 1.24, 0, 1.23, .14, .14, palette.wood); arms.rotation.z = -.07;
  mesh(new THREE.ConeGeometry(.36, .6, 6), 0x7697a0, sc, 0, 1.08, 0);
  ball(sc, 0, 1.65, 0, .24, 0xf0d0a0);
  cylinder(sc, 0, 1.86, 0, .4, .4, .06, 0xe3bd6e);
  cylinder(sc, 0, 1.98, 0, .18, .26, .22, 0xe3bd6e);
  for (const x of [-.08, .08]) ball(sc, x, 1.68, .213, .026, 0x523f39);
  ball(sc, 0, 1.59, .235, .038, 0xc37b5b);
  ball(farm, 4, .36, -1.3, .42, 0xe4c991, .75, 1.1, .7);
  cylinder(farm, 4, .28, 0, .25, .3, .46, 0x699da0);
  const spout = cylinder(farm, 4.33, .34, 0, .06, .09, .5, 0x699da0); spout.rotation.z = -1.0;
  fence(parent, -11.6, 5.1, -11.6, 11.5);
  fence(parent, -11.6, 11.6, -4.1, 11.6);
  interactives.push({ type: 'farm', root: farm, plants, position: new THREE.Vector3(-7.8, 1.0, 8.5) });
  return plants;
}

function makePond(parent, animated) {
  const cx = 10.1, cz = 5.6;
  flatShape(parent, ellipsePoints(cx, cz, 5.1, 3.75, 96, .08), 0xd8cd99, .10);
  const water = flatShape(parent, ellipsePoints(cx, cz, 4.83, 3.5, 96, .08), 0x69babc, .145);
  water.material = new THREE.MeshStandardMaterial({ color: 0x64bdbe, roughness: .24, metalness: .12, transparent: true, opacity: .91 });
  // A creek flows into the pond under a little footbridge.
  path(parent, creekControlPoints, 1.9, 0xd8cd99, .1);
  path(parent, creekControlPoints, 1.52, 0x6abbbc, .13);
  const bridge = new THREE.Group(); parent.add(bridge); bridge.position.set(12.2, .18, -.5);
  for (let i = 0; i < 15; i++) {
    const x = (i / 14 - .5) * 4.3, arch = .38 * Math.sin(i / 14 * Math.PI);
    box(bridge, x, .16 + arch, 0, .27, .16, 1.65, i % 2 ? 0xbb8b55 : 0xc79861);
    if (i % 3 === 0 || i === 14) for (const z of [-.79, .79]) {
      box(bridge, x, .59 + arch, z, .11, 1.0, .11, 0x9b7049);
      ball(bridge, x, 1.11 + arch, z, .1, 0xebce92);
    }
  }
  for (const z of [-.79, .79]) {
    const curve = new THREE.CatmullRomCurve3(Array.from({length: 16}, (_, i) => new THREE.Vector3((i / 15 - .5) * 4.3, .99 + .38 * Math.sin(i / 15 * Math.PI), z)));
    mesh(new THREE.TubeGeometry(curve, 20, .065, 5, false), 0xad8050, bridge);
  }
  // Fishing jetty.
  const dock = new THREE.Group(); parent.add(dock); dock.position.set(6.1, .2, 6);
  for (let i = 0; i < 9; i++) box(dock, i * .3, .12, 0, .25, .13, 1.42, i % 2 ? 0xb78e60 : 0xc09a6e);
  for (const x of [0, 2.4]) for (const z of [-.64, .64]) cylinder(dock, x, .02, z, .07, .08, .65, 0x97724c, 6);
  // Painted glimmers and animated concentric ripples.
  for (let i = 0; i < 15; i++) {
    const x = cx + (rand() - .5) * 7.2, z = cz + (rand() - .5) * 4.5;
    const ripple = mesh(new THREE.TorusGeometry(.17 + rand() * .24, .014, 4, 28), 0xc7ece0, parent, x, .17, z, { transparent: true, opacity: .48 });
    ripple.rotation.x = Math.PI / 2; ripple.castShadow = false;
    animated.ripples.push({ mesh: ripple, phase: rand() * 6.28, speed: .3 + rand() * .4 });
  }
  for (let i = 0; i < 8; i++) {
    const a = i * 2.399, x = cx + Math.cos(a) * (3.3 + rand() * .7), z = cz + Math.sin(a) * 2.3;
    const pad = cylinder(parent, x, .18, z, .28 + rand() * .17, .28, .025, 0x719866, 14); pad.castShadow = false;
    if (i % 2 === 0) {
      const bloom = new THREE.Group(); parent.add(bloom); bloom.position.set(x, .22, z);
      for (let p = 0; p < 6; p++) {
        const petal = ball(bloom, Math.sin(p * 1.047) * .08, .07, Math.cos(p * 1.047) * .08, .1, 0xf1aab3, .75, 1.4, .8);
        petal.rotation.z = Math.sin(p * 1.047) * .45;
      }
      ball(bloom, 0, .12, 0, .07, 0xf6d985);
    }
  }
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * Math.PI * 2, r = .85 + rand() * .4;
    ball(parent, cx + Math.cos(a) * 5.12, .20, cz + Math.sin(a) * 3.74, .26, i % 3 ? 0xc6c5a1 : 0xe0d3ad, r, .7, 1);
  }
  for (let i = 0; i < 4; i++) {
    const duck = new THREE.Group(); parent.add(duck);
    ball(duck, 0, .17, 0, .23, i ? 0xf3dc87 : 0xfff0d2, 1, .85, 1.45);
    ball(duck, 0, .4, .15, .14, i ? 0xf3dc87 : 0xfff0d2);
    ball(duck, 0, .37, .3, .07, 0xe7a557, 1, .5, 1.5);
    for (const side of [-1, 1]) ball(duck, side * .11, .43, .22, .017, 0x493d37);
    animated.ducks.push({ mesh: duck, phase: i * .55, radius: i ? 1.5 : 1.9 });
  }
  return water;
}

function makeLamp(parent, x, z, lights) {
  const g = new THREE.Group(); parent.add(g); g.position.set(x, .08, z);
  cylinder(g, 0, .1, 0, .25, .29, .2, 0xb8b394, 8);
  cylinder(g, 0, 1.0, 0, .06, .1, 1.85, 0x638b75, 8);
  cylinder(g, 0, 1.93, 0, .25, .22, .14, 0x638b75, 8);
  const bulb = ball(g, 0, 2.17, 0, .21, 0xffe7a0, .9, 1.3, .9);
  bulb.material = new THREE.MeshStandardMaterial({ color: 0xffebba, emissive: 0xffbe5f, emissiveIntensity: .15, roughness: .4 });
  mesh(new THREE.ConeGeometry(.31, .29, 8), 0x638b75, g, 0, 2.49, 0);
  const light = new THREE.PointLight(0xffd790, 0, 5.8, 2); light.position.y = 2.1; g.add(light);
  lights.push({ light, bulb });
}

export function createLandscape() {
  const root = new THREE.Group();
  const animated = { ripples: [], ducks: [], clouds: [], butterflies: [], plants: [] };
  const lights = [], interactives = [], trees = [];
  const island = ellipsePoints(0, 0, 20, 15.8, 100, .025);
  const shape = new THREE.Shape();
  island.forEach(([x, z], i) => i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)); shape.closePath();
  const base = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 1.9, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .5, bevelThickness: .4 }), [mat(0x96bd6c), mat(0xbfa679)]);
  base.rotation.x = -Math.PI / 2; base.position.y = -2.28; base.castShadow = true; base.receiveShadow = true; root.add(base);
  flatShape(root, island, palette.grass, .04);
  // Grass patches soften the toy-island geometry.
  [[-10,-5,5,4],[9,-7,4.6,4.5],[-14,3,3,4],[1,10,3.5,3],[6,11,2.8,2.6]].forEach(([x,z,rx,rz],i) => flatShape(root, ellipsePoints(x,z,rx,rz,40,.08), i % 2 ? 0x9cc371 : 0x8eb962, .06));
  flatShape(root, ellipsePoints(0, 0, 4.15, 3.9, 96), 0xcbb783, .075);
  flatShape(root, ellipsePoints(0, 0, 3.94, 3.7, 96), 0xf0deb5, .095);
  path(root, [[0,-2],[0,-4.3],[0,-8]], 2.9);
  path(root, [[-2,1],[-5,1.6],[-8.9,3.1]], 2.2);
  path(root, [[-1,2],[-3.4,5],[-3,9.1],[-1.5,12.4]], 1.75);
  path(root, [[2.3,1.7],[4.6,3.8],[5.8,6.2]], 1.8);
  path(root, [[2.5,-1.2],[5.9,-2.2],[8.8,-2.8],[12,-.5],[15.2,-.3]], 1.8);
  path(root, [[-3,-1.5],[-7,-3.7],[-12.5,-5.2]], 1.5);
  // Occasional embedded paving stones, kept low and warm.
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2;
    const p = box(root, Math.cos(a) * 3.52, .11, Math.sin(a) * 3.32, .42, .035, .26, i % 2 ? 0xe1c99a : 0xf7e7c4);
    p.rotation.y = -a;
  }
  animated.plants = makeFarm(root, interactives);
  const water = makePond(root, animated);
  // Boundary orchard: varied sizes make a silhouette, with an open foreground.
  const treePositions = [
    [-17,-3,1.2],[-16,-7,1.0],[-13,-10,1.1],[-9,-12,1.1],[-5,-13,1.1],
    [3.7,-12.9,1.0],[7,-12,1.3],[10,-11,1.1],[14,-8,1.35],[16,-5,1.15],
    [17.4,0,1.1],[17,4,1.0],[14.7,10,.95],[10,12.1,.9],[5,13.2,.8],
    [-16,3.1,1.15],[-14,7.8,.9],[-12,11.6,.8],[-8.5,-5.8,.75],[-4.6,-8.1,.8],
  ];
  treePositions.forEach(([x,z,s],i) => { makeTree(root,x,z,s,i % 5 === 0 ? 'pine' : i % 3 === 0 ? 'fruit' : 'round'); trees.push({ x, z, r: .4 * s }); });
  [[-13.8,2],[-14.5,3],[-12.7,-1],[-6,-11],[11,-9],[16.2,7.2],[14.5,10],[10,11.6],[5.5,10.9],[2,12.5],[-.5,12.3],[-14,7.3],[-6,-4.2]].forEach(([x,z],i) => makeBush(root,x,z,.7 + i % 3 * .17));
  const flowerGroups = [[-13,3],[-6,4.2],[-3.6,-3.3],[3.6,-3.6],[4,8.9],[14,9.4],[-12,9],[-1,10.5],[9.3,-8.9],[-14.8,-2]];
  flowerGroups.forEach(([x,z], group) => {
    for (let i = 0; i < 7; i++) {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * .9;
      flower(root, x + Math.cos(a) * r, z + Math.sin(a) * r, [0xfff0be,0xe9a4af,0xe9c36c,0xc5b3d0][group % 4], .65 + rand() * .55);
    }
  });
  // A small red-capped mushroom cluster under the orchard.
  for (const [x,z] of [[-14,4.5],[-14.4,4.3],[15,5.8],[15.4,6.1]]) {
    cylinder(root,x,.25,z,.075,.1,.36,0xf4e5bb,8);
    const cap = ball(root,x,.44,z,.28,0xdd7255,1,.5,1);
    ball(root,x+.08,.53,z+.05,.052,0xffedce,1,.4,1);
  }
  fence(root,-13.2,-.9,-13.2,1.3); fence(root,-12.5,4,-10.9,4);
  fence(root,-6.7,3.8,-5.5,3.8);
  makeBench(root,-3.1,-.65,Math.PI/2); makeBench(root,3.7,-1.4,-Math.PI/2);
  makeBench(root,14,8.4,-.8);
  [[-2.1,-4.5],[2.1,-4.5],[-5.3,2.8],[4.9,4.1],[8.4,-3.8],[-3.6,10.4],[14.3,-.8]].forEach(([x,z]) => makeLamp(root,x,z,lights));
  // Little pebbles along the front edge expose the island as a collectible diorama.
  for (let i = 0; i < 21; i++) {
    const a = .1 + i / 20 * Math.PI * .91;
    ball(root, Math.cos(a) * 18.9, -.9 + rand() * .7, Math.sin(a) * 15, .18 + rand()*.2, i % 2 ? 0xd7bf8e : 0xae966a, 1.4,.8,1);
  }
  // Puffy distant clouds live in the scene, so orbiting keeps their parallax.
  [[-23,12,-18,1.5],[20,13,-21,1.8],[-28,8,4,1.1],[26,9,8,1.2],[1,15,-28,1.4]].forEach(([x,y,z,s],i) => {
    const cloud = new THREE.Group(); cloud.position.set(x,y,z); cloud.scale.setScalar(s); root.add(cloud);
    [[0,0,0,1.5],[-1.3,-.2,0,1],[1.4,-.15,0,1.1],[-.4,.5,0,1.15]].forEach(([a,b,c,r]) => {
      const puff = ball(cloud,a,b,c,r,0xfffbeb,1,.65,.8); puff.castShadow = false; puff.receiveShadow = false;
    });
    animated.clouds.push({mesh:cloud,x,phase:i});
  });
  // Three animated butterflies with paired wings.
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Group(); root.add(b);
    const left = ball(b,-.075,0,0,.14,[0xf3dd8a,0xecd3e2,0xf2af91][i%3],.8,.1,1);
    const right = ball(b,.075,0,0,.14,[0xf3dd8a,0xecd3e2,0xf2af91][i%3],.8,.1,1);
    cylinder(b,0,0,0,.018,.018,.15,0x76794e,5).rotation.x=Math.PI/2;
    animated.butterflies.push({mesh:b,left,right,phase:i*1.9,x:[-6,5,-11,13,1][i],z:[5,8,3,8,-4][i]});
  }
  const creek = new THREE.CatmullRomCurve3(creekControlPoints.map(([x,z]) => new THREE.Vector3(x,0,z))).getPoints(70);
  return { root, animated, lights, interactives, trees, water, creek };
}

export function updateLandscape(world, t) {
  world.animated.ripples.forEach(({mesh,phase,speed}) => {
    const p = ((t * speed + phase) % 3) / 3;
    mesh.scale.setScalar(.4 + p * 2.0); mesh.material.opacity = Math.sin(p * Math.PI) * .36;
  });
  world.animated.ducks.forEach(({mesh,phase,radius}) => {
    const a = t * .15 + phase;
    mesh.position.set(10.3 + Math.cos(a) * radius, .16 + Math.sin(t * 2 + phase) * .025, 5.4 + Math.sin(a) * radius * .6);
    mesh.rotation.y = -a;
  });
  world.animated.clouds.forEach(({mesh,x,phase}) => { mesh.position.x = x + Math.sin(t*.035+phase)*1.6; });
  world.animated.butterflies.forEach(({mesh,left,right,phase,x,z}) => {
    mesh.position.set(x+Math.sin(t*.43+phase)*1.2,1.25+Math.sin(t*1.2+phase)*.35,z+Math.cos(t*.39+phase)*.8);
    mesh.rotation.y=-t*.43-phase; left.rotation.z=Math.sin(t*15+phase)*1.0; right.rotation.z=-Math.sin(t*15+phase)*1.0;
  });
}
