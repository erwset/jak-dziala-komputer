"""Rysuje ikony aplikacji (stos piasku i spadajace ziarnka) bez zadnych dodatkowych bibliotek.

Uruchom:  python tools/make_icons.py
"""
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icons")
BG, SAND, GRAIN, FLOOR = (19, 26, 36), (224, 178, 102), (240, 205, 140), (86, 97, 115)


def inside_triangle(x, y, a, b, c):
    def side(p, q):
        return (x - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (y - q[1])
    d1, d2, d3 = side(a, b), side(b, c), side(c, a)
    return not ((d1 < 0 or d2 < 0 or d3 < 0) and (d1 > 0 or d2 > 0 or d3 > 0))


def colour(x, y, scale, rounded):
    """Kolor punktu (x, y) w kwadracie 0..1; None oznacza przezroczystosc."""
    if rounded:
        r = 0.2
        cx, cy = min(max(x, r), 1 - r), min(max(y, r), 1 - r)
        if (x - cx) ** 2 + (y - cy) ** 2 > r * r:
            return None
    # tresc ikony skalowana wokol srodka (ikona "maskable" musi zmiescic sie w srodkowym kole)
    u, v = (x - 0.5) / scale + 0.5, (y - 0.5) / scale + 0.5
    for gy in (0.14, 0.24, 0.33):
        if (u - 0.5) ** 2 + (v - gy) ** 2 < 0.034 ** 2:
            return GRAIN
    if inside_triangle(u, v, (0.16, 0.79), (0.84, 0.79), (0.5, 0.42)):
        return SAND
    if 0.11 < u < 0.89 and 0.79 <= v < 0.835:
        return FLOOR
    return BG


def render(size, scale, rounded, ss=3):
    rows = []
    for py in range(size):
        row = bytearray([0])                       # filtr PNG: brak
        for px in range(size):
            r = g = b = a = 0
            for sy in range(ss):
                for sx in range(ss):
                    c = colour((px + (sx + 0.5) / ss) / size, (py + (sy + 0.5) / ss) / size, scale, rounded)
                    if c:
                        r += c[0]; g += c[1]; b += c[2]; a += 1
            n = ss * ss
            row += bytes((r // a, g // a, b // a, 255 * a // n)) if a else b"\0\0\0\0"
        rows.append(bytes(row))
    return b"".join(rows)


def png(path, size, scale, rounded):
    def chunk(kind, data):
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    data += chunk(b"IDAT", zlib.compress(render(size, scale, rounded), 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(data)
    print(os.path.basename(path), len(data), "bajtow")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    png(os.path.join(OUT, "icon-192.png"), 192, 1.0, True)
    png(os.path.join(OUT, "icon-512.png"), 512, 1.0, True)
    png(os.path.join(OUT, "icon-maskable-512.png"), 512, 0.68, False)
