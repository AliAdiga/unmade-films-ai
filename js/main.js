(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = window.gsap, ST = window.ScrollTrigger;
  const motion = !!(G && ST) && !reduce;
  if (G && ST) G.registerPlugin(ST);

  /* ---------- strings used by scripts ---------- */
  const STR = {
    'form.fix': 'A few fields need attention before the submission can go.',
    'form.untitled': 'Untitled',
    'form.sending': 'Sending your submission to the director…',
    'form.sent': "Received. Your submission is on the director's desk; you'll hear back within two working days.",
    'form.mailto': "Your email app should open with the submission filled in. If it didn't, write to dawood@unmadefilmsai.com.",
    'room.night.fine': 'Night in the studio. Hover a room to bring the morning in.',
    'room.night.touch': 'Night in the studio. Tap a room to bring the morning in.',
    'room.morning': 'Morning in {r}.',
    'stage.from': 'From the film {f}',
    'flash.on': 'Flash on. Switch to the dark theme', 'flash.off': 'Flash off. Switch to the light theme',
    'flash.state.on': 'On', 'flash.state.off': 'Off',
    'btf.slate': '{t} · BEHIND THE FRAME'
  };
  const T = (k, v) => { let s = T0(k); if (v) for (const n in v) s = s.replace('{' + n + '}', v[n]); return s; };
  const T0 = k => STR[k] || k;

  // studio sound was removed; the calls stay as quiet no-ops
  const sfx = { play() {}, set() {}, isOn: () => false };

  const reel = $('#reel');
  const nav = $('#nav');
  const pad2 = n => String(n).padStart(2, '0');
  const tc = s => { const f = Math.floor((s % 1) * 24); s = Math.floor(s); return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}:${pad2(f)}`; };

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add(t => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }
  const scrollTop = () => lenis ? lenis.scrollTo(0, { duration: 2 }) : window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  const scrollTo = id => {
    if (id === '#top') return scrollTop();
    const el = $(id); if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.6 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    e.preventDefault();
    closeMenu();
    if (id === '#brief') shutterTo(id); else if (id === '#top') scrollTop(); else cutTo(id);
    if (id !== '#top') history.replaceState(null, '', id);
  }));

  /* ---------- camera shutter: close on the logo, cut, open on the brief ---------- */
  const shutter = $('#shutter'), shSvg = $('#shSvg'), shIris = $('#shIris'), shBlades = $('#shBlades'), shMark = $('#shMark');
  let shutterBusy = false;
  function drawIris(a, rotDeg) {
    const W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2 + 40;
    shSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const r0 = rotDeg * Math.PI / 180;
    const v = [...Array(6)].map((_, k) => { const t = r0 + k * Math.PI / 3; return [cx + a * Math.cos(t), cy + a * Math.sin(t)]; });
    shIris.setAttribute('d', `M-10 -10H${W + 10}V${H + 10}H-10Z` + (a > .5 ? `M${v.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}Z` : ''));
    let d = '';
    if (a > .5) for (let k = 0; k < 6; k++) {               // blade edges: each hexagon side carried out to the frame
      const p = v[k], q = v[(k + 1) % 6];
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, ux = (q[0] - p[0]) / L, uy = (q[1] - p[1]) / L;
      d += `M${q[0].toFixed(1)} ${q[1].toFixed(1)}L${(q[0] + ux * R * 1.6).toFixed(1)} ${(q[1] + uy * R * 1.6).toFixed(1)}`;
    }
    shBlades.setAttribute('d', d);
  }
  function jumpTo(id) {
    const el = $(id); if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 70;
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
    if (ST) ST.update();
  }
  function shutterTo(id) {
    if (!G || reduce) { jumpTo(id); return; }
    if (shutterBusy) return; shutterBusy = true;
    const open = Math.hypot(innerWidth, innerHeight) / 2 + 40, s = { a: open, rot: 0 };
    shutter.classList.add('on'); drawIris(s.a, s.rot);
    G.timeline({ onComplete: () => { shutter.classList.remove('on'); shutterBusy = false; } })
      .to(s, { a: 0, rot: 60, duration: .62, ease: 'power3.in', onUpdate: () => drawIris(s.a, s.rot) })
      .add(() => sfx.play('shutter'), '-=.06')
      .fromTo(shMark, { opacity: 0, scale: .86 }, { opacity: 1, scale: 1, duration: .45, ease: 'expo.out' }, '-=.12')
      .fromTo('.sh-logo', { rotation: -90 }, { rotation: 0, duration: .6, ease: 'back.out(2)' }, '<')
      .add(() => jumpTo(id))
      .to(shMark, { opacity: 0, scale: 1.06, duration: .3, ease: 'power2.in' }, '+=.42')
      .to(s, { a: open, rot: 140, duration: .8, ease: 'power3.out', onUpdate: () => drawIris(s.a, s.rot) }, '-=.08');
  }
  /* ---------- section cut: the frame closes to a letterbox, cuts to the scene, reopens ---------- */
  const cut = $('#cut'), cutName = $('#cutName'), cutFrom = $('#cutFrom'), cutToEl = $('#cutTo'), cutTc = $('#cutTc');
  const cutVeil = $('.cut-veil', cut), cutMattes = $$('.cut-matte', cut), cutCard = $('.cut-card', cut);
  const SCENES = [['studio', '01'], ['work', '02'], ['process', '03'], ['services', '04'], ['follow', '05'], ['brief', '06']];
  const sceneNow = () => {
    let no = '00';
    SCENES.forEach(([id, n]) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < innerHeight * .4) no = n; });
    return no;
  };
  const sceneName = id => {
    const r = $(`.nav a.l[href="${id}"] .l-roll`);
    if (r) return (r.getAttribute('aria-label') || r.textContent).trim();
    const h = $(`${id} h2`); return h ? h.textContent.trim().split(/[.,]/)[0] : id.slice(1);
  };
  let cutBusy = false;
  function cutTo(id) {
    const el = $(id); if (!el) return;
    if (!G || reduce) { jumpTo(id); return; }
    if (cutBusy || shutterBusy) return; cutBusy = true;
    const toNo = (SCENES.find(s => '#' + s[0] === id) || [0, '--'])[1];
    cutFrom.textContent = sceneNow(); cutToEl.textContent = toNo;
    cutName.innerHTML = sceneName(id).split(' ').map(w => `<span class="cw">${w}</span>`).join(' ');
    const words = $$('.cw', cutName);
    const y0 = window.scrollY, y1 = el.getBoundingClientRect().top + y0 - 70, dir = y1 >= y0 ? 1 : -1;
    const clock = { f: y0 / 40 };                                 // the page read as footage: 40px a frame
    const showTc = () => { cutTc.textContent = tc(clock.f / 24); };
    cut.classList.add('on'); showTc();
    G.timeline({ onComplete: () => { cut.classList.remove('on'); cutBusy = false; } })
      .fromTo(cutVeil, { backgroundColor: 'rgba(8,8,7,0)', backdropFilter: 'blur(0px)' }, { backgroundColor: 'rgba(8,8,7,.42)', backdropFilter: 'blur(9px)', duration: .45, ease: 'power2.out' }, 0)
      .fromTo(cutMattes, { scaleY: 0 }, { scaleY: 1, duration: .5, ease: 'power3.inOut' }, 0)
      .fromTo(cutCard, { opacity: 0 }, { opacity: 1, duration: .25 }, .22)
      .fromTo(words, { yPercent: 105 * dir }, { yPercent: 0, duration: .5, ease: 'expo.out', stagger: .05 }, .26)
      .to(clock, { f: y1 / 40, duration: .7, ease: 'power2.inOut', onUpdate: showTc }, .2)
      .add(() => { jumpTo(id); }, .62)
      .to(words, { yPercent: -105 * dir, duration: .38, ease: 'power3.in', stagger: .03 }, .98)
      .to(cutCard, { opacity: 0, duration: .2 }, 1.18)
      .to(cutMattes, { scaleY: 0, duration: .6, ease: 'power3.inOut' }, 1.1)
      .to(cutVeil, { backgroundColor: 'rgba(8,8,7,0)', backdropFilter: 'blur(0px)', duration: .55, ease: 'power2.inOut' }, 1.14);
  }

  // into a film's "behind the frame" page: the shutter closes on the logo, then the page opens
  function shutterOut(url, slate) {
    const go = () => { if (url) location.href = url; else location.reload(); };
    if (!G || reduce) { go(); return; }
    if (shutterBusy) return; shutterBusy = true;
    const open = Math.hypot(innerWidth, innerHeight) / 2 + 40, s = { a: open, rot: 0 };
    const sl = $('.sh-slate', shutter), was = sl.textContent; sl.textContent = slate;
    shutter.classList.add('on'); drawIris(s.a, s.rot);
    G.timeline()
      .to(s, { a: 0, rot: 60, duration: .6, ease: 'power3.in', onUpdate: () => drawIris(s.a, s.rot) })
      .add(() => sfx.play('shutter'), '-=.06')
      .fromTo(shMark, { opacity: 0, scale: .86 }, { opacity: 1, scale: 1, duration: .35, ease: 'expo.out' }, '-=.1')
      .add(go, '+=.15');
    // coming back with the browser's back button: reopen
    addEventListener('pageshow', function back(ev) {
      if (!ev.persisted) return; removeEventListener('pageshow', back);
      shutter.classList.remove('on'); G.set(shMark, { opacity: 0 }); sl.textContent = was; shutterBusy = false;
    });
  }
  $$('a.to-film').forEach(a => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const title = (a.closest('.dr-slide') ? a.closest('.dr-slide').dataset.title : 'Empty Chair').toUpperCase();
    shutterOut(a.getAttribute('href'), T('btf.slate', { t: title }));
  }));

  $('#toTop').addEventListener('click', scrollTop);

  /* ---------- flash on / flash off: light and dark themes ---------- */
  const root = document.documentElement, flashBtn = $('#flashBtn'), flashState = $('#flashState'), flashPop = $('#flashPop');
  const isLight = () => root.dataset.theme === 'light';
  const syncFlash = () => {
    const on = isLight();
    flashBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    flashBtn.setAttribute('aria-label', T(on ? 'flash.on' : 'flash.off'));
    flashState.textContent = T(on ? 'flash.state.on' : 'flash.state.off');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', on ? '#F1ECE3' : '#0A0A0A');
  };
  const applyTheme = light => {
    if (light) root.dataset.theme = 'light'; else delete root.dataset.theme;
    try { localStorage.setItem('uf-theme', light ? 'light' : 'dark'); } catch (_) {}
    syncFlash();
  };
  syncFlash();
  let flashBusy = false;
  flashBtn.addEventListener('click', () => {
    if (flashBusy) return;
    const toLight = !isLight();
    const r = flashBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    if (reduce) { applyTheme(toLight); return; }
    if (!document.startViewTransition) {                      // older browsers: a quick flash pop, then switch
      if (toLight) { flashPop.style.setProperty('--fx', x + 'px'); flashPop.style.setProperty('--fy', y + 'px'); flashPop.animate([{ opacity: 0 }, { opacity: .9, offset: .3 }, { opacity: 0 }], { duration: 450, easing: 'ease-out' }); }
      setTimeout(() => applyTheme(toLight), toLight ? 130 : 0); return;
    }
    flashBusy = true;
    const go = () => {
      root.classList.toggle('theme-closing', !toLight);
      const vt = document.startViewTransition(() => applyTheme(toLight));
      vt.ready.then(() => {
        const circle = [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`];
        root.animate({ clipPath: toLight ? circle : [...circle].reverse() }, {
          duration: toLight ? 900 : 760, easing: 'cubic-bezier(.65,0,.35,1)',
          pseudoElement: toLight ? '::view-transition-new(root)' : '::view-transition-old(root)'
        });
        // the flash itself: the new light frame arrives over-exposed and settles, like a photo lit by a flash
        if (toLight) root.animate({ filter: ['brightness(2.4) saturate(.6)', 'brightness(1.25)', 'brightness(1)'] }, {
          duration: 1000, easing: 'cubic-bezier(.2,.7,.2,1)', pseudoElement: '::view-transition-new(root)'
        });
      }).catch(() => {});                                     // the browser may skip the animation (e.g. a hidden tab): the theme still switches
      vt.finished.catch(() => {}).finally(() => { root.classList.remove('theme-closing'); flashBusy = false; });
    };
    if (toLight) {
      // the flash charges, then fires: the light spreads from it
      flashBtn.classList.add('charging'); sfx.play('charge');
      setTimeout(() => { flashBtn.classList.remove('charging'); sfx.play('pop'); go(); }, 300);
    } else { sfx.play('tick'); go(); }
  });

  /* ---------- split helpers ---------- */
  function splitWords(el, cls = 'w') {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const o = document.createElement('span'); o.className = cls;
            const i = document.createElement('span'); i.textContent = part;
            o.appendChild(i); frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return $$(`.${cls} > span`, el);
  }
  function splitChars(el) {
    const out = [];
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach(ch => {
          if (/^\s+$/.test(ch)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; out.push(s); frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    return out;
  }

  /* ---------- lens badge: the lens image turns like a focus ring ---------- */
  const lensEl = $('#badge'), lensImg = $('#lensImg');
  const lens = { a: 30, rot: 0, ring: 0 };
  function drawLens() {
    if (lensImg) lensImg.style.transform = `rotate(${(lens.ring * .4).toFixed(2)}deg)`;
  }
  drawLens();
  let lensHover = false, lensLive = !motion;
  const lensFromScroll = () => {
    if (!lensLive) return;
    const y = window.scrollY, max = Math.max(1, document.documentElement.scrollHeight - innerHeight), p = Math.min(1, y / max);
    lens.ring = y * .05; lens.rot = p * 120;
    if (!lensHover) lens.a = 30 - 14 * p;
    drawLens();
  };
  addEventListener('scroll', lensFromScroll, { passive: true });
  lensEl.addEventListener('mouseenter', () => { lensHover = true; if (G) G.to(lens, { a: 46, duration: .5, ease: 'power3.out', onUpdate: drawLens }); });
  lensEl.addEventListener('mouseleave', () => { lensHover = false; const p = Math.min(1, window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)); if (G) G.to(lens, { a: 30 - 14 * p, duration: .6, ease: 'power3.out', onUpdate: drawLens }); });

  /* ---------- nav: letter roll + gliding focus brackets ---------- */
  $$('.l-roll').forEach(el => {
    const t = el.textContent; el.textContent = ''; el.setAttribute('aria-label', t);
    [...t].forEach((ch, i) => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); });
  });
  $$('.nav-side').forEach(side => {
    const focus = $('.nav-focus', side), items = $$('.l', side);
    const park = (a, hovering) => {
      if (!a) { focus.classList.remove('on', 'hovering'); return; }
      focus.style.transform = `translate(${a.offsetLeft}px,${a.offsetTop}px)`;
      focus.style.width = a.offsetWidth + 'px'; focus.style.height = a.offsetHeight + 'px';
      focus.classList.add('on'); focus.classList.toggle('hovering', !!hovering);
    };
    items.forEach(a => { a.addEventListener('mouseenter', () => park(a, true)); a.addEventListener('focus', () => park(a, true)); });
    const rest = () => park(items.find(a => a.classList.contains('active')));
    side.addEventListener('mouseleave', rest);
    items.forEach(a => a.addEventListener('blur', rest));
    const mo = new MutationObserver(() => { if (!side.matches(':hover')) rest(); });
    items.forEach(a => mo.observe(a, { attributes: true, attributeFilter: ['class'] }));
  });

  /* ---------- keep the nav clear of the lens at every width ---------- */
  const fitNav = () => {
    nav.classList.remove('fit-1', 'fit-2', 'fit-3');
    if (innerWidth <= 900) return;                        // phones use the menu
    const mid = nav.clientWidth / 2, clear = 67 + 22;     // lens radius + breathing room
    const end = $('.nav-end'), left = $('.nav-left');
    const collides = () => end.getBoundingClientRect().left < mid + clear || left.getBoundingClientRect().right > mid - clear;
    if (collides()) nav.classList.add('fit-1');
    if (collides()) nav.classList.add('fit-2');
    if (collides()) nav.classList.add('fit-3');
  };
  fitNav();
  addEventListener('resize', fitNav);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav);

  /* ---------- side rails: film strip + scene slate ---------- */
  const railL = $('.rail-l'), railPerf = $('#railPerf'), railCode = $('#railCode');
  const railNo = $('#railNo'), railName = $('#railName'), railTc = $('#railTc'), railFill = $('#railFill');
  const scenes = [['hero', '00', 'Opening'], ['eye', '01', 'The eye'], ['studio', '02', 'The studio'], ['work', '03', 'Work'], ['process', '04', 'Process'], ['services', '05', 'Services'], ['brief', '06', 'Submission'], ['follow', '07', 'Closing scene']];
  const railTick = () => {
    const y = window.scrollY, max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    railPerf.style.setProperty('--sy', (-y * .6) + 'px');
    railCode.style.setProperty('--sy2', (-(y * .25) % 900) + 'px');
    railFill.style.transform = `scaleY(${Math.min(1, y / max)})`;
    railTc.textContent = tc(y / 90);
  };
  addEventListener('scroll', railTick, { passive: true }); railTick();
  const railObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const sc = scenes.find(s => s[0] === e.target.id); if (!sc) return;
    railNo.textContent = sc[1]; railName.textContent = sc[2];
  }), { rootMargin: '-45% 0px -50% 0px' });
  scenes.forEach(([id]) => { const el = document.getElementById(id); if (el) railObs.observe(el); });

  /* ---------- launch → hero: one continuous shot ----------
     The logo's viewfinder sits where the hero frame is. It "sees" the reel
     inside its square, then one shared motion opens the square into the frame
     while the lens aperture opens and the wordmark is drawn into the lens. */
  const loader = $('#loader');
  const startReel = () => { if (!reduce && reel) { const p = reel.play(); if (p && p.catch) p.catch(() => {}); } };
  if (motion) {
    document.body.classList.add('locked');
    window.scrollTo(0, 0);
    startReel();
    const frame = $('.hero-frame'), lv = $('#lv'), word = $('#launchWord');
    const words = splitWords($('#h1'));
    const chars = splitChars(word);
    const corners = $$('i', lv);
    const dirs = [[-1, -1], [1, -1], [-1, 1], [1, 1]];

    const fr = frame.getBoundingClientRect();
    const S = Math.round(Math.min(120, innerWidth * .3));
    const cx = fr.left + fr.width / 2, cy = fr.top + fr.height / 2;
    const box = { l: cx - S / 2, t: cy - S / 2, w: S, h: S };
    const applyBox = () => {
      lv.style.left = box.l + 'px'; lv.style.top = box.t + 'px'; lv.style.width = box.w + 'px'; lv.style.height = box.h + 'px';
      const t = Math.max(0, box.t - fr.top), r = Math.max(0, fr.right - (box.l + box.w)), b = Math.max(0, fr.bottom - (box.t + box.h)), l = Math.max(0, box.l - fr.left);
      frame.style.clipPath = `inset(${t}px ${r}px ${b}px ${l}px)`;
    };
    applyBox();
    G.set('#launchText', { top: Math.min(cy + S / 2 + 30, innerHeight - 160) });
    const a = word.getBoundingClientRect(), lr = lensEl.getBoundingClientRect();
    const dx = (lr.left + lr.width / 2) - (a.left + a.width / 2), dy = (lr.top + lr.height / 2) - (a.top + a.height / 2);

    G.set(frame, { opacity: 0 });
    G.set('.hero-ambient, .hero-frame-cap, .cam-strip, .reel-toggle, .hero-vf, .hero-aside > *', { opacity: 0 });
    G.set(words, { yPercent: 115 });
    G.set('.nav-bar, .nav-end', { yPercent: -100, opacity: 0 });
    G.set(lensEl, { opacity: 0, scale: .6, transition: 'none' });
    Object.assign(lens, { a: 3, ring: -150, rot: -40 }); drawLens();

    let done = false;
    const finish = () => {
      if (done) return; done = true;
      loader.remove();
      document.body.classList.remove('locked');
      frame.style.clipPath = '';
      G.set(frame, { clearProps: 'opacity' });
      G.set(lensEl, { clearProps: 'transform,opacity,transition' });
      G.set('.nav-bar, .nav-end, .hero-ambient, .hero-frame-cap, .cam-strip, .reel-toggle, .hero-vf, .hero-aside > *', { clearProps: 'opacity,transform' });
      G.set(words, { clearProps: 'transform' });
      lensLive = true; lensFromScroll();
      ST.refresh();
    };

    const clock = { v: 0 }, tcEl = $('#loaderTc');
    const tl = G.timeline({ defaults: { ease: 'expo.out' }, onComplete: finish });
    tl.to(clock, { v: 3.5, duration: 3.5, ease: 'none', onUpdate: () => { tcEl.textContent = tc(clock.v); } }, 0);
    corners.forEach((c, i) => {
      tl.fromTo(c, { x: dirs[i][0] * 24, y: dirs[i][1] * 24, opacity: 0 }, { x: dirs[i][0] * 5, y: dirs[i][1] * 5, opacity: 1, duration: .55, ease: 'power3.out' }, .05 + i * .04)
        .to(c, { x: 0, y: 0, duration: .35, ease: 'back.out(3)' }, .55);
    });
    tl.fromTo('#lvDot', { scale: 0 }, { scale: 1, duration: .4, ease: 'back.out(4)' }, .45)
      .fromTo('#lvRing', { scale: .4, opacity: .9 }, { scale: 2.6, opacity: 0, duration: .7, ease: 'power2.out' }, .55)
      .to(corners, { borderColor: '#C8A96E', duration: .12, yoyo: true, repeat: 1 }, .55)
      .from('.launch-kicker', { opacity: 0, y: 8, duration: .6 }, .55)
      .from(chars, { yPercent: 120, opacity: 0, duration: .7, stagger: .018 }, .6)
      .from('#launchTag', { opacity: 0, y: 10, duration: .6 }, .85)

      // the viewfinder sees the film
      .addLabel('see', 1.45)
      .set('#loaderBg', { opacity: 0 }, 'see')
      .to('#lvDot', { scale: 0, duration: .25, ease: 'power2.in' }, 'see')
      .to('.launch-kicker, #launchTag, #loaderMeta, #loaderSkip', { opacity: 0, y: -8, duration: .35, ease: 'power2.in' }, 'see+=.05')

      // one shared motion: square → frame, aperture opens, wordmark into the lens
      .addLabel('open', 'see+=.4')
      .to(box, { l: fr.left, t: fr.top, w: fr.width, h: fr.height, duration: 1.25, ease: 'power3.inOut', onUpdate: applyBox }, 'open')
      // the film fades in only as the frame opens wide: never shown as a small, enlarged crop
      .to(frame, { opacity: 1, duration: .8, ease: 'power2.inOut' }, 'open+=.3')
      .to(word, { x: dx, y: dy, scale: .18, duration: 1.05, ease: 'power3.inOut' }, 'open')
      .to(word, { opacity: 0, duration: .25, ease: 'none' }, 'open+=.8')
      .to(lensEl, { opacity: 1, scale: 1, duration: .9 }, 'open+=.25')
      .to(lens, { a: 30, ring: 0, rot: 0, duration: 1.25, ease: 'power3.inOut', onUpdate: drawLens }, 'open')
      .to('.nav-bar, .nav-end', { yPercent: 0, opacity: 1, duration: .9 }, 'open+=.45')
      .to('.hero-ambient', { opacity: 1, duration: 1.4, ease: 'power2.out' }, 'open+=.2')
      // corners settle 16px inside the frame, exactly where the hero's own corners live
      .to(box, { l: fr.left + 16, t: fr.top + 16, w: fr.width - 32, h: fr.height - 32, duration: .4, ease: 'power2.out', onUpdate: () => { lv.style.left = box.l + 'px'; lv.style.top = box.t + 'px'; lv.style.width = box.w + 'px'; lv.style.height = box.h + 'px'; } }, 'open+=1.25')
      .set('.hero-vf', { opacity: 1 }, 'open+=1.65')
      .set(lv, { opacity: 0 }, 'open+=1.65')
      .to(words, { yPercent: 0, duration: 1.1, stagger: .05 }, 'open+=.75')
      .to('.hero-aside > *, .hero-frame-cap, .cam-strip, .reel-toggle', { opacity: 1, duration: .9, stagger: .05 }, 'open+=1');

    const skip = () => { if (!done) tl.progress(1); };
    $('#loaderSkip').addEventListener('click', skip);
    addEventListener('keydown', e => { if (e.key === 'Escape') skip(); });
    setTimeout(skip, 7000); // safety net
  } else {
    loader.remove();
    startReel();
  }

  /* ---------- hero ---------- */
  const heroTc = $('#heroTc'), toggle = $('#reelToggle');
  if (reel) {
    reel.addEventListener('playing', () => reel.classList.add('playing'));
    reel.addEventListener('timeupdate', () => { heroTc.textContent = tc(reel.currentTime); });
  }
  toggle.addEventListener('click', () => {
    if (reel.paused) { reel.play().catch(() => {}); toggle.classList.remove('paused'); toggle.setAttribute('aria-label', 'Pause the reel'); }
    else { reel.pause(); toggle.classList.add('paused'); toggle.setAttribute('aria-label', 'Play the reel'); }
  });
  if (reduce) { toggle.classList.add('paused'); toggle.setAttribute('aria-label', 'Play the reel'); }
  if (motion) {
    G.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero-stage', { yPercent: 6, ease: 'none' }, 0)
      .to('.hero-copy', { yPercent: -8, ease: 'none' }, 0);
    ST.create({ trigger: '#hero', start: 'top top', end: 'bottom top',
      onLeave: () => reel.pause(), onEnterBack: () => { if (!toggle.classList.contains('paused')) reel.play().catch(() => {}); } });
  }

  /* ---------- hero: rack focus (the sharp spot follows your eye) ---------- */
  const heroFrame = $('#heroFrame'), rack = $('#rack'), af = $('#af'), afLbl = $('#afLbl');
  const fp = { x: .5, y: .46, tx: .5, ty: .46 };
  let fpRaf = null, afLock = null;
  const sizeRack = () => rack.style.setProperty('--rr', Math.round(heroFrame.clientWidth * .26) + 'px');
  const stepFocus = () => {
    fp.x += (fp.tx - fp.x) * .14; fp.y += (fp.ty - fp.y) * .14;
    rack.style.setProperty('--mx', (fp.x * 100).toFixed(2) + '%');
    rack.style.setProperty('--my', (fp.y * 100).toFixed(2) + '%');
    af.style.transform = `translate(${(fp.x * heroFrame.clientWidth).toFixed(1)}px,${(fp.y * heroFrame.clientHeight).toFixed(1)}px)`;
    afLbl.textContent = 'AF · ' + (0.8 + (1 - fp.y) * 5.6).toFixed(1) + ' m';
    fpRaf = Math.abs(fp.tx - fp.x) + Math.abs(fp.ty - fp.y) > .0015 ? requestAnimationFrame(stepFocus) : null;
  };
  const aimFocus = (e, touch) => {
    const r = heroFrame.getBoundingClientRect();
    fp.tx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    fp.ty = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    heroFrame.classList.add('focusing'); af.classList.remove('locked');
    clearTimeout(afLock); afLock = setTimeout(() => af.classList.add('locked'), touch ? 380 : 260);   // focus confirmed
    if (!fpRaf) fpRaf = requestAnimationFrame(stepFocus);
  };
  if (!reduce) {
    sizeRack(); addEventListener('resize', sizeRack); stepFocus();
    heroFrame.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') aimFocus(e); });
    heroFrame.addEventListener('pointerleave', e => {
      if (e.pointerType !== 'mouse') return;
      heroFrame.classList.remove('focusing'); fp.tx = .5; fp.ty = .46; if (!fpRaf) fpRaf = requestAnimationFrame(stepFocus);
    });
    heroFrame.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' || e.target.closest('button')) return;
      aimFocus(e, true);
      setTimeout(() => heroFrame.classList.remove('focusing'), 1800);
    });
  }

  /* ---------- hero: format monitor (delivery-format guides) ---------- */
  const guide = $('#guide'), gLbl = $('#gLbl'), fmtBtns = $$('.fmt-mon button');
  const FMTS = { '2.39': [2.39, '2.39:1 · CINEMA'], '16:9': [16 / 9, '16:9 · BROADCAST · YOUTUBE'], '9:16': [9 / 16, '9:16 · REELS · STORIES'], '4:5': [4 / 5, '4:5 · FEED'] };
  let fmtNow = '2.39';
  const placeGuide = () => {
    const w = heroFrame.clientWidth, h = heroFrame.clientHeight, a = FMTS[fmtNow][0];
    let gw = w, gh = w / a;
    if (gh > h) { gh = h - 8; gw = gh * a; }
    guide.style.width = gw + 'px'; guide.style.height = gh + 'px';
    guide.classList.toggle('on', fmtNow !== '2.39');
    gLbl.textContent = FMTS[fmtNow][1];
  };
  fmtBtns.forEach(b => b.addEventListener('click', () => {
    fmtNow = b.dataset.fmt;
    fmtBtns.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    placeGuide();
  }));
  addEventListener('resize', placeGuide); placeGuide();

  /* ---------- nav ---------- */
  const prog = $('#progress');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('solid', y > 40);
    if (!$('#menu').classList.contains('open')) nav.classList.toggle('hide', y > lastY && y > innerHeight * .8);
    lastY = y;
    prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  }, { passive: true });
  const links = $$('.nav-side .l');
  const secObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.dataset.sec === e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['hero', 'studio', 'work', 'process', 'services', 'follow', 'brief'].forEach(id => secObs.observe($('#' + id)));
  new IntersectionObserver(es => nav.classList.toggle('quiet', es[0].isIntersecting), { rootMargin: '-30% 0px -30% 0px' }).observe($('#brief'));

  /* ---------- mobile menu ---------- */
  const burger = $('#burger'), menu = $('#menu');
  function closeMenu() {
    if (!menu.classList.contains('open')) return;
    menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu');
    if (lenis) lenis.start(); document.body.classList.remove('locked');
  }
  burger.addEventListener('click', () => {
    if (menu.classList.contains('open')) return closeMenu();
    menu.classList.add('open'); menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Close menu');
    nav.classList.remove('hide');
    if (lenis) lenis.stop(); document.body.classList.add('locked');
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- slate: scene one, take one ---------- */
  const d = new Date();
  $('#slateDate').textContent = `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
  let take = 0;
  const takeEl = $('#takeNo'), stick = $('#stickTop'), slate = $('#slate');
  function clap() {
    take++;
    if (!G || reduce) { takeEl.textContent = pad2(take); return; }
    G.timeline()
      .to(stick, { rotation: -16, duration: .35, ease: 'back.out(2)' })
      .to(stick, { rotation: 0, duration: .16, ease: 'power4.in' }, '+=.25')
      .add(() => { takeEl.textContent = pad2(take); sfx.play('clap'); })
      .fromTo(slate, { x: -4, rotation: -1.1 }, { x: 0, rotation: -1.5, duration: .5, ease: 'elastic.out(1.2,.3)', immediateRender: false })
      // a quick glint on the slate only, never over the page
      .fromTo('.slate-body', { boxShadow: '0 0 0 1px rgba(200,169,110,.7), 0 0 40px rgba(200,169,110,.25)' }, { boxShadow: '0 0 0 0px rgba(200,169,110,0), 0 0 0px rgba(200,169,110,0)', duration: .6, ease: 'power2.out', immediateRender: false }, '<');
  }
  $('#clapAgain').addEventListener('click', clap);
  if (motion) {
    G.from('.slate', { y: 80, rotation: -6, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.slate-sec', start: 'top 80%' } });
    ST.create({ trigger: '.slate-sec', start: 'top 55%', once: true, onEnter: clap });
  } else { take = 1; takeEl.textContent = '01'; }

  /* ---------- scroll reveals ---------- */
  if (motion) {
    $$('h2.split').forEach(h => {
      const w = splitWords(h);
      G.from(w, { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: h, start: 'top 85%' } });
    });
    $$('.eyebrow').forEach(e => G.from(e, { opacity: 0, x: -20, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: e, start: 'top 90%' } }));
    G.set('.reveal', { opacity: 0 });
    ST.batch('.reveal', { start: 'top 88%', onEnter: b => G.fromTo(b, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: .1, overwrite: true }) });

    const scrub = $('#scrub');
    const sw = splitWords(scrub, 'sw-o');
    sw.forEach(s => s.classList.add('sw'));
    G.to(sw, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: scrub, start: 'top 80%', end: 'bottom 40%', scrub: true } });

    G.from('.house-wrap', { y: 60, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.studio', start: 'top 75%' } });

    G.from('.featured-media', { clipPath: 'inset(12% 12% 12% 12% round 4px)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.featured', start: 'top 80%' } });
    G.from('.featured-copy > *', { y: 30, opacity: 0, duration: 1.1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.featured', start: 'top 70%' } });


    G.from('.svc li', { y: 50, opacity: 0, duration: 1.1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.svc', start: 'top 85%' } });

    // closing scene: the script page drops onto the desk, the slide mounts deal in
    G.timeline({ scrollTrigger: { trigger: '.closing', start: 'top 70%' } })
      .from('.dr-meta > *', { opacity: 0, y: 16, duration: .8, stagger: .06, ease: 'expo.out' }, 0)
      .from('.script', { y: 120, rotation: -7, opacity: 0, duration: 1.4, ease: 'expo.out' }, .1)
      .from('.polaroid', { y: -80, rotation: 18, opacity: 0, duration: 1.4, ease: 'expo.out' }, .35)
      .from('.script p', { opacity: 0, duration: .5, stagger: .09, ease: 'none' }, .55)
      .from('.tiles li', { y: 90, opacity: 0, rotation: i => [-14, 10, -8, 14][i], duration: 1.1, stagger: .08, ease: 'back.out(1.6)' }, .8);
    G.from('.sub', { y: 70, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.sub', start: 'top 85%' } });

    // end credits roll with the scroll
    // the screen holds while the credits roll through the frame, then the end card
    const credits = $('#credits'), crFrame = $('#crFrame'), crRoll = $('#crRoll'), crFinal = $('#crFinal'), crCue = $('#crCue'), crTc = $('#crTc');
    const crDist = () => crFrame.offsetHeight + crRoll.offsetHeight;
    G.timeline({ scrollTrigger: { trigger: credits, start: 'top top', end: () => '+=' + Math.round(crDist() * 1.25 + innerHeight * .5),
        pin: true, scrub: .6, invalidateOnRefresh: true, onUpdate: st => { crTc.textContent = tc(st.progress * 96); } } })
      .fromTo(crRoll, { y: () => crFrame.offsetHeight }, { y: () => -crRoll.offsetHeight, ease: 'none', duration: 1 }, 0)
      // the reel-change cue: two flashes in the corner before the last reel ends
      .to(crCue, { keyframes: [{ opacity: .9, duration: .012 }, { opacity: 0, duration: .02 }, { opacity: .9, duration: .012 }, { opacity: 0, duration: .02 }] }, .8)
      .fromTo(crFinal, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .2, ease: 'power2.out' }, .96)
      .add(() => {}, 1.2);
    ST.create({ trigger: credits, start: 'top 60%', onEnter: () => { $('#crRun').textContent = $('#runTime').textContent; },
      onUpdate: () => { $('#crRun').textContent = $('#runTime').textContent; } });
  } else {
    document.documentElement.classList.add('no-roll');
  }

  /* ---------- studio: night, and one room at a time in morning light ---------- */
  const rooms = $$('#rooms li'), house = $('#house'), days = $$('.h-day', house), pop = $('#roomPop');
  const hint = $('#houseHint'), hintTxt = $('span', hint), hintIcon = $('use', hint);
  const HW = 16.65, HH = 20.25;
  const hex = (cx, cy, k = 1.015) => {
    const w = HW * k, h = HH * k;
    return `polygon(${cx}% ${cy - h}%, ${cx + w}% ${cy - h / 2}%, ${cx + w}% ${cy + h / 2}%, ${cx}% ${cy + h}%, ${cx - w}% ${cy + h / 2}%, ${cx - w}% ${cy - h / 2}%)`;
  };
  // a real daytime render (set data-day="media/…" on #house) replaces the code-graded day
  if (house.dataset.day) {
    const probe = new Image();
    probe.onload = () => { days.forEach(d => { $('img', d).src = probe.src; }); house.classList.add('has-day'); };
    probe.src = house.dataset.day;
  }
  const nightHint = () => T(fine ? 'room.night.fine' : 'room.night.touch');
  hintTxt.textContent = nightHint();
  let current = null, layer = 0, sticky = false;
  function lightOn(li) {
    if (current === li && house.classList.contains('lit')) return;
    const cx = +li.dataset.x, cy = +li.dataset.y, i = rooms.indexOf(li);
    layer = 1 - layer;
    const next = days[layer], prev = days[1 - layer];
    next.style.transition = 'none'; next.classList.remove('on'); next.style.clipPath = hex(cx, cy); void next.offsetWidth; next.style.transition = '';
    next.classList.add('on'); prev.classList.remove('on');
    current = li;
    rooms.forEach(r => r.classList.toggle('on', r === li));
    house.classList.add('lit');
    pop.style.left = cx + '%';
    pop.style.top = (cy - HH + 4) + '%';
    $('#rpName').textContent = $('b', li).textContent;
    $('#rpDesc').textContent = li.querySelector('span:last-child').textContent;
    $('#rpTime').textContent = li.dataset.time;
    $('#rpNo').textContent = `ROOM ${pad2(i + 1)} / 07`;
    hintIcon.setAttribute('href', '#i-sun');
    hintTxt.textContent = T('room.morning', { r: $('b', li).textContent });
  }
  function lightOff() {
    if (sticky || !current) return;
    days.forEach(d => d.classList.remove('on'));
    house.classList.remove('lit');
    rooms.forEach(r => r.classList.remove('on'));
    hintIcon.setAttribute('href', '#i-moon');
    hintTxt.textContent = nightHint();
    current = null;
  }
  const roomAt = (x, y) => rooms.find(li => {
    const dx = Math.abs(x - li.dataset.x), dy = Math.abs(y - li.dataset.y);
    return dx <= HW && dy <= HH - dx * (HH / 2) / HW;
  });
  rooms.forEach(li => {
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.addEventListener('mouseenter', () => { sticky = false; lightOn(li); });
    li.addEventListener('focus', () => lightOn(li));
    li.addEventListener('blur', () => { sticky = false; lightOff(); });
    li.addEventListener('click', () => { if (!fine) { if (current === li) { sticky = false; lightOff(); } else { sticky = true; lightOn(li); } } });
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lightOn(li); } });
  });
  $('#rooms').addEventListener('mouseleave', lightOff);
  house.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = house.getBoundingClientRect();
    const li = roomAt((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100);
    if (li) lightOn(li); else lightOff();
  });
  house.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') lightOff(); });
  house.addEventListener('click', e => {
    if (fine) return;
    const r = house.getBoundingClientRect();
    const li = roomAt((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100);
    if (li && li !== current) { sticky = true; lightOn(li); } else { sticky = false; lightOff(); }
  });

  /* ---------- process ---------- */
  const steps = $$('#steps li'), imgs = $$('.stage-frame img'), cap = $('#stagecap'), no = $('#stageNo'), line = $('#stageLine');
  const setStep = k => {
    steps.forEach((s, i) => s.classList.toggle('on', i === k));
    imgs.forEach((m, i) => m.classList.toggle('on', i === k));
    cap.textContent = T('stage.from', { f: steps[k].dataset.cap });
    no.textContent = `STEP ${pad2(k + 1)} / 06`;
    line.style.transform = `scaleX(${(k + 1) / steps.length})`;
  };
  const stepObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setStep(steps.indexOf(e.target)); }), { rootMargin: '-45% 0px -54% 0px' });
  steps.forEach(s => stepObs.observe(s));
  if (motion) G.from('.stage', { opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.process-grid', start: 'top 80%' } });

  /* ---------- the director's reel: timeline + horizontal reel, one component ---------- */
  const dreel = $('#dreel'), view = $('#drView'), track = $('#drTrack'), slides = $$('.dr-slide', track);
  const NF = slides.length, tlList = $('#drTimeline'), idxEl = $('#drIndex'), drBar = $('#drBar');
  const films = slides.map((s, i) => ({ yt: s.dataset.yt, title: s.dataset.title, desc: s.dataset.desc, meta: `${s.dataset.cat} · ${s.dataset.dur}`, no: `FILM ${pad2(i + 1)} / ${pad2(NF)}` }));
  $('#drTotal').textContent = pad2(NF);
  tlList.innerHTML = '<span class="tl-fill" id="tlFill" aria-hidden="true"></span>' + slides.map((s, i) =>
    `<li><button class="tl-item" data-i="${i}" aria-label="${s.dataset.title}, ${s.dataset.cat}, ${s.dataset.dur}"><span class="tl-no">${pad2(i + 1)}</span><span class="tl-title">${s.dataset.title}</span><span class="tl-meta">${s.dataset.cat} · ${s.dataset.dur}</span></button></li>`).join('');
  idxEl.innerHTML = slides.map((s, i) => `<button data-i="${i}" aria-label="Film ${i + 1}: ${s.dataset.title}">${pad2(i + 1)}</button>`).join('');
  const tlItems = $$('.tl-item', tlList), idxItems = $$('button', idxEl), tlFill = $('#tlFill');
  const drPrev = $('#drPrev'), drNext = $('#drNext');
  let active = -1, pinST = null, step = 0, sw = 0;

  // living thumbnails: the film in the gate runs (slow push, flicker, timecode);
  // a slide with data-preview="media/clip.mp4" plays that clip on hover instead
  slides.forEach(s => {
    const pic = $('.dr-pic', s);
    const t = document.createElement('span'); t.className = 'dr-tc'; t.setAttribute('aria-hidden', 'true'); t.innerHTML = '<i></i><b>00:00:00:00</b>';
    pic.appendChild(t);
    if (s.dataset.preview) {
      const v = document.createElement('video');
      Object.assign(v, { muted: true, loop: true, playsInline: true, preload: 'none', className: 'dr-prev' });
      v.src = s.dataset.preview; pic.appendChild(v);
      const media = $('.dr-media', s);
      media.addEventListener('mouseenter', () => { if (s.classList.contains('on')) { pic.classList.add('previewing'); v.play().catch(() => {}); } });
      media.addEventListener('mouseleave', () => { pic.classList.remove('previewing'); v.pause(); });
    }
  });
  let liveTimer = null;
  function goLive(k) {
    if (reduce) return;
    slides.forEach((s, i) => $('.dr-pic', s).classList.toggle('live', i === k));
    clearInterval(liveTimer);
    const out = $('.dr-tc b', slides[k]), t0 = performance.now();
    liveTimer = setInterval(() => { out.textContent = tc((performance.now() - t0) / 1000); }, 1000 / 24);
  }
  const reelProxy = { p: 0 };

  function setActive(k) {
    k = Math.max(0, Math.min(NF - 1, k));
    if (k === active) return;
    if (active >= 0) sfx.play('tick');
    active = k;
    slides.forEach((s, i) => s.classList.toggle('on', i === k));
    tlItems.forEach((b, i) => { b.classList.toggle('on', i === k); b.setAttribute('aria-current', i === k ? 'true' : 'false'); });
    idxItems.forEach((b, i) => b.classList.toggle('on', i === k));
    $('#drNow').textContent = pad2(k + 1);
    drPrev.disabled = k === 0; drNext.disabled = k === NF - 1;
    goLive(k);
    const it = tlItems[k]; tlFill.style.height = Math.max(0, it.parentElement.offsetTop + 21 - 16) + 'px';
    if (idxItems[k] && idxEl.scrollWidth > idxEl.clientWidth) idxItems[k].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
  const setBar = p => { drBar.style.transform = `scaleX(${NF > 1 ? p / (NF - 1) : 1})`; };

  // pinned mode: page scroll drives the reel
  const layoutPinned = () => {
    const vw = view.clientWidth;
    sw = Math.round(Math.min(vw * .74, (innerHeight - 330) * 16 / 9, 980));
    view.style.setProperty('--sw', sw + 'px');
    step = sw + (parseFloat(getComputedStyle(track).columnGap) || 24);
  };
  const placePinned = p => { G.set(track, { x: view.clientWidth / 2 - sw / 2 - p * step }); setBar(p); setActive(Math.round(p)); };

  // native mode: the reel is its own horizontal scroller
  const nativeIndex = () => {
    const c = view.scrollLeft + view.clientWidth / 2;
    let best = 0, bd = 1e9;
    slides.forEach((s, i) => { const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - c); if (d < bd) { bd = d; best = i; } });
    return best;
  };
  view.addEventListener('scroll', () => {
    if (pinST) return;
    const m = view.scrollWidth - view.clientWidth;
    setBar(m > 0 ? view.scrollLeft / m * (NF - 1) : 0);
    setActive(nativeIndex());
  }, { passive: true });

  function goTo(k) {
    k = Math.max(0, Math.min(NF - 1, k));
    if (pinST) {
      const y = pinST.start + (k / (NF - 1)) * (pinST.end - pinST.start) + 1;
      if (lenis) lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: 'smooth' });
    } else {
      const s = slides[k];
      view.scrollTo({ left: s.offsetLeft - (view.clientWidth - s.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      setActive(k);
    }
  }
  tlItems.forEach(b => b.addEventListener('click', () => goTo(+b.dataset.i)));
  idxItems.forEach(b => b.addEventListener('click', () => goTo(+b.dataset.i)));
  drPrev.addEventListener('click', () => goTo(active - 1));
  drNext.addEventListener('click', () => goTo(active + 1));
  view.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(NF - 1); }
  });

  // drag with the mouse (touch keeps native swiping)
  let drag = null;
  view.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, sy: window.scrollY, sl: view.scrollLeft, moved: false };
  });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) { drag.moved = true; view.classList.add('dragging'); }
    if (!drag.moved) return;
    if (pinST) {
      const perPx = (pinST.end - pinST.start) / ((NF - 1) * step);
      const y = drag.sy - dx * perPx;
      if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
    } else view.scrollLeft = drag.sl - dx;
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    const was = drag.moved; view.classList.remove('dragging');
    if (was && !pinST) goTo(nativeIndex());
    setTimeout(() => { drag = null; }, 0);
  });

  // a click on a neighbour brings it forward; a click on the active film plays it
  slides.forEach((s, i) => $('.dr-media', s).addEventListener('click', e => {
    if (drag && drag.moved) { e.preventDefault(); return; }
    if (i !== active) goTo(i); else openReelFilm(i);
  }));

  if (motion) {
    G.matchMedia().add('(min-width: 1000px)', () => {
      dreel.classList.add('is-pinned');
      layoutPinned();
      reelProxy.p = 0; placePinned(0);
      pinST = ST.create({
        trigger: dreel, start: 'top top', end: () => '+=' + Math.round((NF - 1) * innerHeight * .6),
        pin: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1,
        snap: { snapTo: 1 / (NF - 1), duration: { min: .25, max: .7 }, delay: .1, ease: 'power2.inOut' },
        onUpdate: self => G.to(reelProxy, { p: self.progress * (NF - 1), duration: .55, ease: 'power3.out', overwrite: true, onUpdate: () => placePinned(reelProxy.p) }),
        onRefresh: self => { layoutPinned(); reelProxy.p = self.progress * (NF - 1); placePinned(reelProxy.p); }
      });
      const onResize = () => { layoutPinned(); placePinned(reelProxy.p); };
      addEventListener('resize', onResize);
      return () => {
        removeEventListener('resize', onResize);
        pinST.kill(); pinST = null;
        dreel.classList.remove('is-pinned');
        G.set(track, { clearProps: 'x' });
        view.style.removeProperty('--sw');
        setActive(nativeIndex());
      };
    });
    G.from('.dreel-head, .dreel-body, .dr-foot', { opacity: 0, y: 40, duration: 1.1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: dreel, start: 'top 85%' } });
  }
  if (active < 0) setActive(0);

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) $$('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px,${(e.clientY - r.top - r.height / 2) * .25}px)`; });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  /* ---------- film player ---------- */
  const lb = $('#lb'), fr = $('#lbFrame'), box = $('#lbBox'), lbNav = $('#lbNav');
  let wasPlaying = false, lbIndex = null;
  function showFilm(f) {
    box.classList.toggle('r43', f.r === '43');
    fr.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${f.yt}?autoplay=1&rel=0&modestbranding=1" title="${f.title}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    $('#lbTitle').textContent = f.title;
    $('#lbNo').textContent = f.no || 'FILM';
    $('#lbDesc').textContent = f.desc || '';
    $('#lbMeta').textContent = f.meta || '';
    $('#lbLink').href = 'https://www.youtube.com/watch?v=' + f.yt;
    if (G && !reduce) G.fromTo('.lb-top, .lb-bottom', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .6, ease: 'expo.out' });
  }
  function openModal() {
    if (lb.open) return;
    wasPlaying = reel && !reel.paused; if (reel) reel.pause();
    if (lenis) lenis.stop();
    lb.showModal();
  }
  function openReelFilm(i) {
    lbIndex = (i + NF) % NF;
    lbNav.hidden = false;
    showFilm(films[lbIndex]);
    openModal();
  }
  function openSingle(el) {
    lbIndex = null; lbNav.hidden = true;
    showFilm({ yt: el.dataset.yt, title: el.dataset.title, r: el.dataset.r, desc: el.dataset.desc, meta: el.dataset.meta });
    openModal();
  }
  lb.addEventListener('close', () => { fr.innerHTML = ''; if (lenis) lenis.start(); if (wasPlaying) reel.play().catch(() => {}); if (lbIndex !== null) goTo(lbIndex); });
  $('#lbClose').addEventListener('click', () => lb.close());
  $('#lbPrev').addEventListener('click', () => { if (lbIndex !== null) openReelFilm(lbIndex - 1); });
  $('#lbNext').addEventListener('click', () => { if (lbIndex !== null) openReelFilm(lbIndex + 1); });
  lb.addEventListener('keydown', e => {
    if (lbIndex === null) return;
    if (e.key === 'ArrowRight') openReelFilm(lbIndex + 1);
    if (e.key === 'ArrowLeft') openReelFilm(lbIndex - 1);
  });
  lb.addEventListener('click', e => { if (e.target.classList.contains('lb')) lb.close(); });
  $$('[data-yt]').forEach(el => {
    if (el.classList.contains('dr-slide')) return; // the reel handles its own films
    el.addEventListener('click', () => openSingle(el));
  });

  /* ---------- project submission ---------- */
  const form = $('#briefForm'), note = $('#formNote'), sig = $('#sigLine'), stamp = $('#stamp');
  $('#subDate').textContent = $('#slateDate').textContent;
  $('#subNo').textContent = String(Math.floor(Date.now() / 864e5) % 10000).padStart(4, '0');
  form.elements.name.addEventListener('input', () => { sig.textContent = form.elements.name.value.trim() || '\u00a0'; });
  const check = (name, ok) => { form.elements[name].closest('.sf').classList.toggle('invalid', !ok); return ok; };
  const validate = () => {
    const f = form.elements;
    const a = check('name', !!f.name.value.trim());
    const b = check('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim()));
    const c = check('what', !!f.what.value.trim());
    return a && b && c;
  };
  ['name', 'email', 'what'].forEach(n => form.elements[n].addEventListener('input', () => {
    if (form.elements[n].closest('.sf').classList.contains('invalid')) validate();
  }));
  const submitBtn = $('button[type=submit]', form);
  let sending = false;
  const stampIt = after => {
    if (G && !reduce) G.fromTo(stamp, { opacity: 0, scale: 2.2, rotation: -24 }, { opacity: .95, scale: 1, rotation: -14, duration: .45, ease: 'power4.in', onComplete: () => { G.fromTo(form, { x: -3 }, { x: 0, duration: .4, ease: 'elastic.out(1.2,.3)' }); if (after) setTimeout(after, 450); } });
    else { stamp.style.opacity = .95; stamp.style.transform = 'rotate(-14deg)'; if (after) after(); }
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (sending) return;
    if (!validate()) { note.textContent = T('form.fix'); note.classList.add('on'); $('.invalid input, .invalid textarea', form).focus(); return; }
    const f = form.elements;
    const data = {
      no: $('#subNo').textContent, title: f.title.value.trim() || T('form.untitled'), name: f.name.value.trim(), email: f.email.value.trim(),
      company: f.company.value.trim(), timing: form.querySelector('[name=timing]:checked').value, what: f.what.value.trim(), website: f.website ? f.website.value : ''
    };
    sending = true; submitBtn.disabled = true; note.textContent = T('form.sending'); note.classList.add('on');
    let delivered = false;
    try {
      const r = await fetch('/api/brief', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      delivered = r.ok && (await r.json().catch(() => ({}))).ok === true;
    } catch (_) { delivered = false; }
    sending = false; submitBtn.disabled = false;
    if (delivered) {
      note.textContent = T('form.sent');
      stampIt();
      form.reset(); sig.textContent = ' ';
      return;
    }
    // the sender is not switched on (or failed): fall back to the visitor's email app
    const body = `PROJECT SUBMISSION No. ${data.no}\n\nWorking title: ${data.title}\nName: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company}\nNeeded by: ${data.timing}\n\nLogline:\n${data.what}`;
    note.textContent = T('form.mailto');
    stampIt(() => { location.href = 'mailto:dawood@unmadefilmsai.com?subject=' + encodeURIComponent(`Project submission: ${data.title} (${data.name})`) + '&body=' + encodeURIComponent(body); });
  });

  /* ---------- running time on the page ---------- */
  const rt = $('#runTime'), t0 = Date.now();
  setInterval(() => { const s2 = Math.floor((Date.now() - t0) / 1000); rt.textContent = `${pad2(Math.floor(s2 / 60))}:${pad2(s2 % 60)}`; }, 1000);

  /* ---------- Amman local time ---------- */
  const lt = $('#localTime'), st = $('#stripTime');
  const tick = () => { try { const t = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Amman', hour: '2-digit', minute: '2-digit' }).format(new Date()); lt.textContent = t; if (st) st.textContent = t; } catch (_) {} };
  tick(); setInterval(tick, 30000);

  /* ---------- camera strip: the focus scale under the lens ---------- */
  const csTrack = $('#csTrack'), csRuler = $('.cs-ruler');
  const focus = { pull: motion ? 360 : 0 };
  const placeRuler = () => {
    if (!csTrack || !csRuler) return;
    const unit = 45, set = 12 * unit;                         // one copy of the scale
    const base = csRuler.clientWidth / 2 - set - 2;           // centre the middle copy's "∞" under the index
    const drift = (window.scrollY * .12) % set;               // turns as you scroll, looping seamlessly
    csTrack.style.setProperty('--fx', (base - drift + focus.pull) + 'px');
  };
  addEventListener('scroll', placeRuler, { passive: true });
  addEventListener('resize', placeRuler);
  placeRuler();
  // the focus pull: the scale sweeps in and settles once the opening is done
  if (motion) {
    const pull = () => G.to(focus, { pull: 0, duration: 1.8, ease: 'expo.out', onUpdate: placeRuler });
    if (document.getElementById('loader')) {
      const wait = setInterval(() => { if (!document.getElementById('loader')) { clearInterval(wait); pull(); } }, 120);
      setTimeout(() => { clearInterval(wait); pull(); }, 8000);
    } else pull();
  }

  addEventListener('load', () => { if (ST) ST.refresh(); });
})();
