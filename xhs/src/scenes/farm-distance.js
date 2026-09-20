import * as THREE from 'three';
import { group, box, cyl, arch, beam, mat } from '../scene-kit.js';

// Small, solid buildings sit beyond the wheat. Their low walls give the
// skyline a foundation, instead of leaving isolated spires in the sky.
export const FARM_DISTANCE = Object.freeze({
  castle: { x: -8.9, z: -30.3, yaw: -.1 },
  rainbow: { x: -15.4, y: .42, z: -33.0, radius: 4.8, rise: .60, width: .63 },
});

const C = {
  wall: 0xf3e5b1, edge: 0xffefc5, stone: 0xdac995,
  red: 0xd68b82, redEdge: 0xe5a194, roof: 0xf4dfaa,
  glass: 0x9abdb9, recess: 0xa38b66, flag: 0xe2a39b,
};

function mesh(parent, geometry, color, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, color?.isMaterial ? color : mat(color));
  object.position.set(x, y, z);
  object.castShadow = false;
  object.receiveShadow = false;
  parent.add(object);
  return object;
}

function pennant(parent, x, y, z, size, color = C.flag) {
  beam(parent, [x, y - .08, z], [x, y + size * .92, z], .019, C.stone);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.bezierCurveTo(size * .35, size * .1, size * .58, -.1 * size, size, .04 * size);
  shape.lineTo(size * .7, -.22 * size); shape.lineTo(size * .96, -.42 * size);
  shape.bezierCurveTo(size * .5, -.55 * size, size * .35, -.27 * size, 0, -.38 * size); shape.closePath();
  return mesh(parent, new THREE.ExtrudeGeometry(shape, { depth: .025, bevelEnabled: false, curveSegments: 6 }), color, x, y + size * .77, z);
}

function window(parent, x, y, z, size = .32, yaw = 0) {
  const frame = group(parent, x, y, z); frame.rotation.y = yaw;
  arch(frame, 0, 0, 0, size + .105, size * 1.62, .065, C.edge);
  arch(frame, 0, .055, .068, size, size * 1.32, .018, C.glass);
  box(frame, 0, size * .52, .099, size * .92, .03, .018, C.stone);
  box(frame, 0, size * .64, .10, .026, size * 1.1, .018, C.stone);
  return frame;
}

function turret(parent, x, z, radius, height, roofHeight, roofColor) {
  const tower = group(parent, x, 0, z);
  cyl(tower, 0, height / 2, 0, radius * .96, radius, height, C.wall, 20);
  cyl(tower, 0, .08, 0, radius * 1.09, radius * 1.12, .16, C.stone, 20);
  cyl(tower, 0, height - .02, 0, radius * 1.12, radius * 1.05, .16, C.edge, 20);
  const profile = [[radius * 1.19, 0], [radius * 1.13, .065], [radius * .76, roofHeight * .23], [radius * .36, roofHeight * .69], [radius * .12, roofHeight * .91], [.014, roofHeight]];
  mesh(tower, new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 24), roofColor, 0, height + .045, 0);
  cyl(tower, 0, height + .072, 0, radius * 1.195, radius * 1.195, .05, roofColor === C.red ? C.redEdge : C.edge, 24);
  window(tower, 0, height * .48, radius * .976, radius * .50);
  window(tower, -radius * .964, height * .48, 0, radius * .42, -Math.PI / 2);
  return { root: tower, tip: height + roofHeight + .045 };
}

