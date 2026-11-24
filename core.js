/* Bé chơi nào — phần lõi: cài đặt, âm thanh, giọng nói, hiệu ứng, tiện ích */
(function () {
  'use strict';
  const BE = window.BE = { GAMES: [], DATA: {} };

  const $ = (s, r = document) => r.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  Object.assign(BE, { $, rand, pick, shuffle });

  /* ---------- Cài đặt (lưu trong máy) ---------- */
  const DEF = { volume: 0.8, voice: true, lang: 'en', timer: 10 };
  const S = BE.S = Object.assign({}, DEF);
  try { Object.assign(S, JSON.parse(localStorage.getItem('littletalk-v1') || '{}')); } catch (e) { }
  BE.save = () => { try { localStorage.setItem('littletalk-v1', JSON.stringify(S)); } catch (e) { } };

  /* ---------- Âm thanh: tự tổng hợp bằng WebAudio, không cần tệp ---------- */
  const Snd = BE.Snd = (function () {
    let ctx = null, master = null, noise = null;
    function init() {
      if (ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try { ctx = new AC(); } catch (e) { return false; }
      master = ctx.createGain(); master.gain.value = S.volume;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    }
    function unlock() {
      if (!init()) return;
      if (ctx.state !== 'running') ctx.resume();
      
    }
    function vol(v) { if (master) master.gain.value = v; }
    function tone(f, o = {}) {
      if (!ctx || ctx.state !== 'running') return;
      const t = ctx.currentTime + (o.at || 0), dur = o.dur || 0.4;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(f, t);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.vol == null ? 0.3 : o.vol, t + (o.att || 0.01));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(master);
      osc.start(t); osc.stop(t + dur + 0.05);
    }
    function hiss(o = {}) {
      if (!ctx || ctx.state !== 'running') return;
      const t = ctx.currentTime + (o.at || 0), dur = o.dur || 0.2;
      const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true;
      const fl = ctx.createBiquadFilter(); fl.type = o.ft || 'bandpass';
      fl.frequency.setValueAtTime(o.f || 1000, t);
      if (o.to) fl.frequency.exponentialRampToValueAtTime(o.to, t + dur);
      fl.Q.value = o.q || 1;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.vol == null ? 0.3 : o.vol, t + (o.att || 0.01));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(fl); fl.connect(g); g.connect(master);
      src.start(t); src.stop(t + dur + 0.05);
    }
    // Giọng tổng hợp: sóng răng cưa (dây thanh) đi qua các bộ lọc "formant" (khoang miệng)
    // o.pts: đường cao độ [[0..1 theo thời gian, Hz]], o.fm: các formant (Hz hoặc [từ,đến]), o.vib: [tần số, độ sâu]
    function voc(o) {
      if (!ctx || ctx.state !== 'running') return;
      const t = ctx.currentTime + (o.at || 0), dur = o.dur;
      const osc = ctx.createOscillator(); osc.type = o.type || 'sawtooth';
      o.pts.forEach((p, i) => { const tt = t + p[0] * dur; if (i) osc.frequency.linearRampToValueAtTime(p[1], tt); else osc.frequency.setValueAtTime(p[1], tt); });
      if (o.vib) {
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = o.vib[0]; lg.gain.value = o.vib[1];
        lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(t + dur + 0.1);
      }
      const g = ctx.createGain(), v = o.vol == null ? 0.4 : o.vol;
      const att = Math.min(o.att || 0.03, dur * 0.3), rel = dur * 0.3;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + att);
      g.gain.setValueAtTime(v, t + dur - rel); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      const mix = ctx.createGain(); mix.gain.value = o.boost || 5;
      if (o.fm) o.fm.forEach(f => {
        const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = o.q || 5;
        b.frequency.setValueAtTime(Array.isArray(f) ? f[0] : f, t);
        if (Array.isArray(f)) b.frequency.linearRampToValueAtTime(f[1], t + dur);
        osc.connect(b); b.connect(mix);
      }); else osc.connect(mix);
      mix.connect(g); g.connect(master);
      osc.start(t); osc.stop(t + dur + 0.05);
    }
    // Tiếng kêu từng con vật (tự tổng hợp). Mỗi hàm trả về độ dài (giây).
    const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
    const api = {
      unlock, vol, tone, hiss, voc, PENTA,
      marimba(f) { tone(f, { dur: 0.9, vol: 0.35, att: 0.004 }); tone(f * 4, { dur: 0.25, vol: 0.1, att: 0.002 }); tone(f * 2, { dur: 0.5, vol: 0.08 }); },
      pop(i) { const f = PENTA[(i == null ? Math.floor(Math.random() * PENTA.length) : i) % PENTA.length]; tone(f, { dur: 0.2, vol: 0.3, to: f * 1.5 }); hiss({ f: 2600, to: 800, dur: 0.1, vol: 0.22, q: 0.8 }); },
      ding(f) { f = f || 880; tone(f, { dur: 0.7, vol: 0.3 }); tone(f * 2.01, { dur: 0.3, vol: 0.1 }); },
      boing() { tone(260, { dur: 0.35, to: 520, type: 'triangle', vol: 0.3 }); tone(520, { at: 0.17, dur: 0.3, to: 260, type: 'triangle', vol: 0.2 }); },
      cheer() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, { at: i * 0.09, dur: 0.4, type: 'triangle', vol: 0.26 })); },
      oops() { tone(330, { dur: 0.22, to: 250, vol: 0.14 }); },
      munch() { for (let i = 0; i < 3; i++) { hiss({ f: 900, to: 300, dur: 0.09, at: i * 0.17, vol: 0.4, q: 2 }); tone(120, { at: i * 0.17, dur: 0.08, vol: 0.2 }); } },
      whoosh() { hiss({ f: 300, to: 2500, dur: 0.35, vol: 0.22, q: 0.7 }); },
      bell() { tone(988, { dur: 1.4, vol: 0.3 }); tone(988 * 2.76, { dur: 0.6, vol: 0.12 }); tone(988 * 5.4, { dur: 0.3, vol: 0.05 }); },
      drum() { tone(160, { dur: 0.3, to: 55, vol: 0.6 }); hiss({ f: 400, dur: 0.08, vol: 0.25, ft: 'lowpass' }); },
      horn() { tone(392, { dur: 0.18, type: 'square', vol: 0.1 }); tone(494, { at: 0.24, dur: 0.18, type: 'square', vol: 0.1 }); },
      click() { tone(1200, { dur: 0.05, vol: 0.18, type: 'square' }); },
      blip() { tone(660, { dur: 0.14, vol: 0.22, type: 'square' }); },
      rocket() { hiss({ f: 200, to: 1800, dur: 1.3, vol: 0.28, ft: 'lowpass' }); tone(80, { dur: 1.3, to: 300, type: 'sawtooth', vol: 0.08 }); },
      light(on) { on ? tone(700, { dur: 0.25, to: 1300, type: 'triangle', vol: 0.25 }) : tone(1000, { dur: 0.25, to: 450, type: 'triangle', vol: 0.2 }); },
      piano(f) { tone(f, { dur: 1.4, type: 'triangle', vol: .32, att: .006 }); tone(f * 2, { dur: .7, vol: .1, att: .004 }); tone(f * 3, { dur: .35, vol: .05, att: .003 }); },
      bells(f) { tone(f * 2, { dur: 1.6, vol: .22 }); tone(f * 2 * 2.76, { dur: .7, vol: .08 }); tone(f * 2 * 5.4, { dur: .3, vol: .04 }); },
      alarm() { for (let i = 0; i < 10; i++) tone(i % 2 ? 1700 : 2000, { at: i * .1, dur: .07, type: 'square', vol: .1 }); },
      squeak() { tone(1500, { dur: .09, to: 2600, vol: .35 }); tone(2000, { at: .1, dur: .12, to: 3000, vol: .3 }); },
      lullaby() { [392, 330, 262].forEach((f, i) => tone(f, { at: i * 0.5, dur: 1.2, vol: 0.2 })); }
    };
    return api;
  })();

  /* ---------- Giọng nói (trình duyệt tự đọc, không cần mạng khi máy đã có giọng) ---------- */
  const Voice = BE.Voice = (function () {
    let voices = [];
    const ok = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    function load() { try { voices = speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }
    if (ok) { load(); try { speechSynthesis.addEventListener('voiceschanged', load); } catch (e) { speechSynthesis.onvoiceschanged = load; } }
    function find(lang) {
      const p = lang === 'vi' ? 'vi' : 'en';
      const list = voices.filter(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith(p));
      return list.find(v => /female|linh|hoai|my|samantha|google/i.test(v.name)) || list[0] || null;
    }
    // say(text, o): o.lang 'en' | 'vi' (default en), o.rate. Returns a Promise that resolves when speech ends
    // (or after an estimated time, so a device with no voice never stalls a game).
    let token = 0;
    // Recorded voice: voice/index.json maps each line to an MP3 (made by tools/gen_voice.py). A line with no file falls back to the device voice.
    let files = {};
    const au = new Audio(); au.preload = 'auto';
    const keyOf = (text, o) => ((o && o.rate && o.rate < 0.7) ? 'slow|' : '') + text.trim().replace(/\.$/, '');
    try { fetch('voice/index.json').then(r => r.ok ? r.json() : {}).then(m => { files = m || {}; }).catch(() => { }); } catch (e) { }
    function unlock() {   // a tiny silent clip played inside a tap, so later lines may play from timers (needed on iPhone)
      try { au.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='; au.volume = 0; const p = au.play(); if (p && p.catch) p.catch(() => { }); } catch (e) { }
    }
    function playFile(id, fin) {
      try {
        au.onended = fin; au.onerror = fin;
        au.src = 'voice/' + id + '.mp3'; au.volume = Math.min(1, S.volume + 0.2);
        const p = au.play(); if (p && p.catch) p.catch(() => fin(true));
        return true;
      } catch (e) { return false; }
    }
    function say(text, o) {
      o = o || {};
      const my = ++token;
      return new Promise(res => {
        const est = Math.max(600, text.length * 85 + 350) / (o.rate || 0.8);
        let done = false;
        const fin = () => { if (!done) { done = true; res(); } };
        try { au.pause(); } catch (e) { }
        if (S.voice && text && files[keyOf(text, o)]) {
          let failed = false;
          if (playFile(files[keyOf(text, o)], err => { if (err === true) { failed = true; } fin(); })) { setTimeout(fin, est + 4000); return; }
        }
        if (!ok || !S.voice || !text) { setTimeout(fin, 200); return; }
        try {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          const lg = o.lang || 'en';
          u.lang = lg === 'vi' ? 'vi-VN' : 'en-US';
          const v = find(lg); if (v) u.voice = v;
          u.rate = o.rate || 0.8; u.pitch = 1.12; u.volume = Math.min(1, S.volume + 0.2);
          u.onend = fin; u.onerror = fin;
          speechSynthesis.speak(u);
          setTimeout(fin, est + 1500);
        } catch (e) { setTimeout(fin, 200); }
      }).then(() => my === token);
    }
    // Say several lines one after another, with a small pause. Stops if something else speaks in between.
    async function seq(lines, gap) {
      for (const l of lines) {
        const t = typeof l === 'string' ? { t: l } : l;
        const still = await say(t.t, t);
        if (!still) return false;
        await new Promise(r => setTimeout(r, gap == null ? 250 : gap));
      }
      return true;
    }
    function stop() { token++; try { au.pause(); } catch (e) { } if (ok) try { speechSynthesis.cancel(); } catch (e) { } }
    return { say, seq, stop, unlock, has: l => !!find(l), supported: ok, count: () => voices.length, recorded: () => Object.keys(files).length };
  })();

  /* ---------- Hiệu ứng pháo giấy / ngôi sao trên một lớp canvas ---------- */
  const FX = BE.FX = (function () {
    const cv = $('#fx'), c = cv.getContext('2d');
    let W = 0, H = 0, ps = [], running = false;
    const PAL = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc', '#f783ac'];
    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    addEventListener('resize', size); size();
    function star(x, y, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }
    function burst(x, y, o = {}) {
      const n = o.n || 16, cols = o.colors || PAL, em = o.emoji;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = rand(2, 7) * (o.power || 1);
        ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, life: 1, decay: rand(0.012, 0.022), s: rand(8, 16) * (o.size || 1), col: pick(cols), em: em ? pick(em) : null, shape: pick(['c', 's']), rot: rand(0, 6), vr: rand(-0.2, 0.2) });
      }
      if (!running) { running = true; requestAnimationFrame(frame); }
    }
    function frame() {
      c.clearRect(0, 0, W, H);
      ps = ps.filter(p => p.life > 0);
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.vx *= 0.99; p.life -= p.decay; p.rot += p.vr;
        c.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
        if (p.em) { c.font = (p.s * 2) + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.em, p.x, p.y); }
        else { c.fillStyle = p.col; if (p.shape === 's') star(p.x, p.y, p.s); else { c.beginPath(); c.arc(p.x, p.y, p.s * 0.6, 0, 7); c.fill(); } }
      }
      c.globalAlpha = 1;
      if (ps.length) requestAnimationFrame(frame); else { running = false; c.clearRect(0, 0, W, H); }
    }
    return { burst };
  })();

  /* ---------- Tiện ích ---------- */
  // Chia lưới n ô sao cho ô to nhất trong khung W x H
  BE.fit = function (n, W, H, g = 0.1, max = 280) {
    let best = { s: 0, cols: 1, rows: n };
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const s = Math.min(W / (cols + (cols - 1) * g), H / (rows + (rows - 1) * g));
      if (s > best.s) best = { s, cols, rows };
    }
    best.s = Math.max(40, Math.min(best.s, max)); best.gap = best.s * g;
    return best;
  };

  BE.floatText = function (root, text, x, y, cls = '') {
    const s = document.createElement('span');
    s.className = 'ftext ' + cls; s.textContent = text;
    s.style.left = x + 'px'; s.style.top = y + 'px';
    root.appendChild(s);
    const w = s.offsetWidth;   // keep the label fully on screen
    s.style.left = Math.max(w / 2 + 8, Math.min(innerWidth - w / 2 - 8, x)) + 'px';
    setTimeout(() => s.remove(), 1400);
  };

  // Kéo thả: chạm nhẹ (không di chuyển) được coi là "chạm", để vật tự bay tới đích
  BE.draggable = function (el, h) {
    let id = null, sx = 0, sy = 0, moved = false;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', e => {
      if (id !== null) return;
      id = e.pointerId; sx = e.clientX; sy = e.clientY; moved = false;
      try { el.setPointerCapture(id); } catch (_) { }
      h.onStart && h.onStart(e); e.preventDefault();
    });
    el.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > (h.slop || 12)) moved = true;
      if (moved) h.onMove && h.onMove(dx, dy, e);
    });
    const end = (e, cancel) => {
      if (e.pointerId !== id) return;
      id = null;
      try { el.releasePointerCapture(e.pointerId); } catch (_) { }
      if (moved) h.onDrop && h.onDrop(e, cancel); else h.onTap && h.onTap(e);
    };
    el.addEventListener('pointerup', e => end(e, false));
    el.addEventListener('pointercancel', e => end(e, true));
  };

  // Hình dạng SVG dùng chung (xếp hình)
  BE.SHAPES = {
    circle: '<circle cx="50" cy="50" r="42"/>',
    square: '<rect x="9" y="9" width="82" height="82" rx="10"/>',
    triangle: '<polygon points="50,10 92,86 8,86" stroke-linejoin="round" stroke-width="8" stroke="currentColor"/>',
    star: '<polygon points="50,6 62,38 96,38 68,58 79,92 50,72 21,92 32,58 4,38 38,38" stroke-linejoin="round" stroke-width="5" stroke="currentColor"/>',
    heart: '<path d="M50 90 C8 60 4 30 24 17 C38 8 50 22 50 30 C50 22 62 8 76 17 C96 30 92 60 50 90Z"/>',
    diamond: '<polygon points="50,6 94,50 50,94 6,50" stroke-linejoin="round" stroke-width="6" stroke="currentColor"/>',
    oval: '<ellipse cx="50" cy="50" rx="45" ry="30"/>',
    hexagon: '<polygon points="29,12 71,12 94,50 71,88 29,88 6,50" stroke-linejoin="round" stroke-width="6" stroke="currentColor"/>',
    rectangle: '<rect x="6" y="24" width="88" height="52" rx="8"/>',
    plus: '<path d="M38 8h24v30h30v24H62v30H38V62H8V38h30z" stroke-linejoin="round" stroke-width="5" stroke="currentColor"/>'
  };

  /* ---------- Little Play 2: subjects, progress, adaptive level, prompts ---------- */
  // Each games file adds its own styles with BE.css(`...`)
  BE.css = text => { const s = document.createElement('style'); s.textContent = text; document.head.appendChild(s); };
  const PRAISE = ['Great job!', 'You did it!', 'Awesome!', 'Well done!', 'Super!', 'Yes!', 'Wow!'];
  // A small celebration: cheer, confetti, a few kind words (spoken only when o.say is true)
  BE.win = function (root, x, y, o) {
    o = o || {};
    Snd.cheer(); FX.burst(x == null ? innerWidth / 2 : x, y == null ? innerHeight / 2 : y, { n: o.n || 26 });
    const p = pick(PRAISE);
    if (o.text !== false) BE.floatText(root, p, innerWidth / 2, innerHeight * 0.3, 'big');
    if (o.say) setTimeout(() => Voice.say(p), 150);
    return p;
  };
  // Instruction banner at the top; tap the speaker to hear it again.
  // text = what is shown, o.say = what is spoken (default: the same text), o.silent = show only
  BE.prompt = function (root, text, o) {
    o = o || {};
    let el = root.querySelector('.prompt');
    if (!el) {
      el = document.createElement('div'); el.className = 'prompt';
      el.innerHTML = '<span class="pt"></span><button class="say" aria-label="Hear it again">🔊</button>';
      root.appendChild(el);
      el.querySelector('.say').addEventListener('pointerup', () => Voice.say(el.dataset.t));
    }
    el.dataset.t = o.say || text; el.querySelector('.pt').textContent = text;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    if (!o.silent) setTimeout(() => Voice.say(el.dataset.t), 250);
    return el;
  };

  /* ---------- Pictures: emoji are shown as detailed 3D pictures (img/*.webp) once they have loaded ---------- */
  // The games keep using plain emoji text. Every emoji that has a picture is wrapped in <span class="eimg"> with the picture as its
  // background, and the emoji stays in the span as text (so the page still works if a picture is missing).
  BE.pics = (function () {
    const ok = {};            // emoji -> picture file, only for pictures that have loaded
    let re = null, map = {};
    const skip = n => { for (let p = n.parentNode; p; p = p.parentNode) { if (p.nodeType === 1 && (p.classList.contains('eimg') || p.tagName === 'SCRIPT' || p.tagName === 'STYLE' || p.tagName === 'TEXTAREA')) return true; } return false; };
    function wrapText(n) {
      if (!re || !n.nodeValue || !n.parentNode || skip(n)) return;
      re.lastIndex = 0; const s = n.nodeValue; if (!re.test(s)) return; re.lastIndex = 0;
      const frag = document.createDocumentFragment(); let last = 0, m;
      while ((m = re.exec(s))) {
        if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
        const sp = document.createElement('span'); sp.className = 'eimg'; sp.textContent = m[0]; sp.style.backgroundImage = `url(img/${ok[m[1]]})`; frag.appendChild(sp); last = m.index + m[0].length;
      }
      if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
      if (n.parentNode) n.parentNode.replaceChild(frag, n);
    }
    function wrapAll(root) {
      if (!re) return;
      if (root.nodeType === 3) { wrapText(root); return; }
      if (root.nodeType !== 1 || root.classList.contains('eimg')) return;
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = []; let x; while ((x = w.nextNode())) list.push(x);
      list.forEach(wrapText);
    }
    function start() {
      fetch('img/index.json').then(r => r.json()).then(m => {
        map = m; const keys = Object.keys(m); let left = keys.length;
        const done = () => {
          if (--left > 0) return;
          const ks = Object.keys(ok).sort((a, b) => b.length - a.length);   // emoji contain no regex special characters
          if (!ks.length) return; re = new RegExp('(' + ks.join('|') + ')\uFE0F?', 'g');
          wrapAll(document.body);
          new MutationObserver(recs => recs.forEach(r => { if (r.type === 'characterData') wrapText(r.target); else r.addedNodes.forEach(wrapAll); }))
            .observe(document.getElementById('app'), { childList: true, subtree: true, characterData: true });
        };
        keys.forEach(k => { const im = new Image(); im.onload = () => { ok[k] = m[k]; done(); }; im.onerror = done; im.src = 'img/' + m[k]; });
      }).catch(() => { });
    }
    return { start };
  })();
  BE.css('.eimg { display: inline-block; width: 1.12em; height: 1.12em; line-height: 1; vertical-align: -.2em; overflow: hidden; color: transparent; white-space: nowrap; text-shadow: none; background: center / contain no-repeat; -webkit-text-fill-color: transparent; }');
  document.addEventListener('DOMContentLoaded', BE.pics.start);
})();
