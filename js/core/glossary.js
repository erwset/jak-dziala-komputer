// Slowniczek: krotkie wyjasnienia prostym jezykiem. W tekscie: <span class="t" data-t="bit">bit</span>
import { el } from './util.js';

export const TERMS = {
  bit: ['Bit', 'Najmniejsza porcja informacji: jedno „tak" albo „nie", zapisywane jako 1 albo 0. W sprzęcie to po prostu przewód z wysokim albo niskim napięciem.'],
  bajt: ['Bajt', 'Paczka ośmiu bitów. Jednym bajtem da się zapisać 256 różnych rzeczy, np. liczby od 0 do 255.'],
  klatka: ['Klatka', 'Jeden nieruchomy obraz. Ruch na ekranie to złudzenie: komputer pokazuje kilkadziesiąt klatek na sekundę, każdą odrobinę inną, jak w filmie rysunkowym.'],
  piksel: ['Piksel', 'Jeden świecący punkcik ekranu. Obraz to po prostu ogromna szachownica takich punktów, każdy w swoim kolorze.'],
  ram: ['Pamięć RAM', 'Robocza pamięć komputera: ogromny rząd ponumerowanych skrytek, w których program trzyma liczby, nad którymi akurat pracuje. Szybka, ale po wyłączeniu prądu wszystko znika.'],
  adres: ['Adres', 'Numer skrytki w pamięci. Dzięki numerowi komputer trafia dokładnie do tej skrytki, o którą chodzi, tak jak listonosz trafia po numerze domu.'],
  cpu: ['Procesor (CPU)', 'Część komputera, która wykonuje polecenia programu jedno po drugim: bierze liczby z pamięci, coś z nimi robi (np. dodaje) i odkłada wynik.'],
  gpu: ['Karta graficzna (GPU)', 'Drugi „procesor", zbudowany z tysięcy prostych jednostek liczących naraz. Świetna do zadań, gdzie tę samą prostą czynność trzeba powtórzyć dla milionów punktów, np. przy rysowaniu obrazu.'],
  program: ['Program', 'Lista poleceń dla procesora, zapisana w pamięci jako liczby. Procesor czyta je po kolei i wykonuje.'],
  maszynowy: ['Kod maszynowy', 'Program w postaci, którą procesor rozumie bezpośrednio: same zera i jedynki. Każda grupa bitów to jedno malutkie polecenie.'],
  asembler: ['Asembler', 'Kod maszynowy zapisany słowami zamiast zer i jedynek, żeby człowiek mógł go przeczytać. Jedno słowo to dokładnie jedno polecenie procesora.'],
  kompilator: ['Kompilator', 'Program-tłumacz, który z góry przekłada cały program napisany przez człowieka na kod maszynowy. Tłumaczy raz, potem program działa już bez niego.'],
  interpreter: ['Interpreter', 'Program-tłumacz, który czyta kod linijka po linijce i od razu wykonuje. Wygodne, ale wolniejsze, bo tłumaczy na bieżąco, za każdym razem od nowa.'],
  polecenie: ['Polecenie (rozkaz, instrukcja)', 'Jedna malutka czynność, którą procesor umie wykonać, np. „weź liczbę ze skrytki 12" albo „dodaj". Wielkie programy to miliardy takich drobnych poleceń.'],
  licznik: ['Licznik rozkazów', 'Mała pamięć w procesorze, która trzyma numer skrytki z następnym poleceniem. Działa jak palec przesuwany po liście zadań.'],
  rejestr: ['Rejestr', 'Malutka, bardzo szybka pamięć wewnątrz procesora, mieszcząca jedną liczbę. Podręczna tabliczka, na której procesor trzyma to, nad czym właśnie pracuje.'],
  zegar: ['Zegar procesora', 'Sygnał, który miarowo przełącza się między 0 a 1, miliardy razy na sekundę. Każde „tyknięcie" pozwala wszystkim częściom procesora zrobić jeden wspólny krok, jak dyrygent wybijający takt.'],
  bramka: ['Bramka logiczna', 'Najprostszy klocek decyzyjny: ma jedno lub dwa wejścia i jedno wyjście. Wyjście zależy od wejść według stałej, prostej reguły, np. „świeci tylko wtedy, gdy oba wejścia są włączone".'],
  sumator: ['Sumator', 'Układ z kilkunastu bramek, który dodaje dwie liczby zapisane w bitach.'],
  przeniesienie: ['Przeniesienie', 'To samo „jeden dalej", które znasz z dodawania pisemnego: gdy w kolumnie wychodzi za dużo, nadmiar przechodzi do kolumny obok.'],
  tranzystor: ['Tranzystor', 'Malutki przełącznik bez ruchomych części. Napięcie na jednej nóżce decyduje, czy między dwiema pozostałymi może płynąć prąd. Jak kran odkręcany prądem zamiast ręką.'],
  napiecie: ['Napięcie', '„Ciśnienie" pchające elektrony w przewodzie, tak jak ciśnienie wody w rurze. Wysokie napięcie komputer traktuje jako 1, niskie jako 0.'],
  prad: ['Prąd', 'Płynące elektrony. Tak jak woda płynie rurą, gdy jest różnica ciśnień, tak elektrony płyną przewodem, gdy jest różnica napięć.'],
  elektron: ['Elektron', 'Maleńka cząstka z ujemnym ładunkiem, krążąca wokół atomu. Te, które mogą się swobodnie przemieszczać, tworzą prąd.'],
  dziura: ['Dziura', 'Puste miejsce po elektronie. Gdy sąsiedni elektron w nie wskakuje, puste miejsce „przesuwa się" w drugą stronę, jak wolne miejsce na zatłoczonym parkingu.'],
  polprzewodnik: ['Półprzewodnik', 'Materiał (np. krzem), który sam z siebie przewodzi prąd bardzo słabo, ale da się nim sterować: drobną zmianą warunków można go „włączyć" albo „wyłączyć".'],
  domieszkowanie: ['Domieszkowanie', 'Celowe dosypanie do krzemu odrobiny innych atomów, które wnoszą dodatkowe elektrony albo zostawiają puste miejsca. Dzięki temu krzem zaczyna przewodzić w kontrolowany sposób.'],
  pasmo: ['Pasmo energetyczne', 'Zakres energii, jaką mogą mieć elektrony w krysztale. Wygodnie myśleć o piętrach parkingu: elektrony mogą stać tylko na piętrach, nigdy pomiędzy.'],
  kanal: ['Kanał', 'Cieniutka warstwa pod bramką tranzystora, w której po przyłożeniu napięcia zbierają się elektrony i tworzą ścieżkę dla prądu.'],
  zatrzask: ['Zatrzask (przerzutnik)', 'Układ z dwóch bramek spiętych w pętlę, który zapamiętuje jeden bit: raz ustawiony, podtrzymuje sam siebie.'],
  os: ['System operacyjny', 'Program-gospodarz (np. Windows), który zarządza sprzętem i pilnuje, żeby inne programy nie wchodziły sobie w drogę: przydziela im pamięć, czas procesora i dostęp do ekranu.'],
  sterownik: ['Sterownik', 'Program-tłumacz między systemem operacyjnym a konkretnym urządzeniem, np. kartą graficzną danej firmy.'],
  float: ['Liczba z przecinkiem (float)', 'Sposób zapisu ułamków w bitach: osobno znak, osobno cyfry liczby i osobno informacja, gdzie postawić przecinek.'],
  chip: ['Układ scalony (chip)', 'Płytka krzemu wielkości paznokcia, na której wykonano miliardy tranzystorów i połączeń między nimi.'],
  nanometr: ['Nanometr', 'Jedna miliardowa metra. Ludzki włos ma około 80 000 nanometrów grubości; elementy tranzystora mają kilkanaście–kilkadziesiąt.'],
  litografia: ['Litografia', 'Sposób wytwarzania chipów: wzór połączeń „naświetla się" na krzemie światłem przez szablon, podobnie jak odbitkę zdjęcia.'],
  indeks: ['Indeks', 'Dodatkowy, posortowany spis prowadzony przez bazę danych obok tabeli. Działa jak spis treści w książce: zamiast czytać wszystko po kolei, baza od razu wie, gdzie szukać.'],
  strona: ['Strona danych', 'Paczka kilku tysięcy bajtów, w której leży obok siebie kilkadziesiąt lub kilkaset wierszy tabeli. Baza zawsze czyta z dysku i zapisuje całe strony, nigdy pojedyncze wiersze.'],
  token: ['Token', 'Kawałek tekstu, na jakie model językowy tnie zdania: całe krótkie słowo, część dłuższego słowa albo znak przestankowy. Model widzi tekst wyłącznie jako ciąg numerów tokenów.'],
  waga: ['Waga', 'Jedna liczba wewnątrz modelu, mówiąca, jak mocno jedna rzecz ma wpływać na drugą. Model językowy to miliardy wag ustalonych podczas uczenia.'],
  kubit: ['Kubit', 'Podstawowa cegiełka komputera kwantowego. Dopóki nikt go nie odczyta, może być w stanie pośrednim między 0 a 1; przy odczycie zawsze wypada zwykłe 0 albo 1.'],
  splatanie: ['Splątanie', 'Powiązanie dwóch kubitów, przy którym wynik odczytu każdego z osobna jest losowy, ale wyniki obu zawsze do siebie pasują.'],
  framebuffer: ['Bufor obrazu', 'Fragment pamięci, w którym leży gotowy obraz: po kilka liczb (kolor) dla każdego piksela ekranu.'],
};

