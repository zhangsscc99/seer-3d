import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';

// Keep the hand-authored palette stable while AO restores contact depth.
export function createPainter(renderer) {
  const prepared = new WeakSet();
  let composer, beauty, occlusion;
  let width = 1, height = 1, stats = { calls: 0, triangles: 0 };

  function prepare(root) {
    root.traverse(object => {
      const source = Array.isArray(object.material) ? object.material : [object.material];
      source.forEach(material => {
        if (!material?.isMeshStandardMaterial || prepared.has(material) || material.emissiveIntensity > .1 || material.metalness > .1) return;
        prepared.add(material);
        const prepareMaterial = material.onBeforeCompile;
        material.onBeforeCompile = (shader, context) => {
          prepareMaterial.call(material, shader, context);
          shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
            vec3 paletteLight = outgoingLight / max(diffuseColor.rgb, vec3(0.025));
            outgoingLight = diffuseColor.rgb * clamp(vec3(0.48) + paletteLight * 0.42, vec3(0.48), vec3(1.06));
            #include <opaque_fragment>
          `);
        };
        material.customProgramCacheKey = () => `seer-palette-light-v2:${prepareMaterial.toString()}`;
        material.needsUpdate = true;
      });
    });
  }

  function init(scene, camera) {
    const target = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: innerWidth < 650 ? 0 : 4 });
    composer = new EffectComposer(renderer, target);
    composer.setPixelRatio(1);
    beauty = new RenderPass(scene, camera);
    const renderBeauty = beauty.render.bind(beauty);
    beauty.render = (...args) => {
      renderBeauty(...args);
      stats = { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
    };
    occlusion = new SSAOPass(scene, camera, width, height, 13);
    occlusion.kernelRadius = .56;
    occlusion.minDistance = .0005;
    occlusion.maxDistance = .012;
    const overrideVisibility = occlusion.overrideVisibility.bind(occlusion);
    occlusion.overrideVisibility = () => {
      overrideVisibility();
      scene.traverse(object => { if (object.isMesh && object.material?.transparent) object.visible = false; });
    };
    composer.addPass(beauty);
    composer.addPass(occlusion);
    composer.addPass(new OutputPass());
    composer.setSize(width, height);
  }

  return {
    prepare,
    resize(w, h) {
      width = w;
      height = h;
      composer?.setSize(w, h);
    },
    render(scene, camera) {
      if (!composer) init(scene, camera);
      beauty.scene = scene;
      beauty.camera = camera;
      occlusion.scene = scene;
      occlusion.camera = camera;
      occlusion.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(camera.projectionMatrix);
      occlusion.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);
      composer.render();
      return stats;
    },
  };
}
