import { initPage } from '../core/layout.js';
import { $, $$, el, svg, bin } from '../core/util.js';
import { Circuit, fullAdder, makeAdder } from '../core/logic-sim.js';
import { circuitView } from '../core/circuit-view.js';

initPage();

// ---------- jedna kolumna ----------
const c = new Circuit();
c.input('A', 1); c.input('B', 1); c.input('C', 0);
fullAdder(c, '', 'A', 'B', 'C');
const WORDS = ['żadnej jedynki', 'jedną jedynkę', 'dwie jedynki', 'trzy jedynki'];
const faSay = () => {
  const n = c.get('A') + c.get('B') + c.get('C');
  $('#faSay').innerHTML = `W tej kolumnie masz teraz <b>${WORDS[n]}</b>. Układ wpisuje pod kreską <b>${c.get('sum')}</b> i przenosi w lewo <b>${c.get('cout')}</b>. Porównaj z tabelką powyżej.`;
};
circuitView($('#fa'), c, {
  w: 860, h: 300,
  nodes: [
    { id: 'A', kind: 'in', x: 130, y: 50, label: 'pierwsza liczba' },
    { id: 'B', kind: 'in', x: 130, y: 120, label: 'druga liczba' },
    { id: 'C', kind: 'in', x: 130, y: 250, label: 'z prawej' },
    { id: 'x1', kind: 'gate', x: 300, y: 85 },
    { id: 'a1', kind: 'gate', x: 300, y: 185 },
    { id: 'sum', kind: 'gate', x: 500, y: 110 },
    { id: 'a2', kind: 'gate', x: 500, y: 240 },
    { id: 'cout', kind: 'gate', x: 640, y: 212 },
    { id: 'oS', kind: 'out', of: 'sum', x: 750, y: 110, label: 'wynik' },
    { id: 'oC', kind: 'out', of: 'cout', x: 750, y: 212, label: 'w lewo' },
  ],
  wires: {
    'A>a1#0': [[175, 50], [175, 175]],
    'B>a1#1': [[215, 120], [215, 195]],
    'C>sum#1': [[425, 250], [425, 120]],
    'x1>a2#0': [[395, 85], [395, 230]],
  },
}, { onChange: faSay });
faSay();

// ---------- osiem kolumn ----------
const adder = makeAdder(8);
let A = 10, Bn = 3, hl = -1, timer = null;
const grid = $('#add');
const mk = (cls, n = 8) => Array.from({ length: n }, () => el('span', { class: cls }));
const carEls = mk('car'), aEls = [], bEls = [], sEls = [];
const valA = el('span', { class: 'val' }), valB = el('span', { class: 'val' }), valS = el('span', { class: 'val' });
grid.append(el('span', { class: 'lab' }, 'przeniesienia'), ...carEls, el('span'));
grid.append(el('span', { class: 'lab' }, 'pierwsza liczba'));
for (let i = 7; i >= 0; i--) { const b = el('button', { class: 'bit', onclick: () => { A ^= 1 << i; stop(); drawAdd(); } }); aEls.push([b, i]); grid.append(b); }
grid.append(valA, el('span', { class: 'lab' }, 'druga liczba'));
for (let i = 7; i >= 0; i--) { const b = el('button', { class: 'bit', onclick: () => { Bn ^= 1 << i; stop(); drawAdd(); } }); bEls.push([b, i]); grid.append(b); }
grid.append(valB, el('hr'), el('span', { class: 'lab' }, 'wynik'));
for (let i = 7; i >= 0; i--) { const b = el('span', { class: 'bit ro' }); sEls.push([b, i]); grid.append(b); }
grid.append(valS);

function drawAdd(upTo = 8) {
  const r = adder.add(A, Bn);
  const set = (list, v) => list.forEach(([b, i]) => { const on = (v >> i) & 1; b.textContent = on; b.classList.toggle('on', !!on); b.classList.toggle('col', i === hl); });
  set(aEls, A); set(bEls, Bn);
  sEls.forEach(([b, i]) => { const on = (r.sum >> i) & 1; b.textContent = i < upTo ? on : '?'; b.classList.toggle('on', i < upTo && !!on); b.classList.toggle('col', i === hl); });
  // przeniesienie wchodzace do kolumny i to przeniesienie wychodzace z kolumny i-1
  carEls.forEach((e, k) => { const i = 7 - k, v = i === 0 ? 0 : r.carries[i - 1]; e.textContent = i <= upTo && i > 0 ? v : ''; e.classList.toggle('on', !!v && i <= upTo); });
  valA.textContent = A; valB.textContent = Bn; valS.textContent = upTo === 8 ? r.sum : '…';
  if (upTo === 8 && hl < 0) {
    $('#addSay').innerHTML = `<b>${A}</b> i <b>${Bn}</b> daje <b>${r.sum}</b>.` + (r.carry
      ? ` Prawdziwa suma to ${A + Bn}, ale z ostatniej kolumny wyszło przeniesienie, na które nie ma już miejsca. Dziewiąty bit przepada i zostaje ${r.sum}.`
      : ' Małe cyferki nad kolumnami to przeniesienia, które przeszły z kolumny po prawej.');
  }
  return r;
}
const stop = () => { clearInterval(timer); timer = null; hl = -1; };
$$('[data-ex]').forEach(b => { b.onclick = () => { stop(); [A, Bn] = b.dataset.ex.split(',').map(Number); drawAdd(); }; });
$('#wave').onclick = () => {
  stop();
  let i = 0;
  const show = () => {
    if (i === 8) { stop(); drawAdd(); return; }
    hl = i;
    const r = drawAdd(i + 1);
    const cin = i === 0 ? 0 : r.carries[i - 1], n = ((A >> i) & 1) + ((Bn >> i) & 1) + cin;
    $('#addSay').innerHTML = `<b>Kolumna ${i + 1} od prawej.</b> Masz w niej ${WORDS[n]}${cin ? ' (wliczając przeniesienie z prawej)' : ''}. Wpisz <b>${(r.sum >> i) & 1}</b>, przenieś <b>${r.carries[i]}</b>.`;
    i++;
  };
  show(); timer = setInterval(show, 1100);
};
drawAdd();

