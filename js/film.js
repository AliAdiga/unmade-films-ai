(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const films = window.UF_FILMS || [], steps = window.UF_STEPS || [];
  const pad2 = n => String(n).padStart(2, '0');

  /* ---------- which film ---------- */
  const slug = new URLSearchParams(location.search).get('f');
  let i = films.findIndex(f => f.slug === slug);
  if (i < 0) i = 0;
  const f = films[i], next = films[(i + 1) % films.length];

  document.title = `${f.title} · Behind the frame · Unmade Films AI`;
  $('#fpNo').textContent = `FILM ${pad2(i + 1)} / ${pad2(films.length)}`;
  $('#fpCat').textContent = f.cat;
  $('#fpTitle').textContent = f.title;
  $('#fpDur').textContent = f.dur;
  $('#fpDesc').textContent = f.desc;
  $('#fpEdge').textContent = `UF 5219 · ▸ ${pad2(i + 1)}A · ${f.cat.toUpperCase()}`;
  $('#shSlate').textContent = `${f.title.toUpperCase()} · BEHIND THE FRAME`;
  const screen = $('#fpScreen'), poster = $('#fpPoster');
  screen.style.setProperty('--ar', f.ratio);
  poster.src = f.poster; poster.alt = f.alt;

  // the film plays in place
  $('#fpPlay').addEventListener('click', () => {
    screen.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${f.yt}?autoplay=1&rel=0&modestbranding=1" title="${f.title}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  });

  /* ---------- before / after sliders ---------- */
  const wire = ba => {
    const r = $('.ba-range', ba);
    const set = v => ba.style.setProperty('--pos', v + '%');
    r.addEventListener('input', () => set(r.value));
    set(r.value);
  };
  $('#gradeAfter').src = f.poster; $('#gradeAfter').alt = f.alt + ', graded';
  $('#gradeBefore').src = f.poster;
  $('#baGrade').style.aspectRatio = f.ratio;
  wire($('#baGrade'));
  if (f.sketch) {
    $('#fpSketchSec').hidden = false;
    $('#sketchAfter').src = f.poster; $('#sketchAfter').alt = f.alt;
    $('#sketchBefore').src = f.sketch.src;
    wire($('#baSketch'));
  }

  /* ---------- stills + steps ---------- */
  if (f.stills.length) {
    $('#fpStillsSec').hidden = false;
    $('#fpStills').innerHTML = f.stills.map(s =>
      `<figure class="fp-still${s.tall ? ' tall' : ''}"><img src="${s.src}" alt="${s.cap}" loading="lazy"><figcaption><span class="tc">${pad2(s.step)}</span><span>${s.cap}</span></figcaption></figure>`).join('');
  }
  const marked = new Set(f.stills.map(s => s.step));
  $('#fpSteps').innerHTML = steps.map((s, k) => `<li class="${marked.has(k + 1) ? 'has' : ''}"><b>${pad2(k + 1)}</b>${s}</li>`).join('');

  /* ---------- next film ---------- */
  const nl = $('#fpNext');
  nl.href = `film.html?f=${next.slug}`;
  $('#fpNextTitle').textContent = next.title;
  $('#fpNextImg').src = next.poster;

  /* ---------- shutter: open onto the film, close before leaving ---------- */
  const shutter = $('#shutter'), shSvg = $('#shSvg'), shIris = $('#shIris'), shBlades = $('#shBlades'), shMark = $('#shMark');
  const drawIris = (a, rotDeg) => {
    const W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2 + 40;
    shSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const r0 = rotDeg * Math.PI / 180;
    const v = [...Array(6)].map((_, k) => { const t = r0 + k * Math.PI / 3; return [cx + a * Math.cos(t), cy + a * Math.sin(t)]; });
    shIris.setAttribute('d', `M-10 -10H${W + 10}V${H + 10}H-10Z` + (a > .5 ? `M${v.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}Z` : ''));
    let d = '';
    if (a > .5) for (let k = 0; k < 6; k++) {
      const p = v[k], q = v[(k + 1) % 6], L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, ux = (q[0] - p[0]) / L, uy = (q[1] - p[1]) / L;
      d += `M${q[0].toFixed(1)} ${q[1].toFixed(1)}L${(q[0] + ux * R * 1.6).toFixed(1)} ${(q[1] + uy * R * 1.6).toFixed(1)}`;
    }
    shBlades.setAttribute('d', d);
  };
  const tween = (from, to, dur, ease, step, done) => {
    const t0 = performance.now();
    const f = now => { const p = Math.min(1, (now - t0) / dur), e = ease(p); step(from + (to - from) * e, e); if (p < 1) requestAnimationFrame(f); else if (done) done(); };
    requestAnimationFrame(f);
  };
  const inCubic = t => t * t * t, outCubic = t => 1 - Math.pow(1 - t, 3);
  const open = () => {
    if (reduce) { shutter.classList.remove('on'); return; }
    const R = Math.hypot(innerWidth, innerHeight) / 2 + 40;
    drawIris(0, 60); shutter.classList.add('drawn');
    setTimeout(() => {
      shMark.style.transition = 'opacity .3s'; shMark.style.opacity = '0';
      tween(0, R, 800, outCubic, (a, e) => drawIris(a, 60 + 80 * e), () => shutter.classList.remove('on'));
    }, 420);
  };
  const closeTo = url => {
    if (reduce) { location.href = url; return; }
    const R = Math.hypot(innerWidth, innerHeight) / 2 + 40;
    shMark.style.opacity = '0'; shutter.classList.add('on', 'drawn'); drawIris(R, 0);
    tween(R, 0, 600, inCubic, (a, e) => drawIris(a, 60 * e), () => { shMark.style.opacity = '1'; setTimeout(() => { location.href = url; }, 200); });
  };
  document.querySelectorAll('.to-page').forEach(a => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault(); closeTo(a.getAttribute('href'));
  }));
  addEventListener('pageshow', ev => { if (ev.persisted) open(); });
  open();
})();
