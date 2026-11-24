/* Little Talk: app shell: home, map of worlds, the daily adventure, parent area, play timer */
(function () {
  'use strict';
  const { $, S, Snd, Voice, M, ACT, shuffle, pick } = BE;
  const menu = $('#menu'), stage = $('#stage'), gameEl = $('#game'), grid = $('#grid'), wrap = $('#gridwrap');
  const panel = $('#panel'), sheet = $('#sheet'), bye = $('#bye'), menuBack = $('#menuBack'), menuTitle = $('#menuTitle'), levelbar = $('#levelbar');
  let curApi = null, playSec = 0, view = 'home', mapLevel = S.level, runId = 0;
  S.plang = S.plang || 'vi';
  const tr = (en, vi) => S.plang === 'vi' ? vi : en;

  let voiceUnlocked = false;
  ['touchend', 'click', 'pointerup', 'keydown'].forEach(ev => document.addEventListener(ev, () => { Snd.unlock(); if (!voiceUnlocked) { voiceUnlocked = true; Voice.unlock(); } }, { capture: true, passive: true }));
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault());
  document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

  function makeApi(root) {
    const cl = [];
    return {
      root, S,
      on(t, ev, fn, opt) { t.addEventListener(ev, fn, opt); cl.push(() => t.removeEventListener(ev, fn, opt)); },
      timeout(fn, ms) { const h = setTimeout(fn, ms); cl.push(() => clearTimeout(h)); return h; },
      cleanup() { cl.forEach(f => f()); cl.length = 0; }
    };
  }
  function onTap(el, fn) {
    let down = false;
    el.addEventListener('pointerdown', () => { down = true; });
    el.addEventListener('pointerup', e => { if (down) { down = false; fn(e); } });
    ['pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, () => { down = false; }));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } });
  }
  const starsFor = w => { const p = M.progress(w); return p >= 0.9 ? 3 : p >= 0.6 ? 2 : p > 0 ? 1 : 0; };

  /* ---------- Home ---------- */
  function renderMenu() {
    grid.innerHTML = ''; grid.removeAttribute('style'); grid.className = view;
    levelbar.classList.toggle('hidden', view !== 'map'); menuBack.classList.toggle('hidden', view === 'home');
    const open = BE.openMissions().length > 0;
    $('#mbadge').classList.toggle('hidden', !(open && view === 'home'));
    if (view === 'home') {
      menuTitle.textContent = 'Little Play English';
      const L = BE.LEVELS[S.level - 1], t = M.totals();
      const a = document.createElement('button'); a.className = 'hbtn start';
      a.innerHTML = `<span class="ic">🌟</span><span class="tx"><span class="lb">Today's adventure</span><span class="sub">Level ${L.n} · ${L.name}</span></span>`;
      onTap(a, () => { Snd.click(); startDaily(); });
      const b = document.createElement('button'); b.className = 'hbtn play';
      b.innerHTML = `<span class="ic">🎈</span><span class="tx"><span class="lb">Play</span><span class="sub">${BE.WORLDS.length} worlds</span></span>`;
      onTap(b, () => { Snd.click(); Voice.say('Play!'); view = 'map'; mapLevel = S.level; renderMenu(); });
      grid.appendChild(a); grid.appendChild(b);
      const st = document.createElement('div'); st.className = 'hstat'; st.textContent = `⭐ ${S.stickers}   ·   ${t.known} words known`;
      grid.appendChild(st);
    } else {
      menuTitle.textContent = 'Choose a world';
      levelbar.innerHTML = '';
      BE.LEVELS.forEach(L => {
        const b = document.createElement('button'); b.className = 'lvl' + (L.n === mapLevel ? ' on' : ''); b.style.setProperty('--c', L.color);
        b.innerHTML = `<b>${L.n}</b><span>${L.age} yrs</span>`;
        onTap(b, () => { Snd.click(); mapLevel = L.n; renderMenu(); });
        levelbar.appendChild(b);
      });
      const L = BE.LEVELS[mapLevel - 1];
      menuTitle.textContent = `Level ${L.n} · ${L.name}`;
      BE.WORLDS.filter(w => w.level === mapLevel).forEach(w => {
        const s = starsFor(w);
        const b = document.createElement('button'); b.className = 'card'; b.style.setProperty('--c', w.color);
        b.innerHTML = `<span class="ic">${w.icon}</span><span class="lb">${w.name}</span><span class="stars">${'★'.repeat(s)}${'☆'.repeat(3 - s)}</span>`;
        onTap(b, () => startWorld(w));
        grid.appendChild(b);
      });
    }
    layoutMenu();
  }
  onTap(menuBack, () => { Snd.whoosh(); view = 'home'; renderMenu(); });
  function layoutMenu() {
    if (view === 'home') return;
    const n = grid.children.length; if (!n) return;
    const f = BE.fit(n, wrap.clientWidth, wrap.clientHeight, 0.12, 210);
    grid.style.setProperty('--s', f.s + 'px');
    grid.style.width = (f.cols * f.s + (f.cols - 1) * f.gap + 1) + 'px';
    grid.style.gap = f.gap + 'px';
  }
  addEventListener('resize', layoutMenu);

  /* ---------- Stage ---------- */
  function openStage(bg) {
    exitGame(true);
    menu.classList.add('hidden'); stage.classList.remove('hidden');
    gameEl.innerHTML = ''; gameEl.style.background = bg || 'linear-gradient(#fff3c4,#ffe0ef)';
    const root = document.createElement('div'); root.className = 'run'; gameEl.appendChild(root);
    curApi = makeApi(root); runId++;
    $('#tipBtn').classList.add('hidden'); setSteps(0, 0);
    return curApi;
  }
  function exitGame(silent) {
    runId++;
    if (curApi) { curApi.cleanup(); curApi = null; }
    gameEl.innerHTML = ''; Voice.stop();
    if (!silent) { stage.classList.add('hidden'); menu.classList.remove('hidden'); renderMenu(); }
  }
  onTap($('#home'), () => { Snd.whoosh(); exitGame(false); });
  function setSteps(i, n) {
    const s = $('#steps'); s.innerHTML = '';
    for (let k = 0; k < n; k++) { const d = document.createElement('i'); d.className = k < i ? 'done' : k === i ? 'now' : ''; s.appendChild(d); }
  }

  /* ---------- "Play together" card ---------- */
  let tipKey = null;
  BE.setTip = key => { tipKey = key; $('#tipBtn').classList.remove('hidden'); };
  onTap($('#tipBtn'), () => {
    const t = BE.TIPS[tipKey]; if (!t) return;
    $('#tipEn').textContent = t.en; $('#tipVi').textContent = t.vi; $('#tip').classList.remove('hidden');
  });
  $('#tipClose').addEventListener('click', () => $('#tip').classList.add('hidden'));

  /* ---------- Activities that depend on the kind of world ---------- */
  function learn(api, w, items) {
    switch (w.kind) {
      case 'actions': return ACT.move(api, { items });
      case 'syllables': return ACT.clap(api, { items, demoFirst: true });
      case 'story': return ACT.story(api, { items });
      default: return ACT.meet(api, { items });
    }
  }
  const FIND_AFTER_LEARN = k => !['actions', 'syllables', 'story'].includes(k);

  /* ---------- Free play in one world ---------- */
  async function startWorld(w) {
    Snd.unlock(); Snd.click();
    const api = openStage(w.color);
    const my = runId;
    const need = w.items.slice().sort((a, b) => BE.need(b.id) - BE.need(a.id));
    const n = w.kind === 'story' ? 1 : w.kind === 'position' ? 3 : 3;
    if (w.kind === 'actions' || w.kind === 'syllables' || w.kind === 'story') {
      while (my === runId) await learn(api, w, shuffle(w.items.slice()).slice(0, w.kind === 'story' ? 1 : 3));
      return;
    }
    await learn(api, w, need.slice(0, n));
    if (my !== runId) return;
    let last = null;
    await ACT.find(api, { endless: true, pickNext() {
      const c = need.slice().sort((a, b) => BE.need(b.id) - BE.need(a.id)).filter(i => i !== last).slice(0, 4);
      last = pick(c); return last;
    } });
  }

  /* ---------- Today's adventure ---------- */
  async function startDaily() {
    Snd.unlock(); Snd.click();
    const p = BE.plan(), w = p.world;
    const api = openStage(w.color); const my = runId;
    const fresh = p.fresh.length ? p.fresh : w.items.slice().sort((a, b) => BE.need(b.id) - BE.need(a.id)).slice(0, 3);
    const rev = p.review;
    const steps = ['Hello', 'Learn', 'Practice', 'Move', 'Bonus', 'Bye'];
    let si = 0; const next = () => { if (my === runId) setSteps(++si, steps.length); };
    setSteps(0, steps.length);
    if (p.up) Voice.say('New level!');
    await ACT.hello(api); if (my !== runId) return; next();
    await learn(api, w, fresh); if (my !== runId) return; next();
    // practice: the new things, the old things that are due, then the new things once more
    const t1 = FIND_AFTER_LEARN(w.kind) ? fresh : [];
    const targets = shuffle(t1.concat(rev)).concat(shuffle(t1));
    if (targets.length) { await ACT.find(api, { targets }); if (my !== runId) return; }
    next();
    // move break
    const br = shuffle(BE.BREAKS.slice()).slice(0, 2).map(([wd, cmd, e]) => ({ w: wd, cmd, e }));
    await ACT.move(api, { items: br, grade: false }); if (my !== runId) return; next();
    // bonus: something from another world the child already knows a little
    const known = Object.values(BE.ITEMS).filter(i => i.wid !== w.id && M.box(i.id) >= 1 && !['story', 'actions', 'syllables'].includes(BE.world(i.wid).kind));
    if (known.length) { await ACT.find(api, { targets: known.sort((a, b) => BE.need(b.id) - BE.need(a.id)).slice(0, 3) }); if (my !== runId) return; }
    next();
    await goodbye(api, fresh.concat(rev).slice(0, 3), p, my);
  }
  async function goodbye(api, items, plan, my) {
    const root = api.root; root.innerHTML = '';
    const mm = BE.addMission(items.filter(Boolean));
    const lis = items.map(it => { const t = BE.missionText(it); return `<li><b>${t.en}</b><i>${t.vi}</i></li>`; }).join('');
    const e = ['🏅', '🌟', '🎖️', '🏆', '🎈'][S.stickers % 5];
    root.innerHTML = `<div class="bye-day"><div class="stk">${e}</div><div class="bw">${plan.up ? 'New level!' : 'Great job today!'}</div>
      <div class="mission"><div class="mt">${tr("👪 Tonight's mission · 1 minute, no screen", '👪 Nhiệm vụ tối nay · 1 phút, không màn hình')}</div><ul>${lis}</ul></div></div>`;
    Snd.cheer(); FX_burst();
    Voice.seq(['Great job today!', 'Bye-bye! See you tomorrow.'], 300);
    await new Promise(done => api.timeout(() => {
      const nb = document.createElement('div'); nb.className = 'next-btn'; nb.textContent = '🏠'; root.appendChild(nb);
      nb.addEventListener('click', () => { Snd.whoosh(); done(); });
    }, 1800));
    if (my !== runId) return;
    exitGame(false);
  }
  function FX_burst() { for (let i = 0; i < 3; i++) setTimeout(() => BE.FX.burst(innerWidth * (0.25 + 0.25 * i), innerHeight * 0.35, { n: 22 }), i * 250); }

  /* ---------- Hold to open the parent area ---------- */
  function gate(btn, ms, cb) {
    let t = null;
    btn.style.setProperty('--ms', ms + 'ms');
    btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.classList.add('holding'); t = setTimeout(() => { btn.classList.remove('holding'); t = null; cb(); }, ms); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => btn.addEventListener(ev, () => { clearTimeout(t); t = null; btn.classList.remove('holding'); }));
  }
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const words = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  let adultOk = null, adultTarget = 0, adultTyped = '';
  function adultFresh() { adultTarget = 21 + Math.floor(Math.random() * 78); adultTyped = ''; $('#adultWord').textContent = words(adultTarget); showTyped(); }
  function showTyped() { $('#adultDisp').textContent = (adultTyped + '– –'.replace(/ /g, '').slice(0, 2 - adultTyped.length)).split('').join(' '); }
  function askAdult(ok) { adultOk = ok; adultFresh(); $('#adult').classList.remove('hidden'); }
  $('#adult').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const k = b.dataset.k, disp = $('#adultDisp');
    if (k === 'x') { $('#adult').classList.add('hidden'); adultOk = null; return; }
    if (k === 'b') { adultTyped = adultTyped.slice(0, -1); showTyped(); return; }
    if (adultTyped.length >= 2) return;
    adultTyped += k; showTyped();
    if (adultTyped.length === 2) {
      if (+adultTyped === adultTarget) { $('#adult').classList.add('hidden'); const f = adultOk; adultOk = null; f && f(); }
      else { disp.classList.remove('bad'); void disp.offsetWidth; disp.classList.add('bad'); setTimeout(() => { disp.classList.remove('bad'); adultFresh(); }, 450); }
    }
  });
  gate($('#gear'), 2000, () => askAdult(openPanel));
  gate($('#mbadge'), 2000, () => askAdult(openPanel));
  gate($('#byeResume'), 2000, () => askAdult(() => { playSec = 0; bye.classList.add('hidden'); }));

  /* ---------- Parent area ---------- */
  const seg = (key, vals) => `<div class="seg" data-key="${key}">${vals.map(([v, l]) => `<button data-v="${v}" class="${String(S[key]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  function openPanel() { renderPanel(); panel.classList.remove('hidden'); }
  function renderPanel() {
    const t = M.totals();
    const miss = BE.openMissions().slice(-2).reverse();
    const missHtml = miss.length ? miss.map(m => `<div class="mis"><div class="mdate">${new Date(m.t).toLocaleDateString()}</div>` + m.items.map(id => {
      const it = BE.ITEMS[id]; if (!it) return ''; const x = BE.missionText(it), done = m.done[id];
      return `<div class="mrow ${done ? 'ok' : ''}"><div><b>${x.en}</b><br><i>${x.vi}</i></div>${done ? '<span class="chk">✓</span>' : `<button class="btn sm" data-m="${m.id}" data-i="${id}">${tr('✓ My child did it', '✓ Bé làm được')}</button>`}</div>`;
    }).join('') + '</div>').join('') : `<p class="note">${tr('No mission waiting. After each daily adventure, a short real-life mission appears here.', 'Chưa có nhiệm vụ nào. Sau mỗi cuộc phiêu lưu hằng ngày, một nhiệm vụ ngắn ngoài đời sẽ hiện ở đây.')}</p>`;
    const lv = BE.LEVELS.map(L => { const p = Math.round(M.levelProgress(L.n) * 100); return `<div class="lvrow ${L.n === S.level ? 'cur' : ''}"><span class="ln">${L.n}</span><span class="lt"><b>${S.plang === 'vi' ? L.vi : L.name}</b> <small>${L.age} ${tr('yrs', 'tuổi')}</small><br><small>${S.plang === 'vi' ? L.goalVi : L.goal}</small></span><span class="bar"><i style="width:${p}%"></i></span><span class="pc">${p}%</span></div>`; }).join('');
    sheet.innerHTML = `
      <header><h2>${tr('For parents', 'Dành cho phụ huynh')}</h2>
        <div class="seg lang" data-key="plang"><button data-v="vi" class="${S.plang === 'vi' ? 'on' : ''}">VI</button><button data-v="en" class="${S.plang === 'en' ? 'on' : ''}">EN</button></div>
        <button id="panelClose" aria-label="Close">✕</button></header>
      <h3>${tr('Real-life missions', 'Nhiệm vụ ngoài đời')}</h3>${missHtml}
      <h3>${tr('Progress', 'Tiến bộ')}</h3>
      <p class="note">${tr(`${t.heard} things heard · ${t.known} recognised · ${t.solid} remembered over time (of ${t.all}) · ${S.stickers} adventures`, `Đã nghe ${t.heard} · nhận ra ${t.known} · nhớ lâu ${t.solid} (trên tổng ${t.all}) · ${S.stickers} cuộc phiêu lưu`)}</p>${lv}
      <div class="row"><span>${tr('Level for today\'s adventure', 'Bậc cho cuộc phiêu lưu hôm nay')}</span>${seg('level', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']])}</div>
      <p class="note">${tr('The level moves up by itself when 80% of its things are recognised. You can also set it by hand.', 'Bậc tự tăng khi bé nhận ra 80% nội dung của bậc đó. Bạn cũng có thể chỉnh tay.')}</p>
      <h3>${tr('Settings', 'Cài đặt')}</h3>
      <div class="row"><span>${tr('Volume', 'Âm lượng')}</span><input id="vol" type="range" min="0" max="100" value="${Math.round(S.volume * 100)}"></div>
      <div class="row"><span>${tr('Voice', 'Giọng đọc')}</span>${seg('voice', [[true, tr('On', 'Bật')], [false, tr('Off', 'Tắt')]])}</div>
      <div class="row"><span>${tr('Play timer', 'Hẹn giờ chơi')}</span>${seg('timer', [[0, tr('Off', 'Tắt')], [10, '10'], [15, '15'], [20, '20']])}</div>
      <div class="row"><button id="testVoice" class="btn">🔊 ${tr('Test voice', 'Thử giọng')}</button><button id="resetTimer" class="btn">⏱ ${tr('Reset play time', 'Đặt lại giờ chơi')}</button><button id="fsBtn" class="btn">⛶ ${tr('Full screen', 'Toàn màn hình')}</button></div>
      <p class="note">${!Voice.supported ? tr("This browser can't read text aloud.", 'Trình duyệt này không đọc được chữ thành tiếng.') : Voice.has('en') ? tr('An English voice is available on this device.', 'Máy này có giọng đọc tiếng Anh.') : tr('No English voice was found. On Android: Settings → Language → Text-to-speech. On iPhone: Settings → Accessibility → Spoken Content → Voices.', 'Chưa thấy giọng tiếng Anh. Android: Cài đặt → Ngôn ngữ → Chuyển văn bản thành giọng nói. iPhone: Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói.')}</p>
      <details><summary>${tr('How Little Play English teaches', 'Little Play English dạy như thế nào')}</summary><ul class="why">
        <li><b>${tr('A person is the teacher, the screen is the bridge.', 'Người thật là thầy, màn hình là cây cầu.')}</b> ${tr('Research on babies learning sounds of a new language found live interaction works and passive screen listening does not. So every activity has a 👪 card with something to say together, and every adventure ends with a one-minute mission away from the screen.', 'Nghiên cứu về trẻ nhỏ học âm của ngôn ngữ mới cho thấy tương tác với người thật có hiệu quả còn nghe thụ động qua màn hình thì không. Vì vậy mỗi hoạt động có thẻ 👪 gợi ý câu để cùng nói, và mỗi cuộc phiêu lưu kết thúc bằng một nhiệm vụ 1 phút ngoài màn hình.')}</li>
        <li><b>${tr('Five levels, one ladder.', 'Năm bậc, một chiếc thang.')}</b> ${tr('Hear and touch → point and move → short sentences → syllables, rhymes and letters → reading and stories.', 'Nghe và chạm → chỉ và làm → câu ngắn → âm tiết, vần, chữ cái → đọc và truyện.')}</li>
        <li><b>${tr('Words come back.', 'Từ cũ quay lại.')}</b> ${tr('Each thing is tracked in 5 steps. Right first time moves it up; right again on another day moves it up; a wrong answer moves it down and brings it back soon. A grown-up confirming it in real life also moves it up.', 'Mỗi từ được theo dõi qua 5 bậc. Đúng ngay lần đầu thì lên bậc; đúng lại vào một ngày khác thì lên nữa; sai thì xuống một bậc và sớm quay lại. Cha mẹ xác nhận bé làm được ngoài đời cũng cộng một bậc.')}</li>
        <li><b>${tr('No losing, no clock, no ads.', 'Không thua, không đồng hồ, không quảng cáo.')}</b> ${tr('A wrong answer only wiggles. After a few tries the right answer glows.', 'Chọn sai chỉ lắc nhẹ. Sau vài lần thử, đáp án đúng sẽ sáng lên.')}</li>
        <li><b>${tr('Short sessions.', 'Phiên ngắn.')}</b> ${tr('The WHO advises no more than 1 hour of screen time a day at ages 2 to 4. The play timer defaults to 10 minutes.', 'WHO khuyên không quá 1 giờ màn hình mỗi ngày với bé 2–4 tuổi. Hẹn giờ mặc định là 10 phút.')}</li>
      </ul></details>
      <details><summary>${tr('Credits and honest limits', 'Ghi công và giới hạn')}</summary>
        <p class="note">${tr('Pictures: Fluent Emoji (3D) by Microsoft, MIT License (github.com/microsoft/fluentui-emoji). Voice: computer-generated with Kokoro-82M (Apache-2.0), voice "af_heart"; letter sounds are approximate. This is a trial version and has not been tested with children yet. Progress is saved only in this browser and is never sent anywhere.', 'Hình: Fluent Emoji (3D) của Microsoft, giấy phép MIT (github.com/microsoft/fluentui-emoji). Giọng đọc: do máy tạo bằng Kokoro-82M (Apache-2.0), giọng "af_heart"; âm của chữ cái chỉ gần đúng. Đây là bản thử, chưa thử với bé thật. Tiến bộ chỉ lưu trong trình duyệt này, không gửi đi đâu.')}</p></details>
      <div class="row"><span>${tr('Progress', 'Tiến bộ')}</span><button id="resetProg" class="btn">↺ ${tr('Start over', 'Làm lại từ đầu')}</button></div>`;
  }
  panel.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'panelClose') { panel.classList.add('hidden'); if (stage.classList.contains('hidden')) renderMenu(); return; }
    if (b.id === 'testVoice') { Snd.unlock(); Voice.say('Hello! Let us learn English together!'); return; }
    if (b.id === 'resetTimer') { playSec = 0; return; }
    if (b.id === 'fsBtn') { const d = document.documentElement; try { if (document.fullscreenElement) document.exitFullscreen(); else (d.requestFullscreen || d.webkitRequestFullscreen || function () { }).call(d); } catch (_) { } return; }
    if (b.id === 'resetProg') { if (b.dataset.sure) { M.reset(); renderPanel(); } else { b.dataset.sure = 1; b.textContent = tr('Tap again to confirm', 'Chạm lần nữa để xác nhận'); } return; }
    if (b.dataset.m) { const m = S.missions.find(x => x.id === b.dataset.m); if (m) { m.done[b.dataset.i] = 1; M.real(b.dataset.i); BE.save(); renderPanel(); } return; }
    const sg = b.closest('.seg');
    if (sg) {
      const key = sg.dataset.key, v = b.dataset.v;
      S[key] = v === 'true' ? true : v === 'false' ? false : (isNaN(+v) ? v : +v);
      if (key === 'level') { mapLevel = S.level; }
      BE.save(); renderPanel();
    }
  });
  panel.addEventListener('input', e => { if (e.target.id === 'vol') { S.volume = e.target.value / 100; Snd.vol(S.volume); BE.save(); } });
  panel.addEventListener('change', e => { if (e.target.id === 'vol') { Snd.unlock(); Snd.ding(784); } });

  /* ---------- Native app bits (Capacitor), same as Little Play ---------- */
  const nativePlugin = name => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[name]) || null;
  const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

  /* ---------- Play timer ---------- */
  setInterval(() => {
    if (stage.classList.contains('hidden') || document.hidden) return;
    playSec++;
    if (S.timer > 0 && playSec >= S.timer * 60) showBye();
  }, 1000);
  function showBye() { exitGame(false); bye.classList.remove('hidden'); Snd.lullaby(); setTimeout(() => Voice.say('All done playing. See you next time!'), 400); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) Voice.stop(); });

  function boot() {
    renderMenu();
    if (isNative()) { document.documentElement.classList.add('native'); try { window.Capacitor.Plugins.StatusBar.hide(); } catch (e) { } }
    else if (location.protocol.startsWith('http') && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
  }
  boot();
})();
