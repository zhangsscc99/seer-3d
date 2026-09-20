import * as THREE from 'three';

// All models stand on y = 0 and present their entrance/face toward +Z.
// Keeping the little imperfections in the geometry makes the village feel handmade.
const MAT = new Map();
const C = {
  cream: 0xffedce, plaster: 0xfff5df, trim: 0xe1c69a,
  wood: 0x986346, darkWood: 0x6c4737, lightWood: 0xc69761,
  roof: 0x4d9c8d, roofDark: 0x347e75, ink: 0x2b3939,
  red: 0xe75e4d, gold: 0xf0bd60, leaf: 0x739951,
};

function material(color, options = {}) {
  const key = `${color}:${JSON.stringify(options)}`;
  if (!MAT.has(key)) MAT.set(key, new THREE.MeshStandardMaterial({
    color, roughness: 0.86, metalness: 0, ...options,
  }));
  return MAT.get(key);
}

function mesh(geometry, color, parent, position = [0, 0, 0], options = {}) {
  const m = new THREE.Mesh(geometry, color?.isMaterial ? color : material(color, options));
  m.position.set(...position);
  m.castShadow = !m.material.transparent;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

function box(parent, w, h, d, color, x = 0, y = 0, z = 0) {
  return mesh(new THREE.BoxGeometry(w, h, d), color, parent, [x, y, z]);
}

function ball(parent, radius, color, x = 0, y = 0, z = 0, scale = [1, 1, 1]) {
  const m = mesh(new THREE.SphereGeometry(radius, 20, 12), color, parent, [x, y, z]);
  m.scale.set(...scale);
  return m;
}

function cylinder(parent, top, bottom, height, color, x = 0, y = 0, z = 0, sides = 28) {
  return mesh(new THREE.CylinderGeometry(top, bottom, height, sides), color, parent, [x, y, z]);
}

function torus(parent, radius, tube, color, x = 0, y = 0, z = 0) {
  return mesh(new THREE.TorusGeometry(radius, tube, 8, 32), color, parent, [x, y, z]);
}

function archGeometry(width, height, depth = 0.08) {
  const r = width / 2;
  const s = new THREE.Shape();
  s.moveTo(-r, 0);
  s.lineTo(r, 0);
  s.lineTo(r, height - r);
  s.absarc(0, height - r, r, 0, Math.PI, false);
  s.lineTo(-r, 0);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 14 });
}

function archedDoor(parent, width = 1, height = 1.8, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  mesh(archGeometry(width + 0.22, height + 0.16, 0.12), C.trim, g, [0, -0.015, -0.045]);
  mesh(archGeometry(width, height, 0.075), C.darkWood, g, [0, 0, 0.065]);
  mesh(archGeometry(width - 0.11, height - 0.1, 0.02), C.wood, g, [0, 0.045, 0.148]);
  for (let i = -1; i <= 1; i++) {
    box(g, 0.018, height - width * 0.5 - 0.06, 0.012, C.darkWood,
      i * width * 0.25, (height - width * 0.5) / 2 + 0.025, 0.174);
  }
  ball(g, 0.055 * width, C.gold, width * 0.27, height * 0.44, 0.21);
  return g;
}

function roundWindow(parent, r = 0.35, x = 0, y = 0, z = 0, yaw = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = yaw;
  parent.add(g);
  mesh(new THREE.CircleGeometry(r, 24), material(0x80b3ba, { roughness: 0.36 }), g);
  torus(g, r + 0.018, 0.059, C.lightWood, 0, 0, 0.015);
  box(g, r * 1.83, 0.045, 0.075, C.cream, 0, 0, 0.065);
  box(g, 0.045, r * 1.83, 0.075, C.cream, 0, 0, 0.065);
  return g;
}

function leaf(parent, x, y, z, rotation, color = C.leaf, size = 0.18) {
  const l = ball(parent, size, color, x, y, z, [0.48, 0.19, 1]);
  l.rotation.set(...rotation);
  return l;
}

