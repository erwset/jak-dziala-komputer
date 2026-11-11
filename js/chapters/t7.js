import { initPage } from '../core/layout.js';
import { $, svg, fmt, loopWhileVisible } from '../core/util.js';

initPage();

// ---------- maly zestaw do rysowania schematow z tranzystorami ----------
function schematic(container, w, h) {
  const root = svg('svg', { class: 'cm', viewBox: `0 0 ${w} ${h}` });
  if (w > 400) { container.classList.add('hs'); root.style.setProperty('--minw', Math.round(w * 0.9) + 'px'); }
  container.append(root);
  const level = (p, v) => { p.classList.toggle('hi', v === 1); p.classList.toggle('fl', v === null); return p; };
  return {
    root,
    wire(...pts) {
      const d = 'M' + pts.map(p => p.join(',')).join(' L');
      const p = svg('path', { class: 'w', d });
      root.append(svg('path', { class: 'halo', d }), p);
      return { set: v => level(p, v), flow: on => p.classList.toggle('flow', on) };
    },
    rail(x1, x2, y, label, hi) {
      root.append(svg('line', { class: 'rail' + (hi ? ' hi' : ''), x1, x2, y1: y, y2: y }), svg('text', { class: 's', x: x2 + 12, y, style: 'text-anchor:start' }, label));
    },
    // tranzystor: "rura" pionowo od (x, y-28) do (x, y+28), bramka z lewej od (x-44, y)
    mos(x, y, type) {
      const g = svg('g', { class: 'mos' },
        svg('line', { x1: x, y1: y - 28, x2: x, y2: y - 13 }), svg('line', { x1: x, y1: y + 13, x2: x, y2: y + 28 }),
        svg('rect', { class: 'ch', x: x - 8, y: y - 13, width: 16, height: 26, rx: 3 }),
        svg('line', { x1: x - 17, y1: y - 15, x2: x - 17, y2: y + 15 }),
        svg('line', { x1: x - 44, y1: y, x2: type === 'P' ? x - 27 : x - 17, y2: y }),
        type === 'P' ? svg('circle', { cx: x - 22, cy: y, r: 5 }) : '',
        svg('text', { class: 's', x: x + 24, y }, 'typ ' + type));
      root.append(g);
      return { open: on => g.classList.toggle('open', on) };
    },
    pin(x, y, label, onclick) {
      const t = svg('text', { x, y: y + 1 }, '0');
      const g = svg('g', { class: 'pin', onclick }, svg('circle', { cx: x, cy: y, r: 14 }), t);
      root.append(g, svg('text', { class: 's', x, y: y - 26 }, label));
      return { set: v => { g.classList.toggle('on', !!v); t.textContent = v; } };
    },
    lamp(x, y, label) {
      const c = svg('circle', { class: 'lampc', cx: x, cy: y, r: 15 });
      const t = svg('text', { x, y: y + 1, style: 'font-family:var(--mono);fill:#1a1206' }, '');
      root.append(c, t, svg('text', { class: 's', x, y: y - 27 }, label));
      return { set: v => { c.classList.toggle('on', !!v); t.textContent = v; } };
    },
    text(x, y, s) { root.append(svg('text', { class: 's', x, y }, s)); },
  };
}

// ---------- pojedynczy tranzystor ----------
function tap(container, type) {
  const s = schematic(container, 300, 310);
  let g = 0;
  s.text(150, 14, 'plus zasilania'); s.text(150, 298, 'minus zasilania');
  const top = s.wire([150, 26], [150, 92]), mid = s.wire([150, 148], [150, 188]), bot = s.wire([150, 222], [150, 284]);
  const gw = s.wire([64, 120], [106, 120]);
  const m = s.mos(150, 120, type), lamp = s.lamp(150, 205, '');
  s.text(210, 205, 'żarówka');
  const pin = s.pin(50, 120, 'bramka', () => { g ^= 1; update(); });
  function update() {
    const open = type === 'N' ? g === 1 : g === 0;
    pin.set(g); gw.set(g); m.open(open); lamp.set(open ? 1 : 0);
    top.set(1); mid.set(open ? 1 : 0); bot.set(open ? 1 : 0);
    [top, mid, bot].forEach(w => w.flow(open));
  }
  update();
}
tap($('#tapN'), 'N');
tap($('#tapP'), 'P');

// ---------- bramka NIE ----------
{
  const s = schematic($('#inv'), 620, 340);
  let a = 0;
  s.rail(220, 380, 30, 'plus zasilania', true); s.rail(220, 380, 310, 'minus zasilania', false);
  const top = s.wire([300, 30], [300, 72]), bot = s.wire([300, 268], [300, 310]);
  const mid = s.wire([300, 128], [300, 212]), out = s.wire([300, 170], [470, 170]);
  const inw = s.wire([94, 170], [200, 170]), up = s.wire([200, 170], [200, 100], [256, 100]), dn = s.wire([200, 170], [200, 240], [256, 240]);
  const p = s.mos(300, 100, 'P'), n = s.mos(300, 240, 'N');
  const lamp = s.lamp(487, 170, 'wyjście');
  const pin = s.pin(80, 170, 'wejście', () => { a ^= 1; update(); });
  function update() {
    const o = a ^ 1;
    pin.set(a); [inw, up, dn].forEach(w => w.set(a));
    p.open(a === 0); n.open(a === 1);
    top.set(1); bot.set(0); mid.set(o); out.set(o); lamp.set(o);
    $('#invSay').innerHTML = a === 0
      ? 'Na wejściu <b>zero</b>. Górny tranzystor (typ P) przewodzi właśnie dlatego, że na bramce nie ma napięcia. Dolny jest zamknięty. Wyjście jest połączone z plusem, więc ma wysokie napięcie: <b>jedynka</b>.'
      : 'Na wejściu <b>jedynka</b>. Dolny tranzystor (typ N) przewodzi, górny się zamknął. Wyjście jest połączone z minusem, więc napięcie z niego „spłynęło": <b>zero</b>.';
  }
  update();
}

