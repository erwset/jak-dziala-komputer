// Buduje wspolne elementy kazdej strony: pasek boczny, naglowek rozdzialu, stopke.
import { CHAPTERS, GROUPS, LAYERS, TRACKS, ROOT, href, trackChapters, chapterTrack } from './chapters.js';
import { el, $ } from './util.js';
import { initGlossary } from './glossary.js';

const dotColor = c => (c.layer == null ? 'linear-gradient(#3d9df2,#8f4ccc)' : c.layer < 0 ? '#7d8796' : LAYERS[c.layer].color);

export function initPage() {
  const id = document.body.dataset.chapter || '';
  const ch = CHAPTERS.find(c => c.id === id);

  const nav = el('nav');
  for (const g of GROUPS) {
    nav.append(el('h4', { text: g.name }));
    for (const c of CHAPTERS.filter(c => c.group === g.id)) {
      nav.append(el('a', { href: href(c.id), class: c.id === id ? 'current' : '' },
        el('span', { class: 'dot', style: { background: dotColor(c) } }), c.title));
    }
  }
  const themeBtn = el('button', { class: 'btn', onclick: toggleTheme }, 'Jasny / ciemny');
  const side = el('aside', { class: 'sidebar' },
    el('a', { class: 'brand', href: ROOT + 'index.html' }, 'Jak działa komputer', el('small', {}, 'od ekranu do elektronów')),
    nav,
    el('div', { class: 'tools' }, el('a', { class: 'btn', href: ROOT + 'slownik.html', style: { textDecoration: 'none' } }, 'Słowniczek'), themeBtn));
  // Na waskich ekranach spis tresci chowa sie pod przyciskiem w gornym pasku.
  const closeNav = () => document.body.classList.remove('nav-open');
  const topbar = el('div', { class: 'topbar' },
    el('button', { class: 'btn', 'aria-label': 'Spis treści', onclick: () => document.body.classList.toggle('nav-open') }, '☰ Spis treści'),
    el('a', { href: ROOT + 'index.html' }, 'Jak działa komputer'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) closeNav(); });
  document.body.prepend(topbar, side, el('div', { class: 'backdrop', onclick: closeNav }));
  initOffline(topbar, side);

  const main = $('main');
  if (ch && main) {
    const trackId = chapterTrack(ch), track = TRACKS[trackId], list = trackChapters(trackId), idx = list.indexOf(ch);
    const depth = el('div', { class: 'depth' }, LAYERS.map((l, i) => {
      const s = el('span', { class: ch.layer == null ? 'passed' : i === ch.layer ? 'here' : ch.layer >= 0 && i < ch.layer ? 'passed' : '', text: l.name });
      s.style.setProperty('--c', l.color);
      return s;
    }));
    const layerName = ch.layer == null ? 'wszystkie warstwy' : ch.layer < 0 ? '' : LAYERS[ch.layer].name;
    const kicker = [track.name, list.length > 1 ? `rozdział ${idx + 1} z ${list.length}` : '', layerName && `warstwa: ${layerName}`].filter(Boolean).join(' · ');
    main.prepend(el('header', {},
      el('div', { class: 'kicker', text: kicker.charAt(0).toUpperCase() + kicker.slice(1) }),
      ch.layer >= 0 || ch.layer == null ? depth : '',
      el('h1', { text: ch.title })));

    const prev = list[idx - 1], next = list[idx + 1];
    main.append(el('div', { class: 'pager' },
      prev ? el('a', { href: href(prev.id) }, el('small', {}, '← Wstecz'), prev.title)
           : trackId !== 'main' ? el('a', { href: ROOT + 'index.html' }, el('small', {}, '← Wstecz'), 'Mapa podróży') : '',
      next ? el('a', { class: 'next', href: href(next.id) }, el('small', {}, 'Dalej →'), next.title)
        : track.after ? el('a', { class: 'next', href: href(track.after.id) }, el('small', {}, 'Koniec ścieżki →'), track.after.label)
        : el('a', { class: 'next', href: ROOT + 'index.html' }, el('small', {}, 'Koniec →'), 'Wróć do mapy')));
    document.title = `${ch.title} · Jak działa komputer`;
    // na telefonie pasek warstw przewija sie w bok: ustaw go tak, zeby biezaca warstwa byla widoczna
    const here = depth.querySelector('.here');
    if (here) depth.scrollLeft = here.offsetLeft - depth.offsetLeft - 40;
  }
  initGlossary();
  setTimeout(scanScrollers, 0);
  setTimeout(scanScrollers, 600);
  window.addEventListener('resize', scanScrollers);
}

// Tryb offline i instalacja na ekranie glownym (dziala tylko na stronie wystawionej przez https, nie lokalnie).
function initOffline(topbar, side) {
  document.head.append(
    el('link', { rel: 'manifest', href: ROOT + 'manifest.webmanifest' }),
    el('link', { rel: 'icon', href: ROOT + 'icons/icon-192.png' }),
    el('link', { rel: 'apple-touch-icon', href: ROOT + 'icons/icon-192.png' }),
    el('meta', { name: 'theme-color', content: '#171d27' }));
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;

  const note = el('p', { class: 'hint', style: 'margin:14px 8px 0' }, 'Przygotowuję tryb bez internetu…');
  side.append(note);
  navigator.serviceWorker.register(ROOT + 'sw.js').catch(() => { note.textContent = 'Tryb bez internetu jest niedostępny w tej przeglądarce.'; });
  navigator.serviceWorker.ready.then(() => { note.textContent = '✓ Ta strona działa też bez internetu.'; });

  // Chrome na Androidzie zglasza, kiedy strone mozna zainstalowac jak aplikacje.
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    const btn = el('button', { class: 'btn primary', onclick: async () => { e.prompt(); await e.userChoice; btn.remove(); } }, 'Zainstaluj');
    topbar.append(btn);
  });
}

// Rysunki w ramce .hs moga byc szersze niz ekran. Jesli tak jest, pod spodem pojawia sie podpowiedz.
function scanScrollers() {
  document.querySelectorAll('.hs').forEach(box => {
    if (!box.dataset.hs) {
      box.dataset.hs = '1';
      box.after(el('p', { class: 'hs-note' }, '↔ Przesuń rysunek palcem w bok. Na telefonie wygodniej po obróceniu go poziomo.'));
    }
    box.classList.toggle('scrolls', box.scrollWidth > box.clientWidth + 4);
  });
}

function toggleTheme() {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('cw-theme', root.dataset.theme); } catch (e) {}
  window.dispatchEvent(new Event('cw-theme'));
}
