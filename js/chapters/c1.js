import { initPage } from '../core/layout.js';
import { $, $$, el, fmt, fitCanvas, cssVar, onRedraw } from '../core/util.js';

initPage();

// ================= krajalnik tekstu =================
{
  const PIECES = (
    'komputer procesor tranzystor program pamięć piasek model liczby liczb słowo słów kot pies mysz dom ' +
    'nie tak jest to co jak się że na do po od za w z i a o u bardzo szybko tylko dzień dobry ' +
    'super hiper mega prze przy roz wy rozum licz pis czyt mów rob myśl kwant ' +
    'owanie ować ują uje ieją eją anie enie ami ach owi ów em om ie ek ka ki ko ta te er or ów ' +
    'y a e ę ą ć ń ny na ne owy owa owe ość'
  ).split(' ');
  const LETTERS = 'aąbcćdeęfghijklłmnńoóprsśtuwxyzźżqv0123456789'.split('');
  const VOCAB = [...new Set([...PIECES, ...LETTERS])];
  const ID = new Map(VOCAB.map((p, i) => [p, i + 1]));
  const byLen = [...VOCAB].sort((a, b) => b.length - a.length);
  const COLORS = ['#f4b860', '#8cc8ff', '#9be3b0', '#f2a0b8', '#c9b3f5', '#f0e68c'];

  function tokenize(text) {
    const out = [];
    for (const part of text.toLowerCase().match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || []) {
      let rest = part, first = true;
      while (rest) {
        const piece = byLen.find(p => rest.startsWith(p)) || rest[0];
        out.push({ piece, id: ID.get(piece) ?? VOCAB.length + 1 + (piece.codePointAt(0) % 50), start: first });
        rest = rest.slice(piece.length); first = false;
      }
    }
    return out;
  }
  function draw() {
    const text = $('#inp').value, toks = tokenize(text);
    $('#toks').replaceChildren(...toks.map((t, i) => {
      const d = el('div', { class: 'tok' + (t.start && i ? ' sp' : '') }, t.piece, el('small', {}, 'nr ' + t.id));
      d.style.background = COLORS[i % COLORS.length];
      return d;
    }));
    const wordsN = (text.trim().match(/\S+/g) || []).length, letters = toks.filter(t => t.piece.length === 1 && /\p{L}/u.test(t.piece)).length;
    const form = (n, one, few, many) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);
    $('#tokSay').innerHTML = `Ten tekst ma ${wordsN} ${form(wordsN, 'słowo', 'słowa', 'słów')} i rozpada się na <b>${toks.length} ${form(toks.length, 'token', 'tokeny', 'tokenów')}</b>. Dla modelu wygląda tak: <span class="num">${toks.map(t => t.id).join(', ')}</span>. ` +
      (letters > toks.length / 2 ? 'Większość kawałków to pojedyncze litery: model nie zna takich słów, więc składa je z najdrobniejszych klocków.' : 'Kawałki zaczynające nowe słowo są lekko odsunięte.');
  }
  $('#inp').oninput = draw;
  $$('[data-t]').forEach(b => { if (b.tagName === 'BUTTON') b.onclick = () => { $('#inp').value = b.dataset.t; draw(); }; });
  draw();
}