function flag(parent, x, y, z, color = C.gold, scale = 1) {
  cylinder(parent, 0.026 * scale, 0.026 * scale, 0.85 * scale, C.lightWood,
    x, y + 0.425 * scale, z, 8);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0.72, -0.045);
  shape.lineTo(0.55, -0.22);
  shape.lineTo(0.72, -0.39);
  shape.lineTo(0, -0.35);
  shape.closePath();
  const f = mesh(new THREE.ShapeGeometry(shape), material(color, { side: THREE.DoubleSide }),
    parent, [x + 0.018, y + 0.78 * scale, z]);
  f.scale.setScalar(scale);
  return f;
}

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function clockFace(parent, x, y, z, radius = 0.51) {
  const texture = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#fff4d9'; ctx.fillRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2);
    for (let i = 0; i < 12; i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 6);
      ctx.fillStyle = '#598b80'; ctx.fillRect(-3, -102, 6, i % 3 === 0 ? 18 : 11);
      ctx.restore();
    }
    ctx.strokeStyle = '#496d63'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-42, -24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(34, -66); ctx.stroke();
    ctx.fillStyle = '#e16a53'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
  });
  const face = mesh(new THREE.CircleGeometry(radius, 32), new THREE.MeshStandardMaterial({
    map: texture, roughness: 0.9,
  }), parent, [x, y, z]);
  face.castShadow = false;
  torus(parent, radius + 0.035, 0.075, C.gold, x, y, z + 0.015);
}

