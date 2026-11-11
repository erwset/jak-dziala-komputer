import { initPage } from '../core/layout.js';
import { $, $$, el } from '../core/util.js';

initPage();

const COLS = ['id', 'gracz', 'typ', 'x', 'sekunda'];
const ROWS = [
  [1, 7, 'wejście', 12, 0], [2, 3, 'wejście', 15, 4], [3, 7, 'skok', 48, 9], [4, 7, 'zakup', 61, 15],
  [5, 3, 'skok', 33, 18], [6, 9, 'wejście', 10, 21], [7, 3, 'wyjście', 70, 30], [8, 9, 'skok', 55, 34],
  [9, 7, 'skok', 82, 41], [10, 9, 'zakup', 64, 47], [11, 7, 'wyjście', 90, 52], [12, 9, 'wyjście', 20, 60],
];

const QUERIES = [
  {
    name: 'Wszystkie skoki',
    sql: ['SELECT *', 'FROM zdarzenia', "WHERE typ = 'skok'"],
    tr: 'Po ludzku: daj mi wszystkie kolumny z tabeli „zdarzenia", ale tylko dla tych wierszy, w których typ to „skok".',
    col: 2, test: v => v === 'skok', cond: v => `czy typ („${v}") jest równy „skok"?`, out: COLS.map((_, i) => i),
    plan: ['Otwórz tabelę „zdarzenia".', 'Dla każdego wiersza po kolei sprawdź: czy typ równa się „skok"?', 'Jeśli tak, oddaj cały wiersz.'],
  },
  {
    name: 'Kto był daleko',
    sql: ['SELECT gracz, sekunda', 'FROM zdarzenia', 'WHERE x > 50'],
    tr: 'Po ludzku: z tabeli „zdarzenia" weź wiersze, w których pozycja x jest większa niż 50, i pokaż z nich tylko gracza i sekundę.',
    col: 3, test: v => v > 50, cond: v => `czy x (${v}) jest większe niż 50?`, out: [1, 4],
    plan: ['Otwórz tabelę „zdarzenia".', 'Dla każdego wiersza po kolei sprawdź: czy x jest większe niż 50?', 'Jeśli tak, oddaj z niego tylko dwie liczby: gracza i sekundę.'],
  },
  {
    name: 'Ile zdarzeń gracza 7',
    sql: ['SELECT COUNT(*)', 'FROM zdarzenia', 'WHERE gracz = 7'],
    tr: 'Po ludzku: policz, ile jest w tabeli „zdarzenia" wierszy, w których gracz to 7.',
    col: 1, test: v => v === 7, cond: v => `czy gracz (${v}) jest równy 7?`, out: null,
    plan: ['Otwórz tabelę „zdarzenia". Ustaw licznik na zero.', 'Dla każdego wiersza po kolei sprawdź: czy gracz równa się 7?', 'Jeśli tak, dolicz jeden do licznika. Na końcu oddaj licznik.'],
  },
];

let q = QUERIES[0], pos = 0, hits = [];

// tabela
const tab = $('#tab');
tab.append(el('tr', {}, el('th'), COLS.map(c => el('th', {}, c))));
const trs = ROWS.map(r => { const tr = el('tr', {}, el('td', { class: 'mark' }), r.map(v => el('td', { class: typeof v === 'number' ? 'num' : '' }, v))); tab.append(tr); return tr; });

function choose(k) {
  q = QUERIES[k]; pos = 0; hits = [];
  $$('#queries .btn').forEach((b, i) => b.classList.toggle('active', i === k));
  $('#sql').replaceChildren(...q.sql.map(l => el('span', { class: 'ln' }, l)));
  $('#sqlTr').textContent = q.tr;
  $('#plan').replaceChildren(...q.plan.map(p => el('li', {}, p)));
  $('#say').innerHTML = 'Baza zna już plan. Naciśnij „Następny wiersz", żeby zobaczyć, jak go wykonuje.';
  draw();
}

function step() {
  if (pos >= ROWS.length) return;
  const row = ROWS[pos], v = row[q.col], ok = q.test(v);
  if (ok) hits.push(pos);
  $('#say').innerHTML = `<b>Wiersz ${pos + 1} z ${ROWS.length}.</b> Baza bierze z niego jedną wartość i sprawdza: ${q.cond(v)} ` +
    (ok ? `<b>Tak.</b> ${q.out ? 'Wiersz trafia do wyniku.' : `Licznik rośnie do ${hits.length}.`}` : '<b>Nie.</b> Wiersz zostaje pominięty.') +
    (pos === ROWS.length - 1 ? ` To był ostatni wiersz. Sprawdzonych: ${ROWS.length}, pasujących: ${hits.length}.` : '');
  pos++;
  draw();
}

function draw() {
  trs.forEach((tr, i) => {
    const done = i < pos, ok = hits.includes(i);
    tr.className = (i === pos - 1 ? 'cur ' : '') + (done ? (ok ? 'yes' : 'no') : '');
    tr.firstChild.textContent = done ? (ok ? '✓' : '✗') : '';
    [...tr.children].forEach((td, c) => td.classList.toggle('chk', i === pos - 1 && c === q.col + 1));
  });
  const res = $('#res');
  if (q.out) {
    res.replaceChildren(el('tr', {}, q.out.map(c => el('th', {}, COLS[c]))),
      ...hits.map(i => el('tr', {}, q.out.map(c => el('td', { class: typeof ROWS[i][c] === 'number' ? 'num' : '' }, ROWS[i][c])))));
  } else res.replaceChildren(el('tr', {}, el('th', {}, 'liczba wierszy')), el('tr', {}, el('td', { class: 'num' }, hits.length)));
  $('#count').textContent = `Sprawdzonych wierszy: ${pos} z ${ROWS.length}.`;
  $('#next').disabled = pos >= ROWS.length;
}

QUERIES.forEach((x, k) => $('#queries').append(el('button', { class: 'btn', onclick: () => choose(k) }, x.name)));
$('#next').onclick = step;
$('#all').onclick = () => { while (pos < ROWS.length) step(); };
$('#reset').onclick = () => choose(QUERIES.indexOf(q));
choose(0);
