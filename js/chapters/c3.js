import { initPage } from '../core/layout.js';
import { $, $$, el } from '../core/util.js';
import { makeAdder } from '../core/logic-sim.js';

initPage();

// ================= wyscig: procesor kontra karta graficzna =================
{
  const N = 384, CPU_RATE = 4, GPU_RATE = 64;
  const mk = id => { const cells = Array.from({ length: N }, () => el('i')); $(id).append(...cells); return cells; };
  const cpu = mk('#lCpu'), gpu = mk('#lGpu');
  let timer = null;
  $('#race').onclick = () => {
    clearInterval(timer);
    [...cpu, ...gpu].forEach(c => c.classList.remove('d'));
    let tick = 0, cDone = 0, gDone = 0, gTicks = 0;
    $('#tCpu').textContent = $('#tGpu').textContent = '';
    timer = setInterval(() => {
      tick++;
      for (let i = 0; i < CPU_RATE && cDone < N; i++) cpu[cDone++].classList.add('d');
      if (gDone < N) {                               // 64 pracownikow robi w jednym takcie 64 kratki naraz
        const batch = Math.min(GPU_RATE, N - gDone);
        for (let i = 0; i < batch; i++) gpu[gDone + i].classList.add('d');
        gDone += batch; gTicks = tick;
      }
      $('#tCpu').textContent = `takt ${Math.min(tick, N / CPU_RATE)}: ${cDone} z ${N}`;
      $('#tGpu').textContent = `takt ${gTicks}: ${gDone} z ${N}`;
      if (gDone === N && cDone < N) $('#raceSay').innerHTML = `Karta graficzna skończyła po <b>${gTicks} taktach</b>. Procesor wciąż liczy…`;
      if (cDone === N) {
        clearInterval(timer);
        $('#raceSay').innerHTML = `Karta graficzna: <b>${gTicks} taktów</b>. Procesor: <b>${tick} taktów</b>, czyli ${Math.round(tick / gTicks)} razy dłużej, choć pojedynczo jest cztery razy szybszy od każdego z pracowników karty.`;
      }
    }, 70);
  };
}

// ================= mnozenie pisemne na bitach =================
{
  const adder = makeAdder(8);
  let A = 5, B = 3, step = 0;                 // step: ile bitow drugiej liczby juz obsluzono (0..4)
  const grid = $('#mul');
  const row = (label, n, cls = 'bit ro') => {
    const cells = Array.from({ length: 8 }, () => el('span', { class: cls }));
    const val = el('span', { class: 'val' });
    grid.append(el('span', { class: 'lab' }, label), ...cells, val);
    return { cells, val };
  };
  const mkInput = (label, get, set) => {
    const val = el('span', { class: 'val' });
    grid.append(el('span', { class: 'lab' }, label), ...Array.from({ length: 4 }, () => el('span', { class: 'e' })));
    const btns = [];
    for (let i = 3; i >= 0; i--) { const b = el('button', { class: 'bit', onclick: () => { set(get() ^ (1 << i)); step = 0; draw(); } }); btns.push([b, i]); grid.append(b); }
    grid.append(val);
    return { btns, val };
  };
  const inA = mkInput('pierwsza liczba', () => A, v => { A = v; });
  const inB = mkInput('druga liczba', () => B, v => { B = v; });
  grid.append(el('hr'));
  const parts = [0, 1, 2, 3].map(i => row(`wiersz dla bitu ${i + 1} od prawej`));
  grid.append(el('hr'));
  const total = row('suma dotychczasowych wierszy');

  const paint = (cells, v, visible = true) => cells.forEach((c, k) => { const bit = (v >> (7 - k)) & 1; c.textContent = visible ? bit : ''; c.classList.toggle('on', visible && !!bit); c.classList.toggle('ghost', !visible); });
  function draw() {
    for (const [b, i] of inA.btns) { const v = (A >> i) & 1; b.textContent = v; b.classList.toggle('on', !!v); }
    for (const [b, i] of inB.btns) { const v = (B >> i) & 1; b.textContent = v; b.classList.toggle('on', !!v); b.classList.toggle('cur', i === step - 1); }
    inA.val.textContent = A; inB.val.textContent = B;
    let sum = 0, before = 0, lastPart = 0;
    parts.forEach((p, i) => {
      const part = (B >> i) & 1 ? A << i : 0, shown = i < step;
      paint(p.cells, part, shown); p.val.textContent = shown ? part : '';
      if (shown) { before = sum; sum = adder.add(sum, part).sum; lastPart = part; }   // prawdziwy sumator z bramek
    });
    paint(total.cells, sum, step > 0); total.val.textContent = step > 0 ? sum : '';
    $('#mstep').disabled = step >= 4;
    const i = step - 1, bit = (B >> i) & 1, WHICH = ['Pierwszy', 'Drugi', 'Trzeci', 'Czwarty'];
    $('#mSay').innerHTML = step === 0
      ? `Mnożymy <b>${A}</b> przez <b>${B}</b>. Będziemy szli po bitach drugiej liczby, od prawej.`
      : `<b>${WHICH[i]} bit drugiej liczby od prawej to ${bit}.</b> ` +
        (bit ? `Przepisujemy więc pierwszą liczbę${i ? `, przesuniętą o ${i} ${i === 1 ? 'miejsce' : 'miejsca'} w lewo` : ' bez przesunięcia'}: to ${lastPart}. ` : 'Wpisujemy więc same zera. ') +
        (i === 0 ? `Suma na razie wynosi ${sum}.` : `Sumator dodaje: ${before} i ${lastPart} daje <b>${sum}</b>.`) +
        (step === 4 ? ` To już wszystkie bity. Wynik: ${A} razy ${B} to <b>${sum}</b>.` : '');
  }
  $('#mstep').onclick = () => { step = Math.min(4, step + 1); draw(); };
  $('#mall').onclick = () => { step = 4; draw(); };
  $('#mreset').onclick = () => { step = 0; draw(); };
  $$('[data-m]').forEach(b => { b.onclick = () => { [A, B] = b.dataset.m.split(',').map(Number); step = 0; draw(); }; });
  draw();
}
