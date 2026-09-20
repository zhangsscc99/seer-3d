import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

// Keep reference and model at comparable scale and viewing angle for visual review.
const base = process.env.SEER_URL || 'http://127.0.0.1:4175';
await mkdir('evidence', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, timeout: 30000 });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1590 } });
  page.on('pageerror', error => { throw error; });
  await page.goto(`${base}/ScreenShot_2026-09-18_001547_516.png`);
  const stats = await page.evaluate(async () => {
    const source = document.querySelector('img');
    await source.decode();
    const T = await import('/node_modules/three/build/three.module.js');
    const W = await import('/src/world.js');
    const { RoomEnvironment } = await import('/node_modules/three/examples/jsm/environments/RoomEnvironment.js');
    const { createPainter } = await import('/src/painter.js');
    document.body.replaceChildren();
    document.body.style.cssText = 'margin:0;background:#f2ede6';
    const board = document.createElement('canvas');
    board.width = 1400; board.height = 1590;
    document.body.append(board);
    const ctx = board.getContext('2d');
    ctx.fillStyle = '#f2ede6'; ctx.fillRect(0, 0, 1400, 1590);
    ctx.fillStyle = '#294444'; ctx.font = 'bold 23px sans-serif';
    ctx.fillText('主角 · 原图', 70, 40); ctx.fillText('主角 · 当前三维模型', 745, 40);
    ctx.fillText('比波 · 原图', 70, 563); ctx.fillText('比波 · 当前三维模型', 745, 563);
    ctx.fillText('皮皮 · 原图', 70, 1093); ctx.fillText('皮皮 · 当前三维模型', 745, 1093);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 1090, 731, 133, 163, 185, 58, 352, 432);
    ctx.drawImage(source, 916, 675, 164, 199, 178, 588, 353, 428);
    ctx.drawImage(source, 580, 685, 115, 91, 90, 1118, 543, 430);
    const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(620, 445);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace;
    const scene = new T.Scene();
    scene.background = new T.Color(0xf2ede6);
    const environment = new RoomEnvironment();
    const pmrem = new T.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(environment, .04).texture;
    scene.environmentIntensity = .24;
    environment.dispose(); pmrem.dispose();
    scene.add(new T.HemisphereLight(0xfff5e4, 0x7a929c, 1.45));
    const sun = new T.DirectionalLight(0xffe6c8, 2.4);
    sun.position.set(-5, 8, 6); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.normalBias = .02;
    scene.add(sun);
    const fill = new T.DirectionalLight(0xb9e5ec, .6);
    fill.position.set(5, 3, -4); scene.add(fill);
    const painter = createPainter(renderer); painter.resize(620, 445);
    const camera = new T.OrthographicCamera(-1, 1, 1, -1, .1, 60);
    const results = [];
    for (const [make, yaw, y] of [[W.createRobot, -.70, 57], [W.createBibo, -.55, 580], [W.createPipi, -.08, 1110]]) {
      const model = make(); model.rotation.y = yaw; scene.add(model);
      const bounds = new T.Box3().setFromObject(model);
      const center = bounds.getCenter(new T.Vector3());
      const direction = new T.Vector3(0, .46, 1).normalize();
      camera.position.copy(center).add(direction); camera.lookAt(center);
      const inverse = camera.quaternion.clone().invert();
      const viewBounds = new T.Box3();
      const vertex = new T.Vector3();
      model.traverse(mesh => {
        if (!mesh.isMesh) return;
        const positions = mesh.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          vertex.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).sub(center).applyQuaternion(inverse);
          viewBounds.expandByPoint(vertex);
        }
      });
      const extent = viewBounds.getSize(new T.Vector3());
      const shift = viewBounds.getCenter(new T.Vector3()); shift.z = 0;
      center.add(shift.applyQuaternion(camera.quaternion));
      const halfHeight = Math.max(extent.y, extent.x / (620 / 445)) * .53;
      camera.top = halfHeight; camera.bottom = -halfHeight;
      camera.left = -halfHeight * 620 / 445; camera.right = -camera.left;
      camera.position.copy(center).addScaledVector(direction, 12);
      camera.updateProjectionMatrix();
      painter.prepare(scene);
      results.push(painter.render(scene, camera));
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(renderer.domElement, 720, y);
      model.rotation.y += Math.PI;
      painter.render(scene, camera);
      const reverse = new Image(); reverse.src = renderer.domElement.toDataURL(); await reverse.decode();
      window.reviewBacks ||= []; window.reviewBacks.push(reverse);
      scene.remove(model);
    }
    window.reviewBoard = { board, ctx };
    return results;
  });
  await page.screenshot({ path: 'evidence/character-comparison.png' });
  await page.evaluate(() => {
    const { ctx } = window.reviewBoard;
    ctx.fillStyle = '#f2ede6';
    window.reviewBacks.forEach((image, i) => {
      const y = [57, 580, 1110][i];
      ctx.fillRect(720, y - 7, 670, 470);
      ctx.drawImage(image, 720, y);
    });
  });
  await page.screenshot({ path: 'evidence/character-comparison-back.png' });
  console.log(JSON.stringify(stats));
} finally {
  await browser.close();
}
