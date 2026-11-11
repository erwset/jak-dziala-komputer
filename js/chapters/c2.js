import { initPage } from '../core/layout.js';
import { $, $$, el, fmt } from '../core/util.js';

initPage();

// ================= jeden neuron =================
{
  const IN = [0.8, -0.5, 0.3], NAMES = ['pierwsza', 'druga', 'trzecia'];
  const w = [0.5, -1.0, 0.4];
  const box = $('#neuron'), prod = [], sliders = [], wTxt = [];
  box.append(el('span', { class: 'h' }, 'liczba na wejściu'), el('span', { class: 'h' }, 'waga'), el('span'), el('span', { class: 'h' }, 'iloczyn'));
  IN.forEach((x, i) => {
    const s = el('input', { type: 'range', min: -10, max: 10, value: w[i] * 10, oninput: () => { w[i] = Number(s.value) / 10; draw(); } });
    const t = el('span', { class: 'chip' }), p = el('span', { class: 'chip' });
    sliders.push(s); wTxt.push(t); prod.push(p);
    box.append(el('span', { class: 'chip' }, fmt(x, 1)), t, s, p);
  });
  const sum = el('span', { class: 'chip' }), out = el('span', { class: 'chip out' });
  box.append(el('span', { style: 'grid-column:1 / 4; text-align:right' }, 'suma trzech iloczynów'), sum,
    el('span', { style: 'grid-column:1 / 4; text-align:right' }, 'wyjście neuronu (ujemna suma zamienia się w zero)'), out);
  function draw() {
    let total = 0;
    IN.forEach((x, i) => { const p = x * w[i]; total += p; wTxt[i].textContent = fmt(w[i], 1); prod[i].textContent = fmt(p); });
    sum.textContent = fmt(total); out.textContent = fmt(Math.max(0, total));
    const big = IN.map((x, i) => Math.abs(x * w[i])).reduce((b, v, i, a) => (v > a[b] ? i : b), 0);
    $('#nSay').innerHTML = `Neuron mnoży każdą liczbę przez jej wagę i dodaje wyniki: razem <b>${fmt(total)}</b>. ` +
      (total < 0 ? 'Suma jest ujemna, więc neuron oddaje <b>zero</b>: „to nie dla mnie".' : `Suma jest dodatnia, więc neuron oddaje ją dalej. Najwięcej do wyniku wniosła ${NAMES[big]} liczba.`) +
      ' Waga bliska zera znaczy „ta liczba mnie nie obchodzi", waga ujemna znaczy „im jej więcej, tym gorzej".';
  }
  draw();
}

// ================= warstwa =================
{
  const IN = [0.8, -0.5, 0.3];
  const W = [[0.5, -1.0, 0.4], [-0.6, 0.2, 0.9], [1.0, 0.8, -0.3], [0.1, -0.7, -0.5]];
  let k = 0;                                        // ile mnozen juz wykonano (0..12)
  const inC = IN.map(x => el('span', { class: 'chip' }, fmt(x, 1)));
  $('#lin').append(el('tr', {}, el('th', {}, 'wejście')), ...inC.map(c => el('tr', {}, el('td', {}, c))));
  const wC = W.map(r => r.map(x => el('span', { class: 'chip' }, fmt(x, 1))));
  $('#lw').append(el('tr', {}, el('th', { colspan: 3 }, 'tabela wag: wiersz to jeden neuron')), ...wC.map(r => el('tr', {}, r.map(c => el('td', {}, c)))));
  const outC = W.map(() => el('span', { class: 'chip out' }, '?'));
  $('#lout').append(el('tr', {}, el('th', {}, 'wyjście')), ...outC.map(c => el('tr', {}, el('td', {}, c))));

  function draw(explain = true) {
    const n = Math.floor((k - 1) / 3), j = (k - 1) % 3;                 // ktore mnozenie bylo ostatnie
    wC.forEach((r, a) => r.forEach((c, b) => c.classList.toggle('hot', k > 0 && a === n && b === j)));
    inC.forEach((c, b) => c.classList.toggle('hot', k > 0 && b === j));
    W.forEach((r, a) => {
      const done = Math.min(3, Math.max(0, k - a * 3));
      const partial = r.slice(0, done).reduce((s, x, b) => s + x * IN[b], 0);
      outC[a].textContent = done === 0 ? '?' : done < 3 ? fmt(partial) + ' …' : fmt(Math.max(0, partial));
    });
    $('#lcount').textContent = k;
    $('#lstep').disabled = k >= 12;
    if (!explain) return;
    if (k === 0) { $('#lSay').innerHTML = 'Trzy liczby na wejściu, cztery neurony, czyli dwanaście wag. Każdą wagę trzeba raz pomnożyć przez odpowiadającą jej liczbę wejściową.'; return; }
    const p = W[n][j] * IN[j], run = W[n].slice(0, j + 1).reduce((s, x, b) => s + x * IN[b], 0);
    $('#lSay').innerHTML = `<b>Neuron ${n + 1}, mnożenie ${j + 1} z 3.</b> Liczba z wejścia (${fmt(IN[j], 1)}) razy waga (${fmt(W[n][j], 1)}) daje ${fmt(p)}. ` +
      (j === 0 ? 'To pierwszy składnik sumy tego neuronu.' : `Dodane do poprzednich daje ${fmt(run)}.`) +
      (j === 2 ? (run < 0 ? ` Suma jest ujemna, więc neuron ${n + 1} oddaje <b>zero</b>.` : ` Neuron ${n + 1} oddaje <b>${fmt(run)}</b>.`) : '') +
      (k === 12 ? ' Warstwa policzona: dwanaście mnożeń i osiem dodawań. Cztery liczby po prawej pójdą jako wejście do następnej warstwy.' : '');
  }
  $('#lstep').onclick = () => { k = Math.min(12, k + 1); draw(); };
  $('#lall').onclick = () => { k = 12; draw(); };
  $('#lreset').onclick = () => { k = 0; draw(); };
  draw();
}

