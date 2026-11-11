import { initPage } from '../core/layout.js';
import { $, $$, el, bin } from '../core/util.js';
import { floatToBits, bitsToBytes } from '../core/bits.js';

initPage();

// ---------- wiersz jako bajty ----------
{
  const FIELDS = [
    { name: 'id', color: '#3d9df2', bytes: bitsToBytes(3), say: 'Numer zdarzenia: <b>3</b>. Zwykła liczba całkowita na czterech bajtach. Trzy pierwsze są zerami, bo liczba jest mała.' },
    { name: 'gracz', color: '#2fa67c', bytes: bitsToBytes(7), say: 'Numer gracza: <b>7</b>. Też liczba całkowita na czterech bajtach. To te bajty baza porównuje, gdy warunek brzmi „gracz równa się 7".' },
    { name: 'typ', color: '#c99716', bytes: [2], say: 'Typ zdarzenia. Zamiast słowa „skok" baza zapisała mały numer: <b>2</b>. Osobno trzyma jedną tabelkę, która mówi, że 2 znaczy „skok". Jeden bajt zamiast czterech liter, i to w każdym wierszu.' },
    { name: 'x', color: '#d9552f', bytes: bitsToBytes(floatToBits(48)), say: 'Pozycja: <b>48,0</b>. To liczba z przecinkiem, zapisana tak jak w rozdziale o bitach: znak, skala, cyfry. Dlatego bajty wyglądają dziwnie (66 i 64), choć liczba jest okrągła.' },
    { name: 'sekunda', color: '#8f4ccc', bytes: bitsToBytes(9), say: 'Sekunda zdarzenia: <b>9</b>. Liczba całkowita na czterech bajtach.' },
  ];
  let picked = 1;
  const cells = [];
  let no = 1;
  FIELDS.forEach((f, k) => {
    const b = el('button', { class: 'btn fbtn', onclick: () => { picked = k; draw(); } }, f.name);
    b.style.setProperty('--c', f.color);
    $('#fields').append(b);
    f.bytes.forEach(v => {
      const c = el('div', { class: 'byte', title: bin(v) }, v, el('small', {}, 'bajt ' + no++));
      c.style.setProperty('--c', f.color);
      cells.push([c, k]); $('#bytes').append(c);
    });
  });
  function draw() {
    cells.forEach(([c, k]) => c.classList.toggle('dim', k !== picked));
    $$('#fields .btn').forEach((b, k) => b.classList.toggle('active', k === picked));
    const first = cells.findIndex(([, k]) => k === picked) + 1, len = FIELDS[picked].bytes.length;
    $('#rowSay').innerHTML = `Pole „${FIELDS[picked].name}" zajmuje ${len === 1 ? `bajt ${first}` : `bajty od ${first} do ${first + len - 1}`}. ${FIELDS[picked].say}`;
  }
  draw();
}

// ---------- strony, dysk, pamiec ----------
{
  const PAGES = 24, SLOTS = 4;
  let ram = [], hits = 0, miss = 0, last = -1, lastSlot = -1, clock = 0, queue = [], timer = null;
  const pg = Array.from({ length: PAGES }, (_, i) => { const d = el('div', { class: 'pg', onclick: () => { stop(); read(i); } }, i + 1); $('#disk').append(d); return d; });
  const slots = Array.from({ length: SLOTS }, () => { const d = el('div', { class: 'slot' }); $('#ram').append(d); return d; });

  const human = s => {                                   // sekundy w ludzkiej skali -> slowa
    if (s < 60) return `${s} ${s === 1 ? 'sekunda' : s >= 2 && s <= 4 ? 'sekundy' : 'sekund'}`;
    const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
    return (h ? `${h} godz. ` : '') + `${m} min`;
  };

  function read(i) {
    clock++;
    let slot = ram.findIndex(r => r.page === i), text;
    if (slot >= 0) {
      hits++; ram[slot].used = clock;
      text = `Strona ${i + 1} leży już w pamięci. Odczyt jest natychmiastowy: w ludzkiej skali <b>jedna sekunda</b>.`;
    } else {
      miss++;
      if (ram.length < SLOTS) { ram.push({ page: i, used: clock }); slot = ram.length - 1; text = `Strony ${i + 1} nie ma w pamięci. Baza przynosi ją z dysku i kładzie na wolnym miejscu: w ludzkiej skali <b>siedemnaście minut</b>.`; }
      else {
        slot = ram.reduce((best, r, k) => (r.used < ram[best].used ? k : best), 0);
        const out = ram[slot].page;
        ram[slot] = { page: i, used: clock };
        text = `Strony ${i + 1} nie ma w pamięci, a wszystkie cztery miejsca są zajęte. Baza wyrzuca stronę ${out + 1}, bo tej najdłużej nikt nie potrzebował, i przynosi z dysku stronę ${i + 1}: <b>siedemnaście minut</b>.`;
      }
    }
    last = i; lastSlot = slot;
    $('#say').innerHTML = text;
    draw();
  }

  function draw() {
    pg.forEach((d, i) => { d.classList.toggle('inram', ram.some(r => r.page === i)); d.classList.toggle('now', i === last); });
    slots.forEach((d, k) => {
      const r = ram[k];
      d.className = 'slot' + (r ? ' full' : '') + (k === lastSlot ? ' now' : '');
      d.replaceChildren(...(r ? [document.createTextNode('strona ' + (r.page + 1)), el('small', {}, r.used === clock ? 'użyta przed chwilą' : `użyta ${clock - r.used} odczytów temu`)] : [el('small', {}, 'wolne')]));
    });
    $('#hits').textContent = hits; $('#miss').textContent = miss;
    $('#human').textContent = human(hits + miss * 1000);
  }

  const stop = () => { clearInterval(timer); timer = null; queue = []; };
  function run(list) {
    stop(); queue = [...list];
    timer = setInterval(() => {
      if (!queue.length) {
        stop();
        $('#say').innerHTML += ` <br>Razem: ${hits} odczytów z pamięci i ${miss} z dysku. ${miss > hits ? 'Prawie każdy odczyt wymagał wyprawy na dysk.' : 'Większość odczytów obyła się bez dysku.'}`;
        return;
      }
      read(queue.shift());
    }, 260);
  }
  $('#seq').onclick = () => run(Array.from({ length: PAGES }, (_, i) => i));
  $('#hot').onclick = () => run(Array.from({ length: 15 }, (_, i) => 5 + (i % 3)));
  $('#rnd').onclick = () => run(Array.from({ length: 10 }, () => Math.floor(Math.random() * PAGES)));
  $('#clear').onclick = () => { stop(); ram = []; hits = miss = clock = 0; last = lastSlot = -1; $('#say').textContent = 'Pamięć jest pusta. Kliknij stronę albo wybierz jeden z przycisków.'; draw(); };
  $('#clear').onclick();
}
