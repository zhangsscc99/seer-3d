import * as THREE from 'three';
import {group, box, ellipsoid, cyl, torus, beam, flat, mat} from '../scene-kit.js';

// The reference has a blue-teal metal greenhouse, not a solid green shop.
// Its roof ribs continue into the side posts, and the three-ram display stands
// on a separate curved stone garden to the left of the entrance.
const P = {
  frame: 0x397e88, frameLight: 0x5796a1, frameDark: 0x286875,
  glass: 0xd4e6c7, stone: 0xc6c6bd, cap: 0xe0e0d3,
  grass: 0x85b94b, ivory: 0xe8e9dc, leaf: 0x9bce57,
  leafEdge: 0x628e36, leafVein: 0x648e32,
};

function mesh(parent, geometry, color) {
  const material = color?.isMaterial ? color : mat(color);
  const object = new THREE.Mesh(geometry, material);
  object.castShadow = object.receiveShadow = true;
  parent.add(object);
  return object;
}
function tube(parent, points, radius, color, closed = false) {
  const path = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)), closed, 'centripetal');
  return mesh(parent, new THREE.TubeGeometry(path, Math.max(28, points.length * 3), radius, 8, closed), color);
}
function shape(points) {
  const result = new THREE.Shape();
  points.forEach(([x, y], index) => index ? result.lineTo(x, y) : result.moveTo(x, y));
  result.closePath();
  return result;
}
function relief(parent, outline, color, depth = .06, bevel = .012) {
  return mesh(parent, new THREE.ExtrudeGeometry(outline, {
    depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel,
    bevelSegments: 2, curveSegments: 24,
  }), color);
}
function surface(parent, points, material) {
  const object = mesh(parent, new THREE.ShapeGeometry(shape(points)), material);
  object.castShadow = false;
  return object;
}
function floor(parent, points, y, height, color) {
  const object = relief(parent, shape(points.map(([x, z]) => [x, -z])), color, height, 0);
  object.rotation.x = -Math.PI / 2;
  object.position.y = y;
  return object;
}
function roundedFootprint(w, d, radius = .36) {
  const points = [];
  for (const [x, z, start] of [[w / 2 - radius, d / 2 - radius, 0], [-w / 2 + radius, d / 2 - radius, Math.PI / 2], [-w / 2 + radius, -d / 2 + radius, Math.PI], [w / 2 - radius, -d / 2 + radius, Math.PI * 1.5]]) {
    for (let index = 0; index <= 8; index++) {
      const angle = start + index * Math.PI / 16;
      points.push([x + Math.cos(angle) * radius, z + Math.sin(angle) * radius]);
    }
  }
  return points;
}

const glassCache = new Map();
function glass(color = P.glass, opacity = .54) {
  const key = color + ':' + opacity;
  if (!glassCache.has(key)) glassCache.set(key, new THREE.MeshStandardMaterial({
    color, transparent: true, opacity, roughness: .30, metalness: .06,
    side: THREE.DoubleSide, depthWrite: false,
  }));
  return glassCache.get(key);
}
const reflection = new THREE.MeshBasicMaterial({color: 0xffffec, transparent: true, opacity: .51, side: THREE.DoubleSide, depthWrite: false});