export function createMushroomHouse({ color = 0xdf5743, scale = 1 } = {}) {
  const g = new THREE.Group();
  g.name = 'Mushroom cottage';
  cylinder(g, 1.30, 1.45, 2.90, C.plaster, 0, 1.48, 0);
  cylinder(g, 1.47, 1.48, 0.22, C.trim, 0, 0.12, 0);
  cylinder(g, 1.37, 1.37, 0.14, C.lightWood, 0, 2.88, 0);

  // A hemispherical mushroom roof with raised, surface-aligned ivory spots.
  const rx = 2.1, ry = 1.52, roofY = 3.04;
  const cap = mesh(new THREE.SphereGeometry(rx, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    color, g, [0, roofY, 0]);
  cap.scale.y = ry / rx;
  cylinder(g, rx, rx * 0.96, 0.16, color, 0, roofY - 0.015, 0, 40);
  cylinder(g, 1.96, 1.93, 0.085, 0xf6d9b4, 0, roofY - 0.11, 0, 40);
  const spots = [
    [0.37, 0.2, 0.27], [0.75, 1.1, 0.25], [0.90, 2.7, 0.30],
    [0.82, 4.25, 0.25], [1.23, 0.16, 0.22], [1.31, 1.35, 0.26],
    [1.19, 2.14, 0.19], [1.32, 3.35, 0.24], [1.30, 4.55, 0.20],
    [1.17, 5.58, 0.31], [0.55, 5.22, 0.18],
  ];
  for (const [theta, phi, size] of spots) {
    const normal = new THREE.Vector3(Math.sin(theta) * Math.cos(phi) / rx,
      Math.cos(theta) / ry, Math.sin(theta) * Math.sin(phi) / rx).normalize();
    const spot = ball(g, size, 0xfff3d7,
      rx * Math.sin(theta) * Math.cos(phi), roofY + ry * Math.cos(theta),
      rx * Math.sin(theta) * Math.sin(phi), [1, 1, 0.09]);
    spot.position.addScaledVector(normal, 0.016);
    spot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  }
  const chimney = new THREE.Group();
  chimney.position.set(-0.96, 3.4, -0.46); chimney.rotation.z = 0.08; g.add(chimney);
  box(chimney, 0.36, 1.12, 0.4, C.cream, 0, 0.56, 0);
  box(chimney, 0.47, 0.17, 0.48, C.wood, 0, 1.16, 0);
  box(chimney, 0.26, 0.02, 0.29, C.darkWood, 0, 1.252, 0);
  g.userData.chimney = new THREE.Vector3(-1.06, 4.68, -0.46);

  archedDoor(g, 0.91, 1.70, 0, 0.14, 1.34);
  box(g, 1.34, 0.14, 0.62, 0xcbb493, 0, 0.09, 1.65);
  box(g, 1.06, 0.11, 0.29, C.cream, 0, 0.19, 1.63);
  roundWindow(g, 0.30, -1.06, 1.73, 0.87, -0.72);
  roundWindow(g, 0.30, 1.06, 1.73, 0.87, 0.72);
  const porch = box(g, 1.52, 0.11, 0.75, C.roof, 0, 2.04, 1.66);
  porch.rotation.x = 0.10;
  for (const s of [-1, 1]) {
    cylinder(g, 0.045, 0.065, 1.85, C.lightWood, s * 0.67, 1.04, 1.88, 10);
    const planter = new THREE.Group(); planter.position.set(s * 1.36, 0.16, 1.16); g.add(planter);
    cylinder(planter, 0.22, 0.15, 0.29, 0xbc7759, 0, 0.145, 0, 12);
    cylinder(planter, 0.234, 0.234, 0.07, 0xce8b63, 0, 0.28, 0, 12);
    ball(planter, 0.22, C.leaf, 0, 0.38, 0, [1, 0.8, 1]);
    ball(planter, 0.08, s === -1 ? 0xf7d365 : 0xf0a3ac, 0, 0.55, 0.06);
  }
  g.scale.setScalar(scale);
  g.userData.footprint = { radius: 2.1 * scale, height: 4.75 * scale };
  return g;
}

export function createCastle() {
  const g = new THREE.Group();
  g.name = 'Manor castle';
  box(g, 8.6, 0.28, 4.45, C.trim, 0, 0.14, 0);
  box(g, 6.9, 4.43, 3.63, C.plaster, 0, 2.46, 0);
  box(g, 7.08, 0.22, 3.79, C.cream, 0, 4.64, 0);
  box(g, 7.06, 0.16, 3.8, C.trim, 0, 0.57, 0);
  for (let i = -4; i <= 4; i++) {
    box(g, 0.50, 0.53, 0.48, C.plaster, i * 0.78, 4.98, 1.67);
  }

  const tower = (x, z, height, radius) => {
    cylinder(g, radius, radius * 1.05, height, C.cream, x, height / 2, z);
    cylinder(g, radius * 1.10, radius * 1.10, 0.34, C.trim, x, 0.22, z);
    cylinder(g, radius * 1.08, radius * 1.06, 0.19, 0xf8dfb7, x, height - 0.16, z);
    cylinder(g, radius * 1.07, radius * 1.07, 0.10, C.trim, x, height * 0.60, z);
    const roofHeight = radius * 2.24;
    cylinder(g, 0.02, radius * 1.32, roofHeight, C.roof, x, height + roofHeight / 2, z, 32);
    cylinder(g, radius * 1.36, radius * 1.36, 0.15, C.roofDark, x, height + 0.035, z);
    cylinder(g, radius * 0.68, radius * 0.75, 0.11, C.roofDark, x, height + roofHeight * 0.46, z);
    ball(g, 0.105, C.gold, x, height + roofHeight + 0.02, z);
    flag(g, x, height + roofHeight + 0.07, z, x > 0 ? C.red : C.gold, 0.8);
    const win = new THREE.Group(); win.position.set(x, height * 0.69, z + radius + 0.012); g.add(win);
    mesh(archGeometry(0.43, 0.97, 0.025), C.trim, win, [0, -0.06, 0]);
    mesh(archGeometry(0.30, 0.78, 0.015), 0x6798a1, win, [0, 0.015, 0.038]);
    box(win, 0.031, 0.64, 0.02, C.cream, 0, 0.36, 0.064);
  };
  tower(-3.85, -1.0, 6.00, 0.98);
  tower(3.85, -1.0, 6.00, 0.98);
  tower(-3.85, 1.0, 5.03, 1.04);
  tower(3.85, 1.0, 5.03, 1.04);

  // The clock keep rises between the four corner towers.
  cylinder(g, 1.31, 1.34, 3.0, C.plaster, 0, 5.93, -0.32, 8);
  cylinder(g, 1.46, 1.46, 0.17, C.trim, 0, 7.35, -0.32, 8);
  cylinder(g, 0.025, 1.70, 2.13, C.roof, 0, 8.49, -0.32, 8);
  cylinder(g, 1.72, 1.72, 0.15, C.roofDark, 0, 7.49, -0.32, 8);
  ball(g, 0.12, C.gold, 0, 9.61, -0.32);
  flag(g, 0, 9.64, -0.32, C.red, 0.8);
  clockFace(g, 0, 6.3, 1.026, 0.57);

  archedDoor(g, 1.77, 2.8, 0, 0.27, 1.84);
  box(g, 2.75, 0.14, 1.03, 0xd2c1a0, 0, 0.07, 2.1);
  box(g, 2.34, 0.14, 0.80, C.cream, 0, 0.20, 2.08);
  for (const s of [-1, 1]) {
    roundWindow(g, 0.37, s * 2.19, 2.57, 1.847);
    box(g, 0.48, 1.42, 0.07, s < 0 ? C.red : C.roof,
      s * 1.51, 3.67, 1.878);
    box(g, 0.59, 0.07, 0.13, C.gold, s * 1.51, 4.40, 1.917);
    ball(g, 0.10, C.gold, s * 1.51, 3.98, 1.953, [1, 1, 0.3]);
  }
  // A tiny red-nosed manor crest, made from geometry rather than a downloaded logo.
  ball(g, 0.40, C.gold, 0, 3.66, 1.87, [1, 1, 0.25]);
  ball(g, 0.32, C.plaster, 0, 3.67, 1.971, [1, 0.89, 0.22]);
  ball(g, 0.135, C.red, 0, 3.66, 2.08, [1, 0.85, 0.57]);
  for (const s of [-1, 1]) ball(g, 0.038, C.ink, s * 0.115, 3.79, 2.054, [1, 1.3, 0.55]);
  g.userData.footprint = { width: 10.7, depth: 5.2, height: 10.3 };
  return g;
}

export function createWindmill() {
  const g = new THREE.Group();
  g.name = 'Breezy windmill';
  cylinder(g, 0.86, 1.28, 4.80, C.plaster, 0, 2.40, 0);
  cylinder(g, 1.30, 1.30, 0.28, C.trim, 0, 0.14, 0);
  cylinder(g, 1.02, 1.06, 0.14, C.lightWood, 0, 3.30, 0);
  cylinder(g, 0.04, 1.20, 1.63, C.roof, 0, 5.565, 0, 28);
  cylinder(g, 1.23, 1.23, 0.13, C.roofDark, 0, 4.79, 0);
  ball(g, 0.10, C.gold, 0, 6.43, 0);
  archedDoor(g, 0.76, 1.49, 0, 0.11, 1.22);
  roundWindow(g, 0.24, 0.76, 2.62, 0.68, 0.74);
  roundWindow(g, 0.22, -0.76, 3.65, 0.51, -0.98);
  box(g, 1.1, 0.12, 0.5, 0xc6b294, 0, 0.06, 1.48);

  const rotor = new THREE.Group();
  rotor.position.set(0, 4.60, 1.09);
  rotor.rotation.z = Math.PI / 5;
  g.add(rotor);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Group(); blade.rotation.z = i * Math.PI / 2; rotor.add(blade);
    box(blade, 0.11, 2.37, 0.12, C.wood, 0, 1.21, 0);
    box(blade, 0.58, 1.45, 0.053, 0xf8e7bb, -0.28, 1.59, -0.025);
    box(blade, 0.046, 1.53, 0.087, C.lightWood, -0.55, 1.59, 0.006);
    for (let j = 0; j < 4; j++) box(blade, 0.64, 0.036, 0.096, C.lightWood,
      -0.28, 0.92 + j * 0.44, 0.011);
  }
  ball(rotor, 0.24, C.lightWood, 0, 0, 0.065, [1, 1, 0.6]);
  ball(rotor, 0.095, C.gold, 0, 0, 0.205);
  g.userData.rotor = rotor;
  g.userData.footprint = { radius: 1.7, height: 7.1, rotorRadius: 2.42 };
  return g;
}

