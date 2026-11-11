import { initPage } from '../core/layout.js';
import { $, $$, fmt, fitCanvas, cssVar, onRedraw } from '../core/util.js';

initPage();

// ================= kamera =================
{
  const canvas = $('#proj');
  function draw() {
    const { ctx, w, h } = fitCanvas(canvas, 280);
    const d = Number($('#dist').value) / 10, y = Number($('#hei').value) / 100 * 1.6;   // odleglosc 1,5..10; wysokosc -1,6..1,6
    ctx.clearRect(0, 0, w, h);
    const split = w * 0.64, mid = h / 2, ex = 34, unit = (split - ex - 30) / 10, vs = 62;  // vs: piksele na jednostke wysokosci
    const sx = ex + unit, gx = ex + d * unit, gy = mid - y * vs;
    const py = y / d;                              // miejsce na ekranie: wysokosc podzielona przez odleglosc
    // widok z boku
    ctx.strokeStyle = cssVar('--line'); ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(ex, mid); ctx.lineTo(split - 10, mid); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = cssVar('--muted'); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx, mid - 1.75 * vs); ctx.lineTo(sx, mid + 1.75 * vs); ctx.stroke();
    ctx.strokeStyle = cssVar('--on'); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ex, mid); ctx.lineTo(gx, gy); ctx.stroke();
    ctx.fillStyle = cssVar('--ink'); ctx.beginPath(); ctx.arc(ex, mid, 7, 0, 7); ctx.fill();
    ctx.fillStyle = cssVar('--sand'); ctx.beginPath(); ctx.arc(gx, gy, 10, 0, 7); ctx.fill();
    ctx.fillStyle = cssVar('--on'); ctx.beginPath(); ctx.arc(sx, mid - py * vs, 5, 0, 7); ctx.fill();
    ctx.fillStyle = cssVar('--muted'); ctx.font = '11px ' + cssVar('--font'); ctx.textAlign = 'center';
    ctx.fillText('kamera', ex, mid + 22); ctx.fillText('ekran', sx, mid + 1.75 * vs + 14); ctx.fillText('ziarnko', gx, gy - 18);
    // to, co trafia na ekran
    const bx = split + 14, bw = w - bx - 12, bh = 3.5 * vs * 0.92, by = mid - bh / 2;
    ctx.fillStyle = cssVar('--code-bg'); ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.clip();
    ctx.fillStyle = cssVar('--sand'); ctx.beginPath(); ctx.arc(bx + bw / 2, mid - py * (bh / 2.4), Math.max(2, 26 / d), 0, 7); ctx.fill();
    ctx.restore();
    ctx.fillStyle = cssVar('--muted'); ctx.fillText('obraz na ekranie', bx + bw / 2, by + bh + 14);
    $('#projSay').innerHTML = `Ziarnko jest na wysokości <b>${fmt(y, 1)}</b> i w odległości <b>${fmt(d, 1)}</b> od kamery. Dzielimy jedno przez drugie: na ekranie wypada na wysokości <b>${fmt(py)}</b>. ` +
      (d > 6 ? 'Jest daleko, więc ląduje blisko środka i jest malutkie.' : d < 2.5 ? 'Jest blisko, więc jest duże i łatwo „ucieka" poza krawędź ekranu.' : 'Odsuń je dalej: zbliży się do środka i zmaleje, choć jego prawdziwa wysokość się nie zmienia.');
  }
  $('#dist').oninput = draw; $('#hei').oninput = draw;
  onRedraw(draw); draw();
}

