import { initPage } from '../core/layout.js';
import { $, $$, svg, fmt, fitCanvas, cssVar, loopWhileVisible } from '../core/util.js';
import { makeScene, THREE } from '../core/scene3d.js';
import { buildLattice, buildMosfet } from '../core/models3d.js';
import { stepper } from '../core/stepper.js';

initPage();
const rnd = (a, b) => a + Math.random() * (b - a);

// ================= krysztal =================
{
  const S = makeScene($('#lattice'), { cam: [2.6, 1.9, 3.1], target: [0, 0, 0], zoom: false });
  const lat = buildLattice(2);
  S.scene.add(lat.group);
  S.controls.autoRotate = true; S.controls.autoRotateSpeed = 0.8;

  const electron = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), new THREE.MeshBasicMaterial({ color: 0x3aa0ff }));
  const hole = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const holeRim = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff6f95, side: THREE.BackSide }));
  hole.add(holeRim);
  lat.group.add(electron, hole);

  let mode = '', from = new THREE.Vector3(), to = new THREE.Vector3(), k = 1, bond = 0;
  const nearCenter = lat.bonds.map((b, i) => i).filter(i => lat.bonds[i].a === lat.center);
  const pickTarget = () => {
    if (mode === 'N') {            // wolny elektron bladzi miedzy atomami
      from.copy(electron.position);
      const a = lat.atoms[Math.floor(Math.random() * lat.atoms.length)].p;
      to.set(a.x + rnd(-0.12, 0.12), a.y + rnd(-0.12, 0.12), a.z + rnd(-0.12, 0.12));
    } else {                       // dziura przeskakuje na sasiednie wiazanie
      const cur = lat.bonds[bond];
      const next = lat.bonds.map((b, i) => i).filter(i => i !== bond && (lat.bonds[i].a === cur.a || lat.bonds[i].b === cur.b || lat.bonds[i].a === cur.b || lat.bonds[i].b === cur.a));
      from.copy(cur.mid);
      bond = next[Math.floor(Math.random() * next.length)] ?? bond;
      to.copy(lat.bonds[bond].mid);
    }
    k = 0;
  };
  function setMode(m) {
    mode = m;
    lat.setDopant(m);
    electron.visible = m === 'N'; hole.visible = m === 'P';
    if (m === 'N') electron.position.copy(lat.atoms[lat.center].p).add(new THREE.Vector3(0.15, 0.1, 0));
    if (m === 'P') { bond = nearCenter[0]; hole.position.copy(lat.bonds[bond].mid); }
    k = 1;
    $$('[data-dop]').forEach(b => b.classList.toggle('active', b.dataset.dop === m));
    $('#latSay').innerHTML = m === 'N'
      ? 'Zielony atom to <b>fosfor</b>. Ma o jeden elektron więcej, niż potrzeba do trzymania czterech sąsiadów. Ten nadliczbowy (niebieska kulka) nie jest do niczego przywiązany i błąka się po krysztale. Jeśli przyłożysz napięcie, popłynie.'
      : m === 'P' ? 'Różowy atom to <b>bor</b>. Ma o jeden elektron za mało, więc w jednym z wiązań jest puste miejsce (biała kulka z różową obwódką). Sąsiednie elektrony w nie przeskakują, a puste miejsce wędruje po krysztale.'
      : 'Czysty krzem: każdy atom trzyma czterech sąsiadów i wszystkie elektrony są zajęte. Nie ma niczego, co mogłoby swobodnie płynąć.';
  }
  S.onFrame(dt => {
    if (!mode) return;
    if (k >= 1) pickTarget();
    k = Math.min(1, k + dt * (mode === 'N' ? 1.1 : 1.6));
    (mode === 'N' ? electron : hole).position.lerpVectors(from, to, k * k * (3 - 2 * k));
  });
  $$('[data-dop]').forEach(b => { b.onclick = () => setMode(b.dataset.dop); });
  setMode('');
}