export function createMarketStall({ color = 0xf2bd55 } = {}) {
  const g = new THREE.Group();
  g.name = 'Farmers market stall';
  for (const x of [-1.29, 1.29]) for (const z of [-0.68, 0.76]) {
    cylinder(g, 0.05, 0.068, 2.62, C.wood, x, 1.31, z, 8);
  }
  box(g, 2.72, 0.13, 1.57, C.lightWood, 0, 0.98, 0.07);
  box(g, 2.48, 0.74, 0.11, C.wood, 0, 0.52, 0.79);
  box(g, 2.53, 0.07, 0.15, C.lightWood, 0, 0.16, 0.81);
  for (let i = -2; i <= 2; i++) box(g, 0.018, 0.66, 0.025, C.darkWood, i * 0.45, 0.53, 0.859);
  box(g, 2.86, 0.08, 0.1, C.wood, 0, 2.72, -0.74);
  for (let i = 0; i < 6; i++) {
    const col = i % 2 === 0 ? color : 0xfff1cf;
    const panel = box(g, 0.50, 0.065, 1.94, col, -1.25 + i * 0.5, 2.60, 0.04);
    panel.rotation.x = 0.19;
    ball(g, 0.25, col, -1.25 + i * 0.5, 2.40, 0.992, [1, 0.60, 0.10]);
  }
  const crate = (x, fruitColor, kind = 'round') => {
    const c = new THREE.Group(); c.position.set(x, 1.075, 0.11); g.add(c);
    box(c, 0.97, 0.065, 0.96, C.darkWood, 0, 0.033, 0);
    box(c, 1.00, 0.22, 0.057, C.lightWood, 0, 0.11, 0.48);
    box(c, 1.00, 0.22, 0.057, C.lightWood, 0, 0.11, -0.48);
    box(c, 0.057, 0.22, 0.96, C.lightWood, -0.48, 0.11, 0);
    box(c, 0.057, 0.22, 0.96, C.lightWood, 0.48, 0.11, 0);
    const fruits = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 12, 8), material(fruitColor), 12);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 12; i++) {
      dummy.position.set((i % 4 - 1.5) * 0.21, 0.16 + (i % 3) * 0.016, (Math.floor(i / 4) - 1) * 0.26);
      dummy.scale.set(kind === 'long' ? 0.68 : 1, kind === 'long' ? 1.8 : 0.94, 1);
      dummy.rotation.z = kind === 'long' ? 0.8 : 0; dummy.updateMatrix();
      fruits.setMatrixAt(i, dummy.matrix);
    }
    fruits.castShadow = true; fruits.receiveShadow = true; c.add(fruits);
  };
  crate(-0.65, 0xe76449); crate(0.65, 0xecb94b);
  const plaqueTexture = canvasTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#41665b'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff1ce'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 48px sans-serif'; ctx.fillText('新鲜农场', w / 2, h / 2);
  });
  box(g, 0.91, 0.43, 0.06, C.lightWood, 0, 0.58, 0.88);
  const label = mesh(new THREE.PlaneGeometry(0.84, 0.37), new THREE.MeshStandardMaterial({
    map: plaqueTexture, roughness: 0.9,
  }), g, [0, 0.58, 0.917]);
  label.castShadow = false;
  g.userData.footprint = { width: 3, depth: 2.05, height: 2.84 };
  return g;
}

