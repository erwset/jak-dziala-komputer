import { initPage } from '../core/layout.js';
import { $, $$, fmt, fitCanvas, cssVar, onRedraw } from '../core/util.js';

initPage();

const GRAV = 0.05, TOP = 2.2;
let h, v, h0, v0, drawn, trail, step, frame, timer = null;   // v: predkosc w gore (ujemna = w dol)

function reset() {
  h = h0 = drawn = 2; v = v0 = 0; trail = []; step = 0; frame = 1;
  say('Ziarnko wisi na wysokości 2,00 i jeszcze się nie rusza. Klikaj „Następny krok" i patrz, która liczba się zmienia.');
  refresh();
}

const speed = x => (Math.abs(x) < 0.0005 ? '0,00 (stoi)' : `${fmt(Math.abs(x))} ${x < 0 ? 'w dół' : 'w górę'}`);
const say = html => { $('#say').innerHTML = html; };

function next() {
  if (step === 0) {
    const before = v; v -= GRAV;
    say(`<b>Przyspiesz.</b> Grawitacja dokłada 0,05 prędkości w dół. Prędkość była: ${speed(before)}. Teraz jest: <b>${speed(v)}</b>. Wysokość jeszcze się nie zmieniła.`);
    flash('#rv');
  } else if (step === 1) {
    const before = h; h += v;
    say(`<b>Przesuń.</b> Ziarnko zmienia wysokość o swoją prędkość (${speed(v)}). Wysokość była ${fmt(before)}, teraz jest <b>${fmt(h)}</b>. Na ekranie dalej widać stary obraz.`);
    flash('#rh');
  } else if (step === 2) {
    if (h < 0) {
      const vb = v, hb = h;
      h = 0; v = Math.abs(v) < 0.08 ? 0 : -v * 0.6;
      say(`<b>Sprawdź podłogę.</b> Wysokość ${fmt(hb)} jest poniżej zera, czyli pod podłogą. Stawiamy ziarnko na podłodze (wysokość 0,00) i odwracamy prędkość, zostawiając z niej nieco ponad połowę: było ${speed(vb)}, jest <b>${speed(v)}</b>.`);
      flash('#rv'); flash('#rh');
    } else say(`<b>Sprawdź podłogę.</b> Wysokość ${fmt(h)} nie jest mniejsza od zera, więc ziarnko jest nad podłogą. Nic nie trzeba poprawiać.`);
  } else {
    trail.push(drawn); if (trail.length > 40) trail.shift();
    drawn = h;
    say(`<b>Narysuj.</b> Liczby są gotowe, więc komputer rysuje kropkę na wysokości ${fmt(h)}. Klatka ${frame} gotowa. Następna zaczyna od tych liczb.`);
  }
  step++;
  if (step === 4) { step = 0; frame++; h0 = h; v0 = v; }
  refresh();
}

function flash(sel) { const n = $(sel); n.classList.remove('changed'); void n.offsetWidth; n.classList.add('changed'); }

function refresh() {
  $('#v0').textContent = speed(v0); $('#v1').textContent = speed(v);
  $('#h0').textContent = fmt(h0); $('#h1').textContent = fmt(h);
  $('#fno').textContent = frame;
  $$('#todo li').forEach((li, i) => { li.classList.toggle('now', i === step); li.classList.toggle('done', i < step); });
  draw();
}

const canvas = $('#view');
function draw() {
  const { ctx, w, h: ch } = fitCanvas(canvas, window.innerWidth < 560 ? 270 : 380);
  const Y = y => ch - 30 - (y / TOP) * (ch - 60), x = w / 2 + 20;
  ctx.clearRect(0, 0, w, ch);
  ctx.font = '11px ' + cssVar('--mono'); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let t = 0; t <= 2; t += 0.5) {            // podzialka wysokosci
    ctx.fillStyle = cssVar('--muted'); ctx.fillText(fmt(t, 1), 40, Y(t));
    ctx.fillStyle = cssVar('--line'); ctx.fillRect(46, Y(t), w - 56, 1);
  }
  ctx.fillStyle = cssVar('--muted'); ctx.fillRect(46, Y(0), w - 56, 3);
  trail.forEach((y, i) => {                      // poprzednie klatki
    ctx.globalAlpha = 0.12 + 0.3 * (i / trail.length);
    ctx.beginPath(); ctx.arc(x, Y(y) - 10, 10, 0, 7); ctx.fillStyle = cssVar('--sand'); ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.beginPath(); ctx.arc(x, Y(drawn) - 10, 10, 0, 7); ctx.fillStyle = cssVar('--sand'); ctx.fill();
  if (Math.abs(h - drawn) > 0.0005) {            // gdzie ziarnko jest juz w pamieci
    ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.strokeStyle = cssVar('--electron');
    ctx.beginPath(); ctx.arc(x, Y(h) - 10, 10, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  }
}

const stopAuto = () => { clearInterval(timer); timer = null; $('#auto').textContent = 'Odtwarzaj'; };
$('#next').onclick = () => { stopAuto(); next(); };
$('#frame').onclick = () => { stopAuto(); do next(); while (step !== 0); };
$('#auto').onclick = () => {
  if (timer) return stopAuto();
  $('#auto').textContent = 'Zatrzymaj';
  timer = setInterval(() => { do next(); while (step !== 0); }, 110);
};
$('#reset').onclick = () => { stopAuto(); reset(); };

onRedraw(draw);
reset();
