"""Maly lokalny serwer dla strony "Jak dziala komputer".

Uruchom:  python serve.py [port] [--lan]      (domyslnie port 8765)

Bez --lan strona jest dostepna tylko z tego komputera (http://localhost:8765/).
Z --lan jest dostepna takze dla telefonu i tabletu w tej samej sieci Wi-Fi.

Serwer jest potrzebny, bo przegladarka nie laduje modulow JS prosto z dysku (file://).
"""
import functools
import http.server
import os
import socket
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
PORT = int(ARGS[0]) if ARGS else 8765
LAN = "--lan" in sys.argv


class Handler(http.server.SimpleHTTPRequestHandler):
    # Windows potrafi podac zly typ dla .js (z rejestru), wiec ustawiamy na sztywno.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".html": "text/html; charset=utf-8",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def lan_address():
    """Adres tego komputera w sieci domowej (bez wysylania czegokolwiek w siec)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


if __name__ == "__main__":
    handler = functools.partial(Handler, directory=ROOT)
    host = "0.0.0.0" if LAN else "127.0.0.1"
    with http.server.ThreadingHTTPServer((host, PORT), handler) as httpd:
        print(f"Na tym komputerze:        http://localhost:{PORT}/")
        if LAN:
            ip = lan_address()
            print()
            if ip:
                print(f"Na telefonie i tablecie:  http://{ip}:{PORT}/")
                print("(urzadzenie musi byc w tej samej sieci Wi-Fi co ten komputer)")
            else:
                print("Nie udalo sie ustalic adresu w sieci. Sprawdz go poleceniem: ipconfig")
            print()
            print("Jesli Windows zapyta o zapore, zezwol na dostep w sieciach prywatnych.")
        print("Ctrl+C konczy.")
        httpd.serve_forever()
