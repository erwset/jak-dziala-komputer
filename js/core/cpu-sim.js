// Zabawkowy 8-bitowy procesor. 16 skrytek pamieci, jedno polecenie = jeden bajt:
// lewe 4 bity mowia KTORE polecenie, prawe 4 bity mowia KTORA skrytka.
// Dodawanie wykonuje prawdziwy sumator z bramek (logic-sim.js).
import { makeAdder } from './logic-sim.js';

export const OP = { NIC: 0, WEZ: 1, DODAJ: 2, ZAPISZ: 3, SKOCZ: 4, SKOCZ_GDY_ZERO: 5, ODEJMIJ: 6, STOP: 15 };
export const OP_NAME = { 0: 'NIC', 1: 'WEŹ', 2: 'DODAJ', 3: 'ZAPISZ', 4: 'SKOCZ', 5: 'SKOCZ GDY ZERO', 6: 'ODEJMIJ', 15: 'STOP' };

export const enc = (op, addr = 0) => ((op & 15) << 4) | (addr & 15);
export const dec = byte => ({ op: byte >> 4, addr: byte & 15, name: OP_NAME[byte >> 4] ?? '???' });

export class Cpu {
  constructor(memory = []) { this.adder = makeAdder(8); this.load(memory); }

  load(memory) {
    this.mem = Uint8Array.from({ length: 16 }, (_, i) => memory[i] ?? 0);
    this.pc = 0;        // "palec": numer skrytki z nastepnym poleceniem
    this.ir = 0;        // biezace polecenie
    this.a = 0;         // podreczna tabliczka
    this.zero = false;  // czy ostatni wynik byl zerem
    this.phase = 0;     // 0 pobierz, 1 odczytaj, 2 wykonaj
    this.halted = false;
    this.ticks = 0;
  }

  // Jedno tykniecie zegara = jedna faza. Zwraca opis tego, co sie stalo.
  tick() {
    if (this.halted) return { phase: 'stop' };
    this.ticks++;
    if (this.phase === 0) {
      const at = this.pc;
      this.ir = this.mem[at];
      this.pc = (this.pc + 1) & 15;
      this.phase = 1;
      return { phase: 'pobierz', at, ir: this.ir, pc: this.pc };
    }
    if (this.phase === 1) {
      this.phase = 2;
      return { phase: 'odczytaj', ...dec(this.ir) };
    }
    const { op, addr, name } = dec(this.ir);
    this.phase = 0;
    const ev = { phase: 'wykonaj', op, addr, name, aBefore: this.a, operand: this.mem[addr] };
    switch (op) {
      case OP.WEZ: this.a = this.mem[addr]; break;
      case OP.DODAJ: { const r = this.adder.add(this.a, this.mem[addr]); this.a = r.sum; ev.carry = r.carry; break; }
      case OP.ODEJMIJ: { const r = this.adder.add(this.a, ~this.mem[addr] & 255, 1); this.a = r.sum; break; }
      case OP.ZAPISZ: this.mem[addr] = this.a; break;
      case OP.SKOCZ: this.pc = addr; break;
      case OP.SKOCZ_GDY_ZERO: ev.jumped = this.zero; if (this.zero) this.pc = addr; break;
      case OP.STOP: this.halted = true; break;
    }
    if (op === OP.WEZ || op === OP.DODAJ || op === OP.ODEJMIJ) this.zero = this.a === 0;
    ev.a = this.a; ev.pc = this.pc;
    return ev;
  }

  // Cale polecenie: trzy tykniecia.
  step() {
    const evs = [];
    do evs.push(this.tick()); while (this.phase !== 0 && !this.halted);
    return evs;
  }
}

// Program z rozdzialow A3 / T2 / T3: "dla dwoch ziaren dodaj predkosc do pozycji, i tak w kolko".
// Skrytki 12-15 to dane: pozycja i predkosc ziarnka 1, pozycja i predkosc ziarnka 2.
export const SAND_PROGRAM = [
  enc(OP.WEZ, 12), enc(OP.DODAJ, 13), enc(OP.ZAPISZ, 12),
  enc(OP.WEZ, 14), enc(OP.DODAJ, 15), enc(OP.ZAPISZ, 14),
  enc(OP.SKOCZ, 0),
  0, 0, 0, 0, 0,
  10, 3, 40, 5,
];
export const SAND_LABELS = { 12: 'pozycja ziarnka 1', 13: 'prędkość ziarnka 1', 14: 'pozycja ziarnka 2', 15: 'prędkość ziarnka 2' };
