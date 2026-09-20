import * as THREE from 'three';
import {group, box, ellipsoid, cyl, torus, beam, mat, stroke} from '../scene-kit.js';

// Small construction details read from references/farm.jpg. Coordinates are
// local to the farmhouse, so its scene placement and collision bounds stay
// owned by country.js. No image planes or replacement facade are used here.
const P = {
  timber: 0xa36932, grain: 0x80582e, cut: 0xd4a457,
  stone: 0xd3d4b9, stoneShade: 0xbcc7b7,
  rope: 0xf5efbc, white: 0xfff8dd, brass: 0xd4a04c,
};

function mesh(parent, geometry, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function cord(parent, points, radius, color) {
  const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(parent, new THREE.TubeGeometry(path, 12, radius, 5, false), color);
}

function polygon(parent, points, depth, color, x, y, z) {
  const shape = new THREE.Shape();
  points.forEach(([px, py], i) => i ? shape.lineTo(px, py) : shape.moveTo(px, py));
  shape.closePath();
  return mesh(parent, new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: false, curveSegments: 4,
  }), color, x, y, z);
}

function doorHardware(parent, {x, y, z, w, h}) {
  const hardware = group(parent);
  hardware.name = 'wooden-door-hardware';
  // The existing round wooden fixing is retained behind the small drop pull.
  const px = x + w * .27, py = y + h * .38;
  ellipsoid(hardware, px, py + .07, z + .035, .076, .094, .033, P.cut);
  const ring = torus(hardware, px, py - .071, z + .07, .119, .033, P.brass);
  ring.scale.y = 1.20;
  for (const yy of [y + h * .20, y + h * .69]) {
    // Short timber-coloured hinge straps, matching the reference's warm pins.
    const strap = box(hardware, x - w * .385, yy, z, w * .17, .052, .036, P.grain);
    strap.rotation.z = -.025;
    for (const dx of [-.035, .035]) {
      ellipsoid(hardware, x - w * .385 + dx, yy, z + .03, .023, .023, .012, P.cut);
    }
  }
}

function doorwayStones(parent) {
  const stones = group(parent);
  stones.name = 'upper-door-radial-stones';
  // Thin uneven arch stones are visible outside the red door hood, especially
  // along its right edge in the reference. They sit in front of the gable.
  const outline = [[-.16, -.105], [.155, -.13], [.18, .10], [-.135, .14]];
  for (let i = 0; i < 6; i++) {
    const a = -.04 + i * .19;
    const x = 1.58 * Math.cos(a), y = 7.09 + 1.56 * Math.sin(a);
    const stone = polygon(stones, outline, .045, i % 2 ? P.stone : P.stoneShade, x, y, 3.62);
    stone.rotation.z = a + .12;
    stone.scale.set(1.06, .80, 1);
  }
  for (let i = 0; i < 3; i++) {
    const stone = polygon(stones, outline, .042, i % 2 ? P.stone : P.stoneShade, 1.48, 6.05 + i * .31, 3.62);
    stone.rotation.z = -.05 + i * .04;
  }
}

function timberDetails(parent) {
  const timber = group(parent);
  timber.name = 'timber-grain-and-joinery';
  for (const [x, z, high] of [[-2.76, 4.34, 5.35], [2.15, 4.34, 5.35], [-3.48, 2.69, 6.08]]) {
    // Fine curves follow the surface rather than covering each post with
    // another broad wood panel. The porch poles taper from .16 to .11.
    for (const s of [-1, 1]) {
      cord(timber, [[x + s * .040, .45, z + .147], [x + s * .065, 1.8, z + .136],
        [x + s * .022, 3.1, z + .130], [x + s * .038, high, z + .110]], .010, P.grain);
    }
    const knot = torus(timber, x + .005, high * .57, z + .145, .053, .011, P.cut);
    knot.scale.set(.74, 2.10, 1);
  }
  // Visible round end grain on the porch beam, with a restrained inner ring.
  for (const x of [-2.25, 2.25]) {
    const end = cyl(timber, x, 5.50, 4.565, .13, .13, .055, P.cut, 12);
    end.rotation.x = Math.PI / 2;
    torus(timber, x, 5.50, 4.60, .069, .010, P.grain);
  }
  for (const x of [-2.05, 2.05]) {
    beam(timber, [x, 5.42, 4.15], [x, 4.94, 3.66], .065, P.timber);
  }
}

