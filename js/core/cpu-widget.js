// Interaktywny zabawkowy procesor: pamiec, rejestry, opis slowny, przyciski.
// Uzywany w rozdziale "Procesor" i w sciezce bazy danych ("Porownaj i zdecyduj").
//   cpuWidget(container, { program, labels, selected, showZero, extra: { node, draw(cpu) }, note(ev), startText })
//   note(ev) moze dopisac do opisu zdanie wlasciwe dla danego rozdzialu.
import { el, bin } from './util.js';
import { Cpu, OP, dec } from './cpu-sim.js';

const bits8 = v => bin(v).replace(/(.{4})/, '$1 ');

export function cpuWidget(root, { program, labels = {}, selected = 13, showZero = false, extra = null, note = null, startText = 'Palec stoi na skrytce 0. Naciśnij „Jedno tyknięcie".' }) {
  const cpu = new Cpu(program);
  let sel = selected, touched = -1, hot = '', timer = null;

  // --- budowa ---
  const memBox = el('div', { class: 'memgrid' });
  const cells = Array.from({ length: 16 }, (_, i) => {
    const c = el('div', { class: 'mc' + (labels[i] ? ' data' : ''), onclick: () => { sel = i; draw(); } },
      el('small', {}, 'skrytka ' + i), el('span', { class: 'b' }), el('span', { class: 'm' }));
    memBox.append(c); return c;
  });
  const ticks = el('span', { class: 'num' }, '0');
  const phases = ['1. Pobierz', '2. Odczytaj', '3. Wykonaj'].map(t => el('span', {}, t));
  const reg = (title, cls = '') => { const v = el('div', { class: 'v' }); const box = el('div', { class: 'reg ' + cls }, el('b', { html: title }), v); return { box, v }; };
  const rPc = reg('Palec (<span class="t" data-t="licznik">licznik rozkazów</span>)');
  const rIr = reg('Bieżące polecenie');
  const rA = reg('Podręczna tabliczka (<span class="t" data-t="rejestr">rejestr</span>)');
  const rZ = reg('Znacznik zera (jeden bit: czy ostatni wynik był zerem)');
  const say = el('div', { class: 'say' });
  const btn = (text, onclick, cls = '') => el('button', { class: 'btn ' + cls, onclick }, text);
  const autoBtn = btn('Odtwarzaj', () => (timer ? stopAuto() : startAuto()));
  const speed = el('input', { type: 'range', min: 1, max: 60, value: 4, style: 'width:110px', oninput: () => { if (timer) startAuto(); } });

  root.append(
    el('div', { class: 'row' },
      el('div', { class: 'grow', style: 'flex-basis:400px' }, el('h3', { style: 'margin-top:0' }, 'Pamięć'), memBox,
        el('p', { class: 'hint' }, 'Niebieska ramka: skrytka wskazywana przez palec. Pomarańczowe tło: skrytka właśnie czytana lub zapisywana. Kliknij skrytkę, żeby ją zaznaczyć i zmienić przyciskami pod spodem.')),
      el('div', { class: 'grow cpu', style: 'flex-basis:280px' }, el('h3', { style: 'margin:0' }, 'Procesor'),
        el('div', { class: 'reg' }, el('b', {}, 'Zegar: tyknięcie numer ', ticks), el('div', { class: 'phases' }, phases)),
        rPc.box, rIr.box, rA.box, showZero ? rZ.box : '', extra ? extra.node : '')),
    // opis i glowne przyciski: na waskim ekranie przypiete do dolu, zeby byly widoczne razem z pamiecia
    el('div', { class: 'dock' }, say,
      el('div', { class: 'controls' },
        btn('Jedno tyknięcie', () => { stopAuto(); tick(); }, 'primary'),
        btn('Całe polecenie', () => { stopAuto(); do tick(); while (cpu.phase !== 0 && !cpu.halted); }),
        autoBtn, btn('Od nowa', reset))),
    el('div', { class: 'controls' },
      el('label', { class: 'sl', style: 'width:auto' }, 'Tempo ', speed),
      el('span', { style: 'flex:1' }), el('span', { class: 'hint', style: 'margin:0' }, 'Zaznaczona skrytka:'),
      btn('− 1', () => { cpu.mem[sel]--; draw(); }), btn('+ 1', () => { cpu.mem[sel]++; draw(); })));

  // --- rysowanie ---
  const describe = i => {
    const v = cpu.mem[i];
    if (labels[i]) return `${v} (${labels[i]})`;
    if (v === 0) return 'pusta';
    const d = dec(v);
    return d.op === OP.STOP ? 'STOP' : `${d.name} ${d.addr}`;
  };
  function draw() {
    cells.forEach((c, i) => {
      c.children[1].textContent = bits8(cpu.mem[i]);
      c.children[2].textContent = describe(i);
      c.classList.toggle('pc', i === cpu.pc); c.classList.toggle('rw', i === touched); c.classList.toggle('sel', i === sel);
    });
    ticks.textContent = cpu.ticks;
    phases.forEach((p, k) => p.classList.toggle('on', cpu.ticks > 0 && !cpu.halted && (cpu.phase + 2) % 3 === k));
    rPc.v.innerHTML = `${bin(cpu.pc, 4)} <small>wskazuje skrytkę ${cpu.pc}</small>`;
    const d = dec(cpu.ir);
    rIr.v.innerHTML = cpu.ticks === 0 ? '<small>jeszcze nic nie pobrano</small>' : `${bits8(cpu.ir)} <small>${d.op === OP.STOP ? 'STOP' : d.name + ' ' + d.addr}</small>`;
    rA.v.innerHTML = `${bits8(cpu.a)} <small>jako liczba: ${cpu.a}</small>`;
    rZ.v.innerHTML = `${cpu.zero ? 1 : 0} <small>${cpu.zero ? 'tak, wynik był zerem' : 'nie, wynik nie był zerem'}</small>`;
    rPc.box.classList.toggle('hot', hot.includes('pc')); rIr.box.classList.toggle('hot', hot.includes('ir'));
    rA.box.classList.toggle('hot', hot.includes('a')); rZ.box.classList.toggle('hot', hot.includes('z'));
    extra && extra.draw(cpu);
  }

  // --- opis tego, co sie wlasnie stalo ---
  function narrate(ev) {
    touched = -1; hot = '';
    const lab = a => (labels[a] ? `, czyli „${labels[a]}"` : '');
    if (ev.phase === 'stop') return 'Procesor stoi: trafił na polecenie STOP. Naciśnij „Od nowa".';
    if (ev.phase === 'pobierz') {
      touched = ev.at; hot = 'ir pc';
      return `<b>Pobierz.</b> Palec wskazywał skrytkę ${ev.at}. Procesor skopiował jej zawartość (${bits8(ev.ir)}) do siebie jako bieżące polecenie i przesunął palec na skrytkę ${ev.pc}. Jeszcze nie wie, co to polecenie znaczy.`;
    }
    if (ev.phase === 'odczytaj') {
      hot = 'ir';
      return `<b>Odczytaj.</b> Pierwsze cztery bity (${bin(ev.op, 4)}) to numer polecenia: <b>${ev.name}</b>. Ostatnie cztery (${bin(ev.addr, 4)}) to numer skrytki: <b>${ev.addr}</b>${lab(ev.addr)}. Te bity właśnie przestawiają zwrotnice w procesorze.`;
    }
    const head = `<b>Wykonaj: ${ev.op === OP.STOP ? 'STOP' : ev.name + ' ' + ev.addr}.</b> `;
    switch (ev.op) {
      case OP.WEZ: touched = ev.addr; hot = 'a z';
        return head + `Liczba ze skrytki ${ev.addr}${lab(ev.addr)}, trafia na podręczną tabliczkę. Na tabliczce jest teraz <b>${ev.a}</b>. W skrytce nic się nie zmieniło, to była kopia.`;
      case OP.DODAJ: touched = ev.addr; hot = 'a z';
        return head + `Sumator dostaje dwie liczby: ${ev.aBefore} z tabliczki i ${ev.operand} ze skrytki ${ev.addr}${lab(ev.addr)}. Wynik, <b>${ev.a}</b>, ląduje na tabliczce.` +
          (ev.carry ? ' Uwaga: prawdziwa suma nie zmieściła się w ośmiu bitach, więc dziewiąty bit przepadł i liczba „przekręciła się".' : '');
      case OP.ODEJMIJ: touched = ev.addr; hot = 'a z';
        return head + `Od liczby na tabliczce (${ev.aBefore}) procesor odejmuje liczbę ze skrytki ${ev.addr}${lab(ev.addr)}, czyli ${ev.operand}. Na tabliczce zostaje <b>${ev.a}</b>. ` +
          (ev.a === 0 ? 'Wyszło zero, więc obie liczby były <b>równe</b>. Znacznik zera się zapala.' : 'Nie wyszło zero, więc liczby były <b>różne</b>. Znacznik zera gaśnie.');
      case OP.ZAPISZ: touched = ev.addr;
        return head + `Liczba z tabliczki (<b>${ev.a}</b>) zostaje zapisana do skrytki ${ev.addr}${lab(ev.addr)}.`;
      case OP.SKOCZ: hot = 'pc';
        return head + `Palec zostaje ustawiony na skrytkę ${ev.addr}. Następne polecenie zostanie pobrane stamtąd, a nie z kolejnej skrytki.`;
      case OP.SKOCZ_GDY_ZERO: hot = 'pc z';
        return head + (ev.jumped ? `Znacznik zera świeci, więc palec <b>skacze</b> na skrytkę ${ev.addr}. Procesor właśnie podjął „decyzję".` : 'Znacznik zera nie świeci, więc nic się nie dzieje: palec zostaje tam, gdzie był, i program idzie dalej po kolei.');
      case OP.STOP: return head + 'Procesor się zatrzymuje. Program skończony.';
      default: return head + 'To polecenie nic nie robi. Procesor przejdzie do następnej skrytki.';
    }
  }

  function tick() { const ev = cpu.tick(); say.innerHTML = narrate(ev) + (note ? note(ev) || '' : ''); if (cpu.halted) stopAuto(); draw(); }
  function stopAuto() { clearInterval(timer); timer = null; autoBtn.textContent = 'Odtwarzaj'; }
  function startAuto() { clearInterval(timer); autoBtn.textContent = 'Zatrzymaj'; timer = setInterval(tick, 1000 / Number(speed.value)); }
  function reset() { stopAuto(); cpu.load(program); touched = -1; hot = ''; say.innerHTML = startText; draw(); }

  reset();
  return { cpu, draw, reset };
}