export function createMole({ shirt = 0xe7b859, hat = true } = {}) {
  const g = new THREE.Group();
  g.name = 'Little mole';
  for (const s of [-1, 1]) ball(g, 0.15, C.darkWood, s * 0.15, 0.093, 0.07, [0.78, 0.57, 1.25]);
  ball(g, 0.30, shirt, 0, 0.42, 0, [1, 1.04, 0.82]);
  ball(g, 0.15, 0xf6d89c, 0, 0.43, 0.224, [1, 0.7, 0.20]);
  ball(g, 0.032, C.lightWood, 0, 0.55, 0.264);
  ball(g, 0.032, C.lightWood, 0, 0.42, 0.268);
  const headColor = 0x865c43;
  ball(g, 0.355, headColor, 0, 0.89, 0, [1.05, 1.0, 0.97]);
  for (const s of [-1, 1]) ball(g, 0.105, headColor, s * 0.344, 0.92, 0.01, [0.6, 0.85, 0.75]);
  ball(g, 0.311, 0xfff4dc, 0, 0.90, 0.211, [1.03, 0.94, 0.42]);
  for (const s of [-1, 1]) {
    ball(g, 0.050, C.ink, s * 0.106, 0.99, 0.335, [0.77, 1.30, 0.43]);
    ball(g, 0.014, 0xffffff, s * 0.106 - 0.010, 1.012, 0.352, [1, 1, 0.5]);
    ball(g, 0.043, 0xf2b7a1, s * 0.217, 0.887, 0.307, [1, 0.6, 0.22]);
  }
  ball(g, 0.106, 0xe95645, 0, 0.90, 0.397, [1.04, 0.91, 0.89]);
  const smile = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.065, 0.818, 0.337),
    new THREE.Vector3(0, 0.78, 0.353),
    new THREE.Vector3(0.065, 0.818, 0.337));
  mesh(new THREE.TubeGeometry(smile, 10, 0.009, 5, false), C.darkWood, g);
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(s * 0.25, 0.58, 0); g.add(arm);
    arm.rotation.z = s * 0.33;
    ball(arm, 0.105, shirt, s * 0.054, -0.10, 0, [1, 1.45, 1]);
    ball(arm, 0.099, 0xfff0d4, s * 0.098, -0.248, 0.008, [0.91, 1, 0.94]);
    arms.push(arm);
  }
  if (hat) {
    const cap = mesh(new THREE.SphereGeometry(0.377, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      0x956b46, g, [0, 1.044, 0]);
    cap.scale.set(1, 0.54, 1);
    const brim = cylinder(g, 0.382, 0.382, 0.045, 0x79553d, 0, 1.042, 0, 32);
    brim.scale.z = 1.02;
    ball(g, 0.18, 0x956b46, 0, 1.054, 0.313, [1.08, 0.16, 0.58]);
    ball(g, 0.042, C.gold, 0, 1.253, 0, [1, 0.5, 1]);
  } else {
    ball(g, 0.055, headColor, -0.043, 1.24, -0.006, [0.7, 1.5, 0.7]);
    ball(g, 0.047, headColor, 0.034, 1.23, 0.0, [0.65, 1.35, 0.7]);
  }
  g.userData.arms = arms;
  g.userData.footprint = { radius: 0.42, height: 1.29 };
  return g;
}

