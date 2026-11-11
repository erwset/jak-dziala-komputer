@echo off
rem Dwuklik: uruchamia lokalny serwer i otwiera strone w przegladarce.
cd /d "%~dp0"
start "" http://localhost:8765/
python serve.py 8765
