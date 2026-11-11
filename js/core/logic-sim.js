// Silnik bramek logicznych. Jeden wspolny dla wszystkich rozdzialow:
// sumator z rozdzialu o liczeniu to ten sam, ktorego uzywa zabawkowy procesor.
// Bez DOM, wiec da sie testowac w Node.

const FN = {
  AND: (a, b) => a & b,
  OR: (a, b) => a | b,
  NOT: a => a ^ 1,
  NAND: (a, b) => (a & b) ^ 1,
  NOR: (a, b) => (a | b) ^ 1,
  XOR: (a, b) => a ^ b,
  BUF: a => a,
};

export class Circuit {
  constructor() { this.val = new Map(); this.gates = []; this.inputs = []; }
  input(id, v = 0) { this.val.set(id, v ? 1 : 0); this.inputs.push(id); return id; }
  gate(id, type, ...ins) { this.gates.push({ id, type, ins }); this.val.set(id, 0); return id; }
  set(id, v) { this.val.set(id, v ? 1 : 0); return this; }
  get(id) { return this.val.get(id); }
  toggle(id) { return this.set(id, this.get(id) ^ 1); }
  // Przelicza bramki w kolko, az nic sie nie zmienia. Wartosci zostaja miedzy wywolaniami,
  // dzieki czemu uklady z petla (pamiec) pamietaja swoj stan.
  settle(max = 60) {
    for (let n = 0; n < max; n++) {
      let changed = false;
      for (const g of this.gates) {
        const v = FN[g.type](...g.ins.map(i => this.val.get(i)));
        if (v !== this.val.get(g.id)) { this.val.set(g.id, v); changed = true; }
      }
      if (!changed) return true;
    }
    return false;
  }
}

// Sumator jednej kolumny: dwa bity + przeniesienie z prawej -> wynik + przeniesienie dalej. 5 bramek.
export function fullAdder(c, p, a, b, cin) {
  c.gate(p + 'x1', 'XOR', a, b);
  c.gate(p + 'sum', 'XOR', p + 'x1', cin);
  c.gate(p + 'a1', 'AND', a, b);
  c.gate(p + 'a2', 'AND', p + 'x1', cin);
  c.gate(p + 'cout', 'OR', p + 'a1', p + 'a2');
  return { sum: p + 'sum', cout: p + 'cout' };
}

// Sumator wielobitowy: kolumny spiete lancuchem przeniesien, od prawej do lewej.
export function makeAdder(bits = 8) {
  const c = new Circuit();
  c.input('cin');
  let carry = 'cin';
  const sums = [], carries = [];
  for (let i = 0; i < bits; i++) {
    c.input('a' + i); c.input('b' + i);
    const r = fullAdder(c, `f${i}_`, 'a' + i, 'b' + i, carry);
    sums.push(r.sum); carries.push(r.cout); carry = r.cout;
  }
  return {
    circuit: c, bits, gateCount: c.gates.length,
    add(a, b, cin = 0) {
      c.set('cin', cin);
      for (let i = 0; i < bits; i++) { c.set('a' + i, (a >> i) & 1); c.set('b' + i, (b >> i) & 1); }
      c.settle();
      let sum = 0;
      sums.forEach((s, i) => { sum |= c.get(s) << i; });
      return { sum, carry: c.get(carry), carries: carries.map(x => c.get(x)) };
    },
  };
}
