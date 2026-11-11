import { initPage } from '../core/layout.js';
import { $, $$, el, big } from '../core/util.js';
import { makeScene, THREE, label } from '../core/scene3d.js';
import { zero, apply, cnot, probs, sample, collapsed, bloch } from '../core/quantum.js';

initPage();
const pct = p => Math.round(p * 100) + '%';

// ================= jeden kubit na kuli =================
{
  const S = makeScene($('#sphere'), { cam: [2.3, 1.3, 2.7], target: [0, 0, 0], zoom: false });
  const ring = (rot, color = 0x8a94a3) => {
    const pts = Array.from({ length: 65 }, (_, i) => new THREE.Vector3(Math.cos(i / 64 * Math.PI * 2), 0, Math.sin(i / 64 * Math.PI * 2)));
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 }));
    l.rotation.set(...rot); S.scene.add(l);
  };
  S.scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), new THREE.MeshStandardMaterial({ color: 0x8fa3bf, transparent: true, opacity: 0.13, depthWrite: false })));
  ring([0, 0, 0], 0xffa23a); ring([Math.PI / 2, 0, 0]); ring([0, 0, Math.PI / 2]);
  S.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.15, 0), new THREE.Vector3(0, 1.15, 0)]), new THREE.LineBasicMaterial({ color: 0x8a94a3 })));
  const put = (t, y) => { const l = label(t, { size: 0.26 }); l.position.set(0, y, 0); S.scene.add(l); };
  put('0', 1.35); put('1', -1.35);
  for (const [t, x] of [['A', 1.22], ['B', -1.22]]) { const l = label(t, { size: 0.2, color: '#ffc27a' }); l.position.set(x, 0, 0); S.scene.add(l); }

  const arrow = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x3aa0ff, emissive: 0x1f6fd0, emissiveIntensity: 0.4 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.82, 16), mat); shaft.position.y = 0.41;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 20), mat); head.position.y = 0.9;
  arrow.add(shaft, head); S.scene.add(arrow);

  // os obrotu kazdej bramki (w ukladzie sceny: gora to "0")
  const AXIS = { X: new THREE.Vector3(1, 0, 0), Z: new THREE.Vector3(0, 1, 0), H: new THREE.Vector3(1, 1, 0).normalize() };
  const toScene = ([x, y, z]) => new THREE.Vector3(x, z, y);
  const UP = new THREE.Vector3(0, 1, 0);
  let state = zero(1), shown = new THREE.Vector3(0, 1, 0), anim = null, flash = 0;

  const WHERE = () => {
    const [x, , z] = bloch(state);
    return z > 0.99 ? 'Strzałka wskazuje prosto w górę: to pewne <b>zero</b>.'
      : z < -0.99 ? 'Strzałka wskazuje prosto w dół: to pewna <b>jedynka</b>.'
      : `Strzałka leży na równiku (pomarańczowe koło), w punkcie ${x > 0 ? 'A' : 'B'}: <b>pół na pół</b>. Punkt ${x > 0 ? 'B' : 'A'} po przeciwnej stronie daje te same szanse, ale następne „Pół drogi" zaprowadzi z punktu A do zera, a z punktu B do jedynki.`;
  };
  function refresh(text) {
    const p = probs(state);
    $('#p0').style.width = p[0] * 100 + '%'; $('#p1').style.width = p[1] * 100 + '%';
    $('#p0t').textContent = pct(p[0]); $('#p1t').textContent = pct(p[1]);
    $('#qSay').innerHTML = (text ? text + ' ' : '') + WHERE();
  }
  const NAMES = { X: 'Odwróć', H: 'Pół drogi', Z: 'Obróć wokół osi' };
  $$('[data-g]').forEach(b => { b.onclick = () => {
    const g = b.dataset.g;
    if (anim) shown.copy(toScene(bloch(state)));
    state = apply(state, g);
    anim = { axis: AXIS[g], from: shown.clone(), t: 0 };
    $('#hist').textContent = '';
    refresh(`Bramka „${NAMES[g]}".`);
  }; });
  $('#measure').onclick = () => {
    const p = probs(state), r = sample(state);
    state = collapsed(1, r); anim = null; shown.copy(toScene(bloch(state))); flash = 1;
    $('#hist').textContent = '';
    refresh(`<b>Pomiar: wypadło ${r}</b> (szansa na to wynosiła ${pct(p[r])}). Stan sprzed pomiaru przepadł bezpowrotnie: kubit jest teraz zwykłym ${r}.`);
  };
  $('#m100').onclick = () => {
    let ones = 0;
    for (let i = 0; i < 100; i++) ones += sample(state);
    $('#hist').textContent = `Sto razy przygotowano ten sam stan i zmierzono: zero wypadło ${100 - ones} razy, jedynka ${ones} razy.`;
  };
  $('#qreset').onclick = () => { state = zero(1); anim = null; shown.set(0, 1, 0); $('#hist').textContent = ''; refresh('Kubit przygotowany od nowa.'); };

  S.onFrame(dt => {
    if (anim) {
      anim.t = Math.min(1, anim.t + dt * 1.6);
      const e = anim.t * anim.t * (3 - 2 * anim.t);
      shown.copy(anim.from).applyAxisAngle(anim.axis, Math.PI * e);
      if (anim.t >= 1) { shown.copy(toScene(bloch(state))); anim = null; }
    }
    arrow.quaternion.setFromUnitVectors(UP, shown.clone().normalize());
    flash = Math.max(0, flash - dt * 2);
    mat.emissiveIntensity = 0.4 + flash * 2.5;
  });
  refresh();
}