function greenhouse(parent) {
  const root = group(parent);
  root.name = '细蓝青框架与透明分片玻璃温室';
  const half = 2.20, depth = 3.26, shoulder = 3.13, rise = 1.73, bottom = .23;
  const top = x => shoulder + rise * Math.sqrt(Math.max(0, 1 - (x / half) ** 2));
  floor(root, roundedFootprint(4.67, 3.51, .40), .03, .17, 0xc0c5b7);
  floor(root, roundedFootprint(4.48, 3.32, .29), .205, .045, 0xd4d2ab);

  // Full depth: five continuous arch-and-post ribs, all sharing one ellipse.
  const ribZ = [-depth / 2, -depth / 4, 0, depth / 4, depth / 2];
  ribZ.forEach((z, index) => {
    const points = [];
    for (let step = 0; step <= 13; step++) points.push([-half, bottom + (shoulder - bottom) * step / 13, z]);
    for (let step = 1; step <= 48; step++) {
      const angle = Math.PI - step * Math.PI / 48;
      points.push([Math.cos(angle) * half, shoulder + Math.sin(angle) * rise, z]);
    }
    for (let step = 1; step <= 13; step++) points.push([half, shoulder - (shoulder - bottom) * step / 13, z]);
    const rib = tube(root, points, index === 0 || index === 4 ? .066 : .043, index === 4 ? P.frameLight : P.frame);
    rib.name = '从侧柱连续弯向屋顶的温室肋 ' + index;
  });

  // Curved glass sheets follow the same ellipse; nothing fills the roof volume.
  for (let bay = 0; bay < ribZ.length - 1; bay++) for (let segment = 0; segment < 8; segment++) {
    const positions = [], uvs = [], indices = [];
    for (let step = 0; step <= 8; step++) {
      const angle = (segment + step / 8) * Math.PI / 8;
      for (const z of [ribZ[bay] + .018, ribZ[bay + 1] - .018]) {
        positions.push(Math.cos(angle) * (half - .012), shoulder + Math.sin(angle) * (rise - .012), z);
        uvs.push(step / 8, z === ribZ[bay] + .018 ? 0 : 1);
      }
      if (step < 8) { const at = step * 2; indices.push(at, at + 1, at + 2, at + 1, at + 3, at + 2); }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    const pane = mesh(root, geometry, glass([0xc4ddc0, 0xd8e6c4, 0xb9d9cc][(bay + segment) % 3], .46));
    pane.castShadow = false; pane.name = '弯曲透明顶玻璃';
  }
  for (const angle of [Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4]) {
    beam(root, [Math.cos(angle) * half, shoulder + Math.sin(angle) * rise, -depth / 2], [Math.cos(angle) * half, shoulder + Math.sin(angle) * rise, depth / 2], .041, P.frame);
  }

  const xs = [-half, -1.10, 0, 1.10, half], rows = [bottom, 1.57, shoulder];
  for (const side of [-1, 1]) {
    const facade = group(root, 0, 0, side * (depth / 2 + .009));
    if (side < 0) facade.rotation.y = Math.PI;
    for (let col = 0; col < xs.length - 1; col++) for (let row = 0; row < 3; row++) {
      const left = xs[col] + .047, right = xs[col + 1] - .047, lower = rows[row] + .04;
      const points = [[left, lower], [right, lower]];
      for (let step = 0; step <= 12; step++) {
        const x = right + (left - right) * step / 12;
        points.push([x, row < 2 ? rows[row + 1] - .044 : top(x) - .055]);
      }
      const pane = surface(facade, points, glass([0xdbe5be, 0xc1ddc8, 0xd1e4cd][(col + row) % 3], side > 0 ? .59 : .40));
      pane.name = '正背面分格玻璃';
    }
    for (const x of [-1.10, 0, 1.10]) {
      const h = top(x) - bottom;
      box(facade, x, bottom + h / 2, .015, .064, h, .063, P.frame);
      box(facade, x - .018, bottom + h / 2, .052, .014, h - .05, .012, P.frameLight);
    }
    for (const y of [bottom, 1.57, shoulder]) {
      box(facade, 0, y, .024, half * 2 + .035, y === bottom ? .102 : .079, .081, P.frame);
      box(facade, 0, y + .020, .070, half * 2 - .06, .018, .012, P.frameLight);
    }
    if (side > 0) {
      // Reflections stay on individual glazing panes and do not cover the frame.
      for (const [x, y, w, h] of [[-1.76, 2.24, .55, .73], [-.57, 2.41, .69, .57], [.56, 2.36, .79, .70], [1.61, 2.37, .70, .76], [1.64, .95, .58, .69]]) {
        const band = surface(facade, [[x - w / 2, y - h / 2], [x - w / 2 + .19, y - h / 2], [x + w / 2, y + h / 2 - .08], [x + w / 2, y + h / 2], [x + w / 2 - .20, y + h / 2], [x - w / 2, y - h / 2 + .10]], reflection);
        band.position.z = .031;
      }
      // A straight lintel and matching paired handles replace the opaque arch door.
      for (const sign of [-1, 1]) {
        const handle = group(facade, sign * .145, .96, .12);
        box(handle, 0, 0, 0, .070, .35, .055, 0x245b63);
        for (const y of [-.135, .135]) beam(handle, [0, y, 0], [sign * .12, y, -.005], .020, 0x315e63);
        for (const y of [.83, 1.13]) ellipsoid(facade, sign * .28, y, .095, .035, .035, .022, 0x395d5b);
      }
    }
  }

  // Four slim side bays retain an open, walk-around conservatory silhouette.
  for (const side of [-1, 1]) {
    const wall = group(root, side * half, 0, 0); wall.rotation.y = side * Math.PI / 2;
    for (let bay = 0; bay < 4; bay++) for (let row = 0; row < 2; row++) {
      const center = -depth / 2 + (bay + .5) * depth / 4, low = rows[row] + .045, high = rows[row + 1] - .045;
      const pane = surface(wall, [[center - depth / 8 + .045, low], [center + depth / 8 - .045, low], [center + depth / 8 - .045, high], [center - depth / 8 + .045, high]], glass(bay % 2 ? 0xc5e1cf : 0xdbe9c7, .48));
      pane.position.z = -.006; pane.name = '可环绕的薄侧玻璃';
      if (row === 1 && bay % 2 === 0) {
        const band = surface(wall, [[center - .24, 1.85], [center - .09, 1.85], [center + .24, 2.71], [center + .13, 2.84]], reflection);
        band.position.z = .013;
      }
    }
    for (const y of rows) box(wall, 0, y, .022, depth + .02, y === bottom ? .093 : .071, .071, P.frame);
  }
  // A few pale planters are visible through the glazing without filling it in.
  for (const [x, z, scale] of [[-1.42, -.96, .61], [1.36, -.80, .77], [.77, .24, .38]]) {
    const planter = group(root, x, .25, z); planter.scale.setScalar(scale);
    cyl(planter, 0, .25, 0, .36, .28, .48, 0xd0b376, 20);
    cyl(planter, 0, .49, 0, .40, .40, .11, 0xdfc993, 20);
    for (let leaf = 0; leaf < 7; leaf++) {
      const a = leaf * Math.PI * 2 / 7;
      const stem = ellipsoid(planter, Math.cos(a) * .24, .78, Math.sin(a) * .24, .16, .44, .13, leaf % 2 ? 0x89b85c : 0xa6ca76);
      stem.rotation.z = -Math.cos(a) * .49; stem.rotation.x = Math.sin(a) * .49;
    }
  }
  return root;
}

function leaf(parent, x, y, z, width, height, tilt, color = P.leaf) {
  const root = group(parent, x, y, z); root.rotation.z = tilt;
  const outline = new THREE.Shape();
  outline.moveTo(0, 0);
  outline.bezierCurveTo(-width * .29, height * .15, -width * .65, height * .80, -width * .26, height * .97);
  outline.bezierCurveTo(width * .18, height * 1.19, width * .64, height * .88, width * .50, height * .56);
  outline.bezierCurveTo(width * .40, height * .27, width * .10, height * .09, 0, 0);
  relief(root, outline, P.leafEdge, .095, .035);
  const center = relief(root, outline, color, .033, .018); center.position.set(0, .03, .118); center.scale.set(.85, .91, 1);
  tube(root, [[0, .05, .184], [.035, height * .26, .198], [.07, height * .56, .187], [-.07, height * .78, .181]], .024, P.leafVein);
  const highlight = tube(root, [[-width * .30, height * .36, .180], [-width * .31, height * .70, .177], [-width * .15, height * .89, .175], [width * .13, height * .92, .175]], .024, 0xc2e781);
  highlight.castShadow = false;
  return root;
}
let petsTexture;
function petsSign(parent) {
  const root = group(parent, -.72, 4.93, 1.94); root.rotation.z = .035;
  // Follow the actual lettering perimeter. The generic sign polygon leaves a
  // large brown triangle behind PETS and retains glass below the cropped P.
  const width = 3.18, height = 2.69;
  const pixels = [[10,48],[42,32],[92,25],[113,10],[182,1],[195,6],[201,40],[240,40],[244,99],[236,115],[188,129],[164,143],[162,156],[115,174],[109,165],[108,181],[55,201],[46,193],[28,136],[16,84]];
  const outline = shape(pixels.map(([x, y]) => [(x / 249 - .5) * width, (.5 - y / 208) * height]));
  const backing = relief(root, outline, 0xa3547b, .085, .013); backing.position.z = -.092;
  if (!petsTexture) { petsTexture = new THREE.TextureLoader().load('/references/town-pets.png'); petsTexture.colorSpace = THREE.SRGBColorSpace; petsTexture.anisotropy = 8; }
  const geometry = new THREE.ShapeGeometry(outline);
  const position = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++) uv.setXY(i, position.getX(i) / width + .5, position.getY(i) / height + .5);
  const front = mesh(root, geometry, new THREE.MeshStandardMaterial({map: petsTexture, transparent: true, alphaTest: .05, roughness: .86}));
  front.position.z = .015;
  return root;
}
function shopBadge(parent) {
  leaf(parent, .55, 4.21, 1.18, 1.28, 2.11, .15, 0xa7d662);
  leaf(parent, .71, 4.28, 1.24, 1.26, 2.03, -1.36, 0xa8d35f);
  petsSign(parent);
  const badge = group(parent, .94, 3.52, 1.96); badge.rotation.z = -.30;
  badge.name = '倾斜粉色拉姆徽章';
  ellipsoid(badge, 0, 0, 0, .93, .77, .13, 0xb84f83);
  ellipsoid(badge, 0, 0, .065, .845, .683, .115, 0xdc8bb1);
  ellipsoid(badge, 0, .014, .14, .765, .605, .044, 0xeea8c9);
  tube(badge, [[-.68, .30, .16], [-.49, .49, .186], [-.20, .565, .185], [.10, .55, .18]], .034, 0xffd6e5);
  for (const [x, y, sx, sy] of [[-.30, .09, .257, .305], [.29, -.095, .253, .289]]) {
    ellipsoid(badge, x, y, .205, sx + .025, sy + .021, .018, 0xc2769c);
    ellipsoid(badge, x, y, .226, sx, sy, .022, 0xfff5f3);
    ellipsoid(badge, x + .018, y -.008, .253, .110, .145, .016, 0xb55381);
    ellipsoid(badge, x - .024, y + .073, .270, .018, .024, .007, 0xd88eaa);
  }
}

