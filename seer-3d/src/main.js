import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createIcons, Orbit, VolumeX, Volume2, Maximize, Minimize, Radio, ScanLine, Gem, Focus, Plus, Minus, Bot, Navigation, BookOpen, Backpack, Image, X, Check, ArrowRight, MapPin } from 'lucide';
import { createWorld, createRobot, createPet, createPipi, createBibo } from './world.js';
import { createPainter } from './painter.js';
import './style.css';

const icons = { Orbit, VolumeX, Volume2, Maximize, Minimize, Radio, ScanLine, Gem, Focus, Plus, Minus, Bot, Navigation, BookOpen, Backpack, Image, X, Check, ArrowRight, MapPin };
const refreshIcons = () => createIcons({ icons, attrs: { 'aria-hidden': 'true' } });
const $ = selector => document.querySelector(selector);
const panel = $('#panel');
const reference = new URL('../ScreenShot_2026-09-18_001547_516.png', import.meta.url).href;
const species = {
  pipi: { name: '皮皮', number: '010', level: 'LV. 03–04', description: '克洛斯星草原上常见的飞行系精灵。小小的翅膀下，藏着对天空的大大向往。', height: '0.32 m', weight: '2.8 kg', make: createPipi },
  bibo: { name: '比波', number: '011', level: 'LV. 16', description: '皮皮的进化形态。长长的颈羽与粉色的翅膀，在克洛斯星的暖风中轻轻舒展。', height: '0.75 m', weight: '12 kg', make: createBibo },
};
let saved = {};
try { saved = JSON.parse(localStorage.getItem('seer-klose-v1') || '{}') || {}; } catch { /* Storage may be unavailable in private browsing. */ }
const records = new Set(Array.isArray(saved.records) ? saved.records.filter(key => species[key]) : []);
const collected = new Set(Array.isArray(saved.collected) ? saved.collected.filter(key => /^crystal-[0-2]$/.test(key)) : []);
let renderer, painter, scene, camera, controls, world, player, pet, marker, scanRing;
let renderStats = { calls: 0, triangles: 0 };
let destination = null, arrival = null, lastTime = 0, elapsed = 0, scanStarted = -10;
let toastTimer, mapImage, audioContext, audioGain, sound = false, suspended = false;
const keys = new Set();
const raycaster = new THREE.Raycaster();
const cursor = new THREE.Vector2();
const labels = [];
const up = new THREE.Vector3(0, 1, 0);
const thumbnails = {};
const canvas = $('#world');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3200);
}

function save() {
  try { localStorage.setItem('seer-klose-v1', JSON.stringify({ records: [...records], collected: [...collected] })); } catch { /* Session progress remains usable without persistent storage. */ }
  updateProgress();
}

function updateProgress() {
  $('#scan-count').textContent = `${records.size} / 2`;
  $('#crystal-count').textContent = `${collected.size} / 3`;
  const progress = Math.round((records.size + collected.size) / 5 * 100);
  $('#progress').textContent = `${progress}%`;
  $('#progress-bar').style.width = `${progress}%`;
  $('#task-scan').classList.toggle('done', records.size === 2);
  $('#task-crystal').classList.toggle('done', collected.size === 3);
  $('#dex-dot').hidden = records.size === 0;
  if (progress === 100) $('.mission-sub').textContent = '探索档案已完成，新的旅程正在等待。';
}

function makeLabel(entity, kind, text, action) {
  const button = document.createElement(action ? 'button' : 'span');
  button.className = `world-label ${kind}`;
  if (entity.id) button.dataset.entityId = entity.id;
  button.innerHTML = text;
  if (action) button.addEventListener('click', action);
  $('#labels').append(button);
  labels.push({ entity, button });
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  painter?.resize(renderer.domElement.width, renderer.domElement.height);
}

function renderScene() {
  renderStats = painter.render(scene, camera);
}

function resetCamera() {
  controls.enableDamping = false;
  controls.reset();
  controls.target.set(0, 1.2, -.4);
  camera.position.set(2.8, 25, 37);
  if (innerWidth < 650 && innerHeight > innerWidth) {
    controls.target.set(.8, .8, .3);
    camera.position.set(2, 40, 52);
  }
  camera.zoom = 1;
  camera.updateProjectionMatrix();
  controls.update();
  camera.updateMatrixWorld();
  controls.enableDamping = true;
}

