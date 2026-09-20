import * as THREE from 'three';

// The hall is a roofless room for the panorama camera. Textures belong to this
// scene, so releasing a room also releases its canvases and GPU resources.
export function createCastleHallScene() {
  const root = new THREE.Group(); root.name = '城堡大厅';
  const materials = new Map(), geometries = new Map();
  const P = {
    stone: 0xd6c8ad, light: 0xeee0c1, mortar: 0xa89988, inset: 0xc1b397,
    relief: 0xe0d4b8, gold: 0xdca62b, goldLight: 0xf3c84a,
    pink: 0xe77587, blush: 0xf09aab, darkPink: 0xc85172,
    coral: 0xd96667, coralLight: 0xe98678, mint: 0x8cb7a3,
    green: 0x468a62, blue: 0x64c5df, wood: 0xb58a49,
  };
  const material = (color, extra = {}) => {
    const key = color + JSON.stringify(extra);
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color, roughness: .82, ...extra}));
    return materials.get(key);
  };
  const geometry = (key, create) => {
    if (!geometries.has(key)) geometries.set(key, create());
    return geometries.get(key);
  };
  const put = (parent, geo, color, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, color.isMaterial ? color : material(color));
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
  };
  const group = (parent, x = 0, y = 0, z = 0) => {
    const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g;
  };
  const box = (p, x, y, z, w, h, d, c) => {
    const m = put(p, geometry('box', () => new THREE.BoxGeometry(1, 1, 1)), c, x, y, z); m.scale.set(w, h, d); return m;
  };
  const ball = (p, x, y, z, a, b, c, color) => {
    const m = put(p, geometry('ball', () => new THREE.SphereGeometry(1, 16, 10)), color, x, y, z); m.scale.set(a, b, c); return m;
  };
  const cylinder = (p, x, y, z, top, bottom, h, color, n = 16) => put(p,
    geometry(`c${top},${bottom},${h},${n}`, () => new THREE.CylinderGeometry(top, bottom, h, n)), color, x, y, z);
  const tube = (p, points, radius, color, segments = 28) => {
    const curve = new THREE.CatmullRomCurve3(points.map(v => new THREE.Vector3(...v)));
    return put(p, new THREE.TubeGeometry(curve, segments, radius, 5, false), color);
  };
  const beam = (p, a, b, radius, color) => {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), delta = bv.clone().sub(av);
    const m = put(p, geometry('beam', () => new THREE.CylinderGeometry(1, 1, 1, 8)), color);
    m.position.copy(av.add(bv).multiplyScalar(.5)); m.scale.set(radius, delta.length(), radius);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return m;
  };
  const archShape = (w, h) => {
    const s = new THREE.Shape(), r = w / 2;
    s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.closePath(); return s;
  };
  const archPanel = (p, x, y, z, w, h, depth, c) => put(p,
    geometry(`a${w},${h},${depth}`, () => new THREE.ExtrudeGeometry(archShape(w, h), {depth, bevelEnabled: false, curveSegments: 20})), c, x, y, z);
  const archRing = (p, x, y, z, w, h, thickness, depth, c) => {
    const r = w / 2, inner = r - thickness, spring = h - r, s = new THREE.Shape();
    s.moveTo(-r, 0); s.lineTo(-r, spring); s.absarc(0, spring, r, Math.PI, 0, true);
    s.lineTo(r, 0); s.lineTo(inner, 0); s.lineTo(inner, spring);
    s.absarc(0, spring, inner, 0, Math.PI, false); s.lineTo(-inner, 0); s.closePath();
    return put(p, new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: false, curveSegments: 24}), c, x, y, z);
  };
  const spiral = (p, x, y, z, r, color, direction = 1, plane = 'wall', thick = .04) => {
    const points = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28, a = direction * (t * Math.PI * 2.2 - Math.PI / 2), rr = r * (1 - .85 * t);
      points.push(plane === 'floor' ? [x + Math.cos(a) * rr, y, z + Math.sin(a) * rr] : [x + Math.cos(a) * rr, y + Math.sin(a) * rr, z]);
    }
    return tube(p, points, thick, color, 28);
  };

  // Large, slightly mottled limestone slabs with the pale engraved M from the
  // reference. This small hand-drawn tile is repeated, not a scenery billboard.
  const tileCanvas = document.createElement('canvas'); tileCanvas.width = tileCanvas.height = 512;
  const ctx = tileCanvas.getContext('2d');
  ctx.fillStyle = '#d9cba9'; ctx.fillRect(0, 0, 512, 512);
  let seed = 71; const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
  for (let i = 0; i < 2300; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(245,232,193,.09)' : 'rgba(117,91,70,.035)';
    ctx.fillRect(random() * 512, random() * 512, 1 + random() * 6, 1 + random() * 3);
  }
  ctx.strokeStyle = '#a28b76'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, 508, 508);
  ctx.strokeStyle = '#eee0b8'; ctx.lineWidth = 5; ctx.strokeRect(8, 8, 496, 496);
  function drawEmblem(shift, color) {
    ctx.save(); ctx.translate(shift, shift); ctx.beginPath();
    ctx.moveTo(150, 357); ctx.bezierCurveTo(153, 270, 173, 206, 208, 161);
    ctx.lineTo(244, 143); ctx.bezierCurveTo(237, 171, 239, 209, 255, 250);
    ctx.bezierCurveTo(272, 208, 275, 173, 270, 143); ctx.lineTo(304, 157);
    ctx.bezierCurveTo(344, 205, 361, 272, 363, 357); ctx.lineTo(317, 357);
    ctx.bezierCurveTo(320, 289, 309, 237, 296, 211); ctx.lineTo(276, 292);
    ctx.lineTo(235, 292); ctx.lineTo(214, 211); ctx.bezierCurveTo(199, 258, 193, 307, 197, 357);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  drawEmblem(4, '#bfae8b'); drawEmblem(-1, '#e9dab3');
  const tileTexture = new THREE.CanvasTexture(tileCanvas); tileTexture.colorSpace = THREE.SRGBColorSpace; tileTexture.anisotropy = 2;
  const tileGeometry = new THREE.PlaneGeometry(2.2, 2.03);
  const tileMaterials = [0xffffff, 0xf9eed1, 0xe8ddc8, 0xf3e5c4].map(color => new THREE.MeshStandardMaterial({color, map: tileTexture, roughness: .96, bumpMap: tileTexture, bumpScale: .009}));
  box(root, 0, -.16, .33, 18.1, .30, 14.75, 0xb3a183);
  for (let row = 0; row < 7; row++) for (let col = 0; col < 8; col++) {
    const tile = put(root, tileGeometry, tileMaterials[(row * 3 + col * 7) % 4], (col - 3.5) * 2.2, .005, -5.93 + row * 2.03);
    tile.rotation.x = -Math.PI / 2; tile.castShadow = false;
  }

  // Thick back wall and shallow carved apses, all open to the front camera.
  box(root, 0, 4.17, -7.17, 18.2, 8.34, .50, P.stone);
  for (const side of [-1, 1]) {
    box(root, side * 9.04, 4.17, -2.35, .35, 8.34, 9.35, P.stone);
    box(root, side * 8.82, .30, -2.35, .21, .55, 9.35, P.gold);
    box(root, side * 8.81, .64, -2.35, .23, .10, 9.35, P.goldLight);
    box(root, side * 8.86, 8.19, -2.35, .47, .26, 9.48, P.light);
    for (let row = 0; row < 6; row++) for (let col = 0; col < 4; col++) {
      box(root, side * 8.85, 1.32 + row * 1.05, -5.84 + col * 2.09 + (row % 2) * .36, .022, .19, .35, 0xc2ad92);
    }
    const foregroundColumn = group(root, side * 8.96, 0, 2.26);
    box(foregroundColumn, 0, .31, 0, .85, .62, .90, P.mortar);
    box(foregroundColumn, 0, .66, 0, .85, .16, .88, P.gold);
    cylinder(foregroundColumn, 0, 4.22, 0, .31, .37, 6.98, P.light, 8);
    for (const y of [1.07, 5.75, 5.94, 7.65]) box(foregroundColumn, 0, y, 0, .75, .13, .81, P.mortar);
    box(foregroundColumn, 0, 7.98, 0, .88, .32, .93, P.light);
    for (const y of [1.55, 3.47, 6.54]) for (const offset of [-1, 1]) {
      const leaf = ball(foregroundColumn, offset * .11, y, .33, .07, .34, .03, P.goldLight); leaf.rotation.z = offset * .29;
    }
  }
  box(root, 0, .30, -6.79, 18.0, .55, .30, P.gold);
  box(root, 0, .63, -6.73, 18.0, .12, .40, P.goldLight);
  for (let i = 0; i < 36; i++) {
    const tri = put(root, geometry('gold-triangle', () => new THREE.ConeGeometry(.19, .28, 3)), i % 2 ? P.goldLight : 0xc19734, -8.75 + i * .50, .28, -6.54);
    tri.rotation.z = i % 2 ? Math.PI : 0; tri.scale.z = .30;
  }
  for (const [x, w] of [[-2.25, 4.20], [2.25, 4.20]]) {
    archPanel(root, x, .67, -6.87, w, 6.78, .13, P.inset);
    archRing(root, x, .67, -6.68, w - .13, 6.64, .16, .13, P.relief);
    archRing(root, x, .76, -6.49, w - .56, 6.22, .052, .06, 0xe8dcc0);
    // Sprouting leaf relief is geometry standing proud of the stone.
    tube(root, [[x, .85, -6.43], [x, 2.15, -6.43], [x + .07, 3.5, -6.43], [x, 4.4, -6.43]], .065, P.relief, 24);
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const leaf = ball(root, x + side * (.40 + i * .12), 1.65 + i * 1.0, -6.40, .24 + i * .025, .66 - i * .04, .10, P.relief);
      leaf.rotation.z = -side * (.47 + i * .10);
    }
    for (const [xx, yy, r, sign] of [[-.96, 4.7, .43, -1], [.94, 4.7, .43, 1], [-.5, 5.43, .34, -1], [.5, 5.43, .34, 1], [0, 5.93, .25, 1]]) spiral(root, x + xx, yy, -6.39, r, P.relief, sign, 'wall', .07);
    ball(root, x, 4.92, -6.37, .16, .23, .11, P.relief);
  }
  for (const x of [-8.86, -4.74, 4.74, 8.86]) {
    const col = group(root, x, 0, -6.33); col.name = 'Gold-trimmed stone pilaster';
    box(col, 0, .32, 0, .94, .64, .86, P.mortar);
    box(col, 0, .59, .025, .99, .16, .92, P.gold);
    box(col, 0, .89, 0, .75, .46, .68, P.stone);
    cylinder(col, 0, 4.45, -.02, .38, .44, 6.72, P.stone, 8);
    for (const y of [1.12, 5.9, 6.10, 7.64]) box(col, 0, y, 0, y === 6.1 ? .91 : .82, .13, .79, y === 1.12 ? P.gold : P.mortar);
    box(col, 0, 7.87, 0, 1.00, .28, .95, P.light);
    for (const y of [1.45, 3.75, 6.65]) for (const side of [-1, 1]) {
      const leaf = ball(col, side * .13, y, .345, .075, .40, .023, 0xe9c15d); leaf.rotation.z = side * .28;
    }
    box(col, .13, 2.8, .344, .20, .28, .018, 0xbda992);
    box(col, -.12, 5.05, .345, .17, .24, .018, 0xbca88f);
  }

  // Angled side door bays remain low in front, avoiding camera-obscuring walls.
  function doorway(x, yaw, study) {
    const g = group(root, x, 0, -4.93); g.rotation.y = yaw; g.name = study ? 'Stairway to the second floor study' : 'Wooden castle door';
    const bay = new THREE.Shape();
    bay.moveTo(-1.59, 0); bay.lineTo(-1.59, 5.36); bay.absarc(0, 5.36, 1.59, Math.PI, 0, true);
    bay.lineTo(1.59, 0); bay.lineTo(.95, 0); bay.lineTo(.95, 2.65); bay.absarc(0, 2.65, .95, 0, Math.PI, false); bay.lineTo(-.95, 0); bay.closePath();
    put(g, new THREE.ExtrudeGeometry(bay, {depth: .40, bevelEnabled: false, curveSegments: 24}), P.stone, 0, 0, -.25);
    archPanel(g, 0, .03, study ? -1.18 : .06, 1.9, 3.6, .02, study ? 0x5b393b : 0x765238);
    archRing(g, 0, .01, .075, 2.42, 4.12, .26, .30, P.mortar);
    archRing(g, 0, .02, .14, 2.33, 4.03, .20, .29, P.light);
    const radius = 1.08, spring = 2.88;
    for (let i = 0; i < 9; i++) {
      const a = i / 8 * Math.PI, b = box(g, Math.cos(a) * radius, spring + Math.sin(a) * radius, .47, .36, .28, .10, i % 2 ? 0xc6baa5 : 0xded3b9); b.rotation.z = a - Math.PI / 2;
    }
    if (study) {
      for (let i = 0; i < 5; i++) box(g, 0, .10 + i * .15, .42 - i * .28, 1.71, .19 + i * .3, .33, i % 2 ? 0xb96562 : 0xd78873);
      for (let i = 0; i < 5; i++) box(g, 0, .21 + i * .30, .59 - i * .28, 1.73, .045, .05, P.gold);
    } else {
      archPanel(g, 0, .08, .10, 1.78, 3.43, .10, P.wood);
      for (let i = 0; i < 6; i++) box(g, -.70 + i * .28, 1.43, .23, .017, 2.59, .035, 0x89673d);
      for (const side of [-1, 1]) {
        box(g, side * .43, 1.45, .265, .68, .14, .09, 0x718b98);
        ball(g, side * .16, 1.44, .35, .10, .13, .07, P.goldLight);
        spiral(g, side * .50, 2.25, .26, .29, 0xcb8951, side, 'wall', .075);
        spiral(g, side * .50, .80, .26, .29, 0xcb8951, -side, 'wall', .075);
      }
    }
    for (const side of [-1, 1]) box(g, side * 1.34, .33, -.16, .52, .63, .4, P.gold);
    return g;
  }
  doorway(-7.35, .31, false); doorway(7.35, -.31, true);

  // Soft fabric is a folded surface, with a physical gold-edged scalloped hem.
  function swag(p, left, right, y, z, depth = 1.12, color = P.pink) {
    const vertices = [], normals = [], uvs = [], indices = [], nx = 48, ny = 8;
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const u = i / nx, v = j / ny, dip = Math.sin(Math.PI * u);
      vertices.push(left + (right - left) * u, y - dip * depth * (.08 + v * .92) - .035 * v, z + Math.sin(u * Math.PI * 12) * .042 * (.2 + dip) + .14 * Math.sin(v * Math.PI));
      normals.push(0, 0, 1); uvs.push(u, v);
      if (i < nx && j < ny) { const a = j * (nx + 1) + i; indices.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(indices); geo.computeVertexNormals();
    put(p, geo, material(color, {side: THREE.DoubleSide}));
    for (const v of [.56, 1]) {
      const edge = [];
      for (let i = 0; i <= 48; i++) { const u = i / 48; edge.push([left + (right - left) * u, y - Math.sin(Math.PI * u) * depth * (.08 + v * .92) - .04, z + .08]); }
      tube(p, edge, v === 1 ? .033 : .017, v === 1 ? 0xf3b5a1 : 0xf7a4aa, 42);
    }
  }
  for (const [a, b] of [[-8.9, -4.75], [-4.75, 0], [0, 4.75], [4.75, 8.9]]) swag(root, a, b, 8.50, -6.02, 1.29);
  for (const side of [-1, 1]) {
    const curtain = group(root, side * 8.78, 0, 1.78); curtain.rotation.y = side * -.25;
    for (let i = 0; i < 7; i++) {
      const f = i / 6, m = cylinder(curtain, side * (.1 - f * .75), 6.73 - f * .44, .04 * Math.sin(f * 12), .14, .19, 3.49 + f * .7, i % 2 ? P.blush : P.pink, 10); m.rotation.z = side * .16;
    }
    tube(curtain, [[side * .2, 4.75, .15], [side * -.3, 4.46, .29], [side * -.74, 4.82, .17]], .05, P.goldLight);
    ball(curtain, side * -.46, 4.33, .23, .12, .24, .10, P.gold);
  }

  function lantern(x, y, z, scale = 1) {
    const g = group(root, x, y, z); g.scale.setScalar(scale); g.name = 'Cyan glass and gold hanging lantern';
    spiral(g, 0, .82, 0, .25, P.goldLight, 1, 'wall', .065);
    cylinder(g, 0, .31, 0, .40, .28, .24, P.gold, 6);
    cylinder(g, 0, -.20, 0, .28, .21, .72, material(P.blue, {roughness: .36, emissive: 0x255566, emissiveIntensity: .28}), 6);
    cylinder(g, 0, -.61, 0, .22, .10, .18, P.gold, 6);
    ball(g, 0, -.74, 0, .075, .11, .075, P.goldLight);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3; beam(g, [Math.sin(a) * .29, .17, Math.cos(a) * .29], [Math.sin(a) * .22, -.56, Math.cos(a) * .22], .026, P.goldLight);
    }
  }
  lantern(-4.73, 6.5, -5.42, 1.10); lantern(4.73, 6.5, -5.42, 1.10);
  lantern(8.10, 4.7, 2.8, .95);

  function lobedPlinth(rx, rz, y, height, color, name) {
    const s = new THREE.Shape();
    for (let i = 0; i <= 96; i++) {
      const a = i / 96 * Math.PI * 2, r = 1 + .040 * Math.cos(a * 6), x = Math.cos(a) * rx * r, z = Math.sin(a) * rz * r;
      if (i) s.lineTo(x, -z); else s.moveTo(x, -z);
    }
    s.closePath();
    const m = put(root, new THREE.ExtrudeGeometry(s, {depth: height, bevelEnabled: true, bevelSize: .045, bevelThickness: .025, bevelSegments: 1, curveSegments: 36}), color, 0, y, -3.75);
    m.rotation.x = -Math.PI / 2; m.name = name;
    const points = [];
    for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2, r = 1 + .04 * Math.cos(a * 6); points.push([Math.cos(a) * rx * r * .98, y + height + .018, -3.75 + Math.sin(a) * rz * r * .98]); }
    tube(root, points, .032, P.goldLight, 96);
  }
  lobedPlinth(3.44, 2.29, .07, .22, P.coral, 'Lobed coral lower throne step');
  lobedPlinth(3.13, 2.02, .30, .20, P.coralLight, 'Middle throne step');
  lobedPlinth(2.82, 1.72, .51, .19, P.coral, 'Upper gold-embroidered throne dais');
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5, x = Math.sin(a) * 2.22, z = -3.75 + Math.cos(a) * 1.31;
    spiral(root, x, .737, z, .22, P.goldLight, i % 2 ? 1 : -1, 'floor', .024);
    ball(root, x + .24, .739, z, .075, .019, .050, P.goldLight);
  }

  const throne = group(root, 0, .72, -4.15); throne.name = 'Mint and rose royal throne with gilded scrolls';
  cylinder(throne, 0, .50, 0, .97, .69, .92, P.mint, 20);
  cylinder(throne, 0, .07, 0, .72, .80, .13, P.gold, 20);
  for (let i = 0; i < 13; i++) {
    const a = i / 12 * Math.PI * 1.7 - Math.PI * .85;
    const flute = ball(throne, Math.sin(a) * .80, .45, Math.cos(a) * .80, .074, .34, .035, P.light); flute.rotation.y = a;
  }
  archPanel(throne, 0, .74, -.43, 1.64, 3.52, .28, P.gold);
  archPanel(throne, 0, .84, -.11, 1.47, 3.35, .10, P.light);
  archPanel(throne, 0, 1.11, .015, 1.15, 2.72, .09, P.darkPink);
  archPanel(throne, 0, 1.20, .13, 1.01, 2.50, .045, P.pink);
  ball(throne, 0, 1.03, .30, .85, .19, .69, P.darkPink);
  ball(throne, 0, 1.10, .35, .82, .17, .67, P.pink);
  for (const side of [-1, 1]) {
    tube(throne, [[side * .75, .63, .04], [side * 1.12, .90, .12], [side * 1.24, 1.45, .17]], .14, P.mint);
    ball(throne, side * 1.12, 1.50, .17, .54, .16, .42, P.darkPink);
    ball(throne, side * 1.12, 1.55, .19, .52, .13, .40, P.pink);
    spiral(throne, side * .86, 3.86, .19, .34, P.goldLight, -side, 'wall', .11);
    ball(throne, side * .88, 3.51, .18, .20, .27, .12, P.gold);
    for (let i = 0; i < 9; i++) ball(throne, side * (.49 - Math.max(0, i - 6) * .055), 1.44 + i * .238, .213, .027, .028, .022, 0xa6415a);
  }
  ball(throne, 0, 4.23, -.015, .39, .39, .33, material(0xb93b50, {roughness: .35}));
  ball(throne, -.13, 4.38, .276, .075, .09, .018, 0xf5c5c2);
  cylinder(throne, 0, 3.96, 0, .26, .30, .12, P.gold, 16);
  for (const [x, y] of [[-.25, 2.44], [.25, 2.44], [0, 1.53], [-.23, 3.26], [.23, 3.26]]) ball(throne, x, y, .219, .045, .062, .025, 0xb84b66);

  function flowerStand(x, z, scale = 1) {
    const g = group(root, x, 0, z); g.scale.setScalar(scale); g.name = 'Pink daisies in a spotted urn on a gold stand';
    cylinder(g, 0, .82, 0, .066, .082, 1.40, P.gold, 10);
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3;
      tube(g, [[0, .3, 0], [Math.sin(a) * .19, .23, Math.cos(a) * .19], [Math.sin(a) * .43, .09, Math.cos(a) * .43]], .055, P.goldLight, 12);
    }
    cylinder(g, 0, 1.40, 0, .48, .55, .15, P.pink, 24);
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8; ball(g, Math.sin(a) * .50, 1.31, Math.cos(a) * .50, .065, .12, .07, i % 2 ? P.blush : P.pink);
    }
    ball(g, 0, 1.70, 0, .34, .36, .30, P.blush);
    cylinder(g, 0, 1.98, 0, .23, .26, .15, P.pink, 18);
    for (let i = 0; i < 10; i++) {
      const a = i * 2.4; ball(g, Math.sin(a) * .29, 1.59 + (i % 3) * .11, Math.cos(a) * .26, .037, .047, .019, 0xffd8d7);
    }
    for (let i = 0; i < 9; i++) {
      const a = i * 2.399, r = .20 + (i % 3) * .12, xx = Math.sin(a) * r, zz = Math.cos(a) * r, yy = 2.26 + (i % 4) * .11;
      beam(g, [0, 1.95, 0], [xx, yy, zz], .018, 0x5b9457);
      const leaf = ball(g, xx * .57, 2.07 + i % 2 * .12, zz * .57, .14, .045, .08, i % 2 ? 0x64964d : 0x83b95b); leaf.rotation.z = a;
      const flower = group(g, xx, yy, zz); flower.rotation.x = -.42; flower.rotation.z = a * .12;
      for (let k = 0; k < 7; k++) { const ang = k * Math.PI * 2 / 7; const petal = ball(flower, Math.sin(ang) * .115, Math.cos(ang) * .115, 0, .056, .115, .032, [0xffd9d6, 0xf482aa, 0xffedc9][i % 3]); petal.rotation.z = -ang; }
      ball(flower, 0, 0, .036, .078, .078, .035, P.goldLight);
    }
    return g;
  }
  flowerStand(-3.68, -4.83, 1.07); flowerStand(3.68, -4.83, 1.07); flowerStand(7.64, 4.44, 1.08);

  function quill(p, x, y, z, lean = -.28) {
    const ink = group(p, x, y, z);
    ball(ink, 0, .07, 0, .16, .09, .14, 0x42758c); cylinder(ink, 0, .18, 0, .075, .10, .17, 0x365d76, 12);
    beam(ink, [0, .20, 0], [lean, .96, 0], .015, 0xdacba4);
    for (let i = 0; i < 6; i++) {
      const f = i / 6, feather = ball(ink, lean * (.42 + .58 * f), .48 + f * .45, 0, .064 * (1 - f * .45), .15, .022, i % 2 ? 0xdde8db : 0xf3f0de); feather.rotation.z = -lean * 2;
    }
  }
  const sideTable = group(root, -6.15, 0, -2.18); sideTable.rotation.y = .13; sideTable.name = 'Pink side table and framed portrait';
  for (const x of [-.92, .92]) for (const z of [-.37, .37]) tube(sideTable, [[x, .99, z], [x * 1.04, .55, z * 1.10], [x * 1.13, .17, z * 1.12], [x * .97, .09, z * 1.15]], .105, P.gold, 14);
  box(sideTable, 0, 1.05, 0, 2.40, .12, 1.30, P.goldLight);
  box(sideTable, 0, 1.13, 0, 2.43, .08, 1.34, P.pink);
  for (let i = 0; i < 12; i++) {
    const x = -1.14 + i * .207; box(sideTable, x, .89, .66, .21, .43, .09, i % 3 ? P.pink : P.blush); ball(sideTable, x, .68, .67, .12, .077, .06, P.pink);
  }
  tube(sideTable, [[-1.2, .77, .72], [-.6, .67, .74], [0, .76, .74], [.6, .68, .74], [1.2, .77, .72]], .035, P.goldLight);
  const portrait = group(sideTable, -.10, 1.20, -.50); portrait.rotation.x = -.10;
  box(portrait, 0, .94, 0, 1.53, 1.91, .12, P.gold);
  box(portrait, 0, .95, .077, 1.34, 1.70, .06, 0x399065);
  for (const side of [-1, 1]) { box(portrait, side * .74, .94, .115, .07, 1.94, .08, P.goldLight); box(portrait, 0, .94 + side * .91, .115, 1.5, .06, .08, P.goldLight); }
  ball(portrait, 0, 2.04, .025, .46, .44, .10, P.gold);
  ball(portrait, 0, 2.05, .145, .32, .31, .03, 0x6eb35a);
  spiral(portrait, 0, 2.05, .19, .20, 0xbbe39a, 1, 'wall', .023);
  // A little painted-style relief character belongs to the portrait frame.
  ball(portrait, .20, .60, .16, .29, .39, .05, 0xf8c446);
  ball(portrait, .16, 1.12, .17, .34, .35, .05, 0xf9dda1);
  ball(portrait, .16, 1.03, .23, .16, .14, .035, 0xd95042);
  for (const x of [.02, .27]) ball(portrait, x, 1.24, .23, .034, .065, .02, 0x493c35);
  ball(portrait, -.35, .99, .15, .23, .16, .033, 0x73b947); ball(portrait, -.47, 1.30, .15, .16, .12, .033, 0x4fa149);
  quill(sideTable, -.80, 1.19, .30, -.22);
  const paper = box(sideTable, .38, 1.188, .20, .85, .018, .61, P.light); paper.rotation.y = -.10;
  for (let i = 0; i < 3; i++) box(sideTable, .40, 1.202, .08 + i * .08, .48, .004, .010, 0xb7a489);

  const lectern = group(root, -3.95, 0, -2.68); lectern.rotation.y = .16; lectern.name = 'Green gilded book on an oak lectern';
  box(lectern, 0, .09, 0, .91, .18, .66, 0x976b3c); cylinder(lectern, 0, .77, 0, .075, .09, 1.38, P.wood, 10);
  const bookRest = group(lectern, 0, 1.45, 0); bookRest.rotation.x = .41;
  box(bookRest, 0, 0, 0, 1.02, .10, .79, P.gold); box(bookRest, 0, .07, 0, .83, .08, .68, 0xdccb92); box(bookRest, 0, .125, 0, .85, .028, .73, 0x388354);
  for (const x of [-.35, .35]) box(bookRest, x, .145, 0, .025, .014, .61, P.goldLight);
  for (const z of [-.30, .30]) box(bookRest, 0, .145, z, .70, .014, .025, P.goldLight);
  const bookSeal = cylinder(bookRest, 0, .151, -.06, .15, .15, .014, P.gold, 24);
  cylinder(bookRest, 0, .165, -.06, .12, .12, .008, 0x438960, 24);
  box(bookRest, 0, .149, .21, .33, .014, .016, P.goldLight);

  function curvedCounterShape(outerX, outerZ, innerX, innerZ) {
    const s = new THREE.Shape(), start = -1.34, end = 1.34;
    for (let i = 0; i <= 40; i++) { const a = start + (end - start) * i / 40, x = Math.sin(a) * outerX, z = Math.cos(a) * outerZ; if (i) s.lineTo(x, -z); else s.moveTo(x, -z); }
    for (let i = 40; i >= 0; i--) { const a = start + (end - start) * i / 40; s.lineTo(Math.sin(a) * innerX, -Math.cos(a) * innerZ); }
    s.closePath(); return s;
  }
  const desk = group(root, 6.26, 0, .75); desk.rotation.y = -.15; desk.name = 'Curved reception desk with pink swags and bows';
  const counterPart = (rx, rz, ix, iz, y, h, c) => { const m = put(desk, new THREE.ExtrudeGeometry(curvedCounterShape(rx, rz, ix, iz), {depth: h, bevelEnabled: false, curveSegments: 28}), c, 0, y, 0); m.rotation.x = -Math.PI / 2; return m; };
  counterPart(2.09, 1.11, 1.55, .65, .11, 1.25, P.wood);
  counterPart(2.15, 1.15, 1.49, .59, .09, .12, P.gold);
  counterPart(2.22, 1.23, 1.44, .53, 1.38, .15, P.light);
  const counterLine = [];
  for (let i = 0; i <= 48; i++) { const a = -1.34 + i / 48 * 2.68; counterLine.push([Math.sin(a) * 2.19, 1.40, Math.cos(a) * 1.20]); }
  tube(desk, counterLine, .034, P.goldLight, 48);
  for (let i = 0; i <= 10; i++) {
    const a = -1.27 + i / 10 * 2.54; beam(desk, [Math.sin(a) * 2.09, .25, Math.cos(a) * 1.11], [Math.sin(a) * 2.09, 1.26, Math.cos(a) * 1.11], .027, P.gold);
  }
  for (let seg = 0; seg < 3; seg++) {
    const points = [], from = -1.26 + seg * .84;
    for (let i = 0; i <= 24; i++) { const t = i / 24, a = from + t * .84; points.push([Math.sin(a) * 2.13, 1.22 - Math.sin(t * Math.PI) * .43, Math.cos(a) * 1.16]); }
    tube(desk, points, .12, P.pink, 24);
    tube(desk, points.map(p => [p[0], p[1] - .045, p[2] + .07]), .026, P.blush, 24);
  }
  for (const a of [-1.26, -.42, .42, 1.26]) {
    const bow = group(desk, Math.sin(a) * 2.17, 1.25, Math.cos(a) * 1.19); bow.rotation.y = a;
    for (const side of [-1, 1]) {
      const loop = ball(bow, side * .20, .025, 0, .20, .26, .065, P.pink); loop.rotation.z = side * -.42;
      const ribbon = box(bow, side * .10, -.35, -.005, .16, .45, .065, P.blush); ribbon.rotation.z = side * -.25;
    }
    ball(bow, 0, .01, .04, .12, .13, .07, P.blush);
  }
  quill(desk, -.83, 1.54, .81, -.21); quill(desk, 1.0, 1.54, .72, -.15);
  const papers = box(desk, .16, 1.55, 1.01, .75, .025, .43, 0xffefcf); papers.rotation.y = -.15;
  for (let i = 0; i < 4; i++) box(desk, .13, 1.568, .90 + i * .065, .40, .004, .009, 0xb5a087);
  const plaque = box(desk, -.16, 1.64, 1.13, .65, .40, .035, 0x504b47); plaque.rotation.x = -.30; plaque.rotation.z = -.05;
  for (let i = 0; i < 3; i++) box(desk, -.35 + i * .19, 1.66, 1.206, .085, .16, .009, P.light);
  // The receptionist sits behind the open inside of the crescent counter.
  const clerk = group(desk, .08, .10, .06);
  ball(clerk, 0, 1.13, 0, .33, .41, .25, P.green);
  ball(clerk, 0, 1.67, 0, .37, .36, .31, 0xf4ce82);
  ball(clerk, 0, 1.60, .25, .33, .23, .10, 0xffe9b6);
  for (const side of [-1, 1]) { ball(clerk, side * .13, 1.79, .292, .034, .052, .020, 0x44382e); ball(clerk, side * .33, 1.16, .12, .12, .15, .11, P.light); }
  ball(clerk, 0, 1.59, .39, .14, .12, .13, 0xdc583f);
  for (let i = 0; i < 6; i++) ball(clerk, (i - 2.5) * .09, 1.98 + Math.sin(i) * .024, -.035, .08, .06, .09, 0xece1c3);

  // A small framed parchment beside the study arch, with visible ink lines.
  const notice = group(root, 8.80, 2.64, -4.23); notice.rotation.y = -.31;
  box(notice, 0, 0, 0, .68, 1.11, .10, P.gold); box(notice, 0, 0, .061, .57, .99, .035, P.green); box(notice, 0, 0, .086, .46, .84, .015, P.light);
  for (let i = 0; i < 7; i++) box(notice, -.015, .29 - i * .09, .10, i % 3 ? .28 : .22, .012, .006, 0x99876b);

  return {
    root, indoor: true, background: 0xc4b398,
    spawn: [0, .05, 4.70],
    bounds: {minX: -8.35, maxX: 8.35, minZ: -5.90, maxZ: 6.15},
    colliders: [
      {x: 0, z: -3.75, rx: 3.48, rz: 2.36, kind: 'ellipse'},
      {x: -6.15, z: -2.18, rx: 1.29, rz: .79},
      {x: -3.95, z: -2.68, rx: .55, rz: .45},
      {x: 6.26, z: 1.38, rx: 2.12, rz: 1.01},
      {x: 7.64, z: 4.44, rx: .55, rz: .55, kind: 'ellipse'},
      {x: -3.68, z: -4.83, rx: .57, rz: .57, kind: 'ellipse'},
      {x: 3.68, z: -4.83, rx: .57, rz: .57, kind: 'ellipse'},
    ],
    portalLocations: {castle: [-.9, .05, 3.50], study: [7.05, .05, -3.39]},
    camera: {perspectivePosition: [.16, 8.5, 14.08], perspectiveTarget: [0, 2.50, -1.60], fov: 39, span: 20, position: [0, 17, 21], target: [0, 2.5, -1.60]},
    updates: [], dynamic: [],
  };
}