function garden(parent, x, z, rx, rz, name) {
  const root = group(parent, x, 0, z); root.name = name;
  const point = a => [Math.cos(a) * rx * (1 + .035 * Math.sin(a * 3)), Math.sin(a) * rz * (1 + .04 * Math.cos(a * 2))];
  const perimeter = Array.from({length: 64}, (_, i) => point(i * Math.PI / 32));
  floor(root, perimeter, .015, .21, 0xb2b5ad);
  floor(root, perimeter, .185, .100, 0xcccec3);
  flat(root, perimeter.map(([a, b]) => [a * .84, b * .81]), P.grass, .296);
  for (let n = 0; n < 28; n++) {
    const a = n * Math.PI / 14 + .005, b = (n + 1) * Math.PI / 14 - .005;
    const points = [point(a), point((a + b) / 2), point(b), ...[b, (a + b) / 2, a].map(angle => {const p = point(angle); return [p[0] * .85, p[1] * .82];})];
    floor(root, points, .278, .043, [0xdcddd0, 0xcdcec4, 0xe8e4d7, 0xc2c4bb][n % 4]);
  }
  return root;
}
function pillar(parent, x, z) {
  const root = group(parent, x, .26, z);
  const profile = [[0, 0], [.18, 0], [.21, .048], [.19, .11], [.145, .15], [.105, .34], [.105, .49], [.135, .69], [.17, .73], [.17, .79], [.137, .825]].map(point => new THREE.Vector2(...point));
  mesh(root, new THREE.LatheGeometry(profile, 24), P.ivory);
  const ring = torus(root, 0, .747, 0, .153, .024, 0xc1c8b8); ring.rotation.x = Math.PI / 2;
  ellipsoid(root, 0, .969, 0, .206, .192, .202, 0xf0f0e0);
  ellipsoid(root, -.065, 1.036, .118, .076, .064, .032, 0xffffed);
  return root;
}
function smallFlower(parent, x, y, z, size = 1, color = 0xfff4d7) {
  for (let petal = 0; petal < 5; petal++) {
    const a = petal * Math.PI * 2 / 5;
    ellipsoid(parent, x + Math.cos(a) * .070 * size, y + Math.sin(a) * .070 * size, z, .061 * size, .063 * size, .022 * size, color);
  }
  ellipsoid(parent, x, y, z + .025 * size, .040 * size, .038 * size, .021 * size, 0xe5cb58);
}
function ramFace(parent, x, y, z, color, sprout = true) {
  ellipsoid(parent, x, y, z, .272, .205, .071, color);
  ellipsoid(parent, x -.075, y + .085, z + .053, .064, .025, .013, 0xffffff).material = new THREE.MeshStandardMaterial({color: 0xffffff, transparent: true, opacity: .44, roughness: .8});
  for (const side of [-1, 1]) {
    ellipsoid(parent, x + side * .073, y -.006, z + .068, .062, .078, .021, 0xfff8e6);
    ellipsoid(parent, x + side * .070, y -.006, z + .091, .024, .033, .010, 0x43393c);
  }
  if (sprout) {
    const stem = tube(parent, [[x, y + .17, z], [x, y + .27, z], [x + .035, y + .31, z]], .018, 0x559737);
    stem.castShadow = false;
    for (const side of [-1, 1]) {
      const l = ellipsoid(parent, x + side * .105, y + .29, z, .14, .071, .033, side < 0 ? 0x4ba334 : 0x65b744); l.rotation.z = side * .25;
    }
  }
}
function flowerPot(parent, x, z, color, size = 1) {
  const root = group(parent, x, .25, z); root.scale.setScalar(size);
  cyl(root, 0, .20, 0, .25, .19, .39, color, 20); cyl(root, 0, .403, 0, .28, .28, .11, color, 20);
  cyl(root, 0, .465, 0, .225, .225, .018, 0x788243, 20);
  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7;
    ellipsoid(root, Math.cos(a) * .18, .60 + .04 * Math.sin(a * 2), Math.sin(a) * .15, .18, .23, .17, i % 2 ? 0x94c359 : 0xaacb65);
    if (i % 2 === 0) smallFlower(root, Math.cos(a) * .18, .66, Math.sin(a) * .15 + .15, .68, i % 4 ? 0xffead3 : 0xfff5c8);
  }
  return root;
}
function displayBoard(parent) {
  const plot = garden(parent, -2.41, 2.57, 1.50, .99, '展示板的弧形分块石沿草台');
  const board = group(parent, -2.53, .265, 2.24); board.rotation.z = -.075; board.rotation.x = -.10;
  board.name = '三只拉姆与盆花藤叶展示板';
  const outline = shape([[-.64, .05], [.61, .05], [.67, 2.71], [-.65, 2.71]]);
  relief(board, outline, 0xae9852, .11, .016);
  const face = relief(board, shape([[-.566, .14], [.537, .14], [.594, 2.615], [-.578, 2.615]]), 0xe6bcd5, .018, 0); face.position.z = .126;
  const bottom = surface(board, [[-.558, .15], [.532, .15], [.545, .72], [.20, .69], [-.22, .90], [-.565, .80]], mat(0x85d4dd)); bottom.position.z = .151;
  const path = new THREE.Shape(); path.moveTo(-.21, .16); path.bezierCurveTo(.60, .72, -.08, .95, .28, 1.38); path.bezierCurveTo(.51, 1.73, .12, 1.99, .25, 2.61); path.lineTo(.50, 2.61); path.bezierCurveTo(.28, 1.87, .84, 1.77, .56, 1.24); path.bezierCurveTo(.23, .85, .72, .73, .13, .15); path.closePath();
  const pathFace = relief(board, path, 0xf2c16c, .022, 0); pathFace.position.z = .154;
  for (const x of [-.62, .635]) box(board, x, 1.36, .167, .053, 2.77, .047, 0xc6aa57);
  for (const y of [.10, 2.685]) box(board, .005, y, .170, 1.33, .057, .051, 0xc7a651);
  // Rear braces make the illustrated display a real freestanding object.
  for (const x of [-.42, .42]) beam(board, [x, .06, -.56], [x, 2.25, -.045], .035, 0x988149);
  beam(board, [-.44, .35, -.50], [.44, .35, -.50], .030, 0xab8d45);
  ramFace(board, -.20, 2.12, .222, 0xe34b4b, true);
  ramFace(board, .09, 1.41, .224, 0xd87acd, true);
  ramFace(board, -.30, .83, .226, 0x50c9de, false);
  for (const [x, y, rx, ry] of [[.62, 2.63, .16, .17], [.72, 2.37, .18, .26], [.67, 2.01, .18, .25], [.75, 1.69, .16, .25], [.67, 1.36, .19, .26], [.72, 1.02, .19, .24], [.60, .64, .23, .23], [-.66, .30, .14, .19], [-.68, .64, .13, .23]]) {
    ellipsoid(board, x, y, .158, rx, ry, .11, 0x8bb348);
    ellipsoid(board, x -.03, y + .02, .222, rx * .70, ry * .83, .044, 0xb0cd67);
  }
  for (const [x, y, scale] of [[.58, 2.56, 1], [.73, 2.21, .65], [.63, 1.70, .76], [.68, 1.13, .73], [.54, .62, .83]]) smallFlower(board, x, y, .301, scale);
  flowerPot(parent, -2.21, 3.05, 0xb68c4f, .98);
  flowerPot(parent, -2.77, 2.94, 0x66acba, .85);
  pillar(parent, -1.29, 2.86);
  return {plot, board};
}

