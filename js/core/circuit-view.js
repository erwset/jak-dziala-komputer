// Rysuje uklad z bramek jako SVG i pozwala klikac wejscia.
// spec: { w, h, nodes: [{ id, kind: 'in'|'gate'|'out', x, y, label, of }], wires: { 'zrodlo>cel#slot': [[x,y],...] } }
//   - 'gate' bierze typ i wejscia z obiektu Circuit (po id),
//   - 'out' to lampka pokazujaca wartosc wezla `of`.
import { svg } from './util.js';

export const GATE_PL = { AND: 'I', OR: 'LUB', NOT: 'NIE', NAND: 'NIE-I', NOR: 'NIE-LUB', XOR: 'ALBO', BUF: '' };
const GW = 70, GH = 44, PR = 14;

export function circuitView(container, circuit, spec, { onChange } = {}) {
  const root = svg('svg', { class: 'circ', viewBox: `0 0 ${spec.w} ${spec.h}` });
  // na waskim ekranie uklad nie kurczy sie ponizej czytelnego rozmiaru, tylko przewija w bok
  container.classList.add('hs');
  root.style.setProperty('--minw', Math.round(spec.w * 0.92) + 'px');
  const pos = Object.fromEntries(spec.nodes.map(n => [n.id, n]));
  const gates = Object.fromEntries(circuit.gates.map(g => [g.id, g]));
  const wireEls = [], nodeEls = [];

  const outX = n => n.x + (n.kind === 'gate' ? GW / 2 : PR);
  const wire = (srcId, dst, slot, count) => {
    const s = pos[srcId];
    if (!s) return;
    const sx = outX(s), sy = s.y;
    const tx = dst.x - (dst.kind === 'gate' ? GW / 2 : PR);
    const ty = dst.y + (count > 1 ? (slot - (count - 1) / 2) * 20 : 0);
    const via = spec.wires && spec.wires[`${srcId}>${dst.id}#${slot}`];
    const mid = (sx + tx) / 2;
    const pts = via ? [[sx, sy], ...via, [tx, ty]] : [[sx, sy], [mid, sy], [mid, ty], [tx, ty]];
    const d = 'M' + pts.map(p => p.join(',')).join(' L');
    const path = svg('path', { class: 'wire', d });
    wireEls.push({ path, src: srcId });
    root.append(svg('path', { class: 'halo', d }), path);   // otoczka: skrzyzowanie wyglada jak mostek, nie jak polaczenie
  };

  // przewody pod spodem
  for (const n of spec.nodes) {
    if (n.kind === 'gate') gates[n.id].ins.forEach((src, k, all) => wire(src, n, k, all.length));
    if (n.kind === 'out') wire(n.of, n, 0, 1);
  }
  // wezly na wierzchu
  for (const n of spec.nodes) {
    let g;
    if (n.kind === 'gate') {
      const type = gates[n.id].type;
      g = svg('g', { class: 'gate' },
        svg('rect', { x: n.x - GW / 2, y: n.y - GH / 2, width: GW, height: GH, rx: 10 }),
        svg('text', { x: n.x, y: n.y - 6 }, GATE_PL[type]),
        svg('text', { class: 'sub', x: n.x, y: n.y + 11 }, type));
    } else {
      g = svg('g', { class: 'pin ' + n.kind },
        svg('circle', { cx: n.x, cy: n.y, r: PR }),
        svg('text', { x: n.x, y: n.y + 1 }, '0'));
      if (n.kind === 'in') g.addEventListener('click', () => { circuit.toggle(n.id); circuit.settle(); update(); onChange && onChange(); });
    }
    if (n.label) {
      // podpis wejscia stoi po lewej stronie kolka, podpis wyjscia po prawej, podpis bramki pod nia
      const [x, y, anchor] = n.kind === 'gate' ? [n.x, n.y + GH / 2 + 12, 'middle']
        : n.kind === 'in' ? [n.x - PR - 8, n.y + 1, 'end'] : [n.x + PR + 8, n.y + 1, 'start'];
      root.append(svg('text', { class: 'lbl', x, y, style: `text-anchor:${anchor}` }, n.label));
    }
    nodeEls.push({ g, n });
    root.append(g);
  }

  function update() {
    for (const w of wireEls) w.path.classList.toggle('on', circuit.get(w.src) === 1);
    for (const { g, n } of nodeEls) {
      const v = circuit.get(n.kind === 'out' ? n.of : n.id);
      g.classList.toggle('on', v === 1);
      if (n.kind !== 'gate') g.querySelector('text').textContent = v;
    }
  }
  circuit.settle();
  update();
  container.append(root);
  return { update };
}