// ================= trzy doswiadczenia =================
{
  const mk = (id, a, b) => {
    const rows = [a, b].map(name => { const bar = el('div', { class: 'bar' }), n = el('span', { class: 'num' }, '0'); $(id).append(el('span', {}, name), bar, n); return { bar, n }; });
    return counts => rows.forEach((r, i) => { r.bar.style.width = counts[i] + '%'; r.n.textContent = counts[i]; });
  };
  const coin = mk('#eCoin', 'orzeł', 'reszka'), q = mk('#eQ', 'zero', 'jedynka'), qm = mk('#eQm', 'zero', 'jedynka');
  $('#runExp').onclick = () => {
    const c = [0, 0], a = [0, 0], b = [0, 0];
    for (let i = 0; i < 100; i++) {
      Math.random(); c[Math.random() < 0.5 ? 0 : 1]++;                       // dwa rzuty, liczy sie drugi
      a[sample(apply(apply(zero(1), 'H'), 'H'))]++;                            // pol drogi, pol drogi, pomiar
      const mid = sample(apply(zero(1), 'H'));                                 // pol drogi, pomiar...
      b[sample(apply(collapsed(1, mid), 'H'))]++;                              // ...pol drogi, pomiar
    }
    coin(c); q(a); qm(b);
    $('#eSay').innerHTML = `Moneta: ${c[0]} do ${c[1]}, czyli losowo, jak należało się spodziewać. Kubit: <b>${a[0]} do ${a[1]}</b>, za każdym razem zero, bez wyjątku. Kubit podglądany w połowie: ${b[0]} do ${b[1]}, znowu losowo. ` +
      'Samo zajrzenie w połowie zmieniło wynik końcowy, bo pomiar zamienił stan pośredni w zwykłe zero albo jedynkę i nie było już czego ze sobą znosić.';
  };
}

