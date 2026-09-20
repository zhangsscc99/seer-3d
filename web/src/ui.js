const PLACES = [
  {id:'castle', title:'摩尔城堡', subtitle:'沿着圆塔和石阶，回到熟悉的城堡'},
  {id:'church', title:'爱心教堂', subtitle:'经过爱心广场，看看记忆里的邻居'},
  {id:'street', title:'淘淘乐街', subtitle:'沿街的招牌，还记得每一家吗'},
  {id:'petshop',title:'宠物店',subtitle:'穿过绿框玻璃门，看看吊窝、拉姆和花园柜台',indoor:true},
  {id:'beach', title:'阳光海滩', subtitle:'灯塔、码头，还有慢悠悠的海风'},
  {id:'ram', title:'拉姆学院', subtitle:'沿着树根小路，走进左侧木屋的教室'},
  {id:'farm', title:'摩尔农场', subtitle:'田地里的每一颗种子，都有盼头'},
  {id:'ranch', title:'开心牧场', subtitle:'跟着小栅栏，去看看草地上的朋友'},
  {id:'hall',title:'城堡大厅',subtitle:'穿过拱门，走近花瓣台阶上的王座',indoor:true},
  {id:'study',title:'二楼书房',subtitle:'在蓝色软椅上翻开一本书',indoor:true},
  {id:'playground',title:'西部游乐场',subtitle:'走过彩色棋盘，去巨树里的游戏小屋'},
  {id:'gamehut',title:'游戏小屋',subtitle:'星星灯亮着，树洞里又开了一局',indoor:true},
  {id:'classroom',title:'拉姆教室',subtitle:'木楼梯、实验桌和黑板，上课铃又响了',indoor:true},
  {id:'home',title:'摩尔家园',subtitle:'紫色屋顶下，秋千、花园和小菜地都在'},
  {id:'homeinside',title:'家园小屋',subtitle:'推开家门，看看满屋熟悉的小摆件',indoor:true},
];
const ISLAND = {id:'island',title:'摩尔庄园 · 全岛',subtitle:'转一转这座岛，选一处风景走进去'};

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

function textSpan(className, text) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
}

