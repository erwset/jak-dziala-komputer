import { initPage } from '../core/layout.js';
import { $, el, fitCanvas, cssVar, onRedraw } from '../core/util.js';
import { OP, SAND_PROGRAM, SAND_LABELS } from '../core/cpu-sim.js';
import { cpuWidget } from '../core/cpu-widget.js';

initPage();

// maly podglad: tak program "rozumie" skrytki 12 i 14
const canvas = el('canvas', { class: 'c2d' });
function drawGrains(cpu) {
  const { ctx, w, h } = fitCanvas(canvas, 86);
  ctx.clearRect(0, 0, w, h);
  ctx.font = '11px ' + cssVar('--font'); ctx.textBaseline = 'middle';
  [[12, 'ziarnko 1'], [14, 'ziarnko 2']].forEach(([a, name], k) => {
    const y = 24 + k * 38, x0 = 70, x1 = w - 16;
    ctx.fillStyle = cssVar('--muted'); ctx.textAlign = 'left'; ctx.fillText(name, 8, y);
    ctx.fillStyle = cssVar('--line'); ctx.fillRect(x0, y, x1 - x0, 2);
    const x = x0 + cpu.mem[a] / 255 * (x1 - x0);
    ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fillStyle = cssVar('--sand'); ctx.fill();
    ctx.fillStyle = cssVar('--muted'); ctx.textAlign = 'center'; ctx.fillText(cpu.mem[a], x, y - 15);
  });
}

const widget = cpuWidget($('#cpu'), {
  program: SAND_PROGRAM, labels: SAND_LABELS, selected: 13,
  extra: {
    node: el('div', {}, canvas, el('p', { class: 'hint', style: 'margin:4px 0 0' }, 'Tak program „rozumie" skrytki 12 i 14: jako położenie dwóch ziaren.')),
    draw: drawGrains,
  },
  note: ev => (ev.phase !== 'wykonaj' ? '' : ev.op === OP.ZAPISZ ? ' Dopiero teraz ziarnko naprawdę się przesunęło.'
    : ev.op === OP.SKOCZ && ev.addr === 0 ? ' Program zaczyna kolejne okrążenie, czyli następną klatkę.' : ''),
});
onRedraw(() => widget.draw());
