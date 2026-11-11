// Krokomierz: opowiesc krok po kroku z przyciskami Wstecz / Dalej.
// steps: [{ h: 'tytul', text: 'opis (moze zawierac HTML)', enter(i) }]
import { el } from './util.js';

export function stepper(container, steps, { start = 0 } = {}) {
  let i = -1;
  const txt = el('div', { class: 'txt' });
  const dots = el('div', { class: 'dots' }, steps.map((_, k) => el('i', { onclick: () => go(k) })));
  const back = el('button', { class: 'btn', onclick: () => go(i - 1) }, '← Wstecz');
  const fwd = el('button', { class: 'btn primary', onclick: () => go(i + 1) }, 'Dalej →');
  container.append(el('div', { class: 'stepper' }, txt, el('div', { class: 'nav' }, back, dots, fwd)));

  function go(k) {
    k = Math.max(0, Math.min(steps.length - 1, k));
    if (k === i) return;
    i = k;
    const s = steps[i];
    txt.innerHTML = `<b class="h">Krok ${i + 1} z ${steps.length}${s.h ? ': ' + s.h : ''}</b>${s.text}`;
    [...dots.children].forEach((d, n) => d.classList.toggle('on', n <= i));
    back.disabled = i === 0; fwd.disabled = i === steps.length - 1;
    s.enter && s.enter(i);
  }
  go(start);
  return { go, get index() { return i; } };
}