// ================= mapa znaczen =================
{
  const WORDS = {
    kot: [-0.75, 0.6], pies: [-0.6, 0.72], mysz: [-0.86, 0.42], ptak: [-0.55, 0.45],
    król: [0.55, 0.55], królowa: [0.75, 0.25], mężczyzna: [0.3, 0.15], kobieta: [0.5, -0.15], chłopiec: [-0.12, 0.34], dziewczynka: [0.08, 0.04],
    komputer: [-0.6, -0.5], procesor: [-0.76, -0.64], pamięć: [-0.48, -0.7], tranzystor: [-0.84, -0.42], program: [-0.38, -0.45],
    jeden: [0.42, -0.62], dwa: [0.56, -0.72], trzy: [0.72, -0.62], sto: [0.6, -0.48],
    czerwony: [-0.02, 0.76], zielony: [0.12, 0.88], niebieski: [-0.14, 0.9],
  };
  const PAIRS = [['mężczyzna', 'kobieta'], ['król', 'królowa'], ['chłopiec', 'dziewczynka']];
  const canvas = $('#map');
  let picked = 'kot', arrows = false, geom = null;
  const near = w => Object.keys(WORDS).filter(o => o !== w).sort((a, b) => dist(w, a) - dist(w, b)).slice(0, 3);
  const dist = (a, b) => Math.hypot(WORDS[a][0] - WORDS[b][0], WORDS[a][1] - WORDS[b][1]);

  function draw() {
    const { ctx, w, h } = fitCanvas(canvas, 400);
    const X = x => w / 2 + x * (w / 2 - 70), Y = y => h / 2 - y * (h / 2 - 30);
    geom = { X, Y };
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = cssVar('--line'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(-1.1), Y(0)); ctx.lineTo(X(1.1), Y(0)); ctx.moveTo(X(0), Y(-1)); ctx.lineTo(X(0), Y(1)); ctx.stroke();
    const nb = near(picked);
    ctx.strokeStyle = cssVar('--on'); ctx.lineWidth = 2;
    for (const o of nb) { ctx.beginPath(); ctx.moveTo(X(WORDS[picked][0]), Y(WORDS[picked][1])); ctx.lineTo(X(WORDS[o][0]), Y(WORDS[o][1])); ctx.stroke(); }
    if (arrows) {
      ctx.strokeStyle = ctx.fillStyle = cssVar('--electron'); ctx.lineWidth = 3;
      for (const [a, b] of PAIRS) {
        const [x1, y1, x2, y2] = [X(WORDS[a][0]), Y(WORDS[a][1]), X(WORDS[b][0]), Y(WORDS[b][1])], ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(ang) * 10, y2 - Math.sin(ang) * 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - Math.cos(ang - 0.4) * 14, y2 - Math.sin(ang - 0.4) * 14); ctx.lineTo(x2 - Math.cos(ang + 0.4) * 14, y2 - Math.sin(ang + 0.4) * 14); ctx.fill();
      }
    }
    ctx.font = '600 13px ' + cssVar('--font'); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for (const [word, [x, y]] of Object.entries(WORDS)) {
      const hot = word === picked, nbr = nb.includes(word);
      ctx.fillStyle = hot ? cssVar('--on') : nbr ? cssVar('--accent') : cssVar('--muted');
      ctx.beginPath(); ctx.arc(X(x), Y(y), hot ? 7 : 5, 0, 7); ctx.fill();
      ctx.fillStyle = hot || nbr ? cssVar('--ink') : cssVar('--muted');
      ctx.fillText(word, X(x), Y(y) - 8);
    }
    const [x, y] = WORDS[picked];
    $('#mapSay').innerHTML = `<b>${picked}</b> to dla modelu dwie liczby: ${fmt(x)} (w prawo) i ${fmt(y)} (w górę). Najbliżej na mapie leżą: <b>${nb.join(', ')}</b>.` +
      (arrows ? ' Niebieskie strzałki mają tę samą długość i ten sam kierunek: „zmień płeć" to na tej mapie zawsze ten sam ruch, w prawo i w dół.' : '');
  }
  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    picked = Object.keys(WORDS).reduce((best, w) => (Math.hypot(geom.X(WORDS[w][0]) - mx, geom.Y(WORDS[w][1]) - my) < Math.hypot(geom.X(WORDS[best][0]) - mx, geom.Y(WORDS[best][1]) - my) ? w : best));
    draw();
  });
  $('#arrows').onclick = e => { arrows = !arrows; e.target.classList.toggle('active', arrows); draw(); };
  onRedraw(draw); draw();
}