export function createStreetPets(parent) {
  const root = group(parent, 10.30, 0, -4.55);
  root.rotation.y = -.28; root.scale.set(.85, .91, .96);
  root.name = '按淘淘乐街原图重建的 PETS 玻璃宠物屋';
  greenhouse(root); shopBadge(root); displayBoard(root);
  garden(root, 2.33, 2.25, .91, .75, '入口右侧弧形草台'); pillar(root, 1.79, 2.41);
  root.updateMatrixWorld(true);
  const local = [
    {name: 'PETS 玻璃温室', x: 0, z: 0, rx: 2.22, rz: 1.66, height: 5.12},
    {name: 'PETS 展示板与花盆', x: -2.48, z: 2.43, rx: .96, rz: .76, height: 2.94},
    {name: 'PETS 左短柱', x: -1.29, z: 2.86, rx: .22, rz: .22, height: 1.45, kind: 'ellipse'},
    {name: 'PETS 右短柱', x: 1.79, z: 2.41, rx: .22, rz: .22, height: 1.45, kind: 'ellipse'},
  ];
  const c = Math.abs(Math.cos(root.rotation.y)), s = Math.abs(Math.sin(root.rotation.y));
  const colliders = local.map(item => {
    const center = new THREE.Vector3(item.x, 0, item.z).applyMatrix4(root.matrix);
    return {...item, x: center.x, z: center.z, rx: item.rx * root.scale.x * c + item.rz * root.scale.z * s,
      rz: item.rz * root.scale.z * c + item.rx * root.scale.x * s, height: item.height * root.scale.y};
  });
  // The walk-in point is just outside the greenhouse and its two short pillars.
  const entry = new THREE.Vector3(0, 0, 2.85).applyMatrix4(root.matrix);
  return {root, colliders, entrance:[entry.x,.05,entry.z]};
}

// The mobile scene owns these reusable resources only until it is left.
export function clearPetsCaches(release){
 glassCache.forEach(release);glassCache.clear();
 if(petsTexture)release(petsTexture);petsTexture=undefined;
}