export function createRam({ color = 0xe9a0b7 } = {}) {
  const g = new THREE.Group();
  g.name = 'Little ram';
  cylinder(g, 0.214, 0.15, 0.23, 0xc88458, 0, 0.115, 0, 18);
  cylinder(g, 0.232, 0.232, 0.066, 0xe6aa73, 0, 0.223, 0, 18);
  cylinder(g, 0.184, 0.184, 0.015, C.darkWood, 0, 0.263, 0, 18);
  ball(g, 0.234, color, 0, 0.386, 0, [1.1, 0.92, 0.98]);
  for (const s of [-1, 1]) {
    ball(g, 0.073, 0xfffae6, s * 0.085, 0.427, 0.197, [0.86, 1.13, 0.45]);
    ball(g, 0.033, C.ink, s * 0.085, 0.431, 0.228, [0.8, 1.18, 0.48]);
    ball(g, 0.029, 0xec7695, s * 0.165, 0.368, 0.193, [1.2, 0.55, 0.26]);
  }
  const smile = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.038, 0.369, 0.227),
    new THREE.Vector3(0, 0.329, 0.239), new THREE.Vector3(0.038, 0.369, 0.227));
  mesh(new THREE.TubeGeometry(smile, 8, 0.008, 5, false), C.darkWood, g);
  leaf(g, -0.085, 0.605, 0, [0.14, -1.01, -0.38], 0x86aa57, 0.17);
  leaf(g, 0.090, 0.61, 0.01, [-0.08, 1.01, 0.43], 0x91b95f, 0.18);
  cylinder(g, 0.019, 0.024, 0.13, C.leaf, 0, 0.62, 0, 8);
  g.userData.footprint = { radius: 0.28, height: 0.69 };
  return g;
}

