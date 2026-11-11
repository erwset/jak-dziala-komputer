// Malutki symulator kubitow. Bez DOM, wiec da sie testowac w Node.
// Stan n kubitow to 2^n "strzalek" (liczb zespolonych [czesc rzeczywista, czesc urojona]).
// Kubit numer 0 to najmlodszy bit numeru stanu.
const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const R = Math.SQRT1_2;

export const zero = n => { const s = Array.from({ length: 1 << n }, () => [0, 0]); s[0] = [1, 0]; return s; };

// Bramki dzialajace na jeden kubit, jako tabelki 2 na 2.
export const GATES = {
  X: [[[0, 0], [1, 0]], [[1, 0], [0, 0]]],          // odwroc
  H: [[[R, 0], [R, 0]], [[R, 0], [-R, 0]]],         // ustaw w pol drogi (i z powrotem)
  Z: [[[1, 0], [0, 0]], [[0, 0], [-1, 0]]],         // obroc faze
};

export function apply(state, gate, q = 0) {
  const g = typeof gate === 'string' ? GATES[gate] : gate, out = state.map(a => [...a]), bit = 1 << q;
  for (let i = 0; i < state.length; i++) {
    if (i & bit) continue;
    const a = state[i], b = state[i | bit];
    out[i] = add(mul(g[0][0], a), mul(g[0][1], b));
    out[i | bit] = add(mul(g[1][0], a), mul(g[1][1], b));
  }
  return out;
}

// Bramka na dwa kubity: jesli kubit sterujacy to 1, odwroc kubit docelowy.
export function cnot(state, control, target) {
  const out = state.map(a => [...a]), c = 1 << control, t = 1 << target;
  for (let i = 0; i < state.length; i++) if ((i & c) && !(i & t)) { out[i] = [...state[i | t]]; out[i | t] = [...state[i]]; }
  return out;
}

// Szanse kazdego wyniku pomiaru.
export const probs = state => state.map(a => a[0] * a[0] + a[1] * a[1]);

// Pomiar: losuje jeden wynik zgodnie z szansami.
export function sample(state, rnd = Math.random) {
  const p = probs(state);
  let r = rnd();
  for (let i = 0; i < p.length; i++) { r -= p[i]; if (r <= 0) return i; }
  return p.length - 1;
}

// Po pomiarze kubit jest juz zwyklym 0 albo 1.
export const collapsed = (n, outcome) => { const s = Array.from({ length: 1 << n }, () => [0, 0]); s[outcome] = [1, 0]; return s; };

// Polozenie strzalki jednego kubitu na kuli: [x, y, z], gdzie z = 1 to "0", z = -1 to "1".
export function bloch(state) {
  const [a, b] = state;
  return [2 * (a[0] * b[0] + a[1] * b[1]), 2 * (a[0] * b[1] - a[1] * b[0]), a[0] * a[0] + a[1] * a[1] - b[0] * b[0] - b[1] * b[1]];
}
