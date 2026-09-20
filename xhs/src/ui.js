const PLACES = [
  {id:'castle', title:'摩尔城堡'},
  {id:'church', title:'爱心教堂'},
  {id:'street', title:'淘淘乐街'},
  {id:'petshop',title:'宠物店',subtitle:'穿过绿框玻璃门，看看吊窝、拉姆和花园柜台',indoor:true},
  {id:'beach', title:'阳光海滩'},
  {id:'ram', title:'拉姆学院'},
  {id:'farm', title:'摩尔农场'},
  {id:'ranch', title:'开心牧场'},
  {id:'hall',title:'城堡大厅',subtitle:'穿过拱门，走近花瓣台阶上的王座',indoor:true},
  {id:'study',title:'二楼书房',subtitle:'在蓝色软椅上翻开一本书',indoor:true},
  {id:'playground',title:'西部游乐场',subtitle:'走过彩色棋盘，去巨树里的游戏小屋'},
  {id:'gamehut',title:'游戏小屋',subtitle:'星星灯亮着，树洞里又开了一局',indoor:true},
  {id:'classroom',title:'拉姆教室',subtitle:'木楼梯、实验桌和黑板，上课铃又响了',indoor:true},
  {id:'home',title:'摩尔家园',subtitle:'紫色屋顶下，秋千、花园和小菜地都在'},
  {id:'homeinside',title:'家园小屋',subtitle:'推开家门，看看满屋熟悉的小摆件',indoor:true},
];
const ISLAND = {id:'island', title:'庄园全岛'};

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#i-' + name);
  svg.appendChild(use);
  return svg;
}

function textSpan(className, text) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
}

function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

// Keep each island label near its projected anchor without covering its peers.
// Positions use the portal CSS convention: horizontal center, button bottom.
function placeIslandMarkers(items, width, height) {
  const placed = [], inset = 8, gap = 4, stem = 7;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  for (const item of items) {
    const half = item.width / 2, minX = inset + half, maxX = width - inset - half;
    const minY = inset + item.height, maxY = height - inset - stem;
    const anchorX = item.x, anchorY = item.y;
    const xs = [clamp(anchorX, minX, maxX), minX, maxX];
    const ys = [clamp(anchorY, minY, maxY), minY, maxY];
    for (const rect of placed) {
      xs.push(rect.left - gap - half, rect.right + gap + half);
      ys.push(rect.top - gap - stem, rect.bottom + gap + item.height);
    }
    let best = null, bestDistance = Infinity;
    for (const x of xs) for (const y of ys) {
      if (x < minX || x > maxX || y < minY || y > maxY) continue;
      const distance = (x - anchorX) ** 2 + (y - anchorY) ** 2;
      if (distance >= bestDistance) continue;
      const rect = {left:x - half, right:x + half, top:y - item.height, bottom:y + stem};
      if (placed.some(other => rect.left < other.right + gap && rect.right > other.left - gap && rect.top < other.bottom + gap && rect.bottom > other.top - gap)) continue;
      best = {x, y, rect};
      bestDistance = distance;
    }
    if (best) {
      item.x = best.x;
      item.y = best.y;
      placed.push(best.rect);
    }
  }
}

