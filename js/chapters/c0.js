import { initPage } from '../core/layout.js';
import { $, el } from '../core/util.js';

initPage();

// Caly "material szkoleniowy" zabawkowego modelu.
const CORPUS = `
kot śpi na kanapie . kot śpi na dachu . kot siedzi na dachu i patrzy na ptaki . kot siedzi na kanapie i mruczy .
kot patrzy na psa . kot goni mysz po kuchni . pies śpi na dywanie . pies biegnie po parku i szczeka na kota .
pies goni kota po ogrodzie . pies siedzi na dywanie i patrzy na kota . pies patrzy na ptaki .
mysz ucieka przed kotem do kuchni . mysz siedzi w kuchni i je ser . ptaki siedzą na dachu i śpiewają . ptaki lecą nad parkiem .
komputer liczy bardzo szybko . komputer dodaje liczby i zapisuje wynik w pamięci . komputer to tylko liczby i prąd .
komputer nie wie , co to piasek . komputer rysuje piasek na ekranie . procesor dodaje liczby bardzo szybko .
procesor bierze liczby z pamięci i dodaje . procesor to miliardy tranzystorów . procesor nie wie , co to kot .
piasek sypie się na ekranie . piasek to tylko liczby w pamięci . piasek sypie się na dywanie i kot patrzy .
ziarnko piasku to sześć liczb w pamięci . ziarnko piasku spada na ekranie bardzo szybko .
tranzystor to mały kran . tranzystor przewodzi prąd albo nie . bramka to kilka tranzystorów . bramka dodaje dwa bity .
model pisze słowo po słowie . model nie wie , co to kot . model to tylko liczby i mnożenie . model liczy bardzo szybko i pisze słowo .
liczby w pamięci to tylko prąd . kot nie wie , co to komputer . pies nie wie , co to procesor .
`.trim().split(/\s+/);

// Dwie tabelki: co szlo po dwoch ostatnich slowach i co szlo po jednym.
const tri = new Map(), bi = new Map();
const bump = (map, key, w) => { if (!map.has(key)) map.set(key, new Map()); const m = map.get(key); m.set(w, (m.get(w) || 0) + 1); };
for (let i = 1; i < CORPUS.length; i++) {
  bump(bi, CORPUS[i - 1], CORPUS[i]);
  if (i > 1) bump(tri, CORPUS[i - 2] + ' ' + CORPUS[i - 1], CORPUS[i]);
}
const VOCAB = new Set(CORPUS);

let words = [], lastPick = null;

// Szanse na nastepne slowo: tabelka z dwoch slow wazy trzy razy wiecej niz tabelka z jednego.
function chances() {
  const last = words.at(-1), prev = words.at(-2), score = new Map();
  for (const [w, n] of bi.get(last) || []) score.set(w, n);
  for (const [w, n] of tri.get(prev + ' ' + last) || []) score.set(w, (score.get(w) || 0) + 3 * n);
  const t = Number($('#temp').value) / 10;
  let list = [...score].map(([w, s]) => [w, Math.pow(s, 1 / t)]);
  const sum = list.reduce((a, [, s]) => a + s, 0);
  return list.map(([w, s]) => [w, s / sum]).sort((a, b) => b[1] - a[1]);
}

function next() {
  const list = chances();
  let r = Math.random(), pick = list[0];
  for (const c of list) { r -= c[1]; if (r <= 0) { pick = c; break; } }
  words.push(pick[0]); lastPick = pick;
  return pick;
}

const pct = p => (p >= 0.995 ? '100%' : p < 0.01 ? '<1%' : Math.round(p * 100) + '%');
function render(justPicked) {
  // tekst: wielka litera po kropce, bez spacji przed kropka i przecinkiem
  const box = $('#text'); box.replaceChildren();
  words.forEach((w, i) => {
    const cap = i === 0 || words[i - 1] === '.';
    const shown = cap ? w[0].toUpperCase() + w.slice(1) : w;
    if (i && w !== '.' && w !== ',') box.append(' ');
    box.append(i === words.length - 1 && justPicked ? el('span', { class: 'new' }, shown) : shown);
  });
  box.append(el('span', { class: 'caret' }));

  const list = chances(), top = list.slice(0, 6), rest = list.slice(6).reduce((a, [, p]) => a + p, 0);
  const cands = $('#cands'); cands.replaceChildren();
  for (const [w, p] of top) cands.append(el('b', {}, w === '.' ? '(kropka)' : w === ',' ? '(przecinek)' : w), el('div', { class: 'bar', style: { width: Math.max(1, p * 100) + '%' } }), el('span', { class: 'num' }, pct(p)));
  if (rest > 0) cands.append(el('span', { class: 'hint', style: 'margin:0' }, `inne (${list.length - 6})`), el('div', { class: 'bar', style: { width: rest * 100 + '%' } }), el('span', { class: 'num' }, pct(rest)));

  const t = Number($('#temp').value) / 10;
  $('#tempTxt').textContent = t <= 0.4 ? 'ostrożnie' : t < 0.9 ? 'spokojnie' : t <= 1.1 ? 'zwyczajnie' : t < 1.6 ? 'śmiało' : 'szalenie';
  $('#say').innerHTML = (justPicked
    ? `Wylosowane słowo: <b>${lastPick[0] === '.' ? 'kropka' : lastPick[0]}</b> (miało ${pct(lastPick[1])} szans). Zostało dopisane do tekstu. `
    : `Model zna ${VOCAB.size} słów. `) +
    `Paski pokazują, co model uważa za możliwy ciąg dalszy tekstu, który jest teraz na górze${list.length === 1 ? '. Jest tylko jeden kandydat, więc losowanie niczego nie zmieni' : ''}.`;
}

function start(w) { words = [w]; lastPick = null; render(false); }
['kot', 'pies', 'komputer', 'procesor', 'piasek', 'model'].forEach(w => $('#starts').append(el('button', { class: 'btn', onclick: () => start(w) }, w)));
$('#next').onclick = () => { next(); render(true); };
$('#sent').onclick = () => { let n = 0; do next(); while (words.at(-1) !== '.' && ++n < 30); render(true); };
$('#reset').onclick = () => start(words[0]);
$('#temp').oninput = () => render(false);
start('kot');