export function setupUI(handlers = {}) {
  const $ = id => document.getElementById(id);
  const nodes = {
    sceneStage:$('scene-stage'), sceneTools:$('scene-tools'),
    hint:$('stage-hint'), hintText:$('stage-hint-text'), title:$('location-title'), subtitle:$('location-subtitle'),
    loading:$('stage-loading'), loadingText:$('loading-text'), theatre:$('theatre'),
    sound:$('sound-button'), helpDialog:$('help-dialog'),
    portalLayer:$('portal-layer'), neighbors:$('neighbor-links'), progress:$('progress-text'),
    progressDots:$('progress-dots'), toast:$('toast'), canvas:$('world'),
  };
  const byId = new Map(PLACES.map(place => [place.id, place]));
  const destinations = new Map(), portalButtons = new Map();
  let currentId = null;
  let portalItems = [], toastTimer;
  let helpInvoker = null;

  function visit(id, options) {
    if (byId.has(id)) handlers.onVisit?.(id, options);
  }

  PLACES.forEach((place, index) => {
    const destination = document.createElement('button');
    destination.type = 'button';
    destination.className = 'destination-tag';
    destination.dataset.destination = place.id;
    destination.dataset.testid = `destination-${place.id}`;
    destination.setAttribute('aria-pressed', 'false');
    destination.append(textSpan('destination-number', String(index + 1).padStart(2, '0')), textSpan('destination-title', place.title));
    destination.addEventListener('click', () => visit(place.id));
    destinations.set(place.id, destination);
    $('destination-nav').append(destination);
    nodes.progressDots.append(document.createElement('span'));
  });

  function updateHint() {
    nodes.hintText.textContent=currentId==='island'?'拖动旋转整座岛 · 滚轮缩放 · 点击地标进入场景':'拖动环绕 · 滚轮缩放 · 点地面行走';
  }

  function showScene(id) {
    const place = byId.get(id) || (id==='island'?ISLAND:null);
    if (!place) return;
    currentId = id;
    document.body.dataset.page = 'scene';
    document.body.dataset.overview = String(id==='island');
    $('island-button').disabled=id==='island';
    nodes.sceneStage.hidden = false;
    nodes.sceneTools.hidden = false;
    nodes.hint.hidden = false;
    nodes.neighbors.hidden = portalItems.length === 0;
    nodes.title.textContent = place.title;
    nodes.subtitle.textContent = place.subtitle;
    nodes.sceneStage.setAttribute('aria-label', `${place.title} 3D 场景`);
    nodes.canvas.setAttribute('aria-label', `${place.title} 3D 全景，拖动环绕，滚轮缩放，点地面行走，点路牌切换场景`);
    document.title = `${place.title} · 摩尔庄园`;
    nodes.canvas.focus({preventScroll:true});
    for (const [destinationId, destination] of destinations) destination.setAttribute('aria-pressed', String(destinationId === id));
    const activeDestination = destinations.get(id), nav = $('destination-nav');
    if (activeDestination) {
      const left = activeDestination.offsetLeft, right = left + activeDestination.offsetWidth;
      if (left < nav.scrollLeft) nav.scrollLeft = left;
      else if (right > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = right - nav.clientWidth;
    }
    updateHint();
  }

  function setLoading(loading, text = '正在铺好通往庄园的小路…') {
    nodes.loading.hidden = !loading;
    nodes.loadingText.textContent = text;
    nodes.theatre.setAttribute('aria-busy', String(Boolean(loading)));
  }

  function setLocationProgress(value) {
    const count = Math.max(0, Math.min(PLACES.length, Math.round(Number(value) || 0)));
    nodes.progress.textContent = count === PLACES.length ? '全部风景，都见过啦' : `足迹 ${count} / ${PLACES.length}`;
    [...nodes.progressDots.children].forEach((dot, index) => dot.classList.toggle('visited', index < count));
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
    $('camera-mode-label').textContent = '拖动环绕 · 滚轮缩放';
    updateHint();
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
    portalItems = items.filter(item => {
      if (!item?.id || !byId.has(item.target) || knownIds.has(item.id)) return false;
      knownIds.add(item.id);
      return true;
    });
    portalButtons.clear();
    nodes.portalLayer.replaceChildren();
    nodes.neighbors.replaceChildren();
    if (portalItems.length) nodes.neighbors.append(textSpan('', '沿路去'));
    for (const item of portalItems) {
      const title = item.title || byId.get(item.target).title;
      const activate = () => visit(item.target, {viaPortal:!item.direct});
      const portal = document.createElement('button');
      portal.type = 'button';
      portal.className = 'portal-button';
      portal.dataset.portal = item.id;
      portal.dataset.testid = `portal-${item.id}`;
      portal.setAttribute('aria-label', `${item.direct?'进入':'沿路牌前往'}${title}`);
      if(item.direct)portal.classList.add('island-marker');
      portal.append(textSpan('', title), icon('arrow'));
      portal.hidden = true;
      portal.addEventListener('click', activate);
      portalButtons.set(item.id, portal);
      nodes.portalLayer.append(portal);
      const neighbor = document.createElement('button');
      neighbor.type = 'button';
      neighbor.className = 'neighbor-link';
      neighbor.dataset.testid = `neighbor-${item.id}`;
      neighbor.setAttribute('aria-label', `沿路牌前往${title}`);
      neighbor.append(textSpan('', title), icon('arrow'));
      neighbor.addEventListener('click', activate);
      nodes.neighbors.append(neighbor);
    }
    nodes.neighbors.hidden = currentId === null || currentId==='island' || portalItems.length === 0;
  }

  function updatePortals(projected = []) {
    const updated = new Set();
    for (const point of projected) {
      const button = portalButtons.get(point.id);
      if (!button) continue;
      updated.add(point.id);
      const visible = Boolean(point.visible) && Number.isFinite(point.x) && Number.isFinite(point.y);
      button.hidden = !visible;
      if (visible) {
        button.style.left = `${point.x}px`;
        button.style.top = `${point.y}px`;
      }
    }
    for (const [id, button] of portalButtons) if (!updated.has(id)) button.hidden = true;
  }

  function restoreFocus(invoker) {
    if (invoker?.isConnected && !invoker.disabled && invoker.getClientRects().length) invoker.focus({preventScroll:true});
  }

  function showError(text) {
    setLoading(true, text);
    nodes.theatre.setAttribute('aria-busy', 'false');
    $('island-button').disabled = false;
  }

  function closeHelp() {
    if (!nodes.helpDialog.open) return;
    nodes.helpDialog.close();
    restoreFocus(helpInvoker);
  }

  function isBackdropClick(event, dialog) {
    if (event.target !== dialog) return false;
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }

  function toast(text) {
    clearTimeout(toastTimer);
    nodes.toast.textContent = text;
    nodes.toast.hidden = !text;
    if (text) toastTimer = setTimeout(() => { nodes.toast.hidden = true; }, 3800);
  }

  $('brand-home').addEventListener('click', event => { event.preventDefault(); handlers.onIsland?.(); });
  $('island-button').addEventListener('click',()=>handlers.onIsland?.());
  nodes.sound.addEventListener('click', () => handlers.onSound?.());
  $('reset-button').addEventListener('click', () => handlers.onReset?.());
  $('fullscreen-button').addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await nodes.theatre.requestFullscreen();}catch{toast('当前浏览器暂不支持全屏，可以继续在此游览。');}
  });
  $('help-button').addEventListener('click', () => {
    helpInvoker = document.activeElement;
    if (!nodes.helpDialog.open) nodes.helpDialog.showModal();
  });
  $('help-close').addEventListener('click', closeHelp);
  $('help-start').addEventListener('click', closeHelp);
  nodes.helpDialog.addEventListener('cancel', event => { event.preventDefault(); closeHelp(); });
  nodes.helpDialog.addEventListener('click', event => {
    if (isBackdropClick(event, nodes.helpDialog)) closeHelp();
  });
  setView('classic');
  setSound(false);
  return {
    showScene, setLoading, setVisited, toast, setView, setSound,
    setPortals, updatePortals, setLocationProgress,
    showError,
  };
}