function portrait(make, key) {
  const thumbnailScene = new THREE.Scene();
  thumbnailScene.add(new THREE.HemisphereLight(0xfffaf3, 0x99b7b0, 2.5));
  const light = new THREE.DirectionalLight(0xfff7e8, 3);
  light.position.set(-3, 5, 4); thumbnailScene.add(light);
  const object = make();
  thumbnailScene.add(object);
  const bounds = new THREE.Box3().setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const lens = new THREE.PerspectiveCamera(35, 1, .1, 40);
  const direction = new THREE.Vector3(.9, .4, 2.4).normalize();
  lens.position.copy(center).add(direction);
  lens.lookAt(center);
  // Fit every bounding-box corner in camera space, including outstretched wings.
  const viewRotation = lens.quaternion.clone().invert();
  const tangent = Math.tan(THREE.MathUtils.degToRad(lens.fov / 2));
  let distance = 0;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const corner = new THREE.Vector3(x, y, z).sub(center).applyQuaternion(viewRotation);
    distance = Math.max(distance, corner.z + 1.15 * Math.max(Math.abs(corner.y), Math.abs(corner.x) / lens.aspect) / tangent);
  }
  lens.position.copy(center).addScaledVector(direction, distance);
  lens.far = distance + size.length() + 1;
  lens.updateProjectionMatrix();
  painter.prepare(thumbnailScene);
  const background = renderer.getClearColor(new THREE.Color());
  renderer.setClearColor(0xe8eedf, 1);
  renderer.setSize(256, 256, false);
  renderer.render(thumbnailScene, lens);
  thumbnails[key] = canvas.toDataURL('image/png');
  renderer.setClearColor(background, 1);
}

function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1;
  painter = createPainter(renderer);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xefc4a7);
  scene.fog = new THREE.Fog(0xefc4a7, 75, 140);
  const environment = new RoomEnvironment(), generator = new THREE.PMREMGenerator(renderer);
  scene.environment = generator.fromScene(environment, .04).texture;
  scene.environmentIntensity = .24;
  environment.dispose(); generator.dispose();
  scene.add(new THREE.HemisphereLight(0xfff5e4, 0x7a929c, 1.45));
  const sun = new THREE.DirectionalLight(0xffe6c8, 2.4);
  sun.position.set(-18, 28, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 90 });
  sun.shadow.normalBias = .035;
  sun.shadow.bias = -.00025;
  sun.shadow.intensity = .65;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xb9e5ec, .6);
  fill.position.set(9, 8, -15); scene.add(fill);
  world = createWorld();
  scene.add(world.root);
  player = createRobot(); player.position.set(3, 0, 5.6); player.rotation.y = -.7;
  scene.add(player);
  pet = createPet(); pet.position.set(4.3, 1.5, 4.8); scene.add(pet);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xd8f57d, transparent: true, opacity: .8, side: THREE.DoubleSide });
  marker = new THREE.Mesh(new THREE.RingGeometry(.68, .74, 64), ringMaterial);
  marker.rotation.x = -Math.PI / 2; marker.position.set(3, .025, 5.6); scene.add(marker);
  scanRing = new THREE.Mesh(new THREE.RingGeometry(.95, 1, 80), new THREE.MeshBasicMaterial({ color: 0xc1fff2, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false }));
  scanRing.rotation.x = -Math.PI / 2; scanRing.visible = false; scene.add(scanRing);
  camera = new THREE.PerspectiveCamera(35, 1, .1, 180);
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .08;
  controls.enablePan = false;
  controls.minDistance = 12; controls.maxDistance = 85;
  controls.minPolarAngle = .25; controls.maxPolarAngle = Math.PI / 2.6;
  controls.rotateSpeed = .55;
  controls.zoomSpeed = .7;
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  for (const [key, entry] of Object.entries(species)) portrait(entry.make, key);
  painter.prepare(scene);
  resize(); resetCamera();
  world.entities.forEach(entity => makeLabel(entity, '', `${entity.name} <small>Lv.${entity.level}</small>`, () => approach(entity, () => encounter(entity.species))));
  world.resources.forEach(resource => {
    resource.collected = collected.has(resource.id);
    resource.object.visible = !resource.collected;
    makeLabel(resource, 'resource', '<i data-lucide="gem"></i>黄晶矿', () => approach(resource, () => collect(resource)));
  });
  makeLabel({ object: world.portal, height: 1.5 }, 'portal-label', '<i data-lucide="orbit"></i>星际传送台', () => openPanel('map'));
  makeLabel({ object: player, height: -.2 }, 'player-label', '星际探索员');
  refreshIcons(); updateProgress(); bindEvents();
  renderScene();
  mapImage = canvas.toDataURL('image/jpeg', .82);
  $('#loading').hidden = true;
  window.__seer = {
    ready: true,
    getState: () => ({ player: player.position.toArray(), moving: !!destination, records: [...records], collected: [...collected], camera: camera.position.toArray(), target: controls.target.toArray(), ...renderStats, sound, time: elapsed, ambientPhase: world.portalEnergy.rotation.y, terrainResolution: world.ground.material.map.image.width }),
    project: (x, y, z) => { camera.updateMatrixWorld(); const v = new THREE.Vector3(x, y, z).project(camera); return { x: (v.x + 1) * innerWidth / 2, y: (1 - v.y) * innerHeight / 2 }; },
    pixelSample: () => {
      const gl = renderer.getContext(), pixel = new Uint8Array(4), samples = [];
      for (let y = 1; y < 5; y++) for (let x = 1; x < 5; x++) { gl.readPixels(Math.floor(gl.drawingBufferWidth * x / 5), Math.floor(gl.drawingBufferHeight * y / 5), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel); samples.push([...pixel]); }
      return samples;
    },
  };
  requestAnimationFrame(animate);
}