// ================= parking =================
{
  const SL = 18, canvas = $('#park');
  let mat = 'si', dope = '', volt = false, phase = 0;
  let upper = [], holes = [];
  function rebuild() {
    const t = Number($('#temp').value) / 100;
    upper = []; holes = [];
    const slots = n => { const s = new Set(); while (s.size < n) s.add(Math.floor(Math.random() * SL)); return [...s]; };
    if (mat === 'metal') upper = slots(9).map(x => ({ x }));
    if (mat === 'si') {
      const hot = Math.round(t * 3);              // cieplo przerzuca kilka samochodow na gore
      const up = hot + (dope === 'N' ? 5 : 0), dn = hot + (dope === 'P' ? 5 : 0);
      upper = slots(up).map(x => ({ x })); holes = slots(dn);
    }
    $$('[data-mat]').forEach(b => b.classList.toggle('active', b.dataset.mat === mat));
    $$('[data-pd]').forEach(b => { b.classList.toggle('active', b.dataset.pd === dope); b.disabled = mat !== 'si'; });
    say();
  }
  function say() {
    const moving = upper.length + holes.length;
    const v = volt ? '' : ' Naciśnij „Przyłóż napięcie", żeby zobaczyć, co się ruszy.';
    $('#parkSay').innerHTML =
      mat === 'metal' ? 'W <b>metalu</b> jest jedno piętro zapełnione tylko w połowie. Każdy samochód ma obok wolne miejsce, więc wystarczy lekko popchnąć (przyłożyć napięcie), a wszystkie ruszają. Metal przewodzi zawsze, dlatego nie da się z niego zrobić przełącznika.' + v
      : mat === 'iso' ? 'W <b>izolatorze</b> dolne piętro jest pełne, górne puste, a przerwa między nimi tak duża, że ciepło nie przerzuci ani jednego samochodu. Nic nie może się ruszyć. Prąd nie płynie, obojętnie jak ustawisz temperaturę.'
      : moving === 0 ? '<b>Czysty krzem na zimno</b>: dolne piętro pełne, górne puste. Wygląda jak izolator. Podnieś temperaturę albo dodaj domieszkę.'
      : dope === 'N' ? `<b>Krzem z fosforem (typ N)</b>: każdy atom fosforu przywiózł jeden nadliczbowy samochód, który nie zmieścił się na dole i stoi na górnym piętrze. Tam ma mnóstwo miejsca, więc jeździ swobodnie. Ruchomych samochodów na górze: ${upper.length}.` + v
      : dope === 'P' ? `<b>Krzem z borem (typ P)</b>: każdy atom boru zostawił na dolnym piętrze jedno wolne miejsce. Teraz samochody z dołu mogą się przesuwać: sąsiad wjeżdża na wolne miejsce, a wolne miejsce wędruje w przeciwną stronę. Wolnych miejsc na dole: ${holes.length}.` + v
      : `<b>Czysty krzem na ciepło</b>: ciepło przerzuciło ${upper.length === 1 ? 'jeden samochód' : upper.length + ' samochody'} na górne piętro. Każdy taki przeskok daje od razu dwie ruchome rzeczy: samochód na górze i wolne miejsce na dole. To bardzo mało, więc krzem przewodzi słabo.` + v;
  }
  function draw() {
    const { ctx, w, h } = fitCanvas(canvas, 250);
    ctx.clearRect(0, 0, w, h);
    const narrow = w < 470;                          // telefon: podpisy pieter nad pietrem zamiast z lewej
    const x0 = narrow ? 8 : 150, sw = (w - x0 - (narrow ? 8 : 16)) / SL, cw = sw * 0.72, chh = 20;
    const gap = mat === 'iso' ? 165 : narrow ? 104 : 90;
    const yLow = h - 46, yUp = yLow - gap;
    const floor = (y, title, sub) => {
      ctx.fillStyle = cssVar('--line'); ctx.fillRect(x0, y + 14, w - x0 - (narrow ? 8 : 16), 4);
      ctx.fillStyle = cssVar('--ink'); ctx.font = '600 12px ' + cssVar('--font'); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      if (narrow) {
        const tw = ctx.measureText(title + ': ').width;
        ctx.fillText(title + ':', 8, y - 24);
        ctx.fillStyle = cssVar('--muted'); ctx.font = '11px ' + cssVar('--font'); ctx.fillText(sub, 10 + tw, y - 24);
        return;
      }
      ctx.fillText(title, 8, y - 4);
      ctx.fillStyle = cssVar('--muted'); ctx.font = '11px ' + cssVar('--font'); ctx.fillText(sub, 8, y + 11);
    };
    const car = (sx, y) => { ctx.beginPath(); ctx.roundRect(x0 + sx * sw + (sw - cw) / 2, y - chh / 2, cw, chh, 5); ctx.fill(); };
    ctx.fillStyle = cssVar('--electron');
    if (mat === 'metal') {
      floor(yLow, 'jedno piętro', 'w połowie puste');
      ctx.fillStyle = cssVar('--electron');
      upper.forEach(c => car(c.x, yLow));
      return;
    }
    floor(yUp, 'górne piętro', 'tu można jeździć');
    floor(yLow, 'dolne piętro', 'zwykle pełne');
    ctx.fillStyle = cssVar('--muted'); ctx.font = 'italic 11px ' + cssVar('--font'); ctx.textAlign = 'center';
    ctx.fillText('przerwa: tu nie wolno stać', x0 + (w - x0) / 2, (yUp + yLow) / 2 + 8);
    ctx.fillStyle = cssVar('--electron');
    upper.forEach(c => car(c.x, yUp));
    const ease = phase * phase * (3 - 2 * phase);
    for (let s = 0; s < SL; s++) {
      if (holes.includes(s)) continue;
      const moving = volt && holes.includes((s + 1) % SL);       // ten samochod wjezdza na wolne miejsce po prawej
      if (moving && s === SL - 1) continue;                      // przejazd przez krawedz rysunku pomijamy
      car(s + (moving ? ease : 0), yLow);
    }
  }
  loopWhileVisible(canvas, dt => {
    if (volt) {
      for (const c of upper) { c.x += dt * 2.4; if (c.x > SL - 0.5) c.x -= SL; }
      phase += dt * 2.2;
      if (phase >= 1) { phase = 0; holes = holes.map(hh => (hh - 1 + SL) % SL); }
    }
    draw();
  });
  $$('[data-mat]').forEach(b => { b.onclick = () => { mat = b.dataset.mat; rebuild(); }; });
  $$('[data-pd]').forEach(b => { b.onclick = () => { dope = b.dataset.pd; rebuild(); }; });
  $('#temp').oninput = rebuild;
  $('#volt').onclick = e => { volt = !volt; phase = 0; e.target.textContent = volt ? 'Zdejmij napięcie' : 'Przyłóż napięcie'; say(); };
  rebuild();
}

