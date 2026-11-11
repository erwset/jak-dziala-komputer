import { initPage } from '../core/layout.js';
import { $, $$, el, big } from '../core/util.js';
import * as B from '../core/bits.js';

initPage();

// ---------- osiem lampek ----------
let byte = 74;
const lampBtns = [];
const lamps = $('#lamps');
for (let i = 7; i >= 0; i--) {
  const b = el('button', { class: 'bit', onclick: () => { byte ^= 1 << i; drawLamps(); } });
  lampBtns.push([b, i]);
  lamps.append(el('div', {}, b, el('small', {}, 'warta ' + (1 << i))));
}
function drawLamps() {
  const on = [];
  for (const [b, i] of lampBtns) {
    const v = (byte >> i) & 1;
    b.textContent = v; b.classList.toggle('on', !!v);
    if (v) on.push(1 << i);
  }
  const list = on.length === 0 ? '' : on.length === 1 ? String(on[0]) : on.slice(0, -1).join(', ') + ' i ' + on.at(-1);
  $('#lampSay').innerHTML = on.length === 0
    ? 'Żadna lampka nie świeci. To liczba <b>0</b>.'
    : on.length === 1 ? `Świeci jedna lampka, warta ${list}. To liczba <b>${byte}</b>.`
    : `Zapalone lampki są warte: ${list}. Razem to liczba <b>${byte}</b>.`;
}
$('#inc').onclick = () => { byte = (byte + 1) & 255; drawLamps(); };
$('#zero').onclick = () => { byte = 0; drawLamps(); };
$('#all').onclick = () => { byte = 255; drawLamps(); };
drawLamps();

// ---------- 32 bity ----------
let word = B.floatToBits(1.5);
const bitBtns = [];
const row = $('#bits32');
for (let i = 31; i >= 0; i--) {
  const field = i === 31 ? 'fs' : i >= 23 ? 'fe' : 'fm';
  const b = el('button', { class: 'bit small ' + field, onclick: () => { word = (word ^ (1 << i)) >>> 0; draw32(); } });
  bitBtns.push([b, i]);
  row.append(b);
  if (i % 8 === 0 && i) row.append(el('span', { class: 'gap' }));
}

const sig = x => {                       // liczba z przecinkiem zapisana po polsku
  if (Number.isNaN(x)) return 'to nie jest liczba';
  if (!Number.isFinite(x)) return x > 0 ? 'nieskończoność' : 'minus nieskończoność';
  const a = Math.abs(x);
  if (a !== 0 && (a >= 1e9 || a < 1e-4)) {
    const e = Math.floor(Math.log10(a)), m = (x / 10 ** e).toPrecision(4).replace('.', ',').replace('-', '−');
    return `${m} i przecinek przesunięty o ${Math.abs(e)} miejsc w ${e > 0 ? 'prawo' : 'lewo'}`;
  }
  return Number(x.toPrecision(9)).toLocaleString('pl-PL', { maximumFractionDigits: 12 }).replace('-', '−');
};

function draw32() {
  for (const [b, i] of bitBtns) { const v = (word >>> i) & 1; b.textContent = v; b.classList.toggle('on', !!v); }
  $('#rInt').textContent = big(B.bitsToUint(word));
  const f = B.bitsToFloat(word);
  $('#rFloat').textContent = sig(f);
  const c = B.bitsToColor(word);
  $('#rSw').style.background = `rgba(${c.r},${c.g},${c.b},${Math.max(0.15, c.a / 255)})`;
  $('#rCol').textContent = `czerwony ${c.r}, zielony ${c.g}, niebieski ${c.b}, krycie ${c.a}`;
  $('#rTxt').textContent = '„' + B.bitsToText(word) + '"';

  const { sign, exp, mant } = B.floatParts(word);
  const digits = (1 + mant / 2 ** 23).toLocaleString('pl-PL', { maximumFractionDigits: 7 });
  const shift = exp - 127;
  const scaleTxt = exp === 0 || exp === 255
    ? `pole ma wartość ${exp}, co jest zarezerwowane na przypadki specjalne (zero, liczby skrajnie małe, nieskończoność)`
    : shift === 0 ? 'pole ma wartość 127, co oznacza „zostaw cyfry tak, jak są"'
    : `pole ma wartość ${exp}, co oznacza „${shift > 0 ? 'podwój' : 'przepołów'} cyfry ${Math.abs(shift)} razy z rzędu"`;
  $('#floatHow').replaceChildren(
    el('span', { html: `<i style="background:var(--hole)"></i><b>Znak</b> (1 bit): ${sign ? 'zapalony, więc liczba jest ujemna' : 'zgaszony, więc liczba jest dodatnia'}.` }),
    el('span', { html: `<i style="background:var(--good)"></i><b>Skala</b> (8 bitów): ${scaleTxt}.` }),
    el('span', { html: `<i style="background:var(--electron)"></i><b>Cyfry</b> (23 bity): dają liczbę między 1 a 2, teraz ${digits}.` }),
    el('span', { html: `Razem: <b>${sig(f)}</b>.` }));
}

const PRESETS = {
  h: () => B.floatToBits(1.5),
  c: () => B.colorToBits(214, 164, 85),
  t: () => B.textToBits('PIAS'),
  n: () => 2000,
  d: () => B.floatToBits(0.1),
  r: () => (Math.random() * 2 ** 32) >>> 0,
};
$$('[data-preset]').forEach(b => { b.onclick = () => { word = PRESETS[b.dataset.preset]() >>> 0; draw32(); }; });
draw32();
