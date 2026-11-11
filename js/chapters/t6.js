import { initPage } from '../core/layout.js';
import { $, el, loopWhileVisible } from '../core/util.js';
import { Circuit } from '../core/logic-sim.js';
import { circuitView } from '../core/circuit-view.js';

initPage();

// ---------- zatrzask z dwoch bramek ----------
{
  const c = new Circuit();
  c.input('R'); c.input('S');
  c.gate('Q', 'NOR', 'R', 'Qn');
  c.gate('Qn', 'NOR', 'Q', 'S');
  c.set('R', 1).settle(); c.set('R', 0).settle();     // zacznij od zapamietanego zera
  const say = () => {
    const s = c.get('S'), r = c.get('R'), q = c.get('Q');
    $('#srSay').innerHTML = s && r ? 'Oba przyciski naraz to sprzeczne polecenie: „ustaw" i „skasuj" jednocześnie. Układ nie ma jak tego sensownie zapamiętać. Projektanci pilnują, żeby do tego nie dochodziło.'
      : s ? 'Świeci „ustaw". Wymusza ono jedynkę w pętli. Zapamiętany bit: <b>1</b>. Teraz zgaś „ustaw".'
      : r ? 'Świeci „skasuj". Wymusza ono zero w pętli. Zapamiętany bit: <b>0</b>. Teraz zgaś „skasuj".'
      : `Oba przyciski zgaszone, a zapamiętany bit to nadal <b>${q}</b>. Nic go nie wymusza z zewnątrz: bramki podtrzymują się nawzajem przez skrzyżowane przewody.`;
  };
  circuitView($('#sr'), c, {
    w: 800, h: 280,
    nodes: [
      { id: 'R', kind: 'in', x: 130, y: 60, label: 'skasuj' },
      { id: 'S', kind: 'in', x: 130, y: 220, label: 'ustaw' },
      { id: 'Q', kind: 'gate', x: 380, y: 80 },
      { id: 'Qn', kind: 'gate', x: 380, y: 200 },
      { id: 'o', kind: 'out', of: 'Q', x: 600, y: 80, label: 'zapamiętany bit' },
    ],
    wires: {
      'Qn>Q#1': [[470, 200], [470, 150], [300, 130], [300, 90]],
      'Q>Qn#0': [[440, 80], [440, 130], [300, 150], [300, 190]],
    },
  }, { onChange: say });
  say();
}

// ---------- skrytka z furtka ----------
{
  const c = new Circuit();
  c.input('D'); c.input('EN');
  c.gate('nd', 'NOT', 'D');
  c.gate('aS', 'AND', 'D', 'EN');
  c.gate('aR', 'AND', 'nd', 'EN');
  c.gate('n1', 'NOR', 'aS', 'n2');
  c.gate('n2', 'NOR', 'n1', 'aR');
  c.set('EN', 1).settle(); c.set('EN', 0).settle();
  const say = () => {
    const d = c.get('D'), en = c.get('EN'), q = c.get('n2');
    $('#dlSay').innerHTML = en
      ? `Furtka <b>otwarta</b>: zapamiętany bit podąża za danymi i wynosi teraz <b>${q}</b>. Zgaś „zapisz", żeby go zatrzasnąć.`
      : `Furtka <b>zamknięta</b>. Zapamiętany bit to <b>${q}</b>, a na przewodzie danych jest ${d}. Zmieniaj dane do woli: pętla ich nie widzi. Żeby zapisać nową wartość, zapal i zgaś „zapisz".`;
  };
  circuitView($('#dl'), c, {
    w: 900, h: 300,
    nodes: [
      { id: 'D', kind: 'in', x: 110, y: 60, label: 'dane' },
      { id: 'EN', kind: 'in', x: 110, y: 240, label: 'zapisz' },
      { id: 'nd', kind: 'gate', x: 250, y: 150 },
      { id: 'aS', kind: 'gate', x: 400, y: 70 },
      { id: 'aR', kind: 'gate', x: 400, y: 230 },
      { id: 'n1', kind: 'gate', x: 590, y: 90 },
      { id: 'n2', kind: 'gate', x: 590, y: 210 },
      { id: 'o', kind: 'out', of: 'n2', x: 760, y: 210, label: 'zapamiętany bit' },
    ],
    wires: {
      'D>nd#0': [[160, 60], [160, 150]],
      'EN>aS#1': [[195, 240], [195, 80]],
      'nd>aR#0': [[320, 150], [320, 220]],
      'n2>n1#1': [[680, 210], [680, 160], [510, 140], [510, 100]],
      'n1>n2#0': [[650, 90], [650, 140], [510, 160], [510, 200]],
    },
  }, { onChange: say });
  say();
}

