/* Little Talk: the activities. Each one is a function api => Promise that finishes when the child has done it.
   meet (hear new things) · find (the main question game, works for every kind of item) · move (act it out)
   clap (syllables) · story · hello. A question is built from an item by BE.Q, so any item from any world can be reviewed. */
(function () {
  'use strict';
  const { rand, pick, shuffle, Snd, FX, S, Voice, M } = BE;
  const ACT = BE.ACT = {};
  const sleep = (api, ms) => new Promise(r => api.timeout(r, ms));
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const PL = new Set(['feet', 'teeth', 'eyes', 'ears', 'hands', 'legs', 'arms', 'pants', 'shoes', 'gloves', 'glasses', 'grapes', 'cherries']);
  const isPl = w => PL.has(w);

  BE.css(`
.q { position: absolute; left: calc(var(--sl) + 8px); right: calc(var(--sr) + 8px); top: calc(var(--st) + 84px); bottom: calc(var(--sb) + 12px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2vmin; }
.q-scene { flex: 1 1 auto; min-height: 0; width: 100%; display: flex; align-items: center; justify-content: center; gap: 3vmin; flex-wrap: wrap; text-align: center; }
.q-opts { flex: none; display: flex; flex-wrap: wrap; justify-content: center; align-content: center; gap: var(--og, 12px); width: 100%; }
.q-opts.wide { flex-direction: column; align-items: center; flex-wrap: nowrap; }
.opt { position: relative; width: var(--os); height: var(--os); border-radius: 26%; background: #fff; box-shadow: 0 6px 0 rgba(0,0,0,.14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; font-weight: 900; color: var(--ink); transition: transform .15s var(--pop); touch-action: manipulation; }
.opt:active { transform: scale(.94); }
.opt .pic { font-size: calc(var(--os) * .58); line-height: 1.1; }
.opt.has-lb .pic { font-size: calc(var(--os) * .5); }
.opt .lb { font-size: calc(var(--os) * .15); font-weight: 800; opacity: .8; line-height: 1; }
.opt .sw { width: 66%; height: 66%; border-radius: 50%; display: block; box-shadow: inset 0 -6px 0 rgba(0,0,0,.14); }
.opt .txt { font-size: calc(var(--os) * .56); line-height: 1; }
.opt.right { background: #b9f2c6; animation: bounce .6s var(--pop); }
.opt.wrong { animation: shake .4s; background: #ffe2c2; }
.opt.hint { animation: pulse .8s ease-in-out infinite; }
.q-opts.wide .opt { width: min(92vw, 620px); height: var(--oh, 72px); border-radius: 22px; flex-direction: row; justify-content: flex-start; padding: 0 18px; gap: 14px; font-size: clamp(18px, 4vmin, 28px); text-align: left; }
.q-scene .big-pic { font-size: min(calc(var(--sh, 120px) * .62), 34vw); line-height: 1.05; filter: drop-shadow(0 4px 0 rgba(0,0,0,.08)); }
.q-scene .sentence { font-size: clamp(22px, 6.4vmin, 56px); font-weight: 900; line-height: 1.2; background: rgba(255,255,255,.8); border-radius: 22px; padding: 10px 22px; box-shadow: 0 5px 0 rgba(0,0,0,.1); max-width: 94vw; }
.q-scene .ci { font-size: calc(var(--cf, 56px)); line-height: 1.05; transition: transform .2s var(--pop); }
.q-scene .ci.on { transform: scale(1.25); filter: drop-shadow(0 0 8px #ffd43b); }
.cnt { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; max-width: 92vw; gap: 4px; }
.sw-big { width: calc(var(--sh, 120px) * .8); height: calc(var(--sh, 120px) * .8); border-radius: 50%; display: block; box-shadow: inset 0 -8px 0 rgba(0,0,0,.14); }
.ps { position: relative; width: calc(var(--os) * .92); height: calc(var(--os) * .92); }
.ps .pbox { position: absolute; left: 50%; transform: translateX(-50%); width: 64%; height: 40%; background: #c8935a; border: 3px solid #8a5a2b; border-radius: 6px 6px 14px 14px; box-shadow: inset 0 -8px 0 rgba(0,0,0,.14); }
.ps .pobj { position: absolute; left: 50%; transform: translateX(-50%); font-size: calc(var(--os) * .36); line-height: 1; }
.ps.in .pbox { bottom: 10%; } .ps.in .pobj { bottom: 24%; z-index: 2; }
.ps.on .pbox { bottom: 10%; } .ps.on .pobj { bottom: 50%; }
.ps.under .pbox { top: 6%; } .ps.under .pobj { bottom: 4%; }
.card-m .pic { font-size: calc(var(--os) * .5); line-height: 1.1; }
.card-m .lb { font-size: calc(var(--os) * .15); }
.card-m.seen { box-shadow: 0 6px 0 rgba(0,0,0,.14), 0 0 0 5px #ffd43b; }
.card-m .tt { font-size: calc(var(--os) * .15); font-weight: 800; padding: 0 6px; line-height: 1.1; text-align: center; }
.next-btn { position: absolute; right: calc(var(--sr) + 14px); bottom: calc(var(--sb) + 14px); width: 92px; height: 92px; border-radius: 50%; background: #7bd88f; font-size: 46px; box-shadow: 0 6px 0 rgba(0,0,0,.18); z-index: 25; animation: pulse .9s ease-in-out infinite; color: #fff; display: flex; align-items: center; justify-content: center; }
.mv { position: absolute; inset: calc(var(--st) + 84px) 0 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2vh; }
.mv .actor { font-size: min(34vmin, 220px); line-height: 1.05; animation: wobble .7s ease-in-out infinite; }
.mv .cmd { font-size: clamp(24px, 6vmin, 48px); font-weight: 900; background: rgba(255,255,255,.85); padding: 8px 22px; border-radius: 22px; }
.mv .done-btn { padding: 14px 30px; border-radius: 34px; background: #7bd88f; color: #fff; font-size: clamp(22px, 5vmin, 34px); font-weight: 900; box-shadow: 0 6px 0 rgba(0,0,0,.18); animation: pulse .9s ease-in-out infinite; }
.mv .actor.go { animation: bounce .5s ease-in-out infinite; }
.cl { position: absolute; inset: calc(var(--st) + 84px) 0 0 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2vh; }
.cl .dots { display: flex; gap: 10px; min-height: 44px; }
.cl .dots i { width: 38px; height: 38px; border-radius: 50%; background: #ffb703; box-shadow: 0 4px 0 rgba(0,0,0,.15); animation: popin .25s var(--pop); }
.cl .clap-btn { width: min(30vmin, 180px); height: min(30vmin, 180px); border-radius: 50%; background: #ffe08a; font-size: min(18vmin, 110px); box-shadow: 0 8px 0 rgba(0,0,0,.16); }
.cl .clap-btn:active { transform: translateY(4px) scale(.96); }
.cl .word { font-size: clamp(26px, 7vmin, 52px); font-weight: 900; }
.st-page { font-size: clamp(22px, 5.6vmin, 44px); font-weight: 800; line-height: 1.25; background: rgba(255,255,255,.88); padding: 12px 22px; border-radius: 22px; max-width: 92vw; text-align: center; }
.hello-wrap { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2vh; }
.hello-wrap .hand { font-size: min(42vmin, 260px); animation: wobble 1s ease-in-out infinite; line-height: 1; }
.hello-wrap .hw { font-size: clamp(34px, 9vmin, 72px); font-weight: 900; text-shadow: 0 3px 0 rgba(255,255,255,.8); }
@media (max-height: 520px) { .q { top: calc(var(--st) + 76px); gap: 1vmin; } .mv .actor { font-size: min(30vmin, 160px); } }
`);

  /* ---------- small helpers ---------- */
  const vis = it => it.c
    ? `<span class="sw" style="background:${it.c}${it.c === '#ffffff' ? ';box-shadow:inset 0 0 0 4px #ddd' : ''}"></span>`
    : `<span class="pic">${it.e}</span>`;
  const posScene = (pos, e) => `<div class="ps ${pos}"><span class="pbox"></span><span class="pobj">${e || '🐱'}</span></div>`;
  function others(it, n) {
    const pool = shuffle(BE.world(it.wid).items.filter(i => i.id !== it.id));
    return shuffle([it].concat(pool.slice(0, Math.max(1, n - 1))));
  }
  function el(html, cls) { const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = html; return d; }
  // Size the option buttons so they fill the space left under the scene
  function sizeOpts(root, box, n, o) {
    o = o || {};
    const W = root.clientWidth - 16, Hq = root.clientHeight - 84 - 12;
    const sceneShare = o.scene ? (o.sceneShare || 0.42) : 0;
    const H = Math.max(80, Hq * (1 - sceneShare) - 8);
    if (o.wide) { box.style.setProperty('--oh', Math.max(52, Math.min(86, (H - 10 * (n - 1)) / n)) + 'px'); box.style.setProperty('--og', '10px'); box.style.setProperty('--os', '80px'); return; }
    const f = BE.fit(n, W, H, 0.1, o.max || 230);
    box.style.setProperty('--os', f.s + 'px'); box.style.setProperty('--og', f.gap + 'px');
    box.parentNode.style.setProperty('--sh', Math.max(60, Hq * sceneShare) + 'px');
  }

  /* ---------- BE.Q: build a question for any item ---------- */
  BE.Q = function (it, o) {
    const w = BE.world(it.wid), n = Math.min(o.n || 3, w.items.length);
    const mk = (x, ok, extra) => Object.assign({ k: x.id, html: vis(x), say: x.w, ok }, extra);
    switch (w.kind) {
      case 'words': {
        const prompt = it.q || (w.id === 'family' ? `Where is ${it.w}?` : isPl(it.w) ? `Where are the ${it.w}?` : `Where is the ${it.w}?`);
        return { prompt, say: prompt, opts: others(it, n).map(x => mk(x, x === it, { html: vis(x) + ((n <= 2 && w.level === 1) ? '' : '') })), after: it.s || `Yes! ${cap(it.w)}!` };
      }
      case 'colors': {
        const prompt = `Find ${it.w}!`;
        return { prompt, say: prompt, opts: others(it, n).map(x => mk(x, x === it)), after: `Yes! ${cap(it.w)}!` };
      }
      case 'frames': {
        return { prompt: it.s, say: it.s, opts: others(it, n).map(x => mk(x, x === it)), after: it.s };
      }
      case 'count': {
        const set = new Set([it.n]); [1, -1, 2, -2, 3].forEach(d => { const v = it.n + d; if (set.size < n && v >= 1 && v <= 10) set.add(v); });
        const nums = shuffle([...set]);
        return { prompt: 'How many? Count with me!', say: 'How many? Count with me!',
          scene: `<div class="cnt">${Array.from({ length: it.n }, (_, i) => `<span class="ci" data-i="${i + 1}">${it.e}</span>`).join('')}</div>`, countScene: it.n,
          opts: nums.map(v => ({ k: 'n' + v, html: `<span class="txt">${v}</span>`, say: BE.NUMW[v], ok: v === it.n })), after: it.s };
      }
      case 'position': {
        return { prompt: it.s, say: it.s, opts: shuffle(w.items.slice()).map(x => ({ k: x.id, html: posScene(x.pos), say: x.w, ok: x === it })), after: it.s, max: 260 };
      }
      case 'rhymes': {
        const mate = shuffle(w.items.filter(i => i.g === it.g && i !== it))[0];
        const rest = shuffle(w.items.filter(i => i.g !== it.g)).slice(0, Math.max(1, n - 1));
        const opts = shuffle([mate].concat(rest)).map(x => ({ k: x.id, html: `<span class="pic">${x.e}</span><span class="lb">${x.w}</span>`, say: x.w, ok: x === mate, cls: 'has-lb' }));
        return { prompt: `Which word rhymes with ${it.w}?`, say: `Which word rhymes with ${it.w}?`, scene: `<span class="big-pic">${it.e}</span><span class="sentence">${it.w}</span>`, opts, after: `Yes! ${it.w} and ${mate.w} rhyme!` };
      }
      case 'letters': {
        const b = M.box(it.id), mode = b <= 1 ? 'name' : b === 2 ? (Math.random() < 0.5 ? 'lower' : 'sound') : 'sound';
        const picks = others(it, n);
        if (mode === 'name') return { prompt: `Find the letter ${it.L}.`, say: `Find the letter ${it.L}.`, opts: picks.map(x => ({ k: x.id, html: `<span class="txt">${x.L}</span>`, say: x.L, ok: x === it })), after: `Yes! ${it.L}!` };
        if (mode === 'lower') return { prompt: `Find the little ${it.l}.`, say: `Find the little letter ${it.L}.`, opts: picks.map(x => ({ k: x.id, html: `<span class="txt">${x.l}</span>`, say: x.L, ok: x === it })), after: `Yes! Big ${it.L}, little ${it.L}.` };
        return { prompt: `${it.L} says ${it.snd}. Which one starts with ${it.snd}?`, say: `${it.L}. ${it.snd}. Which one starts with ${it.snd}?`,
          opts: picks.map(x => ({ k: x.id, html: `<span class="pic">${x.e}</span><span class="lb">${x.ex}</span>`, say: x.ex, ok: x === it, cls: 'has-lb' })), after: `Yes! ${it.ex} starts with ${it.L}.` };
      }
      case 'read': {
        const picks = others(it, n);
        return { prompt: it.s, say: it.s, silent: true, hintSay: it.s, opts: picks.map(x => ({ k: x.id, html: `<span class="pic">${x.e}</span>`, say: x.s, ok: x === it })), after: it.s };
      }
      case 'talk': {
        const ans = shuffle([it.a].concat(it.d.slice(0, 2)));
        return { prompt: it.q, say: it.q, scene: `<span class="big-pic">${it.e}</span><span class="sentence">${it.q}</span>`, wide: true,
          opts: ans.map((t, i) => ({ k: 't' + i, html: `<span>🔊</span><span>${t}</span>`, say: t, ok: t === it.a })), after: it.a };
      }
    }
    return null;
  };

  /* ---------- Ask one question; resolves { clean, wrong, hint } ---------- */
  function ask(api, q, opt) {
    opt = opt || {};
    return new Promise(done => {
      const root = api.root;
      root.querySelectorAll('.q,.next-btn').forEach(e => e.remove());
      const box = el('', 'q');
      const scene = q.scene ? el(q.scene, 'q-scene') : null;
      const opts = el('', 'q-opts' + (q.wide ? ' wide' : ''));
      if (scene) box.appendChild(scene); box.appendChild(opts); root.appendChild(box);
      BE.prompt(root, q.prompt, { say: q.say, silent: !!q.silent });
      if (q.silent) setTimeout(() => { }, 0);
      const btns = q.opts.map(o => {
        const b = document.createElement('button'); b.className = 'opt ' + (o.cls || ''); b.innerHTML = o.html; b.dataset.k = o.k; opts.appendChild(b); return b;
      });
      sizeOpts(root, opts, q.opts.length, { scene: !!scene, wide: q.wide, max: q.max });
      if (scene) {
        // the scene gets exactly the height the options leave free
        const avail = Math.max(60, root.clientHeight - 84 - 12 - opts.offsetHeight - Math.max(8, innerHeight * 0.02) - 4);
        scene.style.flex = 'none'; scene.style.height = avail + 'px'; scene.style.setProperty('--sh', avail + 'px');
        const ci = scene.querySelectorAll('.ci');
        if (ci.length) { const f = BE.fit(ci.length, scene.clientWidth * 0.94, avail, 0.04, 96); scene.style.setProperty('--cf', Math.floor(f.s * 0.9) + 'px'); scene.querySelector('.cnt').style.maxWidth = Math.ceil(f.cols * f.s * 1.08) + 'px'; }
        let c = 0; ci.forEach(x => x.addEventListener('click', () => { if (x.classList.contains('on')) return; x.classList.add('on'); c++; Snd.pop(c); Voice.say(BE.NUMW[c] || String(c)); }));
        const s2 = scene.querySelector('.sentence'); if (s2) s2.addEventListener('click', () => Voice.say(q.say));
      }
      let wrong = 0, hint = false, locked = false;
      q.opts.forEach((o, i) => btns[i].addEventListener('click', () => {
        if (locked) return; Snd.unlock();
        if (o.ok) {
          locked = true; btns[i].classList.add('right'); Snd.ding(784);
          const r = btns[i].getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, { n: 14 });
          Voice.say(q.after || '');
          api.timeout(() => done({ clean: wrong === 0 && !hint, wrong: wrong > 0, hint }), Math.max(1500, (q.after || '').length * 75 + 600));
        } else {
          wrong++; Snd.oops(); btns[i].classList.remove('wrong'); void btns[i].offsetWidth; btns[i].classList.add('wrong');
          Voice.say(o.say || '');
          if (wrong >= 2) { hint = true; const k = q.opts.findIndex(x => x.ok); btns.forEach(b => b.classList.remove('hint')); btns[k].classList.add('hint'); }
          if (wrong === 2 && q.hintSay) api.timeout(() => Voice.say(q.hintSay), 700);
          if (wrong >= 4) { locked = true; const k = q.opts.findIndex(x => x.ok); btns[k].classList.add('right'); Voice.say(q.after || ''); api.timeout(() => done({ clean: false, wrong: true, hint: true }), 2200); }
        }
      }));
    });
  }
  BE.ask = ask;

  /* ---------- find: a run of questions ---------- */
  ACT.find = async function (api, o) {
    BE.setTip && BE.setTip('find');
    const queue = o.targets.slice(), requeued = new Set();
    let streak = 0, miss = 0, rounds = 0;
    const base = it => BE.world(it.wid).level === 1 ? 2 : 3;
    let bonus = 0, count = 0;
    while (o.endless || queue.length) {
      const it = o.endless ? o.pickNext() : queue.shift();
      const baseN = base(it) + bonus, firstRounds = BE.world(it.wid).level === 1 && count < 2;
      const q = BE.Q(it, { n: firstRounds ? 2 : Math.max(2, Math.min(4, baseN)) });
      if (!q) continue;
      const r = await ask(api, q);
      count++;
      if (r.wrong) { M.wrong(it.id); if (!requeued.has(it.id)) { requeued.add(it.id); if (!o.endless) queue.splice(Math.min(queue.length, 2), 0, it); } streak = 0; if (++miss >= 2) { bonus = Math.max(-1, bonus - 1); miss = 0; } }
      else { M.right(it.id, r.clean); miss = 0; if (r.clean && ++streak >= 2) { bonus = Math.min(1, bonus + 1); streak = 0; } }
      rounds++;
      if (o.onRound) o.onRound(it, r, rounds);
      if (o.endless && o.maxRounds && rounds >= o.maxRounds) break;
    }
    api.root.querySelectorAll('.q').forEach(e => e.remove());
  };

  /* ---------- meet: tap each card to hear it ---------- */
  function cardInner(it, kind) {
    switch (kind) {
      case 'count': return `<span class="tt">${it.e.repeat(Math.min(it.n, 6))}${it.n > 6 ? '…' : ''}</span><span class="pic" style="font-size:calc(var(--os)*.42)">${it.n}</span><span class="lb">${it.w}</span>`;
      case 'position': return posScene(it.pos) + `<span class="lb">${it.w}</span>`;
      case 'letters': return `<span class="txt" style="font-size:calc(var(--os)*.34)">${it.L}${it.l}</span><span class="pic" style="font-size:calc(var(--os)*.34)">${it.e}</span><span class="lb">${it.ex}</span>`;
      case 'frames': return vis(it) + `<span class="tt">${it.s}</span>`;
      case 'read': return vis(it) + `<span class="tt">${it.s}</span>`;
      case 'talk': return vis(it) + `<span class="tt">${it.q}</span>`;
      case 'rhymes': return vis(it) + `<span class="lb">${it.w}</span>`;
      default: return vis(it) + `<span class="lb">${it.w}</span>`;
    }
  }
  function lines(it, kind, tap) {
    switch (kind) {
      case 'frames': case 'count': case 'position': case 'read': return [it.s];
      case 'letters': return [it.L + '.', `${it.L} is for ${it.ex}.`];
      case 'talk': return [it.q, it.a];
      case 'rhymes': return [it.w];
      case 'colors': return [[it.w + '.', `Say, ${it.w}.`][tap % 2]];
      default: return [[it.w + '.', `Say, ${it.w}.`, `Here it is: ${it.w}.`][tap % 3]];
    }
  }
  BE.joinWords = g => g.length < 3 ? g.join(' and ') : g.slice(0, -1).join(', ') + ' and ' + g[g.length - 1];
  BE._lines = lines;   // used by tools/make_manifest.js to list everything the app says
  ACT.meet = function (api, o) {
    BE.setTip && BE.setTip('meet');
    return new Promise(done => {
      const root = api.root; root.innerHTML = '';
      const items = o.items, kind = BE.world(items[0].wid).kind;
      const box = el('', 'q'), opts = el('', 'q-opts');
      box.appendChild(opts); root.appendChild(box);
      const intro = o.intro || (kind === 'rhymes' ? 'These words rhyme. Tap each one.' : 'Tap each picture to hear it.');
      BE.prompt(root, intro);
      const wide = kind === 'frames' || kind === 'read' || kind === 'talk';
      const cards = items.map(it => { const b = document.createElement('button'); b.className = 'opt card-m'; b.innerHTML = cardInner(it, kind); opts.appendChild(b); return b; });
      sizeOpts(root, opts, items.length, { max: 250 });
      const seen = new Set(), taps = {};
      let doneShown = false;
      items.forEach((it, i) => cards[i].addEventListener('click', () => {
        Snd.unlock(); Snd.pop(i);
        cards[i].classList.add('seen'); cards[i].style.animation = 'bounce .5s var(--pop)'; setTimeout(() => { cards[i].style.animation = ''; }, 520);
        taps[it.id] = (taps[it.id] || 0) + 1; seen.add(it.id); M.heard(it.id);
        Voice.seq(lines(it, kind, taps[it.id] - 1));
        if (seen.size === items.length && !doneShown) {
          doneShown = true;
          api.timeout(() => {
            if (kind === 'rhymes') { const fams = []; items.forEach(x => { if (!fams.includes(x.group)) fams.push(x.group); }); Voice.seq(fams.map(g => BE.joinWords(g) + '. They rhyme!'), 200); }
            const nb = el('➡️', 'next-btn'); nb.setAttribute('role', 'button'); root.appendChild(nb);
            nb.addEventListener('click', () => { Snd.whoosh(); done(); });
          }, 1300);
        }
      }));
    });
  };

  /* ---------- move: act it out (the child does it, then taps the tick) ---------- */
  ACT.move = async function (api, o) {
    BE.setTip && BE.setTip('move');
    for (const it of o.items) {
      const root = api.root; root.innerHTML = '';
      const m = el(`<div class="actor">${it.e}</div><div class="cmd">${it.cmd}</div>`, 'mv'); root.appendChild(m);
      BE.prompt(root, `Let's ${it.w}!`, { silent: true });
      await new Promise(done => {
        const actor = m.querySelector('.actor');
        Voice.say(it.cmd); Snd.boing();
        api.timeout(() => { actor.classList.add('go'); }, 600);
        api.timeout(() => {
          const b = el('✔ I did it!', 'done-btn'); m.appendChild(b); b.setAttribute('role', 'button');
          b.addEventListener('click', () => { Snd.ding(880); FX.burst(innerWidth / 2, innerHeight / 2, { n: 18 }); if (o.grade !== false && it.id) { M.heard(it.id); M.right(it.id, true); } api.timeout(done, 600); });
        }, 2800);
      });
    }
  };

  /* ---------- clap: syllables ---------- */
  ACT.clap = async function (api, o) {
    BE.setTip && BE.setTip('clap');
    let q = o.items.slice(); const req = new Set();
    while (q.length) {
      const it = q.shift(); const root = api.root; root.innerHTML = '';
      const m = el(`<div class="big-pic" style="font-size:min(26vmin,170px);line-height:1.05">${it.e}</div><div class="word">${it.w}</div><div class="dots"></div><button class="clap-btn" aria-label="Clap">👏</button>`, 'cl'); root.appendChild(m);
      const dots = m.querySelector('.dots'), btn = m.querySelector('.clap-btn');
      BE.prompt(root, `Clap the word: ${it.w}`, { silent: true });
      const demo = async () => {
        dots.innerHTML = ''; btn.disabled = true;
        await Voice.say(it.w);
        await sleep(api, 250);
        for (let i = 0; i < it.n; i++) { Snd.drum(); btn.style.transform = 'scale(.9)'; const d = document.createElement('i'); dots.appendChild(d); await sleep(api, 120); btn.style.transform = ''; await sleep(api, 450); }
        await Voice.say(it.sp.replace(/-/g, ' '), { rate: 0.55 });
        btn.disabled = false;
      };
      const res = await new Promise(done => {
        let count = 0, timer = null, wrong = 0, busy = true;
        const judge = async () => {
          busy = true;
          if (count === it.n) { Snd.ding(784); FX.burst(innerWidth / 2, innerHeight / 2, { n: 20 }); await Voice.say(`Yes! ${cap(it.w)}. ${BE.NUMW[it.n]} ${it.n === 1 ? 'clap' : 'claps'}!`); await sleep(api, 500); done({ ok: true, clean: wrong === 0 }); return; }
          wrong++; Snd.oops();
          if (wrong >= 2) { await demo(); done({ ok: false }); return; }
          await Voice.say("Let's try again."); await demo(); count = 0; dots.innerHTML = ''; busy = false;
        };
        btn.addEventListener('click', () => {
          if (busy) return; Snd.unlock(); Snd.drum(); count++;
          const d = document.createElement('i'); dots.appendChild(d); clearTimeout(timer); timer = setTimeout(judge, 1500);
        });
        (async () => { await Voice.say(`Clap the word. ${it.w}.`); busy = false; if (o.demoFirst) { await demo(); count = 0; dots.innerHTML = ''; } })();
        api.timeout(() => { }, 1);
      });
      if (o.grade !== false) { if (res.ok) M.right(it.id, res.clean); else { M.wrong(it.id); if (!req.has(it.id)) { req.add(it.id); q.push(it); } } }
      await sleep(api, 300);
    }
  };

  /* ---------- story ---------- */
  ACT.story = async function (api, o) {
    BE.setTip && BE.setTip('story');
    for (const st of o.items) {
      const root = api.root;
      for (let i = 0; i < st.pages.length; i++) {
        root.innerHTML = '';
        const [text, pic] = st.pages[i];
        const m = el(`<div class="big-pic" style="font-size:min(30vmin,190px);line-height:1.05">${pic}</div><div class="st-page">${text}</div>`, 'mv'); root.appendChild(m);
        BE.prompt(root, st.w + ' (' + (i + 1) + '/' + st.pages.length + ')', { silent: true, say: st.w });
        Voice.say(text);
        m.querySelector('.st-page').addEventListener('click', () => Voice.say(text));
        await new Promise(done => api.timeout(() => { const nb = el('➡️', 'next-btn'); root.appendChild(nb); nb.addEventListener('click', () => { Snd.whoosh(); done(); }); }, 1500));
      }
      root.innerHTML = '';
      const q = { prompt: st.qq.q, say: st.qq.q, opts: shuffle([[st.qq.a, st.qq.ae, true]].concat(st.qq.d.map(d => [d[0], d[1], false]))).map((x, i) => ({ k: 's' + i, html: `<span class="pic">${x[1]}</span><span class="lb">${x[0]}</span>`, say: x[0], ok: x[2], cls: 'has-lb' })), after: 'Yes! ' + st.qq.a + '!' };
      const r = await ask(api, q);
      M.heard(st.id); if (r.wrong) M.wrong(st.id); else M.right(st.id, r.clean);
    }
  };

  /* ---------- hello ---------- */
  ACT.hello = function (api) {
    BE.setTip && BE.setTip('hello');
    return new Promise(done => {
      const root = api.root; root.innerHTML = '';
      const m = el('<div class="hand">👋</div><div class="hw">Hello!</div>', 'hello-wrap'); root.appendChild(m);
      BE.prompt(root, 'Wave back and say hello!', { silent: true });
      Voice.seq(['Hello!', "Let's play and learn English."], 300);
      api.timeout(() => {
        const nb = el('➡️', 'next-btn'); root.appendChild(nb);
        nb.addEventListener('click', () => { Snd.whoosh(); done(); });
      }, 2600);
      m.querySelector('.hand').addEventListener('click', () => { Snd.pop(2); Voice.say('Hello!'); });
    });
  };

  /* ---------- text for the grown-up: "play together" cards and real-life missions ---------- */
  BE.TIPS = {
    hello: { en: 'Wave and say "Hello!" with your child.', vi: 'Vẫy tay và nói "Hello!" cùng bé. Bé học tốt nhất khi có người thật nói chuyện cùng.' },
    meet: { en: 'Say each word out loud together, slowly, three times. Point to the real thing if you have it.', vi: 'Nói to từng từ cùng bé, chậm, ba lần. Có đồ vật thật thì chỉ vào đồ thật.' },
    find: { en: 'Ask again in your own voice: "Where is the …?" Cheer every try, even a wrong one.', vi: 'Hỏi lại bằng giọng của bố/mẹ: "Where is the …?". Khen mọi lần thử, kể cả khi bé chỉ sai.' },
    move: { en: 'Do the action together, big and silly. Then swap: let your child give YOU the command.', vi: 'Cùng bé làm động tác thật to, thật vui. Rồi đổi vai: để bé ra lệnh cho bố/mẹ.' },
    clap: { en: 'Clap the parts of other words you see (ba-na-na). Say the parts slowly.', vi: 'Thử vỗ tay theo các từ khác (ba-na-na). Đọc chậm từng phần.' },
    story: { en: 'After the page, ask "What do you see?" and let your child answer in any language.', vi: 'Sau mỗi trang, hỏi "What do you see?" và để bé trả lời bằng bất cứ ngôn ngữ nào bé muốn.' }
  };
  BE.missionText = function (it) {
    const w = BE.world(it.wid), vi = it.vi || '';
    switch (w.kind) {
      case 'words': return { en: w.id === 'family' ? `Where is ${it.w}?` : (isPl(it.w) ? `Where are the ${it.w}?` : `Where is the ${it.w}?`), vi: `Hỏi bé bằng tiếng Anh, bé chỉ vào "${vi}" thật (trong nhà, trên đường, trong sách).` };
      case 'colors': return { en: `Find something ${it.w}!`, vi: `Cùng bé tìm đồ vật màu ${vi} trong nhà.` };
      case 'actions': return { en: it.cmd, vi: `Cùng bé làm động tác "${vi}" và nói to.` };
      case 'frames': case 'count': case 'position': return { en: it.s, vi: `Nói cùng bé: "${it.s}" (${it.vi}).` };
      case 'syllables': return { en: `Clap ${it.sp}`, vi: `Vỗ tay theo từng phần của "${it.w}": ${it.sp}.` };
      case 'rhymes': return { en: `Which word rhymes with ${it.w}?`, vi: `Chơi đố vần với "${it.w}".` };
      case 'letters': return { en: `Find the letter ${it.L}.`, vi: `Tìm chữ ${it.L} trên biển hiệu, hộp sữa, sách.` };
      case 'read': return { en: it.s, vi: `Chỉ từng chữ và đọc cùng bé: "${it.s}".` };
      case 'talk': return { en: it.q, vi: `Hỏi bé bằng tiếng Anh: "${it.q}" rồi cùng trả lời.` };
      case 'story': return { en: 'Tell the story with the pictures.', vi: 'Kể lại truyện bằng tranh, mỗi người một trang.' };
    }
    return { en: it.w, vi: '' };
  };
})();
