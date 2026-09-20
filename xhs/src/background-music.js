import { BACKGROUND_MUSIC_BASE64, BACKGROUND_MUSIC_INFO } from './background-music-data.js';

// One recording and one looping source survive scene changes. Audio starts only
// after a user gesture; pausing the context also preserves the musical position.
export function createBackgroundMusic(options = {}) {
  const buttonId = options.buttonId || 'sound-button';
  const volume = Math.max(0, Math.min(1, options.volume === undefined ? 0.55 : options.volume));
  let context = null, gain = null, buffer = null, source = null, decoding = null;
  let enabled = true, activated = false, disposed = false, suspendedForPage = false;
  let requestId = 0, pauseTimer = null, startedAt = 0, sourceStarts = 0, lastPlaying = null;

  function isHidden() { return Boolean(document.hidden || suspendedForPage); }
  function isPlaying() {
    return Boolean(!disposed && enabled && source && context && context.state === 'running' && !isHidden());
  }
  function publish() {
    const playing = isPlaying();
    if (playing !== lastPlaying) {
      lastPlaying = playing;
      if (typeof options.onStateChange === 'function') options.onStateChange(playing);
    }
  }
  function clearPause() {
    if (pauseTimer !== null) { clearTimeout(pauseTimer); pauseTimer = null; }
  }
  function ensureContext() {
    if (context && context.state !== 'closed') return;
    const Constructor = window.AudioContext || window.webkitAudioContext;
    if (!Constructor) throw new Error('AudioContext unavailable');
    context = new Constructor();
    gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(context.destination);
    context.onstatechange = publish;
    source = null;
  }
  function decode() {
    if (buffer) return Promise.resolve(buffer);
    if (decoding) return decoding;
    decoding = new Promise(function(resolve, reject) {
      try {
        const binary = window.atob(BACKGROUND_MUSIC_BASE64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        // Callbacks support older WebKit; consume a returned Promise as well.
        const result = context.decodeAudioData(bytes.buffer, resolve, reject);
        if (result && typeof result.then === 'function') result.then(resolve, reject);
      } catch (error) { reject(error); }
    }).then(function(decoded) {
      if (!decoded || !decoded.length || !(decoded.duration > 0)) throw new Error('Empty background recording');
      buffer = decoded;
      return decoded;
    });
    return decoding;
  }
  function fail(error, token) {
    if (disposed || token !== requestId) return;
    enabled = false;
    decoding = null;
    pause();
    if (typeof options.onError === 'function') options.onError(error);
  }
  function play() {
    if (disposed || !enabled || !activated || isHidden()) return;
    clearPause();
    const token = ++requestId;
    try {
      ensureContext();
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setValueAtTime(0, context.currentTime);
      // Resume synchronously inside the gesture, before asynchronous decoding.
      const resumed = context.state === 'running' ? Promise.resolve() : context.resume();
      Promise.all([Promise.resolve(resumed), decode()]).then(function() {
        if (disposed || token !== requestId || !enabled || isHidden()) return;
        if (!source) {
          source = context.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          source.connect(gain);
          startedAt = context.currentTime;
          source.start();
          sourceStarts++;
        }
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(volume, context.currentTime + 0.035);
        publish();
      }).catch(function(error) { fail(error, token); });
    } catch (error) { fail(error, token); }
  }
  function pause() {
    clearPause();
    const token = ++requestId;
    publish();
    if (!context || context.state === 'closed') return;
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, context.currentTime);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.03);
    pauseTimer = setTimeout(function() {
      pauseTimer = null;
      if (disposed || token !== requestId || (enabled && !isHidden())) return;
      const result = context.suspend();
      if (result && typeof result.catch === 'function') result.catch(function() {});
    }, 40);
  }
  function toggle() {
    if (disposed) return;
    enabled = activated ? !enabled : true;
    activated = true;
    if (enabled) play(); else pause();
  }
  function onGesture(event) {
    if (disposed || !enabled || event.isTrusted === false || event.repeat) return;
    let node = event.target;
    while (node && node !== document) {
      if (node.id === buttonId) return; // The button's own click is the only toggle.
      node = node.parentNode;
    }
    if (!activated || !context || context.state !== 'running') {
      activated = true;
      play();
    }
  }
  function onVisibility() { if (isHidden()) pause(); else if (enabled && activated) play(); }
  function onPageHide() { suspendedForPage = true; pause(); }
  function onPageShow() { suspendedForPage = false; onVisibility(); }
  const gestureEvents = ['pointerup', 'touchend', 'click', 'keydown'];
  gestureEvents.forEach(function(type) { document.addEventListener(type, onGesture, true); });
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  publish();

  return {
    toggle: toggle,
    getState: function() {
      const duration = buffer ? buffer.duration : BACKGROUND_MUSIC_INFO.durationSeconds;
      return {
        enabled: enabled, activated: activated, playing: isPlaying(),
        contextState: context ? context.state : 'not-created', loaded: Boolean(buffer),
        duration: duration, position: source && duration ? Math.max(0, context.currentTime - startedAt) % duration : 0,
        loop: source ? source.loop : true, sourceStarts: sourceStarts, volume: volume
      };
    },
    dispose: function() {
      if (disposed) return;
      disposed = true; enabled = false; ++requestId; clearPause();
      gestureEvents.forEach(function(type) { document.removeEventListener(type, onGesture, true); });
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      if (source) { source.stop(); source.disconnect(); source = null; }
      if (gain) gain.disconnect();
      if (context) {
        context.onstatechange = null;
        const result = context.close();
        if (result && typeof result.catch === 'function') result.catch(function() {});
      }
      publish();
    }
  };
}
