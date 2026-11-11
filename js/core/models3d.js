// Modele 3D uzywane w kilku rozdzialach: krysztal krzemu i przekroj tranzystora.
import { THREE, label } from './scene3d.js';

const rnd = (a, b) => a + Math.random() * (b - a);

// ---------- krysztal krzemu ----------
// Kazdy atom krzemu trzyma sie czterech sasiadow. n = ile "kostek" krysztalu w kazdym kierunku.
export function buildLattice(n = 2) {
  const group = new THREE.Group();
  const atoms = [], index = new Map(), key = (x, y, z) => `${x},${y},${z}`;
  const add = (x, y, z, sub) => { index.set(key(x, y, z), atoms.length); atoms.push({ p: new THREE.Vector3(x - n / 2, y - n / 2, z - n / 2), sub, raw: [x, y, z] }); };
  for (let i = 0; i <= 2 * n; i++) for (let j = 0; j <= 2 * n; j++) for (let k = 0; k <= 2 * n; k++) {
    if ((i + j + k) % 2) continue;
    add(i / 2, j / 2, k / 2, 0);
    if (i < 2 * n && j < 2 * n && k < 2 * n) add(i / 2 + 0.25, j / 2 + 0.25, k / 2 + 0.25, 1);
  }
  const bonds = [];
  const D = [[-1, -1, -1], [1, 1, -1], [1, -1, 1], [-1, 1, 1]];
  atoms.forEach((a, ai) => {
    if (a.sub !== 1) return;
    for (const d of D) {
      const bi = index.get(key(a.raw[0] + d[0] / 4, a.raw[1] + d[1] / 4, a.raw[2] + d[2] / 4));
      if (bi != null) bonds.push({ a: ai, b: bi, mid: a.p.clone().add(atoms[bi].p).multiplyScalar(0.5) });
    }
  });

  const atomMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.085, 20, 14), new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.2 }), atoms.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
  const SI = new THREE.Color(0x93a7c4);
  atoms.forEach((a, i) => { atomMesh.setMatrixAt(i, m.compose(a.p, q, s)); atomMesh.setColorAt(i, SI); });
  group.add(atomMesh);

  const bondMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 8), new THREE.MeshStandardMaterial({ color: 0x6f7f96, roughness: 0.7 }), bonds.length);
  const up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
  bonds.forEach((b, i) => {
    dir.subVectors(atoms[b.b].p, atoms[b.a].p);
    const len = dir.length();
    bondMesh.setMatrixAt(i, m.compose(b.mid, q.setFromUnitVectors(up, dir.normalize()), s.set(1, len, 1)));
  });
  group.add(bondMesh);

  // atom najblizej srodka: to jego bedziemy podmieniac na domieszke
  let center = 0, best = Infinity;
  atoms.forEach((a, i) => { if (a.sub === 1 && a.p.length() < best) { best = a.p.length(); center = i; } });
  const setDopant = type => {
    const col = type === 'N' ? new THREE.Color(0x35c46b) : type === 'P' ? new THREE.Color(0xff5f86) : SI;
    q.identity();
    atomMesh.setMatrixAt(center, m.compose(atoms[center].p, q, s.setScalar(type ? 1.5 : 1)));
    atomMesh.setColorAt(center, col);
    atomMesh.instanceMatrix.needsUpdate = true; atomMesh.instanceColor.needsUpdate = true;
  };
  return { group, atoms, bonds, center, setDopant };
}