// ---------- bramka NIE-I ----------
{
  const s = schematic($('#nand'), 680, 400);
  let a = 0, b = 0;
  s.rail(220, 420, 30, 'plus zasilania', true); s.rail(220, 420, 370, 'minus zasilania', false);
  const t1 = s.wire([260, 30], [260, 72]), t2 = s.wire([380, 30], [380, 72]);
  const node = s.wire([260, 128], [260, 160], [380, 160], [380, 128]);
  const down = s.wire([320, 160], [320, 192]), out = s.wire([380, 160], [540, 160]);
  const mid = s.wire([320, 248], [320, 272]), bot = s.wire([320, 328], [320, 370]);
  const aw = s.wire([84, 220], [276, 220]), aup = s.wire([150, 220], [150, 100], [216, 100]);
  const bw = s.wire([84, 300], [276, 300]), bup = s.wire([190, 300], [190, 54], [330, 54], [330, 100], [336, 100]);
  const p1 = s.mos(260, 100, 'P'), p2 = s.mos(380, 100, 'P'), nA = s.mos(320, 220, 'N'), nB = s.mos(320, 300, 'N');
  const lamp = s.lamp(557, 160, 'wyjście');
  const pa = s.pin(70, 220, 'wejście A', () => { a ^= 1; update(); });
  const pb = s.pin(70, 300, 'wejście B', () => { b ^= 1; update(); });
  function update() {
    const o = (a & b) ^ 1;
    pa.set(a); pb.set(b); [aw, aup].forEach(w => w.set(a)); [bw, bup].forEach(w => w.set(b));
    p1.open(a === 0); p2.open(b === 0); nA.open(a === 1); nB.open(b === 1);
    [t1, t2].forEach(w => w.set(1)); bot.set(0);
    [node, down, out].forEach(w => w.set(o)); lamp.set(o);
    mid.set(b ? 0 : a ? o : null);
    const upOpen = [a === 0 && 'lewy', b === 0 && 'prawy'].filter(Boolean);
    $('#nandSay').innerHTML = o
      ? `Wejścia: <b>${a} i ${b}</b>. Na górze przewodzi ${upOpen.length === 2 ? 'lewy i prawy tranzystor' : upOpen[0] + ' tranzystor'}, więc wyjście ma połączenie z plusem. Na dole droga do minusa jest przerwana, bo nie przewodzą oba naraz. Wyjście: <b>jedynka</b>.`
      : 'Wejścia: <b>1 i 1</b>. Oba dolne tranzystory przewodzą i razem tworzą drogę do minusa. Oba górne są zamknięte. Wyjście: <b>zero</b>. To jedyny przypadek, w którym bramka NIE-I daje zero.';
  }
  update();
}

// ---------- napiecie i strefa niczyja ----------
{
  const inv = v => 1 / (1 + Math.exp(22 * (v - 0.5)));
  let jitter = 0;
  const word = v => (v >= 0.7 ? 'jedynka' : v <= 0.3 ? 'zero' : 'nie wiadomo');
  function draw() {
    const base = Number($('#vin').value) / 100;
    const v0 = Math.min(1, Math.max(0, base + jitter)), v1 = inv(v0), v2 = inv(v1);
    [v0, v1, v2].forEach((v, i) => { $('#m' + i).style.left = (v * 100) + '%'; $('#t' + i).textContent = fmt(v) + ' V'; });
    $('#vinTxt').textContent = fmt(base) + ' V';
    $('#vSay').innerHTML = `Na wejściu ${fmt(v0)} wolta: <b>${word(v0)}</b>. Po dwóch bramkach ${fmt(v2)} wolta: <b>${word(v2)}</b>. ` +
      (word(v0) === 'nie wiadomo' ? 'Wejście wpadło w strefę niczyją i bramki same „zdecydowały", w którą stronę je zepchnąć. Tego projektanci unikają.' :
        Math.abs(v2 - v0) > 0.03 ? 'Sygnał wyszedł <b>czystszy</b>, niż wszedł: bramki dopchnęły go do pełnego zera albo pełnej jedynki.' : 'Sygnał był już czysty.');
  }
  $('#vin').oninput = draw;
  let acc = 0;
  loopWhileVisible($('#vin'), dt => {
    acc += dt;
    if (acc < 0.15) return;
    acc = 0;
    jitter = $('#noise').checked ? (Math.random() - 0.5) * 0.3 : 0;
    draw();
  });
  draw();
}