export function createFountain() {
  const g = new THREE.Group();
  g.name = 'Wishing fountain';
  const stone = 0xd9d4b7;
  cylinder(g, 1.67, 1.75, 0.18, stone, 0, 0.09, 0, 40);
  cylinder(g, 1.55, 1.64, 0.22, 0xe9e4cc, 0, 0.245, 0, 40);
  const waterMat = material(0x66c6c6, { roughness: 0.23, transparent: true, opacity: 0.82, metalness: 0.05 });
  const water = cylinder(g, 1.43, 1.43, 0.055, waterMat, 0, 0.362, 0, 40);
  water.castShadow = false;
  const rim = torus(g, 1.53, 0.112, C.cream, 0, 0.40, 0); rim.rotation.x = -Math.PI / 2;
  cylinder(g, 0.25, 0.46, 0.96, C.cream, 0, 0.82, 0, 20);
  cylinder(g, 0.36, 0.42, 0.10, C.trim, 0, 0.45, 0, 20);
  const profile = [new THREE.Vector2(0.13, 0), new THREE.Vector2(0.31, 0.07),
    new THREE.Vector2(0.56, 0.20), new THREE.Vector2(0.76, 0.38),
    new THREE.Vector2(0.80, 0.43), new THREE.Vector2(0.77, 0.48),
    new THREE.Vector2(0.69, 0.42), new THREE.Vector2(0.49, 0.22),
    new THREE.Vector2(0.22, 0.13), new THREE.Vector2(0.13, 0.11)];
  mesh(new THREE.LatheGeometry(profile, 32), C.cream, g, [0, 1.02, 0]);
  cylinder(g, 0.69, 0.69, 0.025, waterMat, 0, 1.414, 0, 32);
  cylinder(g, 0.075, 0.12, 0.44, C.gold, 0, 1.48, 0, 14);
  ball(g, 0.13, waterMat, 0, 1.95, 0, [0.7, 1.2, 0.7]);
  const streams = new THREE.Group(); g.add(streams);
  const streamMat = material(0xa4e4dc, { transparent: true, opacity: 0.64, roughness: 0.16 });
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    const direction = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const curve = new THREE.QuadraticBezierCurve3(
      direction.clone().multiplyScalar(0.07).setY(1.74),
      direction.clone().multiplyScalar(0.70).setY(2.22),
      direction.clone().multiplyScalar(1.08).setY(0.42));
    mesh(new THREE.TubeGeometry(curve, 20, 0.026, 6, false), streamMat, streams);
  }
  g.userData.water = water;
  g.userData.streams = streams;
  g.userData.footprint = { radius: 1.75, height: 2.1 };
  return g;
}

export function createSign(text) {
  const g = new THREE.Group();
  g.name = `Sign: ${text}`;
  cylinder(g, 0.055, 0.075, 1.13, C.wood, 0, 0.565, 0, 8);
  box(g, 1.52, 0.56, 0.13, C.lightWood, 0, 1.01, 0);
  box(g, 1.43, 0.47, 0.025, 0xf4dfb4, 0, 1.015, 0.073);
  const texture = canvasTexture(512, 160, (ctx, w, h) => {
    ctx.fillStyle = '#f4dfb4'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#b99361'; ctx.lineWidth = 3; ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#72543f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const size = Math.min(67, 380 / Math.max(String(text).length, 1));
    ctx.font = `600 ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(String(text), w / 2, h / 2 + 1);
  });
  const label = mesh(new THREE.PlaneGeometry(1.40, 0.44), new THREE.MeshStandardMaterial({
    map: texture, roughness: 0.9,
  }), g, [0, 1.015, 0.089]);
  label.castShadow = false;
  for (const s of [-1, 1]) ball(g, 0.027, C.wood, s * 0.674, 1.013, 0.105, [1, 1, 0.3]);
  g.userData.footprint = { width: 1.52, depth: 0.18, height: 1.29 };
  return g;
}