function canWalk(x, z) {
  return x >= -9.7 && x <= 10 && z >= -5.4 && z <= 10;
}

function walkTo(x, z, callback = null) {
  if (!canWalk(x, z)) { toast('前方是岩壁，换一条路继续探索吧。'); return; }
  if (player.position.y > 1) { travel('grass'); }
  destination = new THREE.Vector3(x, 0, z);
  arrival = callback;
}

function approach(entity, callback) {
  if (entity.collected) return;
  if (player.position.distanceTo(entity.object.position) < 2.8) { callback(); return; }
  const p = entity.approachPosition || entity.object.position;
  walkTo(p.x, p.z + (entity.approachPosition ? 0 : 1.6), callback);
}

function collect(resource) {
  if (resource.collected) return;
  resource.collected = true;
  resource.object.visible = false;
  const label = labels.find(entry => entry.entity === resource);
  if (label) label.button.hidden = true;
  collected.add(resource.id); save();
  toast(`获得黄晶矿 × 1 · ${collected.size}/3`);
  chime([659.25, 783.99, 987.77]);
}

function scan() {
  if (elapsed - scanStarted < 1.4) return;
  scanStarted = elapsed;
  scanRing.position.copy(player.position); scanRing.position.y += .065;
  $('#scan').classList.add('scanning');
  chime([440, 659.25]);
  const nearby = world.entities.filter(e => e.object.position.distanceTo(player.position) < 7);
  const entity = nearby.find(e => !records.has(e.species)) || nearby[0];
  setTimeout(() => {
    $('#scan').classList.remove('scanning');
    if (entity) encounter(entity.species);
    else toast('附近没有发现精灵，去草原中央看看吧。');
  }, 950);
}

function setPanel(title, kicker, content) {
  destination = null; arrival = null; keys.clear();
  $('#panel-title').textContent = title;
  $('#panel-kicker').textContent = kicker;
  $('#panel-content').innerHTML = content;
  refreshIcons();
  if (!panel.open) panel.showModal();
}

