// Uproszczona symulacja sypiacego sie piasku. Kazde ziarnko to szesc liczb:
// trzy liczby pozycji i trzy liczby predkosci. Nic wiecej.
export const WAITING = 0, FALLING = 1, RESTING = 2;

export class Sand {
  constructor(n = 2000, { half = 1.6, cell = 0.1, radius = 0.035, rate = 420 } = {}) {
    Object.assign(this, { n, half, cell, radius, rate });
    this.grid = Math.round((2 * half) / cell);
    this.pos = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.state = new Uint8Array(n);
    this.heights = new Float32Array(this.grid * this.grid);
    this.reset();
  }

  reset() {
    this.state.fill(WAITING); this.heights.fill(0); this.vel.fill(0);
    this.emitted = 0; this.budget = 0; this.frame = 0;
    for (let i = 0; i < this.n; i++) { this.pos[i * 3] = 0; this.pos[i * 3 + 1] = 3.2; this.pos[i * 3 + 2] = 0; }
  }

  cellOf(x, z) {
    const g = this.grid;
    const cx = Math.min(g - 1, Math.max(0, Math.floor((x + this.half) / this.cell)));
    const cz = Math.min(g - 1, Math.max(0, Math.floor((z + this.half) / this.cell)));
    return cz * g + cx;
  }

  // Jedna klatka: kazde lecace ziarnko dostaje odrobine predkosci w dol i przesuwa sie o swoja predkosc.
  step(dt = 1 / 60) {
    const { pos, vel, state, heights, grid: g, cell, radius: r, half } = this;
    this.frame++;
    this.budget += this.rate * dt;
    while (this.budget >= 1 && this.emitted < this.n) {
      const i = this.emitted++, k = i * 3;
      this.budget--;
      state[i] = FALLING;
      pos[k] = (Math.random() - 0.5) * 0.14; pos[k + 1] = 3.2; pos[k + 2] = (Math.random() - 0.5) * 0.14;
      vel[k] = (Math.random() - 0.5) * 0.24; vel[k + 1] = -0.5; vel[k + 2] = (Math.random() - 0.5) * 0.24;
    }
    for (let i = 0; i < this.emitted; i++) {
      if (state[i] !== FALLING) continue;
      const k = i * 3;
      vel[k + 1] -= 7 * dt;                       // grawitacja: troche wiecej predkosci w dol
      pos[k] += vel[k] * dt; pos[k + 1] += vel[k + 1] * dt; pos[k + 2] += vel[k + 2] * dt;   // przesun o predkosc
      for (const a of [0, 2]) {                   // scianki pudelka
        if (Math.abs(pos[k + a]) > half - r) { pos[k + a] = Math.sign(pos[k + a]) * (half - r); vel[k + a] *= -0.3; }
      }
      let c = this.cellOf(pos[k], pos[k + 2]);
      if (pos[k + 1] - r > heights[c]) continue;  // jeszcze nie dotknelo stosu
      for (let hop = 0; hop < 30; hop++) {         // zsuwa sie po zboczu do nizszego sasiada
        const cx = c % g, cz = (c - cx) / g;
        let best = c, bestSlope = 0.72;           // zsuwa sie tylko, gdy zbocze jest dosc strome
        for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx, nz = cz + dz;
          if ((!dx && !dz) || nx < 0 || nz < 0 || nx >= g || nz >= g) continue;
          const slope = (heights[c] - heights[nz * g + nx]) / (cell * Math.hypot(dx, dz));
          if (slope > bestSlope) { bestSlope = slope; best = nz * g + nx; }
        }
        if (best === c) break;
        c = best;
      }
      const cx = c % g, cz = (c - cx) / g;
      pos[k] = -half + (cx + 0.15 + Math.random() * 0.7) * cell;
      pos[k + 2] = -half + (cz + 0.15 + Math.random() * 0.7) * cell;
      pos[k + 1] = heights[c] + r;
      heights[c] += r;
      vel[k] = vel[k + 1] = vel[k + 2] = 0;
      state[i] = RESTING;
    }
  }
}
