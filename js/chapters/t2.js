import { initPage } from '../core/layout.js';
import { $, el, svg, bin } from '../core/util.js';
import { SAND_PROGRAM, SAND_LABELS, dec } from '../core/cpu-sim.js';

initPage();

let addr = 12;
const mem = [...SAND_PROGRAM];
const tree = $('#tree');
const LEVELS = 4, N = 16, LEAF_Y = 262, TOP = 26, STEP = 50;
const leafX = i => 32 + i * 46.4;
// wezel na poziomie L o numerze k lezy nad srodkiem swoich lisci
const nodeX = (L, k) => { const span = N >> L; return (leafX(k * span) + leafX(k * span + span - 1)) / 2; };
const nodeY = L => TOP + L * STEP;

const edges = [], nodes = [], boxes = [], lrs = [];
for (let L = 0; L < LEVELS; L++) for (let k = 0; k < 1 << L; k++) for (const side of [0, 1]) {
  const child = k * 2 + side;
  const x1 = nodeX(L, k), y1 = nodeY(L), x2 = nodeX(L + 1, child), y2 = L + 1 === LEVELS ? LEAF_Y - 6 : nodeY(L + 1);
  const e = svg('path', { class: 'edge', d: `M${x1},${y1} C${x1},${y1 + 28} ${x2},${y2 - 28} ${x2},${y2}` });
  edges.push({ e, L, child });
  tree.append(e);
}
for (let L = 0; L < LEVELS; L++) for (let k = 0; k < 1 << L; k++) {
  const c = svg('circle', { class: 'node', cx: nodeX(L, k), cy: nodeY(L), r: 7 });
  nodes.push({ c, L, k }); tree.append(c);
}
for (let L = 0; L < LEVELS; L++) {
  const t = svg('text', { class: 'lr', x: 0, y: 0 });
  lrs.push(t); tree.append(t);
  tree.append(svg('text', { class: 'm', x: 728, y: nodeY(L) + 4 }, `bit ${L + 1}`));
}
for (let i = 0; i < N; i++) {
  const g = svg('g', { onclick: () => { addr = i; draw(); } },
    svg('rect', { class: 'box', x: leafX(i) - 21, y: LEAF_Y - 6, width: 42, height: 60, rx: 7 }),
    svg('text', { class: 'm', x: leafX(i), y: LEAF_Y + 8 }, 'nr ' + i),
    svg('text', { x: leafX(i), y: LEAF_Y + 26 }, ''),
    svg('text', { x: leafX(i), y: LEAF_Y + 42 }, ''));
  boxes.push(g); tree.append(g);
}

const addrBits = [];
for (let i = 3; i >= 0; i--) {
  const b = el('button', { class: 'bit', onclick: () => { addr ^= 1 << i; draw(); } });
  addrBits.push([b, i]); $('#addr').append(b);
}

function meaning(i) {
  const v = mem[i], d = dec(v);
  if (SAND_LABELS[i]) return `Program traktuje ją jako <b>${SAND_LABELS[i]}</b>.`;
  if (i <= 6) return `Procesor wykona ją jako polecenie <b>${d.name} ${d.addr}</b>: pierwsze cztery bity (${bin(d.op, 4)}) to numer polecenia, ostatnie cztery (${bin(d.addr, 4)}) to numer skrytki ${d.addr}.`;
  return 'Ta skrytka jest pusta: program jej nie używa.';
}

function draw() {
  for (const [b, i] of addrBits) { const v = (addr >> i) & 1; b.textContent = v; b.classList.toggle('on', !!v); }
  const turns = bin(addr, 4).split('').map(c => (c === '1' ? 'w prawo' : 'w lewo'));
  $('#addrSay').textContent = `czyli ${turns.join(', ')}`;
  for (const { e, L, child } of edges) e.classList.toggle('on', child === addr >> (LEVELS - L - 1));
  for (const { c, L, k } of nodes) c.classList.toggle('on', k === addr >> (LEVELS - L));
  lrs.forEach((t, L) => {
    const side = (addr >> (LEVELS - L - 1)) & 1, k = addr >> (LEVELS - L);
    t.setAttribute('x', nodeX(L, k) + (side ? 16 : -16)); t.setAttribute('y', nodeY(L) + 4);
    t.textContent = side;
  });
  boxes.forEach((g, i) => {
    g.firstChild.classList.toggle('on', i === addr);
    const t = g.querySelectorAll('text');
    t[1].textContent = bin(mem[i]).slice(0, 4); t[2].textContent = bin(mem[i]).slice(4);
  });
  $('#say').innerHTML = `Adres <b>${bin(addr, 4)}</b> prowadzi do <b>skrytki numer ${addr}</b>. Leży w niej osiem bitów: <b>${bin(mem[addr]).replace(/(.{4})/, '$1 ')}</b>. ` +
    `Jako zwykła liczba to ${mem[addr]}. ${meaning(addr)}`;
}

$('#inc').onclick = () => { mem[addr] = (mem[addr] + 1) & 255; draw(); };
$('#dec').onclick = () => { mem[addr] = (mem[addr] - 1) & 255; draw(); };
$('#reset').onclick = () => { mem.splice(0, 16, ...SAND_PROGRAM); draw(); };
draw();