function encounter(key) {
  const entry = species[key];
  const recorded = records.has(key);
  setPanel('精灵档案', `LIFE FORM / NO. ${entry.number}`, `<img class="encounter-picture" src="${thumbnails[key]}" alt="${entry.name}三维模型"><h3 class="encounter-title">${entry.name}</h3><div class="encounter-facts"><span class="pill pink">飞行系</span><span class="pill">${entry.level}</span><span class="pill">${entry.height}</span></div><p class="encounter-copy">${entry.description}</p><div class="panel-actions"><button class="primary" id="record" ${recorded ? 'disabled' : ''}><i data-lucide="${recorded ? 'check' : 'scan-line'}"></i>${recorded ? '已收录图鉴' : '记录精灵'}</button></div>`);
  $('#record').addEventListener('click', () => {
    records.add(key); save();
    $('#record').disabled = true;
    $('#record').innerHTML = '<i data-lucide="check"></i>已收录图鉴'; refreshIcons();
    chime([523.25, 659.25, 783.99]);
    toast(`${entry.name}的资料已收录图鉴`);
  });
}

function travel(area) {
  destination = null; arrival = null;
  const places = {
    grass: { player: [3, 0, 5.6], target: [0, 1.2, -.4], camera: [2.8, 25, 37], title: '草原' },
    mine: { player: [-5.7, 0, -1.9], target: [-5, 1, -3], camera: [-4, 19, 23], title: '黄晶矿区' },
    portal: { player: [11.5, world.portal.position.y + .62, -9], target: [9, 2.8, -7], camera: [10, 20, 19], title: '传送台' },
  };
  const place = places[area];
  player.position.fromArray(place.player);
  pet.position.copy(player.position).add(new THREE.Vector3(1.2, 1.5, -.6));
  resetCamera();
  if (innerWidth >= 650) { controls.target.fromArray(place.target); camera.position.fromArray(place.camera); controls.update(); camera.updateMatrixWorld(); }
  $('.area-stamp b').textContent = `克洛斯星 · ${place.title}`;
  panel.close();
  toast(`已抵达 · ${place.title}`);
}

function openPanel(kind) {
  if (kind === 'reference') {
    setPanel('记忆里的克洛斯星', 'MEMORY / ORIGINAL REFERENCE', `<img class="reference-image" src="${reference}" alt="原版赛尔号克洛斯星场景参考图"><p class="reference-caption">克洛斯星 · 草原 / 原版场景留影</p>`);
  } else if (kind === 'dex') {
    setPanel('精灵图鉴', `LIFE FORMS / ${records.size} OF 2`, `<div class="dex-list">${Object.entries(species).map(([key, entry]) => `<div class="dex-row"><img src="${thumbnails[key]}" alt="${entry.name}"><div><span class="overline">NO. ${entry.number}</span><h3>${entry.name} <span class="pill pink">飞行系</span></h3><p>${entry.description}</p><div class="record-state">${records.has(key) ? '已收录 · 克洛斯星草原' : '尚未记录'}</div></div></div>`).join('')}</div>`);
  } else if (kind === 'bag') {
    setPanel('探索背包', 'INVENTORY / RESOURCES', `<div class="inventory-row"><i data-lucide="gem"></i><div><h3>黄晶矿</h3><p>克洛斯星的天然能源矿石</p></div><strong>× ${collected.size}</strong></div><div class="inventory-row"><i data-lucide="book-open"></i><div><h3>精灵观测记录</h3><p>已归档的当地精灵资料</p></div><strong>× ${records.size}</strong></div>${collected.size ? '' : '<p class="empty">背包里的矿石储量为零。</p>'}`);
  } else {
    setPanel('克洛斯星', 'STAR CHART / PANO GALAXY', `<div class="map-picture"><img src="${mapImage}" alt="克洛斯星三维地形总览"><button class="map-pin" data-travel="mine" style="left:17%;top:34%">黄晶矿区</button><button class="map-pin" data-travel="portal" style="right:10%;top:23%">传送台</button><button class="map-pin selected" data-travel="grass" style="left:45%;top:68%">草原</button></div><p class="map-details">帕诺星系的第一站。温暖的橙色大地上，蓝色植被与奇异的粉色植物交错生长。</p>`);
    panel.querySelectorAll('[data-travel]').forEach(button => button.addEventListener('click', () => travel(button.dataset.travel)));
  }
}

