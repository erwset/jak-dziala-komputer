// Drobne pomocniki uzywane wszedzie.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function fill(node, attrs, children) {
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') node.setAttribute('class', v);
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else node.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}
export const el = (tag, attrs, ...ch) => fill(document.createElement(tag), attrs, ch);
export const svg = (tag, attrs, ...ch) => fill(document.createElementNS('http://www.w3.org/2000/svg', tag), attrs, ch);

// Liczba po polsku: przecinek dziesietny, prawdziwy minus.
export const fmt = (n, d = 2) => {
  const s = Number(n).toFixed(d);
  return (Object.is(Number(s), -0) ? s.replace('-', '') : s).replace('.', ',').replace('-', '−');
};
export const big = n => Math.round(n).toLocaleString('pl-PL');
export const bin = (n, bits = 8) => (n >>> 0).toString(2).padStart(bits, '0').slice(-bits);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Canvas 2D dopasowany do szerokosci kontenera i gestosci pikseli. Zwraca {ctx,w,h}.
export function fitCanvas(canvas, height) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || canvas.parentElement.clientWidth;
  const h = height || canvas.clientHeight || 300;
  canvas.style.height = h + 'px';
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// Wywoluje cb przy zmianie motywu lub rozmiaru okna (do przerysowania canvasow).
export function onRedraw(cb) {
  window.addEventListener('resize', cb);
  window.addEventListener('cw-theme', cb);
}

// Petla animacji, ktora dziala tylko gdy element jest widoczny na ekranie.
export function loopWhileVisible(node, fn) {
  let visible = false, last = 0, raf = 0;
  const tick = t => {
    if (!visible) { raf = 0; return; }
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    fn(dt, t / 1000);
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }).observe(node);
}
