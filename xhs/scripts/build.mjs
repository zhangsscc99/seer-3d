import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { parse } from 'acorn';
import { simple } from 'acorn-walk';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = path.join(root, 'app');
const vendor = path.join(root, 'vendor/three');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function replaceRequired(source, before, after, label) {
  if (!source.includes(before)) throw new Error('Vendor patch no longer applies: ' + label);
  return source.replace(before, after);
}
async function patch(file, transform) {
  const target = path.join(vendor, 'src', file);
  await fs.writeFile(target, transform(await fs.readFile(target, 'utf8')));
}
async function prepareVendor() {
  await fs.mkdir(vendor, {recursive:true});
  await fs.cp(path.join(root, 'node_modules/three/src'), path.join(vendor, 'src'), {recursive:true});
  await fs.copyFile(path.join(root, 'node_modules/three/LICENSE'), path.join(vendor, 'LICENSE'));
  await patch('renderers/WebGLRenderer.js', source => {
    source = replaceRequired(source, "import { WebXRManager } from './webxr/WebXRManager.js';\n", '', 'XR import');
    source = replaceRequired(source, '\t\t// xr\n\n\t\tconst xr = new WebXRManager( _this, _gl );\n\n\t\tthis.xr = xr;\n', '', 'XR constructor');
    source = replaceRequired(source, "\t\t\tif ( xr.isPresenting ) {\n\n\t\t\t\tconsole.warn( 'THREE.WebGLRenderer: Can\\'t change size while VR device is presenting.' );\n\t\t\t\treturn;\n\n\t\t\t}\n", '', 'XR resize');
    source = replaceRequired(source, "\t\t\txr.dispose();\n\n\t\t\txr.removeEventListener( 'sessionstart', onXRSessionStart );\n\t\t\txr.removeEventListener( 'sessionend', onXRSessionEnd );\n", '', 'XR dispose');
    source = replaceRequired(source, '\t\tfunction onXRSessionStart() {\n\n\t\t\tanimation.stop();\n\n\t\t}\n\n\t\tfunction onXRSessionEnd() {\n\n\t\t\tanimation.start();\n\n\t\t}\n', '', 'XR loop callbacks');
    source = replaceRequired(source, '\t\t\txr.setAnimationLoop( callback );\n', '', 'XR animation');
    source = replaceRequired(source, "\t\txr.addEventListener( 'sessionstart', onXRSessionStart );\n\t\txr.addEventListener( 'sessionend', onXRSessionEnd );\n", '', 'XR events');
    source = replaceRequired(source, '\t\t\tif ( xr.enabled === true && xr.isPresenting === true ) {\n\n\t\t\t\tif ( xr.cameraAutoUpdate === true ) xr.updateCamera( camera );\n\n\t\t\t\tcamera = xr.getCamera(); // use XR camera for rendering\n\n\t\t\t}\n', '', 'XR render camera');
    return source;
  });
  await patch('renderers/webgl/WebGLBackground.js', source => replaceRequired(source,
    "\t\tconst environmentBlendMode = renderer.xr.getEnvironmentBlendMode();\n\n\t\tif ( environmentBlendMode === 'additive' ) {\n\n\t\t\tstate.buffers.color.setClear( 0, 0, 0, 1, premultipliedAlpha );\n\n\t\t} else if ( environmentBlendMode === 'alpha-blend' ) {\n\n\t\t\tstate.buffers.color.setClear( 0, 0, 0, 0, premultipliedAlpha );\n\n\t\t}\n", '', 'XR background blend'));
  await patch('cameras/CubeCamera.js', source => source
    .replace('\t\tconst currentXrEnabled = renderer.xr.enabled;\n', '')
    .replace('\t\trenderer.xr.enabled = false;\n', '')
    .replace('\t\trenderer.xr.enabled = currentXrEnabled;\n', ''));
  await fs.rm(path.join(vendor, 'src/renderers/webxr'), {recursive:true, force:true});
  await patch('renderers/webgl/WebGLTextures.js', source => {
    const start = source.indexOf('\t// cordova iOS');
    const end = source.indexOf('\tfunction resizeImage(', start);
    if (start < 0 || end < 0) throw new Error('Cannot locate canvas compatibility block');
    return source.slice(0, start) + '\t// Mini tool: texture resampling stays on the document main thread.\n\tfunction createCanvas() { return createElementNS( \'canvas\' ); }\n\n' + source.slice(end);
  });
  for (const className of ['FileLoader', 'ImageBitmapLoader']) {
    await fs.writeFile(path.join(vendor, 'src/loaders', className + '.js'), `import { Loader } from './Loader.js';\n// Rendering-only vendor: file and bitmap request loading is deliberately unavailable.\nclass ${className} extends Loader {\n load(url, onLoad, onProgress, onError) {\n  const error = new Error('External resource loading is disabled in this offline renderer.');\n  if (onError) { onError(error); return; }\n  throw error;\n }\n setResponseType() { return this; }\n setMimeType() { return this; }\n setOptions() { return this; }\n}\nexport { ${className} };\n`);
  }
  await patch('loaders/ImageLoader.js', source => replaceRequired(source,
    '\t\turl = this.manager.resolveURL( url );\n',
    "\t\turl = this.manager.resolveURL( url );\n\t\tif (typeof url !== 'string' || !/^data:image\\/(?:png|jpeg|jpg|webp|gif|svg\\+xml);/i.test(url)) {\n\t\t\tconst error = new Error('Only embedded image textures are supported.');\n\t\t\tif (onError) { onError(error); return createElementNS('img'); }\n\t\t\tthrow error;\n\t\t}\n", 'embedded image allowlist'));
  const report = {
    upstream:'three', version:'0.160.1', license:'MIT',
    changes:[
      'Removed XR session implementation, renderer camera switching, listeners and background blending.',
      'Removed XR controller modules and CubeCamera XR toggles.',
      'Removed off-main-thread canvas detection/construction; texture resizing uses document canvas.',
      'FileLoader and ImageBitmapLoader explicitly reject all request loading.',
      'ImageLoader accepts embedded data:image textures only; remote and filesystem URLs are rejected.',
      'Rendering geometry, materials, shader chunks and WebGL1/WebGL2 render paths remain upstream.'
    ]
  };
  await fs.writeFile(path.join(vendor, 'modifications.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}
const images = new Map();
async function embedReferences(source) {
  const matches = [...source.matchAll(/(["'])\/?(?:\.\/)?references\/([a-zA-Z0-9_.-]+)\1/g)];
  for (const match of matches) {
    const filename = match[2];
    if (!images.has(filename)) {
      let buffer, ext;
      try { buffer=await fs.readFile(path.join(root,'mobile-assets',filename+'.webp'));ext='.webp'; }
      catch(error) { if(error.code!=='ENOENT')throw error;buffer=await fs.readFile(path.join(root,'public/references',filename));ext=path.extname(filename).toLowerCase(); }
      const type = {'.png':'png','.jpg':'jpeg','.jpeg':'jpeg','.webp':'webp','.gif':'gif','.svg':'svg+xml'}[ext];
      if (!type) throw new Error('Unsupported reference image: ' + filename);
      images.set(filename, {uri:'data:image/' + type + ';base64,' + buffer.toString('base64'), bytes:buffer.length, sha256:sha(buffer)});
    }
    source = source.replaceAll(match[0], match[1] + images.get(filename).uri + match[1]);
  }
  return source;
}
function checkJavaScript(code) {
  const ast = parse(code, {ecmaVersion:2017, sourceType:'script'});
  const forbidden = new Set(['fetch','XMLHttpRequest','WebSocket','EventSource','WebAssembly','Worker','SharedWorker','OffscreenCanvas','RTCPeerConnection','RTCDataChannel','XRWebGLLayer','XRWebGLBinding']);
  const blockedMembers = new Set(['requestFullscreen','webkitRequestFullscreen','requestPointerLock','getUserMedia','getDisplayMedia','enumerateDevices','geolocation','clipboard','serviceWorker','requestSession','execCommand']);
  const failures = [];
  simple(ast, {
    Identifier(node) { if (forbidden.has(node.name)) failures.push(node.name); },
    CallExpression(node) { if (node.callee.type === 'Identifier' && ['eval','Function'].includes(node.callee.name)) failures.push(node.callee.name); },
    NewExpression(node) { if (node.callee.type === 'Identifier' && node.callee.name === 'Function') failures.push('new Function'); },
    MemberExpression(node) {
      const name = node.computed ? node.property.value : node.property.name;
      if (blockedMembers.has(name)) failures.push(name);
      if (node.object.type === 'Identifier' && ['window','globalThis','self'].includes(node.object.name) && ['open','prompt','eval','Function'].includes(name)) failures.push(node.object.name + '.' + name);
    }
  });
  if (failures.length) throw new Error('Forbidden executable capabilities in app: ' + [...new Set(failures)].join(', '));
  return {syntax:'ES2017 parsed by Acorn', target:'Chrome 61', forbiddenCapabilities:[]};
}
async function main() {
  const modifications = await prepareVendor();
  if (process.argv.includes('--vendor-only')) { console.log(JSON.stringify(modifications, null, 2)); return; }
  await fs.mkdir(app, {recursive:true});
  const results = await build({
    absWorkingDir:root, entryPoints:{app:'src/main.js',boot:'src/boot.js'}, bundle:true, format:'iife', platform:'browser',
    target:['chrome61','es2017'], outdir:'app', write:false, minify:true,
    legalComments:'inline', charset:'utf8', metafile:true,
    plugins:[{
      name:'rendering-only-local-assets',
      setup(buildApi) {
        buildApi.onResolve({filter:/^three$/}, () => ({path:path.join(vendor, 'src/Three.js')}));
        buildApi.onResolve({filter:/^three\/(?:addons|examples\/jsm)\//}, args => ({path:path.join(root, 'node_modules/three/examples/jsm', args.path.replace(/^three\/(?:addons|examples\/jsm)\//,''))}));
        buildApi.onLoad({filter:/\.js$/}, async args => {
          if (!args.path.startsWith(path.join(root, 'src') + path.sep)) return;
          return {contents:await embedReferences(await fs.readFile(args.path, 'utf8')), loader:'js'};
        });
      }
    }]
  });
  let js = '', boot = '', css = '';
  for (const file of results.outputFiles) {
    if (file.path.endsWith('/app.js')) js = file.text;
    if (file.path.endsWith('/boot.js')) boot = file.text;
    if (file.path.endsWith('.css')) css = file.text;
  }
  if (!js || !boot || !css) throw new Error('Expected external app, boot and CSS output');
  const check = checkJavaScript(js);
  checkJavaScript(boot);
  let html = await embedReferences(await fs.readFile(path.join(root, 'index.html'), 'utf8'));
  html = html.replace(/<script\b[^>]*\bsrc=["']([^"']*)["'][^>]*>\s*<\/script>/g, (_tag, source) => '<script src="./' + (source.endsWith('/boot.js') ? 'boot.js' : 'app.js') + '"></script>');
  html = html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/g, '');
  html = html.replace('</head>', '<link rel="stylesheet" href="./style.css">\n</head>');
  if (/<script\b(?![^>]*\bsrc=)/i.test(html)) throw new Error('Inline script in HTML');
  if (/\son[a-z]+\s*=|javascript:|<iframe\b|<object\b|\bdownload\s*=|target\s*=\s*["']_blank/i.test(html)) throw new Error('Blocked HTML behavior');
  if ((html.match(/<script\b/g)||[]).length !== 2 || html.indexOf('./boot.js') > html.indexOf('./app.js')) throw new Error('Need external boot then app scripts');
  const assetUrls = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map(m=>m[1]);
  const invalidUrls = assetUrls.filter(url => !url.startsWith('data:image/') && !url.startsWith('#') && !['./boot.js','./app.js','./style.css'].includes(url));
  if (invalidUrls.length) throw new Error('Unresolved HTML resource URLs: ' + invalidUrls.join(', '));
  const license = {
    three:{version:'0.160.1', license:await fs.readFile(path.join(root, 'node_modules/three/LICENSE'), 'utf8'), modifications:modifications.changes}
  };
  await fs.rm(app, {recursive:true, force:true});
  await fs.mkdir(app, {recursive:true});
  await fs.writeFile(path.join(app, 'app.js'), js);
  await fs.writeFile(path.join(app, 'boot.js'), boot);
  await fs.writeFile(path.join(app, 'style.css'), css);
  await fs.writeFile(path.join(app, 'index.html'), html);
  await fs.writeFile(path.join(app, 'licenses.json'), JSON.stringify(license, null, 2) + '\n');
  const report = {
    builtAt:new Date().toISOString(), ...check, vendor:modifications,
    scripts:'external boot and app IIFEs', network:'no executable request/XR/worker API in emitted JS; all images embedded',
    embeddedImages:[...images].map(([name, value])=>({name, bytes:value.bytes, sha256:value.sha256})),
    files:{'app.js':{bytes:Buffer.byteLength(js),sha256:sha(js)},'boot.js':{bytes:Buffer.byteLength(boot),sha256:sha(boot)},'style.css':{bytes:Buffer.byteLength(css),sha256:sha(css)},'index.html':{bytes:Buffer.byteLength(html),sha256:sha(html)}}
  };
  await fs.mkdir(path.join(root, 'evidence'), {recursive:true});
  await fs.writeFile(path.join(root, 'evidence/build.json'), JSON.stringify(report, null, 2) + '\n');
  await fs.writeFile(path.join(root, 'evidence/build-metafile.json'), JSON.stringify(results.metafile, null, 2) + '\n');
  console.log(JSON.stringify({ok:true, ...check, files:report.files, imageCount:images.size}, null, 2));
}
await main();