async function toggleSound() {
  if (!audioContext) {
    audioContext = new AudioContext();
    audioGain = audioContext.createGain(); audioGain.gain.value = 0;
    audioGain.connect(audioContext.destination);
    // A quiet synthesized ambient chord needs no remote audio asset.
    for (const frequency of [130.81, 196, 261.63, 329.63]) {
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.value = .027;
      oscillator.connect(gain); gain.connect(audioGain); oscillator.start();
    }
  }
  await audioContext.resume();
  sound = !sound;
  audioGain.gain.setTargetAtTime(sound ? .55 : 0, audioContext.currentTime, .35);
  $('#sound').setAttribute('aria-pressed', String(sound));
  $('#sound').setAttribute('aria-label', sound ? '关闭环境音' : '开启环境音');
  $('#sound').title = sound ? '关闭环境音' : '开启环境音';
  $('#sound').innerHTML = `<i data-lucide="${sound ? 'volume-2' : 'volume-x'}"></i>`; refreshIcons();
}

function chime(notes) {
  if (!sound || !audioContext) return;
  notes.forEach((frequency, i) => {
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    const start = audioContext.currentTime + i * .12;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.07, start + .02); gain.gain.exponentialRampToValueAtTime(.001, start + .6);
    oscillator.connect(gain); gain.connect(audioGain); oscillator.start(start); oscillator.stop(start + .65);
  });
}