function castle(parent, groundY) {
  const { x, z, yaw } = FARM_DISTANCE.castle;
  const root = group(parent, x, groundY, z); root.rotation.y = yaw; root.name = '麦田后方的奶油色城堡';
  box(root, 0, .48, .07, 4.7, .96, 1.13, C.wall);
  box(root, 0, .93, .08, 4.79, .13, 1.21, C.edge);
  for (let n = 0; n <= 12; n++) box(root, -2.34 + n * .39, 1.085, .58, .23, .23, .20, C.wall);
  box(root, 0, 1.19, -.31, 2.14, 2.38, 1.47, C.wall);
  box(root, 0, 2.31, -.31, 2.24, .14, 1.57, C.edge);
  for (let n = 0; n <= 5; n++) box(root, -.99 + n * .4, 2.52, .45, .22, .29, .19, C.wall);
  arch(root, 0, .035, .668, .75, 1.05, .07, C.stone);
  arch(root, 0, .043, .744, .52, .85, .03, C.recess);
  for (let n = 0; n < 4; n++) box(root, -.19 + n * .125, .37, .786, .014, .63, .02, C.stone);
  box(root, 0, .54, .79, .46, .036, .02, C.stone);
  window(root, -.61, 1.36, .439, .27);
  window(root, .61, 1.36, .439, .27);
  const left = turret(root, -2.09, .02, .46, 1.65, 1.1, C.red);
  turret(root, 2.12, .02, .45, 1.53, 1.06, C.red);
  turret(root, -.77, -.61, .28, 2.51, 1.0, C.roof);
  const center = turret(root, .23, -.59, .34, 2.84, 1.19, C.roof);
  turret(root, 1.18, -.47, .23, 2.13, .96, C.roof);
  pennant(root, -2.09, left.tip, .02, .45);
  pennant(root, .23, center.tip, -.59, .45, 0xdfb374);
  for (const xPos of [-1.48, 1.44]) {
    arch(root, xPos, .27, .657, .24, .40, .025, C.recess);
    box(root, xPos, .26, .687, .29, .07, .055, C.edge);
  }
  // Sparse pale masonry belongs to the wall planes, not a floating front sign.
  for (let row = 0; row < 2; row++) for (let n = 0; n < 8; n++) {
    const xx = -1.62 + n * .46 + (row % 2) * .19;
    if (Math.abs(xx) < .52 || xx > 1.75) continue;
    box(root, xx, .22 + row * .29, .646, .20, .065, .018, C.edge);
  }
  root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return root;
}

function rainbow(parent) {
  const { x, y, z, radius, rise, width } = FARM_DISTANCE.rainbow;
  const root = group(parent, x, y, z); root.name = '远方柔和彩虹'; root.rotation.y = -.07;
  // Seven adjoining extruded ribbons: a thin atmospheric arch, with depth when
  // orbiting. ExtrudeGeometry supplies position/normal/UV for scene batching.
  const colors = [0xf4b6ba, 0xf5cbaa, 0xf5e5ac, 0xcfe5bd, 0xbbe0df, 0xbec9e7, 0xdcc4e9];
  colors.forEach((color, i) => {
    const outer = radius - width / colors.length * i, inner = outer - width / colors.length - .003;
    const s = new THREE.Shape(); s.absarc(0, 0, outer, 0, Math.PI, false);
    s.lineTo(-inner, 0); s.absarc(0, 0, inner, Math.PI, 0, true); s.closePath();
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .83, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const band = mesh(root, new THREE.ExtrudeGeometry(s, { depth: .045, bevelEnabled: false, curveSegments: 72 }), material);
    band.scale.y = rise;
  });
  return root;
}

export function createFarmDistance(parent) {
  // Ray-cast before adding this decoration so only the existing landscape can
  // determine the castle's foundation. Sample both ends of the wide curtain wall.
  parent.updateMatrixWorld(true);
  const terrain = parent.children.filter(o => o.isMesh && !o.isInstancedMesh);
  const ray = new THREE.Raycaster();
  const { x, z } = FARM_DISTANCE.castle;
  const levels = [-2.6, 0, 2.6].map(dx => {
    ray.set(new THREE.Vector3(x + dx, 30, z), new THREE.Vector3(0, -1, 0));
    return ray.intersectObjects(terrain, false).find(hit => {
      if (!hit.face) return false;
      const normal = hit.face.normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld));
      return normal.y > .2;
    })?.point.y ?? .15;
  });
  const root = group(parent); root.name = '摩尔农场城堡与彩虹远景';
  const castleRoot = castle(root, Math.min(...levels) - .07);
  const rainbowRoot = rainbow(root);
  return { root, castle: castleRoot, rainbow: rainbowRoot, terrainLevels: levels };
}
