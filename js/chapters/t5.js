import { initPage } from '../core/layout.js';
import { $, $$, el } from '../core/util.js';
import { Circuit } from '../core/logic-sim.js';
import { circuitView, GATE_PL } from '../core/circuit-view.js';

initPage();

// ---------- piec bramek ----------
const GATES = [
  ['NOT', 'Odwraca: świeci, gdy wejście nie świeci.'],
  ['AND', 'Świeci tylko wtedy, gdy świecą oba wejścia.'],
  ['OR', 'Świeci, gdy świeci przynajmniej jedno wejście.'],
  ['XOR', 'Świeci, gdy świeci dokładnie jedno wejście.'],
  ['NAND', 'Świeci zawsze, chyba że świecą oba wejścia.'],
];
for (const [type, rule] of GATES) {
  const c = new Circuit();
  const one = type === 'NOT';
  c.input('A'); if (!one) c.input('B');
  c.gate('g', type, ...(one ? ['A'] : ['A', 'B']));
  const holder = el('div');
  $('#gates').append(el('div', { class: 'gcard' }, el('h3', {}, GATE_PL[type] + ' ', el('small', {}, `(po angielsku ${type})`)), holder, el('p', {}, rule)));
  circuitView(holder, c, {
    w: 300, h: 110,
    nodes: [
      ...(one ? [{ id: 'A', kind: 'in', x: 50, y: 55 }] : [{ id: 'A', kind: 'in', x: 50, y: 30 }, { id: 'B', kind: 'in', x: 50, y: 80 }]),
      { id: 'g', kind: 'gate', x: 160, y: 55 },
      { id: 'o', kind: 'out', of: 'g', x: 260, y: 55 },
    ],
  });
}

// ---------- wszystko z NIE-I ----------
const BUILDS = {
  NOT: {
    name: 'NIE', ins: ['A'], out: 'n1', ref: a => a ^ 1,
    gates: [['n1', 'A', 'A']],
    pos: { A: [130, 110], n1: [360, 110], o: [600, 110] },
    why: 'Jedna bramka NIE-I z oboma wejściami spiętymi razem.',
  },
  AND: {
    name: 'I', ins: ['A', 'B'], out: 'n2', ref: (a, b) => a & b,
    gates: [['n1', 'A', 'B'], ['n2', 'n1', 'n1']],
    pos: { A: [130, 70], B: [130, 150], n1: [320, 110], n2: [480, 110], o: [640, 110] },
    why: 'NIE-I, a zaraz po niej odwrócenie (druga NIE-I ze spiętymi wejściami). Dwa „nie" się znoszą i zostaje samo „I".',
  },
  OR: {
    name: 'LUB', ins: ['A', 'B'], out: 'n3', ref: (a, b) => a | b,
    gates: [['n1', 'A', 'A'], ['n2', 'B', 'B'], ['n3', 'n1', 'n2']],
    pos: { A: [130, 60], B: [130, 160], n1: [320, 60], n2: [320, 160], n3: [480, 110], o: [640, 110] },
    why: 'Najpierw odwracamy każde wejście, potem NIE-I. Wynik gaśnie tylko wtedy, gdy oba odwrócone wejścia świecą, czyli gdy oba oryginalne są zgaszone.',
  },
  XOR: {
    name: 'ALBO', ins: ['A', 'B'], out: 'n4', ref: (a, b) => a ^ b,
    gates: [['n1', 'A', 'B'], ['n2', 'A', 'n1'], ['n3', 'n1', 'B'], ['n4', 'n2', 'n3']],
    pos: { A: [130, 50], B: [130, 170], n1: [300, 110], n2: [460, 60], n3: [460, 160], n4: [610, 110], o: [740, 110] },
    why: 'Cztery bramki NIE-I. Tę samą bramkę ALBO, której sumator używa dwa razy na każdą kolumnę.',
  },
};

function build(key) {
  const b = BUILDS[key];
  const c = new Circuit();
  b.ins.forEach(i => c.input(i));
  b.gates.forEach(([id, x, y]) => c.gate(id, 'NAND', x, y));
  const nodes = [
    ...b.ins.map(i => ({ id: i, kind: 'in', x: b.pos[i][0], y: b.pos[i][1], label: 'wejście' })),
    ...b.gates.map(([id]) => ({ id, kind: 'gate', x: b.pos[id][0], y: b.pos[id][1] })),
    { id: 'o', kind: 'out', of: b.out, x: b.pos.o[0], y: b.pos.o[1], label: 'wyjście' },
  ];
  const say = () => {
    const vals = b.ins.map(i => c.get(i)), got = c.get(b.out), want = b.ref(...vals);
    $('#nandSay').innerHTML = `${b.why}<br>Wejścia: <b>${vals.join(' i ')}</b>. Układ z bramek NIE-I daje <b>${got}</b>. ` +
      `Prawdziwa bramka ${b.name} dałaby <b>${want}</b>. ${got === want ? 'Zgadza się.' : 'Nie zgadza się!'} Sprawdź pozostałe ustawienia wejść.`;
  };
  $('#nand').replaceChildren();
  circuitView($('#nand'), c, { w: 800, h: 220, nodes }, { onChange: say });
  say();
  $$('#pick .btn').forEach(x => x.classList.toggle('active', x.dataset.k === key));
}
for (const [key, b] of Object.entries(BUILDS)) {
  $('#pick').append(el('button', { class: 'btn', 'data-k': key, onclick: () => build(key) }, `Zbuduj ${b.name}`));
}
build('XOR');