// ================= zlacze =================
{
  const canvas = $('#pn');
  let mode = 0, d = 0.07;
  const target = [0.07, 0.015, 0.19];
  const N = 46;
  const holesP = Array.from({ length: N }, () => ({ x: rnd(0.02, 0.4), y: rnd(0.08, 0.92) }));
  const elec = Array.from({ length: N }, () => ({ x: rnd(0.6, 0.98), y: rnd(0.08, 0.92) }));
  const sparks = [];
  const TXT = [
    'Bez napięcia. Przy samym styku elektrony i dziury znalazły się nawzajem i zniknęły. Został pusty pas pośrodku, w którym nie ma nic ruchomego. Prąd nie płynie.',
    '<b>Plus po stronie P.</b> Plus odpycha dziury w stronę styku, minus popycha tam elektrony. Pusty pas kurczy się do zera. Elektrony i dziury spotykają się na styku i znoszą, a z obu końców stale napływają nowe. <b>Prąd płynie.</b>',
    '<b>Plus po stronie N.</b> Plus odciąga elektrony od styku, minus odciąga dziury. Pusty pas robi się szeroki. Przez środek nic nie przechodzi. <b>Prąd nie płynie.</b>',
  ];
  function step(dt) {
    d += (target[mode] - d) * Math.min(1, dt * 3);
    const drift = mode === 1 ? 0.16 : mode === 2 ? -0.05 : 0;
    for (const p of holesP) {
      p.x += drift * dt + rnd(-1, 1) * dt * 0.12; p.y = Math.min(0.94, Math.max(0.06, p.y + rnd(-1, 1) * dt * 0.12));
      if (mode === 1 && p.x > 0.5) { sparks.push({ x: 0.5, y: p.y, life: 1 }); p.x = 0.02; }
      p.x = Math.min(mode === 1 ? 0.52 : 0.5 - d, Math.max(0.015, p.x));
    }
    for (const p of elec) {
      p.x += -drift * dt + rnd(-1, 1) * dt * 0.12; p.y = Math.min(0.94, Math.max(0.06, p.y + rnd(-1, 1) * dt * 0.12));
      if (mode === 1 && p.x < 0.5) p.x = 0.98;
      p.x = Math.max(mode === 1 ? 0.48 : 0.5 + d, Math.min(0.985, p.x));
    }
    for (const s of sparks) s.life -= dt * 2.5;
    while (sparks.length && sparks[0].life <= 0) sparks.shift();
  }
  function draw() {
    const { ctx, w, h } = fitCanvas(canvas, 210);
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = cssVar('--hole'); ctx.fillRect(0, 0, w / 2, h);
    ctx.fillStyle = cssVar('--electron'); ctx.fillRect(w / 2, 0, w / 2, h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = cssVar('--panel'); ctx.fillRect(w * (0.5 - d), 0, w * 2 * d, h);     // pusty pas
    ctx.font = '600 12px ' + cssVar('--font'); ctx.textBaseline = 'top'; ctx.fillStyle = cssVar('--muted');
    ctx.textAlign = 'left'; ctx.fillText('krzem typu P' + (mode === 1 ? '   (plus)' : mode === 2 ? '   (minus)' : ''), 10, 8);
    ctx.textAlign = 'right'; ctx.fillText((mode === 1 ? '(minus)   ' : mode === 2 ? '(plus)   ' : '') + 'krzem typu N', w - 10, 8);
    if (d > 0.04) { ctx.textAlign = 'center'; ctx.font = 'italic 11px ' + cssVar('--font'); ctx.fillText('pusty pas', w / 2, h - 18); }
    ctx.fillStyle = cssVar('--hole'); for (const p of holesP) { ctx.beginPath(); ctx.arc(p.x * w, p.y * h, 4.5, 0, 7); ctx.fill(); }
    ctx.fillStyle = cssVar('--electron'); for (const p of elec) { ctx.beginPath(); ctx.arc(p.x * w, p.y * h, 4.5, 0, 7); ctx.fill(); }
    ctx.strokeStyle = cssVar('--on'); ctx.lineWidth = 2;
    for (const s of sparks) { ctx.globalAlpha = Math.max(0, s.life); ctx.beginPath(); ctx.arc(s.x * w, s.y * h, 6 + (1 - s.life) * 10, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  loopWhileVisible(canvas, dt => { step(dt); draw(); });
  $$('[data-pn]').forEach(b => { b.onclick = () => { mode = Number(b.dataset.pn); $$('[data-pn]').forEach(x => x.classList.toggle('active', x === b)); $('#pnSay').innerHTML = TXT[mode]; }; });
  $('#pnSay').innerHTML = TXT[0];
}

// ================= tranzystor =================
{
  const S = makeScene($('#mos'), { cam: [0.6, 1.3, 4.6], target: [0, -0.3, 0], fov: 40 });
  S.controls.minDistance = 2.5; S.controls.maxDistance = 9;
  const mos = buildMosfet();
  S.scene.add(mos.group);
  const slider = $('#vg');
  let shown = -1;
  const frame = (dt, t) => {
    const v = Number(slider.value) / 100;
    const on = mos.update(dt, t, v);
    const state = on <= 0 ? (v < 0.08 ? 0 : 1) : on < 1 ? 2 : 3;
    $('#vgTxt').textContent = fmt(v) + ' V';
    if (state === shown) return;
    shown = state;
    $('#mosSay').innerHTML = [
      'Napięcie na bramce: zero. Między źródłem a drenem leży krzem typu P, pełen dziur, bez wolnych elektronów. Elektrony ze źródła nie mają jak przejść. <b>Tranzystor nie przewodzi: to jest zero.</b>',
      'Bramka zaczyna odpychać dziury w głąb krzemu (zobacz, jak różowe kulki pod bramką się odsuwają). Pod izolatorem robi się pusto, ale elektronów jest jeszcze za mało na most. <b>Wciąż nie przewodzi.</b>',
      'Bramka jest już na tyle naładowana, że ściąga pod izolator elektrony. Zaczyna się tworzyć cienki kanał i pierwsze elektrony przepływają ze źródła do drenu. Tranzystor jest w połowie drogi: tego stanu projektanci chcą jak najszybciej uniknąć.',
      'Pod izolatorem jest gęsty most z elektronów. Źródło i dren są połączone i elektrony płyną. <b>Tranzystor przewodzi: to jest jedynka.</b>',
    ][state];
  };
  S.onFrame(frame);
  frame(0, 0);
  $('#v0').onclick = () => { slider.value = 0; };
  $('#v1').onclick = () => { slider.value = 100; };
}

// ================= litografia =================
{
  const root = $('#litho');
  const R = (x, y, w, h, fill, extra = {}) => { const r = svg('rect', { x, y, width: w, height: h, fill, ...extra }); root.append(r); return r; };
  const T = (x, y, s) => root.append(svg('text', { x, y }, s));
  R(60, 160, 500, 60, '#8a6ea0', { rx: 3 });                                   // plytka
  const doped = R(250, 160, 120, 26, '#2f86e0', { rx: 3 });
  const doped2 = R(110, 160, 90, 26, '#2f86e0', { rx: 3 });
  const oxL = R(60, 148, 190, 12, '#dfe8f2'), oxM = R(250, 148, 120, 12, '#dfe8f2'), oxR = R(370, 148, 190, 12, '#dfe8f2');
  const reL = R(60, 126, 190, 22, '#e08a2c'), reM = R(250, 126, 120, 22, '#e08a2c'), reR = R(370, 126, 190, 22, '#e08a2c');
  const exposed = R(250, 126, 120, 22, '#ffe08a');
  const maskL = R(60, 56, 190, 12, '#39424f'), maskR = R(370, 56, 190, 12, '#39424f');
  const rays = svg('g', {}, ...Array.from({ length: 19 }, (_, i) => {
    const x = 78 + i * 26, through = x > 250 && x < 370;
    return svg('line', { x1: x, x2: x, y1: 14, y2: through ? 124 : 54, stroke: '#a070ff', 'stroke-width': 2.5, 'stroke-dasharray': '6 5', class: 'flow' });
  }));
  const ions = svg('g', {}, ...Array.from({ length: 9 }, (_, i) => svg('circle', { cx: 262 + i * 12, cy: 96 + (i % 3) * 14, r: 4, fill: '#35c46b' })));
  const metal = R(280, 124, 60, 36, '#b4bbc7', { rx: 3 }), metal2 = R(126, 124, 58, 36, '#b4bbc7', { rx: 3 }), gateM = R(205, 136, 40, 12, '#b4bbc7', { rx: 2 });
  root.append(rays, ions);
  T(566, 195, 'krzem'); T(566, 158, 'izolator'); const tRes = svg('text', { x: 566, y: 141 }, 'lakier'); const tMask = svg('text', { x: 566, y: 66 }, 'maska'); root.append(tRes, tMask);
  const show = (els, on) => els.forEach(e => { e.style.opacity = on ? 1 : 0; });
  stepper($('#lithoSteps'), [
    { h: 'płytka', text: 'Zaczynamy od idealnie gładkiej płytki wyciętej z jednego kryształu krzemu, wielkości dużego talerza i cieńszej niż milimetr.' },
    { h: 'warstwy', text: 'Na płytce wytwarza się cieniutką warstwę izolatora, a na niej rozprowadza równo lakier wrażliwy na światło.' },
    { h: 'naświetlanie', text: 'Nad płytką ustawia się maskę, czyli szablon ze wzorem. Świeci się przez nią ultrafioletem. Tam, gdzie światło dotrze, lakier zmienia swoje właściwości. Soczewki po drodze pomniejszają obraz, więc wzór na płytce jest dużo drobniejszy niż na masce.' },
    { h: 'wywołanie i trawienie', text: 'Naświetlony lakier się zmywa, a izolator, który spod niego wyjrzał, wytrawia. Zostaje okienko dokładnie w kształcie wzoru.' },
    { h: 'domieszkowanie', text: 'Przez okienko wstrzeliwuje się w krzem atomy domieszki, na przykład fosforu. Wnikają tylko tam, gdzie nie ma osłony. Tak powstaje wyspa krzemu typu N, czyli przyszłe źródło albo dren tranzystora.' },
    { h: 'i jeszcze raz', text: 'Lakier się usuwa i cały cykl powtarza z innym wzorem: kolejne wyspy, izolator pod bramki, same bramki, a potem kilkanaście pięter metalowych połączeń. Jedna płytka przechodzi przez setki takich kroków, co trwa około trzech miesięcy, i daje kilkaset procesorów naraz.' },
  ].map((s, i) => ({ ...s, enter: () => {
    show([oxL, oxR], i >= 1); show([oxM], i >= 1 && i < 3);
    show([reL, reR], i >= 1 && i < 5); show([reM], i >= 1 && i < 3); show([exposed], i === 2);
    show([maskL, maskR, rays, tMask], i === 2); show([ions], i === 4); show([doped], i >= 4);
    show([doped2, metal, metal2, gateM], i === 5); show([tRes], i >= 1 && i < 5);
  } })));
}