// ---------- rejestr ----------
{
  let input = 0b00001101, stored = 0;
  const inEls = [], stEls = [];
  const reg = $('#reg');
  reg.append(el('span', { class: 'lab' }, 'na wejściu'));
  for (let i = 7; i >= 0; i--) { const b = el('button', { class: 'bit', onclick: () => { input ^= 1 << i; draw(); } }); inEls.push([b, i]); reg.append(b); }
  reg.append(el('span', { class: 'lab' }, 'zapamiętane'));
  for (let i = 7; i >= 0; i--) { const b = el('span', { class: 'bit ro' }); stEls.push([b, i]); reg.append(b); }
  const draw = (just = false) => {
    for (const [b, i] of inEls) { const v = (input >> i) & 1; b.textContent = v; b.classList.toggle('on', !!v); }
    for (const [b, i] of stEls) { const v = (stored >> i) & 1; b.textContent = v; b.classList.toggle('on', !!v); }
    $('#regSay').innerHTML = just ? `Tyk. Rejestr skopiował wejście i pamięta teraz liczbę <b>${stored}</b>. Zmień bity na wejściu: zapamiętana liczba nie drgnie aż do następnego tyknięcia.`
      : `Na wejściu stoi liczba ${input}, w rejestrze zapamiętana jest <b>${stored}</b>. ${input === stored ? '' : 'Dopóki zegar nie tyknie, rejestr trzyma starą wartość.'}`;
  };
  $('#clk').onclick = () => { stored = input; draw(true); };
  draw();
}

// ---------- trzy sposoby ----------
{
  let power = true, sram = 0, level = 0, flash = 0, dramBit = 0;
  const draw = () => {
    const loop = $('#sLoop');
    loop.textContent = power ? sram : '?'; loop.classList.toggle('on', power && sram === 1); loop.classList.toggle('dead', !power);
    $('#sRead').textContent = power ? `odczyt: ${sram}` : 'bez prądu pętla nie działa';
    $('#dLevel').style.height = (level * 100) + '%';
    $('#dRead').textContent = `odczyt: ${level > 0.5 ? 1 : 0}` + (dramBit === 1 && level <= 0.5 ? ' (bit przepadł!)' : '');
    $('#fTrap').replaceChildren(...Array.from({ length: flash ? 12 : 0 }, () => el('i')));
    $('#fRead').textContent = `odczyt: ${flash}`;
    $('#power').textContent = power ? 'Wyłącz prąd' : 'Włącz prąd';
  };
  const write = v => {
    if (!power) { $('#memSay').textContent = 'Bez prądu nie da się niczego zapisać. Najpierw włącz prąd.'; return; }
    sram = v; dramBit = v; level = v; flash = v;
    $('#memSay').innerHTML = `Zapisano <b>${v}</b> we wszystkich trzech. Pętla ustawiła się w jednym z dwóch położeń, wiaderko jest ${v ? 'pełne' : 'puste'}, a w pułapce ${v ? 'siedzą elektrony' : 'nie ma elektronów'}.`;
    draw();
  };
  $('#w1').onclick = () => write(1);
  $('#w0').onclick = () => write(0);
  $('#power').onclick = () => {
    power = !power;
    if (power) { sram = Math.random() < 0.5 ? 0 : 1; dramBit = level > 0.5 ? 1 : 0; }
    $('#memSay').innerHTML = power
      ? `Prąd wrócił. Pętla ustawiła się przypadkowo (wypadło ${sram}), wiaderko zdążyło wyciec, a pułapka pamięta to, co miała: <b>${flash}</b>. Dlatego po włączeniu komputer musi wczytać wszystko od nowa z dysku.`
      : 'Prąd wyłączony. Pętla przestała działać od razu. Wiaderka nikt już nie dolewa, więc powoli wycieka. Pułapka nie potrzebuje prądu, żeby trzymać elektrony.';
    draw();
  };
  loopWhileVisible($('#dLevel').parentElement, dt => {
    if (level <= 0) return;
    level = Math.max(0, level - dt * 0.14);                      // wiaderko przecieka
    if (power && $('#refresh').checked && level > 0.5 && level < 0.78) level = 1;   // odswiezanie: odczytaj i dolej do pelna
    draw();
  });
  draw();
  $('#memSay').textContent = 'Naciśnij „Zapisz 1", poczekaj chwilę i patrz na wiaderko. Potem wyłącz prąd.';
}
