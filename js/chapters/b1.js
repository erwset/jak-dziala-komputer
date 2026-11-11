import { initPage } from '../core/layout.js';
import { $, svg, big } from '../core/util.js';

initPage();

// ---------- drzewo: 64 wiersze, 16 lisci po 4, 4 wezly srodkowe, korzen ----------
const N = 64, tree = $('#tree');
const rowX = i => 14 + i * 11.75;                       // i od 0
const leafX = k => (rowX(k * 4) + rowX(k * 4 + 3)) / 2 + 5;
const midX = k => (leafX(k * 4) + leafX(k * 4 + 3)) / 2;
const Y = { root: 30, mid: 110, leaf: 195, rows: 270 };

const edges = [];
const edge = (x1, y1, x2, y2, key) => { const e = svg('path', { class: 'edge', d: `M${x1},${y1} C${x1},${y1 + 30} ${x2},${y2 - 30} ${x2},${y2}` }); edges.push({ e, key }); tree.append(e); };
for (let m = 0; m < 4; m++) {
  edge(390, Y.root + 14, midX(m), Y.mid - 14, 'm' + m);
  for (let l = 0; l < 4; l++) edge(midX(m), Y.mid + 14, leafX(m * 4 + l), Y.leaf - 12, 'l' + (m * 4 + l));
}
const nodes = {};
const node = (key, x, y, w, text) => {
  const g = svg('g', { class: 'node' }, svg('rect', { x: x - w / 2, y: y - 14, width: w, height: 28, rx: 6 }), svg('text', { x, y: y + 1 }, text));
  nodes[key] = g; tree.append(g);
};
node('root', 390, Y.root, 130, '17 · 33 · 49');
for (let m = 0; m < 4; m++) node('m' + m, midX(m), Y.mid, 104, [1, 2, 3].map(j => m * 16 + j * 4 + 1).join(' · '));
for (let l = 0; l < 16; l++) node('l' + l, leafX(l), Y.leaf, 43, `${l * 4 + 1}–${l * 4 + 4}`);
const rows = [];
for (let i = 0; i < N; i++) {
  const r = svg('rect', { class: 'row', x: rowX(i), y: Y.rows, width: 10, height: 22, rx: 2 });
  r.addEventListener('click', () => { $('#goal').value = i + 1; reset(); });
  rows.push(r); tree.append(r);
}
tree.append(svg('text', { class: 's', x: 390, y: Y.rows + 40 }, 'wiersze tabeli, od numeru 1 (z lewej) do 64 (z prawej)'));

let timer = null;
const goal = () => Number($('#goal').value);

function paint(scanned, level) {
  const g = goal() - 1, leaf = g >> 2, mid = g >> 4;
  rows.forEach((r, i) => { r.classList.toggle('seen', i < scanned); r.classList.toggle('goal', i === g); r.classList.toggle('hit', i === g && (scanned > g || level >= 3)); });
  nodes.root.classList.toggle('on', level >= 1);
  for (let m = 0; m < 4; m++) nodes['m' + m].classList.toggle('on', level >= 2 && m === mid);
  for (let l = 0; l < 16; l++) nodes['l' + l].classList.toggle('on', level >= 3 && l === leaf);
  edges.forEach(({ e, key }) => e.classList.toggle('on', (level >= 2 && key === 'm' + mid) || (level >= 3 && key === 'l' + leaf)));
  $('#cScan').textContent = scanned; $('#cTree').textContent = level;
}

function reset() {
  clearInterval(timer); timer = null;
  $('#goalTxt').textContent = goal();
  paint(0, 0);
  $('#say').innerHTML = `Szukamy wiersza numer <b>${goal()}</b>. Naciśnij „Szukaj oboma sposobami".`;
}

const TREE_SAY = g => [
  '',
  `<b>Indeks, piętro 1.</b> Korzeń ma drogowskazy 17, 33 i 49. Szukany numer ${g} wypada ${g < 17 ? 'przed 17' : g < 33 ? 'między 17 a 33' : g < 49 ? 'między 33 a 49' : 'za 49'}, więc idziemy do ${['pierwszej', 'drugiej', 'trzeciej', 'czwartej'][(g - 1) >> 4]} ćwiartki. Trzy czwarte tabeli odpadły po jednym spojrzeniu.`,
  '<b>Indeks, piętro 2.</b> Ten sam ruch wewnątrz ćwiartki: drogowskazy wskazują jeden z czterech kawałków po cztery wiersze.',
  `<b>Indeks, piętro 3.</b> Zostały cztery wiersze i wśród nich jest numer ${g}. <b>Indeks skończył po trzech krokach.</b> Szukanie po kolei wciąż trwa.`,
];

$('#go').onclick = () => {
  reset();
  const g = goal();
  let scanned = 0, level = 0;
  timer = setInterval(() => {
    if (scanned < g) scanned++;
    if (level < 3 && scanned % 3 === 0 || (scanned >= g && level < 3)) level++;
    paint(scanned, level);
    const scanDone = scanned >= g;
    $('#say').innerHTML = (level > 0 && !(scanDone && level === 3) ? TREE_SAY(g)[level] : '') +
      (scanDone && level === 3 ? `Oba sposoby znalazły wiersz ${g}. Po kolei: <b>${g}</b> sprawdzonych wierszy. Przez indeks: <b>3</b> węzły. ` +
        (g <= 3 ? 'Dla wiersza z samego początku tabeli szukanie po kolei wygrywa. Wybierz numer bliżej końca.' : 'Im dalej w tabeli leży szukany wiersz, tym większa przewaga indeksu, który zawsze potrzebuje trzech kroków.') : '');
    if (scanDone && level === 3) { clearInterval(timer); timer = null; }
  }, 170);
};
$('#goal').oninput = reset;
reset();

// ---------- wieksze tabele ----------
function sizes() {
  const n = Math.round(10 ** Number($('#size').value));
  const levels = Math.max(1, Math.ceil(Math.log(n) / Math.log(300)));
  $('#sizeTxt').textContent = big(n);
  $('#sScan').textContent = big(n / 2);
  $('#sTree').textContent = levels;
  $('#sizeSay').innerHTML = `Tabela ma <b>${big(n)}</b> wierszy. Szukając po kolei, trzeba średnio przejrzeć połowę, czyli ${big(n / 2)}. Indeks, w którym jeden węzeł mieści około 300 drogowskazów, ma ${levels === 1 ? 'jedno piętro' : levels + ' piętra'}. ` +
    `Różnica: <b>${big(n / 2 / levels)} razy</b> mniej pracy.`;
}
$('#size').oninput = sizes;
sizes();
