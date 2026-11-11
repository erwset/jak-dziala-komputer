import { initPage } from '../core/layout.js';
import { makeScene, THREE } from '../core/scene3d.js';
import { Sand, WAITING, FALLING } from '../core/sand.js';
import { $, fmt } from '../core/util.js';

initPage();

const N = 2000;
const sand = new Sand(N);
const S = makeScene($('#stage'), { cam: [2.5, 1.5, 2.9], target: [0, 0.75, 0] });
const { scene, camera, renderer } = S;
S.controls.minDistance = 1.2; S.controls.maxDistance = 9; S.controls.maxPolarAngle = Math.PI / 2 - 0.05;

// tacka, na ktora sypie sie piasek
const tray = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.08, 3.3), new THREE.MeshStandardMaterial({ color: 0x6b7686, roughness: 0.9 }));
tray.position.y = -0.04;
scene.add(tray);
const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.07, 0.3, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x8a94a3, side: THREE.DoubleSide }));
spout.position.y = 3.35;
scene.add(spout);

// wszystkie ziarnka jako jedna siatka z wieloma kopiami
const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(sand.radius, 1), new THREE.MeshStandardMaterial({ roughness: 0.85 }), N);
mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
mesh.frustumCulled = false;
const base = new THREE.Color(), tones = [];
for (let i = 0; i < N; i++) {
  base.setHSL(0.09 + Math.random() * 0.03, 0.55 + Math.random() * 0.15, 0.52 + Math.random() * 0.16);
  tones.push(base.clone());
  mesh.setColorAt(i, base);
}
scene.add(mesh);

// obwodka wokol wybranego ziarnka, widoczna takze przez inne ziarnka
const ring = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.1, 32), new THREE.MeshBasicMaterial({ color: 0x1f9bff, depthTest: false, transparent: true, side: THREE.DoubleSide }));
ring.renderOrder = 10;
scene.add(ring);

let selected = 0, paused = false;
const picked = new THREE.Color(0x1f9bff);
function select(i) {
  mesh.setColorAt(selected, tones[selected]);
  selected = i;
  mesh.setColorAt(selected, picked);
  mesh.instanceColor.needsUpdate = true;
  $('#gid').textContent = i;
  panel();
}

const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
function sync() {
  for (let i = 0; i < N; i++) {
    const k = i * 3, s = sand.state[i] === WAITING ? 0 : i === selected ? 1.7 : 1;
    m4.compose(v3.set(sand.pos[k], sand.pos[k + 1], sand.pos[k + 2]), q, sc.setScalar(s));
    mesh.setMatrixAt(i, m4);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.boundingSphere = null;
  ring.position.set(sand.pos[selected * 3], sand.pos[selected * 3 + 1], sand.pos[selected * 3 + 2]);
  ring.quaternion.copy(camera.quaternion);
  ring.visible = sand.state[selected] !== WAITING;
}

const ids = ['px', 'py', 'pz', 'vx', 'vy', 'vz'].map(id => $('#' + id));
function panel() {
  const k = selected * 3;
  const vals = [sand.pos[k], sand.pos[k + 1], sand.pos[k + 2], sand.vel[k], sand.vel[k + 1], sand.vel[k + 2]];
  ids.forEach((n, j) => { n.textContent = fmt(vals[j]); });
  const st = sand.state[selected];
  $('#status').textContent = st === WAITING ? 'Stan: czeka w lejku na swoją kolej.' : st === FALLING ? 'Stan: leci. Liczby zmieniają się w każdej klatce.' : 'Stan: leży na stosie. Prędkość wynosi zero, więc pozycja już się nie zmienia.';
  $('#frame').textContent = sand.frame;
}

S.onFrame(() => { if (!paused) sand.step(); sync(); panel(); });

// klikniecie (bez przeciagania) wybiera ziarnko
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  const r = renderer.domElement.getBoundingClientRect();
  mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObject(mesh)[0];
  if (hit) select(hit.instanceId);
});

$('#again').onclick = () => { sand.reset(); };
$('#pause').onclick = e => { paused = !paused; e.target.textContent = paused ? 'Wznów' : 'Zatrzymaj'; };
$('#one').onclick = () => { if (!paused) $('#pause').click(); sand.step(); };
$('#rnd').onclick = () => select(Math.floor(Math.random() * Math.max(1, sand.emitted)));

select(600);