// ================= uwaga =================
{
  const T = ['Kot', 'nie', 'wszedł', 'do', 'kuchni', ',', 'bo', 'był', 'zmęczony'];
  // dla wybranego slowa: ile "uwagi" dostaje kazde wczesniejsze (i ono samo); reszta po rowno
  const ATT = {
    0: { 0: 1 },
    1: { 0: 0.6, 1: 0.4 },
    2: { 0: 0.5, 1: 0.3, 2: 0.2 },
    3: { 2: 0.6, 0: 0.1, 1: 0.1, 3: 0.2 },
    4: { 3: 0.4, 2: 0.3, 0: 0.12, 1: 0.08, 4: 0.1 },
    5: { 4: 0.4, 2: 0.3, 5: 0.3 },
    6: { 2: 0.3, 1: 0.3, 0: 0.15, 4: 0.1, 5: 0.1, 6: 0.05 },
    7: { 0: 0.55, 2: 0.12, 6: 0.1, 4: 0.08, 7: 0.08, 1: 0.03, 3: 0.02, 5: 0.02 },
    8: { 0: 0.5, 7: 0.25, 6: 0.08, 2: 0.05, 4: 0.04, 8: 0.05, 1: 0.03 },
  };
  const WHY = {
    7: 'Słowo „był" nie wie samo z siebie, o kim mowa. Najmocniej patrzy na „Kot", bo to on jest tu jedynym kandydatem na tego, kto „był". Na „kuchni" prawie nie patrzy.',
    8: '„Zmęczony" patrzy głównie na „Kot" (kto jest zmęczony?) i na „był" (z którym tworzy całość). Dzięki temu model „wie", że zmęczony był kot, a nie kuchnia.',
    4: '„Kuchni" patrzy przede wszystkim na „do" i „wszedł": to one mówią, w jakiej roli to słowo tu występuje.',
    2: '„Wszedł" patrzy na „Kot" (kto wszedł?) i na „nie" (bo jednak nie wszedł).',
    6: '„Bo" zapowiada wyjaśnienie, więc zbiera to, co wymaga wyjaśnienia: „nie" i „wszedł".',
  };
  let sel = 7;
  const spans = T.map((t, i) => { const s = el('span', { onclick: () => { sel = i; draw(); } }, t, el('small')); $('#sent').append(s); return s; });
  function draw() {
    const a = ATT[sel];
    spans.forEach((s, i) => {
      const w = a[i] || 0;
      s.style.setProperty('--w', i > sel ? 0 : w);
      s.classList.toggle('sel', i === sel); s.classList.toggle('later', i > sel);
      s.lastChild.textContent = i > sel ? '' : w ? Math.round(w * 100) + '%' : '0%';
    });
    $('#aSay').innerHTML = `Wybrane słowo: <b>${T[sel] === ',' ? 'przecinek' : T[sel]}</b>. Procenty pod słowami mówią, ile swojej uwagi kieruje na każde z nich (razem sto). ` +
      (WHY[sel] || 'Im jaśniejsze tło, tym więcej to słowo bierze od tamtego.') +
      (sel < T.length - 1 ? ' Słowa po prawej są wyblakłe, bo model widzi tylko to, co już zostało napisane.' : '');
  }
  draw();
}

// ================= wyniki -> szanse =================
{
  const C = [['kanapie', 3.2], ['dachu', 2.5], ['dywanie', 1.0], ['księżycu', -1.0]];
  const rows = C.map((c, i) => {
    const s = el('input', { type: 'range', min: -30, max: 60, value: c[1] * 10, oninput: () => { c[1] = Number(s.value) / 10; draw(); } });
    const bar = el('div', { class: 'bar' }), pct = el('span', { class: 'num' }), lab = el('span');
    $('#soft').append(lab, s, bar, pct);
    return { bar, pct, lab };
  });
  function draw() {
    const e = C.map(c => Math.exp(c[1])), sum = e.reduce((a, b) => a + b, 0);
    C.forEach((c, i) => {
      const p = e[i] / sum;
      rows[i].lab.innerHTML = `<b>${c[0]}</b> <span class="num" style="color:var(--muted)">${fmt(c[1], 1)}</span>`;
      rows[i].bar.style.width = Math.max(0.5, p * 100) + '%';
      rows[i].pct.textContent = p < 0.005 ? '<1%' : Math.round(p * 100) + '%';
    });
    const best = C.reduce((b, c, i) => (c[1] > C[b][1] ? i : b), 0);
    $('#sSay').innerHTML = `Liczba obok słowa to jego wynik z ostatniej warstwy, pasek to szansa po przeliczeniu. Prowadzi „${C[best][0]}". ` +
      'Przesuń któryś suwak o odrobinę: przewaga jednego punktu w wynikach to prawie trzykrotna przewaga w szansach, dlatego faworyt zgarnia większość.';
  }
  draw();
}