// ---------- zwrotnice ----------
const dp = $('#dp');
const box = (id, x, y, w, h, title, sub) => dp.append(
  svg('rect', { id, x, y, width: w, height: h, rx: 10 }),
  svg('text', { x: x + w / 2, y: y + (sub ? h / 2 - 6 : h / 2 + 4) }, title),
  sub ? svg('text', { class: 's', x: x + w / 2, y: y + h / 2 + 12 }, sub) : '');
const paths = [];
function road(ops, pts) {
  const d = 'M' + pts.map(p => p.join(',')).join(' L');
  const [x2, y2] = pts.at(-1), [x1, y1] = pts.at(-2);
  const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  const p = svg('path', { class: 'p', d });
  const a = svg('path', { class: 'ah', d: 'M0,0 L-13,-7 L-13,7 Z', transform: `translate(${x2},${y2}) rotate(${ang})` });
  paths.push({ p, a, ops }); dp.append(p, a);
}
road(['WEZ'], [[170, 165], [600, 165], [600, 116]]);
road(['DODAJ'], [[170, 80], [286, 80]]);
road(['DODAJ'], [[650, 40], [650, 16], [355, 16], [355, 36]]);
road(['DODAJ'], [[420, 75], [546, 75]]);
road(['ZAPISZ'], [[670, 110], [670, 205], [176, 205]]);
road(['SKOCZ'], [[170, 285], [286, 285]]);
road(['WEZ', 'DODAJ', 'ZAPISZ'], [[95, 258], [95, 236]]);
box('bMem', 20, 30, 150, 200, 'Pamięć', '16 skrytek');
box('bIr', 20, 260, 150, 50, '', '');
box('bSum', 290, 40, 130, 70, 'Sumator', '40 bramek');
box('bA', 550, 40, 150, 70, 'Podręczna tabliczka', '');
box('bPc', 290, 260, 130, 50, 'Palec', '');
const irText = svg('text', { class: 'mono', x: 95, y: 290 });
dp.append(irText, svg('text', { class: 's', x: 95, y: 324 }, 'bieżące polecenie'), svg('text', { class: 's', x: 106, y: 251, style: 'text-anchor:start' }, 'numer skrytki'));

const OPS = {
  WEZ: ['WEŹ', '0001', 'Bity 0001 zapalają w dekoderze przewód „weź". Otwiera on jedną drogę: z wybranej skrytki pamięci prosto na podręczną tabliczkę. Sumator jest odcięty i nie bierze udziału.', ['bMem', 'bA']],
  DODAJ: ['DODAJ', '0010', 'Bity 0010 zapalają przewód „dodaj". Otwierają się trzy drogi naraz: z pamięci do sumatora, z tabliczki do sumatora i z sumatora z powrotem na tabliczkę. Liczby wpływają do 40 bramek, a po chwili na wyjściu stoi suma.', ['bMem', 'bSum', 'bA']],
  ZAPISZ: ['ZAPISZ', '0011', 'Bity 0011 zapalają przewód „zapisz". Otwiera się droga w przeciwną stronę: z tabliczki do wybranej skrytki pamięci.', ['bMem', 'bA']],
  SKOCZ: ['SKOCZ', '0100', 'Bity 0100 zapalają przewód „skocz". Cztery bity numeru skrytki nie idą tym razem do pamięci, tylko do palca: zostają w nim zapisane jako miejsce następnego polecenia.', ['bPc']],
};
function choose(key) {
  const [, bits4, text, active] = OPS[key];
  $$('#ops .btn').forEach(b => b.classList.toggle('active', b.dataset.op === key));
  paths.forEach(({ p, a, ops }) => { const on = ops.includes(key); p.classList.toggle('on', on); p.classList.toggle('flow', on); a.classList.toggle('on', on); });
  $$('#dp rect').forEach(r => r.classList.toggle('act', active.includes(r.id) || r.id === 'bIr'));
  irText.textContent = bits4 + ' ' + (key === 'SKOCZ' ? '0000' : key === 'DODAJ' ? '1101' : '1100');
  $('#dpSay').innerHTML = text;
}
for (const [key, [name, bits4]] of Object.entries(OPS)) {
  $('#ops').append(el('button', { class: 'btn', 'data-op': key, onclick: () => choose(key) }, `${name} (${bits4})`));
}
choose('DODAJ');