function bindEvents() {
  let pointerDown = null;
  canvas.addEventListener('pointerdown', event => { pointerDown = { x: event.clientX, y: event.clientY, id: event.pointerId, button: event.button }; });
  canvas.addEventListener('pointerup', event => {
    if (!pointerDown || event.pointerId !== pointerDown.id || pointerDown.button !== 0 || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) return;
    pointerDown = null;
    cursor.set(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(cursor, camera);
    const hit = raycaster.intersectObject(world.ground)[0];
    if (hit) walkTo(hit.point.x, hit.point.z);
  });
  canvas.addEventListener('pointercancel', () => { pointerDown = null; });
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  document.addEventListener('keydown', event => {
    if (panel.open) return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) { keys.add(event.code); event.preventDefault(); destination = null; arrival = null; }
    if (event.code === 'KeyE' && !event.repeat) scan();
  });
  document.addEventListener('keyup', event => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    suspended = document.hidden; keys.clear();
    if (audioContext) { if (suspended) audioContext.suspend(); else if (sound) audioContext.resume(); }
  });
  $('#reset').addEventListener('click', resetCamera);
  for (const [id, factor] of [['zoom-in', .85], ['zoom-out', 1.18]]) $(`#${id}`).addEventListener('click', () => {
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
    camera.position.copy(controls.target).add(offset); controls.update(); camera.updateMatrixWorld();
  });
  $('#sound').addEventListener('click', () => toggleSound().catch(() => toast('当前浏览器无法播放环境音。')));
  $('#fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else toast('当前浏览器暂不支持全屏。');
    } catch { toast('当前浏览器暂不支持全屏。'); }
  });
  document.addEventListener('fullscreenchange', () => {
    const active = !!document.fullscreenElement;
    $('#fullscreen').innerHTML = `<i data-lucide="${active ? 'minimize' : 'maximize'}"></i>`;
    $('#fullscreen').title = active ? '退出全屏' : '全屏';
    $('#fullscreen').setAttribute('aria-label', active ? '退出全屏' : '全屏'); refreshIcons();
  });
  $('#scan').addEventListener('click', scan);
  document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => openPanel(button.dataset.panel)));
  $('#close-panel').addEventListener('click', () => panel.close());
  panel.addEventListener('click', event => { if (event.target === panel) { const box = panel.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) panel.close(); } });
}

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - (lastTime || now)) / 1000, .05); lastTime = now;
  if (suspended) return;
  elapsed += dt;
  let moving = false;
  if (destination && !panel.open) {
    const difference = destination.clone().sub(player.position); difference.y = 0;
    const distance = difference.length();
    if (distance < .08) { destination = null; const callback = arrival; arrival = null; callback?.(); }
    else {
      difference.normalize();
      player.position.addScaledVector(difference, Math.min(distance, dt * 4.3));
      player.rotation.y = Math.atan2(difference.x, difference.z);
      moving = true;
    }
  }
  if (keys.size && !panel.open && player.position.y < 1) {
    const horizontal = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
    const vertical = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
    const forward = camera.getWorldDirection(new THREE.Vector3()); forward.y = 0; forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    const direction = forward.multiplyScalar(vertical).addScaledVector(right, horizontal).normalize();
    const next = player.position.clone().addScaledVector(direction, dt * 4.3);
    if (canWalk(next.x, next.z)) { player.position.copy(next); moving = direction.lengthSq() > 0; if (moving) player.rotation.y = Math.atan2(direction.x, direction.z); }
  }
  const ambientTime = reducedMotion ? 0 : elapsed;
  player.userData.body.position.y = reducedMotion ? 0 : moving ? Math.abs(Math.sin(elapsed * 13)) * .11 : Math.sin(elapsed * 2) * .018;
  player.userData.arms.forEach((arm, index) => {
    const swing = moving ? Math.sin(elapsed * 6.5) * (index === 0 ? .07 : -.18) : 0;
    arm.rotation.x = reducedMotion ? 0 : THREE.MathUtils.lerp(arm.rotation.x, swing, 1 - Math.exp(-dt * 10));
  });
  marker.position.copy(player.position); marker.position.y += .025;
  marker.material.opacity = .65 + Math.sin(ambientTime * 3) * .12;
  const petTarget = player.position.clone().add(new THREE.Vector3(1.3, 1.5 + Math.sin(ambientTime * 2.7) * .12, -.5));
  pet.position.lerp(petTarget, 1 - Math.exp(-dt * 3));
  pet.rotation.y = player.rotation.y * .35;
  world.entities.forEach((entity, i) => {
    const object = entity.object;
    if (!reducedMotion) {
      object.position.y = .08 + (entity.species === 'pipi' ? Math.max(0, Math.sin(elapsed * 2.2 + i * 2)) * .18 : Math.sin(elapsed * 1.5) * .025);
      object.userData.leftWing.rotation.z = Math.sin(elapsed * 3 + i) * .12;
      object.userData.rightWing.rotation.z = -Math.sin(elapsed * 3 + i) * .12;
    }
  });
  world.update(elapsed, reducedMotion);
  const scanAge = elapsed - scanStarted;
  scanRing.visible = scanAge < 1.5;
  if (scanRing.visible) { scanRing.scale.setScalar(.3 + scanAge * 6); scanRing.material.opacity = (1 - scanAge / 1.5) * .75; }
  controls.update();
  camera.updateMatrixWorld();
  scene.updateMatrixWorld();
  const missionBox = $('.mission').getBoundingClientRect();
  for (const { entity, button } of labels) {
    const p = entity.object.getWorldPosition(new THREE.Vector3()); p.y += entity.height;
    p.project(camera);
    const x = (p.x + 1) * innerWidth / 2, y = (1 - p.y) * innerHeight / 2;
    const blocked = x > missionBox.left - 30 && x < missionBox.right + 35 && y > missionBox.top - 10 && y < missionBox.bottom + 25;
    button.hidden = !entity.object.visible || entity.collected || p.z > 1 || p.z < -1 || x < 25 || x > innerWidth - 25 || y < 110 || y > innerHeight - 110 || blocked;
    if (!button.hidden) { button.style.left = `${x}px`; button.style.top = `${y}px`; }
  }
  $('#coordinates').textContent = `X ${player.position.x.toFixed(1).padStart(4, '0')} · Y ${player.position.z.toFixed(1).padStart(4, '0')}`;
  renderScene();
}

refreshIcons();
try { init(); } catch (error) {
  console.error(error);
  $('#loading b').textContent = '场景暂时无法启动';
  $('#loading span').textContent = '请使用支持 WebGL 的浏览器，并开启硬件加速。';
}