// ================= szachownica pikseli =================
{
  const canvas = $('#grid');
  let cx = 0.5, cy = 0.5, drag = false, hover = null;
  const RAD = 0.2, SAND = [214, 164, 85], BG = [27, 34, 48];
  const inside = (r, c, n) => Math.hypot((c + 0.5) / n - cx, (r + 0.5) / n - cy) <= RAD;
  function draw() {
    const n = Number($('#res').value);
    const { ctx, w } = fitCanvas(canvas, canvas.clientWidth || 340);
    const s = w / n;
    let lit = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const on = inside(r, c, n); if (on) lit++;
      ctx.fillStyle = `rgb(${(on ? SAND : BG).join(',')})`;
      ctx.fillRect(c * s, r * s, s + 0.5, s + 0.5);
    }
    if (n <= 30) { ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; for (let i = 1; i < n; i++) { ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, w); ctx.moveTo(0, i * s); ctx.lineTo(w, i * s); ctx.stroke(); } }
    ctx.setLineDash([5, 5]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx * w, cy * w, RAD * w, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    if (hover) { ctx.strokeStyle = cssVar('--electron'); ctx.lineWidth = 3; ctx.strokeRect(hover.c * s, hover.r * s, s, s); }
    $('#resTxt').textContent = `${n} na ${n}`;
    let txt = `Przerywany okrąg to ziarnko, jakie <b>chcielibyśmy</b> narysować. Kolorowe kratki to to, co <b>da się</b> zapalić: ${lit} z ${n * n} pikseli. ` +
      (n < 12 ? 'Przy tak dużych kratkach ziarnko wygląda jak klocek.' : n > 34 ? 'Przy tak drobnych kratkach schodki prawie znikają. Dlatego ekrany o dużej rozdzielczości wyglądają gładko.' : '');
    if (hover) {
      const on = inside(hover.r, hover.c, n), col = on ? SAND : BG, a = (hover.r * n + hover.c) * 3;
      txt += `<br><br><b>Piksel w wierszu ${hover.r}, kolumnie ${hover.c}.</b> Jego środek leży ${on ? 'wewnątrz' : 'poza'} ziarnka. W buforze obrazu zajmuje skrytki od ${a} do ${a + 2} i leżą w nich liczby: czerwony ${col[0]}, zielony ${col[1]}, niebieski ${col[2]}.`;
    }
    $('#gridSay').innerHTML = txt;
  }
  const at = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  canvas.addEventListener('pointerdown', e => {
    drag = true; canvas.setPointerCapture(e.pointerId); [cx, cy] = at(e);
    const n = Number($('#res').value);                       // na dotyku nie ma "najechania": pokaz kratke pod palcem
    hover = { r: Math.min(n - 1, Math.floor(cy * n)), c: Math.min(n - 1, Math.floor(cx * n)) };
    draw();
  });
  canvas.addEventListener('pointermove', e => {
    const [x, y] = at(e), n = Number($('#res').value);
    if (drag) { cx = Math.min(1, Math.max(0, x)); cy = Math.min(1, Math.max(0, y)); }
    hover = x >= 0 && x < 1 && y >= 0 && y < 1 ? { r: Math.floor(y * n), c: Math.floor(x * n) } : null;
    draw();
  });
  canvas.addEventListener('pointerup', () => { drag = false; });
  canvas.addEventListener('pointerleave', () => { if (!drag) { hover = null; draw(); } });
  $('#res').oninput = () => { hover = null; draw(); };
  onRedraw(draw); draw();
}

// ================= trzy lampki =================
{
  const canvas = $('#sub');
  function draw() {
    const rgb = ['cr', 'cg', 'cb'].map(id => Number($('#' + id).value));
    ['tr', 'tg', 'tb'].forEach((id, i) => { $('#' + id).textContent = rgb[i]; });
    $('#far').style.background = `rgb(${rgb.join(',')})`;
    const { ctx, w, h } = fitCanvas(canvas, 230);
    ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, w, h);
    const cols = 7, rows = 4, pw = w / cols, ph = h / rows, sw = pw * 0.24;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) for (let k = 0; k < 3; k++) {
      const v = rgb[k], col = [0, 0, 0]; col[k] = v;
      ctx.fillStyle = `rgb(${col.join(',')})`;
      ctx.beginPath(); ctx.roundRect(c * pw + pw * 0.08 + k * (sw + pw * 0.04), r * ph + ph * 0.1, sw, ph * 0.8, 4); ctx.fill();
    }
  }
  $$('#cr, #cg, #cb').forEach(s => { s.oninput = draw; });
  $$('[data-c]').forEach(b => { b.onclick = () => { b.dataset.c.split(',').forEach((v, i) => { $('#' + ['cr', 'cg', 'cb'][i]).value = v; }); draw(); }; });
  onRedraw(draw); draw();
}
