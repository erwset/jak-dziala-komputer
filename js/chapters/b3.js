import { initPage } from '../core/layout.js';
import { $, $$, el } from '../core/util.js';
import { OP, enc } from '../core/cpu-sim.js';
import { cpuWidget } from '../core/cpu-widget.js';

initPage();

// Jeden obrot petli "policz wiersze, w ktorych gracz = 7".
const PROGRAM = [
  enc(OP.WEZ, 13), enc(OP.ODEJMIJ, 15), enc(OP.SKOCZ_GDY_ZERO, 4), enc(OP.SKOCZ, 7),
  enc(OP.WEZ, 12), enc(OP.DODAJ, 11), enc(OP.ZAPISZ, 12), enc(OP.STOP),
  0, 0, 0, 1, 0, 7, 0, 7,
];
const LABELS = { 11: 'stała: jeden', 12: 'licznik pasujących wierszy', 13: 'gracz w bieżącym wierszu', 15: 'szukany gracz' };

cpuWidget($('#cpu'), {
  program: PROGRAM, labels: LABELS, selected: 13, showZero: true,
  startText: 'W skrytce 13 leży numer gracza z bieżącego wiersza, w skrytce 15 szukany numer. Naciśnij „Jedno tyknięcie" albo „Całe polecenie".',
  note: ev => (ev.phase !== 'wykonaj' ? '' : ev.op === OP.ZAPISZ ? ' Wiersz pasował do warunku i został policzony.'
    : ev.op === OP.SKOCZ ? ' To droga dla wiersza, który <b>nie pasuje</b>: omijamy doliczanie.' : ''),
});

// ---------- wykrywacz zera ----------
let value = 0;
const bits = [];
for (let i = 7; i >= 0; i--) {
  const b = el('button', { class: 'bit', onclick: () => { value ^= 1 << i; draw(); } });
  bits.push([b, i]); $('#zbits').append(b);
}
function draw(from) {
  for (const [b, i] of bits) { const v = (value >> i) & 1; b.textContent = v; b.classList.toggle('on', !!v); }
  const zero = value === 0;
  $('#zlamp').classList.toggle('on', zero);
  $('#zsay').innerHTML = (from ? `Od numeru gracza (${from[0]}) odejmujemy szukany numer (${from[1]}). ` : '') +
    (zero ? 'Żaden bit wyniku nie świeci, więc bramki LUB dają zero, a bramka NIE zamienia je na jedynkę. <b>Znacznik zera świeci: liczby były równe.</b>'
      : `Świeci przynajmniej jeden bit wyniku${from && from[0] < from[1] ? ' (wynik „przekręcił się" poniżej zera, stąd tyle jedynek)' : ''}, więc bramki LUB dają jedynkę, a bramka NIE zamienia ją na zero. <b>Znacznik zera nie świeci: liczby były różne.</b>`);
}
$$('[data-pair]').forEach(b => { b.onclick = () => { const [a, c] = b.dataset.pair.split(',').map(Number); value = (a - c) & 255; draw([a, c]); }; });
draw();