function balconyDetails(parent) {
  const balcony = group(parent);
  balcony.name = 'balcony-spindle-collars';
  for (let i = 0; i < 8; i++) {
    const x = -2.13 + i * .61;
    for (const y of [5.91, 6.43]) {
      const collar = torus(balcony, x, y, 4.39, .069, .016, P.white);
      collar.rotation.x = Math.PI / 2;
    }
  }
  for (let i = 0; i < 8; i++) {
    ellipsoid(balcony, -2.05 + i * .59, 5.72, 4.535, .018, .019, .014, P.grain);
  }
}

function roofBindings(parent) {
  const knots = group(parent);
  knots.name = 'canvas-roof-rope-bindings';
  for (const sign of [-1, 1]) {
    for (const [xx, yy] of [[3.16, 6.22], [1.64, 7.35]]) {
      const x = sign * xx;
      // Crossed ropes wrap the brown edge rafter. The back segments are
      // intentionally tucked behind it; the front passes are clear of it.
      cord(knots, [[x - .20, yy + .16, 3.43], [x - .10, yy + .12, 3.71],
        [x + .18, yy - .16, 3.73], [x + .22, yy - .19, 3.43]], .034, P.rope);
      cord(knots, [[x - .22, yy - .18, 3.45], [x - .16, yy - .09, 3.74],
        [x + .15, yy + .16, 3.72], [x + .20, yy + .20, 3.44]], .034, P.rope);
      ellipsoid(knots, x, yy + .008, 3.755, .067, .048, .033, P.rope);
    }
  }
}

function laundryDetails(farmhouse, details) {
  const laundry = group(details);
  laundry.name = 'laundry-patches-and-hems';
  // The source has short trousers with an open gap between the legs. Replace
  // only that garment's own box geometry; retain its position/material/pegs.
  const shorts = farmhouse.children.find(o => o.isMesh && o.material?.color?.getHex() === 0xc85853
    && Math.abs(o.position.x - .5) < .001 && Math.abs(o.position.y - 4.39) < .001);
  if (shorts) {
    const shape = new THREE.Shape();
    [[-.36, .455], [.36, .455], [.39, -.455], [.08, -.455], [.035, -.105],
      [-.035, -.105], [-.08, -.455], [-.39, -.455]].forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {depth: .06, bevelEnabled: false});
    geometry.translate(0, 0, -.03);
    shorts.geometry.dispose();
    shorts.geometry = geometry;
    for (const child of [...shorts.children]) if (child.userData.outline) {
      child.geometry.dispose();
      shorts.remove(child);
    }
    stroke(shorts);
    shorts.name = 'pegged-red-short-trousers';
    box(laundry, .50, 4.69, 3.516, .69, .034, .018, 0xeb9986);
    for (const [x, y, r] of [[.29, 4.42, -.07], [.72, 4.16, .05]]) {
      const patch = box(laundry, x, y, 3.516, .20, .23, .018, 0xffe5c0);
      patch.rotation.z = r;
      for (let n = 0; n < 3; n++) {
        box(laundry, x - .062 + n * .062, y + .10, 3.532, .018, .042, .007, 0xbb6b59);
      }
    }
  }
  // Light seam at the white vest's hem and two little shoulder straps.
  box(laundry, -.52, 3.97, 3.514, .66, .025, .016, 0xd8cda7);
  for (const x of [-.74, -.30]) box(laundry, x, 4.875, 3.505, .105, .12, .045, 0xfff1d5);
}

export function addFarmhouseDetails(farmhouse) {
  const details = group(farmhouse);
  details.name = 'farmhouse-reference-details';
  doorHardware(details, {x: 0, y: .3, z: 3.065, w: 2.45, h: 3.38});
  doorHardware(details, {x: 0, y: 5.82, z: 3.625, w: 1.75, h: 2.32});
  doorwayStones(details);
  timberDetails(details);
  balconyDetails(details);
  roofBindings(details);
  laundryDetails(farmhouse, details);
  return details;
}