// ================= dwa kubity =================
{
  const NAME = { H0: 'pół drogi na pierwszym', H1: 'pół drogi na drugim', X0: 'odwróć pierwszy', X1: 'odwróć drugi', C: 'jeśli pierwszy to 1, odwróć drugi' };
  const ORDER = [[0, 'pierwszy 0, drugi 0'], [2, 'pierwszy 0, drugi 1'], [1, 'pierwszy 1, drugi 0'], [3, 'pierwszy 1, drugi 1']];
  let ops = ['H0', 'C'], counts = null;
  const rows = ORDER.map(([, name]) => { const bar = el('div', { class: 'bar' }), n = el('span', { class: 'num' }); $('#out2').append(el('span', {}, name), bar, n); return { bar, n }; });
  const run = () => ops.reduce((s, o) => (o === 'C' ? cnot(s, 0, 1) : apply(s, o[0], Number(o[1]))), zero(2));
  const near = (a, b) => Math.abs(a - b) < 0.01;

  function draw() {
    $('#circ').replaceChildren(...(ops.length ? ops.map((o, i) => el('span', {}, `${i + 1}. ${NAME[o]}`)) : [el('em', {}, 'Brak bramek: oba kubity są zerami.')]));
    const p = probs(run());
    ORDER.forEach(([idx], k) => { rows[k].bar.style.width = p[idx] * 100 + '%'; rows[k].n.textContent = counts ? `${counts[idx]} razy` : pct(p[idx]); });
    const first1 = p[1] + p[3], second1 = p[2] + p[3], same = p[0] + p[3];
    const each = near(first1, 0.5) && near(second1, 0.5);
    $('#cSay').innerHTML = (counts ? 'Wyniki stu pomiarów (za każdym razem układ przygotowany od nowa). ' : 'Paski pokazują szanse każdego z czterech możliwych wyników. ') +
      (p.some(x => near(x, 1)) ? 'Wynik jest pewny: te kubity zachowują się teraz jak zwykłe bity.'
        : each && near(same, 1) ? '<b>Splątanie.</b> Każdy kubit z osobna wypada losowo, pół na pół, ale zawsze <b>oba tak samo</b>. Wyniki „jeden zero, drugi jedynka" nie zdarzają się nigdy.'
        : each && near(same, 0) ? '<b>Splątanie.</b> Każdy kubit z osobna wypada losowo, pół na pół, ale zawsze <b>przeciwnie</b> do drugiego.'
        : p.every(x => near(x, 0.25)) ? 'Dwie niezależne monety: każdy z czterech wyników jest równie częsty. Znajomość jednego kubitu nic nie mówi o drugim.'
        : 'Jeden kubit jest losowy, a drugi pewny, albo ich wyniki są ze sobą powiązane tylko częściowo.');
  }
  $$('[data-add]').forEach(b => { b.onclick = () => { if (ops.length < 6) ops.push(b.dataset.add); counts = null; draw(); }; });
  $$('[data-preset]').forEach(b => { b.onclick = () => { ops = b.dataset.preset.split(','); counts = null; draw(); }; });
  $('#cclear').onclick = () => { ops = []; counts = null; draw(); };
  $('#c100').onclick = () => { const s = run(); counts = [0, 0, 0, 0]; for (let i = 0; i < 100; i++) counts[sample(s)]++; draw(); };
  draw();
}

// ================= podwajanie =================
{
  const mem = bytes => {
    const U = [['bajtów', 1], ['tysięcy bajtów', 1e3], ['MB', 1e6], ['GB', 1e9], ['tysięcy GB', 1e12], ['milionów GB', 1e15], ['miliardów GB', 1e18], ['bilionów GB', 1e21]];
    const [name, size] = [...U].reverse().find(([, s]) => bytes >= s) || U[0];
    return `${big(bytes / size)} ${name}`;
  };
  function draw() {
    const n = Number($('#nq').value), count = 2 ** n, bytes = count * 16;
    $('#nqTxt').textContent = n;
    const verdict = n <= 26 ? 'To zmieści się w pamięci telefonu.' : n <= 33 ? 'To zmieści się w pamięci mocnego serwera.'
      : n <= 48 ? 'Do tego potrzeba jednego z największych superkomputerów świata.' : '<b>To nie zmieści się w żadnym istniejącym komputerze.</b>';
    $('#nqSay').innerHTML = `Żeby opisać stan ${n === 1 ? 'jednego kubitu' : n + ' kubitów'}, trzeba zapamiętać tyle liczb: <b>${big(count)}</b>. Zajęłyby około ${mem(bytes)} pamięci. ${verdict} ` +
      (n < 60 ? `Dołóż jeden kubit, a będzie ich ${big(count * 2)}.` : '');
  }
  $('#nq').oninput = draw;
  draw();
}
