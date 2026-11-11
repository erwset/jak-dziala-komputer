@echo off
rem Dwuklik: udostepnia strone telefonowi i tabletowi w tej samej sieci Wi-Fi.
rem Adres do wpisania w przegladarce na urzadzeniu pojawi sie w tym oknie.
cd /d "%~dp0"
python serve.py 8765 --lan
pause