export function setupUI(handlers = {}) {
  const $ = id => document.getElementById(id);
  const nodes = {
    shell:$('app-shell'), sceneStage:$('scene-stage'), sceneTools:$('scene-tools'), title:$('location-title'),
    islandButton:$('island-button'), loading:$('stage-loading'), loadingText:$('loading-text'),
    theatre:$('theatre'), sound:$('sound-button'), helpDialog:$('help-dialog'),
    fatal:$('fatal-error'), portalLayer:$('portal-layer'),
    progress:$('progress-text'), toast:$('toast'), canvas:$('world'),
  };
  const byId = new Map(PLACES.map(place => [place.id, place]));
  const destinations = new Map(), portalButtons = new Map();
  const islandSizeCache = new WeakMap();
  let currentId = null;
  let toastTimer, overlayInvoker = null;

  function invoke(name, arg, options) {
    if (typeof handlers[name] === 'function') return handlers[name](arg, options);
  }

  function visit(id, options) {
    if (byId.has(id)) invoke('onVisit', id, options);
  }

  PLACES.forEach(place => {
    const destination = document.createElement('button');
    destination.type = 'button';
    destination.className = 'destination-tag';
    destination.dataset.destination = place.id;
    destination.dataset.testid = 'destination-' + place.id;
    destination.setAttribute('aria-pressed', 'false');
    destination.appendChild(textSpan('destination-title', place.title));
    destination.addEventListener('click', () => visit(place.id));
    destinations.set(place.id, destination);
    $('destination-nav').appendChild(destination);
  });

  function resizeLayout() {
    nodes.shell.classList.toggle('compact', nodes.shell.clientWidth < 720);
  }

  function restoreFocus() {
    const invoker = overlayInvoker;
    if (invoker && document.documentElement.contains(invoker) && !invoker.disabled && invoker.getClientRects().length) invoker.focus();
  }

  function showScreen(node) {
    overlayInvoker = document.activeElement;
    node.hidden = false;
    node.classList.add('active');
    node.setAttribute('aria-hidden', 'false');
    const firstButton = node.querySelector('button');
    if (firstButton) firstButton.focus();
  }

  function hideScreen(node, focus = true) {
    node.hidden = true;
    node.classList.remove('active');
    node.setAttribute('aria-hidden', 'true');
    if (focus) restoreFocus();
  }

  function closeOtherScreens() {
    hideScreen(nodes.helpDialog, false);
  }

  function showScene(id) {
    const place = byId.get(id) || (id === 'island' ? ISLAND : null);
    if (!place) return;
    closeOtherScreens();
    currentId = id;
    document.body.dataset.page = 'scene';
    document.body.dataset.overview = String(id === 'island');
    nodes.islandButton.disabled = id === 'island';
    nodes.sceneStage.hidden = false;
    nodes.sceneTools.hidden = false;
    nodes.title.textContent = place.title;
    nodes.sceneStage.setAttribute('aria-label', place.title + ' 3D 场景');
    nodes.canvas.setAttribute('aria-label', place.title + ' 3D 全景，单指环绕、双指缩放、轻点地面行走');
    document.title = place.title + ' · 摩尔庄园';
    for (const entry of destinations) entry[1].setAttribute('aria-pressed', String(entry[0] === id));
    const activeDestination = destinations.get(id), nav = $('destination-nav');
    if (activeDestination) {
      const left = activeDestination.offsetLeft, right = left + activeDestination.offsetWidth;
      if (left < nav.scrollLeft) nav.scrollLeft = left;
      else if (right > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = right - nav.clientWidth;
    }
    resizeLayout();
  }

  function setLoading(loading, text = '正在铺好通往庄园的小路…') {
    nodes.loading.hidden = !loading;
    nodes.loadingText.textContent = text;
    nodes.theatre.setAttribute('aria-busy', String(Boolean(loading)));
  }

  function setLocationProgress(value) {
    const count = Math.max(0, Math.min(PLACES.length, Math.round(Number(value) || 0)));
    nodes.progress.textContent = count === PLACES.length ? '全部风景，都见过啦' : '足迹 ' + count + ' / ' + PLACES.length;
  }

  function setVisited(ids) {
    const visited = new Set(Array.from(ids || []).filter(id => byId.has(id)));
    for (const place of PLACES) {
      const seen = visited.has(place.id);
      destinations.get(place.id).classList.toggle('visited', seen);
    }
    setLocationProgress(visited.size);
  }

  function setView() {
    document.body.dataset.view = 'classic';
    $('camera-mode-label').textContent = '单指环绕 · 双指缩放';
  }

  function setSound(enabled) {
    const sound = Boolean(enabled);
    document.body.dataset.sound = String(sound);
    nodes.sound.setAttribute('aria-pressed', String(sound));
    nodes.sound.setAttribute('aria-label', sound ? '关闭背景音乐' : '开启背景音乐');
    nodes.sound.title = sound ? '关闭背景音乐' : '开启背景音乐';
  }

  function setPortals(items = []) {
    const knownIds = new Set();
    const portalItems = items.filter(item => {
      if (!item || !item.id || !byId.has(item.target) || knownIds.has(item.id)) return false;
      knownIds.add(item.id);
      return true;
    });
    portalButtons.clear();
    clearNode(nodes.portalLayer);
    for (const item of portalItems) {
      const title = item.title || byId.get(item.target).title;
      const portal = document.createElement('button');
      portal.type = 'button';
      portal.className = 'portal-button' + (item.direct ? ' island-marker' : '');
      portal.dataset.portal = item.id;
      portal.dataset.testid = 'portal-' + item.id;
      portal.setAttribute('aria-label', (item.direct ? '进入' : '沿路牌前往') + title);
      portal.appendChild(textSpan('', title));
      portal.appendChild(icon('arrow'));
      portal.hidden = true;
      portal.addEventListener('click', () => visit(item.target, {viaPortal:!item.direct}));
      portalButtons.set(item.id, portal);
      nodes.portalLayer.appendChild(portal);
    }
  }

  function updatePortals(projected = []) {
    const updated = new Set(), positions = [], markers = [];
    for (const point of projected) {
      const button = portalButtons.get(point.id);
      if (!button) continue;
      updated.add(point.id);
      const visible = Boolean(point.visible) && Number.isFinite(point.x) && Number.isFinite(point.y);
      button.hidden = !visible;
      if (visible) {
        const position = {button, x:point.x, y:point.y};
        positions.push(position);
        if (currentId === 'island' && button.classList.contains('island-marker')) markers.push(position);
      }
    }
    for (const entry of portalButtons) if (!updated.has(entry[0])) entry[1].hidden = true;
    if (markers.length) {
      // Show all labels first, batch their logical (unrotated) size reads, then
      // write all positions. Stable frames reuse the measurements after resize.
      const width = nodes.portalLayer.clientWidth, height = nodes.portalLayer.clientHeight;
      const sizeKey = width + ':' + height;
      for (const marker of markers) {
        let size = islandSizeCache.get(marker.button);
        if (!size || size.key !== sizeKey) {
          size = {key:sizeKey, width:marker.button.offsetWidth, height:marker.button.offsetHeight};
          islandSizeCache.set(marker.button, size);
        }
        marker.width = size.width;
        marker.height = size.height;
      }
      if (width && height) placeIslandMarkers(markers, width, height);
    }
    for (const position of positions) {
      position.button.style.left = position.x + 'px';
      position.button.style.top = position.y + 'px';
    }
  }

  function showError(text) {
    closeOtherScreens();
    setLoading(false);
    $('fatal-message').textContent = text || '画面暂时没有加载成功，请重新进入庄园。';
    showScreen(nodes.fatal);
  }

  function isOverlayOpen() {
    return !nodes.helpDialog.hidden || !nodes.fatal.hidden || nodes.fatal.classList.contains('active');
  }

  function toast(text) {
    clearTimeout(toastTimer);
    nodes.toast.textContent = text;
    nodes.toast.hidden = !text;
    if (text) toastTimer = setTimeout(() => { nodes.toast.hidden = true; }, 3800);
  }

  $('brand-home').addEventListener('click', () => invoke('onIsland'));
  nodes.islandButton.addEventListener('click', () => invoke('onIsland'));
  nodes.sound.addEventListener('click', () => invoke('onSound'));
  $('reset-button').addEventListener('click', () => invoke('onReset'));
  $('help-button').addEventListener('click', () => { closeOtherScreens(); showScreen(nodes.helpDialog); });
  $('help-close').addEventListener('click', () => hideScreen(nodes.helpDialog));
  $('help-start').addEventListener('click', () => hideScreen(nodes.helpDialog));

  nodes.helpDialog.addEventListener('click', event => { if (event.target === nodes.helpDialog) hideScreen(nodes.helpDialog); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !isOverlayOpen() || !nodes.fatal.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    hideScreen(nodes.helpDialog);
  }, true);

  window.addEventListener('resize', resizeLayout);
  window.addEventListener('manor:layout', resizeLayout);
  setView();
  setSound(false);

  return {
    showScene, setLoading, setVisited, toast, setView, setSound,
    setPortals, updatePortals, setLocationProgress, resizeLayout,
    isOverlayOpen, showError,
  };
}