// ---------- przekroj tranzystora ----------
// Krzem typu P na dole, dwie "wyspy" typu N (zrodlo i dren), cienki izolator i bramka na gorze.
export function buildMosfet({ labels = true } = {}) {
  const group = new THREE.Group();
  const box = (x0, x1, y0, y1, color, opacity = 1, extra = {}) => {
    const mat = new THREE.MeshStandardMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity === 1, roughness: 0.6, ...extra });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, 1.6), mat);
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
    group.add(mesh);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: 0x9aa6b8, transparent: true, opacity: 0.55 }));
    edges.position.copy(mesh.position);
    group.add(edges);
    return mesh;
  };
  box(-2, 2, -1.2, 0, 0x8a5c9c, 0.22);                    // krzem typu P
  box(-2, -0.9, -0.45, 0, 0x2f86e0, 0.3);                 // zrodlo (typ N)
  box(0.9, 2, -0.45, 0, 0x2f86e0, 0.3);                   // dren (typ N)
  box(-1, 1, 0, 0.07, 0xe6eef7, 0.75);                    // izolator
  const gate = box(-1, 1, 0.07, 0.42, 0xb4bbc7, 1, { metalness: 0.6, roughness: 0.35, emissive: 0xff8a1c, emissiveIntensity: 0 });
  box(-1.8, -1.2, 0, 0.42, 0xb4bbc7, 1, { metalness: 0.6, roughness: 0.35 });
  box(1.2, 1.8, 0, 0.42, 0xb4bbc7, 1, { metalness: 0.6, roughness: 0.35 });

  if (labels) {
    const put = (t, x, y, c) => { const l = label(t, { size: 0.2, color: c }); l.position.set(x, y, 0.85); group.add(l); };
    put('bramka', 0, 0.62); put('źródło', -1.5, 0.62); put('dren', 1.5, 0.62);
    put('izolator', 0, 0.16, '#cfe2f7'); put('krzem typu N', -1.45, -0.6, '#8cc4ff'); put('krzem typu N', 1.45, -0.6, '#8cc4ff');
    put('krzem typu P', 0, -1.0, '#e3b5f2');
  }

  const dot = (color, r) => new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color }));
  const E = 0x3aa0ff, H = 0xff6f95;
  const reservoir = [];               // elektrony w zrodle i drenie: zawsze tam sa
  for (let i = 0; i < 44; i++) {
    const left = i % 2 === 0, d = dot(E, 0.035);
    d.userData = { x0: left ? -1.95 : 0.95, x1: left ? -0.95 : 1.95 };
    d.position.set(rnd(d.userData.x0, d.userData.x1), rnd(-0.4, -0.05), rnd(-0.7, 0.7));
    reservoir.push(d); group.add(d);
  }
  const channel = [];                 // elektrony, ktore bramka sciaga pod izolator
  for (let i = 0; i < 46; i++) {
    const d = dot(E, 0.035);
    d.position.set(rnd(-0.9, 0.9), rnd(-0.09, -0.03), rnd(-0.7, 0.7));
    channel.push(d); group.add(d);
  }
  const holes = [];                   // dziury w krzemie typu P
  for (let i = 0; i < 50; i++) {
    const d = dot(H, 0.032);
    let x, y;
    do { x = rnd(-1.9, 1.9); y = rnd(-1.12, -0.06); } while (Math.abs(x) > 0.85 && y > -0.52);
    d.userData = { x, y, z: rnd(-0.7, 0.7), ph: rnd(0, 6) };
    holes.push(d); group.add(d);
  }

  // v: napiecie na bramce od 0 do 1. Zwraca, jak mocno otwarty jest kanal (0..1).
  function update(dt, t, v) {
    const on = Math.min(1, Math.max(0, (v - 0.42) / 0.4));
    gate.material.emissiveIntensity = v * 0.9;
    for (const d of reservoir) {
      d.position.x = Math.min(d.userData.x1, Math.max(d.userData.x0, d.position.x + rnd(-1, 1) * dt * 0.8));
      d.position.y = Math.min(-0.04, Math.max(-0.42, d.position.y + rnd(-1, 1) * dt * 0.8));
    }
    channel.forEach((d, i) => {
      const active = i < Math.round(on * channel.length);
      d.visible = active;
      if (!active) return;
      d.position.x += (0.5 + on) * dt;
      if (d.position.x > 0.92) d.position.x = -0.92;
    });
    for (const d of holes) {
      const u = d.userData;
      const under = Math.abs(u.x) < 1 ? Math.max(0, 1 - Math.abs(u.y) / 0.7) : 0;   // tylko te pod bramka i blisko powierzchni
      d.position.set(u.x + Math.sin(t * 1.3 + u.ph) * 0.03, u.y - v * 0.5 * under + Math.cos(t * 1.1 + u.ph) * 0.02, u.z);
    }
    return on;
  }
  return { group, update };
}
