// Spis tresci: warstwy (glebokosc), sciezki i rozdzialy w kolejnosci czytania.
export const LAYERS = [
  { name: 'Ekran i świat', color: '#3d9df2' },
  { name: 'Dane i program', color: '#2aa9bd' },
  { name: 'Kod', color: '#2fa67c' },
  { name: 'Bity i pamięć', color: '#7fa22c' },
  { name: 'Procesor', color: '#c99716' },
  { name: 'Układy liczące', color: '#dd7a1d' },
  { name: 'Bramki', color: '#d9552f' },
  { name: 'Tranzystory', color: '#c63f6c' },
  { name: 'Atomy i elektrony', color: '#8f4ccc' },
];

// Grupy w pasku bocznym. `track` mowi, do ktorej sciezki czytania nalezy grupa.
export const GROUPS = [
  { id: 'a', track: 'main', name: 'Ścieżka: symulacja 3D' },
  { id: 't', track: 'main', name: 'Wspólny pień: w głąb' },
  { id: 'up', track: 'main', name: 'Powrót na powierzchnię' },
  { id: 'b', track: 'b', name: 'Ścieżka: baza danych' },
  { id: 'c', track: 'c', name: 'Ścieżka: LLM' },
  { id: 'q', track: 'q', name: 'Dodatek' },
];

// Sciezki czytania. `after` to miejsce, w ktorym boczna sciezka wpina sie we wspolny pien.
export const TRACKS = {
  main: { name: '' },
  b: { name: 'Ścieżka: baza danych', after: { id: 't3', label: 'Wspólnym pniem w dół: Procesor' } },
  c: { name: 'Ścieżka: LLM', after: { id: 't4', label: 'Wspólnym pniem w dół: Liczenie z bramek' } },
  q: { name: 'Dodatek' },
};

// layer: numer warstwy; null = wszystkie warstwy (przelot); -1 = poza drabina warstw
export const CHAPTERS = [
  { id: 'a0', group: 'a', layer: 0, title: 'To, co widzisz', sub: 'Sypiący się piasek i jedno ziarnko, które będziemy śledzić' },
  { id: 'a1', group: 'a', layer: 1, title: 'Ziarnko jako dane', sub: 'Sześć liczb w ponumerowanych skrytkach' },
  { id: 'a2', group: 'a', layer: 1, title: 'Krok fizyki', sub: 'Co komputer robi z ziarnkiem między dwiema klatkami' },
  { id: 'a3', group: 'a', layer: 2, title: 'Od Pythona do zer i jedynek', sub: 'To samo polecenie zapisane coraz bliżej sprzętu' },
  { id: 't1', group: 't', layer: 3, title: 'Bity i znaczenie', sub: 'Te same zera i jedynki jako liczba, kolor albo litera' },
  { id: 't2', group: 't', layer: 3, title: 'Pamięć jako adresy', sub: 'Jak trafić do jednej skrytki spośród miliardów' },
  { id: 't3', group: 't', layer: 4, title: 'Procesor', sub: 'Skąd sprzęt wie, co robić dalej' },
  { id: 't4', group: 't', layer: 5, title: 'Liczenie z bramek', sub: 'Jak z przełączników powstaje dodawanie' },
  { id: 't5', group: 't', layer: 6, title: 'Bramki logiczne', sub: 'Najprostsze klocki decyzyjne' },
  { id: 't6', group: 't', layer: 6, title: 'Jak pamięć pamięta', sub: 'Pętla, która trzyma jeden bit' },
  { id: 't7', group: 't', layer: 7, title: 'Tranzystory', sub: 'Kran odkręcany napięciem' },
  { id: 't8', group: 't', layer: 8, title: 'Krzem i elektrony', sub: 'Dlaczego to w ogóle działa' },
  { id: 'a4', group: 'up', layer: 0, title: 'Z powrotem na ekran', sub: 'Jak liczby stają się świecącymi punktami' },
  { id: 't9', group: 'up', layer: null, title: 'Przelot: od ekranu do atomu', sub: 'Cała droga w jednej scenie' },

  { id: 'b0', group: 'b', layer: 0, title: 'Zapytanie, które znasz', sub: 'Co baza robi z jednym zdaniem w SQL' },
  { id: 'b1', group: 'b', layer: 1, title: 'Szukanie: po kolei albo przez spis treści', sub: 'Dlaczego indeks zamienia milion kroków w kilka' },
  { id: 'b2', group: 'b', layer: 3, title: 'Gdzie to fizycznie leży', sub: 'Wiersz jako bajty, strony, dysk i pamięć' },
  { id: 'b3', group: 'b', layer: 4, title: 'Porównaj i zdecyduj', sub: 'Warunek WHERE jako polecenia procesora' },

  { id: 'c0', group: 'c', layer: 0, title: 'Model pisze po kawałku', sub: 'Jedno słowo naraz, za każdym razem od nowa' },
  { id: 'c1', group: 'c', layer: 1, title: 'Tekst jako liczby', sub: 'Kawałki słów, numery i mapa znaczeń' },
  { id: 'c2', group: 'c', layer: 1, title: 'Wielkie mnożenie', sub: 'Co się dzieje w jednej warstwie modelu' },
  { id: 'c3', group: 'c', layer: 5, title: 'Miliardy mnożeń i jedno mnożenie', sub: 'Karta graficzna i mnożenie zrobione z dodawania' },

  { id: 'q', group: 'q', layer: -1, title: 'Komputery kwantowe', sub: 'Czym naprawdę różnią się od zwykłych' },
];

const trackOf = c => GROUPS.find(g => g.id === c.group).track;
export const trackChapters = id => CHAPTERS.filter(c => trackOf(c) === id);
export const chapterTrack = c => trackOf(c);
// Korzen strony wyliczony z polozenia tego pliku (js/core/), wiec strona dziala takze z podkatalogu,
// np. https://ktos.github.io/jak-dziala-komputer/
export const ROOT = new URL('../../', import.meta.url).href;
export const href = id => `${ROOT}chapters/${id}.html`;
