# Jak działa komputer

Interaktywna strona po polsku, która prowadzi krok po kroku od tego, co widać na ekranie
(symulacja piasku, zapytanie SQL, model językowy), przez kod, procesor, bramki i tranzystory,
aż do elektronów w krzemie. Bez wzorów, za to z rzeczami, które można kliknąć.

- 23 rozdziały: główna droga (symulacja 3D i wspólny pień), ścieżka bazy danych, ścieżka LLM, komputery kwantowe
- czysty HTML, CSS i JavaScript, bez kroku budowania; sceny 3D w three.js (kopia w `vendor/three`, licencja MIT)
- działa na komputerze, tablecie i telefonie; po pierwszym otwarciu także bez internetu

## Uruchamianie lokalnie

Potrzebny jest Python 3.

- `start.bat` otwiera stronę na tym komputerze (`http://localhost:8765/`)
- `start-telefon.bat` udostępnia ją urządzeniom w tej samej sieci Wi‑Fi

Strona musi być serwowana przez serwer, bo przeglądarki nie ładują modułów JavaScript prosto z dysku.

## Dla zmieniających kod

- `npm test` uruchamia testy silników (bity, bramki, zabawkowy procesor, symulator kubitów)
- `npm run build-sw` odświeża `sw.js`, czyli listę plików zapamiętywanych do pracy bez internetu; trzeba to zrobić przed każdą publikacją
- `python tools/make_icons.py` rysuje ikony aplikacji
- nowy rozdział to wpis w `js/core/chapters.js`, plik `chapters/<id>.html` i skrypt `js/chapters/<id>.js`