export function initGlossary() {
  const tip = el('div', { id: 'tip' });
  document.body.append(tip);
  const show = node => {
    const t = TERMS[node.dataset.t];
    if (!t) return;
    tip.replaceChildren(el('b', {}, t[0]), t[1]);
    const r = node.getBoundingClientRect();
    tip.style.left = Math.max(8, Math.min(window.innerWidth - Math.min(336, window.innerWidth - 4), r.left + window.scrollX)) + 'px';
    tip.style.top = (r.bottom + window.scrollY + 8) + 'px';
    tip.classList.add('show');
  };
  const hide = () => tip.classList.remove('show');
  // Nasluch na calym dokumencie: dziala takze dla slow dodanych pozniej przez skrypty rozdzialow.
  const term = e => e.target.closest && e.target.closest('.t[data-t]');
  document.addEventListener('mouseover', e => { const n = term(e); if (n) show(n); });
  document.addEventListener('mouseout', e => { if (term(e)) hide(); });
  document.addEventListener('focusin', e => { const n = term(e); if (n) show(n); });
  document.addEventListener('focusout', e => { if (term(e)) hide(); });
  // dotyk: stukniecie w slowo pokazuje wyjasnienie, stukniecie gdziekolwiek indziej albo przewiniecie je chowa
  document.addEventListener('click', e => { const n = term(e); if (n) show(n); else hide(); });
  window.addEventListener('scroll', hide, { passive: true });
  document.querySelectorAll('.t[data-t]').forEach(n => { n.tabIndex = 0; });
}
