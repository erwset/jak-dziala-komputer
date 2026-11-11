import { initPage } from '../core/layout.js';
import { $, $$, el, fmt, fitCanvas, cssVar, onRedraw, loopWhileVisible } from '../core/util.js';

initPage();

const G = 6, F = 6;
const NAMES = ['lewo–prawo', 'wysokość', 'przód–tył', 'prędkość w bok', 'prędkość w górę', 'prędkość w przód'];
const mem = new Float32Array(G * F);   // cala "pamiec": 36 liczb
let sel = 19, playing = false;

function reset() {
  mem.fill(0);
  for (let g = 0; g < G; g++) { mem[g * F] = -1.5 + g * 0.6; mem[g * F + 1] = 0.5 + ((g * 2) % 3) * 0.65; }
}
reset();

// --- tabela skrytek ---
const table = $('#cells');
table.append(el('tr', {}, el('th'), NAMES.map(n => el('th', {}, n))));
const tds = [];
for (let g = 0; g < G; g++) {
  const tr = el('tr', {}, el('td', { class: 'name' }, 'ziarnko ' + g));
  for (let f = 0; f < F; f++) {
    const i = g * F + f;
    const td = el('td', { class: 'cell num', onclick: () => { sel = i; refresh(); } }, el('small', {}, 'nr ' + i), el('span'));
    tds.push(td); tr.append(td);
  }
  table.append(tr);
}

const pl = n => (n === 1 ? 'leży 1 ziarnko' : n >= 2 && n <= 4 ? `leżą ${n} ziarnka` : `leży ${n} ziaren`);
function refresh() {
  const g = Math.floor(sel / F), f = sel % F;
  tds.forEach((td, i) => {
    td.lastChild.textContent = fmt(mem[i]);
    td.classList.toggle('sel', i === sel);
    td.parentElement.classList.toggle('g', Math.floor(i / F) === g);
  });
  const before = g === 0 ? 'bo jest pierwsze i nic przed nim nie leży' : `bo przed nim ${pl(g)} po 6 skrytek`;
  $('#say').innerHTML = `<b>Ziarnko numer ${g}</b> zajmuje skrytki od ${g * F} do ${g * F + 5}. Zaczyna się w skrytce ${g * F}, ${before}. ` +
    `Zaznaczona <b>skrytka ${sel}</b> to jego „${NAMES[f]}" i leży w niej liczba <b>${fmt(mem[sel])}</b>.`;
  draw();
}

// --- widok z boku ---
const canvas = $('#view');
const W = 2.2, H = 3.2;      // zakres swiata: x od -W do W, wysokosc od 0 do H
function draw() {
  const { ctx, w, h } = fitCanvas(canvas, window.innerWidth < 560 ? 240 : 340);
  const X = x => (x + W) / (2 * W) * w, Y = y => h - 24 - y / H * (h - 44);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = cssVar('--line'); ctx.fillRect(0, Y(0), w, 3);
  ctx.font = '12px ' + cssVar('--mono'); ctx.textAlign = 'center';
  const g0 = Math.floor(sel / F);
  for (let g = 0; g < G; g++) {
    const x = X(mem[g * F]), y = Y(mem[g * F + 1]) - 9;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fillStyle = cssVar('--sand'); ctx.fill();
    if (g === g0) { ctx.lineWidth = 3; ctx.strokeStyle = cssVar('--electron'); ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.stroke(); }
    ctx.fillStyle = cssVar('--muted'); ctx.fillText(g, x, y - 20);
  }
}
canvas.addEventListener('click', e => {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * 2 * W - W;
  let best = 0;
  for (let g = 1; g < G; g++) if (Math.abs(mem[g * F] - x) < Math.abs(mem[best * F] - x)) best = g;
  sel = best * F + 1;
  refresh();
});

// --- czas: kazde ziarnko dostaje troche predkosci w dol i przesuwa sie o predkosc ---
function step(dt) {
  for (let g = 0; g < G; g++) {
    const k = g * F;
    mem[k + 4] -= 4 * dt;
    mem[k] += mem[k + 3] * dt; mem[k + 1] += mem[k + 4] * dt; mem[k + 2] += mem[k + 5] * dt;
    if (mem[k + 1] < 0) { mem[k + 1] = 0; mem[k + 4] = Math.abs(mem[k + 4]) > 0.4 ? -mem[k + 4] * 0.6 : 0; mem[k + 3] *= 0.8; }
    if (Math.abs(mem[k]) > W - 0.1) { mem[k] = Math.sign(mem[k]) * (W - 0.1); mem[k + 3] *= -0.7; }
  }
}
loopWhileVisible(canvas, dt => { if (playing) { step(dt); refresh(); } });

$$('[data-d]').forEach(b => { b.onclick = () => { mem[sel] += Number(b.dataset.d); refresh(); }; });
$('#play').onclick = e => { playing = !playing; e.target.textContent = playing ? 'Zatrzymaj czas' : 'Puść czas'; };
$('#toss').onclick = () => {
  for (let g = 0; g < G; g++) { mem[g * F + 3] = (Math.random() - 0.5) * 2; mem[g * F + 4] = 2.5 + Math.random() * 2; }
  if (!playing) $('#play').click();
};
$('#reset').onclick = () => { reset(); if (playing) $('#play').click(); refresh(); };

onRedraw(draw);
refresh();
