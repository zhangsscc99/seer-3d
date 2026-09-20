import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const materials = new Map();
const sphere = new THREE.SphereGeometry(1, 24, 16);
const smallSphere = new THREE.SphereGeometry(1, 10, 8);
const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
const darkCrease = 0x8f5044;
let seed = 917;
export const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
export const group = (parent, x = 0, y = 0, z = 0) => {
  const object = new THREE.Group();
  object.position.set(x, y, z);
  parent?.add(object);
  return object;
};
function material(color, glow = false) {
  const key = `${color}:${glow}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .78, ...(glow ? { emissive: color, emissiveIntensity: .7 } : {}) }));
  return materials.get(key);
}
function mesh(parent, geometry, color, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, color.isMaterial ? color : material(color));
  object.position.set(x, y, z);
  object.castShadow = object.receiveShadow = true;
  parent.add(object);
  return object;
}
function ball(parent, x, y, z, sx, sy, sz, color) {
  const object = mesh(parent, Math.max(sx, sy, sz) < .24 ? smallSphere : sphere, color, x, y, z);
  object.scale.set(sx, sy, sz);
  return object;
}
function box(parent, x, y, z, w, h, d, color, radius = .06) {
  return mesh(parent, new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)), color, x, y, z);
}
function cylinder(parent, x, y, z, rt, rb, height, color, segments = 16) {
  return mesh(parent, new THREE.CylinderGeometry(rt, rb, height, segments), color, x, y, z);
}
function ring(parent, x, y, z, radius, thickness, color) {
  return mesh(parent, new THREE.TorusGeometry(radius, thickness, 8, 48), color, x, y, z);
}
function tube(parent, points, radius, color, segments = 28) {
  return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), segments, radius, 8, false), color);
}
function disk(parent, x, y, z, radius, color) {
  const object = cylinder(parent, x, y, z, radius, radius, .025, color, 48);
  object.castShadow = false;
  return object;
}
function rock(parent, x, y, z, sx, sy, sz, color) {
  const object = mesh(parent, rockGeometry, color, x, y, z);
  object.scale.set(sx, sy, sz);
  object.rotation.set(random() * .3, random() * 5, random() * .2);
  return object;
}

// Merge the static landscape by material so dense vegetation stays inexpensive.
function batch(root) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const buckets = new Map();
  const originals = [];
  root.traverse(object => {
    if (!object.isMesh) return;
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));
    for (const name of Object.keys(geometry.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(name)) geometry.deleteAttribute(name);
    if (object.material.vertexColors && !geometry.attributes.color) geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Array(geometry.attributes.position.count * 3).fill(1), 3));
    if (!geometry.attributes.uv) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(geometry.attributes.position.count * 2).fill(0), 2));
    if (!buckets.has(object.material)) buckets.set(object.material, []);
    buckets.get(object.material).push(geometry);
    originals.push(object);
  });
  for (const [mat, geometries] of buckets) {
    const geometry = mergeGeometries(geometries);
    const object = mesh(root, geometry, mat);
    object.castShadow = object.receiveShadow = true;
    geometries.forEach(g => g.dispose());
  }
  const retained = new Set([sphere, smallSphere, rockGeometry, grassGeometry, ...leafGeometries]);
  const disposable = new Set(originals.map(object => object.geometry).filter(geometry => !retained.has(geometry)));
  originals.forEach(object => object.removeFromParent());
  disposable.forEach(geometry => geometry.dispose());
}

const surfaceMaps = new Map();
function surfaceMaterial(color, kind) {
  const key = `${color}:${kind}`;
  if (materials.has(key)) return materials.get(key);
  if (!surfaceMaps.has(kind)) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff7e9'; ctx.fillRect(0, 0, 512, 512);
    let n = 815;
    const rand = () => ((n = Math.imul(n, 1664525) + 1013904223 >>> 0) / 4294967296);
    for (let i = 0; i < 2400; i++) {
      ctx.fillStyle = `rgba(99, 77, 64, ${rand() * .09})`;
      ctx.fillRect(rand() * 512, rand() * 512, .7 + rand() * 2, .5 + rand() * 2);
    }
    for (let i = 0; i < (kind === 'bark' ? 42 : 22); i++) {
      ctx.beginPath();
      const x = rand() * 512, y = rand() * 512;
      ctx.moveTo(x, y);
      if (kind === 'bark') ctx.bezierCurveTo(x - 15, y + 50, x + 18, y + 90, x + 3, y + 155);
      else ctx.bezierCurveTo(x + 45, y - 5, x + 70, y + 8, x + 130, y + 1);
      ctx.strokeStyle = kind === 'metal' ? 'rgba(93,113,114,.12)' : 'rgba(106,73,53,.22)';
      ctx.lineWidth = kind === 'bark' ? 2.5 : 1.4; ctx.stroke();
      ctx.translate(0, -2); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.stroke(); ctx.translate(0, 2);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 8;
    surfaceMaps.set(kind, map);
  }
  const map = surfaceMaps.get(kind);
  const mat = new THREE.MeshStandardMaterial({ color, map, bumpMap: map, bumpScale: kind === 'metal' ? .008 : .045, roughness: kind === 'metal' ? .38 : .88, metalness: kind === 'metal' ? .48 : 0 });
  materials.set(key, mat);
  return mat;
}

function branch(parent, points, radii, color, segments = 40, sides = 12) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const frames = curve.computeFrenetFrames(segments, false), positions = [], uv = [], indices = [];
  for (let row = 0; row <= segments; row++) {
    const t = row / segments, p = curve.getPointAt(t), at = t * (radii.length - 1);
    const lower = Math.min(Math.floor(at), radii.length - 2);
    const radius = THREE.MathUtils.lerp(radii[lower], radii[lower + 1], at - lower);
    for (let col = 0; col <= sides; col++) {
      const a = col / sides * Math.PI * 2;
      const r = radius * (1 + .055 * Math.sin(a * 5 + t * 4));
      const v = p.clone().addScaledVector(frames.normals[row], Math.cos(a) * r).addScaledVector(frames.binormals[row], Math.sin(a) * r);
      positions.push(v.x, v.y, v.z); uv.push(col / sides * 2, t * 3);
      if (row && col < sides) {
        const b = row * (sides + 1) + col, a = b - sides - 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const object = mesh(parent, geometry, color);
  ball(parent, ...points.at(-1), radii.at(-1), radii.at(-1), radii.at(-1), color);
  return object;
}

function groundTexture() {
  const canvas = document.createElement('canvas'), relief = document.createElement('canvas');
  canvas.width = canvas.height = relief.width = relief.height = 2048;
  const ctx = canvas.getContext('2d'), bump = relief.getContext('2d');
  ctx.fillStyle = '#e98160'; ctx.fillRect(0, 0, 2048, 2048);
  bump.fillStyle = '#808080'; bump.fillRect(0, 0, 2048, 2048);
  // The reference is open salmon earth with isolated sand shapes, not a tiled pavement.
  let patchSeed = 615;
  const rand = () => ((patchSeed = Math.imul(patchSeed, 1664525) + 1013904223 >>> 0) / 4294967296);
  const patches = [
    [165, 230, 210, 110], [710, 130, 145, 70], [1240, 205, 220, 120], [1830, 140, 160, 85],
    [430, 565, 245, 115], [1080, 595, 120, 95], [1660, 650, 240, 125],
    [100, 965, 170, 100], [765, 995, 210, 110], [1370, 1070, 200, 110], [1935, 1160, 160, 100],
    [315, 1430, 215, 105], [1040, 1510, 250, 130], [1630, 1515, 180, 95],
    [90, 1900, 180, 90], [610, 1800, 170, 95], [1310, 1920, 200, 105], [1880, 1870, 220, 110],
  ];
  patches.forEach(([x, y, rx, ry], index) => {
    const points = Array.from({ length: 11 }, (_, i) => {
      const a = i / 11 * Math.PI * 2, r = .78 + rand() * .30;
      return [x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r];
    });
    for (let ty = -1; ty <= 1; ty++) for (let tx = -1; tx <= 1; tx++) {
      ctx.save(); ctx.translate(tx * 2048, ty * 2048);
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const previous = points[(i + points.length - 1) % points.length], point = points[i], next = points[(i + 1) % points.length];
        const sx = (previous[0] + point[0]) / 2, sy = (previous[1] + point[1]) / 2;
        if (i === 0) ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(point[0], point[1], (point[0] + next[0]) / 2, (point[1] + next[1]) / 2);
      }
      ctx.closePath();
      ctx.fillStyle = ['#f6b679', '#d67559', '#efa173', '#e99b6a', '#f2b57c'][index % 5];
      ctx.fill();
      if (index % 3 === 0) {
        ctx.strokeStyle = '#cd775b'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke();
      }
      ctx.restore();
    }
  });
  // Low contrast texture remains secondary to the broad, painted color areas.
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(124,63,46,.025)' : 'rgba(255,228,188,.04)';
    ctx.fillRect(rand() * 2048, rand() * 2048, 1.5, 1.5);
  }
  const map = new THREE.CanvasTexture(canvas), bumpMap = new THREE.CanvasTexture(relief);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [map, bumpMap]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); texture.anisotropy = 8;
  }
  return { map, bumpMap };
}

function groundCrack(parent, points, width = .035) {
  const crack = tube(parent, points.map(([x, z]) => [x, .006, z]), width, new THREE.MeshBasicMaterial({ color: darkCrease, transparent: true, opacity: .43 }), points.length * 6);
  crack.castShadow = false;
  return crack;
}

const strataMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .97 });
function rockSlab(parent, x, y, z, width, height, depth, color) {
  const g = group(parent, x, y, z);
  g.rotation.y = (random() - .5) * .18;
  const contour = [[-1, -.38], [-.83, -.86], [-.22, -1], [.62, -.92], [1, -.33], [.92, .65], [.35, .94], [-.61, .88], [-1, .38]];
  const ringPoints = contour.map(([px, pz]) => [px * width * (.94 + random() * .08), pz * depth * (.94 + random() * .08)]);
  const positions = [], colors = [], uv = [];
  const base = new THREE.Color(color);
  const levels = [[0, .78], [.1, 1], [.70, 1.02], [1, .82]];
  function triangle(a, b, c, shade) {
    const tint = base.clone().multiplyScalar(shade);
    for (const p of [a, b, c]) { positions.push(...p); colors.push(tint.r, tint.g, tint.b); uv.push(p[0], p[2]); }
  }
  const point = (index, level) => [ringPoints[index][0] * levels[level][1], levels[level][0] * height, ringPoints[index][1] * levels[level][1]];
  for (let i = 0; i < ringPoints.length; i++) {
    const j = (i + 1) % ringPoints.length;
    triangle([0, height + .025, 0], point(j, 3), point(i, 3), 1.04 + (i % 3) * .026);
    for (let level = 0; level < 3; level++) {
      const shade = [.61, .80, 1.0][level] * (1 + Math.sin(i * 2) * .055);
      triangle(point(i, level), point(j, level), point(j, level + 1), shade);
      triangle(point(i, level), point(j, level + 1), point(i, level + 1), shade);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  mesh(g, geometry, strataMaterial);
  const edge = ringPoints.map(([px, pz]) => [px * .824, height + .006, pz * .824]);
  edge.push(edge[0]);
  tube(g, edge, .022, 0x8a6852, 22);
  if (width > 1.3) {
    tube(g, [[-.5 * width, height + .036, .16 * depth], [-.21 * width, height + .044, .04 * depth], [-.05 * width, height + .04, -.27 * depth]], .017, 0x9d795c, 8);
    tube(g, [[-.21 * width, height + .04, .04 * depth], [-.13 * width, height + .04, .24 * depth]], .012, 0x9d795c, 3);
  }
  return g;
}

function landShape(parent, points, height, color) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], i) => i ? shape.lineTo(x, -z) : shape.moveTo(x, -z));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: true, bevelSegments: 2, bevelSize: .28, bevelThickness: .18, steps: 1 });
  geometry.rotateX(-Math.PI / 2);
  return mesh(parent, geometry, color);
}

const breeze = { value: 0 };
const leafMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
leafMaterial.onBeforeCompile = shader => {
  shader.uniforms.breezeTime = breeze;
  shader.vertexShader = `uniform float breezeTime;\n${shader.vertexShader}`.replace('#include <begin_vertex>', `
    #include <begin_vertex>
    float sway = sin(breezeTime * 1.2 + position.x * .48 + position.z * .31);
    transformed.y += sway * .045 * uv.y * uv.y;
    transformed.x += sway * .026 * uv.y;
  `);
};
function prepareLeaves() {
  if (leafMaterial.map) return;
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d6edf8'; ctx.fillRect(0, 0, 256, 512);
  ctx.fillStyle = '#f3fcff'; ctx.beginPath(); ctx.moveTo(57, 482);
  ctx.bezierCurveTo(27, 380, 26, 275, 52, 176);
  ctx.bezierCurveTo(60, 137, 80, 78, 103, 49);
  ctx.bezierCurveTo(92, 155, 137, 193, 111, 282);
  ctx.bezierCurveTo(98, 320, 97, 367, 116, 385);
  ctx.quadraticCurveTo(84, 412, 57, 482); ctx.fill();
  ctx.strokeStyle = '#8ebacf'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(142, 511);
  ctx.bezierCurveTo(137, 402, 151, 308, 137, 237);
  ctx.bezierCurveTo(133, 217, 134, 184, 144, 160); ctx.stroke();
  ctx.fillStyle = '#9ec7dc'; ctx.fillRect(0, 0, 3, 512); ctx.fillRect(253, 0, 3, 512);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  leafMaterial.map = texture; leafMaterial.needsUpdate = true;
}
const leafGeometries = [];
function leafGeometry(variant) {
  if (leafGeometries[variant]) return leafGeometries[variant];
  const positions = [], colors = [], uv = [], indices = [], rows = 24, columns = 12;
  const base = new THREE.Color([0x42a8d2, 0x369bca, 0x50b3d9][variant]);
  for (let i = 0; i <= rows; i++) for (let j = 0; j <= columns; j++) {
    const t = i / rows, angle = j / columns * Math.PI * 2, u = Math.cos(angle);
    const taper = Math.pow(Math.sin(Math.PI * t), .43);
    const width = taper * (.75 - t * .12) * (1 + Math.sin(t * Math.PI * 3 + variant) * .045);
    const x = u * width + Math.sin(t * Math.PI) * .18 * (variant - 1);
    const thickness = .095 * taper * Math.sin(angle);
    const y = .14 + .24 * Math.sin(t * Math.PI) - t * .04 + thickness;
    positions.push(x, y, t * 2.45);
    const shade = .88 + Math.max(0, Math.sin(angle)) * .10 - Math.max(0, -Math.sin(angle)) * .14;
    const color = base.clone().multiplyScalar(shade);
    colors.push(color.r, color.g, color.b); uv.push((u + 1) / 2, t);
    if (i < rows && j < columns) {
      const a = i * (columns + 1) + j, b = a + columns + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  leafGeometries[variant] = geometry;
  return geometry;
}

function bluePlant(parent, x, y, z, size = 1, yaw = null, drape = 0) {
  const plant = group(parent, x, y, z);
  plant.scale.setScalar(size);
  plant.rotation.y = yaw ?? random() * Math.PI * 2;
  for (let j = 0; j < 4; j++) {
    const spread = j - 1.5;
    const leaf = mesh(plant, leafGeometry(j % 3), leafMaterial, spread * .22, (1.5 - Math.abs(spread)) * .035, 0);
    leaf.rotation.set(drape, spread * .38 + (random() - .5) * .08, 0);
    leaf.scale.set(.85 + random() * .18, .85 + random() * .20, .77 + random() * .18);
  }
  return plant;
}

const meadowCurve = new THREE.CatmullRomCurve3([
  [4, -9], [6, -6.7], [9, -5.3], [13, -4.4], [17, -3], [19, -.5], [20, 2.5], [24, 7],
  [34, 8], [85, -8], [95, -100], [22, -110], [8, -67], [5.5, -23],
].map(([x, z]) => new THREE.Vector3(x, 0, z)), true);
const meadowBorder = meadowCurve.getSpacedPoints(72).slice(0, -1).map(p => [p.x, p.z]);

function meadowContains(x, z) {
  let inside = false;
  for (let i = 0, j = meadowBorder.length - 1; i < meadowBorder.length; j = i++) {
    const a = meadowBorder[i], b = meadowBorder[j];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

function meadowDistance(x, z) {
  let distance = Infinity;
  for (let i = 0; i < meadowBorder.length; i++) {
    const a = meadowBorder[i], b = meadowBorder[(i + 1) % meadowBorder.length];
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const t = THREE.MathUtils.clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz), 0, 1);
    distance = Math.min(distance, (x - a[0] - dx * t) ** 2 + (z - a[1] - dz * t) ** 2);
  }
  return Math.sqrt(distance);
}

const meadowHeight = (x, z) => 2.70 + .38 * THREE.MathUtils.smoothstep(meadowDistance(x, z), 0, 1.8);
const nearMeadow = (x, z, margin = 1.7) => meadowContains(x, z) || meadowDistance(x, z) < margin;

function coverMaterial(kind) {
  const key = `painted-groundcover-${kind}`;
  if (materials.has(key)) return materials.get(key);
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d'), green = kind === 'green';
  const palette = green ? ['#99b632', '#819b2d', '#71892c', '#abc438'] : ['#46a6ce', '#3494c1', '#2988b9', '#56b0d1'];
  ctx.fillStyle = green ? '#839c2e' : '#3197c4'; ctx.fillRect(0, 0, 1024, 1024);
  let n = green ? 713 : 197;
  const rand = () => ((n = Math.imul(n, 1664525) + 1013904223 >>> 0) / 4294967296);
  for (let i = 0; i < (green ? 38 : 23); i++) {
    const x = rand() * 1024, y = rand() * 1024, rx = 45 + rand() * 95, ry = 24 + rand() * 66;
    const points = Array.from({ length: green ? 22 : 12 }, (_, j) => {
      const a = j / (green ? 22 : 12) * Math.PI * 2;
      const r = .85 + rand() * .25;
      return [x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r];
    });
    for (let ty = -1; ty <= 1; ty++) for (let tx = -1; tx <= 1; tx++) {
      ctx.save(); ctx.translate(tx * 1024, ty * 1024); ctx.beginPath();
      points.forEach((p, j) => {
        const next = points[(j + 1) % points.length];
        if (!j) ctx.moveTo(p[0], p[1]);
        if (green) {
          ctx.lineTo(p[0], p[1]);
          ctx.lineTo((p[0] + next[0]) / 2 + (next[1] - p[1]) * .22, (p[1] + next[1]) / 2 - (next[0] - p[0]) * .22);
        } else ctx.lineTo(p[0], p[1]);
      });
      ctx.closePath(); ctx.fillStyle = palette[i % palette.length]; ctx.fill(); ctx.restore();
    }
  }
  if (green) for (let i = 0; i < 180; i++) {
    const x = rand() * 1024, y = rand() * 1024;
    ctx.fillStyle = i % 3 ? '#a3bd36' : '#758d28'; ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + 6, y - 9); ctx.lineTo(x + 7, y - 3); ctx.lineTo(x + 14, y - 11);
    ctx.lineTo(x + 13, y - 2); ctx.lineTo(x + 23, y - 5); ctx.quadraticCurveTo(x + 12, y + 5, x, y); ctx.fill();
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ map, roughness: 1 }); mat.name = key;
  materials.set(key, mat); return mat;
}

function projectCover(object, scale) {
  const positions = object.geometry.attributes.position, uv = [];
  for (let i = 0; i < positions.count; i++) uv.push(positions.getX(i) / scale, positions.getZ(i) / scale);
  object.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return object;
}

function greenMeadow(parent) {
  const positions = [], uv = [], indices = [], vertices = new Map(), divisions = 16;
  const facets = THREE.ShapeUtils.triangulateShape(meadowBorder.map(([x, z]) => new THREE.Vector2(x, -z)), []);
  const vertex = (x, z) => {
    const key = `${Math.round(x * 1e5)},${Math.round(z * 1e5)}`;
    if (!vertices.has(key)) {
      vertices.set(key, positions.length / 3); positions.push(x, meadowHeight(x, z), z); uv.push(x / 18, z / 18);
    }
    return vertices.get(key);
  };
  for (const facet of facets) {
    const [a, b, c] = facet.map(i => meadowBorder[i]), grid = [];
    for (let i = 0; i <= divisions; i++) {
      grid[i] = [];
      for (let j = 0; j <= divisions - i; j++) grid[i][j] = vertex(a[0] + (b[0] - a[0]) * i / divisions + (c[0] - a[0]) * j / divisions, a[1] + (b[1] - a[1]) * i / divisions + (c[1] - a[1]) * j / divisions);
    }
    for (let i = 0; i < divisions; i++) for (let j = 0; j < divisions - i; j++) {
      indices.push(grid[i][j], grid[i + 1][j], grid[i][j + 1]);
      if (i + j < divisions - 1) indices.push(grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  mesh(parent, geometry, coverMaterial('green')).name = 'rolling-green-meadow';
  for (let i = 0; i < meadowBorder.length; i++) {
    const a = meadowBorder[i], b = meadowBorder[(i + 1) % meadowBorder.length];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let nx = (b[1] - a[1]) / length, nz = (a[0] - b[0]) / length;
    if (meadowContains((a[0] + b[0]) / 2 + nx * .1, (a[1] + b[1]) / 2 + nz * .1)) { nx = -nx; nz = -nz; }
    const count = Math.ceil(length / .48);
    for (let j = 0; j < count; j++) {
      const t = (j + .2 + random() * .6) / count, x = THREE.MathUtils.lerp(a[0], b[0], t), z = THREE.MathUtils.lerp(a[1], b[1], t);
      const tuft = grass(parent, x - nx * .08, 2.71, z - nz * .08, .45 + random() * .65, true, Math.atan2(nx, nz));
      tuft.rotation.x = .20 + random() * .08;
    }
  }
}

function coral(parent, x, z, scale = 1, yaw = 0) {
  const plant = group(parent, x, .05, z);
  plant.name = 'rose-coral';
  plant.scale.setScalar(scale);
  plant.rotation.y = yaw;
  branch(plant, [[0, 0, 0], [-.35, 1.6, 0], [.05, 3.3, 0], [.2, 4.7, -.1], [-.05, 6.2, -.2]], [.86, .65, .55, .4, .07], surfaceMaterial(0xed83ac, 'bark'));
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    branch(plant, [[Math.cos(a) * .15, .6, Math.sin(a) * .15], [Math.cos(a) * .8, .15, Math.sin(a) * .8], [Math.cos(a) * 1.5, .04, Math.sin(a) * 1.5]], [.26, .17, .015], 0xce7099, 12, 8);
  }
  tube(plant, [[.2, .15, .52], [-.13, 1.7, .55], [.27, 3.2, .54], [.38, 4.7, .44], [.11, 6.05, .3]], .075, 0xffc0d0, 32);
  const branches = [
    [[-.2, 1.7, 0], [-1.6, 2.0, .1], [-2.8, 1.5, .2], [-2.7, .5, .3], [-2, .7, .4]],
    [[-.2, 2.8, 0], [1.6, 3.1, .15], [3.0, 2.8, .15], [3.5, 3.0, 0]],
    [[0, 4.2, 0], [-1.6, 4.5, 0], [-2.1, 5.8, 0], [-1.6, 6.4, .1], [-.9, 6.0, .15], [-1.15, 5.4, .2]],
    [[.1, 4.9, 0], [1.4, 5.25, 0], [2, 6.5, -.2], [1.4, 7.1, -.3], [.8, 6.75, -.25]],
  ];
  branches.forEach((points, i) => {
    const radius = [.56, .64, .47, .4][i];
    branch(plant, points, [radius, radius * .92, radius * .75, radius * .4, .045], surfaceMaterial(i % 2 ? 0xf295b7 : 0xe67ba6, 'bark'));
    const highlight = points.map(([px, py, pz], index) => [px, py + .08, pz + radius * (1 - index / points.length)]);
    tube(plant, highlight, .024, i % 2 ? 0xffc5d3 : 0xffb5cb, 28);
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    for (let n = 1; n < 11; n++) {
      const t = n / 12, p = curve.getPoint(t), r = radius * (1 - t * .7);
      const spot = ball(plant, p.x - .06, p.y + r * .6, p.z + r * .72, .08 + .05 * Math.sin(n), .04, .10, 0xffc5d7);
      spot.rotation.z = t * 2;
    }
  });
  for (let i = 0; i < 16; i++) {
    const y = .4 + i * .35;
    ball(plant, -.16 + Math.sin(i * 1.8) * .21, y, .59, .21 + random() * .12, .1, .025, i % 2 ? 0xffb9cc : 0xf8a5c5);
  }
  tube(plant, [[-.52, .2, .35], [-.55, 1.6, .42], [-.37, 2.6, .44], [-.5, 3.6, .4]], .045, 0xc6578b);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    const root = ball(plant, Math.cos(a) * .6, .18, Math.sin(a) * .6, .85, .23, .32, 0xd86b92);
    root.rotation.y = -a;
  }
}

function fiddleFern(parent, x, y, z, scale = 1) {
  const fern = group(parent, x, y, z);
  fern.name = 'spiral-fern'; fern.scale.setScalar(scale);
  for (const side of [-1, 1]) {
    const points = [[0, 0, 0], [side * .1, 1.4, 0], [side * .7, 2.6, 0], [side * 1.2, 2.8, 0], [side * 1.5, 2.35, .03], [side * 1.15, 1.95, .06], [side * .8, 2.15, .08], [side * .98, 2.4, .10]];
    branch(fern, points, [.16, .15, .13, .10, .018], side < 0 ? 0x558e82 : 0x8ab394, 48, 10);
    tube(fern, points.map(([x, y, z]) => [x + side * .035, y, z + .11]), .014, 0xb8d5a6, 48);
    for (let i = 0; i < 8; i++) for (const direction of [-1, 1]) {
      const h = .24 + i * .20, px = side * .06 + side * i * .02;
      const leaf = ball(fern, px + direction * .16, h, .04, .23 - i * .013, .047, .10, i % 2 ? 0x82afa0 : 0x4f8e87);
      leaf.rotation.z = direction * .38;
    }
  }
}

function mushroom(parent, x, y, z, size = 1) {
  const g = group(parent, x, y, z);
  g.name = 'striped-alien-mushroom'; g.scale.setScalar(size);
  branch(g, [[0, 0, 0], [.07, .45, 0], [0, .85, 0]], [.22, .13, .17], 0xf2d6b6, 16, 12);
  const crown = group(g, 0, .87, 0); crown.rotation.z = -.13;
  const profile = [[0, -.10], [.3, -.12], [.65, -.08], [.9, .03], [.84, .17], [.61, .35], [.29, .44], [0, .46]];
  mesh(crown, new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 40), surfaceMaterial(0xd96598, 'bark'));
  ring(crown, 0, .02, 0, .88, .028, 0xe9b3c6).rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    const rib = [[.16, -.11], [.45, -.10], [.76, -.035]].map(([r, h]) => [Math.sin(a) * r, h, Math.cos(a) * r]);
    tube(crown, rib, .015, 0x9c497f, 6);
    if (i % 2) tube(crown, [[.17, .45], [.36, .42], [.62, .33], [.76, .23]].map(([r, h]) => [Math.sin(a) * r, h + .014, Math.cos(a) * r]), .026, 0xffc4d2, 12);
    ball(crown, Math.sin(a) * .8, .17, Math.cos(a) * .8, .034, .028, .034, 0xfce3bd);
  }
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    const leaf = ball(g, Math.sin(a) * .5, .12, Math.cos(a) * .5, .22, .085, .62, i % 2 ? 0x729543 : 0x9bbd59);
    leaf.rotation.y = a;
    tube(g, [[Math.sin(a) * .2, .20, Math.cos(a) * .2], [Math.sin(a) * .55, .21, Math.cos(a) * .55], [Math.sin(a), .14, Math.cos(a)]], .013, 0xcde190, 5);
  }
}

function fossil(parent) {
  const g = group(parent, 12.8, 0, 1.7);
  g.name = 'weathered-fossil-tree'; g.rotation.z = -.14;
  const bark = surfaceMaterial(0xc49c70, 'bark');
  const points = [[0, -.3, 0], [-.6, 2, -.4], [-.7, 4, -1], [.25, 6.3, -1.6], [1.2, 7.6, -2.3]];
  branch(g, points, [1.75, 1.3, 1.14, .91, .64], bark, 56, 18);
  branch(g, [[-.45, 2, -.3], [-2, 2.4, .4], [-2.8, 3.5, .6], [-2.7, 4.6, .5]], [.77, .58, .42, .16], bark);
  branch(g, [[-.4, 4, -1], [1.2, 4.4, -.6], [2.3, 5.6, -.5], [2.55, 6.2, -.58]], [.69, .54, .35, .13], bark);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    const groove = points.map(([x, y, z], index) => {
      const r = [1.67, 1.3, 1.13, .90, .63][index];
      return [x + Math.sin(a + index * .10) * r, y + .1, z + Math.cos(a + index * .10) * r];
    });
    tube(g, groove, i % 3 ? .023 : .043, i % 3 ? 0xa47d5c : 0x866550, 36);
    if (i % 2 === 0) tube(g, groove.map(([x, y, z]) => [x + .08, y, z + .018]), .018, 0xecd0a0, 36);
  }
  for (let i = 0; i < 7; i++) {
    const yy = .5 + i * .95, xx = -.35 + Math.sin(i * 1.1) * .4;
    const hole = group(g, xx, yy, 1.31 - i * .30);
    hole.rotation.set(-.08, -.12, .35 + Math.sin(i) * .45);
    const rim = ring(hole, 0, 0, 0, .46, .10, surfaceMaterial(0xe0b88a, 'stone'));
    rim.scale.set(1, .70, 1);
    ball(hole, 0, 0, -.045, .43, .30, .07, 0x634e47);
    ball(hole, 0, -.04, .012, .33, .20, .035, i % 2 ? 0xda8791 : 0x9b695c);
    if (i % 2) ball(hole, -.1, .035, .045, .14, .035, .013, 0xffc4b4);
    for (let j = 0; j < 3; j++) {
      const a = .5 + j * 2;
      tube(hole, [[Math.sin(a) * .5, Math.cos(a) * .35, .015], [Math.sin(a) * .65, Math.cos(a) * .48, -.03], [Math.sin(a + .1) * .78, Math.cos(a + .1) * .6, -.08]], .017, 0x866650, 5);
    }
  }
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    branch(g, [[Math.cos(a) * .5, .9, Math.sin(a) * .5], [Math.cos(a) * 1.55, .25, Math.sin(a) * 1.55], [Math.cos(a) * 2.8, .05, Math.sin(a) * 2.8]], [.65, .35, .035], bark, 20);
  }
  const crown = group(g, 1.25, 7.8, -2.23);
  crown.rotation.x = -.35;
  const end = cylinder(crown, 0, 0, 0, .56, .61, .07, 0x8c6751, 24);
  for (const r of [.15, .29, .45, .59]) ring(crown, 0, .044, 0, r, .022, r === .59 ? 0xe4c092 : 0xc3956c).rotation.x = Math.PI / 2;
  end.receiveShadow = true;
}

let grassGeometry;
const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x439fc7, vertexColors: true, roughness: 1, side: THREE.DoubleSide });
const greenGrassMaterial = new THREE.MeshStandardMaterial({ color: 0xa5c342, vertexColors: true, roughness: 1, side: THREE.DoubleSide });
function grass(parent, x, y, z, size = 1, green = false, yaw = null) {
  if (!grassGeometry) {
    const positions = [], colors = [], uv = [], indices = [];
    for (let blade = 0; blade < 5; blade++) {
      const angle = (blade - 2) * .37, length = .40 + (blade % 3) * .09, start = positions.length / 3;
      for (let row = 0; row <= 6; row++) for (const side of [-1, 0, 1]) {
        const t = row / 6, r = .035 + t * length;
        const w = Math.pow(Math.sin(Math.PI * t), .55) * .075 * side;
        const y = .025 + Math.sin(Math.PI * t) * .115 + t * .055 - Math.abs(side) * .022 * Math.sin(Math.PI * t);
        positions.push(Math.sin(angle) * r + Math.cos(angle) * w, y, Math.cos(angle) * r - Math.sin(angle) * w);
        const shade = .76 + t * .19 + (side === 0 ? .07 : 0);
        colors.push(shade, shade, shade); uv.push((side + 1) / 2, t);
        if (row < 6 && side < 1) {
          const a = start + row * 3 + side + 1;
          indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
        }
      }
    }
    grassGeometry = new THREE.BufferGeometry();
    grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    grassGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    grassGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    grassGeometry.setIndex(indices); grassGeometry.computeVertexNormals();
  }
  const tuft = mesh(parent, grassGeometry, green ? greenGrassMaterial : grassMaterial, x, y, z);
  tuft.rotation.y = yaw ?? random() * Math.PI * 2; tuft.scale.setScalar(size);
  return tuft;
}

function flowerCluster(parent, x, y, z, size = 1) {
  const g = group(parent, x, y, z); g.scale.setScalar(size);
  for (let i = 0; i < 3; i++) {
    const px = (i - 1) * .23, pz = Math.sin(i * 3) * .25, h = .36 + i * .18;
    tube(g, [[px, 0, pz], [px + .08, h * .65, pz], [px, h, pz]], .018, 0x598b80, 8);
    for (let j = 0; j < 5; j++) {
      const a = j / 5 * Math.PI * 2;
      const petal = ball(g, px + Math.sin(a) * .10, h, pz + Math.cos(a) * .10, .075, .035, .14, i % 2 ? 0xe3b6e0 : 0xf5c4da);
      petal.rotation.y = a;
    }
    ball(g, px, h + .025, pz, .064, .04, .064, 0xffe2a0);
  }
  grass(g, 0, 0, 0, .65);
}

function surveyBeacon(parent, x, y, z, yaw = 0) {
  const g = group(parent, x, y, z); g.rotation.y = yaw;
  g.name = 'survey-beacon';
  const alloy = surfaceMaterial(0xcbd7cb, 'metal');
  cylinder(g, 0, .06, 0, .36, .43, .12, 0x4c6466, 8);
  cylinder(g, 0, .64, 0, .085, .14, 1.1, alloy);
  const head = box(g, 0, 1.2, 0, .6, .46, .27, alloy, .05); head.rotation.x = -.18;
  box(head, 0, .015, .145, .46, .30, .018, 0x244e5a, .018);
  for (let i = 0; i < 4; i++) box(head, -.15 + i * .095, -.025, .161, .046, .08 + i * .035, .012, material(0x8ddacb, true), .005);
  cylinder(g, .21, 1.66, -.04, .02, .025, .47, 0x546e70, 8);
  ball(g, .21, 1.92, -.04, .05, .05, .05, material(0xffc789, true));
}

function atmosphere(parent) {
  const count = 70, positions = new Float32Array(count * 3), origins = [], colors = [];
  for (let i = 0; i < count; i++) {
    origins.push([(random() - .5) * 36, .6 + random() * 7, (random() - .5) * 30, random() * Math.PI * 2]);
    const color = new THREE.Color(i % 3 ? 0xd1f3dd : 0xffdbba); colors.push(color.r, color.g, color.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d'), gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)'); gradient.addColorStop(.2, 'rgba(255,255,255,.8)'); gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 32, 32);
  const motes = new THREE.Points(geometry, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(canvas), vertexColors: true, size: .14, transparent: true, opacity: .65, depthWrite: false, blending: THREE.AdditiveBlending }));
  motes.name = 'floating-spores'; motes.frustumCulled = false; parent.add(motes);
  return time => {
    origins.forEach(([x, y, z, phase], i) => {
      positions[i * 3] = x + Math.sin(time * .18 + phase) * .6;
      positions[i * 3 + 1] = y + Math.sin(time * .3 + phase) * .35;
      positions[i * 3 + 2] = z + Math.cos(time * .16 + phase) * .45;
    });
    geometry.attributes.position.needsUpdate = true;
  };
}

function smoothBall(...args) {
  const object = ball(...args);
  object.geometry = sphere;
  return object;
}

function armorPlate(parent, points, depth, color, x = 0, y = 0, z = 0) {
  const shape = new THREE.Shape();
  points.forEach(([px, py], i) => i ? shape.lineTo(px, py) : shape.moveTo(px, py));
  shape.closePath();
  return mesh(parent, new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .015, bevelThickness: .015, bevelSegments: 2, steps: 1 }), color, x, y, z);
}

export function createRobot() {
  const root = group(), body = group(root);
  root.name = 'seer-red-black-swordsman';
  const finish = (name, color, roughness, metalness = .18) => {
    if (!materials.has(name)) materials.set(name, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
    return materials.get(name);
  };
  const ink = finish('seer-armor-black', 0x11171c, .32);
  const red = finish('seer-armor-red', 0xe20b15, .27);
  const brightRed = finish('seer-armor-highlight', 0xff2530, .25);
  const silver = finish('seer-armor-silver', 0xc5e0e4, .31, .48);
  const yellow = finish('seer-visor-gold', 0xf4cc13, .38, .14);
  const optic = (parent, x, y, z, sx, sy, sz) => {
    const geometry = new THREE.SphereGeometry(1, 32, 24);
    const positions = geometry.attributes.position, colors = [];
    const blue = new THREE.Color(0x078fdd), white = new THREE.Color(0xe5fbff);
    const light = new THREE.Vector3(-.18, .22, 1).normalize();
    const normal = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) {
      const brightness = THREE.MathUtils.smoothstep(normal.fromBufferAttribute(positions, i).dot(light), .25, .98);
      const color = blue.clone().lerp(white, brightness);
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    if (!materials.has('seer-blue-optics')) materials.set('seer-blue-optics', new THREE.MeshBasicMaterial({ vertexColors: true }));
    const lens = mesh(parent, geometry, materials.get('seer-blue-optics'), x, y, z);
    lens.scale.set(sx, sy, sz);
  };
  const boots = group(body), torso = group(body);
  for (const side of [-1, 1]) {
    const foot = group(boots, side * .235, 0, .045); foot.rotation.y = side * .10;
    box(foot, 0, .09, .06, .37, .14, .51, ink, .065);
    box(foot, 0, .185, .13, .34, .19, .31, red, .065);
    box(foot, 0, .23, .245, .26, .045, .035, brightRed, .012);
    box(foot, 0, .33, -.06, .29, .23, .30, 0x293236, .045);
    cylinder(foot, 0, .52, -.06, .105, .13, .25, ink, 16);
    smoothBall(foot, 0, .45, .10, .055, .11, .028, silver);
    box(foot, 0, .37, .16, .17, .065, .05, red, .016);
  }
  ball(torso, 0, .83, -.015, .38, .34, .28, ink);
  box(torso, 0, .68, .045, .64, .15, .42, 0x30383d, .045);
  box(torso, 0, .70, .274, .16, .105, .035, red, .018);
  armorPlate(torso, [[-.28, 0], [-.29, .29], [0, .36], [.29, .29], [.28, 0], [0, -.08]], .06, 0x283237, 0, .91, .22);
  for (const side of [-1, 1]) {
    armorPlate(torso, [[0, 0], [side * .13, .02], [side * .17, .25], [side * .06, .28]], .035, red, side * .14, .90, .293);
    ball(torso, side * .30, .82, .205, .044, .053, .02, silver);
  }
  cylinder(torso, 0, 1.22, 0, .19, .22, .20, 0x404c50, 20);
  boots.scale.y = torso.scale.y = .67;
  torso.scale.x = .88;
  const head = group(body, 0, 1.47, -.015);
  head.name = 'yellow-dual-eye-helmet';
  smoothBall(head, 0, -.02, 0, .65, .59, .51, yellow);
  smoothBall(head, 0, .29, -.075, .665, .465, .515, ink);
  smoothBall(head, 0, -.31, .055, .58, .255, .46, yellow);
  const chin = ring(head, 0, -.525, .015, .455, .037, ink);
  chin.rotation.x = Math.PI / 2; chin.scale.set(1.18, .91, 1);
  const eye = group(head, 0, .015, .501);
  const bezel = ring(eye, 0, 0, 0, .325, .052, yellow);
  bezel.scale.set(.91, 1.12, 1);
  smoothBall(eye, 0, 0, -.009, .289, .354, .062, 0x303c40);
  smoothBall(eye, 0, .003, .043, .253, .308, .029, 0x091820);
  for (const side of [-1, 1]) {
    const displayEye = smoothBall(eye, side * .105, .031, .071, .065, .163, .018, 0xf1fcff);
    displayEye.rotation.z = side * -.055;
    smoothBall(eye, side * .105, -.068, .087, .043, .050, .005, 0xa4e4fa);
  }
  for (const side of [-1, 1]) {
    // Red armor runs front to back along the temples; its broad side is visible in three-quarter view.
    const shape = new THREE.Shape();
    shape.moveTo(side * -.26, .30);
    shape.lineTo(side * -.21, .61);
    shape.quadraticCurveTo(side * .10, .75, side * .34, .76);
    shape.lineTo(side * .38, .43);
    shape.quadraticCurveTo(side * .15, .26, side * -.26, .30);
    shape.closePath();
    const crownGeometry = new THREE.ExtrudeGeometry(shape, { depth: .15, bevelEnabled: true, bevelSize: .035, bevelThickness: .035, bevelSegments: 3, steps: 1, curveSegments: 12 });
    crownGeometry.rotateY(side * .95);
    mesh(head, crownGeometry, red, side * .29, side > 0 ? .18 : -.21, -.025);
    const temple = armorPlate(head, [[-.38, .20], [-.20, .43], [.18, .48], [.36, .29], [.18, .12]], .08, ink);
    temple.rotation.y = Math.PI / 2; temple.position.set(side > 0 ? .50 : -.58, .15, 0);
    const stripe = armorPlate(head, [[-.35, .28], [.12, .45], [.24, .40], [-.27, .22]], .026, silver);
    stripe.rotation.y = Math.PI / 2; stripe.position.set(side > 0 ? .595 : -.63, .15, 0);
    smoothBall(head, side * .51, .025, -.285, .165, .30, .17, red);
    const ear = group(head, side * .59, -.155, .125); ear.rotation.y = side * Math.PI / 2;
    cylinder(ear, 0, 0, 0, .26, .26, .16, ink, 32).rotation.x = Math.PI / 2;
    ring(ear, 0, 0, .088, .206, .033, 0x405a67);
    optic(ear, 0, 0, .105, .173, .182, .09);
  }
  armorPlate(head, [[-.13, .25], [-.22, .67], [.035, .91], [.22, .67], [.13, .25]], .085, ink, 0, 0, .32);
  ring(head, 0, .60, .426, .061, .018, 0xb8202d);
  box(head, 0, .595, .445, .027, .058, .016, red, .006);
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = group(body, side * .37, .73, 0);
    arm.name = side < 0 ? 'sword-arm' : 'free-arm';
    ball(arm, side * .065, -.015, 0, .205, .18, .19, red);
    smoothBall(arm, side * .105, -.045, .13, .155, .135, .095, finish('seer-shoulder-steel', 0x57777b, .36, .32));
    if (side < 0) {
      branch(arm, [[-.12, -.06, 0], [-.29, .18, .13], [-.49, .50, .27]], [.095, .09, .085], ink, 16);
      smoothBall(arm, -.49, .50, .27, .15, .165, .14, ink);
      optic(arm, -.52, .52, .399, .115, .13, .055);
    } else {
      box(arm, .11, -.22, .03, .20, .23, .23, ink, .06).rotation.z = .16;
      box(arm, .12, -.20, .17, .13, .15, .045, red, .025);
      smoothBall(arm, .13, -.37, .08, .14, .12, .14, ink);
      for (let i = 0; i < 3; i++) box(arm, .065 + i * .06, -.37, .21, .037, .075, .024, 0x596265, .012);
    }
    arms.push(arm);
  }
  const sword = group(arms[0], -.54, .55, .20);
  sword.name = 'blue-light-sword'; sword.rotation.z = .12;
  cylinder(sword, 0, 0, 0, .062, .073, .28, ink, 16);
  box(sword, 0, .15, 0, .27, .065, .11, 0x344a58, .024);
  const blade = armorPlate(sword, [[-.040, 0], [-.033, 1.11], [0, 1.25], [.033, 1.11], [.040, 0]], .024, 0x66bdf5, 0, .19, -.02);
  blade.castShadow = false;
  armorPlate(sword, [[-.017, 0], [-.014, 1.08], [0, 1.19], [.014, 1.08], [.017, 0]], .01, material(0xd8f8ff, true), 0, .22, .026).castShadow = false;
  box(torso, 0, .98, -.34, .45, .48, .23, ink, .055);
  for (const side of [-1, 1]) {
    cylinder(torso, side * .22, .98, -.41, .10, .13, .42, 0x5c7076, 16);
    box(torso, side * .23, 1.14, -.46, .13, .09, .09, red, .018);
  }
  batch(boots); batch(torso); batch(head);
  arms.forEach(arm => batch(arm));
  root.userData.body = body;
  root.userData.head = head;
  root.userData.arms = arms;
  return root;
}

export function createPipi() {
  const root = group(), body = group(root);
  root.name = 'pipi-pink-round-bird';
  const skin = 0xf1c1d8, pale = 0xf9dce9, plum = 0x3d253c;
  const profile = [[0, .31], [.19, .33], [.31, .43], [.38, .62], [.37, .80], [.29, .94], [.14, 1.005], [0, 1.015]];
  const geometry = new THREE.LatheGeometry(new THREE.SplineCurve(profile.map(p => new THREE.Vector2(...p))).getPoints(36), 48);
  const positions = geometry.attributes.position, colors = [];
  const pink = new THREE.Color(skin), cream = new THREE.Color(pale);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const mask = Math.exp(-Math.pow(x / .34, 4) - Math.pow((y - .73) / .32, 4)) * Math.pow(Math.max(0, z / .38), 2);
    const tint = pink.clone().lerp(cream, mask * .95);
    colors.push(tint.r, tint.g, tint.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  if (!materials.has('pipi-skin')) materials.set('pipi-skin', new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .82 }));
  const silhouette = mesh(body, geometry, materials.get('pipi-skin'));
  silhouette.scale.z = .89;
  for (const side of [-1, 1]) {
    smoothBall(body, side * .137, .65, .319, .048, .063, .012, 0xe5b9d0);
    smoothBall(body, side * .137, .654, .332, .038, .051, .013, 0x342d41);
    smoothBall(body, side * .137 - .009, .674, .345, .011, .014, .005, 0xffffff);
    smoothBall(body, side * .15, .30, .025, .065, .105, .066, 0xd891b3);
    const foot = smoothBall(body, side * .16, .239, .092, .084, .094, .094, 0xf0bbd4);
    foot.rotation.z = side * -.2;
    const wing = group(root, side * .305, .926, -.025);
    wing.name = side < 0 ? 'pipi-left-wing' : 'pipi-right-wing';
    branch(wing, [[0, 0, 0], [side * .21, .105, 0], [side * .43, .136, -.018], [side * .60, .085, 0]], [.046, .054, .062, .052], pale, 24, 12);
    tube(wing, [[side * .05, -.015, .041], [side * .26, .052, .055], [side * .47, .075, .04], [side * .60, .02, .04]], .017, 0xc998ba, 16);
    branch(wing, [[side * .55, .118, -.003], [side * .65, .063, 0], [side * .75, -.063, .012], [side * .81, -.21, .025], [side * .78, -.265, .03]], [.060, .115, .139, .102, .018], plum, 28, 16);
    branch(wing, [[side * .583, .103, .075], [side * .69, .001, .106], [side * .747, -.125, .126]], [.028, .041, .009], 0x68425e, 16, 8);
    tube(wing, [[side * .68, -.067, .129], [side * .75, -.18, .118], [side * .765, -.233, .073]], .008, 0x251f30, 12);
    batch(wing);
    root.userData[side < 0 ? 'leftWing' : 'rightWing'] = wing;
  }
  const beak = armorPlate(body, [[-.056, .012], [.056, .012], [.023, -.045], [0, -.058], [-.023, -.045]], .033, 0x84acd8, 0, .533, .337);
  beak.rotation.x = -.2;
  tube(body, [[-.041, .53, .376], [0, .518, .387], [.041, .53, .376]], .007, 0x527faa, 8);
  batch(body);
  root.userData.body = body;
  return root;
}

export function createBibo() {
  const root = group(), pose = group(root), body = group(pose);
  root.name = 'bibo-pink-crested-bird';
  pose.rotation.y = -.35;
  const pink = 0xefb4cd, pale = 0xffd7e6, plum = 0x63334e, white = 0xfff8f2;
  // These profiles are solids with rounded edges: the crest, bib and folded
  // feathers keep the reference's silhouette from every side of the bird.
  const profile = (parent, shape, depth, color, x = 0, bevel = .04) => {
    if (depth >= .30) {
      const contour = shape.getPoints(20), points = [], indices = [], vertices = new Map();
      if (contour[0].equals(contour.at(-1))) contour.pop();
      const facets = THREE.ShapeUtils.triangulateShape(contour, []), divisions = 9;
      const vertex = (u, v, side) => {
        let distance = Infinity;
        for (let i = 0; i < contour.length; i++) {
          const a = contour[i], b = contour[(i + 1) % contour.length], dx = b.x - a.x, dy = b.y - a.y;
          const t = Math.max(0, Math.min(1, ((u - a.x) * dx + (v - a.y) * dy) / (dx * dx + dy * dy)));
          distance = Math.min(distance, Math.hypot(u - a.x - dx * t, v - a.y - dy * t));
        }
        const t = Math.min(1, distance / .19);
        const w = side * (depth / 2 + bevel + .025 * Math.sin(t * Math.PI / 2));
        const key = `${Math.round(u * 1e6)},${Math.round(v * 1e6)},${Math.round(w * 1e6)}`;
        if (!vertices.has(key)) { vertices.set(key, points.length / 3); points.push(u, v, w); }
        return vertices.get(key);
      };
      for (const facet of facets) {
        const [a, b, c] = facet.map(index => contour[index]);
        const sign = Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
        for (const side of [-1, 1]) {
          const grid = [];
          for (let i = 0; i <= divisions; i++) {
            grid[i] = [];
            for (let j = 0; j <= divisions - i; j++) grid[i][j] = vertex(a.x + (b.x - a.x) * i / divisions + (c.x - a.x) * j / divisions, a.y + (b.y - a.y) * i / divisions + (c.y - a.y) * j / divisions, side);
          }
          const triangle = (a, b, c) => side === sign ? indices.push(a, b, c) : indices.push(a, c, b);
          for (let i = 0; i < divisions; i++) for (let j = 0; j < divisions - i; j++) {
            triangle(grid[i][j], grid[i + 1][j], grid[i][j + 1]);
            if (j + i < divisions - 1) triangle(grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]);
          }
        }
      }
      const rim = new THREE.ExtrudeGeometry(shape, { depth, steps: 1, curveSegments: 20, bevelEnabled: true, bevelSegments: 5, bevelSize: bevel, bevelThickness: bevel });
      const sideFaces = rim.groups.find(part => part.materialIndex === 1), rimPositions = rim.attributes.position;
      for (let i = sideFaces.start; i < sideFaces.start + sideFaces.count; i++) {
        const u = rimPositions.getX(i), v = rimPositions.getY(i), w = rimPositions.getZ(i) - depth / 2;
        const key = `${Math.round(u * 1e6)},${Math.round(v * 1e6)},${Math.round(w * 1e6)}`;
        if (!vertices.has(key)) { vertices.set(key, points.length / 3); points.push(u, v, w); }
        indices.push(vertices.get(key));
      }
      rim.dispose();
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3)); geometry.setIndex(indices);
      geometry.computeVertexNormals(); geometry.rotateY(-Math.PI / 2);
      return mesh(parent, geometry, color, x);
    }
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, steps: 1, curveSegments: 22, bevelEnabled: true, bevelSegments: 4, bevelSize: bevel, bevelThickness: bevel });
    geometry.translate(0, 0, -depth / 2); geometry.rotateY(-Math.PI / 2);
    return mesh(parent, geometry, color, x);
  };
  for (const side of [-1, 1]) {
    const foot = group(body, side * .215, 0, side < 0 ? .10 : .26);
    const web = new THREE.Shape();
    web.moveTo(-.055, -.13); web.quadraticCurveTo(-.09, -.03, -.22, .055);
    web.quadraticCurveTo(-.26, .10, -.20, .13); web.lineTo(-.065, .12);
    web.lineTo(-.018, .30); web.quadraticCurveTo(.016, .345, .044, .29);
    web.lineTo(.093, .13); web.lineTo(.23, .095);
    web.quadraticCurveTo(.26, .07, .20, .033); web.lineTo(.07, -.07);
    web.lineTo(.055, -.13); web.closePath();
    const geometry = new THREE.ExtrudeGeometry(web, { depth: .046, bevelEnabled: true, bevelSegments: 3, bevelSize: .017, bevelThickness: .016 });
    geometry.rotateX(Math.PI / 2);
    mesh(foot, geometry, 0x267cad, 0, .105, 0);
    tube(foot, [[0, .10, .01], [.022, .23, -.035], [.023, .45, -.055]], .053, 0x388db9, 14);
    tube(foot, [[-.02, .117, .02], [.003, .117, .16], [.009, .11, .265]], .010, 0x66b2d8, 8);
  }
  const belly = smoothBall(body, 0, .88, -.13, .48, .54, .61, pink);
  belly.rotation.x = -.23;
  smoothBall(body, 0, .72, -.35, .405, .32, .48, 0xdf9cb9);
  // Three separated tail feathers fan upward behind the folded wings.
  const tailFeather = (start, end, width, x) => {
    const dz = end[0] - start[0], dy = end[1] - start[1], length = Math.hypot(dz, dy);
    const point = (t, w) => [start[0] + dz * t - dy / length * w, start[1] + dy * t + dz / length * w];
    const outline = new THREE.Shape();
    outline.moveTo(...point(0, -.035));
    outline.bezierCurveTo(...point(.30, -width * .75), ...point(.76, -width), ...point(.94, -width * .75));
    outline.bezierCurveTo(...point(1.08, -width * .48), ...point(1.10, width * .50), ...point(.94, width * .80));
    outline.bezierCurveTo(...point(.72, width), ...point(.24, width * .6), ...point(0, .035)); outline.closePath();
    profile(body, outline, .11, pale, x, .019);
    const tip = new THREE.Shape(); tip.moveTo(...point(.78, -width * .90));
    tip.quadraticCurveTo(...point(.87, -width * .90), ...point(.94, -width * .75));
    tip.bezierCurveTo(...point(1.08, -width * .48), ...point(1.10, width * .50), ...point(.94, width * .80));
    tip.quadraticCurveTo(...point(.87, width * .92), ...point(.78, width * .91));
    tip.quadraticCurveTo(...point(.71, 0), ...point(.78, -width * .90)); tip.closePath();
    profile(body, tip, .12, plum, x, .023);
    for (const side of [-1, 1]) {
      const sheen = smoothBall(body, x + side * .079, point(.91, 0)[1], point(.91, 0)[0], .018, width * .29, width * .49, 0xa36489);
      sheen.rotation.x = Math.atan2(dz, dy);
    }
  };
  tailFeather([-.46, 1.07], [-.69, 1.96], .105, -.075);
  tailFeather([-.49, 1.00], [-1.29, 1.91], .137, -.025);
  tailFeather([-.53, .89], [-1.61, 1.37], .150, .075);

  const bib = new THREE.Shape();
  bib.moveTo(.37, .50);
  bib.bezierCurveTo(.73, .58, .83, .96, .80, 1.32);
  bib.bezierCurveTo(.79, 1.63, .77, 1.93, .87, 2.10);
  bib.bezierCurveTo(.98, 2.29, .87, 2.48, .69, 2.49);
  bib.bezierCurveTo(.45, 2.50, .20, 2.37, .21, 2.18);
  bib.bezierCurveTo(.24, 1.98, -.02, 1.83, .02, 1.63);
  bib.bezierCurveTo(.04, 1.35, .38, 1.06, .29, .56); bib.closePath();
  profile(body, bib, .32, white, 0, .10);

  // A broad two-lobed crown flows into the back of the head, rather than
  // sitting on top as a separate tuft.
  const crest = new THREE.Shape();
  crest.moveTo(.90, 2.12);
  crest.bezierCurveTo(1.005, 2.24, .97, 2.42, .85, 2.54);
  crest.bezierCurveTo(.83, 2.74, .89, 3.035, .74, 3.045);
  crest.bezierCurveTo(.65, 3.068, .63, 3.008, .58, 3.015);
  crest.bezierCurveTo(.35, 3.12, .105, 3.035, .061, 2.81);
  crest.bezierCurveTo(.009, 2.52, .081, 2.14, -.06, 1.94);
  crest.quadraticCurveTo(-.13, 1.85, -.23, 1.855);
  crest.bezierCurveTo(.003, 1.755, .24, 1.96, .30, 2.28);
  crest.bezierCurveTo(.34, 2.49, .53, 2.48, .58, 2.31);
  crest.quadraticCurveTo(.72, 2.095, .90, 2.12); crest.closePath();
  profile(body, crest, .36, pale, 0, .045);
  const skinRadius = (shape, z, y, halfWidth) => {
    const contour = shape.getPoints(20);
    let distance = Infinity;
    for (let i = 0; i < contour.length - 1; i++) {
      const a = contour[i], b = contour[i + 1], dz = b.x - a.x, dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((z - a.x) * dz + (y - a.y) * dy) / (dz * dz + dy * dy)));
      distance = Math.min(distance, Math.hypot(z - a.x - dz * t, y - a.y - dy * t));
    }
    const t = Math.min(1, distance / .19);
    return halfWidth + .025 * Math.sin(t * Math.PI / 2);
  };
  for (const side of [-1, 1]) {
    const face = new THREE.Shape(); face.moveTo(.90, 2.12);
    face.bezierCurveTo(1.005, 2.27, .89, 2.47, .69, 2.49);
    face.bezierCurveTo(.63, 2.43, .60, 2.32, .58, 2.20);
    face.bezierCurveTo(.60, 2.12, .79, 2.09, .90, 2.12); face.closePath();
    const faceSurface = profile(body, face, .008, pale, 0, .004);
    const facePositions = faceSurface.geometry.attributes.position;
    for (let i = 0; i < facePositions.count; i++) facePositions.setX(i, side * (skinRadius(bib, facePositions.getZ(i), facePositions.getY(i), .26) + .009) + facePositions.getX(i) * .25);
    faceSurface.geometry.computeVertexNormals();
    const blaze = new THREE.Shape(); blaze.moveTo(.857, 2.455);
    blaze.bezierCurveTo(.907, 2.56, .855, 2.65, .825, 2.62);
    blaze.quadraticCurveTo(.825, 2.50, .857, 2.455); blaze.closePath();
    const forehead = profile(body, blaze, .008, white, 0, .001);
    const blazePositions = forehead.geometry.attributes.position;
    for (let i = 0; i < blazePositions.count; i++) blazePositions.setX(i, side * (skinRadius(crest, blazePositions.getZ(i), blazePositions.getY(i), .225) + .004) + blazePositions.getX(i) * .25);
    forehead.geometry.computeVertexNormals();
    const cheek = new THREE.Shape();
    cheek.moveTo(.76, 2.20); cheek.quadraticCurveTo(.67, 2.22, .55, 2.17);
    cheek.bezierCurveTo(.57, 1.99, .61, 1.83, .71, 1.65);
    cheek.bezierCurveTo(.75, 1.88, .82, 2.07, .76, 2.20); cheek.closePath();
    const cheekSurface = profile(body, cheek, .013, 0xf376a3, 0, .012);
    const cheekPositions = cheekSurface.geometry.attributes.position;
    for (let i = 0; i < cheekPositions.count; i++) cheekPositions.setX(i, side * (skinRadius(bib, cheekPositions.getZ(i), cheekPositions.getY(i), .26) + .007) + cheekPositions.getX(i) * .30);
    cheekSurface.geometry.computeVertexNormals();
    const eyeX = skinRadius(bib, .734, 2.235, .26) + .018;
    const eye = smoothBall(body, side * eyeX, 2.235, .734, .034, .100, .064, 0x27272b);
    eye.rotation.x = -.24;
    smoothBall(body, side * (eyeX + .031), 2.273, .752, .011, .028, .023, white);
    const wing = group(pose, side * .448, 1.20, -.045);
    wing.scale.set(1, 1.08, 1.08);
    const outline = new THREE.Shape();
    outline.moveTo(.32, .21); outline.bezierCurveTo(.03, .34, -.45, .17, -.91, -.14);
    outline.quadraticCurveTo(-1.07, -.25, -.97, -.34);
    outline.quadraticCurveTo(-.91, -.39, -.80, -.31);
    outline.quadraticCurveTo(-.90, -.52, -.75, -.54);
    outline.quadraticCurveTo(-.64, -.55, -.60, -.38);
    outline.quadraticCurveTo(-.61, -.63, -.46, -.61);
    outline.quadraticCurveTo(-.35, -.61, -.32, -.39);
    outline.bezierCurveTo(-.04, -.50, .39, -.13, .32, .21); outline.closePath();
    profile(wing, outline, .025, plum, side * .030, .012);
    const cover = new THREE.Shape();
    cover.moveTo(.31, .21); cover.bezierCurveTo(.03, .34, -.44, .16, -.94, -.15);
    cover.quadraticCurveTo(-1.005, -.24, -.86, -.26);
    cover.quadraticCurveTo(-.83, -.255, -.80, -.20);
    cover.quadraticCurveTo(-.78, -.37, -.66, -.30);
    cover.quadraticCurveTo(-.635, -.27, -.625, -.22);
    cover.quadraticCurveTo(-.56, -.40, -.44, -.31);
    cover.bezierCurveTo(-.17, -.47, .37, -.18, .31, .21); cover.closePath();
    profile(wing, cover, .018, pale, side * .058, .013);
    batch(wing);
    root.userData[side < 0 ? 'leftWing' : 'rightWing'] = wing;
  }
  // The slender blue bill drops from the face, with a darker lower edge.
  const bill = new THREE.Shape(); bill.moveTo(.89, 2.14); bill.lineTo(1.10, 2.075);
  bill.quadraticCurveTo(1.115, 1.875, 1.20, 1.66); bill.lineTo(.955, 1.95); bill.closePath();
  profile(body, bill, .105, 0x379bcc, 0, .01);
  for (const side of [-1, 1]) tube(body, [[side * .064, 2.105, .988], [side * .064, 1.985, 1.012], [side * .045, 1.748, 1.156]], .013, 0x7cd1e9, 12);
  batch(body);
  root.userData.body = body;
  root.rotation.y = -.55;
  return root;
}

export function createPet() {
  const root = group();
  ball(root, 0, 0, 0, .33, .36, .3, 0xa4da49);
  ball(root, 0, .045, .24, .265, .25, .13, 0x223f44);
  ball(root, -.09, .14, .346, .07, .08, .02, 0xecfff4);
  const leaf = ball(root, .1, .49, 0, .11, .3, .065, 0xb6e360);
  leaf.rotation.z = -.7;
  const leaf2 = ball(root, -.11, .42, 0, .09, .25, .06, 0x91c640);
  leaf2.rotation.z = .4;
  return root;
}

function createAmberCluster(parent, variant) {
  // The reference deposits are loose, squat yellow stones with broad cream
  // bevels, rather than upright crystal prisms or pieces mounted in rock bases.
  const key = 'reference-amber-stone';
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: .67, metalness: 0,
    emissive: 0xffd956, emissiveIntensity: .16,
  }));
  const layouts = [
    [[0, -.12, 1.62, 1.06, 1.25, -.16], [-.78, .40, .91, .61, .82, .26], [.73, .08, .49, .48, .58, -.5]],
    [[-.10, 0, .94, .66, .87, -.35], [-.77, .19, .57, .41, .61, .24], [-.32, .55, .63, .42, .53, -.14], [.51, .32, .66, .48, .73, .55]],
    [[.08, .17, 1.03, .63, .81, .12], [-.62, .37, .69, .49, .68, -.4], [.48, -.55, .62, .47, .57, .2]],
  ];
  const outline = [[-.72, -.67], [.07, -1], [.79, -.53], [1, .20], [.39, .91], [-.47, .86], [-1, .11]];
  for (const [x, z, width, height, depth, yaw] of layouts[variant]) {
    const positions = [], colors = [];
    const addTriangle = (a, b, c, tint) => {
      const color = new THREE.Color(tint);
      for (const p of [a, b, c]) { positions.push(...p); colors.push(color.r, color.g, color.b); }
    };
    const addFace = (points, tint, rim) => {
      const center = points.reduce((sum, p) => sum.map((v, i) => v + p[i] / points.length), [0, 0, 0]);
      const inner = rim ? points.map(p => p.map((v, i) => THREE.MathUtils.lerp(v, center[i], .105))) : points;
      for (let i = 0; i < points.length; i++) {
        const next = (i + 1) % points.length;
        addTriangle(center, inner[i], inner[next], tint);
        if (rim) {
          addTriangle(points[i], points[next], inner[next], rim);
          addTriangle(points[i], inner[next], inner[i], rim);
        }
      }
    };
    const layers = [[.77, .02, 0, 0], [1, .17, 0, 0], [.89, .67, -.04, -.02], [.55, 1, -.12, -.08]];
    const rings = layers.map(([radius, y, dx, dz]) => outline.map(([px, pz]) => [
      (px * radius + dx) * width * .5, y * height, (pz * radius + dz) * depth * .5,
    ]));
    const sides = [0xffe166, 0xf7d047, 0xeebb32, 0xf5c536, 0xffd84c, 0xffe783, 0xffed9b];
    const bevels = [0xfff3b1, 0xffed8b, 0xffdb48, 0xffdf50, 0xffed80, 0xfff6ba, 0xfff8d3];
    for (let level = 0; level < rings.length - 1; level++) {
      for (let i = 0; i < outline.length; i++) {
        const next = (i + 1) % outline.length;
        addFace([rings[level][i], rings[level + 1][i], rings[level + 1][next], rings[level][next]],
          level === 2 ? bevels[i] : sides[i], level === 2 ? 0xfff5b5 : null);
      }
    }
    addFace([...rings.at(-1)].reverse(), 0xffe77b, 0xfffbd5);
    addFace(rings[0], 0xdca633);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const stone = mesh(parent, geometry, materials.get(key), x, 0, z);
    stone.rotation.y = yaw;
  }
}

export function createWorld() {
  seed = 917;
  prepareLeaves();
  const root = group(), terrain = group(root), scenery = group(root);
  root.name = 'klose-grassland'; terrain.name = 'weathered-clearing'; scenery.name = 'layered-landscape';
  strataMaterial.map = surfaceMaterial(0xffffff, 'stone').map;
  strataMaterial.bumpMap = strataMaterial.map; strataMaterial.bumpScale = .035;
  const surface = groundTexture();
  const ground = mesh(terrain, new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map: surface.map, bumpMap: surface.bumpMap, bumpScale: .035, roughness: .98 }), 0, -.05, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  // Crack decals make the main clearing feel like a hand-drawn, weathered alien plain.
  const cracks = [
    [[-8.8, 6.8], [-7.4, 6.15], [-6.4, 6.3], [-5.5, 5.55], [-4.4, 5.6]],
    [[-1.4, 8.1], [-.5, 7.35], [.7, 7.22], [1.5, 6.45], [2.6, 6.25]],
    [[5.6, 7.8], [6.4, 7.05], [7.4, 6.85], [8.2, 6.16]],
    [[-8.7, 2.1], [-7.6, 1.75], [-7.1, .98], [-6.1, .55], [-5.25, -.25]],
    [[-2.5, 3.45], [-1.5, 2.85], [-.7, 2.9], [.1, 2.18], [1.35, 2.05]],
    [[3.8, 3.65], [4.35, 2.86], [5.45, 2.68], [6.05, 1.92], [7.1, 1.65]],
    [[-5.8, -2.3], [-4.75, -1.72], [-3.65, -1.9], [-2.7, -1.35]],
    [[.7, -.55], [1.6, -1.12], [2.55, -1.02], [3.55, -1.66], [4.75, -1.38]],
  ];
  cracks.forEach((points, index) => groundCrack(terrain, points, index % 3 === 0 ? .05 : .03));
  const wall = [];
  for (let i = 0; i <= 24; i++) {
    const x = -24 + i * 2;
    wall.push([x, -7.5 + Math.max(0, x - 3) ** 2 * .038 + Math.sin(i * .85) * .7]);
  }
  projectCover(landShape(scenery, [...wall, [80, -30], [100, -120], [0, -125], [-100, -120], [-80, -30]], 2.5, coverMaterial('blue')), 20);
  const ridgePositions = [], ridgeColors = [], ridgeIndices = [];
  for (let row = 0; row < 4; row++) for (let i = 0; i <= 48; i++) {
    const x = -72 + i * 3, crest = 3.5 + Math.sin(x * .13) * 1.8 + Math.cos(x * .29) * .65;
    ridgePositions.push(x, row === 0 ? 2.52 : row === 3 ? .1 : crest * (row === 1 ? 1 : 1.3), [-65, -72, -79, -92][row] + Math.sin(x * .1) * 2);
    const palette = meadowContains(x, [-65, -72, -79, -92][row]) ? [0x91ad3d, 0x8fa740, 0x7f9647, 0xb6c58d] : [0x42a4cb, 0x63b0cf, 0x8fbed0, 0xb9cbd0];
    const color = new THREE.Color(palette[row]); ridgeColors.push(color.r, color.g, color.b);
    if (row && i) {
      const a = (row - 1) * 49 + i - 1, b = row * 49 + i - 1;
      ridgeIndices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const ridge = new THREE.BufferGeometry();
  ridge.setAttribute('position', new THREE.Float32BufferAttribute(ridgePositions, 3));
  ridge.setAttribute('color', new THREE.Float32BufferAttribute(ridgeColors, 3));
  ridge.setIndex(ridgeIndices); ridge.computeVertexNormals();
  mesh(scenery, ridge, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }));
  for (let i = 0; i < wall.length - 1; i++) {
    const [x, z] = wall[i];
    for (let row = 0; row < 3; row++) {
      const width = 1.12 + random() * .52, depth = 1.15 + random() * .4;
      const height = .60 + random() * .19, rockX = x + (row % 2) * .9, rockY = .03 + row * .76;
      rockSlab(scenery, rockX, rockY, z + .45 + (2 - row) * .36, width, height, depth, [0xc5a074, 0xe2b88a, 0xd6aa7d, 0xb89b77][(i + row) % 4]);
    }
    if (!nearMeadow(x, z, .8)) {
      // Overlapping lobes hang from the bank; the interior stays a broad blue carpet.
      bluePlant(scenery, x, 2.53, z - 1.45, 1.12 + random() * .14, -.12 + random() * .24, .17);
      if (i % 2 === 0) bluePlant(scenery, x - .55, 2.55, z - 2.85, 1.20, .08, .04);
    }
  }
  for (let row = 0; row < 4; row++) for (let col = 0; col < 12; col++) {
    const x = -31 + col * 5.4 + (row % 2) * 2.1;
    const z = -14.5 - row * 5.4 + Math.sin(col * 2.4) * 1.1;
    if (nearMeadow(x, z, 2.4)) continue;
    // Sparse low folds avoid the former wall-to-wall rows of individual shrubs.
    const cover = bluePlant(scenery, x, 2.55, z, 1.25 + random() * .22, -.18 + random() * .36);
    cover.scale.y *= .42;
  }
  // A single continuous green bank extends behind the portal to the horizon.
  greenMeadow(scenery);
  coral(scenery, -11, -.8, 1.18, .2);
  coral(scenery, -17, -9, .85, -.35);
  coral(scenery, -20, 6, .68, 1);
  fossil(scenery);
  for (const [x, z, size] of [[8, -11, 1], [15, -6.2, 1.25], [16, -7.6, .85], [7, -7.2, .7]]) mushroom(scenery, x, meadowHeight(x, z), z, size);
  mushroom(scenery, -9, 0, 1, .72);
  for (const p of [[-21, 2.7, -32, 1.2], [-4, 2.7, -36, 1], [17, 3.4, -36, 1.3]]) fiddleFern(scenery, ...p);
  for (let row = 0; row < 2; row++) for (let i = 0; i < 17; i++) {
    const x = -24 + i * 3 + (row % 2) * 1.2, z = 16.8 + row * 2.3 + Math.sin(i) * .4;
    bluePlant(scenery, x, -.08, z, 1.15, Math.PI + .15 * Math.sin(i));
  }
  for (const [x, z, s] of [[-13, 4, .45], [-10, 1.7, .36], [11.1, 3.5, .35], [14.4, 4.5, .48], [-17, -1, .7]]) mushroom(scenery, x, 0, z, s);
  for (let i = 0; i < 24; i++) {
    const x = -12 + random() * 24, z = 7 + random() * 4, length = .25 + random() * .65;
    tube(scenery, [[x, -.018, z], [x + length * .5, -.015, z + .05], [x + length, -.018, z]], .012, i % 2 ? 0xf0b88a : 0xbf7c5b, 6);
  }
  // Distant rock formations keep the scene complete when the camera is rotated.
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * Math.PI * 2;
    const x = Math.sin(a) * 57, z = Math.cos(a) * 57, radius = 4 + random() * 4;
    const tiers = 2 + i % 3;
    for (let row = 0; row < tiers; row++) rockSlab(scenery, x + row * .45, row * 1.6 - .1, z, radius * (1 - row * .18), 1.65, radius * .65 * (1 - row * .14), [0xc28c79, 0xd39f85, 0xdfb295, 0xeac4a0][row]);
  }
  batch(scenery);

  const portal = group(root, 11.5, meadowHeight(11.5, -9) + .025, -9);
  portal.name = 'interstellar-teleporter';
  const alloy = surfaceMaterial(0xd7dfd2, 'metal'), darkAlloy = surfaceMaterial(0x52777a, 'metal');
  cylinder(portal, 0, .10, 0, 2.15, 2.35, .22, darkAlloy, 48);
  cylinder(portal, 0, .28, 0, 2.04, 2.15, .20, alloy, 48);
  cylinder(portal, 0, .43, 0, 1.76, 1.91, .25, alloy, 48);
  for (const [r, y, tint] of [[2.18, .16, 0x9ab9a9], [1.92, .39, 0x546f72], [1.43, .575, 0xd9bf82]]) ring(portal, 0, y, 0, r, .025, tint).rotation.x = Math.PI / 2;
  disk(portal, 0, .58, 0, 1.32, 0x315d65);
  ring(portal, 0, .62, 0, 1.22, .12, material(0x75eee2, true)).rotation.x = Math.PI / 2;
  disk(portal, 0, .61, 0, .96, material(0xb1f9ee, true));
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const support = group(portal, Math.sin(a) * 1.86, .50, Math.cos(a) * 1.86);
    support.rotation.set(.16, a, 0);
    box(support, 0, 0, 0, .43, .73, .70, alloy, .075);
    box(support, 0, .38, -.05, .30, .07, .40, darkAlloy, .025);
    box(support, 0, .425, -.07, .19, .025, .23, material(0x74d9cb, true), .01);
    for (const side of [-1, 1]) {
      cylinder(support, side * .23, .01, .08, .048, .048, .38, darkAlloy, 10);
      ball(support, side * .13, .08, .357, .034, .034, .014, 0x788d89);
    }
    for (let j = 0; j < 4; j++) box(support, 0, -.17 + j * .08, .36, .21, .025, .02, 0x466569, .008);
  }
  // Radial deck seams and powered glyphs give the portal a mechanical, usable structure.
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    const seam = box(portal, Math.sin(a) * 1.52, .585, Math.cos(a) * 1.52, .075, .022, .72, 0x3f5f60, .01);
    seam.rotation.y = a;
    if (i % 2 === 0) {
      const glyph = box(portal, Math.sin(a) * 1.25, .627, Math.cos(a) * 1.25, .12, .018, .21, material(0x76f3e1, true), .01);
      glyph.rotation.y = a;
    }
  }
  for (let i = 0; i < 48; i++) {
    const a = i / 48 * Math.PI * 2;
    const tick = box(portal, Math.sin(a) * 2.065, .395, Math.cos(a) * 2.065, .04, .018, i % 4 ? .07 : .14, i % 4 ? 0x668c87 : 0xd2b77c, .006);
    tick.rotation.y = a;
  }
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2 + .5;
    const arc = mesh(portal, new THREE.TorusGeometry(.63 + i * .09, .014, 6, 40, Math.PI * 1.3), material(0xd4fff1, true), 0, .644, 0);
    arc.rotation.set(Math.PI / 2, 0, a);
  }
  batch(portal);
  const portalEnergy = group(portal, 0, .71, 0);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    const mote = ball(portalEnergy, Math.sin(a) * (.38 + (i % 3) * .13), .025, Math.cos(a) * (.38 + (i % 3) * .13), .055, .025, .055, material(0xc5fff3, true));
    mote.userData.phase = a;
  }
  const portalHalo = ring(portal, 0, 1.2, 0, .94, .018, material(0xa1ffed, true));
  portalHalo.rotation.x = Math.PI / 2;
  const entities = [];
  const pipi1 = createPipi(); pipi1.position.set(-4.6, .08, 3); root.add(pipi1);
  const pipi2 = createPipi(); pipi2.position.set(-1.8, .08, -1.3); pipi2.rotation.y = .55; root.add(pipi2);
  const bibo = createBibo(); bibo.position.set(3.7, .08, 1.1); root.add(bibo);
  const pipiLabelHeight = new THREE.Box3().setFromObject(pipi1).max.y - pipi1.position.y + .25;
  entities.push({ id: 'pipi-1', species: 'pipi', name: '皮皮', level: 3, object: pipi1, height: pipiLabelHeight }, { id: 'pipi-2', species: 'pipi', name: '皮皮', level: 4, object: pipi2, height: pipiLabelHeight }, { id: 'bibo', species: 'bibo', name: '比波', level: 16, object: bibo, height: 3.5 });
  const resources = [];
  for (let i = 0; i < 3; i++) {
    const [x, z] = [[-7.8, -12.3], [-8.3, -10.5], [-5.3, -11.2]][i];
    const g = group(root, x, 2.70, z);
    g.name = `amber-crystal-${i}`;
    createAmberCluster(g, i);
    batch(g);
    resources.push({ id: `crystal-${i}`, name: '黄晶矿', object: g,
      height: i === 0 ? 1.35 : .95, collected: false,
      approachPosition: new THREE.Vector3(x, 0, -4.2) });
  }
  const updateAtmosphere = atmosphere(root);
  const update = (time, reducedMotion = false) => {
    const t = reducedMotion ? 0 : time;
    breeze.value = t;
    portalHalo.position.y = 1.1 + Math.sin(t * 1.3) * .15;
    portalHalo.rotation.z = t * .16;
    portalEnergy.rotation.y = t * .22;
    portalEnergy.children.forEach(mote => { mote.position.y = .06 + (Math.sin(t * 1.4 + mote.userData.phase) + 1) * .20; });
    updateAtmosphere(t);
  };
  update(0);
  return { root, ground, entities, resources, portal, portalHalo, portalEnergy, update };
}
