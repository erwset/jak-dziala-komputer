import { initPage } from '../core/layout.js';
import { $, $$, el } from '../core/util.js';

initPage();

// --- podswietlanie odpowiadajacych sobie fragmentow na wszystkich poziomach ---
const ABOUT = {
  pos: '<b>Pozycja ziarnka.</b> Na górze to słowo, w Pythonie nazwa, a na dole po prostu „skrytka numer 12". Pierwszy krok zawsze polega na wzięciu tej liczby z pamięci.',
  vel: '<b>Prędkość ziarnka.</b> Druga liczba biorąca udział w działaniu. W pamięci leży w skrytce numer 13.',
  add: '<b>Dodawanie.</b> W Pythonie to znak plus, w asemblerze słowo DODAJ, a w kodzie maszynowym cztery bity 0010. Te cztery bity za chwilę dosłownie włączą układ dodający.',
  sto: '<b>Zapisanie wyniku.</b> Wynik trzeba odłożyć z powrotem do skrytki 12, bo inaczej przepadnie. W Pythonie robi to znak równości.',
};
const touch = window.matchMedia('(pointer: coarse)').matches;
const light = key => {
  $$('.part').forEach(o => o.classList.toggle('hl', o.dataset.p === key));
  if (key) $('#say').innerHTML = ABOUT[key];
};
$$('.part').forEach(p => {
  p.addEventListener('mouseenter', () => light(p.dataset.p));
  p.addEventListener('click', () => light(p.dataset.p));           // dotyk: stukniecie zamiast najechania
  if (!touch) p.addEventListener('mouseleave', () => light(null));  // na dotyku podswietlenie zostaje do nastepnego stukniecia
});
if (touch) {
  $('#say').textContent = 'Stuknij dowolny kolorowy fragment powyżej.';
  document.querySelector('.widget .wt').textContent = 'To samo polecenie na pięciu poziomach. Stuknij fragment, żeby zobaczyć jego odpowiedniki';
}

// --- wyscig tlumaczy ---
const LINES = 3;
let timer = null;
function race() {
  clearInterval(timer);
  const n = Number($('#grains').value);
  const planC = [...Array(LINES).fill('t'), ...Array(LINES * n).fill('x')];
  const planI = Array(LINES * n).fill(['t', 'x']).flat();
  const laneC = $('#laneC'), laneI = $('#laneI');
  laneC.replaceChildren(...planC.map(() => el('i')));
  laneI.replaceChildren(...planI.map(() => el('i')));
  let t = 0;
  const delay = Math.max(25, 900 / planI.length * 4);
  timer = setInterval(() => {
    if (t < planC.length) laneC.children[t].className = planC[t];
    if (t < planI.length) laneI.children[t].className = planI[t];
    t++;
    if (t === planC.length) $('#raceSay').innerHTML = `Kompilator skończył po <b>${planC.length}</b> jednostkach czasu: 3 na tłumaczenie i ${LINES * n} na wykonanie.`;
    if (t >= planI.length) {
      clearInterval(timer);
      $('#raceSay').innerHTML = `Kompilator: <b>${planC.length}</b> jednostek czasu. Interpreter: <b>${planI.length}</b>, bo każde z ${LINES * n} wykonań poprzedził tłumaczeniem. ` +
        (n > 2 ? 'Im więcej ziaren, tym większa różnica: koszt kompilatora jest jednorazowy, a interpreter płaci za każdym obrotem pętli.' : 'Przy tak małej liczbie powtórzeń różnica jest niewielka. Przesuń suwak w prawo.');
    }
  }, delay);
}
$('#race').onclick = race;
$('#grains').oninput = e => { $('#gn').textContent = e.target.value; };
